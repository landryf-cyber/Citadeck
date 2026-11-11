/** Balayage des enjeux par ère : npx tsx src/sim/stakes.ts '[[1.3,1.5,1.6,1.8,2.0],…]' */
import { content } from '../data';
import { TUNING } from '../core/types';
import { COMPETENT, prudentBot } from './bots';
import { deathShares, simulate } from './simulate';

const sets: number[][] = JSON.parse(process.argv[2]);
const cap = Number(process.argv[4] ?? 18);
const windMul = Number(process.argv[5] ?? 1);
TUNING.maxSwing = cap;
const baseWind = content.eras.map((e) => ({ ...e.wind }));
const games = Number(process.argv[3] ?? 300);
for (const st of sets) {
  content.eras.forEach((e, i) => {
    e.stakes = st[i];
    const w: Record<string, number> = {};
    for (const [k, v] of Object.entries(baseWind[i])) w[k] = Math.round((v as number) * windMul);
    e.wind = w;
  });
  const res = simulate(content, [prudentBot, ...COMPETENT], games);
  const pr = res.bots[0];
  const comp = res.bots.slice(1);
  const dz = comp.reduce((a, b) => a + b.dangerTurns, 0) / comp.reduce((a, b) => a + b.turns, 0);
  const sh = deathShares(res.bots);
  const lop = Object.values(res.cards).filter((c) => c.left + c.right >= 100 && Math.max(c.left, c.right) / (c.left + c.right) > 0.7).length;
  const turns = comp.reduce((a, b) => a + b.turns, 0) / comp.reduce((a, b) => a + b.games, 0);
  console.log(`${JSON.stringify(st)}  prudente V ${((100 * pr.reachedLastEra) / pr.games).toFixed(0)}% gagne ${((100 * pr.wins) / pr.games).toFixed(0)}% ères ${pr.eraReached.map((n) => ((100 * n) / pr.games).toFixed(0)).join('/')}  compétents ${comp.map((b) => ((100 * b.wins) / b.games).toFixed(0)).join('/')}  danger ${(dz * 100).toFixed(0)}%  morts N${(sh.food * 100).toFixed(0)} A${(sh.army * 100).toFixed(0)} S${(sh.knowledge * 100).toFixed(0)} T${(sh.treasure * 100).toFixed(0)}  déséq ${lop}  tours ${turns.toFixed(0)}`);
}
