/**
 * Citadeck V2 — types du jeu.
 * Tout est décrit en données (src/data) ; le moteur (engine.ts) ne connaît aucune carte.
 */

export type Res = 'vivres' | 'armee' | 'savoir' | 'tresor';
export const RES: readonly Res[] = ['vivres', 'armee', 'savoir', 'tresor'];
/** ce que fait chaque famille, pour qui ne connaît pas encore leurs noms */
export const FAMILY_ROLE: Record<FamilyId, string> = { ourk: 'guerriers', sel: 'prêtres', brume: 'savants', troc: 'marchands' };

export const RES_LABEL: Record<Res, string> = { vivres: 'Vivres', armee: 'Armée', savoir: 'Savoir', tresor: 'Trésor' };
export type Resources = Record<Res, number>;
export type Bag = Partial<Record<Res, number>>;

export type Tag = 'Guerre' | 'Foi' | 'Science' | 'Commerce' | 'Culture' | 'Nature';
export const TAGS: readonly Tag[] = ['Guerre', 'Foi', 'Science', 'Commerce', 'Culture', 'Nature'];

export type FamilyId = 'ourk' | 'sel' | 'brume' | 'troc';
export const FAMILIES: readonly FamilyId[] = ['ourk', 'sel', 'brume', 'troc'];
export type FamilyState = 'presente' | 'exilee' | 'rivale' | 'eteinte';

export type Motif =
  | 'sun' | 'moon' | 'mountain' | 'wave' | 'tower' | 'eye' | 'spiral' | 'crown' | 'leaf' | 'gear'
  | 'star' | 'flame' | 'shield' | 'scroll' | 'coin' | 'comet' | 'ring' | 'arch' | 'wheat' | 'mask'
  | 'fang' | 'hand' | 'skull' | 'house' | 'ship' | 'bird' | 'key' | 'road' | 'scales' | 'bell';

export interface ArtSpec {
  motif: Motif;
  hue?: number;
}

/** Condition : toutes les clauses présentes doivent être vraies. */
export interface Cond {
  res?: Bag; // au moins
  resMax?: Bag; // au plus
  tags?: Partial<Record<Tag, number>>; // au moins N
  fam?: { id: FamilyId; min?: number; max?: number; state?: FamilyState };
  mem?: string;
  notMem?: string;
  /** carte présente dans le deck (découverte) */
  card?: string;
  notCard?: string;
  rival?: { min?: number; max?: number };
  quartiers?: { min?: number; max?: number };
  era?: { min?: number; max?: number };
  dessein?: string;
  /** au moins N jalons bâtis */
  jalons?: number;
  /** la rivale a au moins N merveilles */
  rivalJalons?: number;
  /** au moins une civilisation passée dans la chronique */
  /** nombre minimal de civilisations passées dans la chronique */
  ruins?: number;
}

export interface Bet {
  /** chance de base (0..1), affichée */
  chance: number;
  /** bonus de chance par carte d'un mot-clé, affiché */
  per?: { tag: Tag; bonus: number };
  win: Effect;
  lose: Effect;
}

export interface Effect {
  /** variation de ressources, non affichée avant le choix (c'est le texte qui la dit) */
  gain?: Bag;
  quartiers?: number;
  /** perte imposée (aucune autre option) : la palissade peut la parer, contrairement à un sacrifice choisi */
  forced?: boolean;
  /** saisie d'une dette : tant de Trésor, puis de Vivres, d'Armée, de Savoir ; à sec, un quartier */
  seize?: number;
  loy?: Partial<Record<FamilyId, number>>;
  mem?: string[];
  unmem?: string[];
  /** cartes programmées : jouées dans `in` cartes (0 = tout de suite après) */
  sched?: { card: string; in: number; pay?: number }[];
  /** carte ajoutée au deck permanent */
  addCard?: string[];
  removeCard?: string[];
  rival?: number;
  famState?: { id: FamilyId; state: FamilyState };
  /** la rivale bâtit (+1) ou perd (-1) un jalon */
  rivalJalon?: number;
  /** fait avancer le jalon de l'ère (bâtit le jalon) */
  /** bâtir le jalon de l'ère (« alt » : la variante débloquée) */
  jalon?: boolean | 'alt';
  /** ère du jalon bâti (rattrapage d'une merveille manquée) ; par défaut l'ère en cours */
  jalonEra?: number;
  bet?: Bet;
  if?: Cond;
  then?: Effect;
  else?: Effect;
  /** réplique affichée après le choix (remplace celle de l'option) */
  reply?: string;
  /** cause, pour l'épitaphe, si l'effet coûte des quartiers */
  cause?: string;
  /** fin de partie forcée (rare : épilogues) */
  end?: boolean;
}

export interface Option {
  label: string;
  /** coût payé, affiché sur l'option */
  cost?: Bag;
  /** exigence affichée ; option grisée si non remplie */
  req?: Cond;
  /** texte court de l'exigence, s'il faut le préciser (sinon généré) */
  reqLabel?: string;
  /** menace affichée (« sinon, un quartier brûle ») */
  warn?: string;
  effect: Effect;
  reply?: string;
  /** option payée à crédit (générée quand il ne reste qu'un choix) */
  credit?: boolean;
}

export type CardKind =
  | 'famille' | 'evenement' | 'intrigue' | 'crise' | 'rivale' | 'institution' | 'rencontre' | 'ruines'
  | 'tutoriel' | 'carrefour' | 'jalon' | 'decouverte' | 'croissance' | 'presage' | 'proces' | 'hommage' | 'revenant' | 'trahison'
  | 'regle' | 'conseil';

export type Form = 'binaire' | 'qui' | 'pari' | 'dosage' | 'route' | 'seuil' | 'choix';

export interface CardDef {
  /** écho : une suite liée à un souvenir, toujours tirée quand sa condition est remplie */
  echo?: boolean;
  /** contenu verrouillé : n'apparaît qu'une fois débloqué (méta-progression) */
  lock?: string;
  id: string;
  kind: CardKind;
  /** famille qui parle (son emblème illustre la carte) */
  family?: FamilyId;
  /** nom affiché de qui parle, gabarit (par défaut : la famille) */
  speaker?: string;
  title: string;
  text: string;
  /** ères où la carte peut apparaître (0..4) */
  eras?: number[];
  tags?: Tag[];
  options: Option[];
  form?: Form;
  /** carte « qui ? » : options construites à partir des familles présentes */
  qui?: { count: number; option: (f: FamilyId) => Option; exclude?: FamilyId[] };
  /** condition pour être tirée */
  cond?: Cond;
  art?: ArtSpec;
  /** retirée du deck après avoir été jouée */
  oneShot?: boolean;
  /** intrigue à laquelle la carte appartient (pour les mesures) */
  arc?: string;
  /** dernière étape d'une intrigue */
  finale?: boolean;
  /** découverte : passifs tant que la carte est dans le deck */
  passive?: Passive[];
  /** découverte : coût en Savoir pour l'étudier */
  price?: number;
  /** découverte : ce qu'elle apporte, en une ligne */
  gift?: string;
  /** carte valable à toutes les ères : coûts, gains et seuils grandissent avec l'ère */
  scale?: boolean;
}

export interface FamilyDef {
  /** le chef de famille est une femme, par ère (pronoms {il:x}) */
  she?: boolean[];
  id: FamilyId;
  tag: Tag;
  res: Res;
  hue: number;
  motif: Motif;
  /** chef de famille, par ère */
  head: [string, string, string, string, string];
  /** nom de la famille, par ère (« les Ourk », « les Ourkos »…) */
  house: [string, string, string, string, string];
  /** ce qu'ils sont, par ère (« chasseurs », « légionnaires »…) */
  trade: [string, string, string, string, string];
  /** une ligne qui résume leur caractère */
  voice: string;
}

export interface Jalon {
  name: string;
  text: string;
  cost: Bag;
  req?: Cond;
  /** ce que la merveille apporte une fois bâtie */
  passive?: Passive;
  gift: string;
  /** silhouette dans la scène */
  shape: string;
  /** l'inauguration, propre à chaque merveille */
  built?: string;
  /** variante débloquée par la méta-progression (proposée au chantier) */
  alt?: Jalon & { lock: string };
}

export interface DesseinDef {
  id: string;
  name: string;
  /** l'accroche, une phrase */
  pitch: string;
  /** la ressource et les alliés qu'il faudra, en clair */
  res: Res;
  need: string;
  tag: Tag;
  ending: 'science' | 'military' | 'culture';
  jalons: [Jalon, Jalon, Jalon, Jalon, Jalon];
}

/** La forme d'une ère : sa règle, son rythme, son objectif et la façon dont la menace arrive (comme les actes d'un jeu). */
export interface EraForm {
  id: 'errance' | 'contagion' | 'conseil' | 'course' | 'jugement';
  name: string;
  /** le rythme, en clair (« trois saisons courtes ») */
  rhythm: string;
  seasons: number;
  /** cartes par saison (hors carte de règle) */
  cards: number;
  /** la règle propre à l'ère, une phrase */
  rule: string;
  /** la même, en quelques mots, sous la phrase du présage ({cap} : ce que la tribu peut porter) */
  short: string;
  /** l'objectif propre à l'ère, une phrase */
  objective: string;
  /** comment la menace arrive, une phrase */
  threat: string;
  /** la phrase principale du présage : {j} la merveille, {cn} la crise, {rival} la rivale */
  mission: string;
  /** quand et comment la crise frappe, en quelques mots (ligne « Menace » du présage) */
  when: string;
  /** ce que l'objectif ajoute à la merveille, en quelques mots (ligne « Objectif » du présage) */
  goal?: string;
}

export interface OriginDef {
  id: string;
  name: string;
  text: string;
  /** une phrase qui dit le style de jeu */
  style: string;
  /** un conseil mesuré (« le plus sûr ») */
  badge?: string;
  /** loyautés de départ */
  loy?: Partial<Record<FamilyId, number>>;
  res: Resources;
  quartiers: number;
  families: FamilyId[];
  deck?: string[];
  mem?: string[];
  /** fait débloquant cette origine (doc) */
  unlock?: string;
}

export interface CrisisDef {
  era: number;
  name: string;
  intro: string;
  /** ce qui protège, annoncé au début de l'ère */
  protects: string;
  cards: string[];
}

export type Passive =
  | { type: 'crisisShield'; amount: number } // ignore N quartiers perdus pendant les crises (par crise)
  | { type: 'income'; res: Res; amount: number } // à chaque saison
  | { type: 'loyalty'; family: FamilyId | 'all'; floor: number } // loyauté jamais sous ce plancher
  | { type: 'mend' } // à chaque fin d'ère, les familles hostiles remontent d'un cran
  | { type: 'shield'; amount: number; res: Res } // la première perte de quartier subie de chaque ère se rachète en réserves
  | { type: 'growth'; amount: number } // quartiers bonus à la croissance
  | { type: 'tagBonus'; tag: Tag; amount: number } // compte pour N cartes du mot-clé
  | { type: 'discount'; res: Res; amount: number }; // coûts réduits

export interface RouteDef {
  id: string;
  /** domaine d'une famille : y aller, c'est affronter ses cartes */
  family?: FamilyId;
  /** nom par ère (gabarit) */
  name: string | [string, string, string, string, string];
  /** promesse affichée sur la route */
  promise: string;
  /** risque affiché, s'il y en a */
  risk?: string;
  art: ArtSpec;
  /** rencontres possibles (une est tirée) */
  encounters: string[];
  cond?: Cond;
  weight?: number;
}

export interface RivalDef {
  id: string;
  name: string; // « les Orvandes »
  /** souveraine, par ère (une dynastie, comme vos familles) */
  leader: [string, string, string, string, string];
  voice: string;
  /** la souveraine est une femme (accords dans les lettres) */
  she: boolean;
  hue: number;
  /** son propre dessein, visible sur son horizon */
  jalons: [string, string, string, string, string];
}

// --------------------------------------------------------------------------- état

export interface FamilyStatus {
  loy: number;
  state: FamilyState;
  /** dernière ère où sa carte a été jouée */
  seen: number;
}

export interface LossEntry {
  turn: number;
  era: number;
  card: string;
  amount: number;
  cause: string;
}

export interface HistoryEntry {
  turn: number;
  era: number;
  /** date lisible, pour les citations (« an 7 650 avant le Calendrier ») */
  date: string;
  card: string;
  title: string;
  choice: number;
  label: string;
  reply?: string;
  /** loyautés modifiées par ce choix (pour que les familles citent leurs griefs) */
  loy?: Partial<Record<FamilyId, number>>;
  /** cartes et choix d'origine si la carte est une suite */
  from?: string;
  /** nombre d'options jouables à ce moment (1 = choix imposé) */
  alts?: number;
  res: Resources;
  quartiers: number;
  /** empreinte du texte de réplique à variantes (pour ne pas relire la même) */
  rk?: number;
}

export interface Prompt {
  card: string;
  /** données dynamiques : routes, technologies, recrues, familles d'une carte « qui ? » */
  routes?: string[];
  recruits?: string[];
  qui?: FamilyId[];
  /** procès : la famille plaignante et la décision citée */
  plaintiff?: FamilyId;
  quote?: number;
  /** pour les suites : la décision qui l'a provoquée */
  from?: string;
  /** chantier de rattrapage : l'ère de la merveille manquée */
  missed?: number;
  /** chantier ouvert dès la fin de la première saison */
  early?: boolean;
  /** créance : montant fixé au moment du crédit */
  pay?: number;
}

export type Phase = 'presage' | 'saison' | 'chantier' | 'crise' | 'finere' | 'fin';

export interface Result {
  type: 'victoire' | 'defaite';
  /** palier de fin : triomphe (cinq merveilles), victoire (quatre), survie (moins), chute */
  rank?: 'triomphe' | 'victoire' | 'survie' | 'chute';
  ending?: 'science' | 'military' | 'culture';
  jalons: number;
  /** cause de la chute */
  cause?: string;
}

export interface GameState {
  version: number;
  seed: number;
  rng: [number, number, number, number];
  name: string;
  origin: string;
  dessein: string;
  rival: string;
  era: number;
  saison: number;
  phase: Phase;
  /** ce que le joueur doit trancher */
  prompt: Prompt | null;
  /** cartes restantes de la saison en cours */
  pile: string[];
  /** cartes de fin d'ère restantes */
  steps: string[];
  res: Resources;
  quartiers: number;
  fam: Record<FamilyId, FamilyStatus>;
  mem: string[];
  /** pour chaque souvenir : la décision exacte et sa date (les familles citent) */
  memo: Record<string, { label: string; date: string; title: string; era: number }>;
  deck: string[];
  jalons: boolean[];
  rivalRel: number;
  rivalJalons: number;
  /** cartes de l'ère pas encore jouées */
  pool: string[];
  /** dernière ère où chaque famille a été visitée (carrefour) */
  visits: Record<FamilyId, number>;
  /** cartes à usage unique déjà jouées */
  spent: string[];
  sched: { card: string; at: number; from?: string; pay?: number }[];
  turn: number;
  /** tour où le joueur a payé pour voir les chiffres exacts de la carte en cours */
  peek?: number;
  /** tour où l'ère en cours a commencé (dates) */
  eraStart: number;
  history: HistoryEntry[];
  losses: LossEntry[];
  /** une perte de quartier déjà évitée cette ère (passif « shield ») */
  shieldUsed: boolean;
  /** combien de fois la protection a servi (son prix monte à chaque usage) */
  shieldUses?: number;
  result: Result | null;
  /** première partie : tutoriel intégré */
  tutorial: boolean;
  /** civilisations passées (pour les ruines) */
  ruins: RuinInfo[];
  /** compteur pour la croissance visuelle */
  growth: number;
  /** colonies fondées (ère II) : des quartiers qui se nourrissent eux-mêmes */
  colonies?: number;
  /** arcs ouverts / dénoués (mesures, chronique) */
  arcs: { open: string[]; done: string[] };
  /** contenus débloqués disponibles dans cette partie (méta-progression) */
  unlocked: string[];
  /** ères où la variante débloquée du jalon a été bâtie */
  jalonAlt: number[];
  /** Âge de fer : crises plus dures */
  iron: boolean;
  /** cartes vues à la partie précédente (tirées en dernier) */
  avoid?: string[];
  /** nombre de parties déjà jouées (fait tourner les variantes de texte) */
  run?: number;
}

/** Ce qu'une civilisation morte laisse aux suivantes. */
export interface RuinInfo {
  name: string;
  dessein: string;
  era: number;
  jalons: number;
  cause: string;
  epitaph: string;
  /** famille la plus loyale et la plus hostile à la fin */
  ally?: FamilyId;
  enemy?: FamilyId;
  /** silhouette de son plus haut jalon */
  shape?: string;
  /** derniers mots, choisis à la chute */
  testament?: string;
  /** le grief le plus lourd de la famille la plus furieuse, cité dans la partie suivante */
  grudge?: { family: FamilyId; house: string; quote: string; date: string };
  /** ce que le testament lègue à la civilisation suivante */
  legacy?: Legacy;
  victory?: boolean;
}

/** Héritage d'un testament : appliqué au début de la partie suivante. */
export interface Legacy {
  label: string;
  gain?: Bag;
  loy?: Partial<Record<FamilyId, number>>;
  quartiers?: number;
}

export interface ChronicleEntry extends RuinInfo {
  seed: number;
  origin: string;
  rival: string;
  /** dates de fondation et de chute */
  from: string;
  to: string;
  result: 'victoire' | 'defaite';
  ending?: string;
  /** cinq lignes de chronique, partageables */
  lines: string[];
  turns: number;
  iron?: boolean;
}

export interface MetaState {
  version: number;
  runs: number;
  /** de la plus récente à la plus ancienne */
  chronicle: ChronicleEntry[];
  unlocked: string[];
  /** faits accomplis (servent aux déblocages) */
  feats: string[];
  /** événements, rencontres et lettres vus à la dernière partie */
  lastSeen?: string[];
}
