/**
 * Gabarits de texte. Les cartes s'écrivent une fois ; les noms changent avec les ères,
 * et des clauses conditionnelles rappellent ce que le joueur a fait.
 *
 *   {F:ourk}        chef de famille de l'ère (« Sire Ourquin »)
 *   {H:ourk}        la famille de l'ère (« les Ourquin »)
 *   {A:ourk}        l'ancêtre fondateur (« Ourk »)
 *   {T:ourk}        leur métier de l'ère (« chevaliers »)
 *   {cite}          nom de votre civilisation ; {peuple} : ses habitants
 *   {rival}         la rivale (« les Orvandes ») ; {reine} : sa souveraine de l'ère
 *   {date}          date de l'ère en cours
 *   {Q:souvenir}    la décision exacte qui a créé ce souvenir, entre guillemets
 *   {D:souvenir}    sa date
 *   {?mem:x|oui|non}            selon un souvenir
 *   {?loy:ourk>=2|oui|non}      selon une loyauté (opérateurs >= <= > <)
 *   {?card:x|oui|non}           selon une carte du deck
 *   {?rival>=1|oui|non}         selon la relation avec la rivale
 *   {ruine:0}       nom d'une civilisation passée (0 = la plus récente)
 *   {?ruins>=2|oui|non}         selon le nombre de civilisations passées
 */
import type { FamilyId, GameState } from './types';
import type { Content } from './content';

/** coefficient des crises (réglé par le moteur) */
let CRISIS_K = 1;
export const crisisK = () => CRISIS_K;
export function setCrisisK(k: number): void {
  CRISIS_K = k;
}

export const ERA_NAMES = ['L’Âge de pierre', 'L’Antiquité', 'Le Moyen Âge', 'L’Ère industrielle', 'L’Ère spatiale'];
export const ERA_SUBTITLES = [
  'Un feu, des huttes, et déjà des problèmes.',
  'Le soleil, la poussière, et des gens qui écrivent.',
  'Des bougies, des cloches, et des certitudes.',
  'De la fumée. Beaucoup de fumée.',
  'Le ciel n’est plus une limite. Le reste, si.',
];

export function eraDate(era: number, turn: number): string {
  const base = [-9200, -1400, 1080, 1810, 2150][era];
  const step = [140, 45, 22, 6, 3][era];
  const year = base + Math.min(turn, 60) * step;
  const fmt = (n: number) => n.toLocaleString('fr-FR').replace(/ |\s/g, ' ');
  if (year < 0) return `an ${fmt(-year)} avant le Calendrier`;
  return `an ${fmt(year)}`;
}

function famName(c: Content, id: FamilyId, field: 'head' | 'house' | 'trade', era: number): string {
  return c.families[id][field][Math.max(0, Math.min(4, era))];
}

function compare(v: number, op: string, n: number): boolean {
  switch (op) {
    case '>=': return v >= n;
    case '<=': return v <= n;
    case '>': return v > n;
    case '<': return v < n;
    default: return v === n;
  }
}

/** Remplace les gabarits d'un texte. */
export function fill(text: string, s: GameState, c: Content, extra: Record<string, string> = {}): string {
  let out = text;
  // clauses conditionnelles (on résout de l'intérieur vers l'extérieur)
  for (let guard = 0; guard < 8 && out.includes('{?'); guard++) {
    // une branche peut contenir des gabarits simples ({F:ourk}), pas d'autre conditionnelle non résolue
    out = out.replace(/\{\?([^{}|]+)\|((?:[^{}|]|\{[^?{}|][^{}|]*\})*)(?:\|((?:[^{}]|\{[^?{}][^{}]*\})*))?\}/g, (_m, test: string, yes: string, no = '') => {
      let ok = false;
      let m: RegExpMatchArray | null;
      if ((m = test.match(/^mem:(.+)$/))) ok = s.mem.includes(m[1]);
      else if ((m = test.match(/^card:(.+)$/))) ok = s.deck.includes(m[1]);
      else if ((m = test.match(/^loy:(\w+)(>=|<=|>|<|=)(-?\d+)$/))) ok = compare(s.fam[m[1] as FamilyId]?.loy ?? 0, m[2], Number(m[3]));
      else if ((m = test.match(/^rival(>=|<=|>|<|=)(-?\d+)$/))) ok = compare(s.rivalRel, m[1], Number(m[2]));
      else if ((m = test.match(/^jalon:(\d)$/))) ok = !!s.jalons[Number(m[1])];
      else if ((m = test.match(/^dessein:(.+)$/))) ok = s.dessein === m[1];
      else if ((m = test.match(/^state:(\w+)=(\w+)$/))) ok = s.fam[m[1] as FamilyId]?.state === m[2];
      else if ((m = test.match(/^ruins(>=|<=|>|<|=)(\d+)$/))) ok = compare(s.ruins.length, m[1], Number(m[2]));
      else if ((m = test.match(/^legacy$/))) ok = !!s.ruins[0]?.legacy;
      else if (test === 'rivalshe') ok = !!(c.rivals.find((r) => r.id === s.rival) ?? c.rivals[0]).she;
      return ok ? yes : no;
    });
  }
  const rival = c.rivals.find((r) => r.id === s.rival) ?? c.rivals[0];
  out = out
    .replace(/\{F:(\w+)\}/g, (_m, id: FamilyId) => famName(c, id, 'head', s.era))
    .replace(/\{H:(\w+)\}/g, (_m, id: FamilyId) => famName(c, id, 'house', s.era))
    .replace(/\{A:(\w+)\}/g, (_m, id: FamilyId) => c.families[id].head[0])
    .replace(/\{T:(\w+)\}/g, (_m, id: FamilyId) => famName(c, id, 'trade', s.era))
    .replace(/\{cite\}/g, s.name)
    .replace(/\{peuple\}/g, demonym(s.name))
    .replace(/\{rival\}/g, rival.name)
    .replace(/\{Rival\}/g, capitalize(rival.name))
    .replace(/\{RIVAL\}/g, rival.name.toUpperCase())
    .replace(/\{reine\}/g, rival.leader[s.era])
    .replace(/\{Reine\}/g, capitalize(rival.leader[s.era]))
    .replace(/\{s:(\d+)\}/g, (_m, n: string) => String(Math.max(1, Math.round(Number(n) * [1, 1.35, 1.75, 2.2, 2.7][s.era]))))
    .replace(/\{k:(\d+)\}/g, (_m, n: string) => String(Math.max(1, Math.round(Number(n) * crisisK()))))
    .replace(/\{date\}/g, eraDate(s.era, s.turn - (s.eraStart ?? 0)))
    .replace(/\{Q:(\w+)\}/g, (_m, k: string) => (s.memo[k] ? `« ${s.memo[k].label} »` : '« … »'))
    .replace(/\{D:(\w+)\}/g, (_m, k: string) => s.memo[k]?.date ?? 'un jour')
    .replace(/\{ruine:(\d)\}/g, (_m, i: string) => s.ruins[Number(i)]?.name ?? 'une cité sans nom')
    .replace(/\{elle\}/g, rival.she ? 'elle' : 'il')
    .replace(/\{Elle\}/g, rival.she ? 'Elle' : 'Il')
    .replace(/\{(\w+)\}/g, (m, k: string) => extra[k] ?? m);
  return polish(out);
}

/** Grammaire française après substitution : contractions et majuscules en début de phrase. */
export function polish(text: string): string {
  let out = text.replace(/\s{2,}/g, ' ').trim();
  out = out
    .replace(/\b([dD])e les (?=[A-ZÉÈ])/g, (_m, d: string) => (d === 'd' ? 'des ' : 'Des '))
    .replace(/\b([àÀ]) les (?=[A-ZÉÈ])/g, (_m, a: string) => (a === 'à' ? 'aux ' : 'Aux '))
    .replace(/\b([dD])e le (?=(grand|roi|maréchal|colonel|docteur|vieux|Conseil)\b|[A-ZÉÈ])/g, (_m, d: string) => (d === 'd' ? 'du ' : 'Du '))
    .replace(/\b([àÀ]) le (?=(grand|roi|maréchal|colonel|docteur|vieux|Conseil)\b|[A-ZÉÈ])/g, (_m, a: string) => (a === 'à' ? 'au ' : 'Au '));
  // majuscule en début de texte, après une ponctuation forte, après un guillemet ouvrant
  out = out.replace(/(^|[.!?…]\s+|«\s?)([a-zàâçéèêëîïôûùüÿœ])/g, (_m, pre: string, ch: string) => pre + ch.toUpperCase());
  return out;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** « Ourkie » → « les Ourkiens ». */
export function demonym(name: string): string {
  const base = name.replace(/(ie|ia|ée|e|a|o)$/i, '');
  return `les ${base}iens`;
}

const SYL1 = ['Our', 'Bal', 'Tem', 'Vor', 'Sar', 'Mel', 'Kal', 'Dun', 'Zan', 'Pel', 'Gor', 'Lum', 'Ner', 'Tar', 'Ves', 'Ombr', 'Cal', 'Fen'];
const SYL2 = ['an', 'ar', 'ol', 'ev', 'in', 'ab', 'ur', 'il', 'ed', 'am', 'os', 'ér'];
const SYL3 = ['ie', 'ia', 'ée', 'ane', 'ise', 'ande', 'ille', 'onie'];

/** Nom de civilisation déterministe pour une graine. */
export function civName(seed: number): string {
  let x = (seed * 2654435761) >>> 0;
  const r = (n: number) => {
    x = (Math.imul(x ^ (x >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0;
    return x % n;
  };
  const two = r(3) === 0;
  return SYL1[r(SYL1.length)] + (two ? SYL2[r(SYL2.length)] : '') + SYL3[r(SYL3.length)];
}
