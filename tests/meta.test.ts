import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { Engine } from '../src/core/engine';
import { epitaph, newMeta, nextSetup, recordRun, testaments, UNLOCKS, loadMeta, chronicleLines } from '../src/core/meta';
import { campaign, finalState } from '../src/sim/sim';
import { PROFILES } from '../src/sim/bots';

const reader = PROFILES.find((p) => p.name === 'lecteur')!;
const greedy = PROFILES.find((p) => p.name === 'gourmand')!;
const e = new Engine(content);

describe('méta-progression V2', () => {
  it('une partie terminée laisse une chronique de cinq lignes, une épitaphe et trois testaments', () => {
    for (const seed of [3, 17, 42]) {
      const s = finalState(content, greedy, seed);
      expect(s.phase).toBe('fin');
      const t = testaments(e, s);
      expect(t.length).toBe(3);
      for (const x of t) {
        expect(x.text).not.toMatch(/[{}]/);
        expect(x.legacy.label.length).toBeGreaterThan(5);
      }
      const ep = epitaph(e, s);
      expect(ep).not.toMatch(/[{}]/);
      const lines = chronicleLines(e, s, t[0].text);
      expect(lines.length).toBe(5);
      for (const l of lines) expect(l).not.toMatch(/[{}]|undefined|NaN/);
    }
  });

  it('la première partie débloque les Héritiers et la suivante hérite des ruines', () => {
    const s = finalState(content, reader, 5);
    const t = testaments(e, s);
    const r = recordRun(newMeta(), e, s, t[1]);
    expect(r.meta.runs).toBe(1);
    expect(r.meta.chronicle[0].name).toBe(s.name);
    expect(r.unlocked.map((u) => u.id)).toContain('heritiers');
    const setup = nextSetup(r.meta, { dessein: 'empire', origin: 'heritiers' });
    expect(setup.origin).toBe('heritiers');
    expect(setup.ruins?.[0].name).toBe(s.name);
    expect(setup.tutorial).toBe(false);
    const s2 = e.newGame(99, setup);
    expect(s2.ruins[0].testament).toBe(t[1].text);
    expect(s2.mem).toContain('heritage');
  });

  it("l'héritage s'applique au départ, et compte double pour les Héritiers", () => {
    const s = finalState(content, reader, 8);
    const t = testaments(e, s);
    const lesson = t[1];
    const meta = recordRun(newMeta(), e, s, lesson).meta;
    const plain = e.newGame(50, nextSetup(meta, { dessein: 'etoiles', origin: 'feu' }));
    const base = e.newGame(50, { dessein: 'etoiles', origin: 'feu' });
    const heirs = e.newGame(50, nextSetup(meta, { dessein: 'etoiles', origin: 'heritiers' }));
    const heirsBase = e.newGame(50, { dessein: 'etoiles', origin: 'heritiers' });
    for (const [res, n] of Object.entries(lesson.legacy.gain ?? {})) {
      const r = res as keyof typeof plain.res;
      expect(plain.res[r] - base.res[r]).toBe(n);
      expect(heirs.res[r] - heirsBase.res[r]).toBe(2 * (n as number));
    }
  });

  it("une origine verrouillée n'est pas accordée", () => {
    expect(nextSetup(newMeta(), { dessein: 'empire', origin: 'fleuve' }).origin).toBe('feu');
    expect(nextSetup(newMeta(), { dessein: 'empire', iron: true }).iron).toBe(false);
  });

  it('le contenu verrouillé reste absent, puis apparaît une fois débloqué', () => {
    const locked = Object.values(content.cards).filter((c) => c.lock).map((c) => c.id);
    expect(locked.length).toBeGreaterThanOrEqual(5);
    let seenUnlocked = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = finalState(content, reader, seed);
      for (const id of locked) expect(s.history.some((h) => h.card === id) || s.deck.includes(id)).toBe(false);
      const u = finalState(content, reader, seed, { unlocked: ['silos', 'archeologie', 'ambassade', 'droit'], ruins: [{ name: 'Vorie', dessein: 'empire', era: 2, jalons: 1, cause: 'la famine', epitaph: 'x' }] });
      if (['d_silos', 'd_archeologie', 'd_ambassade', 'd_droit'].some((id) => u.deck.includes(id) || u.history.some((h) => h.card === 'decouverte' && h.label.includes('Silos')))) seenUnlocked++;
    }
    expect(seenUnlocked).toBeGreaterThan(0);
  });

  it('une merveille alternative débloquée est proposée au chantier du Moyen Âge', () => {
    const s = e.newGame(7, { dessein: 'posterite', unlocked: ['alt_posterite'] });
    s.era = 2;
    s.phase = 'chantier';
    s.prompt = { card: 'jalon' };
    const v = e.view(s)!;
    expect(v.options.map((o) => o.label)).toEqual(['Bâtir La Cathédrale', 'Bâtir La Bibliothèque', 'Pas cette fois']);
    s.res = { vivres: 40, armee: 40, savoir: 40, tresor: 40 };
    s.deck.push('d_ecriture');
    // forcer les exigences : quatre familles dévouées comptent pour la Culture
    for (const f of ['ourk', 'sel', 'brume', 'troc'] as const) s.fam[f].loy = 2;
    expect(e.view(s)!.options[1].enabled).toBe(true);
    e.act(s, 1);
    expect(s.jalons[2]).toBe(true);
    expect(e.jalonOf(s, 2).name).toBe('La Bibliothèque');
    expect(e.passives(s).some((p) => p.type === 'tagBonus' && p.tag === 'Culture')).toBe(true);
  });

  it("l'Âge de fer durcit les crises", () => {
    const a = e.newGame(1, { dessein: 'empire' });
    const b = e.newGame(1, { dessein: 'empire', iron: true });
    expect(e.crisisK(b)).toBeGreaterThan(e.crisisK(a));
  });

  it('une campagne relie les parties : ruines fouillées, revenants, déblocages progressifs', () => {
    const seeds = Array.from({ length: 12 }, (_, i) => 100 + i);
    const { meta, states, unlocks } = campaign(content, reader, seeds);
    expect(meta.runs).toBe(12);
    expect(meta.chronicle.length).toBe(12);
    expect(unlocks[0]).toContain('heritiers');
    // à partir de la deuxième partie, des ruines sont là
    for (const s of states.slice(1)) expect(s.ruins.length).toBeGreaterThan(0);
    const ruinsSeen = states.slice(1).filter((s) => s.history.some((h) => h.card === 'ruines')).length;
    expect(ruinsSeen).toBeGreaterThan(3);
    expect(meta.unlocked.length).toBeGreaterThanOrEqual(3);
    // la méta se relit
    expect(loadMeta(JSON.parse(JSON.stringify(meta))).chronicle.length).toBe(12);
    expect(loadMeta({ version: 0 }).runs).toBe(0);
    expect(UNLOCKS.every((u) => u.how.length > 5 && u.text.length > 5)).toBe(true);
  });
});

describe('rejouer une partie', () => {
  it('le rejeu depuis la graine retrouve exactement la fin (chronologie de la cité)', async () => {
    const { replaySnapshots } = await import('../src/ui/snapshot');
    const s = finalState(content, reader, 31, { ruins: [{ name: 'Vorie', dessein: 'empire', era: 2, jalons: 1, cause: 'la famine', epitaph: 'x', legacy: { label: 'x', gain: { vivres: 3 } } }], unlocked: ['silos'] });
    const snaps = replaySnapshots(e, s);
    const last = snaps[snaps.length - 1];
    expect(last.quartiers).toBe(s.quartiers);
    expect(last.era).toBe(s.era);
    expect(last.jalons.length).toBe(s.jalons.filter(Boolean).length);
    expect(snaps.length).toBeGreaterThan(8);
  });
});

describe('écrans à partager', () => {
  it('épitaphes, chroniques, testaments et causes ne gardent aucun gabarit, sur de nombreuses parties', () => {
    const profiles = ['lecteur', 'gourmand', 'prudent', 'aléatoire'].map((n) => PROFILES.find((p) => p.name === n)!);
    for (let seed = 1; seed <= 60; seed++) {
      const s = finalState(content, profiles[seed % 4], seed * 13);
      const texts = [epitaph(e, s), ...chronicleLines(e, s, 'Mot.'), ...testaments(e, s).flatMap((t) => [t.text, t.legacy.label]), ...s.losses.map((l) => l.cause)];
      for (const t of texts) expect(t, `graine ${seed}`).not.toMatch(/[{}]|undefined|NaN| des les | de les | à les /);
    }
  });
});
