/** Liste les cartes dont une option domine, avec leurs effets, pour les réécrire. */
import { content } from '../data';
import { COMPETENT } from './bots';
import { simulate } from './simulate';

const res = simulate(content, COMPETENT, Number(process.argv[2] ?? 400));
const rows = Object.entries(res.cards)
  .map(([id, c]) => ({ id, n: c.left + c.right, l: c.left / Math.max(1, c.left + c.right), kills: c.kills }))
  .filter((r) => r.n >= 80)
  .sort((a, b) => Math.abs(b.l - 0.5) - Math.abs(a.l - 0.5));
const thr = Number(process.argv[3] ?? 0.7);
let count = 0;
for (const r of rows) {
  if (Math.max(r.l, 1 - r.l) <= thr) continue;
  count++;
  const c = content.cards[r.id];
  const fmt = (e: unknown) => JSON.stringify(e).replace(/"/g, '').replace(/delta:/g, '').replace(/keyword:/g, '').replace(/food/g, 'N').replace(/army/g, 'A').replace(/knowledge/g, 'S').replace(/treasure/g, 'T');
  console.log(`${r.id}  n=${r.n}  G ${(r.l * 100).toFixed(0)}% / D ${((1 - r.l) * 100).toFixed(0)}%  fatale ${r.kills}`);
  console.log(`   G « ${c.left.text} » ${fmt(c.left.effect)}`);
  console.log(`   D « ${c.right.text} » ${fmt(c.right.effect)}`);
}
console.log(`\n${count} cartes au-dessus de ${thr * 100} % sur ${rows.length}`);
