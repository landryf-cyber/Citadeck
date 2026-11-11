import type { CardDef, CrisisDef, DesseinDef, FamilyDef, FamilyId, OriginDef, RivalDef, RouteDef } from './types';

/** Tout le contenu du jeu, assemblé dans src/v2/data. */
export interface Content {
  cards: Record<string, CardDef>;
  families: Record<FamilyId, FamilyDef>;
  /** carte de chaque famille pour chaque ère : la première dont la condition passe est tirée */
  familyCards: Record<FamilyId, string[][]>;
  /** carte de trahison de chaque famille (jouée pendant une crise si elle vous hait) */
  betrayal: Record<FamilyId, string>;
  /** qui méprise qui */
  rivalries: Record<FamilyId, FamilyId>;
  desseins: DesseinDef[];
  origins: OriginDef[];
  routes: RouteDef[];
  crises: CrisisDef[];
  /** événements par ère */
  events: string[][];
  rivalCards: { hostile: string[]; neutral: string[]; friendly: string[] };
  discoveries: string[];
  rivals: RivalDef[];
  tutorial: string[];
  ruinsCard: string;
  revenantCard: string;
}

export function validateContent(c: Content): string[] {
  const errors: string[] = [];
  const has = (id: string, where: string) => {
    if (!c.cards[id]) errors.push(`${where} : carte inconnue « ${id} »`);
  };
  for (const [f, eras] of Object.entries(c.familyCards)) eras.forEach((ids, e) => ids.forEach((id) => has(id, `famille ${f} ère ${e}`)));
  for (const id of Object.values(c.betrayal)) has(id, 'trahison');
  for (const cr of c.crises) cr.cards.forEach((id) => has(id, `crise ${cr.name}`));
  c.events.forEach((ids, e) => ids.forEach((id) => has(id, `événements ère ${e}`)));
  for (const k of ['hostile', 'neutral', 'friendly'] as const) c.rivalCards[k].forEach((id) => has(id, `rivale ${k}`));
  c.discoveries.forEach((id) => has(id, 'découvertes'));
  c.routes.forEach((r) => r.encounters.forEach((id) => has(id, `route ${r.id}`)));
  c.tutorial.forEach((id) => has(id, 'tutoriel'));
  has(c.ruinsCard, 'ruines');
  has(c.revenantCard, 'revenants');
  const walk = (card: CardDef, e: CardDef['options'][number]['effect'] | undefined) => {
    if (!e) return;
    for (const sc of e.sched ?? []) has(sc.card, `${card.id} (suite)`);
    for (const id of e.addCard ?? []) has(id, `${card.id} (ajout)`);
    walk(card, e.then);
    walk(card, e.else);
    if (e.bet) {
      walk(card, e.bet.win);
      walk(card, e.bet.lose);
    }
  };
  for (const card of Object.values(c.cards)) {
    for (const o of card.options) {
      walk(card, o.effect);
      if (!o.label.includes('{?') && o.label.length > 34) errors.push(`${card.id} : option trop longue « ${o.label} »`);
    }
    if (card.text.length > 260) errors.push(`${card.id} : texte trop long (${card.text.length})`);
    const dynamic = ['carrefour', 'jalon', 'decouverte', 'croissance', 'proces'].includes(card.kind);
    if (!card.qui && !dynamic && card.options.length < 1) errors.push(`${card.id} : aucune option`);
  }
  return errors;
}
