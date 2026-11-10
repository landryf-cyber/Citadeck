/** Quelles cartes tuent, et par quelle jauge. */
import { content } from '../data';
import { Engine } from '../core/engine';
import { COMPETENT, prudentBot } from './bots';
import { playGame } from './simulate';

const engine = new Engine(content);
const n = Number(process.argv[2] ?? 300);
const kills: Record<string, number> = {};
const byGauge: Record<string, number> = {};
const byEraPhase: Record<string, number> = {};
let total = 0;
for (const bot of [prudentBot, ...COMPETENT]) {
  for (let i = 0; i < n; i++) {
    const s = playGame(engine, bot, 1 + i * 7919);
    const r = s.result!;
    if (r.type !== 'defeat') continue;
    total++;
    const last = s.history[s.history.length - 1];
    const k = `${r.card} ${last.side} → ${r.gauge} ${r.bound}`;
    kills[k] = (kills[k] ?? 0) + 1;
    byGauge[`${r.gauge} ${r.bound}`] = (byGauge[`${r.gauge} ${r.bound}`] ?? 0) + 1;
    const ph = `ère ${s.era + 1} ${content.cards[r.card!].kind === 'crisis' ? 'crise' : 'cartes'}`;
    byEraPhase[ph] = (byEraPhase[ph] ?? 0) + 1;
  }
}
console.log('défaites', total);
console.log(Object.entries(byGauge).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(' | '));
console.log(Object.entries(byEraPhase).sort().map(([k, v]) => `${k}: ${v}`).join(' | '));
for (const [k, v] of Object.entries(kills).sort((a, b) => b[1] - a[1]).slice(0, Number(process.argv[3] ?? 40))) console.log(String(v).padStart(4), k);
