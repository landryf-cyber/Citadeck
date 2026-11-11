/** Compare les boucles prototypes : npx tsx src/proto/compare.ts */
import { KNOB, makeContent, play, type Bot, type Loop, type Run } from './loops';

const N = Number(process.argv[2] ?? 1500);
const bots: Bot[] = [
  { name: 'lecteur équilibré', sight: 'reader', focus: 0, reserve: 6 },
  { name: 'indicateurs seuls', sight: 'indicator', focus: 0, reserve: 6 },
  { name: 'prudent', sight: 'reader', focus: 0, reserve: 10 },
  { name: 'gourmand', sight: 'reader', focus: 0, reserve: 1 },
  { name: 'spécialiste Science', sight: 'reader', focus: 1, reserve: 5 },
  { name: 'spécialiste Guerre', sight: 'reader', focus: 2, reserve: 5 },
  { name: 'spécialiste Culture', sight: 'reader', focus: 3, reserve: 5 },
  { name: 'aléatoire', sight: 'random', focus: 0, reserve: 6 },
];

const jaccard = (a: string[], b: string[]) => {
  const A = new Set(a), B = new Set(b);
  let i = 0;
  for (const x of A) if (B.has(x)) i++;
  return 1 - i / (A.size + B.size - i || 1);
};

for (const loop of ['P1', 'P2', 'P3'] as Loop[]) {
  // étalonnage : même difficulté pour toutes les boucles (survie du lecteur équilibré ≈ 60 %)
  {
    let lo = 0.3, hi = 3;
    for (let it = 0; it < 14; it++) {
      const mid = (lo + hi) / 2;
      KNOB[loop] = mid;
      const c = makeContent(loop, 4242);
      const w = Array.from({ length: 300 }, (_, i) => play(loop, c, bots[0], 1 + i * 7919)).filter((r) => r.win).length / 300;
      if (w > 0.6) lo = mid; else hi = mid;
    }
    KNOB[loop] = (lo + hi) / 2;
  }
  const content = makeContent(loop, 4242);
  console.log(`\n(${loop} étalonné : difficulté ${KNOB[loop].toFixed(2)})`);
  const res = new Map<string, Run[]>();
  for (const b of bots) res.set(b.name, Array.from({ length: N }, (_, i) => play(loop, content, b, 1 + i * 7919)));
  const wr = (n: string) => res.get(n)!.filter((r) => r.win).length / N;
  const meanEra = (n: string) => res.get(n)!.reduce((a, r) => a + (r.win ? 5 : r.era + 1), 0) / N;
  const grand = (n: string) => res.get(n)!.filter((r) => r.win && r.jalons >= 4).length / N;
  const all = [...res.values()].flat();
  const reader = res.get('lecteur équilibré')!;
  const losses = all.reduce((a, r) => a + r.totalLoss, 0);
  const attr = all.reduce((a, r) => a + r.attributable, 0);
  // défaites forcées : graines où aucun bot lecteur ne survit
  let forced = 0;
  for (let i = 0; i < N; i++) if (bots.filter((b) => b.sight === 'reader').every((b) => !res.get(b.name)![i].win)) forced++;
  const strategies = ['prudent', 'gourmand', 'spécialiste Science', 'spécialiste Guerre', 'spécialiste Culture', 'lecteur équilibré'];
  const best = Math.max(...strategies.map(wr));
  const bestGrand = Math.max(...strategies.map(grand));
  const viable = strategies.filter((n) => grand(n) >= 0.6 * bestGrand && bestGrand > 0.02);
  const story = reader.slice(0, 200).reduce((a, r, i, arr) => a + (i ? jaccard(r.story, arr[i - 1].story) : 0), 0) / 199;
  console.log(`\n=== ${loop} ===`);
  for (const b of bots) console.log(`${b.name.padEnd(22)} survie ${(100 * wr(b.name)).toFixed(0).padStart(3)} %   grande victoire (≥4 jalons) ${(100 * grand(b.name)).toFixed(0).padStart(3)} %   ère moyenne ${meanEra(b.name).toFixed(2)}`);
  console.log(`M1 lecture nécessaire : lecteur − indicateurs = ${(100 * (wr('lecteur équilibré') - wr('indicateurs seuls'))).toFixed(0)} points de survie, ${(100 * (grand('lecteur équilibré') - grand('indicateurs seuls'))).toFixed(0)} de grande victoire`);
  console.log(`M2 stratégies viables (grande victoire ≥ 60 % de la meilleure) : ${viable.length} — ${viable.join(', ')}`);
  console.log(`M3 prudent survit ${(100 * wr('prudent')).toFixed(0)} % ; gourmand meurt en moyenne à l'ère ${meanEra('gourmand').toFixed(2)} contre ${meanEra('prudent').toFixed(2)}`);
  console.log(`M4 pertes attribuables à une décision : ${losses ? (100 * attr / losses).toFixed(0) : '—'} % ; défaites forcées (aucun lecteur ne survit) : ${(100 * forced / N).toFixed(1)} %`);
  console.log(`M5 cartes dépendant d'un choix passé : ${(100 * reader.reduce((a, r) => a + r.dependent, 0) / reader.reduce((a, r) => a + r.decisions, 0)).toFixed(0)} %`);
  console.log(`M6 formes de dilemme par partie : ${(reader.reduce((a, r) => a + r.forms.size, 0) / N).toFixed(1)}`);
  console.log(`M7 intrigues ouvertes / dénouées par partie : ${(reader.reduce((a, r) => a + r.intrigues, 0) / N).toFixed(1)} / ${(reader.reduce((a, r) => a + r.resolved, 0) / N).toFixed(1)}`);
  console.log(`M9 distance entre deux histoires (Jaccard) : ${story.toFixed(2)} ; décisions par partie : ${(reader.reduce((a, r) => a + r.decisions, 0) / N).toFixed(0)}`);
  void best;
}
