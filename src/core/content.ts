import type { CardDef, CrisisDef, EraDef, WonderDef } from './types';

/** Tout le contenu du jeu, assemblé depuis src/data. */
export interface Content {
  cards: Record<string, CardDef>;
  eras: EraDef[];
  /** cartes de départ (persistantes) */
  starters: string[];
  /** cartes de tutoriel, jouées en premier lors de la première partie */
  tutorial: string[];
  /** pool de cartes d'ère, par ère */
  eraPools: string[][];
  /** cartes proposées en récompense */
  rewards: string[];
  crises: CrisisDef[];
  wonders: WonderDef[];
  rival: {
    names: string[];
    hostile: string[];
    neutral: string[];
    friendly: string[];
  };
}

export function validateContent(c: Content): string[] {
  const errors: string[] = [];
  const has = (id: string) => id in c.cards;
  const checkList = (ids: string[], where: string) => {
    for (const id of ids) if (!has(id)) errors.push(`${where}: carte inconnue "${id}"`);
  };
  checkList(c.starters, 'starters');
  checkList(c.tutorial, 'tutorial');
  c.eraPools.forEach((p, i) => checkList(p, `eraPools[${i}]`));
  checkList(c.rewards, 'rewards');
  checkList(c.rival.hostile, 'rival.hostile');
  checkList(c.rival.neutral, 'rival.neutral');
  checkList(c.rival.friendly, 'rival.friendly');
  for (const cr of c.crises) {
    checkList(cr.cards, `crisis ${cr.id}`);
    if (cr.extra) checkList(cr.extra, `crisis ${cr.id} extra`);
  }
  const wonderIds = new Set(c.wonders.map((w) => w.id));
  for (const card of Object.values(c.cards)) {
    for (const opt of [card.left, card.right]) {
      const walk = (e: typeof opt.effect) => {
        for (const a of e.add ?? []) if (!has(a.card)) errors.push(`${card.id}: add inconnu "${a.card}"`);
        if (e.wonder && !wonderIds.has(e.wonder)) errors.push(`${card.id}: merveille inconnue "${e.wonder}"`);
        if (e.then) walk(e.then);
        if (e.else) walk(e.else);
      };
      walk(opt.effect);
      if (opt.text.length > 32) errors.push(`${card.id}: option trop longue "${opt.text}"`);
    }
    if (card.text.length > 120) errors.push(`${card.id}: texte trop long (${card.text.length})`);
  }
  return errors;
}
