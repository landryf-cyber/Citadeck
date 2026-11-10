/** Joueurs automatiques pour la simulation : du plus bête au plus compétent. */
import type { Engine } from '../core/engine';
import { Rng } from '../core/rng';
import { GAUGES, type CardDef, type Effect, type GameState, type Keyword, type Side } from '../core/types';

export interface Bot {
  name: string;
  /** compétent = pris en compte pour les statistiques d'options et de cartes */
  competent: boolean;
  archetype?: Keyword;
  choose(engine: Engine, s: GameState, rng: Rng): Side;
  reward(engine: Engine, s: GameState, rng: Rng): { pick: string | null; remove: string | null };
}

const noReward = (_e: Engine, s: GameState, rng: Rng) => ({ pick: s.reward?.cards.length ? rng.pick(s.reward.cards) : null, remove: null });

export const randomBot: Bot = { name: 'aléatoire', competent: false, choose: (_e, _s, rng) => (rng.chance(0.5) ? 'left' : 'right'), reward: noReward };
export const leftBot: Bot = { name: 'toujours gauche', competent: false, choose: () => 'left', reward: noReward };
export const rightBot: Bot = { name: 'toujours droite', competent: false, choose: () => 'right', reward: noReward };
export const alternateBot: Bot = { name: 'alternée', competent: false, choose: (_e, s) => (s.turn % 2 ? 'left' : 'right'), reward: noReward };

/** Prudente : à chaque carte, l'option qui laisse les jauges le plus près du milieu. Aucune vision du deck. */
export const prudentBot: Bot = {
  name: 'prudente',
  competent: false,
  choose(engine, s) {
    let best: Side = 'left';
    let bestScore = Infinity;
    for (const side of ['left', 'right'] as Side[]) {
      const d = engine.preview(s, side);
      let sc = 0;
      for (const g of GAUGES) {
        const v = s.gauges[g] + (d[g] ?? 0);
        sc += (v - 50) * (v - 50);
        if (v <= 0 || v >= 100) sc += 1e6;
      }
      if (sc < bestScore) {
        bestScore = sc;
        best = side;
      }
    }
    return best;
  },
  reward: noReward,
};

// ---------------------------------------------------------------------- bots compétents

function gaugeUtility(v: number, center = 50): number {
  if (v <= 0 || v >= 100) return -1e5;
  const d = Math.abs(v - center) / 50;
  let u = -d * d * 40;
  if (v <= 14 || v >= 86) u -= 45;
  else if (v <= 22 || v >= 78) u -= 14;
  return u;
}

function stateUtility(g: Record<string, number>, center = 50): number {
  let u = 0;
  for (const k of GAUGES) u += gaugeUtility(g[k], k === 'knowledge' ? 50 : center);
  return u;
}

/** Valeur approximative d'une conséquence : la meilleure de ses deux issues, vue d'un état neutre. */
const consequenceCache = new Map<string, number>();
function consequenceValue(engine: Engine, id: string): number {
  const c = consequenceCache.get(id);
  if (c !== undefined) return c;
  const card = engine.card(id);
  const val = (e: Effect): number => {
    const branches = [e.delta, e.then?.delta, e.else?.delta].filter(Boolean) as Record<string, number>[];
    if (!branches.length) return 0;
    let sum = 0;
    for (const b of branches) for (const g of GAUGES) sum += b[g] ?? 0;
    return sum / branches.length;
  };
  const v = Math.max(val(card.left.effect), val(card.right.effect));
  consequenceCache.set(id, v);
  return v;
}

export function sideValue(engine: Engine, s: GameState, card: CardDef, side: Side): number {
  const eff = engine.resolveEffect(s, card[side].effect);
  const d = engine.totalDelta(s, card, card[side].effect);
  const after: Record<string, number> = { ...s.gauges };
  for (const g of GAUGES) after[g] += d[g] ?? 0;
  // un joueur compétent sait qu'une crise approche : il arrive avec des réserves
  const left = s.phase === 'card' ? s.drawPile.length : 99;
  const center = left <= 7 ? 50 + (8 - left) * 1.6 : 50;
  let u = stateUtility(after, center);
  for (const a of eff.add ?? []) u += consequenceValue(engine, a.card) * 0.8;
  u += (eff.rival ?? 0) * 0.12;
  return u;
}

function makeCompetent(name: string, archetype: Keyword | undefined, noise: number): Bot {
  return {
    name,
    competent: true,
    archetype,
    choose(engine, s, rng) {
      const card = engine.currentCard(s)!;
      const l = sideValue(engine, s, card, 'left') + rng.range(-noise, noise);
      const r = sideValue(engine, s, card, 'right') + rng.range(-noise, noise);
      return l >= r ? 'left' : 'right';
    },
    reward(engine, s, rng) {
      const offer = s.reward?.cards ?? [];
      const counts = engine.keywordCounts(s);
      let pick: string | null = null;
      let best = -Infinity;
      for (const id of offer) {
        const c = engine.card(id);
        let sc = rng.range(0, 3);
        for (const k of c.keywords ?? []) {
          if (archetype) sc += k === archetype ? 10 : 0;
          else sc += counts[k] * 1.5;
        }
        if (sc > best) {
          best = sc;
          pick = id;
        }
      }
      // retrait : un bot d'archétype élague les cartes de départ hors sujet
      let remove: string | null = null;
      if (archetype && rng.chance(0.7)) {
        const off = engine.removableCards(s).filter((id) => id !== pick && !(engine.card(id).keywords ?? []).includes(archetype));
        if (off.length) remove = rng.pick(off);
      } else if (!archetype && rng.chance(0.3)) {
        const all = engine.removableCards(s).filter((id) => id !== pick);
        if (all.length > 3) remove = rng.pick(all);
      }
      return { pick, remove };
    },
  };
}

export const balancedBot = makeCompetent('compétente', undefined, 6);
export const archetypeBots: Bot[] = (['Foi', 'Guerre', 'Commerce', 'Science', 'Culture', 'Nature'] as Keyword[]).map((k) => makeCompetent(`archétype ${k}`, k, 6));

export const TRIVIAL = [randomBot, leftBot, rightBot, alternateBot];
export const COMPETENT = [balancedBot, ...archetypeBots];
export const ALL_BOTS = [...TRIVIAL, prudentBot, ...COMPETENT];
