/** Types du jeu : tout ce qui décrit les cartes, crises, merveilles et l'état d'une partie. */

export type GaugeId = 'food' | 'army' | 'knowledge' | 'treasure';
export const GAUGES: readonly GaugeId[] = ['food', 'army', 'knowledge', 'treasure'] as const;

export const GAUGE_LABEL: Record<GaugeId, string> = {
  food: 'Nourriture',
  army: 'Armée',
  knowledge: 'Savoir',
  treasure: 'Trésor',
};

export type Gauges = Record<GaugeId, number>;
export type Delta = Partial<Record<GaugeId, number>>;

export type Keyword = 'Foi' | 'Guerre' | 'Commerce' | 'Science' | 'Culture' | 'Nature';
export const KEYWORDS: readonly Keyword[] = ['Foi', 'Guerre', 'Commerce', 'Science', 'Culture', 'Nature'];

export type Side = 'left' | 'right';

/** Condition évaluée sur l'état courant. Toutes les clauses présentes doivent être vraies. */
export interface Condition {
  gauge?: GaugeId;
  gte?: number;
  lte?: number;
  keyword?: Keyword;
  /** nombre minimal de cartes du deck portant le mot-clé */
  min?: number;
  wonder?: string;
  flag?: string;
  notFlag?: string;
  /** relation avec la rivale (−100..100) */
  rivalGte?: number;
  rivalLte?: number;
}

export interface AddCard {
  card: string;
  /** nombre de tours avant l'apparition (sinon mélangée dans la pioche de l'ère) */
  delay?: number;
  /** reste dans le deck d'une ère à l'autre */
  persistent?: boolean;
}

export interface Effect {
  delta?: Delta;
  /** bonus par carte du deck portant le mot-clé (synergie) */
  scale?: { keyword: Keyword; delta: Delta; cap?: number }[];
  add?: AddCard[];
  remove?: string[];
  flags?: string[];
  unflags?: string[];
  rival?: number;
  wonder?: string;
  /** branche conditionnelle : si `when` est vrai, `then` remplace cet effet, sinon `else` */
  when?: Condition;
  then?: Effect;
  else?: Effect;
  /** réplique propre à cette branche (remplace celle de l'option) */
  reply?: string;
}

export interface CardOption {
  text: string;
  effect: Effect;
  /** réplique affichée brièvement après le choix */
  reply?: string;
}

export type CardKind =
  | 'starter'
  | 'era'
  | 'tech'
  | 'institution'
  | 'character'
  | 'consequence'
  | 'rival'
  | 'crisis'
  | 'tutorial';

export interface ArtSpec {
  /** motif de l'illustration générative */
  motif: 'sun' | 'moon' | 'mountain' | 'wave' | 'tower' | 'eye' | 'spiral' | 'crown' | 'leaf' | 'gear' | 'star' | 'flame' | 'shield' | 'scroll' | 'coin' | 'comet' | 'ring' | 'arch' | 'wheat' | 'mask';
  /** teinte dominante (0..360), sinon dérivée des mots-clés */
  hue?: number;
}

export interface CardDef {
  id: string;
  title: string;
  text: string;
  kind: CardKind;
  keywords?: Keyword[];
  /** ère d'origine (0..4) pour les cartes d'ère et les récompenses */
  era?: number;
  left: CardOption;
  right: CardOption;
  /** retirée du deck après avoir été jouée */
  oneShot?: boolean;
  /** condition pour être proposée en récompense */
  requires?: Condition;
  art?: ArtSpec;
  /** indice de tutoriel affiché avec la carte */
  tutorial?: string;
  /** ne peut pas être retirée du deck par le joueur */
  locked?: boolean;
  /** habillage par ère (1..4) : la même carte, racontée autrement selon l'époque */
  variants?: Record<number, CardVariant>;
}

export interface CardVariant {
  title?: string;
  text: string;
  left?: string;
  right?: string;
  replyLeft?: string;
  replyRight?: string;
}

/** Ce que le joueur lit : la carte habillée pour une ère donnée. */
export interface CardFace {
  title: string;
  text: string;
  left: string;
  right: string;
  replyLeft?: string;
  replyRight?: string;
}

export function cardFace(card: CardDef, era: number): CardFace {
  const v = card.variants?.[era];
  return {
    title: v?.title ?? card.title,
    text: v?.text ?? card.text,
    left: v?.left ?? card.left.text,
    right: v?.right ?? card.right.text,
    replyLeft: v?.replyLeft ?? card.left.reply,
    replyRight: v?.replyRight ?? card.right.reply,
  };
}

export interface CrisisDef {
  id: string;
  name: string;
  /** phrase d'accroche */
  intro: string;
  era: number;
  cards: string[];
  /** cartes supplémentaires tirées au sort parmi celles-ci */
  extra?: string[];
  extraCount?: number;
}

export type Passive =
  | { type: 'dampen'; gauge: GaugeId; factor: number }
  | { type: 'amplify'; gauge: GaugeId; factor: number }
  | { type: 'keywordBonus'; keyword: Keyword; bonus: number }
  | { type: 'crisisShield'; amount: number }
  | { type: 'eraDrift'; delta: Delta }
  | { type: 'rivalCalm'; amount: number }
  | { type: 'overflow'; from: GaugeId; to: GaugeId; threshold: number }
  | { type: 'floor'; gauge: GaugeId; value: number; once: true };

export interface WonderDef {
  id: string;
  name: string;
  text: string;
  /** ère minimale */
  era: number;
  keywords?: Keyword[];
  passive: Passive;
  requires?: Condition;
}

export interface EraDef {
  index: number;
  name: string;
  subtitle: string;
  /** nombre de cartes d'ère injectées */
  packSize: number;
  /** multiplicateur des effets de cartes : les enjeux montent avec les ères */
  stakes?: number;
  /** multiplicateur supplémentaire pendant la crise de l'ère */
  crisisStakes?: number;
  /** le vent de l'ère : une dérive appliquée à chaque décision (hors crise) */
  wind?: Delta;
  /** phrase qui annonce ce vent au joueur */
  windText?: string;
}

export type EndingId = 'science' | 'military' | 'culture';

export interface RivalState {
  name: string;
  progress: number;
  relation: number;
  alive: boolean;
  /** dernier seuil ayant déclenché une carte */
  lastTrigger: number;
}

export interface HistoryEntry {
  turn: number;
  era: number;
  card: string;
  side: Side;
  gauges: Gauges;
  /** nombre de cartes du deck par mot-clé (ordre de KEYWORDS), pour rejouer la croissance */
  kw: number[];
  wonders: string[];
}

export interface Result {
  type: 'defeat' | 'victory';
  gauge?: GaugeId;
  /** 'low' | 'high' */
  bound?: 'low' | 'high';
  ending?: EndingId;
  /** carte responsable de la défaite */
  card?: string;
}

export type Phase = 'card' | 'crisis' | 'reward' | 'era' | 'end';

export interface RewardOffer {
  cards: string[];
  wonder?: string;
}

export interface GameState {
  version: number;
  seed: number;
  rng: [number, number, number, number];
  era: number;
  turn: number;
  eraTurn: number;
  gauges: Gauges;
  /** cartes persistantes : la civilisation */
  deck: string[];
  /** pioche de l'ère en cours */
  drawPile: string[];
  /** cartes planifiées (conséquences à retardement) */
  scheduled: { card: string; turns: number; persistent?: boolean }[];
  phase: Phase;
  current: string | null;
  crisis: { id: string; index: number; cards: string[] } | null;
  reward: RewardOffer | null;
  wonders: string[];
  flags: string[];
  rival: RivalState;
  history: HistoryEntry[];
  /** nombre de tours avec au moins une jauge en danger */
  dangerTurns: number;
  /** cartes déjà jouées dans la partie (pour éviter les répétitions de récompenses) */
  seen: string[];
  /** récompenses déjà offertes */
  offered: string[];
  result: Result | null;
  tutorial: boolean;
  /** compteur de croissance visuelle */
  growth: number;
}

/** Seuils de la zone de danger (modifiables pour les balayages de simulation). */
export const TUNING = { dangerLow: 30, dangerHigh: 70, maxSwing: 15 };
