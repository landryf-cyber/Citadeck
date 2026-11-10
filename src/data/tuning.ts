import { GAUGES, type CardDef, type Delta, type Effect, type GaugeId } from '../core/types';
import { ADJUST } from './adjust';

/**
 * Correction d'équilibrage par jauge, appliquée une fois à toutes les cartes au chargement.
 * Les textes des cartes penchent naturellement vers « le savoir monte, la nourriture baisse » :
 * cette table recentre les quatre jauges sans réécrire 180 cartes à la main.
 * Réglée avec `npx tsx src/sim/levels.ts` (les moyennes doivent rester proches de 50).
 */
export const BIAS: Record<GaugeId, { gain: number; loss: number }> = {
  food: { gain: 1.2, loss: 0.88 },
  army: { gain: 0.88, loss: 1.1 },
  knowledge: { gain: 1.05, loss: 1.25 },
  treasure: { gain: 1.15, loss: 0.9 },
};

function tuneDelta(d: Delta | undefined): Delta | undefined {
  if (!d) return d;
  const out: Delta = {};
  for (const g of GAUGES) {
    const v = d[g];
    if (!v) continue;
    const k = v > 0 ? BIAS[g].gain : BIAS[g].loss;
    const t = Math.round(v * k);
    out[g] = t === 0 ? Math.sign(v) : t;
  }
  return out;
}

function tuneEffect(e: Effect): Effect {
  const out: Effect = { ...e };
  if (e.delta) out.delta = tuneDelta(e.delta);
  if (e.then) out.then = tuneEffect(e.then);
  if (e.else) out.else = tuneEffect(e.else);
  return out;
}

/** Ajoute une retouche aux jauges déjà présentes d'un effet (et de ses branches), sans jamais en inverser le signe. */
export function adjustEffect(e: Effect, adj: Delta | undefined): Effect {
  if (!adj) return e;
  const out: Effect = { ...e };
  if (e.delta) {
    const d: Delta = { ...e.delta };
    for (const g of GAUGES) {
      const a = adj[g];
      const v = d[g];
      if (!a || !v) continue;
      const t = v + a;
      d[g] = Math.sign(t) === Math.sign(v) && t !== 0 ? t : Math.sign(v);
    }
    out.delta = d;
  }
  if (e.then) out.then = adjustEffect(e.then, adj);
  if (e.else) out.else = adjustEffect(e.else, adj);
  return out;
}

export function tuneCard(c: CardDef): CardDef {
  const adj = ADJUST[c.id];
  return {
    ...c,
    left: { ...c.left, effect: adjustEffect(tuneEffect(c.left.effect), adj?.left) },
    right: { ...c.right, effect: adjustEffect(tuneEffect(c.right.effect), adj?.right) },
  };
}
