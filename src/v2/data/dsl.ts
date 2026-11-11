import type { Bag, CardDef } from '../core/types';

/** Ressources compactes : $('V2 A-3 S1 T4') → { vivres: 2, armee: -3, savoir: 1, tresor: 4 }. */
export function $(spec: string): Bag {
  const out: Bag = {};
  const map = { V: 'vivres', A: 'armee', S: 'savoir', T: 'tresor' } as const;
  for (const part of spec.trim().split(/\s+/)) {
    if (!part) continue;
    const k = map[part[0] as keyof typeof map];
    if (!k) throw new Error(`ressource inconnue dans « ${spec} »`);
    out[k] = Number(part.slice(1));
  }
  return out;
}

export function card(def: CardDef): CardDef {
  return def;
}

export function record(list: CardDef[]): Record<string, CardDef> {
  const out: Record<string, CardDef> = {};
  for (const c of list) {
    if (out[c.id]) throw new Error(`Carte en double : ${c.id}`);
    out[c.id] = c;
  }
  return out;
}
