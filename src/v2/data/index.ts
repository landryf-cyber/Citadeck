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

const all = [
  ...engineCards, ...ourkCards, ...selCards, ...brumeCards, ...trocCards,
  ...encounterCards, ...crisisCards, ...discoveryCards, ...eventCards, ...rivalCards,
];

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
  routes,
  crises,
  events: [0, 1, 2, 3, 4].map((e) => eventCards.filter((c) => c.kind === 'evenement' && c.eras?.includes(e)).map((c) => c.id)),
  rivalCards: {
    hostile: ['v_raid', 'v_ultimatum', 'v_espion', 'v_lettre'],
    neutral: ['v_lettre', 'v_frontiere', 'v_mariage', 'v_commerce'],
    friendly: ['v_alliance', 'v_savants', 'v_commerce', 'v_mariage'],
  },
  discoveries: discoveryCards.map((c) => c.id),
  rivals,
  tutorial: [],
  ruinsCard: 'ruines',
  revenantCard: 'revenants',
};

export const CARD_COUNT = all.filter((c) => !['presage', 'carrefour', 'jalon', 'decouverte', 'croissance', 'proces'].includes(c.kind)).length;
