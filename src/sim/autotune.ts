/**
 * Réglage automatique des options déséquilibrées.
 *   npm run autotune            → 8 passes, écrit src/data/adjust.ts
 *   npm run autotune -- 12 300  → 12 passes de 300 parties par bot
 *   npm run autotune -- 8 300 --reset → repart de zéro
 *
 * À chaque passe, les bots compétents jouent des parties et l'outil enregistre les situations
 * réelles où chaque carte a été rencontrée. Pour une carte dont une option est choisie plus de
 * 64 % du temps, il cherche la retouche d'un point (une jauge, un côté) qui ramène le choix
 * prédit vers 50/50, en évitant de pousser une jauge qui vit déjà trop haut ou trop bas.
 * Les signes ne sont jamais inversés et aucune jauge n'est ajoutée : la carte garde son sens.
 */
import { writeFileSync } from 'node:fs';
import { content } from '../data';
import { ADJUST } from '../data/adjust';
import { adjustEffect } from '../data/tuning';
import { Engine } from '../core/engine';
import { GAUGES, type CardDef, type Delta, type Effect, type GameState, type GaugeId, type Side } from '../core/types';
import { COMPETENT, sideValue, type Bot } from './bots';
import { playGame } from './simulate';

const nums = process.argv.slice(2).filter((a) => !a.startsWith('--')).map(Number);
const rounds = nums[0] ?? 8;
const games = nums[1] ?? 250;
const reset = process.argv.includes('--reset');
const LIMIT = 9;
const TRIGGER = 0.64;
const GOAL = 0.1;
const NOISE = 6;
const MAX_SAMPLES = 140;

const adj: Record<string, { left?: Delta; right?: Delta }> = reset ? {} : JSON.parse(JSON.stringify(ADJUST));
const engine = new Engine(content);

if (reset) {
  // les cartes chargées portent déjà ADJUST : on les ramène à leur valeur sans retouche
  for (const [id, e] of Object.entries(ADJUST)) {
    const card = content.cards[id];
    for (const side of ['left', 'right'] as Side[]) {
      const d = e[side];
      if (!d) continue;
      const inv: Delta = {};
      for (const g of GAUGES) if (d[g]) inv[g] = -d[g]!;
      card[side] = { ...card[side], effect: adjustEffect(card[side].effect, inv) };
    }
  }
}

function firstDelta(e: Effect): Delta {
  return e.delta ?? e.then?.delta ?? e.else?.delta ?? {};
}

/** Probabilité de choisir la gauche, bruit du bot compris (différence de deux uniformes = loi triangulaire). */
function pLeft(diff: number): number {
  const w = 2 * NOISE;
  if (diff <= -w) return 0;
  if (diff >= w) return 1;
  return diff < 0 ? ((diff + w) * (diff + w)) / (2 * w * w) : 1 - ((w - diff) * (w - diff)) / (2 * w * w);
}

function predictedShare(card: CardDef, samples: GameState[]): number {
  let sum = 0;
  for (const s of samples) sum += pLeft(sideValue(engine, s, card, 'left') - sideValue(engine, s, card, 'right'));
  return sum / samples.length;
}

function withEdit(card: CardDef, side: Side, g: GaugeId, delta: number): CardDef {
  return { ...card, [side]: { ...card[side], effect: adjustEffect(card[side].effect, { [g]: delta }) } };
}

for (let r = 0; r < rounds; r++) {
  // --- 1. jouer et enregistrer
  const samples = new Map<string, GameState[]>();
  const counts: Record<string, { left: number; right: number }> = {};
  const lv: Record<GaugeId, number> = { food: 0, army: 0, knowledge: 0, treasure: 0 };
  let lvN = 0;
  for (const bot of COMPETENT) {
    const spy: Bot = {
      ...bot,
      choose(e, s, rng) {
        const id = s.current!;
        const list = samples.get(id) ?? [];
        if (list.length < MAX_SAMPLES || rng.chance(0.05)) {
          const copy = JSON.parse(JSON.stringify({ ...s, history: [] })) as GameState;
          if (list.length < MAX_SAMPLES) list.push(copy);
          else list[Math.floor(rng.next() * MAX_SAMPLES)] = copy;
          samples.set(id, list);
        }
        const side = bot.choose(e, s, rng);
        (counts[id] ??= { left: 0, right: 0 })[side]++;
        return side;
      },
    };
    for (let i = 0; i < games; i++) {
      const s = playGame(engine, spy, 1 + r * 104729 + i * 7919);
      for (const h of s.history) {
        for (const g of GAUGES) lv[g] += h.gauges[g];
        lvN++;
      }
    }
  }
  for (const g of GAUGES) lv[g] /= lvN;

  // --- 2. retoucher les cartes déséquilibrées
  let over = 0;
  let touched = 0;
  for (const [id, c] of Object.entries(counts)) {
    const n = c.left + c.right;
    if (n < 40) continue;
    const share = c.left / n;
    if (Math.max(share, 1 - share) > 0.7) over++;
    if (Math.max(share, 1 - share) <= TRIGGER) continue;
    const list = samples.get(id)!;
    let card = content.cards[id];
    let p = predictedShare(card, list);
    let edits = 0;
    while (Math.abs(p - 0.5) > GOAL && edits < 4) {
      let best: { side: Side; g: GaugeId; d: number; p: number; score: number } | null = null;
      for (const side of ['left', 'right'] as Side[]) {
        const base = firstDelta(card[side].effect);
        const freq = side === 'left' ? p : 1 - p;
        for (const g of GAUGES) {
          const v = base[g];
          if (!v) continue;
          for (const d of [-1, 1]) {
            const used = adj[id]?.[side]?.[g] ?? 0;
            if (Math.abs(used + d) > LIMIT) continue;
            const t = v + d;
            if (t === 0 || Math.sign(t) !== Math.sign(v) || Math.abs(t) > 22) continue;
            const np = predictedShare(withEdit(card, side, g, d), list);
            // pénalité : ne pas pousser une jauge du côté où elle vit déjà
            const drift = freq * d * (lv[g] - 50) * 0.004;
            const score = Math.abs(np - 0.5) + Math.max(0, drift) + Math.abs(used) * 0.002;
            if (!best || score < best.score) best = { side, g, d, p: np, score };
          }
        }
      }
      if (!best || Math.abs(best.p - 0.5) >= Math.abs(p - 0.5) - 0.002) break;
      card = withEdit(card, best.side, best.g, best.d);
      const entry = (adj[id] ??= {});
      const used = (entry[best.side] ??= {});
      used[best.g] = (used[best.g] ?? 0) + best.d;
      p = best.p;
      edits++;
    }
    if (edits) {
      content.cards[id] = card;
      touched++;
    }
  }
  console.log(`passe ${r + 1}/${rounds} : ${over} cartes > 70 %, ${touched} retouchées — niveaux N ${lv.food.toFixed(0)} A ${lv.army.toFixed(0)} S ${lv.knowledge.toFixed(0)} T ${lv.treasure.toFixed(0)}`);
  if (touched === 0) break;
}

// --- 3. écrire le résultat
const clean: Record<string, { left?: Delta; right?: Delta }> = {};
for (const [id, e] of Object.entries(adj).sort()) {
  const out: { left?: Delta; right?: Delta } = {};
  for (const side of ['left', 'right'] as Side[]) {
    const d = e[side];
    if (!d) continue;
    const nz: Delta = {};
    for (const g of GAUGES) if (d[g]) nz[g] = d[g];
    if (Object.keys(nz).length) out[side] = nz;
  }
  if (Object.keys(out).length) clean[id] = out;
}
const body = Object.entries(clean)
  .map(([id, e]) => `  ${id}: ${JSON.stringify(e).replace(/"/g, '')},`)
  .join('\n');
writeFileSync(
  'src/data/adjust.ts',
  `import type { Delta } from '../core/types';

/**
 * Retouches fines par carte, produites par \`npm run autotune\` : l'outil joue des milliers de
 * parties avec les bots compétents et déplace un point à la fois tant qu'une option est choisie
 * bien plus souvent que l'autre. Fichier généré — ne pas éditer à la main.
 */
export const ADJUST: Record<string, { left?: Delta; right?: Delta }> = {
${body}
};
`,
);
console.log(`${Object.keys(clean).length} cartes retouchées → src/data/adjust.ts`);
