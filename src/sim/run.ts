/**
 * Simulation d'équilibrage.
 *   npm run sim                 → 2000 parties par bot
 *   npm run sim -- --games 500  → plus rapide
 *   npm run sim -- --cards      → détail par carte
 */
import { content } from '../data';
import { GAUGES, GAUGE_LABEL } from '../core/types';
import { ALL_BOTS, COMPETENT, TRIVIAL, prudentBot } from './bots';
import { deathShares, simulate } from './simulate';
import { checkTargets } from './targets';

const args = process.argv.slice(2);
const gi = args.indexOf('--games');
const games = gi >= 0 ? Number(args[gi + 1]) : 2000;
const showCards = args.includes('--cards');

const t0 = Date.now();
const res = simulate(content, ALL_BOTS, games);
const pct = (n: number, d: number) => (d ? ((100 * n) / d).toFixed(1).padStart(5) + ' %' : '    —');

console.log(`\n=== Citadeck — simulation (${games} parties par bot, ${((Date.now() - t0) / 1000).toFixed(1)} s) ===\n`);
console.log('bot'.padEnd(22) + 'victoire  ère V    tours   danger   ères atteintes (I..V)');
for (const b of res.bots) {
  console.log(
    b.name.padEnd(22) + pct(b.wins, b.games) + '  ' + pct(b.reachedLastEra, b.games) + '  ' + (b.turns / b.games).toFixed(0).padStart(5) + '  ' + pct(b.dangerTurns, b.turns) + '   ' + b.eraReached.map((n) => pct(n, b.games).trim()).join(' · '),
  );
}

console.log('\n--- défaites par jauge (prudente + compétentes) ---');
const pool = res.bots.filter((b) => b.name === prudentBot.name || COMPETENT.some((c) => c.name === b.name));
const shares = deathShares(pool);
for (const g of GAUGES) {
  const low = pool.reduce((a, b) => a + b.deaths[g].low, 0);
  const high = pool.reduce((a, b) => a + b.deaths[g].high, 0);
  console.log(`${GAUGE_LABEL[g].padEnd(12)} ${(shares[g] * 100).toFixed(1).padStart(5)} %   (à zéro : ${low}, au comble : ${high})`);
}

console.log('\n--- fins et archétypes gagnants (bots compétents) ---');
for (const b of res.bots.filter((x) => COMPETENT.some((c) => c.name === x.name))) {
  console.log(`${b.name.padEnd(22)} fins ${JSON.stringify(b.endings)}  dominante ${JSON.stringify(b.winDominant)}`);
}

if (showCards) {
  console.log('\n--- options (bots compétents) ---');
  const rows = Object.entries(res.cards)
    .map(([id, c]) => ({ id, n: c.left + c.right, l: c.left / Math.max(1, c.left + c.right), kills: c.kills }))
    .sort((a, b) => Math.abs(b.l - 0.5) - Math.abs(a.l - 0.5));
  for (const r of rows) console.log(`${r.id.padEnd(24)} n=${String(r.n).padStart(6)}  gauche ${(r.l * 100).toFixed(0).padStart(3)} %  droite ${((1 - r.l) * 100).toFixed(0).padStart(3)} %  fatale ${r.kills}`);
  console.log('\n--- récompenses (prises quand proposées, parties gagnées) ---');
  const rr = Object.entries(res.rewards)
    .map(([id, r]) => ({ id, ...r, rate: r.pickedInWins / Math.max(1, r.offeredInWins) }))
    .sort((a, b) => b.rate - a.rate);
  for (const r of rr) console.log(`${r.id.padEnd(22)} proposée ${String(r.offeredInWins).padStart(5)}  prise ${(r.rate * 100).toFixed(0).padStart(3)} %   (toutes parties : ${((100 * r.picked) / Math.max(1, r.offered)).toFixed(0)} %)`);
}

console.log('\n--- cibles ---');
const checks = checkTargets(res, TRIVIAL.map((b) => b.name), prudentBot.name, COMPETENT.map((b) => b.name));
let ok = true;
for (const c of checks) {
  console.log(`${c.pass ? '✓' : '✗'} ${c.label} — ${c.detail}`);
  if (!c.pass) ok = false;
}
console.log(ok ? '\nToutes les cibles sont atteintes.' : '\nCibles non atteintes.');
process.exitCode = ok ? 0 : 1;
