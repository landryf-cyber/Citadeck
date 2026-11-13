/**
 * Les ères ont-elles chacune leur forme ? Pour chaque partie, la suite des invites de chaque ère, réduite à sa forme :
 *   P présage · R carrefour · c carte de saison · O colonie · V conseil · J chantier · X crise · T trahison · U jugement
 *   D disette · $ créance · G croissance · L procès ou hommage · K découverte · B tribut ou triomphe
 *   et les règles qui agissent : r vivres gâtés, k la rivale avance.
 * Similarité de deux suites : 1 − distance d'édition / longueur de la plus longue.
 *   npx tsx src/sim/structure.ts [parties]
 */
import { content } from '../data';
import { Engine, type Ev } from '../core/engine';
import { Rng } from '../core/rng';
import type { GameState } from '../core/types';
import { PROFILES, chooseIndex } from './bots';

const SYM: Record<string, string> = {
  presage: 'P', carrefour: 'R', jalon: 'J', crise: 'X', trahison: 'T', proces: 'L', croissance: 'G', decouverte: 'K',
  triomphe: 'B', tribut: 'B', regle: 'O', conseil: 'V', jugement: 'U',
};

function symbol(e: Engine, s: GameState): string {
  const id = s.prompt?.card ?? '';
  if (s.phase === 'presage') return 'P';
  if (id === 'disette') return 'D';
  if (/^creance/.test(id)) return '$';
  if (/^hommage_/.test(id)) return 'L';
  if (id === 'colonie') return 'O';
  if (id === 'conseil') return 'V';
  const k = e.c.cards[id]?.kind ?? id;
  return SYM[k] ?? 'c';
}

/** La forme de chaque ère d'une partie (index = ère). */
export function eraShapes(e: Engine, s: GameState, p: (typeof PROFILES)[number], rng: Rng): string[] {
  const out = ['', '', '', '', ''];
  let g = 0;
  while (s.phase !== 'fin' && g++ < 600) {
    const era = s.era;
    out[era] += symbol(e, s);
    const ev: Ev[] = e.act(s, chooseIndex(e, s, p, rng));
    for (const x of ev) {
      if (x.type === 'rot' && x.amount > 0) out[era] += 'r';
      if (x.type === 'raceStep') out[era] += 'k';
    }
  }
  return out;
}

export function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
export const sim = (a: string, b: string) => (a.length || b.length ? 1 - lev(a, b) / Math.max(a.length, b.length) : 1);

export interface StructureReport {
  /** similarité moyenne entre deux ères différentes d'une même partie (plus bas = des ères plus distinctes) */
  betweenEras: number;
  /** similarité moyenne d'une même ère d'une partie à l'autre (sa forme est reconnaissable) */
  sameEraAcrossGames: number;
  /** similarité moyenne de deux parties entières (structure), et part de cartes communes (contenu) */
  betweenGames: number;
  contentOverlap: number;
  /** une forme typique par ère */
  examples: string[];
  /** paires d'ères les plus semblables */
  closest: [string, number][];
}

export function measureStructure(games = 40, profile = 'lecteur'): StructureReport {
  const e = new Engine(content);
  const p = PROFILES.find((x) => x.name === profile) ?? PROFILES[0];
  const shapes: string[][] = [];
  const cards: Set<string>[] = [];
  for (let g = 0; g < games; g++) {
    const rng = new Rng(4242 + g * 31);
    const s = e.newGame(1300 + g * 17, { dessein: content.desseins[g % 3].id });
    const sh = eraShapes(e, s, p, rng);
    if (sh.every((x) => x.length)) {
      shapes.push(sh);
      cards.push(new Set(s.history.map((h) => h.card)));
    }
  }
  let be = 0, ben = 0, se = 0, sen = 0, bg = 0, bgn = 0, co = 0;
  const pair = new Map<string, [number, number]>();
  for (const sh of shapes) for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) {
    const v = sim(sh[i], sh[j]);
    be += v;
    ben++;
    const k = `${i + 1}-${j + 1}`;
    const pp = pair.get(k) ?? [0, 0];
    pair.set(k, [pp[0] + v, pp[1] + 1]);
  }
  for (let a = 0; a < shapes.length; a++) for (let b = a + 1; b < shapes.length; b++) {
    for (let i = 0; i < 5; i++) { se += sim(shapes[a][i], shapes[b][i]); sen++; }
    bg += sim(shapes[a].join('|'), shapes[b].join('|'));
    const inter = [...cards[a]].filter((x) => cards[b].has(x)).length;
    co += inter / Math.max(1, Math.min(cards[a].size, cards[b].size));
    bgn++;
  }
  return {
    betweenEras: be / Math.max(1, ben),
    sameEraAcrossGames: se / Math.max(1, sen),
    betweenGames: bg / Math.max(1, bgn),
    contentOverlap: co / Math.max(1, bgn),
    examples: shapes[0] ?? [],
    closest: [...pair.entries()].map(([k, [v, n]]) => [k, v / n] as [string, number]).sort((x, y) => y[1] - x[1]).slice(0, 4),
  };
}

if (process.argv[1]?.endsWith('structure.ts')) {
  const r = measureStructure(Number(process.argv[2] ?? 40));
  console.log(`Similarité entre deux ères d'une même partie : ${r.betweenEras.toFixed(2)}`);
  console.log(`Similarité d'une même ère d'une partie à l'autre : ${r.sameEraAcrossGames.toFixed(2)}`);
  console.log(`Similarité de structure entre deux parties : ${r.betweenGames.toFixed(2)} ; cartes communes : ${(r.contentOverlap * 100).toFixed(0)} %`);
  console.log(`Paires d'ères les plus proches : ${r.closest.map(([k, v]) => `${k} ${v.toFixed(2)}`).join(' · ')}`);
  r.examples.forEach((x, i) => console.log(`  ère ${i + 1} : ${x}`));
}
