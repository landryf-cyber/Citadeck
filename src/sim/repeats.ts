/**
 * Répliques répétées mot pour mot : dans une même partie, et d'une partie à l'autre.
 *   npx tsx src/sim/repeats.ts [parties] [profil]
 * On relève tout ce que le joueur lit : le texte des cartes (accroche des familles comprise) et les réponses.
 * Les parties s'enchaînent comme chez un joueur (chronique, testament, anti-redite de la partie précédente).
 */
import { content } from '../data';
import { Engine } from '../core/engine';
import { Rng } from '../core/rng';
import { newMeta, nextSetup, recordRun, testaments } from '../core/meta';
import type { GameState } from '../core/types';
import { PROFILES, chooseIndex } from './bots';

export interface RepeatReport {
  games: number;
  /** répliques et textes vus deux fois ou plus dans une même partie (somme sur les parties) */
  withinGame: number;
  /** les plus fréquents à l'intérieur d'une partie */
  topWithin: [string, number][];
  /** part des textes d'une partie déjà lus dans la partie précédente */
  fromPrevious: number;
  /** textes lus dans plus de la moitié des parties */
  common: [string, number][];
  /** nombre de textes lus par partie */
  perGame: number;
}

/** Ce que le joueur lit dans une partie, dans l'ordre. */
function readGame(e: Engine, s: GameState, p: (typeof PROFILES)[number], rng: Rng): string[] {
  const seen: string[] = [];
  let g = 0;
  while (s.phase !== 'fin' && g++ < 500) {
    const v = e.view(s)!;
    // le texte de la carte (sauf les cartes de structure, qui se répètent par nature)
    if (!['carrefour', 'presage', 'jalon', 'decouverte', 'croissance'].includes(v.kind) && v.text) seen.push(`T|${v.text}`);
    const ev = e.act(s, chooseIndex(e, s, p, rng));
    for (const x of ev) if (x.type === 'reply' && (x as { text: string }).text) seen.push(`R|${(x as { text: string }).text}`);
  }
  return seen;
}

export function measureRepeats(games = 20, profile = 'pressé'): RepeatReport {
  const e = new Engine(content);
  const p = PROFILES.find((x) => x.name === profile) ?? PROFILES[0];
  let meta = newMeta();
  const all: Set<string>[] = [];
  let within = 0;
  let total = 0;
  const withinCount = new Map<string, number>();
  for (let g = 0; g < games; g++) {
    const rng = new Rng(31337 + g * 7919);
    const setup = nextSetup(meta, { dessein: content.desseins[g % 3].id });
    const s = e.newGame(5000 + g * 13, setup);
    const read = readGame(e, s, p, rng);
    total += read.length;
    const counts = new Map<string, number>();
    for (const t of read) counts.set(t, (counts.get(t) ?? 0) + 1);
    for (const [t, n] of counts) if (n > 1) {
      within += n - 1;
      withinCount.set(t, (withinCount.get(t) ?? 0) + n - 1);
    }
    all.push(new Set(read));
    const t = testaments(e, s)[0];
    meta = recordRun(meta, e, s, t).meta;
  }
  let prev = 0;
  let prevTotal = 0;
  for (let g = 1; g < all.length; g++) {
    prevTotal += all[g].size;
    for (const t of all[g]) if (all[g - 1].has(t)) prev++;
  }
  const freq = new Map<string, number>();
  for (const set of all) for (const t of set) freq.set(t, (freq.get(t) ?? 0) + 1);
  return {
    games,
    withinGame: within,
    topWithin: [...withinCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15),
    fromPrevious: prevTotal ? prev / prevTotal : 0,
    common: [...freq.entries()].filter(([, n]) => n > games / 2).sort((a, b) => b[1] - a[1]).slice(0, 20),
    perGame: total / games,
  };
}

if (process.argv[1]?.endsWith('repeats.ts')) {
  const r = measureRepeats(Number(process.argv[2] ?? 20), process.argv[3] ?? 'pressé');
  console.log(`${r.games} parties, ${r.perGame.toFixed(0)} textes lus par partie`);
  console.log(`Répétitions dans une même partie : ${r.withinGame} (${(r.withinGame / r.games).toFixed(2)} par partie)`);
  for (const [t, n] of r.topWithin) console.log(`  ×${n} ${t.slice(0, 150)}`);
  console.log(`Part des textes déjà lus à la partie précédente : ${(r.fromPrevious * 100).toFixed(1)} %`);
  console.log(`Textes lus dans plus de la moitié des parties : ${r.common.length}`);
  for (const [t, n] of r.common) console.log(`  ${n}/${r.games} ${t.slice(0, 150)}`);
}
