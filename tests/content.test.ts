import { describe, expect, it } from 'vitest';
import { content, CARD_COUNT } from '../src/data';
import { validateContent } from '../src/core/content';
import { GAUGES } from '../src/core/types';

describe('contenu', () => {
  it('est cohérent (références, longueurs)', () => {
    const errors = validateContent(content);
    expect(errors).toEqual([]);
  });

  it('compte au moins 100 cartes, 5 crises, 12 merveilles', () => {
    expect(CARD_COUNT).toBeGreaterThanOrEqual(100);
    expect(content.crises.length).toBe(5);
    expect(content.wonders.length).toBe(12);
    expect(content.eraPools.length).toBe(5);
  });

  it('chaque carte a deux options avec un coût quelque part', () => {
    for (const c of Object.values(content.cards)) {
      for (const side of ['left', 'right'] as const) {
        const e = c[side].effect;
        const deltas = [e.delta, e.then?.delta, e.else?.delta].filter(Boolean);
        expect(deltas.length, `${c.id} ${side}`).toBeGreaterThan(0);
        // au moins une branche a un effet négatif ou un coût différé
        const hasCost = deltas.some((d) => GAUGES.some((g) => (d![g] ?? 0) < 0)) || (e.add?.length ?? 0) > 0 || (e.rival ?? 0) < 0 || (e.scale ?? []).some((s) => GAUGES.some((g) => (s.delta[g] ?? 0) < 0));
        expect(hasCost, `${c.id} ${side} sans coût`).toBe(true);
      }
    }
  });

  it('chaque option à condition a une réplique d’échec', () => {
    for (const c of Object.values(content.cards)) {
      for (const side of ['left', 'right'] as const) {
        const e = c[side].effect;
        if (e.when && e.else && e.when.gauge) expect(e.else.reply, `${c.id} ${side}`).toBeTruthy();
      }
    }
  });

  it('les deux options d’une carte diffèrent', () => {
    for (const c of Object.values(content.cards)) {
      expect(JSON.stringify(c.left.effect)).not.toBe(JSON.stringify(c.right.effect));
    }
  });
});
