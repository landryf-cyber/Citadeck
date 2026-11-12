import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { Engine } from '../src/core/engine';
import { PROFILES, chooseIndex } from '../src/sim/bots';
import { Rng } from '../src/core/rng';

const e = new Engine(content);

describe('moteur V2', () => {
  it('aucune partie ne se bloque : il y a toujours une option jouable, et toutes finissent', () => {
    for (const p of PROFILES) {
      for (let seed = 1; seed <= 25; seed++) {
        const rng = new Rng(seed * 7919);
        const s = e.newGame(seed, { dessein: content.desseins[seed % 3].id });
        let g = 0;
        while (s.phase !== 'fin' && g++ < 400) {
          const v = e.view(s)!;
          expect(v.options.some((o) => o.enabled), `${p.name} ${seed} ${s.prompt?.card}`).toBe(true);
          e.act(s, chooseIndex(e, s, p, rng));
        }
        expect(s.phase, `${p.name} graine ${seed}`).toBe('fin');
      }
    }
  }, 60000);

  it('déterministe : mêmes graine et choix, même partie ; la sauvegarde JSON reprend à l’identique', () => {
    const p = PROFILES[0];
    const run = (cut: number) => {
      const rng = new Rng(4242);
      let s = e.newGame(77, { dessein: 'posterite' });
      let g = 0;
      while (s.phase !== 'fin' && g++ < 400) {
        if (g === cut) s = JSON.parse(JSON.stringify(s));
        e.act(s, chooseIndex(e, s, p, rng));
      }
      return s;
    };
    const a = run(-1);
    const b = run(30);
    expect(b.history.map((h) => h.card + h.choice)).toEqual(a.history.map((h) => h.card + h.choice));
    expect(b.result).toEqual(a.result);
  });

  it('les textes affichés ne contiennent aucun gabarit non résolu', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rng = new Rng(seed);
      const s = e.newGame(seed, { dessein: content.desseins[seed % 3].id, ruins: seed % 2 ? [{ name: 'Vorie', dessein: 'empire', era: 2, jalons: 1, cause: 'la famine', epitaph: 'x', testament: 'Mangez.', grudge: { family: 'ourk', house: 'les Ourquin', quote: 'Seul ? Ridicule.', date: 'an 1 200' } }] : [] });
      let g = 0;
      while (s.phase !== 'fin' && g++ < 400) {
        const v = e.view(s)!;
        const all = [v.title, v.text, v.header ?? '', v.speaker ?? '', ...v.options.flatMap((o) => [o.label, o.warn ?? '', o.detail ?? '', o.req ?? ''])].join(' ');
        expect(all, s.prompt?.card).not.toMatch(/[{}]|undefined|NaN/);
        const ev = e.act(s, chooseIndex(e, s, PROFILES[seed % PROFILES.length], rng));
        for (const x of ev) if (x.type === 'reply') expect(x.text, s.history[s.history.length - 1]?.card).not.toMatch(/[{}]|undefined/);
      }
    }
  }, 60000);
});

describe('corrections après relecture', () => {
  it('une découverte jouée comme dilemme propose ses propres options', () => {
    const s = e.newGame(5, { dessein: 'etoiles' });
    s.deck.push('d_ecriture');
    s.phase = 'saison';
    s.prompt = { card: 'd_ecriture' };
    const v = e.view(s)!;
    expect(v.options.map((o) => o.label)).toEqual(['Tout noter', 'Noter les dettes']);
  });

  it('un procès ne cite jamais un rouage ni deux fois la même décision', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = new Rng(seed);
      const s = e.newGame(seed, { dessein: content.desseins[seed % 3].id });
      const quoted: number[] = [];
      let g = 0;
      while (s.phase !== 'fin' && g++ < 400) {
        if (s.prompt?.card === 'proces') {
          const q = s.prompt.quote!;
          expect(q).toBeGreaterThanOrEqual(0);
          const k = content.cards[s.history[q].card].kind;
          expect(['proces', 'hommage', 'carrefour', 'croissance', 'jalon', 'presage']).not.toContain(k);
          expect(quoted).not.toContain(q);
          const ev = e.act(s, chooseIndex(e, s, PROFILES[seed % PROFILES.length], rng));
          if (s.mem.includes(`juge_${q}`)) quoted.push(q);
          void ev;
          continue;
        }
        e.act(s, chooseIndex(e, s, PROFILES[seed % PROFILES.length], rng));
      }
    }
  });

  it('une perte de ressources certaine est affichée, jamais « gratuite »', () => {
    for (const c of Object.values(content.cards)) {
      for (const o of c.options) {
        if (!o.effect.gain || !Object.values(o.effect.gain).some((n) => (n ?? 0) < 0)) continue;
        const s = e.newGame(3, { dessein: 'empire' });
        s.phase = 'saison';
        s.prompt = { card: c.id };
        if (c.qui) continue;
        const v = e.view(s)!;
        const ov = v.options.find((x) => x.label === o.label.replace(/\{[^}]+\}/g, (m) => m));
        if (ov && !o.label.includes('{')) expect(ov.loss, `${c.id} · ${o.label}`).toBeTruthy();
      }
    }
  });
});

describe('honnêteté des indicateurs', () => {
  it('toute famille touchée par une option est annoncée par une pastille', () => {
    const bad: string[] = [];
    for (const c of Object.values(content.cards)) {
      if (!c.options.length || ['presage', 'carrefour', 'jalon', 'croissance', 'proces'].includes(c.kind) || c.qui) continue;
      for (const loy of [0, 1, -1]) {
        const s = e.newGame(11, { dessein: 'empire' });
        s.era = c.eras?.[0] ?? 1;
        for (const f of ['ourk', 'sel', 'brume', 'troc'] as const) s.fam[f].loy = loy;
        s.res = { vivres: 60, armee: 60, savoir: 60, tresor: 60 };
        s.phase = 'saison';
        s.prompt = { card: c.id };
        const v = e.view(s)!;
        e.options(s, s.prompt).forEach((o, i) => {
          const cl = JSON.parse(JSON.stringify(s));
          const ev: import('../src/core/engine').Ev[] = [];
          e.applyEffect(cl, e.card(c.id), o.effect, new Rng(i + 1), ev);
          for (const x of ev) if (x.type === 'loy' && !v.options[i].families.includes(x.family)) bad.push(`${c.id} · ${o.label} : ${x.family}`);
        });
      }
    }
    expect([...new Set(bad)]).toEqual([]);
  });
});

describe('pas de redite', () => {
  it('un événement, une rencontre, une lettre ou une découverte ne se joue qu’une fois par partie', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = new Rng(seed * 31);
      const s = e.newGame(seed, { dessein: content.desseins[seed % 3].id });
      let g = 0;
      while (s.phase !== 'fin' && g++ < 400) e.act(s, chooseIndex(e, s, PROFILES[seed % PROFILES.length], rng));
      const ids = s.history.map((h) => h.card).filter((id) => id !== 'decouverte' && ['evenement', 'rencontre', 'rivale', 'decouverte'].includes(content.cards[id].kind));
      expect(ids.length, `graine ${seed}`).toBe(new Set(ids).size);
    }
  });

  it('une merveille manquée se rattrape à la seconde saison d’une ère suivante, plus cher, et compte pour le dessein', () => {
    const s = e.newGame(11, { dessein: 'empire' });
    s.era = 2;
    s.jalons = [false, true, false, false, false];
    s.res = { vivres: 99, armee: 99, savoir: 99, tresor: 99 };
    expect(e.missedJalon(s)).toBe(0);
    s.phase = 'saison';
    s.prompt = { card: 'rattrapage', missed: e.missedJalon(s) };
    const v = e.view(s)!;
    expect(v.title).toBe('Le Chantier oublié');
    const base = content.desseins.find((d) => d.id === 'empire')!.jalons[0].cost;
    const k = Object.keys(base)[0] as keyof typeof base;
    expect(v.options[0].cost[k]!).toBeGreaterThan(base[k]!);
    e.act(s, 0);
    expect(s.jalons[0]).toBe(true);
    expect(s.jalons[2]).toBe(false);
  });

  it('après son triomphe, la rivale réclame un tribut à chaque fin d’ère', () => {
    const s = e.newGame(12, { dessein: 'etoiles' });
    s.era = 2;
    s.rivalJalons = 5;
    s.spent.push('triomphe');
    s.phase = 'crise';
    s.pile = [];
    s.prompt = { card: 'croissance' };
    s.res = { vivres: 99, armee: 0, savoir: 0, tresor: 0 };
    e.act(s, 1);
    const seen: string[] = [];
    for (let g = 0; g < 6 && (s.phase as string) === 'finere'; g++) {
      seen.push(s.prompt!.card);
      e.act(s, e.view(s)!.options.findIndex((o) => o.enabled));
    }
    expect(seen).toContain('tribut');
  });

  it('une famille qui trahit encore ne refait pas le même coup', () => {
    const s = e.newGame(13, { dessein: 'posterite' });
    s.fam.troc.loy = -3;
    s.history.push({ turn: 1, era: 0, date: '', card: 'trahison_troc', choice: 0, label: 'x', title: 'x' } as never);
    s.phase = 'chantier';
    s.prompt = { card: 'jalon' };
    e.act(s, e.view(s)!.options.length - 1);
    expect(s.pile).toContain('trahison_troc_2');
  });

  it('la palissade pare une perte subie, pas un sacrifice choisi', () => {
    const s = e.newGame(14, { dessein: 'empire' });
    s.jalons = [true, false, false, false, false];
    const q = s.quartiers;
    const ev: never[] = [];
    const card = content.cards.creance;
    e.applyEffect(s, card, { quartiers: -1, cause: 'test' }, new Rng(1), ev);
    expect(s.quartiers).toBe(q - 1);
    e.applyEffect(s, card, { if: { quartiers: { min: 99 } }, else: { quartiers: -1, cause: 'test' } }, new Rng(1), ev);
    expect(s.quartiers).toBe(q - 1);
  });

  it('une merveille ne rachète un quartier que contre des réserves : à sec, elle ne protège rien', () => {
    const s = e.newGame(15, { dessein: 'empire' });
    s.jalons = [true, false, false, false, false];
    const card = content.cards.creance;
    const q = s.quartiers;
    s.res.armee = 0;
    e.applyEffect(s, card, { if: { quartiers: { min: 99 } }, else: { quartiers: -1, cause: 'test' } }, new Rng(1), []);
    expect(s.quartiers).toBe(q - 1);
    s.res.armee = 20;
    s.shieldUsed = false;
    e.applyEffect(s, card, { if: { quartiers: { min: 99 } }, else: { quartiers: -1, cause: 'test' } }, new Rng(1), []);
    expect(s.quartiers).toBe(q - 1);
    expect(s.res.armee).toBeLessThan(20);
  });

  it('le crédit annonce un prix exact, et la créance coûte ce prix', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const rng = new Rng(seed);
      const s = e.newGame(seed, { dessein: content.desseins[seed % 3].id });
      let g = 0;
      while (s.phase !== 'fin' && g++ < 400) {
        const v = e.view(s)!;
        const k = v.options.findIndex((o) => o.enabled && o.label.includes('(à crédit)'));
        if (k >= 0) {
          const price = Number(/la note : (\d+) Trésor/.exec(v.options[k].detail ?? '')?.[1]);
          expect(price).toBeGreaterThan(0);
          e.act(s, k);
          for (let h = 0; h < 6 && (s.phase as string) !== 'fin'; h++) {
            const w = e.view(s)!;
            if (/^creance/.test(w.card.id)) {
              expect(w.options[0].cost.tresor).toBe(price);
              return;
            }
            e.act(s, chooseIndex(e, s, PROFILES[0], rng));
          }
          return;
        }
        e.act(s, chooseIndex(e, s, PROFILES[0], rng));
      }
    }
  });

  it('une option à seuil ne se dit jamais gratuite si elle consomme des réserves', () => {
    const s = e.newGame(16, { dessein: 'posterite' });
    s.phase = 'crise';
    s.prompt = { card: 'x0_horde' };
    const v = e.view(s)!;
    const hold = v.options.find((o) => o.label === 'Tenir les murs')!;
    expect(hold.spend?.armee).toBeGreaterThan(0);
  });
});
