import { describe, expect, it } from 'vitest';
import { content } from '../src/data';
import { Engine, ERA_COUNT } from '../src/core/engine';
import { Rng, seedToCode, codeToSeed } from '../src/core/rng';
import type { Content } from '../src/core/content';
import { cardFace, type CardDef, type GameState, type Side } from '../src/core/types';
import { card, opt, D } from '../src/data/dsl';

const engine = new Engine(content);

function playRandom(seed: number, maxTurns = 500): GameState {
  const s = engine.newGame(seed, false);
  const rng = new Rng(seed ^ 0xabcdef);
  let guard = 0;
  while (s.phase !== 'end' && guard++ < maxTurns) {
    if (s.phase === 'reward') {
      engine.pickReward(s, s.reward!.cards[0] ?? null);
      engine.nextEra(s);
    } else {
      engine.choose(s, rng.chance(0.5) ? 'left' : 'right');
    }
  }
  return s;
}

/** Contenu minimal pour tester la mécanique isolément. */
function mini(cards: CardDef[], extra: Partial<Content> = {}): Content {
  const rec: Record<string, CardDef> = {};
  for (const c of cards) rec[c.id] = c;
  return {
    cards: rec,
    eras: [0, 1, 2, 3, 4].map((i) => ({ index: i, name: `E${i}`, subtitle: '', packSize: 0 })),
    starters: cards.filter((c) => c.kind === 'starter').map((c) => c.id),
    tutorial: [],
    eraPools: [[], [], [], [], []],
    rewards: cards.filter((c) => c.kind === 'tech').map((c) => c.id),
    crises: [0, 1, 2, 3, 4].map((i) => ({ id: `c${i}`, name: `C${i}`, intro: '', era: i, cards: ['crisis'] })),
    wonders: [],
    rival: { names: ['R'], hostile: [], neutral: [], friendly: [] },
    ...extra,
  };
}

const neutral = (id: string, kind: CardDef['kind'] = 'starter') =>
  card({ id, title: id, text: id, kind, left: opt('L', D(1, -1)), right: opt('R', D(-1, 1)) });
const crisisCard = card({ id: 'crisis', title: 'crise', text: 'crise', kind: 'crisis', left: opt('L', D(-2)), right: opt('R', D(0, -2)) });

describe('rng', () => {
  it('est déterministe et sérialisable', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let i = 0; i < 20; i++) expect(a.next()).toBe(b.next());
    const c = Rng.fromState(a.getState());
    expect(c.next()).toBe(a.next());
  });
  it('les graines font l’aller-retour en code lisible', () => {
    for (const seed of [0, 1, 123456, 0x3fffffff]) {
      const code = seedToCode(seed);
      expect(code).toHaveLength(6);
      expect(codeToSeed(code)).toBe(seed);
    }
    expect(codeToSeed('xx')).toBeNull();
  });
});

describe('moteur — partie', () => {
  it('démarre déséquilibrée mais hors danger, avec une carte en main', () => {
    const s = engine.newGame(1, false);
    const vals = Object.values(s.gauges);
    expect(Math.min(...vals)).toBeGreaterThan(30);
    expect(Math.max(...vals)).toBeLessThan(70);
    expect(Math.max(...vals) - Math.min(...vals)).toBeGreaterThan(15);
    expect(s.current).toBeTruthy();
    expect(s.phase).toBe('card');
    expect(s.deck).toEqual(content.starters);
  });

  it('le tutoriel place ses cartes en tête de la première ère', () => {
    const s = engine.newGame(7, true);
    expect(s.current).toBe(content.tutorial[0]);
    expect(s.drawPile.slice(0, content.tutorial.length - 1)).toEqual(content.tutorial.slice(1));
  });

  it('une même graine et les mêmes choix donnent la même partie', () => {
    const a = playRandom(1234);
    const b = playRandom(1234);
    expect(a.history).toEqual(b.history);
    expect(a.result).toEqual(b.result);
    const c = playRandom(1235);
    expect(c.history).not.toEqual(a.history);
  });

  it('l’état survit à un aller-retour JSON en cours de partie', () => {
    const a = engine.newGame(99, false);
    const b0 = engine.newGame(99, false);
    const sides: Side[] = ['left', 'right', 'right', 'left', 'left', 'right'];
    for (const side of sides) {
      engine.choose(a, side);
      engine.choose(b0, side);
    }
    const b = JSON.parse(JSON.stringify(b0)) as GameState;
    for (const side of sides) {
      if (a.phase === 'end') break;
      engine.choose(a, side);
      engine.choose(b, side);
    }
    expect(b).toEqual(a);
  });

  it('une partie aléatoire se termine toujours (défaite ou victoire)', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const s = playRandom(seed);
      expect(s.phase).toBe('end');
      expect(s.result).toBeTruthy();
      for (const h of s.history) {
        for (const v of Object.values(h.gauges)) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});

describe('moteur — jauges et défaite', () => {
  it('une jauge à 0 provoque la défaite, avec la carte responsable', () => {
    const c = mini([card({ id: 'a', title: 'a', text: 'a', kind: 'starter', left: opt('L', D(-15)), right: opt('R', D(15)) }), crisisCard]);
    const e = new Engine(c);
    const s = e.newGame(1, false);
    s.gauges.food = 12;
    const ev = e.choose(s, 'left');
    expect(s.phase).toBe('end');
    expect(s.result).toEqual({ type: 'defeat', gauge: 'food', bound: 'low', card: 'a' });
    expect(ev.some((x) => x.type === 'defeat')).toBe(true);
  });

  it('une jauge à 100 provoque aussi la défaite', () => {
    const c = mini([card({ id: 'a', title: 'a', text: 'a', kind: 'starter', left: opt('L', D(-15)), right: opt('R', D(15)) }), crisisCard]);
    const e = new Engine(c);
    const s = e.newGame(1, false);
    s.gauges.food = 88;
    e.choose(s, 'right');
    expect(s.result).toMatchObject({ type: 'defeat', gauge: 'food', bound: 'high' });
  });

  it('l’aperçu correspond à l’effet réellement appliqué', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = engine.newGame(seed, false);
      const rng = new Rng(seed);
      for (let i = 0; i < 12 && (s.phase === 'card' || s.phase === 'crisis'); i++) {
        const side: Side = rng.chance(0.5) ? 'left' : 'right';
        const before = { ...s.gauges };
        const p = engine.preview(s, side);
        const ev = engine.choose(s, side);
        if (ev.some((x) => x.type === 'reprieve')) continue;
        for (const g of ['food', 'army', 'knowledge', 'treasure'] as const) {
          const expected = Math.max(0, Math.min(100, before[g] + (p[g] ?? 0)));
          expect(s.gauges[g]).toBe(expected);
        }
      }
    }
  });

  it('aucune carte ne déplace une jauge de plus de 15 points', () => {
    const c = mini([card({ id: 'a', title: 'a', text: 'a', kind: 'starter', left: opt('L', D(-60, 60)), right: opt('R', D(1)) }), crisisCard]);
    const e = new Engine(c);
    const s = e.newGame(1, false);
    expect(e.preview(s, 'left')).toEqual({ food: -15, army: 15 });
  });

  it('le vent de l’ère s’ajoute à chaque décision, hors crise', () => {
    const c = mini([neutral('a'), neutral('b'), crisisCard]);
    c.eras[0].wind = { knowledge: -2 };
    const e = new Engine(c);
    const s = e.newGame(1, false);
    s.gauges = { food: 50, army: 50, knowledge: 50, treasure: 50 };
    expect(e.previewCard(s, 'left')).toEqual({ food: 1, army: -1 });
    expect(e.preview(s, 'left')).toEqual({ food: 1, army: -1, knowledge: -2 });
    e.choose(s, 'left');
    expect(s.gauges.knowledge).toBe(48);
    e.choose(s, 'left');
    expect(s.phase).toBe('crisis');
    expect(e.preview(s, 'left')).toEqual({ food: -2 });
  });

  it('les cartes de départ changent d’habit selon l’ère', () => {
    const sage = content.cards.s_sage;
    expect(cardFace(sage, 0).title).toBe('Le Sage');
    expect(cardFace(sage, 3).title).toBe('L’Inventeur');
    expect(cardFace(sage, 3).left).not.toBe(sage.left.text);
  });

  it('sursis : une carte dont les deux options tuent laisse au bord du gouffre, une fois par ère', () => {
    const doom = () => card({ id: 'a', title: 'a', text: 'a', kind: 'starter', left: opt('L', D(-15)), right: opt('R', D(-12)) });
    const c = mini([doom(), { ...doom(), id: 'b' }, crisisCard]);
    const e = new Engine(c);
    const s = e.newGame(1, false);
    s.gauges.food = 8;
    const ev = e.choose(s, 'left');
    expect(s.result).toBeNull();
    expect(s.gauges.food).toBe(4);
    expect(ev.some((x) => x.type === 'reprieve')).toBe(true);
    e.choose(s, 'left');
    expect(s.result).toMatchObject({ type: 'defeat', gauge: 'food' });
  });

  it('pas de sursis quand une des deux options permettait de survivre', () => {
    const c = mini([card({ id: 'a', title: 'a', text: 'a', kind: 'starter', left: opt('L', D(-15)), right: opt('R', D(5)) }), crisisCard]);
    const e = new Engine(c);
    const s = e.newGame(1, false);
    s.gauges.food = 8;
    e.choose(s, 'left');
    expect(s.result).toMatchObject({ type: 'defeat', gauge: 'food' });
  });

  it('compte les tours passés en zone de danger', () => {
    const c = mini([card({ id: 'a', title: 'a', text: 'a', kind: 'starter', left: opt('L', D(-35)), right: opt('R', D(1)) }), neutral('b'), crisisCard]);
    const e = new Engine(c);
    const s = e.newGame(3, false);
    while (s.current !== 'a') e.choose(s, 'right');
    s.gauges.food = 40;
    const before = s.dangerTurns;
    e.choose(s, 'left');
    expect(s.dangerTurns).toBe(before + 1);
  });
});

describe('moteur — deck, ères et crises', () => {
  it('parcourt le deck une fois puis déclenche la crise de l’ère', () => {
    const c = mini([neutral('a'), neutral('b'), neutral('c'), crisisCard]);
    const e = new Engine(c);
    const s = e.newGame(5, false);
    const seen: string[] = [];
    while (s.phase === 'card') {
      seen.push(s.current!);
      e.choose(s, 'left');
    }
    expect(seen.sort()).toEqual(['a', 'b', 'c']);
    expect(s.phase).toBe('crisis');
    expect(s.crisis?.id).toBe('c0');
    e.choose(s, 'left');
    expect(s.phase).toBe('reward');
  });

  it('enchaîne cinq ères jusqu’à la victoire', () => {
    const c = mini([neutral('a'), neutral('b'), crisisCard, neutral('t1', 'tech'), neutral('t2', 'tech'), neutral('t3', 'tech'), neutral('t4', 'tech')]);
    for (const id of ['t1', 't2', 't3', 't4']) c.cards[id].era = undefined;
    const e = new Engine(c);
    const s = e.newGame(5, false);
    let guard = 0;
    let flip = false;
    while (s.phase !== 'end' && guard++ < 200) {
      if (s.phase === 'reward') {
        e.pickReward(s, s.reward!.cards[0] ?? null);
        e.nextEra(s);
      } else {
        e.choose(s, (flip = !flip) ? 'left' : 'right');
      }
    }
    expect(s.result?.type).toBe('victory');
    expect(s.era).toBe(ERA_COUNT - 1);
    expect(s.deck.length).toBeGreaterThan(2);
  });

  it('la carte choisie en récompense rejoint le deck et revient à l’ère suivante', () => {
    const c = mini([neutral('a'), crisisCard, neutral('t1', 'tech')]);
    c.cards.t1.era = undefined;
    const e = new Engine(c);
    const s = e.newGame(5, false);
    e.choose(s, 'left');
    e.choose(s, 'left');
    expect(s.phase).toBe('reward');
    expect(s.reward!.cards).toEqual(['t1']);
    e.pickReward(s, 't1');
    expect(s.deck).toContain('t1');
    e.nextEra(s);
    expect(s.era).toBe(1);
    expect([s.current, ...s.drawPile].sort()).toEqual(['a', 't1']);
  });

  it('retirer une carte l’enlève du deck pour de bon', () => {
    const c = mini([neutral('a'), neutral('b'), crisisCard]);
    const e = new Engine(c);
    const s = e.newGame(5, false);
    while (s.phase !== 'reward') e.choose(s, 'left');
    e.pickReward(s, null);
    e.removeCard(s, 'a');
    e.nextEra(s);
    expect(s.deck).toEqual(['b']);
    expect([s.current, ...s.drawPile]).toEqual(['b']);
  });

  it('une carte verrouillée ne peut pas être retirée', () => {
    const locked = neutral('a');
    locked.locked = true;
    const c = mini([locked, neutral('b'), crisisCard]);
    const e = new Engine(c);
    const s = e.newGame(5, false);
    while (s.phase !== 'reward') e.choose(s, 'left');
    e.removeCard(s, 'a');
    expect(s.deck).toContain('a');
    expect(e.removableCards(s)).toEqual(['b']);
  });

  it('une conséquence à retardement arrive après le délai prévu', () => {
    const trigger = card({ id: 'a', title: 'a', text: 'a', kind: 'starter', left: opt('L', { delta: D(1), add: [{ card: 'late', delay: 2 }] }), right: opt('R', D(-1)) });
    const late = card({ id: 'late', title: 'late', text: 'late', kind: 'consequence', oneShot: true, left: opt('L', D(-1)), right: opt('R', D(-1)) });
    const c = mini([trigger, neutral('b'), neutral('c'), neutral('d'), neutral('e'), late, crisisCard]);
    const e = new Engine(c);
    const s = e.newGame(11, false);
    while (s.current !== 'a') e.choose(s, 'right');
    const remaining = s.drawPile.length;
    e.choose(s, 'left');
    expect(s.scheduled).toEqual([{ card: 'late', turns: 1, persistent: false }]);
    if (remaining >= 2) {
      expect(s.current).not.toBe('late');
      e.choose(s, 'left');
      expect(s.current).toBe('late');
    }
  });

  it('une carte à usage unique quitte le deck après avoir été jouée', () => {
    const once = neutral('once');
    once.oneShot = true;
    const c = mini([once, neutral('b'), crisisCard]);
    const e = new Engine(c);
    const s = e.newGame(5, false);
    while (s.phase === 'card') e.choose(s, 'left');
    expect(s.deck).toEqual(['b']);
  });
});

describe('moteur — synergies et merveilles', () => {
  const faith = (id: string) => {
    const c = card({ id, title: id, text: id, kind: 'starter', kw: ['Foi'], left: opt('L', { delta: D(0, 4), scale: [{ keyword: 'Foi', delta: D(0, 2) }] }), right: opt('R', D(-1)) });
    return c;
  };

  it('une carte à mot-clé est plus forte quand le deck en contient d’autres', () => {
    const solo = new Engine(mini([faith('f1'), crisisCard]));
    const s1 = solo.newGame(1, false);
    expect(solo.preview(s1, 'left')).toEqual({ army: 4 });

    const trio = new Engine(mini([faith('f1'), faith('f2'), faith('f3'), crisisCard]));
    const s3 = trio.newGame(1, false);
    expect(trio.preview(s3, 'left')).toEqual({ army: 8 });
  });

  it('la synergie est plafonnée', () => {
    const many = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'].map(faith);
    const e = new Engine(mini([...many, crisisCard]));
    const s = e.newGame(1, false);
    expect(e.preview(s, 'left')).toEqual({ army: 4 + 2 * 4 });
  });

  it('une merveille « dampen » réduit les pertes, « amplify » augmente les gains', () => {
    const c = mini([card({ id: 'a', title: 'a', text: 'a', kind: 'starter', left: opt('L', D(-10, 10)), right: opt('R', D(10, -10)) }), crisisCard], {
      wonders: [
        { id: 'w1', name: 'w1', text: '', era: 0, passive: { type: 'dampen', gauge: 'food', factor: 0.5 } },
        { id: 'w2', name: 'w2', text: '', era: 0, passive: { type: 'amplify', gauge: 'army', factor: 1.5 } },
      ],
    });
    const e = new Engine(c);
    const s = e.newGame(1, false);
    s.wonders = ['w1', 'w2'];
    expect(e.preview(s, 'left')).toEqual({ food: -5, army: 15 });
    expect(e.preview(s, 'right')).toEqual({ food: 10, army: -10 });
  });

  it('une merveille « overflow » détourne l’excès au lieu de tuer', () => {
    const c = mini([card({ id: 'a', title: 'a', text: 'a', kind: 'starter', left: opt('L', D(0, 0, 0, 15)), right: opt('R', D(-1)) }), crisisCard], {
      wonders: [{ id: 'w', name: 'w', text: '', era: 0, passive: { type: 'overflow', from: 'treasure', to: 'food', threshold: 85 } }],
    });
    const e = new Engine(c);
    const s = e.newGame(1, false);
    s.wonders = ['w'];
    s.gauges = { food: 50, army: 50, knowledge: 50, treasure: 90 };
    e.choose(s, 'left');
    expect(s.result).toBeNull();
    expect(s.gauges.treasure).toBe(85);
    expect(s.gauges.food).toBe(50 + Math.ceil(20 / 2));
  });

  it('une merveille « floor » sauve une fois, puis disparaît', () => {
    const c = mini([card({ id: 'a', title: 'a', text: 'a', kind: 'starter', left: opt('L', D(-15)), right: opt('R', D(-1)) }), neutral('b'), crisisCard], {
      wonders: [{ id: 'w', name: 'w', text: '', era: 0, passive: { type: 'floor', gauge: 'food', value: 25, once: true } }],
    });
    const e = new Engine(c);
    const s = e.newGame(1, false);
    s.wonders = ['w'];
    while (s.current !== 'a') e.choose(s, 'right');
    s.gauges.food = 15;
    e.choose(s, 'left');
    expect(s.result).toBeNull();
    expect(s.gauges.food).toBe(25);
    expect(s.wonders).toEqual([]);
  });

  it('le bouclier de crise ne s’applique que pendant une crise', () => {
    const c = mini([card({ id: 'a', title: 'a', text: 'a', kind: 'starter', left: opt('L', D(-8)), right: opt('R', D(-8)) }), card({ id: 'crisis', title: 'c', text: 'c', kind: 'crisis', left: opt('L', D(-8)), right: opt('R', D(0, -8)) })], {
      wonders: [{ id: 'w', name: 'w', text: '', era: 0, passive: { type: 'crisisShield', amount: 3 } }],
    });
    const e = new Engine(c);
    const s = e.newGame(1, false);
    s.wonders = ['w'];
    expect(e.preview(s, 'left')).toEqual({ food: -8 });
    e.choose(s, 'left');
    expect(s.phase).toBe('crisis');
    expect(e.preview(s, 'left')).toEqual({ food: -5 });
  });

  it('les branches conditionnelles dépendent des jauges', () => {
    const c = mini([card({ id: 'a', title: 'a', text: 'a', kind: 'starter', left: opt('L', { when: { gauge: 'army', gte: 60 }, then: { delta: D(5) }, else: { delta: D(-5) } }), right: opt('R', D(-1)) }), crisisCard]);
    const e = new Engine(c);
    const s = e.newGame(1, false);
    expect(e.preview(s, 'left')).toEqual({ food: -5 });
    s.gauges.army = 70;
    expect(e.preview(s, 'left')).toEqual({ food: 5 });
  });
});

describe('moteur — rivale et fins', () => {
  it('la rivale injecte des cartes au fil de la partie', () => {
    let injected = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const s = playRandom(seed);
      injected += s.history.filter((h) => content.cards[h.card].kind === 'rival').length;
    }
    expect(injected).toBeGreaterThan(10);
  });

  it('la fin dépend du deck et des jauges', () => {
    const s = engine.newGame(1, false);
    s.deck = ['r_ecriture', 'r_bibliotheque', 'r_universite', 'r_laboratoire'];
    s.gauges.knowledge = 75;
    expect(engine.computeEnding(s)).toBe('science');
    s.deck = ['r_caserne', 'r_phalange', 'r_chevaliers', 'r_artillerie'];
    s.gauges.knowledge = 40;
    s.gauges.army = 75;
    expect(engine.computeEnding(s)).toBe('military');
    s.deck = ['r_temple', 'r_theatre', 'r_marche', 'r_musee', 'r_bardes', 'r_guilde'];
    s.gauges.army = 40;
    expect(engine.computeEnding(s)).toBe('culture');
  });

  it('les récompenses proposent trois cartes distinctes absentes du deck', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = engine.newGame(seed, false);
      const rng = new Rng(seed);
      let guard = 0;
      while (s.phase !== 'end' && s.phase !== 'reward' && guard++ < 200) engine.choose(s, rng.chance(0.5) ? 'left' : 'right');
      if (s.phase !== 'reward') continue;
      const offer = s.reward!.cards;
      expect(offer.length).toBe(3);
      expect(new Set(offer).size).toBe(3);
      for (const id of offer) expect(s.deck).not.toContain(id);
    }
  });
});
