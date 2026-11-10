import type { CardDef, CardKind, CardOption, Delta, Effect, Keyword, ArtSpec } from '../core/types';

/** Delta compact : D(nourriture, armée, savoir, trésor). */
export function D(food = 0, army = 0, knowledge = 0, treasure = 0): Delta {
  const d: Delta = {};
  if (food) d.food = food;
  if (army) d.army = army;
  if (knowledge) d.knowledge = knowledge;
  if (treasure) d.treasure = treasure;
  return d;
}

export function opt(text: string, effect: Effect | Delta, reply?: string): CardOption {
  const isDelta = !('delta' in effect) && !('when' in effect) && !('add' in effect) && !('scale' in effect) && !('flags' in effect) && !('rival' in effect) && !('wonder' in effect) && !('remove' in effect);
  const eff: Effect = isDelta ? { delta: effect as Delta } : (effect as Effect);
  return reply ? { text, effect: eff, reply } : { text, effect: eff };
}

export interface CardSpec {
  id: string;
  title: string;
  text: string;
  kind: CardKind;
  kw?: Keyword[];
  era?: number;
  left: CardOption;
  right: CardOption;
  oneShot?: boolean;
  requires?: CardDef['requires'];
  art?: ArtSpec;
  tutorial?: string;
  locked?: boolean;
  variants?: CardDef['variants'];
}

export function card(s: CardSpec): CardDef {
  const def: CardDef = {
    id: s.id,
    title: s.title,
    text: s.text,
    kind: s.kind,
    left: s.left,
    right: s.right,
  };
  if (s.kw) def.keywords = s.kw;
  if (s.era !== undefined) def.era = s.era;
  if (s.oneShot) def.oneShot = true;
  if (s.requires) def.requires = s.requires;
  if (s.art) def.art = s.art;
  if (s.tutorial) def.tutorial = s.tutorial;
  if (s.locked) def.locked = true;
  if (s.variants) def.variants = s.variants;
  return def;
}

export function toRecord(list: CardDef[]): Record<string, CardDef> {
  const out: Record<string, CardDef> = {};
  for (const c of list) {
    if (out[c.id]) throw new Error(`Carte en double : ${c.id}`);
    out[c.id] = c;
  }
  return out;
}
