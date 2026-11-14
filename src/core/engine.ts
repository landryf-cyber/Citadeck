/**
 * Citadeck V2 — moteur de jeu, pur et déterministe (graine).
 * Le joueur répond à des « invites » (prompt) ; chaque invite est une carte à 1..4 options.
 */
import { Rng, hashString } from '../core/rng';
import type { Content } from './content';
import { eraDate, fill, civName, capitalize, setCrisisK, ERA_NAMES, ERA_SUBTITLES, ERA_SCALE } from './text';
import {
  FAMILIES, RES, RES_LABEL, TAGS,
  type Bag, type CardDef, type Cond, type Effect, type FamilyId, type GameState, type Option,
  type EraForm, type Jalon, type OriginDef, type Passive, type Prompt, type Res, type Resources, type RuinInfo, type Tag,
} from './types';

export const SAVE_VERSION = 27;
export const ERAS = 5;
/** la Course : la rivale achève sa merveille à la fin de cette saison */
export const RACE_END = 3;
export const SAISON_CARDS = 4; // valeur par défaut, voir TUNING.cards
/** Réglages d'équilibrage (balayés par src/sim/sweep.ts) */
export const TUNING = { crisisK: 1.25, armyDecay: 0.3, treasureDecay: 0.2, growthBase: 3, envy: 0.1, iron: 1.2, upkeep: 1.65, gain: 1.0, cards: 3, wonderUpkeep: 1 };
export { ERA_SCALE };
/** fourchettes des gains affichés */
export const GAIN_RANGES = ['', '1 à 2', '3 à 5', '6 à 9', '10 à 15', '16 et plus'];
/** fourchettes des gains : larges d'abord, plus fines avec la Science et les merveilles, exactes contre du Savoir */
export const GAIN_WIDE: [number, number][] = [[1, 2], [3, 5], [6, 9], [10, 15], [16, 99]];
export const GAIN_NARROW: [number, number][] = [[1, 1], [2, 2], [3, 4], [5, 6], [7, 9], [10, 12], [13, 15], [16, 20], [21, 99]];
export function gainText([lo, hi]: [number, number], sep = '–'): string {
  return lo === hi ? `${lo}` : hi >= 99 ? `${lo}${sep === '–' ? '+' : ' et plus'}` : `${lo}${sep}${hi}`;
}
const scaleN = (n: number, era: number) => (n === 0 ? 0 : Math.sign(n) * Math.max(1, Math.round(Math.abs(n) * ERA_SCALE[era])));
const scaleBag = (b: Bag | undefined, era: number): Bag | undefined => {
  if (!b) return b;
  const o: Bag = {};
  for (const k of Object.keys(b) as Res[]) o[k] = scaleN(b[k]!, era);
  return o;
};
/** Une option d'une carte « à l'échelle », ramenée à l'ère en cours. */
function scaleOption(o: Option, era: number, k = ERA_SCALE[era]): Option {
  const scaleBag = (b: Bag | undefined, _e: number): Bag | undefined => {
    if (!b) return b;
    const out: Bag = {};
    for (const r of Object.keys(b) as Res[]) out[r] = b[r] === 0 ? 0 : Math.sign(b[r]!) * Math.max(1, Math.round(Math.abs(b[r]!) * k));
    return out;
  };
  const se = (e: Effect | undefined): Effect | undefined => {
    if (!e) return e;
    const out: Effect = { ...e, gain: scaleBag(e.gain, era), then: se(e.then), else: se(e.else) };
    if (e.if?.res) out.if = { ...e.if, res: scaleBag(e.if.res, era) };
    if (e.bet) out.bet = { ...e.bet, win: se(e.bet.win)!, lose: se(e.bet.lose)! };
    return out;
  };
  return { ...o, cost: scaleBag(o.cost, era), req: o.req?.res ? { ...o.req, res: scaleBag(o.req.res, era) } : o.req, effect: se(o.effect)! };
}

export interface JalonView { name: string; text: string; gift: string; cost: Bag; req?: string; shape: string }

export interface PresageInfo {
  era: number;
  name: string;
  subtitle: string;
  date: string;
  dessein: string;
  jalon: JalonView | null;
  alt: JalonView | null;
  built: number;
  crisis: { name: string; intro: string; protects: string };
  /** surcroît d'intensité de la crise dû aux merveilles, en % */
  envy: number;
  rival: { name: string; leader: string; count: number; next: string; rel: number };
  legacy?: { from: string; label?: string; testament?: string; heirs: boolean; memory?: string };
  /** vivres consommés en fin d'ère */
  upkeep: number;
  /** ce dont la crise aura besoin, au plus ; et si l'on bâtit la merveille avant */
  needs: { bag: Bag; families: string[] };
  needsIfBuilt?: Bag;
  /** pendant la Course : les seuils si la rivale gagne (crise un quart plus forte) */
  needsIfRaceLost?: Bag;
  /** part de l'entretien due aux merveilles */
  wonderUpkeep: number;
  /** le mot-clé qu'exige la merveille de l'ère : combien, d'où */
  tag?: { tag: Tag; need: number; total: number; parts: string[]; how: string };
  /** la merveille de l'ère suivante, pour préparer */
  nextJalon?: { name: string; req?: string };
}

export interface FamilyInfo {
  id: FamilyId;
  head: string;
  house: string;
  trade: string;
  tag: Tag;
  res: Res;
  hue: number;
  motif: string;
  loy: number;
  state: string;
  mood: string;
  scars: number;
  grudge?: { label: string; date: string };
  favor?: { label: string; date: string };
  rivalOf: FamilyId;
  neglected: boolean;
}

/**
 * Variantes de texte : « A‖B‖C ». La n-ième fois qu'un texte revient dans la partie, on lit la variante suivante ;
 * la graine décale le point de départ, pour que deux parties ne commencent pas par la même.
 */
/** Le texte d'inauguration d'une merveille (chaque variante suivie de ce qu'elle apporte). */
function inaug(j: Jalon): string {
  const base = j.built ?? `Le chantier est achevé : ${j.name.charAt(0).toLowerCase()}${j.name.slice(1)}.`;
  return base.split('‖').map((b) => `${b} ${j.gift}`).join('‖');
}

export function variant(text: string, key: string, seed: number, prior: number, run?: number): string {
  if (!text.includes('‖')) return text;
  const parts = text.split('‖');
  // d'une partie à l'autre, on avance dans les variantes : deux parties de suite ne lisent pas les mêmes textes
  if (run !== undefined) return parts[(hashString(key) + run * Math.max(1, Math.floor(parts.length / 2)) + prior) % parts.length];
  return parts[(hashString(`${key}#${seed}`) + prior) % parts.length];
}

/** Des actes moralement lourds, que la famille lésée ressortira d'abord au procès (carte:option). */
const GRAVE = new Set(['troc_4:0']);

/** Une citation entre guillemets, jamais doublés. */
const quoted = (t: string) => (/^«/.test(t.trim()) ? t.trim() : `« ${t.replace(/^[«\s]+|[»\s]+$/g, '')} »`);

/** Ce qui finit par emporter même une civilisation victorieuse. */
export const VICTORY_CAUSE: Record<string, string> = {
  etoiles: 'le départ : ils sont tous partis, en laissant la lumière allumée',
  empire: 'la paix : après tant de conquêtes, elle les a ennuyés à mourir',
  posterite: 'l’oubli, malgré tout, au bout de très longtemps',
};

export interface Setup {
  dessein: string;
  origin?: string;
  tutorial?: boolean;
  ruins?: RuinInfo[];
  name?: string;
  unlocked?: string[];
  /** Âge de fer (débloqué) : crises plus dures */
  iron?: boolean;
  /** cartes vues à la partie précédente : tirées en dernier */
  avoid?: string[];
  /** nombre de parties déjà jouées (fait tourner les variantes de texte) */
  run?: number;
}

export type Ev =
  | { type: 'res'; before: Resources; after: Resources }
  | { type: 'quartiers'; delta: number; cause: string; shielded?: boolean; paid?: Bag; by?: string }
  | { type: 'rot'; amount: number; cap: number; hunt: number }
  | { type: 'raceStep'; stage: number; of: number; won: boolean; lost: boolean; short?: Bag }
  | { type: 'peace' }
  | { type: 'spoil'; amount: number }
  | { type: 'bilan' }
  | { type: 'mend'; family: FamilyId }
  | { type: 'disette'; missing: number }
  | { type: 'loy'; family: FamilyId; delta: number; value: number }
  | { type: 'famState'; family: FamilyId; state: string }
  | { type: 'card+'; id: string }
  | { type: 'card-'; id: string }
  | { type: 'sched'; card: string }
  | { type: 'jalon'; era: number; name: string }
  | { type: 'jalonMissed'; era: number; name: string }
  | { type: 'rival'; delta: number; value: number }
  | { type: 'rivalJalon'; count: number; name: string; delta: number }
  | { type: 'bet'; win: boolean; chance: number }
  | { type: 'reply'; text: string }
  | { type: 'saison'; saison: number; route: string }
  | { type: 'crisis'; era: number; name: string }
  | { type: 'era'; era: number }
  | { type: 'revolt'; family: FamilyId }
  | { type: 'defect'; family: FamilyId }
  | { type: 'neglect'; family: FamilyId }
  | { type: 'famine' }
  | { type: 'annex'; name: string }
  | { type: 'upkeep'; amount: number }
  | { type: 'decay'; armee: number; tresor: number }
  | { type: 'income'; bag: Bag }
  | { type: 'passive'; bag: Bag }
  | { type: 'end'; result: NonNullable<GameState['result']> };

export interface OptionView {
  label: string;
  cost: Bag;
  affordable: boolean;
  /** exigence affichée, et si elle est remplie */
  req?: string;
  reqOk: boolean;
  enabled: boolean;
  /** familles touchées (emblèmes) */
  families: FamilyId[];
  /** sens de l'effet certain sur chaque famille (+1 / −1, ±2 pour un effet appuyé) ; absent : effet incertain */
  famDir?: Partial<Record<FamilyId, number>>;
  /** ressources gagnées à coup sûr, en fourchette [min, max] (max 99 : « et plus ») ; exacte si min = max */
  gains?: Partial<Record<Res, [number, number]>>;
  /** ce qu'une option à seuil consomme si la réserve suffit */
  spend?: Bag;
  /** l'acte aura une suite (sablier) */
  later: boolean;
  /** pertes de ressources certaines (affichées comme un coût, déjà incluses dans l'effet) */
  loss?: Bag;
  /** quartiers perdus à coup sûr */
  lossQ?: number;
  /** quartiers gagnés à coup sûr (et ce qu'ils mangeront) */
  gainQ?: number;
  /** sens de l'effet sur la relation avec la rivale (+1 / −1) */
  rivalDir?: number;
  warn?: string;
  /** pari : chance affichée */
  odds?: number;
  /** route, découverte : identifiant et promesse */
  ref?: string;
  detail?: string;
  risk?: string;
}

export interface View {
  card: CardDef;
  kind: CardDef['kind'];
  title: string;
  text: string;
  speaker?: string;
  family?: FamilyId;
  header?: string;
  options: OptionView[];
}

const clampLoy = (v: number) => Math.max(-3, Math.min(3, v));
const ONE_SHOT = new Set(['evenement', 'rencontre', 'rivale', 'decouverte', 'hommage', 'ruines', 'revenant']);

export class Engine {
  constructor(public readonly c: Content) {}

  // ======================================================================= création

  newGame(seed: number, setup: Setup): GameState {
    const rng = new Rng(seed);
    const origin = this.c.origins.find((o) => o.id === setup.origin) ?? this.c.origins[0];
    const rival = rng.pick(this.c.rivals);
    const fam = {} as GameState['fam'];
    for (const f of FAMILIES) fam[f] = { loy: origin.loy?.[f] ?? 0, state: origin.families.includes(f) ? 'presente' : 'eteinte', seen: -1 };
    const s: GameState = {
      version: SAVE_VERSION,
      seed,
      rng: rng.getState(),
      name: setup.name ?? [0, 1, 2, 3, 4, 5].map((k) => civName(seed + k * 7919)).find((n) => !(setup.ruins ?? []).some((r) => r.name === n)) ?? civName(seed),
      origin: origin.id,
      dessein: setup.dessein,
      rival: rival.id,
      era: 0,
      saison: 0,
      phase: 'presage',
      prompt: { card: 'presage' },
      pile: [],
      steps: [],
      res: { ...origin.res },
      quartiers: origin.quartiers,
      fam,
      mem: [...(origin.mem ?? [])],
      memo: {},
      deck: [...(origin.deck ?? [])],
      jalons: [false, false, false, false, false],
      rivalRel: 0,
      rivalJalons: 1, // la rivale a déjà dressé sa première merveille
      pool: [],
      visits: { ourk: -1, sel: -1, brume: -1, troc: -1 },
      spent: [],
      sched: [],
      turn: 0,
      eraStart: 0,
      history: [],
      losses: [],
      shieldUsed: false,
      result: null,
      tutorial: !!setup.tutorial,
      ruins: setup.ruins ?? [],
      growth: 0,
      arcs: { open: [], done: [] },
      unlocked: [...(setup.unlocked ?? [])],
      jalonAlt: [],
      iron: !!setup.iron,
      avoid: [...(setup.avoid ?? [])],
      run: setup.run ?? 0,
    };
    this.applyLegacy(s);
    this.buildPool(s, rng);
    s.rng = rng.getState();
    return s;
  }

  /** Le testament de la civilisation précédente : son héritage s'applique au départ. */
  private applyLegacy(s: GameState): void {
    const r = s.ruins[0];
    if (!r) return;
    const heirs = s.origin === 'heritiers';
    const k = heirs ? 2 : 1;
    const lg = r.legacy;
    if (lg?.gain) for (const res of RES) s.res[res] = Math.max(0, s.res[res] + (lg.gain[res] ?? 0) * k);
    if (lg?.quartiers) s.quartiers = Math.max(1, s.quartiers + lg.quartiers);
    const loy: Partial<Record<FamilyId, number>> = { ...(lg?.loy ?? {}) };
    // les familles se souviennent de la cité précédente : celle qui l'aimait vous fait confiance, celle qui la haïssait se méfie
    // (doublé pour les Héritiers, qui vivent dans les murs des morts)
    if (r.ally) loy[r.ally] = (loy[r.ally] ?? 0) + k;
    if (r.enemy) loy[r.enemy] = (loy[r.enemy] ?? 0) - k;
    for (const f of FAMILIES) {
      const d = loy[f] ?? 0;
      if (d && s.fam[f].state === 'presente') s.fam[f].loy = Math.max(-2, Math.min(2, s.fam[f].loy + d));
    }
    s.mem.push('heritage');
    s.memo.heritage = { label: r.testament ?? '', date: 'avant vous', title: r.name, era: -1 };
  }

  /** Ce que les textes peuvent dire de la civilisation précédente. */
  private ruinExtras(s: GameState): Record<string, string> {
    const r = s.ruins[0];
    if (!r) return {};
    return {
      ancienne: r.name,
      testament: r.testament ?? 'rien, ils n’ont pas eu le temps',
      cause: r.cause,
      grief: r.grudge?.quote ?? '',
      griefdate: r.grudge?.date ?? '',
      griefmaison: r.grudge ? capitalize(r.grudge.house) : '',
    };
  }

  /** La crise de l'ère : celle d'origine, ou l'alternative si la graine la désigne. */
  crisisOf(s: GameState) {
    const alt = this.c.crisisAlts?.[s.era];
    const base = this.c.crises[s.era];
    if (!alt) return base;
    // la crise que la partie précédente a montrée cède la place à l'autre
    const seen = (c: typeof base) => c.cards.some((id) => s.avoid?.includes(id));
    if (seen(base) && !seen(alt)) return alt;
    if (seen(alt) && !seen(base)) return base;
    const h = Math.abs(Math.imul(s.seed ^ (s.era * 40503), 2246822519)) >>> 0;
    return h % 2 ? alt : base;
  }

  /** Tire n cartes en préférant celles que la partie précédente n'a pas montrées. */
  private freshFirst(s: GameState, ids: string[], n: number, rng: Rng): string[] {
    const avoid = s.avoid ?? [];
    const fresh = ids.filter((id) => !avoid.includes(id));
    const seen = ids.filter((id) => avoid.includes(id));
    const a = rng.sample(fresh, Math.min(n, fresh.length));
    return [...a, ...rng.sample(seen, Math.min(n - a.length, seen.length))];
  }

  /** Contenu verrouillé par la méta-progression. */
  available(s: GameState, c: CardDef | undefined): boolean {
    return !!c && (!c.lock || s.unlocked.includes(c.lock));
  }

  /** Le jalon de l'ère tel qu'il a été (ou sera) bâti. */
  jalonOf(s: GameState, era: number): Jalon {
    const j = this.dessein(s).jalons[era];
    return s.jalonAlt.includes(era) && j.alt ? j.alt : j;
  }

  /** La variante débloquée du jalon de l'ère, si elle est disponible. */
  jalonAltOf(s: GameState, era: number): Jalon | undefined {
    const a = this.dessein(s).jalons[era].alt;
    return a && s.unlocked.includes(a.lock) ? a : undefined;
  }

  card(id: string): CardDef {
    const c = this.c.cards[id];
    if (!c) throw new Error(`Carte inconnue : ${id}`);
    return c;
  }

  /** Ce que la tribu peut porter pendant l'Errance (au-delà, les vivres pourrissent). */
  carryCap(s: GameState): number {
    return Math.max(6, this.upkeepOf(s) + 2);
  }

  /** Les cartes de crise qui seront vraiment jouées à cette ère (la Course n'en joue que deux). */
  crisisCards(s: GameState): string[] {
    const cr = this.crisisOf(s);
    return this.form(s).id === 'course' ? cr.cards.slice(-2) : cr.cards.slice();
  }

  /** La forme de l'ère en cours (règle, rythme, objectif, menace). */
  form(s: GameState, era = s.era): EraForm {
    return this.c.forms[era] ?? this.c.forms[0];
  }

  dessein(s: GameState) {
    return this.c.desseins.find((d) => d.id === s.dessein) ?? this.c.desseins[0];
  }

  // ======================================================================= requêtes

  present(s: GameState): FamilyId[] {
    return FAMILIES.filter((f) => s.fam[f].state === 'presente');
  }

  /** La protection active (merveille ou découverte qui rachète un quartier) : son nom et son prix à cette ère. */
  shieldInfo(s: GameState): { name: string; res: Res; price: number; ready: boolean } | undefined {
    for (const id of s.deck) {
      const p = this.c.cards[id]?.passive?.find((x) => x.type === 'shield') as { type: 'shield'; amount: number; res: Res } | undefined;
      if (p) { const price = scaleN(Math.round(p.amount * (1 + 0.5 * (s.shieldUses ?? 0))), s.era); return { name: this.c.cards[id].title, res: p.res, price, ready: !s.shieldUsed && s.res[p.res] >= price }; }
    }
    for (let i = 0; i < 5; i++) {
      const j = s.jalons[i] ? this.jalonOf(s, i) : undefined;
      if (j?.passive?.type === 'shield') { const price = scaleN(Math.round(j.passive.amount * (1 + 0.5 * (s.shieldUses ?? 0))), s.era); return { name: j.name, res: j.passive.res, price, ready: !s.shieldUsed && s.res[j.passive.res] >= price }; }
    }
    return undefined;
  }

  passives(s: GameState): Passive[] {
    const out: Passive[] = [];
    for (const id of s.deck) out.push(...(this.c.cards[id]?.passive ?? []));
    const d = this.dessein(s);
    s.jalons.forEach((b, i) => {
      const j = b ? this.jalonOf(s, i) : undefined;
      if (j?.passive) out.push(j.passive);
    });
    void d;
    return out;
  }

  tagCount(s: GameState, tag: Tag): number {
    let n = 0;
    for (const id of s.deck) if (this.c.cards[id]?.tags?.includes(tag)) n++;
    for (const f of this.present(s)) if (this.c.families[f].tag === tag && s.fam[f].loy >= 1) n++;
    // être chanté, c'est être aimé : chaque famille dévouée compte pour la Culture
    if (tag === 'Culture') n += this.present(s).filter((f) => s.fam[f].loy >= 2).length;
    for (const p of this.passives(s)) if (p.type === 'tagBonus' && p.tag === tag) n += p.amount;
    return n;
  }

  /** D'où vient un mot-clé (Science, Guerre…) : pour l'expliquer au joueur. */
  tagSources(s: GameState, tag: Tag): { total: number; parts: string[]; how: string } {
    const parts: string[] = [];
    const deck = s.deck.filter((id) => this.c.cards[id]?.tags?.includes(tag)).map((id) => this.c.cards[id].title);
    if (deck.length) parts.push(`${deck.length} découverte${deck.length > 1 ? 's' : ''} (${deck.join(', ')})`);
    for (const f of this.present(s)) if (this.c.families[f].tag === tag && s.fam[f].loy >= 1) parts.push(`${capitalize(this.c.families[f].house[s.era])}, qui vous aiment`);
    if (tag === 'Culture') {
      const dv = this.present(s).filter((f) => s.fam[f].loy >= 2).length;
      if (dv) parts.push(`${dv} famille${dv > 1 ? 's' : ''} dévouée${dv > 1 ? 's' : ''}`);
    }
    let bonus = 0;
    for (const p of this.passives(s)) if (p.type === 'tagBonus' && p.tag === tag) bonus += p.amount;
    if (bonus) parts.push(`+${bonus} de cartes qui comptent double`);
    const fam = FAMILIES.find((f) => this.c.families[f].tag === tag);
    const how = tag === 'Culture'
      ? 'les découvertes de Culture, et chaque famille dévouée (loyauté +2 ou plus)'
      : `les découvertes de ${tag}${fam ? `, et ${this.c.families[fam].house[s.era]} quand ils vous aiment (loyauté +1 ou plus)` : ''}`;
    return { total: this.tagCount(s, tag), parts, how };
  }

  /** Ce que la crise de l'ère exigera, au plus, selon les options (seuils et coûts, à l'intensité actuelle). */
  crisisNeeds(s: GameState): { bag: Bag; families: string[] } {
    const bag: Bag = {};
    const families = new Set<string>();
    const k = this.crisisK(s);
    const take = (b: Bag | undefined) => {
      if (!b) return;
      for (const r of RES) if ((b[r] ?? 0) > (bag[r] ?? 0)) bag[r] = b[r];
    };
    const walk = (e: Effect | undefined) => {
      if (!e) return;
      take(e.if?.res);
      walk(e.then);
      walk(e.else);
    };
    for (const id of this.crisisCards(s)) {
      for (const o of this.card(id).options.map((x) => scaleOption(x, 0, k))) {
        take(o.cost);
        take(o.req?.res);
        walk(o.effect);
        if (o.req?.fam?.min !== undefined) families.add(`${this.c.families[o.req.fam.id].house[s.era]} ${o.req.fam.min >= 2 ? 'dévoués' : 'loyaux'}`);
      }
    }
    return { bag, families: [...families] };
  }

  check(s: GameState, c: Cond | undefined): boolean {
    if (!c) return true;
    if (c.res) for (const r of RES) if ((c.res[r] ?? -Infinity) > s.res[r]) return false;
    if (c.resMax) for (const r of RES) if (c.resMax[r] !== undefined && s.res[r] > c.resMax[r]!) return false;
    if (c.tags) for (const t of TAGS) if ((c.tags[t] ?? 0) > this.tagCount(s, t)) return false;
    if (c.fam) {
      const f = s.fam[c.fam.id];
      if (c.fam.state ? f.state !== c.fam.state : f.state !== 'presente') return false;
      if (c.fam.min !== undefined && f.loy < c.fam.min) return false;
      if (c.fam.max !== undefined && f.loy > c.fam.max) return false;
    }
    if (c.mem && !s.mem.includes(c.mem)) return false;
    if (c.notMem && s.mem.includes(c.notMem)) return false;
    if (c.card && !s.deck.includes(c.card)) return false;
    if (c.notCard && s.deck.includes(c.notCard)) return false;
    if (c.rival) {
      if (c.rival.min !== undefined && s.rivalRel < c.rival.min) return false;
      if (c.rival.max !== undefined && s.rivalRel > c.rival.max) return false;
    }
    if (c.quartiers) {
      if (c.quartiers.min !== undefined && s.quartiers < c.quartiers.min) return false;
      if (c.quartiers.max !== undefined && s.quartiers > c.quartiers.max) return false;
    }
    if (c.era) {
      if (c.era.min !== undefined && s.era < c.era.min) return false;
      if (c.era.max !== undefined && s.era > c.era.max) return false;
    }
    if (c.dessein && s.dessein !== c.dessein) return false;
    if (c.jalons !== undefined && s.jalons.filter(Boolean).length < c.jalons) return false;
    if (c.rivalJalons !== undefined && s.rivalJalons < c.rivalJalons) return false;
    if (c.ruins !== undefined && s.ruins.length < c.ruins) return false;
    return true;
  }

  condLabel(s: GameState, c: Cond | undefined): string | undefined {
    if (!c) return undefined;
    const parts: string[] = [];
    if (c.res) for (const r of RES) if (c.res[r] !== undefined) parts.push(`${c.res[r]} ${RES_LABEL[r]}`);
    if (c.tags) for (const t of TAGS) if (c.tags[t]) parts.push(`${c.tags[t]} ${t} (vous : ${this.tagCount(s, t)})`);
    if (c.fam) {
      const h = capitalize(this.c.families[c.fam.id].house[s.era]);
      if (c.fam.min !== undefined) parts.push(c.fam.min >= 2 ? `${h} dévoués` : `${h} loyaux`);
      else if (c.fam.max !== undefined) parts.push(`${h} hostiles`);
      else parts.push(h);
    }
    if (c.card) parts.push(this.c.cards[c.card]?.title ?? c.card);
    if (c.quartiers?.min) parts.push(`${c.quartiers.min} quartiers`);
    if (c.jalons) parts.push(`${c.jalons} merveilles bâties`);
    if (c.rivalJalons) parts.push('une merveille chez la rivale');
    return parts.length ? parts.join(', ') : undefined;
  }

  costOf(s: GameState, bag: Bag | undefined): Bag {
    const out: Bag = {};
    if (!bag) return out;
    const disc = this.passives(s).filter((p) => p.type === 'discount') as Extract<Passive, { type: 'discount' }>[];
    for (const r of RES) {
      const v = bag[r];
      if (!v) continue;
      const d = disc.filter((p) => p.res === r).reduce((a, p) => a + p.amount, 0);
      out[r] = Math.max(1, v - d);
    }
    return out;
  }

  /** Une perte certaine (gain négatif de premier niveau) se paie comme un coût : à sec, on ne peut pas la choisir. */
  certainLoss(o: Option): Bag {
    const b: Bag = {};
    for (const r of RES) if ((o.effect.gain?.[r] ?? 0) < 0) b[r] = -o.effect.gain![r]!;
    return b;
  }

  canPay(s: GameState, o: Option): boolean {
    return this.affordable(s, this.costOf(s, o.cost));
  }

  /** Qui comble un trou dans les réserves : la famille de cette ressource (elle vous le reprochera). */
  owner(r: Res): FamilyId | undefined {
    return FAMILIES.find((f) => this.c.families[f].res === r);
  }

  /** Le prix exact d'une créance, fixé au moment du crédit (à l'échelle de l'ère en cours). */
  creditPrice(s: GameState, id: string): number {
    const base = this.c.cards[id]?.options[0]?.cost?.tresor ?? 6;
    return Math.max(1, Math.round(base * ERA_SCALE[s.era]));
  }

  affordable(s: GameState, bag: Bag): boolean {
    return RES.every((r) => (bag[r] ?? 0) <= s.res[r]);
  }

  // ======================================================================= vue

  /** Options effectives de l'invite (routes, procès, découvertes et cartes « qui ? » sont construites ici). */
  /** Les options d'une carte ; si aucune n'est jouable, une issue de secours (jamais de blocage). */
  options(s: GameState, p: Prompt = s.prompt!): Option[] {
    // une option liée à un souvenir absent n'est pas proposée (pas de chars sans la roue)
    const opts = this.baseOptions(s, p).filter((o) => {
      const c = o.req;
      if (!c) return true;
      if (c.mem && !s.mem.includes(c.mem)) return false;
      if (c.notMem && s.mem.includes(c.notMem)) return false;
      if (c.card && !s.deck.includes(c.card)) return false;
      return true;
    });
    const playable = opts.filter((o) => this.canPay(s, o) && this.check(s, o.req));
    const card = this.card(p.card);
    // une seule option jouable : la plus abordable des autres devient possible à crédit (chez les Troc, ou la rivale)
    const pending = s.sched.some((x) => /^creance/.test(x.card));
    // pas de crédit pour payer une dette : ce serait une dette sans fin
    if (playable.length === 1 && !pending && !/^creance/.test(card.id) && !['jalon', 'croissance', 'decouverte', 'proces', 'carrefour', 'presage', 'regle', 'conseil'].includes(card.kind)) {
      const blocked = opts.filter((o) => o.cost && !this.affordable(s, this.costOf(s, o.cost)) && this.check(s, o.req));
      // seuls les Troc prêtent : hostiles, absents, ou visés par la carte, ils ne prêtent pas, et il n'y a pas de crédit
      const canLend = s.fam.troc.state === 'presente' && card.family !== 'troc' && s.fam.troc.loy >= -1;
      if (blocked.length && canLend) {
        const o = blocked.sort((a, b) => Object.values(a.cost ?? {}).reduce((x, y) => x + (y ?? 0), 0) - Object.values(b.cost ?? {}).reduce((x, y) => x + (y ?? 0), 0))[0];
        // les Troc ne prêtent pas pour qu'on les rattrape : contre eux, c'est la rivale qui avance la somme
        const lender = s.fam.troc.state === 'presente' && card.family !== 'troc' && s.fam.troc.loy >= -1 ? 'troc' : null;
        // le crédit a un prix différé et fixé d'avance : une créance tombera dans l'ère (sablier, compte à rebours)
        // les créances des Troc montent d'un ton à chaque fois
        const owed = s.history.filter((h) => /^creance(_\d)?$/.test(h.card)).length + s.sched.filter((x) => /^creance(_\d)?$/.test(x.card)).length;
        const dueCard = lender ? ['creance', 'creance_2', 'creance_3'][Math.min(2, owed)] : 'creance_rivale';
        // le crédit coûte toujours plus cher que le comptant : un quart de plus que le prix de l'option, au moins le tarif de la créance
        // le prix croît avec la somme empruntée, et avec chaque crédit déjà pris dans la partie
        const cash = Object.values(this.costOf(s, o.cost)).reduce((a, x) => a + (x ?? 0), 0);
        const loans = s.history.filter((h) => h.label.endsWith('(à crédit)')).length;
        const due = { card: dueCard, in: s.phase === 'crise' || s.era >= ERAS - 1 ? 0 : 2, pay: Math.ceil(cash * (1.4 + 0.2 * loans)) + 1 };
        const effect: Effect = lender
          ? { ...o.effect, loy: { ...(o.effect.loy ?? {}), troc: (o.effect.loy?.troc ?? 0) - 1 }, sched: [...(o.effect.sched ?? []), due] }
          : { ...o.effect, rival: (o.effect.rival ?? 0) - 1, sched: [...(o.effect.sched ?? []), due] };
        return [...opts, { ...o, label: `${o.label} (à crédit)`, cost: undefined, effect, credit: true }];
      }
    }
    // la pauvreté ne doit pas supprimer le choix : sur une carte de récit, s'il ne reste qu'une issue, on peut ne pas trancher
    // face à une trahison, pas d'échappatoire : on tranche
    const money = card.arc === 'dette' || card.options.some((o) => o.effect.seize || o.effect.sched?.some((x) => /^creance/.test(x.card)));
    const story = ['famille', 'rencontre', 'evenement', 'rivale', 'intrigue'].includes(card.kind) && !/^creance/.test(card.id) && card.id !== 'disette' && card.id !== 'tribut' && !money;
    // (seulement si cette seule issue coûte quelque chose : sinon, ne pas trancher ne servirait à rien)
    const only = playable[0];
    // (une perte de quartier qu'une merveille rachèterait ne compte pas comme un vrai risque)
    const sh = this.passives(s).find((x) => x.type === 'shield') as { type: 'shield'; amount: number; res: Res } | undefined;
    const covered = !!sh && !s.shieldUsed && s.res[sh.res] >= scaleN(sh.amount, s.era);
    const hurts = (e: Effect | undefined, risky = false): boolean => !!e && (RES.some((r) => (e.gain?.[r] ?? 0) < 0 && s.res[r] > 0) || (Object.keys(e.loy ?? {}) as FamilyId[]).some((f) => (e.loy![f] ?? 0) < 0 && s.fam[f]?.state === 'presente' && s.fam[f].loy > -3) || ((e.quartiers ?? 0) < 0 && !(risky && covered)) || ((e.rival ?? 0) < 0 && s.rivalRel > -3) || (e.rivalJalon ?? 0) > 0 || hurts(e.bet?.lose, true));
    // une découverte qui revient comme carte du jour : on peut toujours ranger les plans
    if (card.kind === 'decouverte' && card.id !== 'decouverte' && playable.length <= 1 && (!only || only.cost || hurts(only.effect))) {
      return [...opts, { label: 'Ranger les plans', effect: {}, reply: 'Les plans retournent au tiroir. Ils y seront encore demain ; vous aussi, normalement.‖On range les plans. Les savants soupirent, puis rangent leurs soupirs avec.' }];
    }
    if (playable.length === 1 && story && s.res.tresor >= 1 && (only.cost || hurts(only.effect))) {
      return [...opts, { label: 'Ne pas trancher', effect: { gain: { tresor: -1 } }, reply: 'Vous ne tranchez pas. L’affaire traîne ; les avocats, eux, se font payer.‖Vous laissez l’affaire en suspens. Elle se règle toute seule, de travers, et quelqu’un vous envoie la note.‖Vous remettez la décision à plus tard. Plus tard arrive avec des frais de dossier.‖Vous réfléchissez. Longtemps. Pendant ce temps, un conseiller facture ses heures.' }];
    }
    if (playable.length) return opts;
    if (card.kind === 'crise') {
      const name = this.crisisOf(s).name;
      return [...opts, { label: 'Encaisser', effect: { quartiers: -1, forced: true, cause: `${name.charAt(0).toLowerCase()}${name.slice(1)}, sans rien à lui opposer` }, reply: 'Rien à opposer. On serre les dents, on compte les ruines.' }];
    }
    return [...opts, { label: 'Ne rien faire', effect: {}, reply: 'Faute de moyens, on attend. Pour une fois, ça ne coûte rien.' }];
  }

  private baseOptions(s: GameState, p: Prompt): Option[] {
    const card = this.card(p.card);
    if (card.kind === 'carrefour') {
      return (p.routes ?? []).map((rid) => {
        const r = this.c.routes.find((x) => x.id === rid)!;
        const name = Array.isArray(r.name) ? r.name[s.era] : r.name;
        return { label: name, effect: {} };
      });
    }
    if (card.kind === 'decouverte' && p.recruits) {
      const opts: Option[] = p.recruits.map((id) => {
        const d = this.card(id);
        return { label: d.title, cost: { savoir: d.price ?? 0 }, effect: { addCard: [id] } };
      });
      opts.push({ label: 'Rien de nouveau', effect: {}, reply: ['Les savants rangent leurs croquis. Ils boudent.', 'Les savants rangent leurs tablettes et vont se plaindre aux bains.', 'Les savants rangent leurs parchemins. L’un d’eux part chez {rival}, avec les siens.', 'Les savants rangent leurs brevets dans un tiroir, qu’ils ferment à clé, ostensiblement.', 'Les savants archivent le projet. Il sera redécouvert dans mille ans, par quelqu’un d’autre.'][s.era] });
      return opts;
    }
    if (card.kind === 'proces') return this.trialOptions(s, p);
    if (card.qui && p.qui) return p.qui.map((f) => (card.scale ? scaleOption(card.qui!.option(f), s.era) : card.qui!.option(f)));
    if (card.id === 'conseil') {
      // une voix par famille présente ; on ne froisse pas une rivale qui n'est plus là
      return card.options.filter((o) => {
        const f = (Object.keys(o.effect.loy ?? {}) as FamilyId[]).find((x) => (o.effect.loy![x] ?? 0) > 0);
        return f && s.fam[f].state === 'presente';
      }).map((o) => {
        const loy = { ...(o.effect.loy ?? {}) };
        for (const f of Object.keys(loy) as FamilyId[]) if (s.fam[f].state !== 'presente') delete loy[f];
        return { ...o, effect: { ...o.effect, loy } };
      });
    }
    if (card.id === 'disette') {
      const d = Math.max(1, this.upkeepOf(s) - s.res.vivres - this.bilanVivres(s));
      const g = { vivres: Math.ceil(d / TUNING.gain) };
      const opts: Option[] = [{ label: 'Acheter du grain, au prix fort', cost: { tresor: 2 * d }, effect: { gain: g, loy: { troc: 1 } }, reply: '{F:troc} livre le grain, pesé deux fois, facturé trois. Les greniers tiendront.‖Le grain arrive par charrettes, au prix des épices. Les greniers tiendront ; les coffres, moins.‖{F:troc} ouvre ses entrepôts « par amitié ». L’amitié est facturée à part.' }];
      if (s.fam.sel.state === 'presente') opts.push({ label: 'Réquisitionner chez {H:sel}', req: { fam: { id: 'sel', min: -1 } }, reqLabel: '{H:sel} pas encore hostiles', effect: { gain: g, loy: { sel: -2 } }, reply: 'Les greniers du temple s’ouvrent, sous escorte. {F:sel} bénit chaque sac en vous regardant.‖On vide les réserves du temple. {F:sel} compte les sacs à voix haute, pour que le ciel entende.‖Les soldats emportent le grain sacré. {F:sel} prie pour eux, et contre vous, dans la même prière.' });
      opts.push({ label: 'Serrer la ceinture', effect: {}, reply: 'On serrera la ceinture. Elle a encore des trous ; pas tous.‖On rationnera. Les cuisiniers inventent la soupe de cailloux, puis la soupe de soupe.‖Personne n’achètera de grain. On mangera moins, et on parlera beaucoup de ce qu’on mangera après.' });
      return opts;
    }
    if (card.kind === 'croissance') {
      const extra = this.passives(s).filter((x) => x.type === 'growth').reduce((a, x) => a + (x as { amount: number }).amount, 0);
      return [
        { label: 'Fonder un quartier', cost: { vivres: this.growthCost(s) }, effect: { quartiers: 1 + extra }, reply: 'Un nouveau quartier sort de terre. Il a déjà ses habitudes, et un nom que personne n’a choisi.‖Les maçons tracent des rues neuves. Trois jours plus tard, elles ont déjà des nids-de-poule, et des habitués.‖Un quartier de plus. Les familles se disputent le nom ; il s’appellera finalement « le Nouveau », jusqu’à ce qu’il soit vieux.‖Une nouvelle rangée de maisons, une fontaine, et une taverne avant même la fontaine.' },
        { label: 'Garder les réserves', effect: {}, reply: 'Les greniers restent pleins. Les rats approuvent.‖On garde le grain pour l’hiver. L’hiver, lui, ne promet rien.‖Les réserves restent au grenier. Les intendants dorment mieux ; les maçons, moins.' },
      ];
    }
    if (card.kind === 'jalon' && p.missed !== undefined) {
      // une merveille manquée se rattrape plus tard, plus cher : les prix ont suivi les ères
      const e = p.missed;
      const k = 1.15 * ERA_SCALE[s.era] / ERA_SCALE[e];
      const up = (b: Bag): Bag => { const o: Bag = {}; for (const r of Object.keys(b) as Res[]) o[r] = Math.ceil(b[r]! * k); return o; };
      const j = this.dessein(s).jalons[e];
      const alt = this.jalonAltOf(s, e);
      const opts: Option[] = [{ label: `Bâtir ${j.name}, enfin`, cost: up(j.cost), req: j.req, effect: { jalon: true, jalonEra: e }, reply: inaug(j) }];
      if (alt) opts.push({ label: `Bâtir ${alt.name}, enfin`, cost: up(alt.cost), req: alt.req, effect: { jalon: 'alt', jalonEra: e }, reply: inaug(alt) });
      opts.push({ label: 'Laisser les plans au coffre', effect: {}, reply: ['Les plans retournent au coffre.', 'Les plans redescendent dans la cave du temple. Un scribe écrit dessus : « un jour ».‖Les plans retournent sous une amphore, au frais. On les ressortira pour une grande occasion.‖On replie les plans. L’architecte les emporte chez lui, au cas où vous changeriez d’avis.', 'Les plans regagnent la bibliothèque du monastère, entre deux grimoires. On les recopie, par habitude.‖Les plans retournent au trésor de la cathédrale, avec les reliques. Ils sont aussi bien gardés, et aussi peu utilisés.‖On roule les plans dans un étui de cuir. Un moine les enlumine, pour passer le temps.', 'Les plans repartent aux archives, tamponnés « ajourné ». Le tampon est neuf ; le projet, non.‖Les plans retournent dans un tiroir du ministère, sous une pile de rapports sur les tiroirs.‖On classe le projet. Un ingénieur garde une copie sous son lit, par tendresse.', 'Les plans retournent dans un serveur, dossier « plus tard », sous-dossier « vraiment plus tard ».‖Le projet est archivé. BRUME promet de vous le rappeler, à intervalles réguliers, sans que vous ayez rien demandé.‖Les plans sont compressés, chiffrés, sauvegardés trois fois. Le projet est désormais très bien protégé contre toute réalisation.'][s.era] });
      return opts;
    }
    if (card.kind === 'jalon') {
      const j = this.dessein(s).jalons[s.era];
      const alt = this.jalonAltOf(s, s.era);
      const opts: Option[] = [{ label: `Bâtir ${j.name}`, cost: j.cost, req: j.req, effect: { jalon: true }, reply: inaug(j) }];
      if (alt) opts.push({ label: `Bâtir ${alt.name}`, cost: alt.cost, req: alt.req, effect: { jalon: 'alt' }, reply: inaug(alt) });
      if (p.early) {
        opts.push({ label: this.form(s).id === 'course' && s.saison < this.form(s).seasons - 1 ? 'À la saison prochaine' : 'Plus tard, avant la crise', effect: {}, reply: ['Les bâtisseurs attendront la fin de la saison. Ils en profitent pour tailler une pierre de plus, par prudence.‖On attendra une saison. Les bâtisseurs comptent leurs cordes, puis les recomptent.', 'Le chantier attendra une saison. Les architectes en profitent pour ajouter une colonne.‖Une saison de plus pour les plans. L’architecte y ajoute un fronton, puis une frise, puis s’arrête de justesse.', 'Le chantier attendra une saison. Les maçons bénissent les fondations, au cas où.‖Une saison de répit. Les tailleurs de pierre en profitent pour graver leur nom dans les fondations, en petit.', 'Le chantier attendra une saison. Les ingénieurs repeignent les plans, en plus grand.‖Une saison de plus. Les ingénieurs testent une machine pour aller plus vite ; elle va surtout plus fort.', 'Le chantier attendra une saison. Le compte à rebours repart à zéro, avec un bip.‖Une saison de plus. Les drones rangés en ligne attendent le signal, sans impatience, ce qui est inquiétant.'][s.era] });
        return opts;
      }
      opts.push({ label: 'Pas cette fois', effect: {}, reply: [
        'Les plans retournent dans un coffre. Le coffre est plein de plans.‖Les bâtisseurs remballent leurs cordes et leurs rondins. Ils laissent une pierre dressée, pour marquer l’endroit.‖Le chantier attendra. {F:ourk} s’assied sur la première pierre, et déclare qu’elle est très bien comme ça.',
        'Les architectes rangent leurs maquettes. Ils les dépoussièrent chaque matin, en soupirant.‖Le chantier s’arrête aux fondations. Les enfants y jouent aux ruines, avec un temps d’avance.‖On ajourne. Le sculpteur garde la statue à moitié finie ; elle a un bras, et beaucoup d’opinions.',
        'Le chantier attendra. Les tailleurs de pierre jouent aux dés sur les fondations.‖Les échafaudages restent debout, vides. Les pigeons s’y installent et refusent ensuite de partir.‖On remet à l’an prochain. Le maître d’œuvre écrit « bientôt » sur le portail, en latin, pour faire sérieux.',
        'On remet à plus tard. Les ingénieurs en profitent pour améliorer les plans. Ils coûtent déjà plus cher.‖Le chantier est suspendu. Les grues restent en l’air, comme des points d’interrogation.‖Les travaux sont reportés. Une commission est créée pour étudier le report. Elle demande un budget.',
        'Le projet est mis en veille. Il clignote doucement dans un coin du serveur.‖Le chantier est mis en pause. Les drones de construction tournent en rond au-dessus du terrain, poliment.‖Report. BRUME calcule que le retard coûtera 3 % de plus par an, et vous envoie le graphique.',
      ][s.era] });
      return opts;
    }
    if (card.kind === 'hommage') {
      // une cité en détresse peut compter sur une famille reconnaissante pour rebâtir : une occasion de se relever
      const base = card.scale ? card.options.map((o) => scaleOption(o, s.era)) : card.options;
      if (s.quartiers > 2 || base.some((o) => (o.effect.quartiers ?? 0) > 0)) return base;
      return [...base, { label: 'Qu’ils bâtissent un quartier', effect: { quartiers: 1 }, reply: `{H:${card.family}} bâtissent un quartier à leurs frais. Ils y mettent leur nom partout, même sur les pavés.` }];
    }
    if (card.kind === 'crise') return card.options.map((o) => scaleOption(o, 0, this.crisisK(s)));
    const opts = card.scale ? card.options.map((o) => scaleOption(o, s.era)) : card.options;
    // une créance coûte ce qui a été annoncé au moment du crédit
    if (/^creance/.test(card.id) && opts[0]?.cost?.tresor) {
      // une créance : payer, payer en nature, laisser saisir (les réserves d'abord, un quartier seulement à sec), ou refuser
      const pay = p.pay ?? opts[0].cost.tresor;
      const half = Math.ceil(pay * 0.6);
      const rival = card.id === 'creance_rivale';
      const refuse = opts[opts.length - 1];
      // la saisie n'existe que pour qui ne peut pas payer : sinon, ce serait payer en se brouillant ;
      // une rivale qui n'a plus rien à bâtir (ou plus le temps) ne se laisse pas ignorer : elle saisit
      const cornered = rival && (s.rivalJalons >= 5 || s.era >= ERAS - 1);
      const broke = !this.affordable(s, this.costOf(s, { tresor: pay }));
      return [
        { ...opts[0], cost: { tresor: pay } },
        { label: 'Payer en nature', cost: { vivres: half, armee: half }, effect: opts[0].effect, reply: 'Vous payez en sacs de grain et en jours de corvée. Le créancier fait la grimace, puis compte les sacs.‖Vous réglez en blé et en bras. Les huissiers repartent chargés comme des mulets, et presque contents.‖La dette est payée en nature : trois charrettes de grain, une compagnie de corvée, et un cochon, pour le geste.' },
        ...(!broke ? [] : [{ label: 'Laisser saisir', effect: { seize: pay, ...(rival ? { rival: -1 } : { loy: { troc: -1 } }) }, reply: rival ? 'Les soldats de {rival} font l’inventaire de vos greniers, puis de vos casernes. Ils signent un reçu, en double.‖Les soldats de {rival} se servent, poliment, dans l’ordre alphabétique. Ils remercient en partant.‖{Reine} envoie ses comptables, puis ses soldats pour porter ce que les comptables ont compté.' : 'Les huissiers de {H:troc} vident les coffres, puis les greniers. Ils laissent les murs : les murs, ça ne se revend pas.‖Saisie. Les huissiers de {H:troc} emportent tout ce qui se compte, et notent ce qui ne se compte pas, pour plus tard.‖Les huissiers arrivent avec une charrette vide et repartent avec une charrette pleine. Ils sifflent en partant.‖Les huissiers de {H:troc} font l’inventaire à voix haute, pour que tout le monde profite. Les voisins prennent des notes.‖Les huissiers connaissent désormais le chemin, et vont droit aux coffres.' } as Option]),
        ...(cornered ? [] : [refuse]),
      ];
    }
    return opts;
  }

  view(s: GameState): View | null {
    setCrisisK(this.crisisK(s));
    const p = s.prompt;
    if (!p) return null;
    const card = this.card(p.card);
    const extra: Record<string, string> = {};
    let header: string | undefined;
    let title = card.title;
    let text = card.text;
    if (card.id === 'disette') {
      const up = this.upkeepOf(s);
      const gift = this.bilanVivres(s);
      const d = Math.max(1, up - s.res.vivres - gift);
      const small = d <= Math.max(1, Math.ceil(up / 3));
      text = `La cité mangera ${up} Vivres à la fin de l’ère ; ${gift ? `même avec les ${gift} qu’apporteront vos fidèles, ` : ''}il en manque ${d}. ${small ? 'Un si petit manque fera grogner toutes les familles.' : 'Un tel manque videra un quartier.'} {F:troc} a du grain. À son prix.`;
      header = 'Avant le bilan';
    }
    if (card.kind === 'jalon' && p.missed !== undefined) {
      const j = this.dessein(s).jalons[p.missed];
      title = 'Le Chantier oublié';
      text = `On avait prévu ${j.name.charAt(0).toLowerCase()}${j.name.slice(1)} pour ${ERA_NAMES[p.missed].charAt(0).toLowerCase()}${ERA_NAMES[p.missed].slice(1)}. Les plans dorment au coffre ; les prix, eux, ont suivi les siècles. La bâtir maintenant, c’est arriver plus pauvre au chantier de l’ère et à sa crise. ${j.gift}`;
      header = `Rattrapage · merveille ${p.missed + 1} sur 5`;
    } else if (card.kind === 'jalon') {
      const j = this.dessein(s).jalons[s.era];
      const alt = this.jalonAltOf(s, s.era);
      title = alt ? 'Deux plans sur la table' : j.name;
      text = alt
        ? `Les architectes se disputent. ${j.name} : ${j.text} ${alt.name} : ${alt.text} On ne bâtira que l’un des deux.`
        : `${j.text} ${j.gift}`;
      header = p.early ? `Chantier anticipé · ${s.era + 1} sur 5` : `Le chantier · merveille ${s.era + 1} sur 5`;
    }
    if (card.kind === 'proces' && p.plaintiff) {
      const h = s.history[p.quote ?? -1];
      extra.citation = h ? quoted(h.label) : '« rien de précis, mais tout »';
      extra.quand = h ? h.date : 'depuis toujours';
      extra.objet = h ? h.title : 'votre règne';
      extra.depuis = !h || h.era === s.era ? '' : h.era === s.era - 1 ? 'Cela date de l’ère précédente. ' : `Cela remonte à ${ERA_NAMES[h.era].charAt(0).toLowerCase()}${ERA_NAMES[h.era].slice(1)}. `;
      extra.plaignant = this.c.families[p.plaintiff].head[s.era];
      extra.maison = capitalize(this.c.families[p.plaintiff].house[s.era]);
      header = 'Le Procès';
    }
    if (card.kind === 'hommage') {
      const h = s.history[p.quote ?? -1];
      extra.citation = h ? quoted(h.label) : '« tout »';
      extra.quand = h ? h.date : 'depuis toujours';
      extra.objet = h ? h.title : 'Votre règne';
      header = 'L’Hommage';
    }
    Object.assign(extra, this.ruinExtras(s));
    if (card.kind === 'famille' && card.family) {
      const lead = this.familyLead(s, card.family);
      const head = `{F:${card.family}}`;
      if (lead && lead.includes(head) && text.startsWith(head)) text = `{Il:${card.family}}${text.slice(head.length)}`;
      if (lead) text = `${lead} ${text}`;
    }
    if (p.from) header = `Suite de · ${p.from}`;
    if (card.kind === 'crise') {
      const cr = this.crisisOf(s);
      const played = this.crisisCards(s);
      header = `Crise · ${cr.name} · ${played.indexOf(card.id) + 1}/${played.length}`;
    }
    if (card.kind === 'trahison') header = 'Trahison';
    if (card.kind === 'rivale') header = `Rivale · ${capitalize(this.rival(s).name)}`;
    if (card.kind === 'decouverte') header = 'Découverte';
    if (card.kind === 'carrefour') header = `${['Première', 'Deuxième', 'Troisième', 'Quatrième'][s.saison] ?? 'Dernière'} saison${this.form(s).seasons > 1 && s.saison === this.form(s).seasons - 1 ? ' (la dernière)' : ''}`;
    const options = this.options(s, p).map((o, i) => this.optionView(s, card, o, p, i));
    const fam = card.family;
    return {
      card,
      kind: card.kind,
      title: fill(title, s, this.c, extra),
      text: fill(variant(text, card.id, s.seed, s.history.filter((h) => h.card === card.id).length, s.run), s, this.c, extra),
      speaker: card.speaker ? fill(card.speaker, s, this.c, extra) : fam ? this.c.families[fam].head[s.era] : undefined,
      family: fam ?? (card.kind === 'proces' ? p.plaintiff : undefined),
      header,
      options,
    };
  }

  private optionView(s: GameState, card: CardDef, o: Option, p: Prompt, i: number): OptionView {
    const cost = this.costOf(s, o.cost);
    const affordable = this.canPay(s, o);
    const reqOk = this.check(s, o.req);
    const fams = new Set<FamilyId>();
    let later = false;
    const walk = (e: Effect | undefined) => {
      if (!e) return;
      for (const f of Object.keys(e.loy ?? {}) as FamilyId[]) {
        if (!e.loy![f]) continue;
        fams.add(f);
        // une faveur appuyée froisse la famille rivale : elle est concernée aussi
        if (e.loy![f]! >= 2 && s.fam[this.c.rivalries[f]]?.state === 'presente') fams.add(this.c.rivalries[f]);
      }
      if (e.sched?.length) later = true;
      if (e.famState) fams.add(e.famState.id);
      walk(e.then);
      walk(e.else);
      if (e.bet) {
        walk(e.bet.win);
        walk(e.bet.lose);
      }
    };
    walk(o.effect);
    const v: OptionView = {
      label: fill(o.label, s, this.c),
      cost,
      affordable,
      req: o.reqLabel ? fill(o.reqLabel, s, this.c) : this.condLabel(s, o.req),
      reqOk,
      enabled: affordable && reqOk,
      families: [...fams],
      later,
      warn: o.warn ? fill(o.warn, s, this.c) + (o.effect.if?.mem ? (s.mem.includes(o.effect.if.mem) ? ' (c’est fait)' : ' (pas encore)') : '') : undefined,
    };
    if (o.effect.bet) v.odds = this.betChance(s, o.effect.bet);
    // l'effet exact sur chaque famille, mépris compris : on rejoue les loyautés sur une copie
    const loyNow: Partial<Record<FamilyId, number>> = {};
    for (const f of FAMILIES) loyNow[f] = s.fam[f].loy;
    const bump = (f: FamilyId, d: number, cascade: boolean) => {
      if (!d || s.fam[f]?.state !== 'presente') return;
      const before = loyNow[f]!;
      const after = Math.max(-3, Math.min(3, before + d));
      loyNow[f] = after;
      if (cascade && after - before >= 2) bump(this.c.rivalries[f], -1, false);
    };
    for (const f of Object.keys(o.effect.loy ?? {}) as FamilyId[]) bump(f, o.effect.loy![f] ?? 0, true);
    for (const r of RES) if ((o.effect.gain?.[r] ?? 0) < 0 && s.res[r] + o.effect.gain![r]! < 0) {
      const f = this.owner(r);
      if (f) {
        bump(f, -Math.min(2, Math.ceil(-(s.res[r] + o.effect.gain![r]!) / 3)), false);
        if (!v.families.includes(f)) v.families.push(f);
      }
    }
    const dir: Partial<Record<FamilyId, number>> = {};
    for (const f of FAMILIES) if (loyNow[f] !== s.fam[f].loy) dir[f] = loyNow[f]! - s.fam[f].loy;
    if (Object.keys(dir).length) v.famDir = dir;
    // prévenir d'une révolte : une famille qui passerait à −3 brûlera un quartier au bilan
    // (les Peintures de la grotte apaisent les révoltés avant le bilan : pas de révolte à annoncer)
    const mended = this.passives(s).some((p) => p.type === 'mend');
    const riot = mended ? [] : FAMILIES.filter((f) => dir[f] && loyNow[f]! <= -3 && s.fam[f].loy > -3);
    if (riot.length) v.risk = [v.risk, `${riot.map((f) => capitalize(this.c.families[f].house[s.era])).join(' et ')} passeraient à −3 : révolte au bilan, un quartier brûle`].filter(Boolean).join(' · ');
    // dernière carte avant le bilan : dire noir sur blanc ce que coûteront les révoltes
    const lastBeforeBilan = (card.kind === 'crise' && !s.pile.length && s.phase === 'crise') || card.id === 'disette';
    if (lastBeforeBilan && !mended) {
      const rebels = FAMILIES.filter((f) => s.fam[f]?.state === 'presente' && loyNow[f]! <= -3 && !riot.includes(f));
      const q = s.quartiers + (o.effect.quartiers ?? 0);
      if (rebels.length) v.risk = [v.risk, `Au bilan, ${rebels.map((f) => this.c.families[f].house[s.era]).join(' et ')} se révolteront${q - rebels.length - riot.length <= 0 ? ' : la cité tombera' : ` : ${rebels.length > 1 ? `${rebels.length} quartiers brûleront` : 'un quartier brûlera'}`}`].filter(Boolean).join(' · ');
      // et l'option qui apaise une famille révoltée le dit
      const calmed = FAMILIES.filter((f) => s.fam[f]?.state === 'presente' && s.fam[f].loy <= -3 && loyNow[f]! > -3);
      if (calmed.length) v.detail = [v.detail, `Évite la révolte de${calmed.length > 1 ? 's' : ''} ${calmed.map((f) => this.c.families[f].house[s.era].replace(/^les /, '')).join(' et ')} au bilan`].filter(Boolean).join(' · ');
    }
    // une perte de quartier subie (seuil raté, pari perdu) serait rachetée par la merveille protectrice : le dire avant
    const sh = this.shieldInfo(s);
    const suffered = (!!o.effect.if && (o.effect.else?.quartiers ?? 0) < 0 && !this.check(s, o.effect.if)) || (o.effect.bet?.lose?.quartiers ?? 0) < 0;
    if (sh?.ready && suffered) v.detail = [v.detail, `${sh.name} rachèterait le quartier (${sh.price} ${RES_LABEL[sh.res]})`].filter(Boolean).join(' · ');
    // ce qui rentre, en fourchette : large, plus fine avec la Science et les merveilles, exacte si l'on a payé pour voir
    const gl: Partial<Record<Res, [number, number]>> = {};
    const sight = s.peek === s.turn ? 2 : this.insight(s).level;
    for (const r of RES) {
      const g = o.effect.gain?.[r] ?? 0;
      if (g > 0) {
        const a = Math.max(1, Math.round(g * TUNING.gain));
        gl[r] = sight === 2 ? [a, a] : (sight === 1 ? GAIN_NARROW : GAIN_WIDE).find(([lo, hi]) => a >= lo && a <= hi)!;
      }
    }
    if (Object.keys(gl).length) v.gains = gl;
    // un pari dit ce qu'il rapporte s'il réussit, et ce qu'il coûte s'il rate (tour 5 des juges)
    if (o.effect.bet) {
      const side = (e: Effect | undefined, win: boolean): string => {
        if (!e) return 'rien de plus';
        const parts: string[] = [];
        for (const r of RES) {
          const g = e.gain?.[r] ?? 0;
          if (g > 0 && win) {
            const a = Math.max(1, Math.round(g * TUNING.gain));
            const [lo, hi] = sight === 2 ? [a, a] : (sight === 1 ? GAIN_NARROW : GAIN_WIDE).find(([x, y]) => a >= x && a <= y)!;
            parts.push(`+${lo === hi ? lo : hi >= 99 ? `${lo} et plus` : `${lo} à ${hi}`} ${RES_LABEL[r]}`);
          }
          if (g < 0) parts.push(`−${-g} ${RES_LABEL[r]}`);
        }
        if (e.quartiers) parts.push(`${e.quartiers > 0 ? '+' : '−'}${Math.abs(e.quartiers)} quartier${Math.abs(e.quartiers) > 1 ? 's' : ''}`);
        if ((e.rivalJalon ?? 0) < 0) parts.push(`${capitalize(this.rival(s).name)} perdent une merveille`);
        const fam = Object.entries(e.loy ?? {}).filter(([, d]) => d).map(([f, d]) => `${capitalize(this.c.families[f as FamilyId].house[s.era])} ${d! > 0 ? '▲' : '▼'}`);
        parts.push(...fam);
        return parts.length ? parts.join(', ') : 'rien de plus';
      };
      v.detail = [v.detail, `Réussi : ${side(o.effect.bet.win, true)} · Raté : ${side(o.effect.bet.lose, false)}`].filter(Boolean).join(' · ');
    }
    // une option à seuil consomme des réserves quand elle réussit : on le montre, ce n'est pas « gratuit »
    if (o.effect.if?.res && o.effect.then?.gain) {
      const sp: Bag = {};
      for (const r of RES) if ((o.effect.then.gain[r] ?? 0) < 0) sp[r] = -o.effect.then.gain[r]!;
      if (Object.keys(sp).length) v.spend = sp;
    }
    // ce qu'un échec coûte en réserves (pari perdu, seuil raté)
    const failGain = o.effect.bet?.lose?.gain ?? (o.effect.if ? o.effect.else?.gain : undefined);
    if (failGain && RES.some((r) => (failGain[r] ?? 0) < 0)) {
      const txt = RES.filter((r) => (failGain[r] ?? 0) < 0).map((r) => `${-failGain[r]!} ${RES_LABEL[r]}`).join(', ');
      v.risk = [v.risk, `En cas d’échec : −${txt}`].filter(Boolean).join(' · ');
    }
    if ((o.effect.quartiers ?? 0) < 0 && !o.effect.if) v.lossQ = -o.effect.quartiers!;
    if ((o.effect.quartiers ?? 0) > 0 && !o.effect.if) v.gainQ = o.effect.quartiers!;
    if (card.id === 'colonie' && v.gainQ) v.detail = [v.detail, 'Une colonie se nourrit elle-même : elle ne mange rien au bilan'].filter(Boolean).join(' · ');
    if (o.effect.rival) v.rivalDir = Math.sign(o.effect.rival);
    // la merveille du dessein compromise : une famille qui cesserait de compter pour le mot-clé
    const jal = !s.jalons[s.era] ? this.dessein(s).jalons[s.era] : s.era < 4 && !s.jalons[s.era + 1] ? this.dessein(s).jalons[s.era + 1] : undefined;
    const tag = this.dessein(s).tag;
    const need = jal?.req?.tags?.[tag];
    if (need && v.famDir && Object.values(v.famDir).some((d) => (d ?? 0) < 0)) {
      const now = this.tagCount(s, tag);
      const fam = Object.fromEntries(FAMILIES.map((f) => [f, { ...s.fam[f], loy: Math.max(-3, Math.min(3, s.fam[f].loy + (v.famDir?.[f] ?? 0))) }])) as GameState['fam'];
      const after = this.tagCount({ ...s, fam }, tag);
      if (now >= need && after < need) v.risk = [v.risk, `${jal!.name} exige ${need} ${tag} : vous passeriez à ${after}`].filter(Boolean).join(' · ');
    }
    // la merveille de l'ère hors de prix : une option qui ferait passer une réserve sous son coût le dit (tour 5 des juges)
    if (!s.jalons[s.era] && s.phase === 'saison' && card.kind !== 'jalon') {
      const j = this.dessein(s).jalons[s.era];
      const jc = this.costOf(s, j.cost);
      const spend = this.costOf(s, o.cost);
      const loss = this.certainLoss(o);
      const short = RES.filter((r) => (jc[r] ?? 0) > 0 && s.res[r] >= jc[r]! && s.res[r] - (spend[r] ?? 0) - (loss[r] ?? 0) < jc[r]!);
      if (short.length) v.risk = [v.risk, `${j.name} coûte ${short.map((r) => `${jc[r]} ${RES_LABEL[r]}`).join(' et ')} : il vous en resterait ${short.map((r) => s.res[r] - (spend[r] ?? 0) - (loss[r] ?? 0)).join(' et ')}`].filter(Boolean).join(' · ');
    }
    // une famille fervente qui cesserait de l'être : sa part au bilan disparaît, on le dit
    const cooled = FAMILIES.filter((f) => s.fam[f]?.state === 'presente' && s.fam[f].loy >= 3 && (v.famDir?.[f] ?? 0) < 0);
    if (cooled.length) v.risk = [v.risk, `${cooled.map((f) => capitalize(this.c.families[f].house[s.era])).join(' et ')} ne seraient plus fervents : plus de part au bilan (${cooled.map((f) => `+3 ${RES_LABEL[this.c.families[f].res]}`).join(', ')})`].filter(Boolean).join(' · ');
    const lq = o.effect.bet?.lose?.quartiers ?? 0;
    if (lq < 0) v.risk = [v.risk, `En cas d’échec : −${-lq} quartier${lq < -1 ? 's' : ''}`].filter(Boolean).join(' · ');
    const rj = o.effect.rivalJalon ?? 0;
    if (rj > 0) v.risk = [v.risk, `${capitalize(this.rival(s).name)} avancent d’une merveille`].filter(Boolean).join(' · ');
    if (rj < 0 && !o.effect.bet) v.detail = [v.detail, `${capitalize(this.rival(s).name)} perdent une merveille`].filter(Boolean).join(' · ');
    const g = o.effect.gain;
    if (g && RES.some((r) => (g[r] ?? 0) < 0)) {
      v.loss = {};
      for (const r of RES) if ((g[r] ?? 0) < 0) v.loss[r] = -g[r]!;
    }
    if (card.kind === 'carrefour') {
      const r = this.c.routes.find((x) => x.id === p.routes![i])!;
      v.ref = r.id;
      v.detail = fill(r.promise, s, this.c);
      v.risk = r.risk ? fill(r.risk, s, this.c) : undefined;
      if (r.family) v.families = [r.family];
    }
    if (card.kind === 'decouverte' && p.recruits?.[i]) {
      const d = this.card(p.recruits[i]);
      v.ref = d.id;
      v.detail = fill(d.gift ?? '', s, this.c);
    }
    if (o.credit) {
      const due = (o.effect.sched ?? []).find((x) => /^creance/.test(x.card));
      const who = due?.card === 'creance_rivale' ? capitalize(this.rival(s).name) : capitalize(this.c.families.troc.house[s.era]);
      const when = !due || due.in === 0 ? 'À la carte suivante' : 'Trois cartes plus tard';
      v.detail = [v.detail, `${who} avancent la somme. ${when}, la note : ${due?.pay ?? '?'} Trésor (ou en nature : Vivres et Armée ; ou par saisie de vos réserves).`].filter(Boolean).join(' · ');
      if (s.fam.troc.loy <= -1) v.risk = [v.risk, `${who} vous en veulent déjà : refuser la note les mettrait en révolte`].filter(Boolean).join(' · ');
    }
    if (o.effect.seize) {
      const total = RES.reduce((a, r) => a + s.res[r], 0);
      v.detail = `On saisit ${o.effect.seize} : le Trésor d’abord, puis les Vivres, l’Armée, le Savoir.`;
      if (total < o.effect.seize) v.risk = [v.risk, 'Vos réserves ne couvrent pas la note : un quartier sera saisi'].filter(Boolean).join(' · ');
    }
    if (card.kind === 'croissance' && o.effect.quartiers) {
      const after = Math.ceil((s.quartiers + o.effect.quartiers) * TUNING.upkeep) + Math.round(s.jalons.filter(Boolean).length * TUNING.wonderUpkeep);
      v.detail = `Ensuite, la cité mangera ${after} Vivres par ère (contre ${this.upkeepOf(s)}).`;
    }
    if (card.kind === 'proces' && p.qui?.[i]) {
      v.families = [p.qui[i], p.plaintiff!];
      v.detail = `${capitalize(this.c.families[p.qui[i]].house[s.era])} : ${this.familyInfo(s, p.qui[i]).mood}`;
    }
    if (card.kind === 'jalon' && o.effect.jalon) {
      const je = o.effect.jalonEra ?? s.era;
      const j = o.effect.jalon === 'alt' ? this.jalonAltOf(s, je) : this.dessein(s).jalons[je];
      if (j) {
        v.detail = `${fill(j.gift, s, this.c)} Entretien : +${TUNING.wonderUpkeep} Vivre par ère.`;
        v.ref = j.shape;
      }
    }
    return v;
  }

  /** Intensité des crises : vos merveilles attirent les prédateurs. */
  crisisK(s: GameState): number {
    return TUNING.crisisK * (s.iron ? TUNING.iron : 1) * (1 + TUNING.envy * s.jalons.filter(Boolean).length) * (s.mem.includes(`course_perdue_${s.era}`) ? 1.25 : 1);
  }

  /** Humeur et souvenir de la famille, en tête de sa carte. */
  familyLead(s: GameState, f: FamilyId): string {
    const loy = s.fam[f].loy;
    const m = this.c.moods[f];
    // les humeurs tournent avec les cartes de la famille déjà vues : pas deux fois la même phrase de suite
    const seen = s.history.filter((h) => this.c.cards[h.card]?.family === f && this.c.cards[h.card]?.kind === 'famille').length;
    const pickM = (a: string[]) => a[(s.seed + seen) % a.length];
    const mood = loy <= -2 ? pickM(m.hostile) : loy === -1 ? pickM(m.cold) : loy === 1 ? pickM(m.warm) : loy >= 2 ? pickM(m.devoted) : '';
    // un souvenir d'une ère passée, accordé à l'humeur (une rancune ne se montre pas chez qui vous adore)
    // un souvenir ne revient qu'une fois : trois ères plus tard (ou à l'ère suivante, pour les souvenirs tardifs)
    const rec = this.c.recalls.filter((r) => r.family === f && s.mem.includes(r.mem) && ((d) => d === 3 || (d === 1 && (s.memo[r.mem]?.era ?? 0) >= 2))(s.era - (s.memo[r.mem]?.era ?? s.era))
      && (r.tone !== 'neg' || loy <= 0) && (r.tone !== 'pos' || loy >= 0));
    const recall = rec.length ? rec[(s.era + s.seed) % rec.length].line : '';
    // une seule accroche : le souvenir une ère sur deux, l'humeur sinon (ou ce qui existe)
    const fi = FAMILIES.indexOf(f);
    if (recall && (!mood || (s.era + fi) % 2 === 0)) return recall;
    return mood || recall;
  }

  rival(s: GameState) {
    return this.c.rivals.find((r) => r.id === s.rival) ?? this.c.rivals[0];
  }

  /** Ce que la cité mange en fin d'ère : ses quartiers, et l'entretien de ses merveilles. */
  /** Les vivres qui arriveront au bilan avant le repas : la part des familles ferventes qui donnent du grain. */
  bilanVivres(s: GameState): number {
    return this.present(s).filter((f) => s.fam[f].loy >= 3 && this.c.families[f].res === 'vivres').length * 3;
  }

  upkeepOf(s: GameState): number {
    // les colonies se nourrissent elles-mêmes
    const fed = Math.max(0, s.quartiers - Math.min(s.colonies ?? 0, s.quartiers - 1));
    return Math.ceil(fed * TUNING.upkeep) + Math.round(s.jalons.filter(Boolean).length * TUNING.wonderUpkeep);
  }

  /** Ce que le présage annonce au début d'une ère : le jalon, la crise, l'envie, l'héritage. */
  presageInfo(s: GameState): PresageInfo {
    const d = this.dessein(s);
    const j = d.jalons[s.era];
    const alt = this.jalonAltOf(s, s.era);
    const cr = this.crisisOf(s);
    const built = s.jalons.filter(Boolean).length;
    const k = this.crisisK(s) / (TUNING.crisisK * (s.iron ? TUNING.iron : 1));
    const rv = this.rival(s);
    const r0 = s.ruins[0];
    const jv = (x: Jalon) => ({ name: fill(x.name, s, this.c), text: fill(x.text, s, this.c), gift: fill(x.gift, s, this.c), cost: this.costOf(s, x.cost), req: this.condLabel(s, x.req), shape: x.shape });
    return {
      era: s.era,
      name: ERA_NAMES[s.era],
      subtitle: ERA_SUBTITLES[s.era],
      date: eraDate(s.era, 0),
      dessein: d.name,
      jalon: s.jalons[s.era] ? null : jv(j),
      alt: alt && !s.jalons[s.era] ? jv(alt) : null,
      built,
      crisis: { name: cr.name, intro: fill(cr.intro, s, this.c), protects: ((t) => t.charAt(0).toLowerCase() + t.slice(1))(fill(cr.protects, s, this.c)) },
      envy: built > 0 ? Math.round((k - 1) * 100) : 0,
      rival: { name: capitalize(rv.name), leader: capitalize(rv.leader[s.era]), count: s.rivalJalons, next: rv.jalons[Math.min(4, s.rivalJalons)], rel: s.rivalRel },
      legacy: s.era === 0 && r0 ? {
        from: r0.name, label: r0.legacy?.label, testament: r0.testament, heirs: s.origin === 'heritiers',
        memory: [r0.ally ? `${capitalize(this.c.families[r0.ally].house[0])} servaient ${r0.name} jusqu’au bout : ils vous font confiance d’avance.` : '', r0.enemy ? `${capitalize(this.c.families[r0.enemy].house[0])} haïssaient ${r0.name} : ils se méfient déjà de vous.` : ''].filter(Boolean).join(' ') || undefined,
      } : undefined,
      upkeep: s.era >= ERAS - 1 ? 0 : this.upkeepOf(s),
      needs: this.crisisNeeds(s),
      needsIfBuilt: s.jalons[s.era] ? undefined : this.crisisNeeds({ ...s, jalons: s.jalons.map((b, i) => b || i === s.era) }).bag,
      needsIfRaceLost: this.form(s).id === 'course' && !s.mem.includes(`course_perdue_${s.era}`) && !s.mem.includes(`course_gagnee_${s.era}`) && s.rivalJalons < 5 ? this.crisisNeeds({ ...s, mem: [...s.mem, `course_perdue_${s.era}`] }).bag : undefined,
      wonderUpkeep: Math.round(s.jalons.filter(Boolean).length * TUNING.wonderUpkeep),
      nextJalon: s.era < 4 ? { name: d.jalons[s.era + 1].name, req: this.condLabel(s, d.jalons[s.era + 1].req) } : undefined,
      tag: j.req?.tags && !s.jalons[s.era] ? (() => {
        const t = (Object.keys(j.req!.tags!) as Tag[])[0];
        return { tag: t, need: j.req!.tags![t]!, ...this.tagSources(s, t) };
      })() : undefined,
    };
  }

  /** L'état d'une famille, pour l'interface : humeur, cicatrices, dernier souvenir. */
  familyInfo(s: GameState, f: FamilyId): FamilyInfo {
    const st = s.fam[f];
    const def = this.c.families[f];
    const loy = st.loy;
    const mood = st.state === 'eteinte' ? 'partis' : loy <= -3 ? 'révoltés' : loy <= -2 ? 'hostiles' : loy === -1 ? 'froissés' : loy === 0 ? 'neutres' : loy === 1 ? 'amicaux' : loy === 2 ? 'dévoués' : 'fervents';
    void 0;
    let scars = 0;
    for (const h of s.history) if ((h.loy?.[f] ?? 0) < 0) scars++;
    const wi = this.worstAct(s, f);
    const bi = this.bestAct(s, f);
    const w = s.history[wi];
    const b = s.history[bi];
    return {
      id: f,
      head: capitalize(def.head[s.era]),
      house: capitalize(def.house[s.era]),
      trade: def.trade[s.era],
      tag: def.tag,
      res: def.res,
      hue: def.hue,
      motif: def.motif,
      loy,
      state: st.state,
      mood,
      scars: Math.min(3, Math.floor(scars / 2)),
      grudge: w && loy <= 0 ? { label: w.label, date: w.date } : undefined,
      favor: b && loy >= 1 ? { label: b.label, date: b.date } : undefined,
      rivalOf: this.c.rivalries[f],
      neglected: st.state === 'presente' && s.era - Math.max(s.visits[f], -1) >= 2,
    };
  }

  betChance(s: GameState, b: NonNullable<Effect['bet']>): number {
    let c = b.chance;
    if (b.per) c += b.per.bonus * this.tagCount(s, b.per.tag);
    return Math.max(0.05, Math.min(0.95, c));
  }

  // ======================================================================= action

  act(s: GameState, index: number): Ev[] {
    const ev: Ev[] = [];
    const p = s.prompt;
    if (!p || s.phase === 'fin') return ev;
    const card = this.card(p.card);
    const opts = this.options(s, p);
    const o = opts[index];
    if (!o) return ev;
    const view = this.optionView(s, card, o, p, index);
    if (!view.enabled) return ev;
    const rng = Rng.fromState(s.rng);
    const before = { ...s.res };
    const loyBefore = Object.fromEntries(FAMILIES.map((f) => [f, s.fam[f].loy])) as Record<FamilyId, number>;
    let reply = o.reply;
    const memBefore = new Set(s.mem);
    const date = eraDate(s.era, s.turn - (s.eraStart ?? 0));
    const titleNow = this.view(s)?.title ?? card.title;
    const alts = this.options(s, p).filter((x) => this.canPay(s, x) && this.check(s, x.req)).length;
    // payer
    for (const r of RES) s.res[r] -= view.cost[r] ?? 0;

    if (card.kind === 'carrefour') {
      this.startSaison(s, p.routes![index], rng, ev);
    } else if (card.kind === 'proces') {
      reply = this.applyEffect(s, card, o.effect, rng, ev) ?? reply;
    } else {
      const r = this.applyEffect(s, card, o.effect, rng, ev);
      if (r) reply = r;
    }
    // un événement, une rencontre, une lettre ou une découverte ne se jouent qu'une fois : pas de redite
    if ((card.oneShot || ONE_SHOT.has(card.kind)) && !s.spent.includes(card.id)) s.spent.push(card.id);
    if (card.id === 'colonie' && (o.effect.quartiers ?? 0) > 0) s.colonies = (s.colonies ?? 0) + 1;
    // un acte cité par un hommage ne sera plus cité (ni par un autre hommage, ni par un procès)
    if (card.kind === 'hommage' && p.quote !== undefined && p.quote >= 0 && !s.mem.includes(`juge_${p.quote}`)) s.mem.push(`juge_${p.quote}`);
    if (reply && ev.some((x) => x.type === 'quartiers' && x.shielded)) {
      const se = ev.find((x) => x.type === 'quartiers' && x.shielded) as { by?: string; paid?: Bag };
      const shName = se.by ?? 'Une merveille';
      const shPaid = RES.filter((r) => se.paid?.[r]).map((r) => `${se.paid![r]} ${RES_LABEL[r]}`).join(', ') || 'des réserves';
      reply = ev.some((x) => x.type === 'quartiers' && x.delta < 0)
        ? `${reply} ${shName} a racheté un quartier ; pas l’autre.`
        : `${reply} Du moins, c’est ce qui serait arrivé sans ${shName.charAt(0).toLowerCase() + shName.slice(1)} : le quartier est racheté, contre ${shPaid}.`;
    }
    if (card.arc) {
      if (!s.arcs.open.includes(card.arc)) s.arcs.open.push(card.arc);
      if (card.finale && !s.arcs.done.includes(card.arc)) s.arcs.done.push(card.arc);
    }
    if (card.family && s.fam[card.family]) s.fam[card.family].seen = s.era;

    // les souvenirs gardent la décision mot pour mot, avec sa date : les familles s'en serviront
    for (const m of s.mem) if (!memBefore.has(m)) s.memo[m] = { label: view.label, date, title: titleNow, era: s.era };
    const loy: Partial<Record<FamilyId, number>> = {};
    for (const f of FAMILIES) if (s.fam[f].loy !== loyBefore[f]) loy[f] = s.fam[f].loy - loyBefore[f];
    const v = this.view(s);
    // une réplique qui revient dans la partie (sur cette carte ou une autre) passe à sa variante suivante
    const rk = reply && reply.includes('‖') ? hashString(reply.replace(/\{[A-Za-z]+:\w+\}/g, '{}')) : undefined;
    if (reply && rk !== undefined) reply = variant(reply, String(rk), s.seed, s.history.filter((h) => h.rk === rk).length, s.run);
    s.history.push({
      turn: s.turn,
      era: s.era,
      date,
      card: card.id,
      title: v?.title ?? card.title,
      choice: index,
      label: view.label,
      alts,
      reply: reply ? fill(reply, s, this.c, this.ruinExtras(s)) : undefined,
      ...(rk !== undefined ? { rk } : {}),
      loy,
      from: p.from,
      res: { ...s.res },
      quartiers: s.quartiers,
    });
    if (reply) ev.unshift({ type: 'reply', text: fill(reply, s, this.c, this.ruinExtras(s)) });
    if (RES.some((r) => s.res[r] !== before[r])) ev.push({ type: 'res', before, after: { ...s.res } });
    s.turn++;
    s.growth++;

    if (s.quartiers <= 0) {
      this.finish(s, ev, 'defaite');
    } else {
      this.advance(s, rng, ev);
    }
    s.rng = rng.getState();
    return ev;
  }

  /** Applique un effet ; renvoie la réplique de la branche choisie, s'il y en a une. */
  applyEffect(s: GameState, card: CardDef, e: Effect, rng: Rng, ev: Ev[], nested = false): string | undefined {
    let reply = e.reply;
    if (e.if) {
      const branch = this.check(s, e.if) ? e.then : e.else;
      if (branch) {
        const r = this.applyEffect(s, card, branch, rng, ev, true);
        if (r) reply = r;
      }
    }
    if (e.bet) {
      const chance = this.betChance(s, e.bet);
      const win = rng.next() < chance;
      ev.push({ type: 'bet', win, chance });
      const r = this.applyEffect(s, card, win ? e.bet.win : e.bet.lose, rng, ev, true);
      if (r) reply = r;
    }
    // les gains (cachés au joueur) passent par un coefficient d'équilibrage ; les pertes restent telles qu'écrites
    if (e.gain) for (const r of RES) if (e.gain[r]) {
      // une perte plus grosse que la réserve n'est pas gratuite : la famille de cette ressource comble le trou, et s'en souvient
      if (e.gain[r]! < 0 && s.res[r] + e.gain[r]! < 0) {
        // un cran par tranche de trois manquants (deux au plus)
        const f = this.owner(r);
        if (f) this.changeLoy(s, f, -Math.min(2, Math.ceil(-(s.res[r] + e.gain[r]!) / 3)), ev, false);
      }
      s.res[r] = Math.max(0, s.res[r] + (e.gain[r]! > 0 ? Math.max(1, Math.round(e.gain[r]! * TUNING.gain)) : e.gain[r]!));
    }
    if (e.loy) for (const f of Object.keys(e.loy) as FamilyId[]) this.changeLoy(s, f, e.loy[f]!, ev);
    // la palissade rachète une perte subie (seuil raté, pari perdu, trahison, bilan), jamais un quartier qu'on cède soi-même
    if (e.quartiers) this.changeQuartiers(s, e.quartiers, e.cause ?? card.title, card.id, ev, nested || !!e.forced || card.kind === 'trahison');
    if (e.seize) {
      // on saisit le Trésor, puis les Vivres, l'Armée, le Savoir ; s'il manque encore, un quartier
      let due = e.seize;
      const before = { ...s.res };
      for (const r of ['tresor', 'vivres', 'armee', 'savoir'] as Res[]) {
        const take = Math.min(due, s.res[r]);
        s.res[r] -= take;
        due -= take;
      }
      if (RES.some((r) => s.res[r] !== before[r])) ev.push({ type: 'res', before, after: { ...s.res } });
      if (due > 0) this.changeQuartiers(s, -1, card.id === 'creance_rivale' ? '{rival}, qui saisissent un quartier faute de mieux' : 'la saisie des Troc, faute de réserves', card.id, ev, true);
    }
    for (const m of e.mem ?? []) if (!s.mem.includes(m)) s.mem.push(m);
    for (const m of e.unmem ?? []) s.mem = s.mem.filter((x) => x !== m);
    if (e.unsched?.length) s.sched = s.sched.filter((x) => !e.unsched!.includes(x.card));
    for (const sc of e.sched ?? []) {
      const v = this.view(s);
      // à la dernière ère, une dette refusée ne peut plus attendre : elle revient tout de suite (sinon refuser serait gratuit)
      const wait = s.era >= ERAS - 1 && /^creance/.test(sc.card) ? 0 : sc.in;
      s.sched.push({ card: sc.card, at: s.turn + 1 + wait, from: v?.title ?? card.title, ...(sc.pay ? { pay: sc.pay } : {}) });
      ev.push({ type: 'sched', card: sc.card });
    }
    for (const id of e.addCard ?? []) {
      if (!s.deck.includes(id)) {
        s.deck.push(id);
        ev.push({ type: 'card+', id });
      }
    }
    for (const id of e.removeCard ?? []) {
      if (s.deck.includes(id)) {
        s.deck = s.deck.filter((x) => x !== id);
        s.pool = s.pool.filter((x) => x !== id);
        ev.push({ type: 'card-', id });
      }
    }
    if (e.rival) {
      s.rivalRel = Math.max(-3, Math.min(3, s.rivalRel + e.rival));
      ev.push({ type: 'rival', delta: e.rival, value: s.rivalRel });
    }
    if (e.rivalJalon) {
      const before = s.rivalJalons;
      s.rivalJalons = Math.max(0, Math.min(5, s.rivalJalons + e.rivalJalon));
      const d = s.rivalJalons - before;
      if (d) ev.push({ type: 'rivalJalon', count: s.rivalJalons, delta: d, name: this.rival(s).jalons[Math.max(0, d < 0 ? before - 1 : s.rivalJalons - 1)] });
      // un sabotage retarde la rivale : elle ne bâtit pas au bilan de cette ère
      if (d < 0 && !s.mem.includes(`rival_freine_${s.era}`)) s.mem.push(`rival_freine_${s.era}`);
    }
    if (e.famState) {
      s.fam[e.famState.id].state = e.famState.state;
      ev.push({ type: 'famState', family: e.famState.id, state: e.famState.state });
    }
    const je = e.jalonEra ?? s.era;
    if (e.jalon && !s.jalons[je]) {
      s.jalons[je] = true;
      if (e.jalon === 'alt') s.jalonAlt.push(je);
      ev.push({ type: 'jalon', era: je, name: this.jalonOf(s, je).name });
      // une merveille qui pose un plancher de loyauté relève aussitôt ceux qui sont dessous
      for (const p of this.passives(s)) {
        if (p.type !== 'loyalty') continue;
        for (const f of Object.keys(s.fam) as FamilyId[]) {
          const st = s.fam[f];
          if ((p.family === 'all' || p.family === f) && st.state === 'presente' && st.loy < p.floor) {
            ev.push({ type: 'loy', family: f, delta: p.floor - st.loy, value: p.floor });
            st.loy = p.floor;
          }
        }
      }
    }
    return reply;
  }

  changeLoy(s: GameState, f: FamilyId, d: number, ev: Ev[], cascade = true): void {
    const st = s.fam[f];
    if (!st || st.state !== 'presente' || !d) return;
    let floor = -3;
    for (const p of this.passives(s)) if (p.type === 'loyalty' && (p.family === 'all' || p.family === f)) floor = Math.max(floor, p.floor);
    const v = Math.max(floor, clampLoy(st.loy + d));
    if (v === st.loy) return;
    const delta = v - st.loy;
    st.loy = v;
    ev.push({ type: 'loy', family: f, delta, value: v });
    // favoriser une famille froisse celle qui la méprise
    if (cascade && delta >= 2) this.changeLoy(s, this.c.rivalries[f], -1, ev, false);
  }

  changeQuartiers(s: GameState, d: number, cause: string, cardId: string, ev: Ev[], shieldable = true): void {
    if (cause.includes('{')) {
      const filled = fill(cause, s, this.c, this.ruinExtras(s));
      cause = /^([a-zà-ÿ]|\{rival\})/.test(cause) ? filled.charAt(0).toLowerCase() + filled.slice(1) : filled;
    }
    // une merveille rachète la première perte subie de l'ère, contre des réserves : à sec, elle ne protège rien
    const sh = this.passives(s).find((p) => p.type === 'shield') as { type: 'shield'; amount: number; res: Res } | undefined;
    if (d < 0 && shieldable && !s.shieldUsed && sh) {
      const price = scaleN(Math.round(sh.amount * (1 + 0.5 * (s.shieldUses ?? 0))), s.era);
      if (s.res[sh.res] >= price) {
        s.shieldUsed = true;
        s.shieldUses = (s.shieldUses ?? 0) + 1;
        s.res[sh.res] -= price;
        d += 1;
        ev.push({ type: 'quartiers', delta: 0, cause, shielded: true, paid: { [sh.res]: price }, by: this.shieldInfo(s)?.name });
        if (d === 0) return;
      }
    }
    s.quartiers = Math.max(0, Math.min(12, s.quartiers + d));
    if (d < 0) s.losses.push({ turn: s.turn, era: s.era, card: cardId, amount: -d, cause });
    ev.push({ type: 'quartiers', delta: d, cause });
  }

  // ======================================================================= déroulé

  private buildPool(s: GameState, rng: Rng): void {
    const pool: string[] = [];
    for (const f of this.present(s)) {
      const id = this.familyCard(s, f);
      if (id) pool.push(id);
    }
    for (const id of s.deck) {
      const d = this.c.cards[id];
      const first = Math.min(...(d?.eras ?? [s.era]));
      if (d?.options.length && !s.spent.includes(id) && s.era - first <= 1) pool.push(id);
    }
    const events = (this.c.events[s.era] ?? []).filter((id) => {
      const c = this.c.cards[id];
      return this.available(s, c) && !s.spent.includes(id) && this.check(s, c.cond);
    });
    // les échos du passé passent d'abord : un souvenir qui revient ne doit rien au hasard
    const echoes = events.filter((id) => this.c.cards[id].echo);
    const plain = events.filter((id) => !this.c.cards[id].echo);
    const n = Math.max(0, Math.min(plain.length, 2 - Math.min(1, echoes.length)));
    pool.push(...echoes, ...this.freshFirst(s, plain, n, rng));
    const bucket = s.rivalRel <= -1 ? this.c.rivalCards.hostile : s.rivalRel >= 1 ? this.c.rivalCards.friendly : this.c.rivalCards.neutral;
    const rv = bucket.filter((id) => this.available(s, this.c.cards[id]) && !s.spent.includes(id) && this.check(s, this.c.cards[id]?.cond) && (this.c.cards[id].eras?.includes(s.era) ?? true));
    if (rv.length) pool.push(rng.pick(rv));
    // les revenants d'une civilisation morte arrivent à la troisième ère
    if (s.era === 2 && s.ruins[0]?.grudge && !s.spent.includes(this.c.revenantCard)) pool.push(this.c.revenantCard);
    // mélangé, mais les échos d'abord : ils seront joués cette ère, quoi qu'il arrive
    const mixed = rng.shuffle(pool);
    s.pool = [...mixed.filter((id) => this.c.cards[id]?.echo), ...mixed.filter((id) => !this.c.cards[id]?.echo)];
    // une rivale qui a triomphé réclame son tribut dès le début de l'ère, la dernière comprise
    if (s.rivalJalons >= 5 && s.spent.includes('triomphe')) s.pool.unshift('tribut');
  }

  familyCard(s: GameState, f: FamilyId): string | undefined {
    const ids = (this.c.familyCards[f]?.[s.era] ?? []).filter((id) => {
      const c = this.c.cards[id];
      return c && !s.spent.includes(id) && this.check(s, c.cond);
    });
    // une variante liée à un souvenir passe d'abord ; sinon, la graine choisit parmi les cartes ordinaires
    const conditional = ids.find((id) => this.c.cards[id].cond);
    if (conditional) return conditional;
    if (!ids.length) return undefined;
    // la variante vue à la partie précédente cède la place à l'autre
    const fresh = ids.filter((id) => !s.avoid?.includes(id));
    const pool = fresh.length ? fresh : ids;
    const h = Math.abs(Math.imul(s.seed ^ (s.era * 7919 + FAMILIES.indexOf(f) * 104729), 2654435761)) >>> 0;
    return pool[h % pool.length];
  }

  private routesFor(s: GameState, rng: Rng): string[] {
    const ok = this.c.routes.filter((r) => {
      if (r.family && s.fam[r.family].state !== 'presente') return false;
      return this.check(s, r.cond);
    });
    const picks: string[] = [];
    // les ruines d'une civilisation passée attendent à la deuxième ère : la route de l'inconnu y mène
    const unknown = ok.find((r) => r.id === 'inconnu');
    if (s.era === 1 && s.saison === 0 && s.ruins.length && unknown && !s.spent.includes(this.c.ruinsCard)) picks.push(unknown.id);
    const fams = rng.shuffle(ok.filter((r) => r.family && !picks.includes(r.id)));
    // une famille délaissée depuis longtemps réclame sa visite
    fams.sort((a, b) => s.visits[a.family!] - s.visits[b.family!]);
    const others = rng.shuffle(ok.filter((r) => !r.family && !picks.includes(r.id)));
    while (picks.length < 3 && fams.length) {
      picks.push(fams.shift()!.id);
      if (picks.length < 3 && others.length && rng.chance(0.55)) picks.push(others.shift()!.id);
    }
    while (picks.length < 3 && others.length) picks.push(others.shift()!.id);
    return rng.shuffle(picks.slice(0, 3));
  }

  private startSaison(s: GameState, routeId: string, rng: Rng, ev: Ev[]): void {
    const r = this.c.routes.find((x) => x.id === routeId)!;
    const fm = this.form(s);
    // l'Errance : la tribu chasse et cueille à chaque saison, mais ne porte pas tout ; au-delà, les vivres pourrissent
    if (fm.id === 'errance') {
      const cap = this.carryCap(s);
      const v = s.res.vivres + 2;
      s.res.vivres = Math.min(cap, v);
      ev.push({ type: 'rot', amount: Math.max(0, v - cap), cap, hunt: 2 });
    }
    const pile: string[] = [];
    let enc = r.encounters.filter((id) => !s.spent.includes(id) && this.check(s, this.c.cards[id]?.cond) && (this.c.cards[id].eras?.includes(s.era) ?? true));
    if (routeId === 'inconnu' && s.ruins.length && !s.spent.includes(this.c.ruinsCard) && s.era >= 1) enc = [this.c.ruinsCard];
    let fc: string | undefined;
    if (r.family) {
      s.visits[r.family] = s.era;
      fc = s.pool.find((id) => this.c.cards[id]?.family === r.family && this.c.cards[id].kind === 'famille');
    }
    // saisons longues : le lieu, puis la famille ; saisons courtes : la famille (ou le lieu), puis une carte du jour
    if (fm.cards >= 3 || !fc) if (enc.length) pile.push(...this.freshFirst(s, enc, 1, rng));
    if (fc) {
      pile.push(fc);
      s.pool = s.pool.filter((x) => x !== fc);
    }
    while (pile.length < fm.cards && s.pool.length) pile.push(s.pool.shift()!);
    // la règle de l'ère ouvre la saison : une colonie à fonder, ou le Conseil
    if (fm.id === 'contagion') pile.unshift('colonie');
    if (fm.id === 'conseil' && this.present(s).length > 1) pile.unshift('conseil');
    // une merveille manquée revient sur la table à la dernière saison : la rattraper, plus cher, ou garder ses forces
    if (fm.seasons > 1 && s.saison === fm.seasons - 1 && this.missedJalon(s) >= 0) pile.push('rattrapage');
    s.pile = pile;
    ev.push({ type: 'saison', saison: s.saison, route: routeId });
    // le Jugement : plus aucun revenu
    if (fm.id === 'jugement') return;
    // revenu des découvertes et merveilles, à chaque saison
    const inc: Bag = {};
    for (const p of this.passives(s)) if (p.type === 'income') inc[p.res] = (inc[p.res] ?? 0) + p.amount;
    if (Object.keys(inc).length) {
      for (const k of Object.keys(inc) as Res[]) s.res[k] += inc[k]!;
      ev.push({ type: 'passive', bag: inc });
    }
  }

  /** Passe à l'invite suivante. */
  advance(s: GameState, rng: Rng, ev: Ev[]): void {
    for (let guard = 0; guard < 40; guard++) {
      // une suite programmée passe avant tout (sauf pendant le présage et les carrefours)
      // après la dernière carte de crise, seules les créances passent : le bilan vient tout de suite (les suites attendront l'ère suivante)
      const due = s.sched.findIndex((x) => x.at <= s.turn && (s.phase !== 'crise' || s.pile.length > 0 || /^creance/.test(x.card)));
      if (due >= 0 && (s.phase === 'saison' || s.phase === 'crise') && s.prompt && this.c.cards[s.prompt.card]?.kind !== 'carrefour') {
        const d = s.sched.splice(due, 1)[0];
        const c = this.c.cards[d.card];
        if (c && this.check(s, c.cond)) {
          s.prompt = this.makePrompt(s, d.card, rng, d.from);
          if (d.pay) s.prompt.pay = d.pay;
          return;
        }
        continue;
      }
      if (s.phase === 'presage') {
        s.phase = 'saison';
        s.saison = 0;
        s.prompt = { card: 'carrefour', routes: this.routesFor(s, rng) };
        if (s.tutorial && s.era === 0 && s.saison === 0 && s.turn === 1) {
          // première partie : les cartes du tutoriel ouvrent la première saison
        }
        return;
      }
      if (s.phase === 'saison') {
        if (s.pile.length) {
          const id = s.pile.shift()!;
          if (s.spent.includes(id) && this.c.cards[id]?.oneShot) continue;
          s.prompt = this.makePrompt(s, id, rng);
          return;
        }
        const fm = this.form(s);
        const last = s.saison >= fm.seasons - 1;
        // la Contagion : la crise se répand, une carte à la fin de chaque saison
        if (fm.id === 'contagion' && !s.mem.includes(`contagion_${s.era}_${s.saison}`)) {
          s.mem.push(`contagion_${s.era}_${s.saison}`);
          const cid = this.crisisOf(s).cards[s.saison];
          if (cid && this.c.cards[cid]) {
            s.prompt = this.makePrompt(s, cid, rng);
            return;
          }
        }
        // le chantier ouvre dès la fin de la première saison (à chaque saison pendant la Course)
        const course = fm.id === 'course';
        let raceShort: Bag | undefined;
        const key = course ? `chantier_tot_${s.era}_${s.saison}` : `chantier_tot_${s.era}`;
        // pendant la Course, le chantier ouvre à la fin des deuxième et troisième saisons (pas dès la première)
        if ((course ? s.saison >= 1 && s.saison <= RACE_END - 1 : s.saison === 0 && !last) && !s.jalons[s.era] && !s.mem.includes(key)) {
          s.mem.push(key);
          // seulement si la merveille est déjà à portée : sinon, rendez-vous avant la crise
          const early: Prompt = { card: 'jalon', early: true };
          if (this.options(s, early).some((o) => o.effect.jalon && this.canPay(s, o) && this.check(s, o.req))) {
            s.prompt = early;
            return;
          }
          // pendant la Course, un chantier fermé faute de moyens se dit (avec ce qui manque)
          if (course) {
            const j = this.dessein(s).jalons[s.era];
            const cost = this.costOf(s, j.cost);
            raceShort = Object.fromEntries(RES.filter((r) => (cost[r] ?? 0) > s.res[r]).map((r) => [r, cost[r]! - s.res[r]])) as Bag;
          }
        }
        // la Course : la rivale avance d'une étape par saison ; bâtir avant sa dernière étape, c'est gagner
        if (course && s.rivalJalons < 5 && !s.mem.includes(`course_${s.era}_${s.saison}`)) {
          s.mem.push(`course_${s.era}_${s.saison}`);
          const decided = s.mem.includes(`course_gagnee_${s.era}`) || s.mem.includes(`course_perdue_${s.era}`);
          if (!decided) {
            const won = !!s.jalons[s.era];
            const lost = !won && s.saison + 1 >= RACE_END;
            if (won) s.mem.push(`course_gagnee_${s.era}`);
            if (lost) s.mem.push(`course_perdue_${s.era}`);
            ev.push({ type: 'raceStep', stage: Math.min(RACE_END, s.saison + 1), of: RACE_END, won, lost, ...(raceShort && !won ? { short: raceShort } : {}) });
          }
        }
        if (!last) {
          s.saison++;
          s.prompt = { card: 'carrefour', routes: this.routesFor(s, rng) };
          return;
        }
        // le Jugement : vos actes sont jugés au sortir de la saison, avant le chantier et la crise
        if (fm.id === 'jugement' && !s.mem.includes(`jugement_${s.era}`)) {
          s.mem.push(`jugement_${s.era}`);
          const jp = this.stepPrompt(s, 'jugement', rng);
          if (jp) {
            s.prompt = jp;
            return;
          }
        }
        // le chantier du jalon, avant la crise : bâtir, c'est affronter la crise plus pauvre
        s.phase = 'chantier';
        if (s.jalons[s.era]) continue;
        s.prompt = { card: 'jalon' };
        return;
      }
      if (s.phase === 'chantier') {
        // la crise
        s.phase = 'crise';
        const cr = this.crisisOf(s);
        const fm = this.form(s);
        // la Contagion a déjà joué une carte par saison : il reste la dernière
        // la Course : une crise éclair, deux cartes (la première et la dernière)
        const pile = fm.id === 'contagion' ? cr.cards.slice(fm.seasons) : this.crisisCards(s);
        // une famille qui vous hait choisit ce moment pour trahir (au Conseil, dès qu'elle vous en veut)
        const lim = fm.id === 'conseil' ? -1 : -2;
        const traitor = this.present(s).filter((f) => s.fam[f].loy <= lim).sort((a, b) => s.fam[a].loy - s.fam[b].loy)[0];
        if (traitor) {
          // la deuxième et la troisième trahison ne refont pas le même coup
          const base = this.c.betrayal[traitor];
          const n = s.history.filter((h) => h.card === base || h.card.startsWith(`${base}_`)).length;
          // la première trahison n'est pas celle de la partie précédente
          const order = [base, `${base}_2`, `${base}_3`].filter((x) => this.c.cards[x]);
          const start = n === 0 && s.avoid?.includes(base) && order.length > 1 ? 1 : 0;
          pile.splice(1, 0, order[Math.min(order.length - 1, start + n)]);
        }
        s.pile = pile;
        ev.push({ type: 'crisis', era: s.era, name: cr.name });
        continue;
      }
      if (s.phase === 'crise') {
        if (s.pile.length) {
          const id = s.pile.shift()!;
          if (id.startsWith('@')) {
            const p = this.stepPrompt(s, id.slice(1), rng);
            if (p) {
              s.prompt = p;
              return;
            }
            continue;
          }
          s.prompt = this.makePrompt(s, id, rng);
          return;
        }
        // les greniers ne suffiront pas : on le dit avant le bilan, et on peut encore acheter du grain
        if (s.era < ERAS - 1 && s.res.vivres + this.bilanVivres(s) < this.upkeepOf(s) && !s.mem.includes(`disette_${s.era}`)) {
          s.mem.push(`disette_${s.era}`);
          s.prompt = { card: 'disette' };
          return;
        }
        this.startEraEnd(s, rng, ev);
        if ((s.phase as string) === 'fin') return;
        continue;
      }
      if (s.phase === 'finere') {
        if (s.steps.length) {
          const step = s.steps.shift()!;
          const p = this.stepPrompt(s, step, rng);
          if (p) {
            s.prompt = p;
            return;
          }
          continue;
        }
        // ère suivante ou fin
        if (s.era >= ERAS - 1) {
          this.finish(s, ev, 'victoire');
          return;
        }
        s.era++;
        s.eraStart = s.turn;
        s.saison = 0;
        s.shieldUsed = false;
        this.buildPool(s, rng);
        s.phase = 'presage';
        s.prompt = { card: 'presage' };
        ev.push({ type: 'era', era: s.era });
        return;
      }
      return;
    }
  }

  /**
   * L'atout et le handicap d'une origine, calculés à partir de ses données (jamais écrits à la main : ils ne
   * peuvent pas diverger du jeu). Référence : quatre réserves pour 17 en tout, trois quartiers, des familles neutres.
   */
  originTraits(o: OriginDef): { atout: string; handicap: string; ups: string[]; downs: string[] } {
    const up: string[] = [];
    const down: string[] = [];
    if (o.mem?.includes('heritiers')) { up.push('Héritage compté double'); down.push('Vieux ennemis plus hostiles'); }
    // une règle propre (le limon du fleuve) passe avant les chiffres de départ
    for (const id of o.deck ?? []) for (const p of this.c.cards[id]?.passive ?? []) if (p.type === 'income') up.push(`+${p.amount} ${RES_LABEL[p.res]} par saison`);
    const loys = FAMILIES.map((f) => o.loy?.[f] ?? 0);
    if (loys.every((x) => x > 0)) up.push(`Les 4 familles amicales`);
    if (!loys.every((x) => x > 0)) for (const f of FAMILIES) if ((o.loy?.[f] ?? 0) > 0) up.push(`${capitalize(this.c.families[f].house[0].replace(/^les /, ''))} amicaux`);
    for (const f of FAMILIES) if ((o.loy?.[f] ?? 0) < 0) down.push(`${capitalize(this.c.families[f].house[0].replace(/^les /, ''))} méfiants`);
    if (o.quartiers > 3) up.push(`${o.quartiers} quartiers au départ`);
    if (o.quartiers < 3) down.push(`${o.quartiers} quartiers seulement`);
    const ref: Resources = { vivres: 6, armee: 4, savoir: 3, tresor: 4 };
    for (const r of RES) {
      if (o.res[r] <= 1) down.push(`${RES_LABEL[r]} faible (${o.res[r]})`);
      else if (o.res[r] >= ref[r] + 3) up.push(`${RES_LABEL[r]} abondant (${o.res[r]})`);
    }
    const total = RES.reduce((a, r) => a + o.res[r], 0);
    if (total <= 15 && !down.some((d) => d.includes('faible'))) down.push('Réserves maigres');
    return { atout: up[0] ?? 'Équilibre', handicap: down[0] ?? 'Aucun', ups: up, downs: down };
  }

  /**
   * Voir clair : la Science (découvertes, savants qui vous aiment), les merveilles et un Savoir abondant
   * resserrent les fourchettes de gains ; à 5 points, les chiffres sont exacts.
   */
  insight(s: GameState): { level: 0 | 1 | 2; points: number } {
    const points = this.tagCount(s, 'Science') + Math.floor(s.jalons.filter(Boolean).length / 2) + (s.res.savoir >= 10 ? 1 : 0);
    return { level: points >= 5 ? 2 : points >= 2 ? 1 : 0, points };
  }

  /** Le prix pour voir les chiffres exacts de la carte en cours (en Savoir). */
  peekCost(s: GameState): number {
    return Math.max(1, Math.round(ERA_SCALE[s.era]));
  }

  /** Peut-on payer pour voir les chiffres exacts ? (des gains en fourchette sur la carte, et le Savoir pour payer) */
  canPeek(s: GameState): { offer: boolean; afford: boolean } {
    if (s.phase === 'fin' || s.phase === 'presage' || s.peek === s.turn || this.insight(s).level === 2) return { offer: false, afford: false };
    const v = this.view(s);
    const offer = !!v?.options.some((o) => o.gains && Object.values(o.gains).some((g) => g && g[0] !== g[1]));
    return { offer, afford: offer && s.res.savoir >= this.peekCost(s) };
  }

  /** Payer pour voir : les gains de la carte en cours s'affichent au chiffre près. */
  peek(s: GameState): boolean {
    const c = this.canPeek(s);
    if (!c.afford) return false;
    s.res.savoir -= this.peekCost(s);
    s.peek = s.turn;
    return true;
  }

  /**
   * Prêt pour la crise ? Pour chaque carte de la crise, existe-t-il dès maintenant une réponse qui tient (seuil atteint,
   * coût payable) sans sacrifier une famille ni un quartier ? Un indicateur simple pour le présage.
   */
  crisisReadiness(s: GameState): { covered: number; total: number; level: 'pret' | 'presque' | 'non'; missing: Bag; answer?: string; answerNeed?: Bag; answerHave?: Bag } {
    let covered = 0;
    let total = 0;
    const missing: Bag = {};
    let answer: string | undefined;
    let answerNeed: Bag | undefined;
    let answerHave: Bag | undefined;
    // les cartes se paient l'une après l'autre : ce qu'une réponse dépense manque à la suivante (tour 5 des juges :
    // « Prêt » quand chaque carte, prise seule, avait sa réponse, mais pas toutes ensemble)
    const left = { ...s.res };
    const at = (): GameState => ({ ...s, res: left });
    for (const id of this.crisisCards(s)) {
      const c = this.c.cards[id];
      if (!c || c.qui) continue;
      total++;
      let pick: Bag | null = null;
      let pickN = Infinity;
      for (const o of this.options(s, { card: id })) {
        const st = at();
        if (!this.canPay(st, o) || !this.check(st, o.req)) continue;
        if ((o.effect.quartiers ?? 0) < 0) continue;
        if (Object.values(o.effect.loy ?? {}).some((x) => (x ?? 0) <= -2)) continue;
        if (o.effect.if && !this.check(st, o.effect.if) && ((o.effect.else?.quartiers ?? 0) < 0 || (o.effect.else?.else?.quartiers ?? 0) < 0)) continue;
        // ce que la réponse dépense vraiment : son coût, ses pertes certaines, et ce que coûte l'issue réussie
        const spend: Bag = {};
        const cost = this.costOf(s, o.cost);
        const loss = this.certainLoss(o);
        const then = o.effect.if && this.check(st, o.effect.if) ? o.effect.then?.gain : undefined;
        let n = 0;
        for (const r of RES) {
          const v = (cost[r] ?? 0) + (loss[r] ?? 0) + Math.max(0, -(then?.[r] ?? 0));
          if (v) { spend[r] = v; n += v; }
        }
        if (n < pickN) { pick = spend; pickN = n; }
      }
      if (pick) {
        covered++;
        for (const r of RES) left[r] = Math.max(0, left[r] - (pick[r] ?? 0));
      } else {
        // ce qui manque pour la réponse la plus proche (coût et seuil), sans sacrifice
        let best: Bag | null = null;
        let bestN = Infinity;
        let bestLabel: string | undefined;
        let bestNeed: Bag | undefined;
        for (const o of this.options(s, { card: id })) {
          if (!this.check(s, o.req) || (o.effect.quartiers ?? 0) < 0) continue;
          const need: Bag = {};
          for (const r of RES) need[r] = (this.costOf(s, o.cost)[r] ?? 0) + (o.effect.if?.res?.[r] ?? 0);
          const short: Bag = {};
          let n = 0;
          for (const r of RES) {
            const d = (need[r] ?? 0) - left[r];
            if (d > 0) { short[r] = d; n += d; }
          }
          if (n > 0 && n < bestN) { best = short; bestN = n; bestLabel = o.label; bestNeed = need; }
        }
        if (best) for (const r of RES) if (best[r]) missing[r] = Math.max(missing[r] ?? 0, best[r]!);
        if (bestLabel && !answer) {
          answer = fill(bestLabel, s, this.c, this.ruinExtras(s));
          answerNeed = Object.fromEntries(RES.filter((r) => bestNeed![r]).map((r) => [r, bestNeed![r]])) as Bag;
          // ce qu'il vous restera à cette carte, une fois payées les précédentes
          answerHave = Object.fromEntries(RES.filter((r) => bestNeed![r]).map((r) => [r, left[r]])) as Bag;
        }
      }
    }
    const level = covered >= total ? 'pret' : covered * 2 >= total ? 'presque' : 'non';
    return { covered, total, level, missing, answer, answerNeed, answerHave };
  }

  /** La plus récente des merveilles manquées des ères passées (−1 s'il n'y en a pas). */
  missedJalon(s: GameState): number {
    for (let e = s.era - 1; e >= 0; e--) if (!s.jalons[e]) return e;
    return -1;
  }

  private makePrompt(s: GameState, id: string, rng: Rng, from?: string): Prompt {
    const c = this.card(id);
    const p: Prompt = { card: id };
    if (id === 'rattrapage') p.missed = this.missedJalon(s);
    if (from) p.from = from;
    if (c.qui) {
      // une famille déjà au plus bas ne peut pas servir de bouc émissaire : la blâmer ne coûterait rien
      const fams = this.present(s).filter((f) => !c.qui!.exclude?.includes(f) && !(s.fam[f].loy <= -3 && (c.qui!.option(f).effect.loy?.[f] ?? 0) < 0));
      p.qui = rng.sample(fams, Math.min(c.qui.count, fams.length));
    }
    return p;
  }

  private startEraEnd(s: GameState, rng: Rng, ev: Ev[]): void {
    s.phase = 'finere';
    ev.push({ type: 'bilan' });
    let rivalTriumph = false;
    // les Peintures de la grotte : on pardonne à qui l'on a peint
    const mended = new Set<FamilyId>();
    if (this.passives(s).some((p) => p.type === 'mend')) {
      for (const f of this.present(s)) if (s.fam[f].loy <= -2) {
        mended.add(f);
        this.changeLoy(s, f, 1, ev, false);
        ev.push({ type: 'mend', family: f });
      }
    }
    // révoltes des familles ulcérées
    for (const f of this.present(s)) {
      if (s.fam[f].loy <= -3) {
        const name = capitalize(this.c.families[f].house[s.era]);
        if (s.mem.includes(`revolte_${f}`)) {
          s.fam[f].state = 'rivale';
          s.rivalRel = Math.max(-3, s.rivalRel - 1);
          ev.push({ type: 'defect', family: f });
          if (!s.losses.some((l) => l.era === s.era && l.card.startsWith(`trahison_${f}`))) this.changeQuartiers(s, -1, `la défection des ${this.c.families[f].house[s.era].replace(/^les /, '')}, passés chez ${this.rival(s).name}`, `defection_${f}`, ev);
        } else {
          s.mem.push(`revolte_${f}`);
          s.fam[f].loy = -1;
          ev.push({ type: 'revolt', family: f });
          // une famille ne coûte pas deux quartiers dans la même ère (trahison puis révolte)
          if (!s.losses.some((l) => l.era === s.era && l.card.startsWith(`trahison_${f}`))) this.changeQuartiers(s, -1, `la révolte des ${this.c.families[f].house[s.era].replace(/^les /, '')}`, `revolte_${f}`, ev);
        }
        if (s.quartiers <= 0) {
          this.finish(s, ev, 'defaite');
          return;
        }
      }
    }
    // familles délaissées
    for (const f of this.present(s)) {
      if (s.era - s.visits[f] >= 2 && s.fam[f].seen < s.era && !mended.has(f)) {
        this.changeLoy(s, f, -1, ev, false);
        ev.push({ type: 'neglect', family: f });
      }
    }
    // dévouement : la famille dévouée apporte sa part
    for (const f of this.present(s)) {
      if (s.fam[f].loy >= 3) {
        const r = this.c.families[f].res;
        s.res[r] += 3;
        ev.push({ type: 'income', bag: { [r]: 3 } });
      }
    }
    // après la dernière crise, l'histoire s'arrête : ni usure, ni repas
    const final = s.era >= ERAS - 1;
    // les vétérans rentrent chez eux, les comptables se servent
    // la veille du Jugement, on garde tout : pas d'usure au bilan de l'ère IV (l'ère V n'a plus de revenus)
    const eve = s.era === ERAS - 2;
    const da = final || eve ? 0 : Math.floor(s.res.armee * TUNING.armyDecay);
    const dt = final || eve ? 0 : Math.round(s.res.tresor * TUNING.treasureDecay);
    if (da || dt) {
      s.res.armee -= da;
      s.res.tresor -= dt;
      ev.push({ type: 'decay', armee: da, tresor: dt });
    }
    // la cité mange
    const upkeep = final ? 0 : this.upkeepOf(s);
    if (final) { /* la dernière ère ne se termine pas par un repas */ }
    else if (s.res.vivres >= upkeep) {
      s.res.vivres -= upkeep;
      ev.push({ type: 'upkeep', amount: upkeep });
      // les greniers ne gardent pas tout : au-delà de trois repas d'avance, un tiers du surplus se gâte
      const spare = s.res.vivres - 3 * upkeep;
      if (spare > 2) {
        const lost = Math.ceil(spare / 3);
        s.res.vivres -= lost;
        ev.push({ type: 'spoil', amount: lost });
      }
    }
    else {
      // un petit manque est une disette (les familles grognent), un grand manque une famine (un quartier se vide)
      const missing = upkeep - s.res.vivres;
      s.res.vivres = 0;
      if (missing <= Math.max(1, Math.ceil(upkeep / 3))) {
        ev.push({ type: 'disette', missing });
        for (const f of this.present(s)) this.changeLoy(s, f, -1, ev, false);
      } else {
        ev.push({ type: 'famine' });
        this.changeQuartiers(s, -1, 'la famine', 'famine', ev);
        if (s.quartiers <= 0) {
          this.finish(s, ev, 'defaite');
          return;
        }
      }
    }
    // le Conseil : aucune famille fâchée au bilan, la paix civile vaut un quartier (après le repas)
    if (this.form(s).id === 'conseil' && this.present(s).every((f) => s.fam[f].loy >= 0)) {
      ev.push({ type: 'peace' });
      this.changeQuartiers(s, 1, 'la paix civile', 'paix', ev);
    }
    // une rivale qui a déjà triomphé réclame un tribut à chaque ère : applaudir une fois ne suffit pas
    const tribute = s.rivalJalons >= 5 && s.spent.includes('triomphe');
    // la rivale avance son propre dessein, sauf si on l'en a empêchée
    // la Course gagnée : la rivale n'achève pas sa merveille cette ère
    const capitulated = s.dessein === 'empire' && s.jalons[4];
    if (!final && !capitulated && s.rivalJalons < 5 && !s.mem.includes(`rival_freine_${s.era}`) && !s.mem.includes(`course_gagnee_${s.era}`) && s.fam && this.c.rivals.length) {
      const before = s.rivalJalons;
      s.rivalJalons = Math.min(5, s.era + 1, s.rivalJalons + 1);
      if (s.rivalJalons > before) ev.push({ type: 'rivalJalon', count: s.rivalJalons, delta: 1, name: this.rival(s).jalons[s.rivalJalons - 1] });
    }
    // la rivale triomphe dès qu'elle a ses cinq merveilles, qu'elle les ait bâties ou qu'on les lui ait payées
    if (s.rivalJalons >= 5 && !s.spent.includes('triomphe')) rivalTriumph = true;
    void tribute;
    const steps = [...(rivalTriumph ? ['triomphe'] : []), 'croissance', 'proces', 'decouverte'];
    // après la dernière crise, plus rien à fonder ni à juger : l'histoire s'arrête là
    s.steps = s.era < ERAS - 1 ? steps : [];
  }

  private stepPrompt(s: GameState, step: string, rng: Rng): Prompt | null {
    if (step === 'croissance') {
      return s.res.vivres >= this.growthCost(s) ? { card: 'croissance' } : null;
    }
    if (step === 'proces' || step === 'jugement') {
      const fams = this.present(s);
      // la famille la plus lésée : loyauté basse et un grief précis dans le journal
      // un procès seulement pour une rancune grave
      const lim = -2;
      const angry = fams.filter((f) => s.fam[f].loy <= lim && this.worstAct(s, f) >= 0).sort((a, b) => s.fam[a].loy - s.fam[b].loy)[0];
      if (angry) {
        const others = fams.filter((f) => f !== angry).sort((a, b) => s.fam[b].loy - s.fam[a].loy).slice(0, 2);
        return { card: 'proces', plaintiff: angry, quote: this.worstAct(s, angry), qui: others };
      }
      const fond = fams.filter((f) => s.fam[f].loy >= 1 && this.bestAct(s, f) >= 0 && !s.spent.includes(`hommage_${f}`)).sort((a, b) => s.fam[b].loy - s.fam[a].loy)[0];
      if (fond) return { card: `hommage_${fond}`, quote: this.bestAct(s, fond) };
      // le Jugement a toujours lieu : à défaut, la famille la moins comblée vient demander des comptes
      if (step === 'jugement') {
        const least = fams.filter((f) => this.worstAct(s, f) >= 0).sort((a, b) => s.fam[a].loy - s.fam[b].loy)[0];
        if (least) {
          const others = fams.filter((f) => f !== least).sort((a, b) => s.fam[b].loy - s.fam[a].loy).slice(0, 2);
          return { card: 'proces', plaintiff: least, quote: this.worstAct(s, least), qui: others };
        }
      }
      return null;
    }
    if (step === 'jalon') return { card: 'jalon' };
    if (step === 'triomphe') return { card: 'triomphe' };
    if (step === 'tribut') return { card: 'tribut' };

    if (step === 'decouverte') {
      const next = s.era + 1;
      const pool = this.c.discoveries.filter((id) => {
        const d = this.c.cards[id];
        // une découverte se joue à l'ère suivante : on ne propose que celles de cette ère-là (pas de philosophe antique en 1810)
        const onlyIncome = !!d.passive?.length && d.passive.every((p) => p.type === 'income');
        return this.available(s, d) && !s.deck.includes(id) && (d.eras?.includes(next) ?? true) && this.check(s, d.cond) && !(onlyIncome && this.form(s, next).id === 'jugement');
      });
      if (!pool.length) return null;
      // au moins une piste du mot-clé du dessein, quand il y en a une : le fil rouge ne doit pas dépendre du tirage
      const tag = this.dessein(s).tag;
      const mine = pool.filter((id) => this.c.cards[id].tags?.includes(tag));
      const first = mine.length ? [rng.pick(mine)] : [];
      const rest = rng.sample(pool.filter((id) => !first.includes(id)), Math.min(3, pool.length) - first.length);
      return { card: 'decouverte', recruits: rng.shuffle([...first, ...rest]) };
    }
    return null;
  }

  growthCost(s: GameState): number {
    return TUNING.growthBase + s.quartiers;
  }

  /** La décision qui a le plus blessé une famille (index dans l'historique). */
  /** Une décision de fond (pas un rouage : procès, carrefour, chantier…), pas encore jugée. */
  private citable(s: GameState, i: number): boolean {
    const h = s.history[i];
    const k = this.c.cards[h.card]?.kind;
    if (!k || ['proces', 'hommage', 'carrefour', 'croissance', 'jalon', 'presage'].includes(k) || h.card === 'decouverte') return false;
    return !s.mem.includes(`juge_${i}`);
  }

  /** Le pire grief d'une famille : le plus lourd, et de préférence le plus ancien (elles ont de la mémoire). */
  worstAct(s: GameState, f: FamilyId): number {
    let best = -1;
    let top = 0;
    s.history.forEach((h, i) => {
      const d = h.loy?.[f] ?? 0;
      if (d >= 0 || !this.citable(s, i) || (h.alts !== undefined && h.alts < 2)) return;
      // la gravité d'abord (une arrestation pèse plus qu'une médaille refusée), l'ancienneté ensuite ;
      // un affront personnel ou une dette reniée pèse plus qu'un blâme de crise, qui fait partie du métier
      const c = this.c.cards[h.card];
      const grave = (c?.family === f ? 8 : 0) + (/^creance/.test(h.card) ? 12 : 0) - (c?.kind === 'crise' ? 8 : 0) + (GRAVE.has(`${h.card}:${h.choice}`) ? 25 : 0);
      const score = -d * 15 + (s.era - h.era) * 1 + grave;
      if (score > top) {
        top = score;
        best = i;
      }
    });
    return best;
  }

  bestAct(s: GameState, f: FamilyId): number {
    let best = -1;
    let top = 0;
    s.history.forEach((h, i) => {
      const d = h.loy?.[f] ?? 0;
      if (d <= 0 || !this.citable(s, i) || (h.alts !== undefined && h.alts < 2)) return;
      const score = d * 10 + (s.era - h.era) * 7;
      if (score >= top) {
        top = score;
        best = i;
      }
    });
    return best;
  }

  private trialOptions(s: GameState, p: Prompt): Option[] {
    const pl = p.plaintiff!;
    const judged = p.quote !== undefined && p.quote >= 0 ? [`juge_${p.quote}`] : [];
    const P = `{H:${pl}}`;
    // chaque famille plaide dans sa voix ; l'issue dépend de ce qu'elle pense de vous
    // un acquittement clôt l'affaire, pas la rancune : seule la réparation l'efface
    const WIN: Record<FamilyId, string[]> = {
      ourk: [`{F:ourk} plaide. {F:ourk} tape sur la table. Le juge est convaincu ; la table, moins. ${P} sont déboutés, et le prennent mal.`,
        `{F:ourk} plaide en montrant ses muscles. Le tribunal acquitte, par prudence. ${P} gardent leur rancune, et un œil sur {F:ourk}.`,
        `{F:ourk} cite ses batailles, toutes. À la troisième heure, le tribunal acquitte pour pouvoir dîner. ${P} repartent affamés et rancuniers.`,
        `{F:ourk} entre au tribunal à cheval, dans la salle. Le cheval est acquitté le premier, vous ensuite. ${P} protestent, pas trop fort.`],
      sel: [`{F:sel} plaide en prenant le ciel à témoin. Le ciel ne dit rien, ce qui vaut acquittement. ${P} repartent en grommelant.`,
        `{F:sel} plaide en larmes. Le juge pleure aussi. ${P} perdent, et notent que le juge était un cousin des Sel.`,
        `{F:sel} lit un passage des Écritures qui vous innocente. Personne ne l’avait jamais lu ; personne ne le retrouvera. ${P} sont déboutés.`,
        `{F:sel} annonce que le ciel a déjà jugé, en votre faveur, et qu’il n’aime pas les appels. ${P} renoncent en regardant les nuages.`],
      brume: [`{F:brume} plaide avec des schémas. Personne ne comprend, tout le monde est convaincu. ${P} perdent, et réclament une copie des schémas.`,
        `{F:brume} démontre que l’affaire est prescrite, à trois décimales près. ${P} perdent. Ils n’oublient pas pour autant.`,
        `{F:brume} produit une expertise de quarante pages : personne n’existe vraiment. Le tribunal acquitte, troublé. ${P} demandent un second avis.`,
        `{F:brume} rejoue la scène en maquette. Dans la maquette, vous êtes innocent, et très petit. ${P} perdent, et gardent la maquette.`],
      troc: [`{F:troc} plaide, puis achète le greffier. ${P} perdent le procès et gardent leur rancune, intacte, encadrée.`,
        `{F:troc} trouve un vice de forme, puis un deuxième, qu’il facture. ${P} sont déboutés et jurent de revenir.`,
        `{F:troc} propose au tribunal une offre groupée : votre acquittement, et une remise sur le prochain. ${P} sont déboutés au prix de gros.`,
        `{F:troc} fait valoir que la plainte a été déposée hors des heures d’ouverture. ${P} perdent, et se promettent d’arriver plus tôt.`],
    };
    // les plaidoiries changent d'un procès à l'autre
    const nth = s.era + s.history.filter((h) => h.card === 'proces').length;
    const MEH = [`{F:ADV} plaide sans conviction. Un arrangement est trouvé, à vos frais.`,
      `{F:ADV} bâille pendant sa propre plaidoirie. On transige ; c’est vous qui payez.`,
      `{F:ADV} plaide mollement, puis négocie avec entrain. L’arrangement vous coûte, et lui rapporte.`];
    const AGAINST = [`{F:ADV} plaide… contre vous. Personne n’avait pensé à vérifier ce que {H:ADV} vous reprochaient.`,
      `{F:ADV} se lève, vous regarde, et témoigne pour l’accusation. Le tribunal note que même votre avocat est contre vous.`,
      `{F:ADV} plaide votre cause avec un tel ennui que le juge vous condamne, pour lui faire plaisir.`];
    const opts: Option[] = (p.qui ?? []).map((adv) => {
      const loy = s.fam[adv].loy;
      const plead: Effect =
        loy >= 1
          ? { loy: { [adv]: -1 }, mem: judged, reply: WIN[adv].join('‖') }
          : loy === 0
            ? { loy: { [pl]: 1 }, gain: { tresor: -(3 + s.era) }, mem: judged, reply: MEH.map((x) => x.replace(/ADV/g, adv)).join('‖') }
            : { loy: { [pl]: -1, [adv]: -1 }, reply: AGAINST.map((x) => x.replace(/ADV/g, adv)).join('‖') };
      return { label: `Défendu par {F:${adv}}`, effect: plead };
    });
    const r = this.c.families[pl].res;
    opts.push({
      label: 'Plaider coupable',
      cost: { [r]: 3 + s.era },
      effect: { loy: { [pl]: 2 }, mem: judged, reply: [`Vous payez réparation. ${P} encadrent le reçu. Ils l’accrochent à côté des autres.`,
        `Vous plaidez coupable et payez. ${P} sont si surpris qu’ils en oublient d’être fâchés. Presque.`,
        `Vous payez sans discuter. ${P} acceptent, et racontent partout que vous avez pleuré. Vous n’avez pas pleuré.`][nth % 3] },
    });
    return opts;
  }

  // ======================================================================= fin

  finish(s: GameState, ev: Ev[], type: 'victoire' | 'defaite'): void {
    const jalons = s.jalons.filter(Boolean).length;
    if (type === 'victoire') {
      // le dessein n'est accompli qu'avec son cinquième jalon ; sinon, on a seulement survécu
      // victoire : quatre merveilles ; triomphe : les cinq ; en dessous, on a seulement survécu
      const rank = jalons >= 5 ? 'triomphe' : jalons >= 4 ? 'victoire' : 'survie';
      // un triomphe sur des ruines ne se fête pas comme un triomphe intact (tour 5 des juges)
      const pyrrhic = rank !== 'survie' && s.losses.length >= 3 && s.quartiers <= 2;
      s.result = { type, rank, ending: s.jalons[4] ? this.dessein(s).ending : undefined, jalons, ...(pyrrhic ? { pyrrhic } : {}) };
    } else {
      const last = s.losses[s.losses.length - 1];
      s.result = { type, rank: 'chute', jalons, cause: last?.cause ?? 'l’usure' };
    }
    s.phase = 'fin';
    s.prompt = null;
    ev.push({ type: 'end', result: s.result });
  }

  /** Ce que la civilisation laisse aux suivantes. */
  ruinOf(s: GameState, epitaph: string, testament?: string): RuinInfo {
    const fams = FAMILIES.filter((f) => s.fam[f].state !== 'eteinte');
    const enemy = fams.slice().sort((a, b) => s.fam[a].loy - s.fam[b].loy)[0];
    const ally = fams.slice().sort((a, b) => s.fam[b].loy - s.fam[a].loy)[0];
    const r: RuinInfo = {
      name: s.name,
      dessein: s.dessein,
      era: s.era,
      jalons: s.jalons.filter(Boolean).length,
      cause: s.result?.type === 'victoire' ? (s.result.ending ? VICTORY_CAUSE[this.dessein(s).id] : undefined) ?? 'le temps, tout simplement' : s.result?.cause ?? 'l’usure',
      epitaph,
      testament,
      victory: s.result?.type === 'victoire',
      ally: s.fam[ally]?.loy > 0 ? ally : undefined,
      enemy: s.fam[enemy]?.loy < 0 ? enemy : undefined,
    };
    const lastJ = s.jalons.lastIndexOf(true);
    if (lastJ >= 0) r.shape = this.jalonOf(s, lastJ).shape;
    // le grief : la famille la moins bien traitée (même sans haine déclarée) et le pire de ce qu'on lui a fait
    const sore = fams.filter((f) => s.fam[f].loy <= 0 && this.worstAct(s, f) >= 0).sort((a, b) => s.fam[a].loy - s.fam[b].loy)[0];
    if (sore) {
      const h = s.history[this.worstAct(s, sore)];
      if (h) r.grudge = { family: sore, house: this.c.families[sore].house[s.era], quote: h.label, date: h.date };
    }
    return r;
  }
}
