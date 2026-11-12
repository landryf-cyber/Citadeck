/**
 * Citadeck V2 — moteur de jeu, pur et déterministe (graine).
 * Le joueur répond à des « invites » (prompt) ; chaque invite est une carte à 1..4 options.
 */
import { Rng } from '../core/rng';
import type { Content } from './content';
import { eraDate, fill, civName, capitalize, setCrisisK, ERA_NAMES, ERA_SUBTITLES } from './text';
import {
  FAMILIES, RES, RES_LABEL, TAGS,
  type Bag, type CardDef, type Cond, type Effect, type FamilyId, type GameState, type Option,
  type Jalon, type Passive, type Prompt, type Res, type Resources, type RuinInfo, type Tag,
} from './types';

export const SAVE_VERSION = 21;
export const ERAS = 5;
export const SAISON_CARDS = 4;
/** Réglages d'équilibrage (balayés par src/sim/sweep.ts) */
export const TUNING = { crisisK: 1.3, armyDecay: 0.3, treasureDecay: 0.2, growthBase: 3, envy: 0.4, iron: 1.2, upkeep: 1.8, gain: 0.8 };
/** croissance de l'économie d'une ère à l'autre (cartes « à l'échelle ») */
export const ERA_SCALE = [1, 1.35, 1.75, 2.2, 2.7];
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
  legacy?: { from: string; label?: string; testament?: string; heirs: boolean };
  /** vivres consommés en fin d'ère */
  upkeep: number;
  /** ce dont la crise aura besoin, au plus */
  needs: { bag: Bag; families: string[] };
  /** le mot-clé qu'exige la merveille de l'ère : combien, d'où */
  tag?: { tag: Tag; need: number; total: number; parts: string[]; how: string };
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

/** Ce qui finit par emporter même une civilisation victorieuse. */
export const VICTORY_CAUSE: Record<string, string> = {
  etoiles: 'le départ : ils sont tous partis, en laissant la lumière allumée',
  empire: 'la paix, qui les a ennuyés à mourir',
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
}

export type Ev =
  | { type: 'res'; before: Resources; after: Resources }
  | { type: 'quartiers'; delta: number; cause: string; shielded?: boolean }
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
  /** familles touchées (emblèmes affichés sans le sens) */
  families: FamilyId[];
  /** l'acte aura une suite (sablier) */
  later: boolean;
  /** pertes de ressources certaines (affichées comme un coût, déjà incluses dans l'effet) */
  loss?: Bag;
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
const ONE_SHOT = new Set(['evenement', 'rencontre', 'rivale', 'decouverte']);

export class Engine {
  constructor(public readonly c: Content) {}

  // ======================================================================= création

  newGame(seed: number, setup: Setup): GameState {
    const rng = new Rng(seed);
    const origin = this.c.origins.find((o) => o.id === setup.origin) ?? this.c.origins[0];
    const rival = rng.pick(this.c.rivals);
    const fam = {} as GameState['fam'];
    for (const f of FAMILIES) fam[f] = { loy: 0, state: origin.families.includes(f) ? 'presente' : 'eteinte', seen: -1 };
    const s: GameState = {
      version: SAVE_VERSION,
      seed,
      rng: rng.getState(),
      name: setup.name ?? civName(seed),
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
      rivalJalons: 0,
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
    // les Héritiers vivent dans les murs des morts : leurs amitiés et leurs haines aussi
    if (heirs && r.ally) loy[r.ally] = (loy[r.ally] ?? 0) + 1;
    if (heirs && r.enemy) loy[r.enemy] = (loy[r.enemy] ?? 0) - 1;
    for (const f of FAMILIES) {
      const d = loy[f] ?? 0;
      if (d && s.fam[f].state === 'presente') s.fam[f].loy = Math.max(-2, Math.min(2, s.fam[f].loy + d));
    }
    if (lg) s.mem.push('heritage');
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

  dessein(s: GameState) {
    return this.c.desseins.find((d) => d.id === s.dessein) ?? this.c.desseins[0];
  }

  // ======================================================================= requêtes

  present(s: GameState): FamilyId[] {
    return FAMILIES.filter((f) => s.fam[f].state === 'presente');
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
    if (this.dessein(s).tag === tag) n += s.jalons.filter(Boolean).length;
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
    const j = this.dessein(s).tag === tag ? s.jalons.filter(Boolean).length : 0;
    if (j) parts.push(`${j} merveille${j > 1 ? 's' : ''} du dessein`);
    if (tag === 'Culture') {
      const dv = this.present(s).filter((f) => s.fam[f].loy >= 2).length;
      if (dv) parts.push(`${dv} famille${dv > 1 ? 's' : ''} dévouée${dv > 1 ? 's' : ''}`);
    }
    let bonus = 0;
    for (const p of this.passives(s)) if (p.type === 'tagBonus' && p.tag === tag) bonus += p.amount;
    if (bonus) parts.push(`+${bonus} d’une merveille`);
    const fam = FAMILIES.find((f) => this.c.families[f].tag === tag);
    const how = tag === 'Culture'
      ? 'les découvertes de Culture, chaque merveille du dessein, et chaque famille dévouée (+2)'
      : `les découvertes de ${tag}${fam ? `, ${this.c.families[fam].house[s.era]} quand ils vous aiment (+1)` : ''}${this.dessein(s).tag === tag ? ', et chaque merveille du dessein' : ''}`;
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
    for (const id of this.c.crises[s.era].cards) {
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
    if (c.jalons) parts.push(`${c.jalons} jalons bâtis`);
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
    if (opts.some((o) => this.affordable(s, this.costOf(s, o.cost)) && this.check(s, o.req))) return opts;
    const card = this.card(p.card);
    if (card.kind === 'crise') {
      const name = this.c.crises[s.era].name;
      return [...opts, { label: 'Encaisser', effect: { quartiers: -1, cause: `${name.charAt(0).toLowerCase()}${name.slice(1)}, sans rien à lui opposer` }, reply: 'Rien à opposer. On serre les dents, on compte les ruines.' }];
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
      opts.push({ label: 'Rien de nouveau', effect: {}, reply: 'Les savants rangent leurs croquis. Ils boudent.' });
      return opts;
    }
    if (card.kind === 'proces') return this.trialOptions(s, p);
    if (card.qui && p.qui) return p.qui.map((f) => (card.scale ? scaleOption(card.qui!.option(f), s.era) : card.qui!.option(f)));
    if (card.kind === 'croissance') {
      const extra = this.passives(s).filter((x) => x.type === 'growth').reduce((a, x) => a + (x as { amount: number }).amount, 0);
      return [
        { label: 'Fonder un quartier', cost: { vivres: this.growthCost(s) }, effect: { quartiers: 1 + extra }, reply: 'Un nouveau quartier sort de terre. Il a déjà ses habitudes, et un nom que personne n’a choisi.' },
        { label: 'Garder les réserves', effect: {}, reply: 'Les greniers restent pleins. Les rats approuvent.' },
      ];
    }
    if (card.kind === 'jalon') {
      const j = this.dessein(s).jalons[s.era];
      const alt = this.jalonAltOf(s, s.era);
      const opts: Option[] = [{ label: `Bâtir ${j.name}`, cost: j.cost, req: j.req, effect: { jalon: true }, reply: `${j.name} est debout. On vient de loin pour la voir ; {rival} viennent surtout pour la mesurer. ${j.gift}` }];
      if (alt) opts.push({ label: `Bâtir ${alt.name}`, cost: alt.cost, req: alt.req, effect: { jalon: 'alt' }, reply: `${alt.name} est debout. Personne n’avait jamais vu ça, et {rival} non plus. ${alt.gift}` });
      opts.push({ label: 'Pas cette fois', effect: {}, reply: [
        'Les plans retournent dans un coffre. Le coffre est plein de plans.',
        'Les architectes rangent leurs maquettes. Ils les dépoussièrent chaque matin, en soupirant.',
        'Le chantier attendra. Les tailleurs de pierre jouent aux dés sur les fondations.',
        'On remet à plus tard. Les ingénieurs en profitent pour améliorer les plans. Ils coûtent déjà plus cher.',
        'Le projet est mis en veille. Il clignote doucement dans un coin du serveur.',
      ][s.era] });
      return opts;
    }
    if (card.kind === 'crise') return card.options.map((o) => scaleOption(o, 0, this.crisisK(s)));
    return card.scale ? card.options.map((o) => scaleOption(o, s.era)) : card.options;
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
    if (card.kind === 'jalon') {
      const j = this.dessein(s).jalons[s.era];
      const alt = this.jalonAltOf(s, s.era);
      title = alt ? 'Deux plans sur la table' : j.name;
      text = alt
        ? `Les architectes se disputent. ${j.name} : ${j.text} ${alt.name} : ${alt.text} On ne bâtira que l’un des deux.`
        : `${j.text} ${j.gift}`;
      header = `Le Grand Dessein · ${this.dessein(s).name}`;
    }
    if (card.kind === 'proces' && p.plaintiff) {
      const h = s.history[p.quote ?? -1];
      extra.citation = h ? `« ${h.label} »` : '« rien de précis, mais tout »';
      extra.quand = h ? h.date : 'depuis toujours';
      extra.objet = h ? h.title : 'votre règne';
      extra.depuis = !h || h.era === s.era ? '' : h.era === s.era - 1 ? 'Cela date de l’ère précédente. ' : `Cela remonte à ${ERA_NAMES[h.era].charAt(0).toLowerCase()}${ERA_NAMES[h.era].slice(1)}. `;
      extra.plaignant = this.c.families[p.plaintiff].head[s.era];
      extra.maison = capitalize(this.c.families[p.plaintiff].house[s.era]);
      header = 'Le Procès';
    }
    if (card.kind === 'hommage') {
      const h = s.history[p.quote ?? -1];
      extra.citation = h ? `« ${h.label} »` : '« tout »';
      extra.quand = h ? h.date : 'depuis toujours';
      header = 'L’Hommage';
    }
    Object.assign(extra, this.ruinExtras(s));
    if (card.kind === 'famille' && card.family) {
      const lead = this.familyLead(s, card.family);
      if (lead) text = `${lead} ${text}`;
    }
    if (p.from) header = `Suite de · ${p.from}`;
    if (card.kind === 'crise') {
      const cr = this.c.crises[s.era];
      header = `Crise · ${cr.name} · ${cr.cards.indexOf(card.id) + 1}/${cr.cards.length}`;
    }
    if (card.kind === 'trahison') header = 'Trahison';
    if (card.kind === 'rivale') header = `Rivale · ${capitalize(this.rival(s).name)}`;
    if (card.kind === 'decouverte') header = 'Découverte';
    if (card.kind === 'carrefour') header = s.saison === 0 ? 'Première saison' : 'Seconde saison';
    const options = this.options(s, p).map((o, i) => this.optionView(s, card, o, p, i));
    const fam = card.family;
    return {
      card,
      kind: card.kind,
      title: fill(title, s, this.c, extra),
      text: fill(text, s, this.c, extra),
      speaker: card.speaker ? fill(card.speaker, s, this.c, extra) : fam ? this.c.families[fam].head[s.era] : undefined,
      family: fam ?? (card.kind === 'proces' ? p.plaintiff : undefined),
      header,
      options,
    };
  }

  private optionView(s: GameState, card: CardDef, o: Option, p: Prompt, i: number): OptionView {
    const cost = this.costOf(s, o.cost);
    const affordable = this.affordable(s, cost);
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
      req: o.reqLabel ?? this.condLabel(s, o.req),
      reqOk,
      enabled: affordable && reqOk,
      families: [...fams],
      later,
      warn: o.warn ? fill(o.warn, s, this.c) : undefined,
    };
    if (o.effect.bet) v.odds = this.betChance(s, o.effect.bet);
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
    if (card.kind === 'proces' && p.qui?.[i]) {
      v.families = [p.qui[i], p.plaintiff!];
      v.detail = `${capitalize(this.c.families[p.qui[i]].house[s.era])} : ${this.familyInfo(s, p.qui[i]).mood}`;
    }
    if (card.kind === 'jalon' && o.effect.jalon) {
      const j = o.effect.jalon === 'alt' ? this.jalonAltOf(s, s.era) : this.dessein(s).jalons[s.era];
      if (j) {
        v.detail = fill(j.gift, s, this.c);
        v.ref = j.shape;
      }
    }
    return v;
  }

  /** Intensité des crises : vos merveilles attirent les prédateurs. */
  crisisK(s: GameState): number {
    return TUNING.crisisK * (s.iron ? TUNING.iron : 1) * (1 + TUNING.envy * s.jalons.filter(Boolean).length);
  }

  /** Humeur et souvenir de la famille, en tête de sa carte. */
  familyLead(s: GameState, f: FamilyId): string {
    const loy = s.fam[f].loy;
    const m = this.c.moods[f];
    const pickM = (a: string[]) => a[(s.era + s.seed) % a.length];
    const mood = loy <= -2 ? pickM(m.hostile) : loy === -1 ? pickM(m.cold) : loy === 1 ? pickM(m.warm) : loy >= 2 ? pickM(m.devoted) : '';
    // un souvenir d'une ère passée, accordé à l'humeur (une rancune ne se montre pas chez qui vous adore)
    const rec = this.c.recalls.filter((r) => r.family === f && s.mem.includes(r.mem) && (s.memo[r.mem]?.era ?? s.era) < s.era
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

  /** Ce que le présage annonce au début d'une ère : le jalon, la crise, l'envie, l'héritage. */
  presageInfo(s: GameState): PresageInfo {
    const d = this.dessein(s);
    const j = d.jalons[s.era];
    const alt = this.jalonAltOf(s, s.era);
    const cr = this.c.crises[s.era];
    const built = s.jalons.filter(Boolean).length;
    const k = this.crisisK(s) / (TUNING.crisisK * (s.iron ? TUNING.iron : 1));
    const rv = this.rival(s);
    const r0 = s.ruins[0];
    const jv = (x: Jalon) => ({ name: fill(x.name, s, this.c), text: fill(x.text, s, this.c), gift: fill(x.gift, s, this.c), cost: x.cost, req: this.condLabel(s, x.req), shape: x.shape });
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
      legacy: s.era === 0 && r0 ? { from: r0.name, label: r0.legacy?.label, testament: r0.testament, heirs: s.origin === 'heritiers' } : undefined,
      upkeep: Math.ceil(s.quartiers * TUNING.upkeep),
      needs: this.crisisNeeds(s),
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
    const mood = st.state === 'eteinte' ? 'partis' : loy <= -3 ? 'en révolte' : loy <= -2 ? 'hostiles' : loy === -1 ? 'froissés' : loy === 0 ? 'neutres' : loy === 1 ? 'amicaux' : loy === 2 ? 'dévoués' : 'fanatiques';
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
    if (reply && ev.some((x) => x.type === 'quartiers' && x.shielded)) reply = `${reply} Pourtant, le quartier tient : une merveille l’a protégé.`;
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
    s.history.push({
      turn: s.turn,
      era: s.era,
      date,
      card: card.id,
      title: v?.title ?? card.title,
      choice: index,
      label: view.label,
      reply: reply ? fill(reply, s, this.c, this.ruinExtras(s)) : undefined,
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
  applyEffect(s: GameState, card: CardDef, e: Effect, rng: Rng, ev: Ev[]): string | undefined {
    let reply = e.reply;
    if (e.if) {
      const branch = this.check(s, e.if) ? e.then : e.else;
      if (branch) {
        const r = this.applyEffect(s, card, branch, rng, ev);
        if (r) reply = r;
      }
    }
    if (e.bet) {
      const chance = this.betChance(s, e.bet);
      const win = rng.next() < chance;
      ev.push({ type: 'bet', win, chance });
      const r = this.applyEffect(s, card, win ? e.bet.win : e.bet.lose, rng, ev);
      if (r) reply = r;
    }
    // les gains (cachés au joueur) passent par un coefficient d'équilibrage ; les pertes restent telles qu'écrites
    if (e.gain) for (const r of RES) if (e.gain[r]) s.res[r] = Math.max(0, s.res[r] + (e.gain[r]! > 0 ? Math.max(1, Math.round(e.gain[r]! * TUNING.gain)) : e.gain[r]!));
    if (e.loy) for (const f of Object.keys(e.loy) as FamilyId[]) this.changeLoy(s, f, e.loy[f]!, ev);
    if (e.quartiers) this.changeQuartiers(s, e.quartiers, e.cause ?? card.title, card.id, ev);
    for (const m of e.mem ?? []) if (!s.mem.includes(m)) s.mem.push(m);
    for (const m of e.unmem ?? []) s.mem = s.mem.filter((x) => x !== m);
    for (const sc of e.sched ?? []) {
      const v = this.view(s);
      s.sched.push({ card: sc.card, at: s.turn + 1 + sc.in, from: v?.title ?? card.title });
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
    }
    if (e.famState) {
      s.fam[e.famState.id].state = e.famState.state;
      ev.push({ type: 'famState', family: e.famState.id, state: e.famState.state });
    }
    if (e.jalon && !s.jalons[s.era]) {
      s.jalons[s.era] = true;
      if (e.jalon === 'alt') s.jalonAlt.push(s.era);
      ev.push({ type: 'jalon', era: s.era, name: this.jalonOf(s, s.era).name });
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

  changeQuartiers(s: GameState, d: number, cause: string, cardId: string, ev: Ev[]): void {
    if (d < 0 && !s.shieldUsed && this.passives(s).some((p) => p.type === 'shield')) {
      s.shieldUsed = true;
      d += 1;
      ev.push({ type: 'quartiers', delta: 0, cause, shielded: true });
      if (d === 0) return;
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
    for (const id of s.deck) if (this.c.cards[id]?.options.length && !s.spent.includes(id)) pool.push(id);
    const events = (this.c.events[s.era] ?? []).filter((id) => {
      const c = this.c.cards[id];
      return this.available(s, c) && !s.spent.includes(id) && this.check(s, c.cond);
    });
    pool.push(...rng.sample(events, Math.min(2, events.length)));
    const bucket = s.rivalRel <= -1 ? this.c.rivalCards.hostile : s.rivalRel >= 1 ? this.c.rivalCards.friendly : this.c.rivalCards.neutral;
    const rv = bucket.filter((id) => this.available(s, this.c.cards[id]) && !s.spent.includes(id) && this.check(s, this.c.cards[id]?.cond) && (this.c.cards[id].eras?.includes(s.era) ?? true));
    if (rv.length) pool.push(rng.pick(rv));
    // les revenants d'une civilisation morte arrivent à la troisième ère
    if (s.era === 2 && s.ruins[0]?.grudge && !s.spent.includes(this.c.revenantCard)) pool.push(this.c.revenantCard);
    s.pool = rng.shuffle(pool);
  }

  familyCard(s: GameState, f: FamilyId): string | undefined {
    for (const id of this.c.familyCards[f]?.[s.era] ?? []) {
      const c = this.c.cards[id];
      if (c && !s.spent.includes(id) && this.check(s, c.cond)) return id;
    }
    return undefined;
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
    const pile: string[] = [];
    let enc = r.encounters.filter((id) => !s.spent.includes(id) && this.check(s, this.c.cards[id]?.cond) && (this.c.cards[id].eras?.includes(s.era) ?? true));
    if (routeId === 'inconnu' && s.ruins.length && !s.spent.includes(this.c.ruinsCard) && s.era >= 1) enc = [this.c.ruinsCard];
    if (enc.length) pile.push(rng.pick(enc));
    if (r.family) {
      s.visits[r.family] = s.era;
      const fc = s.pool.find((id) => this.c.cards[id]?.family === r.family && this.c.cards[id].kind === 'famille');
      if (fc) {
        pile.push(fc);
        s.pool = s.pool.filter((x) => x !== fc);
      }
    }
    while (pile.length < SAISON_CARDS && s.pool.length) pile.push(s.pool.shift()!);
    s.pile = pile;
    ev.push({ type: 'saison', saison: s.saison, route: routeId });
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
      const due = s.sched.findIndex((x) => x.at <= s.turn);
      if (due >= 0 && (s.phase === 'saison' || s.phase === 'crise') && s.prompt && this.c.cards[s.prompt.card]?.kind !== 'carrefour') {
        const d = s.sched.splice(due, 1)[0];
        const c = this.c.cards[d.card];
        if (c && this.check(s, c.cond)) {
          s.prompt = this.makePrompt(s, d.card, rng, d.from);
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
        if (s.saison === 0) {
          s.saison = 1;
          s.prompt = { card: 'carrefour', routes: this.routesFor(s, rng) };
          return;
        }
        // le chantier du jalon, avant la crise : bâtir, c'est affronter la crise plus pauvre
        s.phase = 'chantier';
        s.prompt = { card: 'jalon' };
        return;
      }
      if (s.phase === 'chantier') {
        // la crise
        s.phase = 'crise';
        const cr = this.c.crises[s.era];
        const pile = cr.cards.slice();
        // une famille qui vous hait choisit ce moment pour trahir
        const traitor = this.present(s).filter((f) => s.fam[f].loy <= -2).sort((a, b) => s.fam[a].loy - s.fam[b].loy)[0];
        if (traitor) pile.splice(1, 0, this.c.betrayal[traitor]);
        s.pile = pile;
        ev.push({ type: 'crisis', era: s.era, name: cr.name });
        continue;
      }
      if (s.phase === 'crise') {
        if (s.pile.length) {
          s.prompt = this.makePrompt(s, s.pile.shift()!, rng);
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

  private makePrompt(s: GameState, id: string, rng: Rng, from?: string): Prompt {
    const c = this.card(id);
    const p: Prompt = { card: id };
    if (from) p.from = from;
    if (c.qui) {
      const fams = this.present(s).filter((f) => !c.qui!.exclude?.includes(f));
      p.qui = rng.sample(fams, Math.min(c.qui.count, fams.length));
    }
    return p;
  }

  private startEraEnd(s: GameState, rng: Rng, ev: Ev[]): void {
    s.phase = 'finere';
    // révoltes des familles ulcérées
    for (const f of this.present(s)) {
      if (s.fam[f].loy <= -3) {
        const name = capitalize(this.c.families[f].house[s.era]);
        if (s.mem.includes(`revolte_${f}`)) {
          s.fam[f].state = 'rivale';
          s.rivalRel = Math.max(-3, s.rivalRel - 1);
          ev.push({ type: 'defect', family: f });
          this.changeQuartiers(s, -1, `${name} sont passés chez ${this.rival(s).name}`, `defection_${f}`, ev);
        } else {
          s.mem.push(`revolte_${f}`);
          s.fam[f].loy = -1;
          ev.push({ type: 'revolt', family: f });
          this.changeQuartiers(s, -1, `la révolte des ${this.c.families[f].house[s.era].replace(/^les /, '')}`, `revolte_${f}`, ev);
        }
        if (s.quartiers <= 0) {
          this.finish(s, ev, 'defaite');
          return;
        }
      }
    }
    // familles délaissées
    for (const f of this.present(s)) {
      if (s.era - s.visits[f] >= 2 && s.fam[f].seen < s.era) {
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
    // les vétérans rentrent chez eux, les comptables se servent
    const da = Math.floor(s.res.armee * TUNING.armyDecay);
    const dt = Math.floor(s.res.tresor * TUNING.treasureDecay);
    if (da || dt) {
      s.res.armee -= da;
      s.res.tresor -= dt;
      ev.push({ type: 'decay', armee: da, tresor: dt });
    }
    // la cité mange
    const upkeep = Math.ceil(s.quartiers * TUNING.upkeep);
    if (s.res.vivres >= upkeep) {
      s.res.vivres -= upkeep;
      ev.push({ type: 'upkeep', amount: upkeep });
    }
    else {
      s.res.vivres = 0;
      ev.push({ type: 'famine' });
      this.changeQuartiers(s, -1, 'la famine', 'famine', ev);
      if (s.quartiers <= 0) {
        this.finish(s, ev, 'defaite');
        return;
      }
    }
    // la rivale avance son propre dessein, sauf si on l'en a empêchée
    if (!s.mem.includes(`rival_freine_${s.era}`) && s.fam && this.c.rivals.length) {
      s.rivalJalons = Math.min(5, s.rivalJalons + 1);
      ev.push({ type: 'rivalJalon', count: s.rivalJalons, delta: 1, name: this.rival(s).jalons[s.rivalJalons - 1] });
    }
    const steps = ['croissance', 'proces'];
    if (s.era < ERAS - 1) steps.push('decouverte');
    s.steps = steps;
  }

  private stepPrompt(s: GameState, step: string, rng: Rng): Prompt | null {
    if (step === 'croissance') {
      return s.res.vivres >= this.growthCost(s) ? { card: 'croissance' } : null;
    }
    if (step === 'proces') {
      const fams = this.present(s);
      // la famille la plus lésée : loyauté basse et un grief précis dans le journal
      const angry = fams.filter((f) => s.fam[f].loy <= -1 && this.worstAct(s, f) >= 0).sort((a, b) => s.fam[a].loy - s.fam[b].loy)[0];
      if (angry) {
        const others = fams.filter((f) => f !== angry).sort((a, b) => s.fam[b].loy - s.fam[a].loy).slice(0, 2);
        return { card: 'proces', plaintiff: angry, quote: this.worstAct(s, angry), qui: others };
      }
      const fond = fams.filter((f) => s.fam[f].loy >= 1 && this.bestAct(s, f) >= 0).sort((a, b) => s.fam[b].loy - s.fam[a].loy)[0];
      if (fond) return { card: `hommage_${fond}`, quote: this.bestAct(s, fond) };
      return null;
    }
    if (step === 'jalon') return { card: 'jalon' };
    if (step === 'decouverte') {
      const next = s.era + 1;
      const pool = this.c.discoveries.filter((id) => {
        const d = this.c.cards[id];
        return this.available(s, d) && !s.deck.includes(id) && (d.eras?.includes(next) || d.eras?.includes(s.era)) && this.check(s, d.cond);
      });
      if (!pool.length) return null;
      return { card: 'decouverte', recruits: rng.sample(pool, Math.min(3, pool.length)) };
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
      if (d >= 0 || !this.citable(s, i)) return;
      const score = -d * 10 + (s.era - h.era) * 7;
      if (score >= top) {
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
      if (d <= 0 || !this.citable(s, i)) return;
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
    const WIN: Record<FamilyId, string> = {
      ourk: `{F:ourk} plaide. {F:ourk} tape sur la table. Le juge est convaincu ; la table, moins. ${P} repartent apaisés, par prudence.`,
      sel: `{F:sel} plaide en prenant le ciel à témoin. Le ciel ne dit rien, ce qui vaut acquittement. ${P} repartent en grommelant.`,
      brume: `{F:brume} plaide avec des schémas. Personne ne comprend, tout le monde est convaincu. ${P} réclament une copie des schémas.`,
      troc: `{F:troc} plaide, puis propose un arrangement à l’amiable. ${P} repartent avec un reçu et un sourire forcé.`,
    };
    const opts: Option[] = (p.qui ?? []).map((adv) => {
      const loy = s.fam[adv].loy;
      const plead: Effect =
        loy >= 1
          ? { loy: { [pl]: 2, [adv]: -1 }, mem: judged, reply: WIN[adv] }
          : loy === 0
            ? { loy: { [pl]: 1 }, gain: { tresor: -(3 + s.era) }, mem: judged, reply: `{F:${adv}} plaide sans conviction. Un arrangement est trouvé, à vos frais.` }
            : { loy: { [pl]: -1, [adv]: -1 }, reply: `{F:${adv}} plaide… contre vous. Personne n’avait pensé à vérifier ce que {H:${adv}} vous reprochaient.` };
      return { label: `Défendu par {F:${adv}}`, effect: plead };
    });
    const r = this.c.families[pl].res;
    opts.push({
      label: 'Plaider coupable',
      cost: { [r]: 3 + s.era },
      effect: { loy: { [pl]: 2 }, mem: judged, reply: `Vous payez réparation. ${P} encadrent le reçu. Ils l’accrochent à côté des autres.` },
    });
    return opts;
  }

  // ======================================================================= fin

  finish(s: GameState, ev: Ev[], type: 'victoire' | 'defaite'): void {
    const jalons = s.jalons.filter(Boolean).length;
    if (type === 'victoire') {
      // le dessein n'est accompli qu'avec son cinquième jalon ; sinon, on a seulement survécu
      s.result = { type, ending: s.jalons[4] ? this.dessein(s).ending : undefined, jalons };
    } else {
      const last = s.losses[s.losses.length - 1];
      s.result = { type, jalons, cause: last?.cause ?? 'l’usure' };
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
