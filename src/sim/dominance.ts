/**
 * Options dominées : pour chaque carte, une option est-elle au moins aussi bonne qu'une autre dans TOUS
 * les états de jeu rencontrés (quartiers, réserves, chaque famille, rivale, merveilles), et meilleure dans au moins un ?
 *   npx tsx src/sim/dominance.ts [parties]
 * Les options qui laissent une trace pour plus tard (souvenir, suite, découverte, merveille) ne sont comparées qu'à
 * des options qui laissent la même trace : leur valeur future n'est pas mesurable ici.
 */
import { content } from '../data';
import { Engine } from '../core/engine';
import { Rng } from '../core/rng';
import { FAMILIES, RES, type GameState } from '../core/types';
import { PROFILES, chooseIndex } from './bots';

const SKIP = new Set(['carrefour', 'presage', 'jalon', 'croissance', 'decouverte', 'proces']);

export interface Dominated { card: string; better: string; worse: string; states: number }

function outcome(e: Engine, s: GameState, i: number, samples: number): number[] | null {
  const acc: number[] = [];
  for (let k = 0; k < samples; k++) {
    const c: GameState = JSON.parse(JSON.stringify(s));
    c.rng = new Rng(9001 + k * 7919).getState();
    e.act(c, i);
    const v = [c.result?.type === 'defaite' ? -100 : c.quartiers, ...RES.map((r) => c.res[r]), ...FAMILIES.map((f) => (c.fam[f].state === 'presente' ? c.fam[f].loy : -5)), c.rivalRel, -c.rivalJalons, c.jalons.filter(Boolean).length];
    v.forEach((x, j) => (acc[j] = (acc[j] ?? 0) + x / samples));
  }
  return acc;
}

/** Ce qu'une option laisse pour plus tard : deux options ne se comparent que si cette trace est la même. */
function trace(o: { effect: import('../core/types').Effect }): string {
  const t: string[] = [];
  const walk = (e?: import('../core/types').Effect) => {
    if (!e) return;
    t.push(...(e.mem ?? []).map((m) => `m:${m}`), ...(e.sched ?? []).map((x) => `s:${x.card}`), ...(e.addCard ?? []).map((x) => `c:${x}`));
    if (e.jalon) t.push('jalon');
    walk(e.then);
    walk(e.else);
    if (e.bet) { walk(e.bet.win); walk(e.bet.lose); }
  };
  walk(o.effect);
  return t.sort().join('|');
}

export function findDominated(games = 60): Dominated[] {
  const e = new Engine(content);
  // pour chaque carte : par paire d'options, [états où a ≥ b partout, états où a > b quelque part, états comparés]
  const stats = new Map<string, { ge: number; gt: number; n: number }>();
  const labels = new Map<string, string>();
  for (const p of [PROFILES.find((x) => x.name === 'lecteur')!, PROFILES.find((x) => x.name === 'distrait')!, PROFILES.find((x) => x.name === 'prudent')!]) {
    for (let g = 0; g < games; g++) {
      const rng = new Rng(g * 104729 + p.name.length);
      const s = e.newGame(7000 + g, { dessein: content.desseins[g % 3].id });
      let guard = 0;
      while (s.phase !== 'fin' && guard++ < 400) {
        const v = e.view(s)!;
        const card = v.card;
        if (!SKIP.has(card.kind) && v.options.length > 1) {
          const opts = e.options(s);
          const en = v.options.map((o, i) => (o.enabled ? i : -1)).filter((i) => i >= 0);
          const out = new Map<number, number[]>();
          const samples = opts.some((o) => o.effect.bet) ? 6 : 1;
          for (const i of en) out.set(i, outcome(e, s, i, samples)!);
          for (const a of en) for (const b of en) {
            if (a === b || trace(opts[a]) !== trace(opts[b])) continue;
            const va = out.get(a)!;
            const vb = out.get(b)!;
            const key = `${card.id}\u0000${opts[a].label}\u0000${opts[b].label}`;
            labels.set(key, card.id);
            const st = stats.get(key) ?? { ge: 0, gt: 0, n: 0 };
            st.n++;
            if (va.every((x, j) => x >= vb[j] - 1e-9)) {
              st.ge++;
              if (va.some((x, j) => x > vb[j] + 1e-9)) st.gt++;
            }
            stats.set(key, st);
          }
        }
        e.act(s, chooseIndex(e, s, p, rng));
      }
    }
  }
  const out: Dominated[] = [];
  for (const [key, st] of stats) {
    if (st.n >= 1 && st.ge === st.n && st.gt > 0) {
      const [card, better, worse] = key.split('\u0000');
      out.push({ card, better, worse, states: st.n });
    }
  }
  return out.sort((x, y) => y.states - x.states);
}

if (process.argv[1]?.endsWith('dominance.ts')) {
  const n = Number(process.argv[2] ?? 60);
  const d = findDominated(n);
  for (const x of d) console.log(`${x.card.padEnd(22)} « ${x.worse} » est dominée par « ${x.better} » (${x.states} état${x.states > 1 ? 's' : ''})`);
  console.log(`${d.length} option${d.length > 1 ? 's' : ''} dominée${d.length > 1 ? 's' : ''}`);
}
