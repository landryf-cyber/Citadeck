/** Niveau moyen des jauges au fil des ères, pour repérer les biais systémiques. */
import { content } from '../data';
import { Engine } from '../core/engine';
import { GAUGES } from '../core/types';
import { COMPETENT, prudentBot } from './bots';
import { playGame } from './simulate';

const engine = new Engine(content);
const n = Number(process.argv[2] ?? 200);
for (const bot of [prudentBot, COMPETENT[0]]) {
  const sum = Array.from({ length: 5 }, () => ({ food: 0, army: 0, knowledge: 0, treasure: 0, n: 0, lo: [0, 0, 0, 0], hi: [0, 0, 0, 0] }));
  for (let i = 0; i < n; i++) {
    const s = playGame(engine, bot, 1 + i * 7919);
    for (const h of s.history) {
      const e = sum[h.era];
      e.n++;
      GAUGES.forEach((g, gi) => {
        e[g] += h.gauges[g];
        if (h.gauges[g] <= 30) e.lo[gi]++;
        if (h.gauges[g] >= 70) e.hi[gi]++;
      });
    }
  }
  console.log(bot.name);
  sum.forEach((e, i) => console.log(`  ère ${i + 1}  moy N ${(e.food / e.n).toFixed(0)} A ${(e.army / e.n).toFixed(0)} S ${(e.knowledge / e.n).toFixed(0)} T ${(e.treasure / e.n).toFixed(0)}   bas% ${e.lo.map((x) => ((100 * x) / e.n).toFixed(0)).join('/')}  haut% ${e.hi.map((x) => ((100 * x) / e.n).toFixed(0)).join('/')}`));
}
