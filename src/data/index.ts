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
import { echoEvents, echoFamilyCards, echoRecalls } from './echoes';

const all = [
  ...engineCards, ...ourkCards, ...selCards, ...brumeCards, ...trocCards,
  ...encounterCards, ...crisisCards, ...discoveryCards, ...eventCards, ...rivalCards,
  ...moreEvents, ...moreEncounters, ...moreRival, ...echoFamilyCards, ...echoEvents,
];

// les suites liées à un souvenir sont toujours tirées
for (const id of ['ev_fete_ours', 'ev_amants', 'ev_heritier', 'ev_general_eveque', 'ev_martyr', 'ev_cirque']) {
  const c = all.find((x) => x.id === id);
  if (c) c.echo = true;
}

const events = [...eventCards, ...moreEvents, ...echoEvents];

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
  recalls: [...recalls, ...echoRecalls],
};

export const CARD_COUNT = all.filter((c) => !['presage', 'carrefour', 'jalon', 'decouverte', 'croissance', 'proces'].includes(c.kind)).length;
