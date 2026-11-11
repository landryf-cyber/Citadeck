/** Ce que la scène doit montrer d'une partie. */
import { ERA_SCALE, type Engine } from '../core/engine';
import { FAMILIES, type GameState } from '../core/types';
import type { CivSnapshot } from '../scene/city';

export function snapshot(e: Engine, s: GameState): CivSnapshot {
  const k = 9 * ERA_SCALE[s.era];
  const n = (v: number) => Math.max(0, Math.min(1, v / k));
  return {
    seed: s.seed,
    era: s.era,
    growth: s.turn,
    quartiers: s.quartiers,
    lost: Math.min(6, s.losses.reduce((a, l) => a + l.amount, 0)),
    fam: FAMILIES.map((f) => ({ tag: e.c.families[f].tag, loy: s.fam[f].loy, gone: s.fam[f].state !== 'presente' })),
    jalons: s.jalons.map((b, i) => (b ? e.jalonOf(s, i).shape : '')).filter(Boolean),
    rival: { count: s.rivalJalons, hue: e.rival(s).hue },
    ruins: s.ruins.map((r) => r.shape ?? 'cercle'),
    res: { vivres: n(s.res.vivres), armee: n(s.res.armee), savoir: n(s.res.savoir), tresor: n(s.res.tresor) },
  };
}
