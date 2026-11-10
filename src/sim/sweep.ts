/** Balayage de paramètres d'enjeux : npx tsx src/sim/sweep.ts */
import { content } from '../data';
import { TUNING } from '../core/types';
import { COMPETENT, prudentBot, randomBot } from './bots';
import { simulate } from './simulate';

const configs: { name: string; stakes: number[]; crisis: number[]; dz?: number }[] = JSON.parse(process.argv[2] ?? '[]');
for (const cfg of configs) {
  TUNING.dangerLow = cfg.dz ?? 25;
  TUNING.dangerHigh = 100 - (cfg.dz ?? 25);
  content.eras.forEach((e, i) => {
    e.stakes = cfg.stakes[i];
    e.crisisStakes = cfg.crisis[i];
  });
  const res = simulate(content, [randomBot, prudentBot, ...COMPETENT], 300);
  const pr = res.bots[1];
  const comp = res.bots.slice(2);
  const dz = comp.reduce((a, b) => a + b.dangerTurns, 0) / comp.reduce((a, b) => a + b.turns, 0);
  const wins = comp.map((b) => ((100 * b.wins) / b.games).toFixed(0)).join('/');
  const lop = Object.values(res.cards).filter((c) => c.left + c.right >= 100 && Math.max(c.left, c.right) / (c.left + c.right) > 0.7).length;
  console.log(`${cfg.name.padEnd(14)} prudente ère V ${((100 * pr.reachedLastEra) / pr.games).toFixed(0)} % (gagne ${((100 * pr.wins) / pr.games).toFixed(0)} %)  danger ${(dz * 100).toFixed(0)} %  compétents ${wins}  déséquilibrées ${lop}  ères prudente ${pr.eraReached.join('/')}`);
}
