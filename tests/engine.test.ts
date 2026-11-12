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
