import type { Content } from '../core/content';
import { record } from './dsl';
import { ourkCards } from './ourk';
import { selCards } from './sel';
import { brumeCards } from './brume';
import { trocCards } from './troc';
import { encounterCards } from './encounters';
import { crises, crisisCards } from './crises';
import { discoveryCards } from './discoveries';
import { eventCards, rivalCards } from './events';
import { desseins, engineCards, families, origins, rivalries, rivals, routes } from './world';
import { moods, recalls } from './moods';
import { moreEncounters, moreEvents, moreRival } from './more';
import { echoEvents, echoFamilyCards, echoRecalls, memoryOptions } from './echoes';
import { crisisAltCards, crisisAlts } from './crises2';
import { familyAltCards, familyAltRecalls } from './familyAlts';
import { variantCards, variantRecalls } from './variants';
import { betrayalCards } from './betrayals';
import { moreEventCards } from './events2';

const all = [
  ...engineCards, ...ourkCards, ...selCards, ...brumeCards, ...trocCards,
  ...encounterCards, ...crisisCards, ...discoveryCards, ...eventCards, ...rivalCards,
  ...moreEvents, ...moreEncounters, ...moreRival, ...echoFamilyCards, ...echoEvents, ...crisisAltCards, ...familyAltCards, ...variantCards, ...betrayalCards, ...moreEventCards,
];

// hors cartes de famille, de crise et d'échos, une décision ne déplace une loyauté que d'un cran :
// les grandes oscillations sont réservées aux actes marquants
const damp = (e: import('../core/types').Effect | undefined): void => {
  if (!e) return;
  if (e.loy) for (const f of Object.keys(e.loy) as (keyof typeof e.loy)[]) e.loy[f] = Math.max(-1, Math.min(1, e.loy[f] ?? 0));
  damp(e.then);
  damp(e.else);
  if (e.bet) {
    damp(e.bet.win);
    damp(e.bet.lose);
  }
};
for (const c of all) if (['rencontre', 'evenement', 'rivale'].includes(c.kind) && !c.echo) for (const o of c.options) damp(o.effect);

// des options qui n'existent que par un souvenir
for (const [id, opts] of Object.entries(memoryOptions)) {
  const c = all.find((x) => x.id === id);
  if (c) c.options = [...c.options, ...opts];
}

// une famille qui a trahi s'en souvient (les trahisons suivantes ont leurs propres cartes, voir betrayals.ts)
for (const f of ['ourk', 'sel', 'brume', 'troc'] as const) {
  for (const c of all.filter((x) => x.kind === 'trahison' && x.family === f)) for (const o of c.options) o.effect = { ...o.effect, mem: [...(o.effect.mem ?? []), `trahi_${f}`] };
}

// les suites liées à un souvenir sont toujours tirées
for (const id of ['ev_fete_ours', 'ev_amants', 'ev_heritier', 'ev_general_eveque', 'ev_martyr', 'ev_cirque']) {
  const c = all.find((x) => x.id === id);
  if (c) c.echo = true;
}

const events = [...eventCards, ...moreEvents, ...echoEvents, ...moreEventCards];

/** les rencontres supplémentaires rejoignent leur route */
const extraEnc: Record<string, string[]> = {
  camp_ourk: ['r_ourk_veteran', 'r_ourk_bete'], grotte_sel: ['r_sel_pelerinage', 'r_sel_saint'], rocher_brume: ['r_brume_automate', 'r_brume_fin'],
  comptoir_troc: ['r_troc_loterie', 'r_troc_monopole'], frontiere: ['r_front_refugies', 'r_front_pont'], inconnu: ['r_inc_grotte', 'r_inc_jumeau'],
};

const famEra = (prefix: string) =>
  [0, 1, 2, 3, 4].map((e) => all.filter((c) => c.kind === 'famille' && c.id.startsWith(prefix) && c.eras?.includes(e))
    // les variantes conditionnelles passent avant la carte par défaut
    .sort((a, b) => (b.cond ? 1 : 0) - (a.cond ? 1 : 0)).map((c) => c.id));

export const content: Content = {
  cards: record(all),
  families,
  familyCards: { ourk: famEra('ourk_'), sel: famEra('sel_'), brume: famEra('brume_'), troc: famEra('troc_') },
  betrayal: { ourk: 'trahison_ourk', sel: 'trahison_sel', brume: 'trahison_brume', troc: 'trahison_troc' },
  rivalries,
  desseins,
  origins,
  routes: routes.map((r) => ({ ...r, encounters: [...r.encounters, ...(extraEnc[r.id] ?? [])] })),
  crises,
  crisisAlts,
  events: [0, 1, 2, 3, 4].map((e) => events.filter((c) => c.kind === 'evenement' && c.eras?.includes(e)).map((c) => c.id)),
  rivalCards: {
    hostile: ['v_raid', 'v_ultimatum', 'v_espion', 'v_lettre', 'v_portrait'],
    neutral: ['v_lettre', 'v_frontiere', 'v_mariage', 'v_commerce', 'v_invitation', 'v_portrait'],
    friendly: ['v_alliance', 'v_savants', 'v_commerce', 'v_mariage', 'v_cadeau', 'v_invitation'],
  },
  discoveries: discoveryCards.map((c) => c.id),
  rivals,
  tutorial: [],
  ruinsCard: 'ruines',
  revenantCard: 'revenants',
  moods,
  recalls: [...recalls, ...echoRecalls, ...familyAltRecalls, ...variantRecalls],
};

export const CARD_COUNT = all.filter((c) => !['presage', 'carrefour', 'jalon', 'decouverte', 'croissance', 'proces'].includes(c.kind)).length;
