/** Les cibles d'équilibrage du brief, vérifiables automatiquement. */
import { GAUGES } from '../core/types';
import { deathShares, type SimResult } from './simulate';

export interface Check {
  label: string;
  pass: boolean;
  detail: string;
}

export function checkTargets(res: SimResult, trivial: string[], prudent: string, competent: string[]): Check[] {
  const by = (n: string) => res.bots.find((b) => b.name === n)!;
  const out: Check[] = [];
  const p1 = (x: number) => (x * 100).toFixed(1) + ' %';

  // 1. aucune stratégie triviale ne gagne
  const triv = trivial.map((n) => by(n));
  const worst = Math.max(...triv.map((b) => b.wins / b.games));
  out.push({ label: 'Aucune stratégie triviale ne gagne', pass: worst <= 0.005, detail: triv.map((b) => `${b.name} ${p1(b.wins / b.games)}`).join(', ') });

  // 2. la prudente atteint la dernière ère dans 20 à 40 % des cas
  const pr = by(prudent);
  const reach = pr.reachedLastEra / pr.games;
  out.push({ label: 'La stratégie prudente atteint la dernière ère dans 20 à 40 % des cas', pass: reach >= 0.2 && reach <= 0.4, detail: p1(reach) });

  // 3. aucune option choisie plus de 70 % du temps par les bots compétents
  const lop: string[] = [];
  let seen = 0;
  for (const [id, c] of Object.entries(res.cards)) {
    const n = c.left + c.right;
    if (n < 150) continue;
    seen++;
    const m = Math.max(c.left, c.right) / n;
    if (m > 0.7) lop.push(`${id} ${(m * 100).toFixed(0)} %`);
  }
  out.push({ label: 'Aucune option choisie plus de 70 % du temps par un bot compétent', pass: lop.length === 0, detail: lop.length ? `${lop.length}/${seen} cartes : ${lop.slice(0, 12).join(', ')}${lop.length > 12 ? '…' : ''}` : `${seen} cartes vérifiées` });

  // 4. défaites réparties entre les 4 jauges
  const pool = res.bots.filter((b) => b.name === prudent || competent.includes(b.name));
  const shares = deathShares(pool);
  const min = Math.min(...GAUGES.map((g) => shares[g]));
  const max = Math.max(...GAUGES.map((g) => shares[g]));
  out.push({ label: 'Défaites réparties entre les 4 jauges (chacune entre 15 et 40 %)', pass: min >= 0.15 && max <= 0.4, detail: GAUGES.map((g) => `${g} ${p1(shares[g])}`).join(', ') });

  // 5. au moins une jauge en danger pendant plus de la moitié des tours
  const comp = competent.map((n) => by(n));
  const dz = comp.reduce((a, b) => a + b.dangerTurns, 0) / comp.reduce((a, b) => a + b.turns, 0);
  out.push({ label: 'Une jauge en zone de danger pendant plus de la moitié des tours (bots compétents)', pass: dz > 0.5, detail: p1(dz) });

  // 6. au moins 3 archétypes capables de gagner
  const arch = comp.filter((b) => b.name.startsWith('archétype'));
  const winners = arch.filter((b) => b.wins / b.games >= 0.04);
  out.push({ label: 'Au moins 3 archétypes de deck capables de gagner (≥ 4 % de victoires)', pass: winners.length >= 3, detail: arch.map((b) => `${b.name.replace('archétype ', '')} ${p1(b.wins / b.games)}`).join(', ') });

  // 7. aucune carte toujours ou jamais prise par les bots gagnants
  const bad: string[] = [];
  let rseen = 0;
  for (const [id, r] of Object.entries(res.rewards)) {
    if (r.offeredInWins < 30) continue;
    rseen++;
    const rate = r.pickedInWins / r.offeredInWins;
    if (rate <= 0.03 || rate >= 0.97) bad.push(`${id} ${(rate * 100).toFixed(0)} %`);
  }
  out.push({ label: 'Aucune carte toujours ou jamais prise par les bots gagnants', pass: bad.length === 0 && rseen > 0, detail: bad.length ? bad.join(', ') : `${rseen} cartes vérifiées` });

  // durée : une partie gagnée dure assez pour 20-25 minutes
  const winTurns = comp.reduce((a, b) => a + b.turns, 0) / comp.reduce((a, b) => a + b.games, 0);
  out.push({ label: 'Information : tours moyens par partie (bots compétents)', pass: true, detail: winTurns.toFixed(0) });
  return out;
}
