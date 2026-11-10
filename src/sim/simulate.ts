/** Joue des parties entières avec des bots et agrège les statistiques d'équilibrage. */
import { Engine, ERA_COUNT } from '../core/engine';
import { Rng } from '../core/rng';
import { GAUGES, type GameState, type GaugeId } from '../core/types';
import type { Content } from '../core/content';
import type { Bot } from './bots';

export interface BotStats {
  name: string;
  games: number;
  wins: number;
  reachedLastEra: number;
  eraReached: number[];
  turns: number;
  dangerTurns: number;
  deaths: Record<GaugeId, { low: number; high: number }>;
  endings: Record<string, number>;
  winDominant: Record<string, number>;
}

export interface CardStats {
  left: number;
  right: number;
  kills: number;
}

export interface RewardStats {
  offered: number;
  picked: number;
  offeredInWins: number;
  pickedInWins: number;
}

export interface SimResult {
  bots: BotStats[];
  /** choix agrégés des bots compétents, par carte */
  cards: Record<string, CardStats>;
  rewards: Record<string, RewardStats>;
  /** niveau moyen de chaque jauge sur tous les tours des bots compétents */
  levels: Record<GaugeId, number>;
}

export function playGame(engine: Engine, bot: Bot, seed: number, onChoice?: (s: GameState, card: string, side: 'left' | 'right') => void, onReward?: (offer: string[], pick: string | null) => void): GameState {
  const s = engine.newGame(seed, false);
  const rng = new Rng((seed * 2654435761) >>> 0);
  let guard = 0;
  while (s.phase !== 'end' && guard++ < 2000) {
    if (s.phase === 'reward') {
      const offer = s.reward!.cards.slice();
      const r = bot.reward(engine, s, rng);
      onReward?.(offer, r.pick);
      engine.pickReward(s, r.pick);
      if (r.remove) engine.removeCard(s, r.remove);
      engine.nextEra(s);
    } else {
      const side = bot.choose(engine, s, rng);
      const card = s.current!;
      engine.choose(s, side);
      onChoice?.(s, card, side);
    }
  }
  return s;
}

export function simulate(content: Content, bots: Bot[], games: number, seed0 = 1): SimResult {
  const engine = new Engine(content);
  const cards: Record<string, CardStats> = {};
  const rewards: Record<string, RewardStats> = {};
  const out: BotStats[] = [];
  const lv: Record<GaugeId, number> = { food: 0, army: 0, knowledge: 0, treasure: 0 };
  let lvN = 0;
  for (const bot of bots) {
    const st: BotStats = {
      name: bot.name,
      games,
      wins: 0,
      reachedLastEra: 0,
      eraReached: new Array(ERA_COUNT).fill(0),
      turns: 0,
      dangerTurns: 0,
      deaths: { food: { low: 0, high: 0 }, army: { low: 0, high: 0 }, knowledge: { low: 0, high: 0 }, treasure: { low: 0, high: 0 } },
      endings: {},
      winDominant: {},
    };
    for (let i = 0; i < games; i++) {
      const offers: { offer: string[]; pick: string | null }[] = [];
      const s = playGame(
        engine,
        bot,
        seed0 + i * 7919,
        bot.competent
          ? (_s, card, side) => {
              const c = (cards[card] ??= { left: 0, right: 0, kills: 0 });
              c[side]++;
            }
          : undefined,
        bot.competent ? (offer, pick) => offers.push({ offer, pick }) : undefined,
      );
      st.turns += s.turn;
      st.dangerTurns += s.dangerTurns;
      if (bot.competent) {
        for (const h of s.history) {
          for (const g of GAUGES) lv[g] += h.gauges[g];
          lvN++;
        }
      }
      st.eraReached[s.era]++;
      if (s.era === ERA_COUNT - 1) st.reachedLastEra++;
      const res = s.result!;
      const won = res.type === 'victory';
      if (won) {
        st.wins++;
        st.endings[res.ending!] = (st.endings[res.ending!] ?? 0) + 1;
        const dom = engine.dominantKeyword(s) ?? 'aucun';
        st.winDominant[dom] = (st.winDominant[dom] ?? 0) + 1;
      } else {
        st.deaths[res.gauge!][res.bound!]++;
        if (bot.competent && res.card) (cards[res.card] ??= { left: 0, right: 0, kills: 0 }).kills++;
      }
      for (const o of offers) {
        for (const id of o.offer) {
          const r = (rewards[id] ??= { offered: 0, picked: 0, offeredInWins: 0, pickedInWins: 0 });
          r.offered++;
          if (won) r.offeredInWins++;
          if (o.pick === id) {
            r.picked++;
            if (won) r.pickedInWins++;
          }
        }
      }
    }
    out.push(st);
  }
  for (const g of GAUGES) lv[g] = lvN ? lv[g] / lvN : 50;
  return { bots: out, cards, rewards, levels: lv };
}

export function deathShares(st: BotStats[]): Record<GaugeId, number> {
  const tot: Record<GaugeId, number> = { food: 0, army: 0, knowledge: 0, treasure: 0 };
  let all = 0;
  for (const b of st) for (const g of GAUGES) {
    const n = b.deaths[g].low + b.deaths[g].high;
    tot[g] += n;
    all += n;
  }
  for (const g of GAUGES) tot[g] = all ? tot[g] / all : 0;
  return tot;
}
