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
import { originCards } from './origins';

const all = [
  ...engineCards, ...ourkCards, ...selCards, ...brumeCards, ...trocCards,
  ...encounterCards, ...crisisCards, ...discoveryCards, ...eventCards, ...rivalCards,
  ...moreEvents, ...moreEncounters, ...moreRival, ...echoFamilyCards, ...echoEvents, ...crisisAltCards, ...familyAltCards, ...variantCards, ...betrayalCards, ...moreEventCards, ...originCards,
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

// une option payante (sans suite cachée) ne rapporte jamais moins que la meilleure option gratuite de la carte :
// payer doit être un investissement, pas un piège (tour 3 des juges)
{
  const total = (b?: Partial<Record<string, number>>) => Object.values(b ?? {}).reduce((a: number, x) => a + Math.max(0, x ?? 0), 0);
  const loss = (b?: Partial<Record<string, number>>) => Object.values(b ?? {}).reduce((a: number, x) => a + Math.max(0, -(x ?? 0)), 0);
  for (const c of all) {
    if (!['famille', 'rencontre', 'evenement', 'rivale', 'intrigue', 'decouverte'].includes(c.kind)) continue;
    const plain = (o: (typeof c.options)[number]) => !(o.effect.mem?.length || o.effect.sched?.length || o.effect.if || o.effect.bet || o.effect.jalon || o.effect.rivalJalon || o.effect.famState || o.req);
    const free = c.options.filter((o) => !o.cost && (o.effect.quartiers ?? 0) >= 0);
    if (!free.length) continue;
    const value = (o: (typeof c.options)[number]) => total(o.effect.gain) - loss(o.effect.gain) - total(o.cost);
    const bigger = (b: Partial<Record<string, number>>, d: number) => {
      const g = { ...b };
      const key = (Object.keys(g) as (keyof typeof g)[]).filter((k) => (g[k] ?? 0) > 0).sort((x, y) => (g[y] ?? 0) - (g[x] ?? 0))[0];
      if (!key) return g;
      g[key] = Math.max(1, (g[key] ?? 0) + d);
      return g;
    };
    for (const o of c.options) {
      if (!o.cost || !plain(o)) continue;
      const best = Math.max(...free.map(value));
      const gap = best + 1 - value(o);
      if (gap <= 0) continue;
      // l'écart se partage : l'option payante rapporte un peu plus, la gratuite un peu moins
      const up = Math.ceil(gap / 2);
      const g = { ...(o.effect.gain ?? {}) };
      if (!Object.values(g).some((x) => (x ?? 0) > 0)) g[Object.keys(o.cost)[0] === 'tresor' ? 'savoir' : 'tresor'] = 0;
      o.effect = { ...o.effect, gain: bigger(Object.keys(g).length ? g : { tresor: 0 }, up) };
      for (const f of free) if (value(f) >= value(o)) f.effect = { ...f.effect, gain: bigger(f.effect.gain ?? {}, -(value(f) - value(o) + 1)) };
      // une option gratuite qui n'a rien à rendre : c'est la payante qui monte
      const rest = Math.max(...free.map(value)) + 1 - value(o);
      if (rest > 0) o.effect = { ...o.effect, gain: bigger(o.effect.gain ?? {}, rest) };
    }
  }
}

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

const events = [...eventCards, ...moreEvents, ...echoEvents, ...moreEventCards, ...originCards];

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
