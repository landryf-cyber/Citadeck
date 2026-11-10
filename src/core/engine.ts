import { Rng } from './rng';
import type { Content } from './content';
import {
  GAUGES,
  KEYWORDS,
  DANGER_HIGH,
  DANGER_LOW,
  type CardDef,
  type Condition,
  type Delta,
  type Effect,
  type EndingId,
  type GameState,
  type GaugeId,
  type Gauges,
  type Keyword,
  type Side,
  type WonderDef,
} from './types';

export const SAVE_VERSION = 3;
export const ERA_COUNT = 5;
export const START_GAUGE = 50;

export type GameEvent =
  | { type: 'gauges'; delta: Delta; before: Gauges; after: Gauges }
  | { type: 'cardAdded'; card: string; delay: number; persistent: boolean }
  | { type: 'cardRemoved'; card: string }
  | { type: 'wonder'; id: string }
  | { type: 'flag'; flag: string }
  | { type: 'rival'; delta: number; relation: number }
  | { type: 'rivalCard'; card: string }
  | { type: 'crisisStart'; id: string }
  | { type: 'crisisEnd'; id: string }
  | { type: 'reward' }
  | { type: 'eraStart'; era: number }
  | { type: 'defeat'; gauge: GaugeId; bound: 'low' | 'high'; card: string }
  | { type: 'victory'; ending: EndingId }
  | { type: 'draw'; card: string };

export class Engine {
  constructor(public readonly content: Content) {}

  // ---------------------------------------------------------------- création

  newGame(seed: number, tutorial: boolean): GameState {
    const rng = new Rng(seed);
    const state: GameState = {
      version: SAVE_VERSION,
      seed,
      rng: rng.getState(),
      era: 0,
      turn: 0,
      eraTurn: 0,
      gauges: { food: START_GAUGE, army: START_GAUGE, knowledge: START_GAUGE, treasure: START_GAUGE },
      deck: this.content.starters.slice(),
      drawPile: [],
      scheduled: [],
      phase: 'card',
      current: null,
      crisis: null,
      reward: null,
      wonders: [],
      flags: [],
      rival: {
        name: rng.pick(this.content.rival.names),
        progress: 0,
        relation: 0,
        alive: true,
        lastTrigger: 0,
      },
      history: [],
      dangerTurns: 0,
      seen: [],
      offered: [],
      result: null,
      tutorial,
      growth: 0,
    };
    state.rng = rng.getState();
    this.buildEraPile(state, rng);
    state.rng = rng.getState();
    this.drawNext(state, rng);
    state.rng = rng.getState();
    return state;
  }

  card(id: string): CardDef {
    const c = this.content.cards[id];
    if (!c) throw new Error(`Carte inconnue : ${id}`);
    return c;
  }

  currentCard(state: GameState): CardDef | null {
    return state.current ? this.card(state.current) : null;
  }

  wonder(id: string): WonderDef {
    const w = this.content.wonders.find((x) => x.id === id);
    if (!w) throw new Error(`Merveille inconnue : ${id}`);
    return w;
  }

  // ---------------------------------------------------------------- deck

  private buildEraPile(state: GameState, rng: Rng): void {
    const era = state.era;
    const pool = this.content.eraPools[era] ?? [];
    const packSize = this.content.eras[era]?.packSize ?? 6;
    const pack = rng.sample(pool, Math.min(packSize, pool.length));
    const pile = state.deck.slice().concat(pack);
    rng.shuffle(pile);
    if (era === 0 && state.tutorial) {
      pile.unshift(...this.content.tutorial);
    }
    // Les cartes planifiées pour "au cours de l'ère" (delay 0) sont mélangées.
    state.drawPile = pile;
    state.eraTurn = 0;
  }

  keywordCount(state: GameState, keyword: Keyword, excluding?: string): number {
    let n = 0;
    for (const id of state.deck) {
      if (id === excluding) continue;
      const c = this.content.cards[id];
      if (c?.keywords?.includes(keyword)) n++;
    }
    for (const w of state.wonders) {
      const wd = this.content.wonders.find((x) => x.id === w);
      if (wd?.keywords?.includes(keyword)) n++;
    }
    return n;
  }

  keywordCounts(state: GameState): Record<Keyword, number> {
    const out = { Foi: 0, Guerre: 0, Commerce: 0, Science: 0, Culture: 0, Nature: 0 };
    for (const k of Object.keys(out) as Keyword[]) out[k] = this.keywordCount(state, k);
    return out;
  }

  // ---------------------------------------------------------------- conditions & effets

  checkCondition(state: GameState, cond: Condition | undefined): boolean {
    if (!cond) return true;
    if (cond.gauge) {
      const v = state.gauges[cond.gauge];
      if (cond.gte !== undefined && v < cond.gte) return false;
      if (cond.lte !== undefined && v > cond.lte) return false;
    }
    if (cond.keyword) {
      if (this.keywordCount(state, cond.keyword) < (cond.min ?? 1)) return false;
    }
    if (cond.wonder && !state.wonders.includes(cond.wonder)) return false;
    if (cond.flag && !state.flags.includes(cond.flag)) return false;
    if (cond.notFlag && state.flags.includes(cond.notFlag)) return false;
    if (cond.rivalGte !== undefined && state.rival.relation < cond.rivalGte) return false;
    if (cond.rivalLte !== undefined && state.rival.relation > cond.rivalLte) return false;
    return true;
  }

  /** Résout les branches conditionnelles d'un effet. */
  resolveEffect(state: GameState, effect: Effect): Effect {
    if (effect.when) {
      if (this.checkCondition(state, effect.when)) return effect.then ? this.resolveEffect(state, effect.then) : effect;
      return effect.else ? this.resolveEffect(state, effect.else) : {};
    }
    return effect;
  }

  /** Calcule le delta final (synergies, merveilles, crise) sans l'appliquer. */
  computeDelta(state: GameState, card: CardDef, effect: Effect): Delta {
    const resolved = this.resolveEffect(state, effect);
    const delta: Delta = { ...(resolved.delta ?? {}) };
    for (const s of resolved.scale ?? []) {
      const n = Math.min(this.keywordCount(state, s.keyword, card.id), s.cap ?? 4);
      for (const g of GAUGES) {
        const v = s.delta[g];
        if (v) delta[g] = (delta[g] ?? 0) + v * n;
      }
    }
    const inCrisis = state.phase === 'crisis';
    for (const wid of state.wonders) {
      const p = this.wonder(wid).passive;
      for (const g of GAUGES) {
        const v = delta[g];
        if (!v) continue;
        if (p.type === 'dampen' && p.gauge === g && v < 0) delta[g] = v * p.factor;
        if (p.type === 'amplify' && p.gauge === g && v > 0) delta[g] = v * p.factor;
        if (p.type === 'keywordBonus' && v > 0 && card.keywords?.includes(p.keyword)) delta[g] = v + p.bonus;
        if (p.type === 'crisisShield' && inCrisis && v < 0) delta[g] = Math.min(0, v + p.amount);
      }
    }
    for (const g of GAUGES) {
      if (delta[g] !== undefined) delta[g] = Math.round(delta[g]!);
      if (delta[g] === 0) delete delta[g];
    }
    return delta;
  }

  /** Aperçu de l'effet d'une option (direction et intensité, pour l'interface). */
  preview(state: GameState, side: Side): Delta {
    const card = this.currentCard(state);
    if (!card) return {};
    return this.computeDelta(state, card, card[side].effect);
  }

  private applyDelta(state: GameState, delta: Delta, events: GameEvent[]): void {
    const before = { ...state.gauges };
    const after = { ...state.gauges };
    for (const g of GAUGES) {
      const v = delta[g];
      if (!v) continue;
      after[g] = after[g] + v;
    }
    // Merveilles : débordement et plancher
    for (const wid of state.wonders.slice()) {
      const p = this.wonder(wid).passive;
      if (p.type === 'overflow' && after[p.from] > p.threshold) {
        const excess = after[p.from] - p.threshold;
        after[p.from] = p.threshold;
        after[p.to] += Math.ceil(excess / 2);
      }
      if (p.type === 'floor') {
        if (after[p.gauge] <= 0) {
          after[p.gauge] = p.value;
          state.wonders = state.wonders.filter((x) => x !== wid);
          events.push({ type: 'flag', flag: `wonderSpent:${wid}` });
        }
      }
    }
    for (const g of GAUGES) after[g] = Math.max(0, Math.min(100, after[g]));
    state.gauges = after;
    const realDelta: Delta = {};
    for (const g of GAUGES) if (after[g] !== before[g]) realDelta[g] = after[g] - before[g];
    events.push({ type: 'gauges', delta: realDelta, before, after });
  }

  private applyEffect(state: GameState, card: CardDef, effect: Effect, rng: Rng, events: GameEvent[]): void {
    const resolved = this.resolveEffect(state, effect);
    const delta = this.computeDelta(state, card, effect);
    this.applyDelta(state, delta, events);
    for (const f of resolved.flags ?? []) {
      if (!state.flags.includes(f)) {
        state.flags.push(f);
        events.push({ type: 'flag', flag: f });
      }
    }
    for (const f of resolved.unflags ?? []) state.flags = state.flags.filter((x) => x !== f);
    for (const id of resolved.remove ?? []) this.removeFromDeck(state, id, events);
    for (const a of resolved.add ?? []) {
      this.addCard(state, a.card, a.delay ?? -1, !!a.persistent, rng, events);
    }
    if (resolved.rival) {
      let d = resolved.rival;
      if (d < 0) {
        for (const wid of state.wonders) {
          const p = this.wonder(wid).passive;
          if (p.type === 'rivalCalm') d = Math.min(0, d + p.amount);
        }
      }
      state.rival.relation = Math.max(-100, Math.min(100, state.rival.relation + d));
      events.push({ type: 'rival', delta: d, relation: state.rival.relation });
    }
    if (resolved.wonder && !state.wonders.includes(resolved.wonder)) {
      state.wonders.push(resolved.wonder);
      events.push({ type: 'wonder', id: resolved.wonder });
    }
  }

  addCard(state: GameState, id: string, delay: number, persistent: boolean, rng: Rng, events: GameEvent[]): void {
    if (persistent && !state.deck.includes(id)) state.deck.push(id);
    if (delay >= 0) {
      state.scheduled.push({ card: id, turns: delay, persistent });
    } else {
      // mélangée dans le reste de la pioche
      const pos = rng.int(0, state.drawPile.length);
      state.drawPile.splice(pos, 0, id);
    }
    events.push({ type: 'cardAdded', card: id, delay, persistent });
  }

  removeFromDeck(state: GameState, id: string, events: GameEvent[]): boolean {
    const i = state.deck.indexOf(id);
    if (i < 0) return false;
    state.deck.splice(i, 1);
    state.drawPile = state.drawPile.filter((x) => x !== id);
    state.scheduled = state.scheduled.filter((x) => x.card !== id);
    events.push({ type: 'cardRemoved', card: id });
    return true;
  }

  // ---------------------------------------------------------------- tour de jeu

  inDanger(g: Gauges): GaugeId[] {
    return GAUGES.filter((k) => g[k] <= DANGER_LOW || g[k] >= DANGER_HIGH);
  }

  private checkDefeat(state: GameState, card: CardDef, events: GameEvent[]): boolean {
    for (const g of GAUGES) {
      const v = state.gauges[g];
      if (v <= 0 || v >= 100) {
        const bound = v <= 0 ? 'low' : 'high';
        state.result = { type: 'defeat', gauge: g, bound, card: card.id };
        state.phase = 'end';
        events.push({ type: 'defeat', gauge: g, bound, card: card.id });
        return true;
      }
    }
    return false;
  }

  /** Le joueur tranche la carte courante. */
  choose(state: GameState, side: Side): GameEvent[] {
    const events: GameEvent[] = [];
    if (state.phase !== 'card' && state.phase !== 'crisis') return events;
    const card = this.currentCard(state);
    if (!card) return events;
    const rng = Rng.fromState(state.rng);

    this.applyEffect(state, card, card[side].effect, rng, events);
    state.turn++;
    state.eraTurn++;
    state.growth++;
    if (!state.seen.includes(card.id)) state.seen.push(card.id);
    const kwc = this.keywordCounts(state);
    state.history.push({
      turn: state.turn,
      era: state.era,
      card: card.id,
      side,
      gauges: { ...state.gauges },
      kw: KEYWORDS.map((k) => kwc[k]),
      wonders: state.wonders.slice(),
    });
    if (this.inDanger(state.gauges).length > 0) state.dangerTurns++;
    if (card.oneShot) this.removeFromDeck(state, card.id, events);

    if (this.checkDefeat(state, card, events)) {
      state.rng = rng.getState();
      return events;
    }

    // cartes planifiées
    for (const s of state.scheduled) s.turns--;
    const due = state.scheduled.filter((s) => s.turns <= 0);
    state.scheduled = state.scheduled.filter((s) => s.turns > 0);
    for (const d of due.reverse()) state.drawPile.unshift(d.card);

    if (state.phase === 'card') {
      this.tickRival(state, rng, events);
      if (state.drawPile.length === 0) {
        this.startCrisis(state, rng, events);
      } else {
        this.drawNext(state, rng);
        events.push({ type: 'draw', card: state.current! });
      }
    } else {
      // crise
      const cr = state.crisis!;
      cr.index++;
      if (cr.index >= cr.cards.length) {
        events.push({ type: 'crisisEnd', id: cr.id });
        state.crisis = null;
        this.endEra(state, rng, events);
      } else {
        state.current = cr.cards[cr.index];
        events.push({ type: 'draw', card: state.current });
      }
    }
    state.rng = rng.getState();
    return events;
  }

  private drawNext(state: GameState, _rng: Rng): void {
    state.current = state.drawPile.shift() ?? null;
  }

  // ---------------------------------------------------------------- rivale

  private tickRival(state: GameState, rng: Rng, events: GameEvent[]): void {
    const r = state.rival;
    if (!r.alive) return;
    r.progress += rng.int(1, 3) + (state.era >= 3 ? 1 : 0);
    const interval = 11 + rng.int(0, 4);
    if (r.progress - r.lastTrigger >= interval && state.drawPile.length > 0) {
      r.lastTrigger = r.progress;
      const pool = r.relation <= -20 ? this.content.rival.hostile : r.relation >= 20 ? this.content.rival.friendly : this.content.rival.neutral;
      const eligible = pool.filter((id) => {
        const c = this.content.cards[id];
        return c && (c.era === undefined || c.era <= state.era) && this.checkCondition(state, c.requires);
      });
      if (eligible.length === 0) return;
      const id = rng.pick(eligible);
      const pos = rng.int(0, Math.min(3, state.drawPile.length));
      state.drawPile.splice(pos, 0, id);
      events.push({ type: 'rivalCard', card: id });
    }
    // la relation glisse lentement vers la neutralité
    if (state.turn % 5 === 0 && r.relation !== 0) r.relation += r.relation > 0 ? -1 : 1;
  }

  // ---------------------------------------------------------------- crises

  private startCrisis(state: GameState, rng: Rng, events: GameEvent[]): void {
    const def = this.content.crises.find((c) => c.era === state.era) ?? this.content.crises[state.era];
    const cards = def.cards.slice();
    if (def.extra && def.extraCount) {
      const eligible = def.extra.filter((id) => this.checkCondition(state, this.content.cards[id]?.requires));
      cards.push(...rng.sample(eligible, Math.min(def.extraCount, eligible.length)));
    }
    state.crisis = { id: def.id, index: 0, cards };
    state.phase = 'crisis';
    state.current = cards[0];
    events.push({ type: 'crisisStart', id: def.id });
    events.push({ type: 'draw', card: cards[0] });
  }

  private endEra(state: GameState, rng: Rng, events: GameEvent[]): void {
    if (state.era >= ERA_COUNT - 1) {
      const ending = this.computeEnding(state);
      state.result = { type: 'victory', ending };
      state.phase = 'end';
      state.current = null;
      events.push({ type: 'victory', ending });
      return;
    }
    state.reward = this.makeRewardOffer(state, rng);
    state.phase = 'reward';
    state.current = null;
    events.push({ type: 'reward' });
  }

  // ---------------------------------------------------------------- récompenses

  private makeRewardOffer(state: GameState, rng: Rng): { cards: string[]; wonder?: string } {
    const nextEra = state.era + 1;
    const eligible = this.content.rewards.filter((id) => {
      const c = this.content.cards[id];
      if (!c) return false;
      if (state.deck.includes(id) || state.offered.includes(id)) return false;
      if (c.era !== undefined && c.era > nextEra) return false;
      if (c.era !== undefined && c.era < nextEra - 1) return false;
      return this.checkCondition(state, c.requires);
    });
    const ofEra = eligible.filter((id) => this.content.cards[id].era === nextEra);
    const older = eligible.filter((id) => this.content.cards[id].era !== nextEra);
    const picks: string[] = [];
    const a = rng.shuffle(ofEra.slice());
    const b = rng.shuffle(older.slice());
    // 2 cartes de l'ère qui commence, 1 plus ancienne, puis on complète.
    while (picks.length < 2 && a.length) picks.push(a.shift()!);
    while (picks.length < 3 && b.length) picks.push(b.shift()!);
    while (picks.length < 3 && a.length) picks.push(a.shift()!);
    // diversité : au plus 2 cartes partageant le même premier mot-clé
    rng.shuffle(picks);
    state.offered.push(...picks);

    let wonder: string | undefined;
    // Une merveille est proposée aux ères 1, 3 (fin d'ère 0 et 2), et avec une chance ailleurs.
    const wonderChance = state.era === 0 || state.era === 2 ? 1 : 0.5;
    if (rng.chance(wonderChance)) {
      const ws = this.content.wonders.filter(
        (w) => !state.wonders.includes(w.id) && w.era <= nextEra && this.checkCondition(state, w.requires),
      );
      if (ws.length) {
        // préférer une merveille dont les mots-clés sont dans le deck
        const counts = this.keywordCounts(state);
        const scored = ws.map((w) => ({ w, s: (w.keywords ?? []).reduce((acc, k) => acc + counts[k], 0) + rng.next() * 1.5 }));
        scored.sort((x, y) => y.s - x.s);
        wonder = scored[0].w.id;
      }
    }
    return { cards: picks, wonder };
  }

  /** Le joueur choisit une carte de récompense (ou aucune). */
  pickReward(state: GameState, cardId: string | null): GameEvent[] {
    const events: GameEvent[] = [];
    if (state.phase !== 'reward' || !state.reward) return events;
    if (cardId && state.reward.cards.includes(cardId) && !state.deck.includes(cardId)) {
      state.deck.push(cardId);
      events.push({ type: 'cardAdded', card: cardId, delay: -1, persistent: true });
    }
    if (state.reward.wonder && !state.wonders.includes(state.reward.wonder)) {
      state.wonders.push(state.reward.wonder);
      events.push({ type: 'wonder', id: state.reward.wonder });
    }
    state.reward = { cards: [], wonder: undefined };
    return events;
  }

  /** Le joueur retire une carte de son deck (facultatif). */
  removeCard(state: GameState, cardId: string): GameEvent[] {
    const events: GameEvent[] = [];
    if (state.phase !== 'reward') return events;
    const c = this.content.cards[cardId];
    if (!c || c.locked) return events;
    this.removeFromDeck(state, cardId, events);
    return events;
  }

  /** Cartes du deck que le joueur peut retirer. */
  removableCards(state: GameState): string[] {
    return state.deck.filter((id) => !this.content.cards[id]?.locked);
  }

  /** Passe à l'ère suivante. */
  nextEra(state: GameState): GameEvent[] {
    const events: GameEvent[] = [];
    if (state.phase !== 'reward') return events;
    const rng = Rng.fromState(state.rng);
    state.era++;
    state.reward = null;
    state.phase = 'card';
    for (const wid of state.wonders) {
      const p = this.wonder(wid).passive;
      if (p.type === 'eraDrift') this.applyDelta(state, p.delta, events);
    }
    // Les jauges extrêmes se détendent légèrement au changement d'ère (nouveau départ, pas gratuit).
    this.buildEraPile(state, rng);
    this.drawNext(state, rng);
    events.push({ type: 'eraStart', era: state.era });
    events.push({ type: 'draw', card: state.current! });
    state.rng = rng.getState();
    return events;
  }

  // ---------------------------------------------------------------- fins

  endingScores(state: GameState): Record<EndingId, number> {
    const counts = this.keywordCounts(state);
    const g = state.gauges;
    const flag = (f: string) => (state.flags.includes(f) ? 1 : 0);
    return {
      science: counts.Science * 2 + g.knowledge / 10 + flag('endingScience') * 6 + flag('rocket') * 3,
      military: counts.Guerre * 2 + g.army / 10 + flag('endingMilitary') * 6 + flag('rivalDefeated') * 4,
      culture: (counts.Foi + counts.Culture + counts.Commerce) * 1.2 + (g.treasure + g.food) / 20 + flag('endingCulture') * 6 + flag('rivalAllied') * 3,
    };
  }

  computeEnding(state: GameState): EndingId {
    const s = this.endingScores(state);
    let best: EndingId = 'culture';
    for (const k of ['science', 'military', 'culture'] as EndingId[]) if (s[k] > s[best]) best = k;
    return best;
  }

  /** Archétype dominant du deck (pour le résumé et la scène). */
  dominantKeyword(state: GameState): Keyword | null {
    const counts = this.keywordCounts(state);
    let best: Keyword | null = null;
    for (const k of Object.keys(counts) as Keyword[]) {
      if (counts[k] > 0 && (best === null || counts[k] > counts[best])) best = k;
    }
    return best;
  }
}
