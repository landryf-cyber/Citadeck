/** Biais du contenu : somme moyenne par jauge et valeur nette des deux options de chaque carte. */
import { content } from '../data';
import { GAUGES, type Effect } from '../core/types';

const groups: Record<string, string[]> = {
  starters: content.starters,
  era0: content.eraPools[0], era1: content.eraPools[1], era2: content.eraPools[2], era3: content.eraPools[3], era4: content.eraPools[4],
  rewards: content.rewards,
  consequences: Object.values(content.cards).filter((c) => c.kind === 'consequence').map((c) => c.id),
  rival: [...content.rival.hostile, ...content.rival.neutral, ...content.rival.friendly],
  crises: Object.values(content.cards).filter((c) => c.kind === 'crisis').map((c) => c.id),
};

function avgDelta(e: Effect): Record<string, number> {
  const branches = e.when ? [e.then ?? {}, e.else ?? {}] : [e];
  const out: Record<string, number> = { food: 0, army: 0, knowledge: 0, treasure: 0 };
  for (const b of branches) for (const g of GAUGES) out[g] += (b.delta?.[g] ?? 0) / branches.length;
  return out;
}

const detail = process.argv.includes('--cards');
for (const [name, ids] of Object.entries(groups)) {
  const tot: Record<string, number> = { food: 0, army: 0, knowledge: 0, treasure: 0 };
  let net = 0;
  const rows: string[] = [];
  for (const id of ids) {
    const c = content.cards[id];
    const l = avgDelta(c.left.effect);
    const r = avgDelta(c.right.effect);
    for (const g of GAUGES) tot[g] += (l[g] + r[g]) / 2;
    const nl = GAUGES.reduce((a, g) => a + l[g], 0);
    const nr = GAUGES.reduce((a, g) => a + r[g], 0);
    net += (nl + nr) / 2;
    rows.push(`   ${id.padEnd(24)} net gauche ${nl.toFixed(0).padStart(4)}  droite ${nr.toFixed(0).padStart(4)}`);
  }
  const n = ids.length;
  console.log(`${name.padEnd(13)} n=${String(n).padStart(3)}  moyenne/option  N ${(tot.food / n).toFixed(1).padStart(5)}  A ${(tot.army / n).toFixed(1).padStart(5)}  S ${(tot.knowledge / n).toFixed(1).padStart(5)}  T ${(tot.treasure / n).toFixed(1).padStart(5)}   net ${(net / n).toFixed(1)}`);
  if (detail) console.log(rows.join('\n'));
}
