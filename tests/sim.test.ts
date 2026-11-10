import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { TRIVIAL, prudentBot, balancedBot } from '../src/sim/bots';
import { simulate } from '../src/sim/simulate';

describe('équilibrage (échantillon réduit)', () => {
  const res = simulate(content, [...TRIVIAL, prudentBot, balancedBot], 150);
  const by = (n: string) => res.bots.find((b) => b.name === n)!;

  it('aucune stratégie triviale ne gagne', () => {
    for (const b of TRIVIAL) expect(by(b.name).wins).toBe(0);
  });

  it('la prudente atteint parfois la dernière ère, pas toujours', () => {
    const r = by(prudentBot.name).reachedLastEra / 150;
    expect(r).toBeGreaterThan(0.12);
    expect(r).toBeLessThan(0.55);
  });

  it('un bot compétent peut gagner', () => {
    expect(by(balancedBot.name).wins).toBeGreaterThan(5);
  });

  it('la tension est là : plus de la moitié des tours avec une jauge en danger', () => {
    const b = by(balancedBot.name);
    expect(b.dangerTurns / b.turns).toBeGreaterThan(0.5);
  });
});
