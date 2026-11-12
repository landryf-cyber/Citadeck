/**
 * Joueurs automatiques V2.
 * - « lecteur » : simule chaque option sur une copie de la partie (il « lit » tout, y compris les effets cachés)
 * - « indicateurs » : ne voit que ce que l'interface affiche (coûts, exigences, emblèmes, sablier, avertissements, chances)
 * Les profils (prudent, gourmand, spécialistes) changent la fonction de valeur du lecteur.
 */
import { Rng } from '../core/rng';
import type { Engine, OptionView } from '../core/engine';
import { FAMILIES, RES, type GameState, type Res } from '../core/types';

export interface Profile {
  name: string;
  sight: 'reader' | 'indicator' | 'random';
  /** dessein imposé (sinon tiré au hasard) */
  dessein?: string;
  /** poids de la sécurité (quartiers, réserves) */
  safety: number;
  /** poids du dessein (jalons, ressource du dessein) */
  ambition: number;
  /** goût du risque pour les paris (0 = fuit, 1 = neutre, 2 = aime) */
  risk: number;
  /** réserve visée par ressource */
  reserve: number;
}

export const PROFILES: Profile[] = [
  { name: 'lecteur', sight: 'reader', safety: 1, ambition: 1, risk: 1, reserve: 4 },
  { name: 'indicateurs seuls', sight: 'indicator', safety: 1, ambition: 1, risk: 1, reserve: 4 },
  { name: 'prudent', sight: 'reader', safety: 2.2, ambition: 0.6, risk: 0.3, reserve: 8 },
  { name: 'gourmand', sight: 'reader', safety: 0.15, ambition: 2.5, risk: 2, reserve: 0 },
  { name: 'étoiles', sight: 'reader', dessein: 'etoiles', safety: 1, ambition: 1.4, risk: 1, reserve: 4 },
  { name: 'empire', sight: 'reader', dessein: 'empire', safety: 1, ambition: 1.4, risk: 1, reserve: 4 },
  { name: 'postérité', sight: 'reader', dessein: 'posterite', safety: 1, ambition: 1.4, risk: 1, reserve: 4 },
  { name: 'aléatoire', sight: 'random', safety: 1, ambition: 1, risk: 1, reserve: 0 },
];

const CRISIS_RES: Res[][] = [['armee'], ['savoir', 'vivres'], ['tresor', 'vivres', 'armee'], ['armee', 'tresor'], ['savoir', 'tresor', 'armee', 'vivres']];

/** Valeur d'une situation, du point de vue d'un profil. */
export function stateValue(e: Engine, s: GameState, p: Profile): number {
  if (s.result?.type === 'defaite') return -1e6 + s.era * 1000;
  let v = 0;
  v += s.quartiers * 40 * p.safety + (s.quartiers <= 1 ? -80 * p.safety : 0);
  const d = e.dessein(s);
  const dres = (Object.keys(d.jalons[Math.min(4, s.era)].cost) as Res[])[0];
  for (const r of RES) {
    const x = s.res[r];
    // rendements décroissants ; la ressource du dessein et celle de la crise valent plus
    let w = 1.6;
    if (r === dres) w += 1.2 * p.ambition;
    if (CRISIS_RES[Math.min(4, s.era)].includes(r)) w += 0.8 * p.safety;
    v += w * Math.min(x, 18) + 0.4 * Math.max(0, x - 18) - (x < p.reserve ? (p.reserve - x) * 1.5 * p.safety : 0);
  }
  for (const f of FAMILIES) {
    const st = s.fam[f];
    if (st.state !== 'presente') {
      v -= 25;
      continue;
    }
    // un joueur gourmand regarde ses coffres plus que l'humeur de ses familles
    v += st.loy * 7 * (0.3 + 0.7 * Math.min(1, p.safety)) + (st.loy <= -2 ? -18 * p.safety : 0) + (st.loy >= 2 ? 6 : 0);
  }
  // une créance annoncée (sablier, détail du crédit) se paiera : en Trésor ou en quartier
  v -= s.sched.filter((x) => /^creance/.test(x.card)).length * 30 * Math.max(0.5, p.safety);
  // ce que rapportent les découvertes et merveilles pour le reste de la partie
  const left = Math.max(0, (4 - s.era) * 2 + (1 - s.saison));
  for (const ps of e.passives(s)) {
    if (ps.type === 'income') v += ps.amount * left * 1.3;
    else if (ps.type === 'shield') v += 25 * p.safety;
    else if (ps.type === 'discount') v += 8;
    else if (ps.type === 'tagBonus') v += 10 * ps.amount;
    else if (ps.type === 'loyalty') v += 12;
  }
  v += s.jalons.filter(Boolean).length * 70 * p.ambition;
  v += e.tagCount(s, d.tag) * 5 * p.ambition;
  v += s.rivalRel * 3 - s.rivalJalons * 4;
  if (s.result?.type === 'victoire') v += 500 + s.result.jalons * 120 * p.ambition;
  return v;
}

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s)) as GameState;
}

export function chooseIndex(e: Engine, s: GameState, p: Profile, rng: Rng): number {
  const view = e.view(s)!;
  const enabled = view.options.map((o, i) => ({ o, i })).filter((x) => x.o.enabled);
  if (enabled.length === 0) return 0;
  if (enabled.length === 1) return enabled[0].i;
  if (p.sight === 'random') return rng.pick(enabled).i;
  if (p.sight === 'indicator') return indicatorChoice(view.options, enabled, rng);
  // lecteur : simule chaque option ; les paris sont estimés sur plusieurs tirages
  let best = enabled[0].i;
  let bestV = -Infinity;
  for (const { o, i } of enabled) {
    const samples = o.odds !== undefined ? 4 : 1;
    let sum = 0;
    for (let k = 0; k < samples; k++) {
      const c = clone(s);
      if (samples > 1) c.rng = new Rng(rng.nextU32()).getState();
      e.act(c, i);
      sum += stateValue(e, c, p);
    }
    let v = sum / samples;
    if (o.odds !== undefined) v -= (1 - o.odds) * 30 * (1 - Math.min(1, p.risk));
    v += rng.range(-3, 3);
    if (v > bestV) {
      bestV = v;
      best = i;
    }
  }
  return best;
}

/** Ne voit que l'interface : le moins cher, en évitant les avertissements, en suivant les bonnes chances. */
function indicatorChoice(all: OptionView[], enabled: { o: OptionView; i: number }[], rng: Rng): number {
  let best = enabled[0].i;
  let bestV = -Infinity;
  for (const { o, i } of enabled) {
    const cost = RES.reduce((a, r) => a + (o.cost[r] ?? 0), 0) + RES.reduce((a, r) => a + (o.loss?.[r] ?? 0), 0);
    let v = -cost * 2;
    // ce que l'interface montre aussi : le genre de gain, le sens de l'effet sur les familles, les quartiers perdus
    for (const r of RES) v += (o.gains?.[r] ?? 0) * 3;
    for (const r of RES) v -= (o.spend?.[r] ?? 0) * 1.5;
    for (const d of Object.values(o.famDir ?? {})) v += (d ?? 0) * 3;
    v -= (o.lossQ ?? 0) * 25;
    if (o.warn) v -= 6;
    if (o.odds !== undefined) v += (o.odds - 0.5) * 10;
    if (o.req) v += 4; // une option réservée a l'air d'une bonne affaire
    v += rng.range(-4, 4);
    if (v > bestV) {
      bestV = v;
      best = i;
    }
  }
  void all;
  return best;
}
