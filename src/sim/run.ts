/**
 * Mesures V2 :  npx tsx src/sim/run.ts [parties]   ·   transcription :  npx tsx src/sim/run.ts --transcript <profil> <graine>
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { content } from '../data';
import { PROFILES } from './bots';
import { campaign, playRun, type RunStats } from './sim';

const args = process.argv.slice(2);
if (args[0] === '--transcript') {
  const p = PROFILES.find((x) => x.name === args[1]) ?? PROFILES[0];
  const r = playRun(content, p, Number(args[2] ?? 1), { transcript: true });
  mkdirSync('shots/transcripts', { recursive: true });
  const f = `shots/transcripts/${p.name.replace(/\s/g, '_')}-${args[2] ?? 1}.md`;
  writeFileSync(f, r.lines.join('\n'));
  console.log(`${f} (${r.decisions} décisions, ${r.win ? 'victoire' : 'défaite ère ' + (r.era + 1)})`);
  process.exit(0);
}
if (args[0] === '--campaign') {
  // une suite de parties reliées : chronique, testaments, déblocages, ruines et revenants
  const n = Number(args[1] ?? 10);
  const p = PROFILES.find((x) => x.name === (args[2] ?? 'lecteur')) ?? PROFILES[0];
  const { meta, states, unlocks } = campaign(content, p, Array.from({ length: n }, (_, i) => 1000 + i * 31));
  const out: string[] = [`# Campagne de ${n} parties (${p.name})`];
  states.forEach((s, i) => {
    const entry = meta.chronicle[n - 1 - i];
    out.push(`\n## ${i + 1}. ${s.name} (${s.origin}, ${s.dessein}) — ${s.result?.type}${s.iron ? ' — fer' : ''}`);
    out.push(...entry.lines.map((l) => `> ${l}`));
    out.push(`Épitaphe : ${entry.epitaph}`, `Héritage : ${entry.legacy?.label ?? '—'}`);
    const r = s.history.find((h) => h.card === 'ruines');
    const v = s.history.find((h) => h.card === 'revenants');
    out.push(`Ruines : ${s.ruins.map((x) => x.name).join(', ') || '—'} · fouille : ${r ? r.label : 'non'} · revenants : ${v ? v.label : 'non'}`);
    if (unlocks[i].length) out.push(`Débloqué : ${unlocks[i].join(', ')}`);
  });
  mkdirSync('shots/transcripts', { recursive: true });
  writeFileSync('shots/transcripts/campagne.md', out.join('\n'));
  console.log(out.join('\n'));
  process.exit(0);
}
const N = Number(args[0] ?? 200);
const res = new Map<string, RunStats[]>();
const t0 = Date.now();
for (const p of PROFILES) res.set(p.name, Array.from({ length: N }, (_, i) => playRun(content, p, 1 + i * 7919)));
const pct = (x: number) => `${(100 * x).toFixed(0)} %`;
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
console.log(`\n=== Citadeck V2 — ${N} parties par profil (${((Date.now() - t0) / 1000).toFixed(0)} s) ===`);
console.log('profil'.padEnd(20) + 'survie  ère moy.  jalons  grande vict.  décisions  dépend.  formes  procès');
for (const [name, rs] of res) {
  console.log(
    name.padEnd(20) + pct(mean(rs.map((r) => +r.win))).padStart(6) + mean(rs.map((r) => (r.win ? 5 : r.era + 1))).toFixed(2).padStart(9)
    + mean(rs.map((r) => r.jalons)).toFixed(1).padStart(8) + pct(mean(rs.map((r) => +(r.win && r.jalons >= 4)))).padStart(13)
    + mean(rs.map((r) => r.decisions)).toFixed(0).padStart(11) + pct(mean(rs.map((r) => r.dependent / r.decisions))).padStart(9)
    + mean(rs.map((r) => r.forms.size)).toFixed(1).padStart(8) + mean(rs.map((r) => r.trials)).toFixed(1).padStart(8),
  );
}
const R = (n: string) => res.get(n)!;
const win = (n: string) => mean(R(n).map((r) => +r.win));
const grand = (n: string) => mean(R(n).map((r) => +(r.win && r.jalons >= 4)));
console.log(`\nLecture nécessaire : lecteur ${pct(win('lecteur'))} contre indicateurs seuls ${pct(win('indicateurs seuls'))} (grande victoire ${pct(grand('lecteur'))} contre ${pct(grand('indicateurs seuls'))})`);
const strat = ['étoiles', 'empire', 'postérité', 'prudent', 'gourmand'];
const best = Math.max(...strat.map(grand));
console.log(`Stratégies viables (grande victoire ≥ 60 % de la meilleure, ${pct(best)}) : ${strat.filter((n) => grand(n) >= 0.6 * best && best > 0.03).join(', ')}`);
console.log(`Prudent survit ${pct(win('prudent'))} ; gourmand : survie ${pct(win('gourmand'))}, ère moyenne de mort ${mean(R('gourmand').filter((r) => !r.win).map((r) => r.era + 1)).toFixed(2)} contre ${mean(R('prudent').filter((r) => !r.win).map((r) => r.era + 1)).toFixed(2)} pour le prudent`);
let forced = 0;
for (let i = 0; i < N; i++) if (['lecteur', 'prudent', 'étoiles', 'empire', 'postérité'].every((n) => !R(n)[i].win)) forced++;
console.log(`Défaites forcées (aucun lecteur ne survit à la graine) : ${pct(forced / N)}`);
const causes = new Map<string, number>();
for (const rs of res.values()) for (const r of rs) for (const l of r.losses) {
  const k = l.cause.replace(/,.*$/, '');
  causes.set(k, (causes.get(k) ?? 0) + l.amount);
}
console.log(`Causes des pertes de quartiers : ${[...causes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
const lr = R('lecteur');
console.log(`Intrigues ouvertes / dénouées par partie : ${mean(lr.map((r) => r.arcsOpen)).toFixed(1)} / ${mean(lr.map((r) => r.arcsDone)).toFixed(1)}`);
const jac = (a: string[], b: string[]) => {
  const A = new Set(a), B = new Set(b);
  let i = 0;
  for (const x of A) if (B.has(x)) i++;
  return 1 - i / (A.size + B.size - i || 1);
};
console.log(`Distance entre deux histoires (cartes et choix) : ${mean(lr.slice(1, 60).map((r, i) => jac(r.path, lr[i].path))).toFixed(2)} ; souvenirs : ${mean(lr.slice(1, 60).map((r, i) => jac(r.mem, lr[i].mem))).toFixed(2)}`);
const endings = new Map<string, number>();
for (const r of lr.filter((x) => x.win)) endings.set(r.dessein, (endings.get(r.dessein) ?? 0) + 1);
{
  const rs = res.get('lecteur')!;
  const per = [0, 1, 2, 3, 4].map((e) => rs.reduce((a, r) => a + r.perEra[e], 0));
  const fo = [0, 1, 2, 3, 4].map((e) => rs.reduce((a, r) => a + r.forcedEra[e], 0));
  console.log(`Choix imposés (une seule option jouable), lecteur, par ère : ${fo.map((f, i) => `${pct(f / Math.max(1, per[i]))}`).join(' · ')}`);
}
console.log(`Victoires du lecteur par dessein : ${[...endings.entries()].map(([k, n]) => `${k} ${n}`).join(', ')}`);
