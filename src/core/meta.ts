/**
 * Méta-progression : ce qu'une partie laisse aux suivantes.
 *
 *  - la chronique des civilisations passées (cinq lignes partageables chacune) ;
 *  - leurs ruines, visibles dans le paysage et fouillables à l'Antiquité ;
 *  - un testament choisi à la chute : des derniers mots gravés sur une stèle, et un héritage concret ;
 *  - le grief de la famille la plus furieuse, que ses descendants viennent réclamer (les Revenants) ;
 *  - des déblocages : origines, merveilles alternatives, découvertes, cartes, Âge de fer.
 *
 * Module pur : ni DOM ni stockage. L'interface sauvegarde le MetaState.
 */
import type { Engine, Setup } from './engine';
import { FAMILIES, FAMILY_ROLE, RES_LABEL, type Bag, type ChronicleEntry, type FamilyId, type GameState, type Legacy, type MetaState, type Res } from './types';
import { capitalize, eraDate, fill, polish } from './text';

export const META_VERSION = 1;
export const CHRONICLE_MAX = 40;

export function newMeta(): MetaState {
  return { version: META_VERSION, runs: 0, chronicle: [], unlocked: [], feats: [] };
}

/** Relit un MetaState sauvegardé, ou en crée un neuf s'il est illisible. */
export function loadMeta(raw: unknown): MetaState {
  const m = raw as MetaState | null;
  if (!m || typeof m !== 'object' || m.version !== META_VERSION || !Array.isArray(m.chronicle)) return newMeta();
  return { version: META_VERSION, runs: m.runs | 0, chronicle: m.chronicle, unlocked: m.unlocked ?? [], feats: m.feats ?? [], lastSeen: m.lastSeen ?? [] };
}

// ============================================================================ déblocages

export interface Unlock {
  id: string;
  kind: 'origine' | 'merveille' | 'decouverte' | 'carte' | 'mode';
  name: string;
  /** ce que ça change */
  text: string;
  /** comment l'obtenir (affiché, même verrouillé) */
  how: string;
  test: (m: MetaState) => boolean;
}

const feat = (f: string) => (m: MetaState) => m.feats.includes(f);

export const UNLOCKS: Unlock[] = [
  { id: 'heritiers', kind: 'origine', name: 'Les Héritiers', test: (m) => m.chronicle.length >= 1,
    how: 'Laisser une première civilisation derrière soi.',
    text: 'Bâtir sur les ruines de la précédente : son héritage compte double, ses amis et ses ennemis aussi.' },
  { id: 'fleuve', kind: 'origine', name: 'Les Gens du Fleuve', test: feat('ere3'),
    how: 'Atteindre le Moyen Âge.',
    text: 'Une vallée fertile : plus de Vivres et un quartier de plus, mais peu d’Armée.' },
  { id: 'alt_etoiles', kind: 'merveille', name: 'Le Grand Télescope', test: feat('jalon3_etoiles'),
    how: 'Bâtir l’Observatoire.',
    text: 'Une autre troisième merveille pour Toucher les étoiles.' },
  { id: 'alt_empire', kind: 'merveille', name: 'La Voie impériale', test: feat('jalon3_empire'),
    how: 'Bâtir la Forteresse.',
    text: 'Une autre troisième merveille pour Soumettre la vallée.' },
  { id: 'alt_posterite', kind: 'merveille', name: 'La Bibliothèque', test: feat('jalon3_posterite'),
    how: 'Bâtir la Cathédrale.',
    text: 'Une autre troisième merveille pour Être chantés pour toujours.' },
  { id: 'archeologie', kind: 'decouverte', name: 'L’Archéologie', test: feat('fouille'),
    how: 'Fouiller les ruines d’une civilisation passée.',
    text: 'Une découverte : les morts ont des choses à vous apprendre, et des trésors à vous céder.' },
  { id: 'ambassade', kind: 'decouverte', name: 'L’Ambassade', test: feat('paix'),
    how: 'Finir une partie en bons termes avec la rivale.',
    text: 'Une découverte : parler à la rivale avant qu’elle ne tire.' },
  { id: 'droit', kind: 'decouverte', name: 'Le Droit', test: feat('proces3'),
    how: 'Passer trois procès dans la même partie.',
    text: 'Une découverte : des juges, des avocats, et des procès qui coûtent moins cher.' },
  { id: 'silos', kind: 'decouverte', name: 'Les Silos', test: feat('famine'),
    how: 'Mourir de faim.',
    text: 'Une découverte : ne plus jamais mourir de faim. Presque jamais.' },
  { id: 'musee', kind: 'carte', name: 'Le Musée des civilisations', test: (m) => m.chronicle.length >= 2,
    how: 'Laisser deux civilisations derrière soi.',
    text: 'Une carte de l’Ère industrielle : exposer vos prédécesseurs, ou les vendre.' },
  { id: 'fer', kind: 'mode', name: 'L’Âge de fer', test: feat('victoire'),
    how: 'Remporter une partie.',
    text: 'Un mode de jeu : des crises 20 % plus dures, pour les chroniques glorieuses.' },
];

/** Faits accomplis dans une partie terminée. */
export function featsOf(e: Engine, s: GameState): string[] {
  const out: string[] = [];
  if (s.era >= 2) out.push('ere3');
  if (s.era >= 4) out.push('ere5');
  if (s.jalons.filter(Boolean).length >= 3) out.push('jalons3');
  if (s.jalons[2]) out.push(`jalon3_${s.dessein}`);
  if (s.result?.rank === 'triomphe' || s.result?.rank === 'victoire') out.push('victoire', `victoire_${s.dessein}`);
  if (s.result?.type === 'defaite') out.push('chute');
  if (s.result?.type === 'defaite' && /famine/.test(s.result.cause ?? '')) out.push('famine');
  if (s.mem.includes('ruines_fouillees')) out.push('fouille');
  if (s.rivalRel >= 2) out.push('paix');
  if (s.history.filter((h) => e.card(h.card).kind === 'proces').length >= 3) out.push('proces3');
  if (FAMILIES.some((f) => s.fam[f].loy >= 3)) out.push('devouee');
  return out;
}

// ============================================================================ testament

export interface Testament {
  text: string;
  legacy: Legacy;
}

const DESSEIN_RES: Record<string, Res> = { etoiles: 'savoir', empire: 'armee', posterite: 'tresor' };

function bagLabel(b: Bag): string {
  return (Object.keys(b) as Res[]).map((r) => `+${b[r]} ${RES_LABEL[r]}`).join(', ');
}

/** Graine stable par partie, pour choisir des variantes sans toucher au hasard du jeu. */
function pick<T>(s: GameState, salt: number, list: T[]): T {
  const x = Math.abs(Math.imul(s.seed ^ (salt * 2654435761), 2246822519) >>> 0);
  return list[x % list.length];
}

/** La famille nommée dans une cause de chute (« la trahison des Ourk »), si elle y est. */
function familyInCause(e: Engine, cause: string): FamilyId | undefined {
  return FAMILIES.find((f) => e.c.families[f].house.some((h) => cause.includes(h.replace(/^(les|la|l’) /, ''))));
}

/**
 * Trois derniers mots possibles. Chacun lègue quelque chose à la civilisation suivante :
 * une famille qui vous fera confiance, une leçon tirée de la chute, ou des réserves.
 */
export function testaments(e: Engine, s: GameState): Testament[] {
  const out: Testament[] = [];
  const present = FAMILIES.filter((f) => s.fam[f].state !== 'eteinte');
  const byLoy = present.slice().sort((a, b) => s.fam[b].loy - s.fam[a].loy);
  const ally = byLoy[0];
  const enemy = byLoy[byLoy.length - 1];
  const H0 = (f: FamilyId) => capitalize(e.c.families[f].house[0]);
  const t = (txt: string) => fill(txt, s, e.c);

  // 1. une famille : celle qui est restée, ou celle dont il faut se méfier
  if (ally && s.fam[ally].loy >= 1) {
    const line = pick(s, 1, [
      `{H:${ally}} sont restés jusqu’au bout. Gardez-les près de vous.`,
      `Faites confiance à {H:${ally}}. Pas aveuglément. Mais faites-leur confiance.`,
      `{F:${ally}} a tenu la porte jusqu’à la fin. Ses descendants la tiendront pour vous.`,
    ]);
    out.push({ text: t(line), legacy: { label: `${H0(ally)}, les ${FAMILY_ROLE[ally]}, vous aiment déjà`, loy: { [ally]: 1 } } });
  } else if (enemy) {
    const rivalOf = e.c.rivalries[enemy];
    const line = pick(s, 1, [
      `Méfiez-vous de {H:${enemy}}. Ils n’oublient rien. Ils n’ont jamais rien oublié.`,
      `Ne laissez jamais {H:${enemy}} sans nouvelles. Ni sans surveillance.`,
    ]);
    out.push({ text: t(line), legacy: { label: `${H0(rivalOf)}, les ${FAMILY_ROLE[rivalOf]}, vous aiment déjà`, loy: { [rivalOf]: 1 } } });
  }

  // 2. la leçon de la chute (ou du triomphe)
  const cause = s.result?.cause ?? '';
  let lesson: Testament;
  if (s.result?.type === 'victoire') {
    lesson = { text: t(pick(s, 2, ['Nous avons réussi. Ne recommencez pas tout de suite.', 'Tout est possible. Mais pas tout en même temps.'])), legacy: { label: '', gain: { tresor: 4, vivres: 2 } } };
  } else if (/famine/.test(cause)) {
    lesson = { text: t(pick(s, 2, ['Mangez d’abord. Bâtissez ensuite.', 'Les greniers. Toujours les greniers.'])), legacy: { label: '', gain: { vivres: 6 } } };
  } else {
    const f = familyInCause(e, cause);
    const cr = [...e.c.crises, ...((e.c.crisisAlts ?? []).filter(Boolean) as typeof e.c.crises)].find((c) => cause.toLowerCase().includes(c.name.toLowerCase().replace(/^(la|le|l’) ?/, '')));
    if (f) {
      lesson = { text: t(pick(s, 2, [`Écoutez {H:${f}} avant qu’ils ne crient.`, `Ce ne sont pas {rival} qui nous ont eus. Ce sont {H:${f}}.`])), legacy: { label: '', gain: { [e.c.families[f].res]: 5 } } };
    } else if (cr) {
      lesson = { text: t(pick(s, 2, ['Le présage disait vrai. Il dit toujours vrai.', `${cr.name} reviendra. Préparez-vous mieux que nous.`])), legacy: { label: '', gain: { armee: 3, vivres: 2 } } };
    } else {
      lesson = { text: t('Gardez des réserves. De tout.'), legacy: { label: '', gain: { vivres: 3, tresor: 2 } } };
    }
  }
  lesson.legacy.label = bagLabel(lesson.legacy.gain!) + ' au départ';
  out.push(lesson);

  // 3. le mot de la fin, sur le dessein (avec des réserves pour le reprendre)
  const d = e.dessein(s);
  const nextJ = s.jalons.indexOf(false);
  const res = DESSEIN_RES[d.id] ?? 'tresor';
  const lines: string[] = [];
  if (s.result?.type === 'victoire') lines.push('Recommencez. Mais cette fois, prenez des notes.', 'C’était bien. Faites mieux.');
  else if (nextJ >= 0 && nextJ < 5) lines.push(`Finissez ${e.jalonOf(s, nextJ).name.replace(/^L[ae’] ?/, (m) => m.toLowerCase())}. Nous avions les plans.`);
  if (s.mem.includes('brume_ia') || s.deck.includes('d_ia')) lines.push('Ne touchez pas au bouton rouge. Quel que soit le bouton.');
  lines.push('Nous étions trop beaux pour durer.', `C’était la faute de {F:troc}. Vérifiez.`, 'Rien. Absolument rien. Bonne chance.');
  // une seule ressource, mais plus : jamais moins bien que la leçon (4 + 2)
  const gain: Bag = { [res]: 7 };
  out.push({ text: t(pick(s, 3, lines)), legacy: { label: `${bagLabel(gain)} au départ`, gain } });
  return out;
}

// ============================================================================ épitaphe et chronique

const DESSEIN_SHORT: Record<string, string> = { etoiles: 'les étoiles', empire: 'la vallée', posterite: 'l’éternité' };
/** « de » contracté : des étoiles, de la vallée, de l’éternité */
const de = (d: string) => (d.startsWith('les ') ? `des ${d.slice(4)}` : `de ${d}`);

/** Une phrase pour la stèle. */
export function epitaph(e: Engine, s: GameState): string {
  const d = DESSEIN_SHORT[s.dessein] ?? 'tout';
  const n = s.jalons.filter(Boolean).length;
  if (s.result?.type === 'victoire' && !s.result.ending) {
    if (n >= 3) return pick(s, 4, [`Si près ${de(d)}. Il manquait une merveille, et un peu de temps.`, `${n} merveilles, et ${d} à portée de main.`]);
    return pick(s, 4, ['Elle a traversé dix mille ans sans rien bâtir de mémorable. Une performance.', `Elle voulait ${d}. Elle a eu la vie sauve, ce qui n’est pas rien.`]);
  }
  if (s.result?.type === 'victoire') {
    return pick(s, 4, {
      etoiles: ['Elle a touché les étoiles. Les étoiles n’ont rien dit.', 'Partie pour les étoiles. A oublié d’éteindre.'],
      empire: ['Elle a soumis la vallée, qui ne l’a jamais aimée.', 'Elle a tout conquis. Puis elle s’est ennuyée.'],
      posterite: ['Chantée pour toujours, généralement faux.', 'Inoubliable. Personne n’a essayé.'],
    }[s.dessein] ?? ['A gagné.']);
  }
  const cause = s.result?.cause ?? 'l’usure';
  if (s.era === 0) return pick(s, 4, [`Rêvait ${de(d)}. N’a pas passé l’âge de pierre.`, `Elle voulait ${d}. Elle a eu ${cause}, très tôt.`]);
  if (n >= 3) return pick(s, 4, [`${n} merveilles debout, puis ${cause}.`, `Si près ${de(d)}. Puis ${cause}.`]);
  return pick(s, 4, [`Voulait ${d}, eut ${cause}.`, `Visait ${d}. ${capitalize(cause)} l’a visée d’abord.`]);
}

/** La décision qui a le plus pesé : celle qui a le plus remué les familles. */
function turningPoint(e: Engine, s: GameState): number {
  let best = -1;
  let top = 0;
  s.history.forEach((h, i) => {
    const k = e.card(h.card).kind;
    // les décisions de fond, pas les rouages (procès, hommages, chantiers…)
    if (['carrefour', 'presage', 'croissance', 'decouverte', 'jalon', 'proces', 'hommage', 'trahison', 'ruines', 'revenant', 'crise'].includes(k)) return;
    if (h.alts !== undefined && h.alts < 2) return;
    const w = Object.values(h.loy ?? {}).reduce((a, v) => a + Math.abs(v ?? 0), 0) + (h.quartiers ? Math.abs(h.quartiers) * 2 : 0);
    if (w > top) {
      top = w;
      best = i;
    }
  });
  return best;
}

/** Cinq lignes : de quoi raconter la partie à quelqu'un qui ne l'a pas jouée. */
export function chronicleLines(e: Engine, s: GameState, testament?: string): string[] {
  const origin = e.c.origins.find((o) => o.id === s.origin);
  const from = s.history[0]?.date ?? eraDate(0, 0);
  const to = s.history[s.history.length - 1]?.date ?? from;
  const d = e.dessein(s);
  const built = s.jalons.map((b, i) => (b ? e.jalonOf(s, i).name : '')).filter(Boolean);
  const lines: string[] = [];
  lines.push(`${s.name}, ${origin ? origin.name.replace(/^Les /, 'les ') : 'peuple sans origine'}. De l’${from} à l’${to}.`);
  lines.push(built.length ? `Voulait ${d.name.toLowerCase()}. A bâti ${listFr(built.map((x) => x.replace(/^L[ae’] ?/, (m) => m.toLowerCase())))}.` : `Voulait ${d.name.toLowerCase()}. N’a rien bâti.`);
  const tp = turningPoint(e, s);
  if (tp >= 0) {
    const h = s.history[tp];
    lines.push(`Le jour décisif, ${h.date} : « ${h.label} » (${fill(h.title, s, e.c)}).`);
  } else lines.push('Rien de décisif. C’était peut-être ça, le problème.');
  const present = FAMILIES.filter((f) => s.fam[f].state !== 'eteinte');
  const ally = present.slice().sort((a, b) => s.fam[b].loy - s.fam[a].loy)[0];
  const enemy = present.slice().sort((a, b) => s.fam[a].loy - s.fam[b].loy)[0];
  const H = (f: FamilyId) => capitalize(e.c.families[f].house[s.era]);
  const gone = FAMILIES.filter((f) => s.fam[f].state === 'eteinte');
  if (ally && s.fam[ally].loy >= 1 && enemy && s.fam[enemy].loy <= -1) lines.push(`${H(ally)} l’ont aimée jusqu’au bout. ${H(enemy)}, jamais.`);
  else if (ally && s.fam[ally].loy >= 1) lines.push(`${H(ally)} l’ont aimée jusqu’au bout.`);
  else if (enemy && s.fam[enemy].loy <= -1) lines.push(`${H(enemy)} ne lui ont jamais pardonné.`);
  else lines.push('Aucune famille ne l’a vraiment aimée. Ni haïe. C’est pire.');
  if (gone.length) lines[lines.length - 1] += ` ${capitalize(listFr(gone.map((f) => e.c.families[f].house[s.era])))} sont partis chez ${e.rival(s).name}.`;
  const rn = e.rival(s).name;
  const shadow = s.rivalJalons >= 5 && !s.result?.ending ? `, dans l’ombre ${rn.startsWith('les ') ? `des ${rn.slice(4)}` : `de ${rn}`}` : '';
  const rk = s.result?.rank;
  const end = s.result?.type === 'victoire' ? `${rk === 'triomphe' ? 'Triomphe, dessein accompli' : rk === 'victoire' ? 'Victoire, quatre merveilles debout' : 'A survécu'}${rk === 'survie' ? shadow : ''}, ${to}. ${epitaph(e, s)}` : `Tombée par ${s.result?.cause ?? 'l’usure'}, ${to}.`;
  lines.push(testament ? `${end} Derniers mots : « ${testament} »` : end);
  return lines.map((l) => polish(l.replace(/\s{2,}/g, ' ')));
}

function listFr(xs: string[]): string {
  if (xs.length <= 1) return xs.join('');
  return `${xs.slice(0, -1).join(', ')} et ${xs[xs.length - 1]}`;
}

// ============================================================================ enregistrement

export interface RunRecord {
  meta: MetaState;
  entry: ChronicleEntry;
  /** déblocages obtenus par cette partie */
  unlocked: Unlock[];
  /** faits nouveaux */
  feats: string[];
}

/** Inscrit une partie terminée dans la chronique et calcule ce qu'elle débloque. */
export function recordRun(meta: MetaState, e: Engine, s: GameState, testament?: Testament): RunRecord {
  const ep = epitaph(e, s);
  const ruin = e.ruinOf(s, ep, testament?.text);
  const from = s.history[0]?.date ?? eraDate(0, 0);
  const to = s.history[s.history.length - 1]?.date ?? from;
  const entry: ChronicleEntry = {
    ...ruin,
    legacy: testament?.legacy,
    seed: s.seed,
    origin: s.origin,
    rival: s.rival,
    from,
    to,
    result: s.result?.type ?? 'defaite',
    ending: s.result?.ending,
    lines: chronicleLines(e, s, testament?.text),
    turns: s.turn,
    iron: s.iron || undefined,
  };
  const fresh = featsOf(e, s).filter((f) => !meta.feats.includes(f));
  const next: MetaState = {
    version: META_VERSION,
    runs: meta.runs + 1,
    chronicle: [entry, ...meta.chronicle].slice(0, CHRONICLE_MAX),
    unlocked: [...meta.unlocked],
    feats: [...meta.feats, ...fresh],
    // ce que les deux dernières parties ont montré : la suivante l'écarte autant que possible
    lastSeen: [...new Set([...s.history.map((h) => h.card).filter((id) => ['evenement', 'rencontre', 'rivale', 'famille', 'crise', 'trahison'].includes(e.c.cards[id]?.kind ?? '')), ...(meta.lastSeen ?? [])])].slice(0, 90),
  };
  const unlocked = UNLOCKS.filter((u) => !next.unlocked.includes(u.id) && u.test(next));
  next.unlocked.push(...unlocked.map((u) => u.id));
  return { meta: next, entry, unlocked, feats: fresh };
}

/** Ce que la méta apporte à la partie suivante. */
export function nextSetup(meta: MetaState, choice: { dessein: string; origin?: string; iron?: boolean }): Setup {
  const origin = choice.origin && (choice.origin === 'feu' || meta.unlocked.includes(choice.origin)) ? choice.origin : 'feu';
  return {
    dessein: choice.dessein,
    origin,
    tutorial: meta.runs === 0,
    ruins: meta.chronicle.slice(0, 3),
    unlocked: meta.unlocked,
    iron: !!choice.iron && meta.unlocked.includes('fer'),
    avoid: meta.lastSeen ?? [],
  };
}
