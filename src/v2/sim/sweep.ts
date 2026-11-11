/** Balayage des réglages : npx tsx src/v2/sim/sweep.ts '[{"crisisK":1.3,"armyDecay":0.3,"treasureDecay":0.2,"growthBase":3}]' [parties] */
import { content } from '../data';
import { TUNING } from '../core/engine';
import { PROFILES } from './bots';
import { playRun } from './sim';

const cfgs: Partial<typeof TUNING>[] = JSON.parse(process.argv[2]);
const N = Number(process.argv[3] ?? 80);
const pick = ['lecteur', 'prudent', 'gourmand', 'étoiles', 'empire', 'postérité'];
for (const cfg of cfgs) {
  Object.assign(TUNING, cfg);
  const out: string[] = [];
  for (const n of pick) {
    const p = PROFILES.find((x) => x.name === n)!;
    const rs = Array.from({ length: N }, (_, i) => playRun(content, p, 1 + i * 7919));
    const w = rs.filter((r) => r.win).length / N;
    const g = rs.filter((r) => r.win && r.jalons >= 4).length / N;
    out.push(`${n.slice(0, 9)} ${(100 * w).toFixed(0)}/${(100 * g).toFixed(0)}`);
  }
  console.log(JSON.stringify(cfg), '·', out.join(' · '));
}
