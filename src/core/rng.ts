/** Seeded PRNG (sfc32) : rapide, déterministe, sérialisable. */
export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: number) {
    // Hash the seed (splitmix-like) into four 32-bit words.
    let s = seed >>> 0;
    const next = () => {
      s = (s + 0x9e3779b9) >>> 0;
      let z = s;
      z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
      z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
      return (z ^ (z >>> 16)) >>> 0;
    };
    this.a = next();
    this.b = next();
    this.c = next();
    this.d = next();
    for (let i = 0; i < 12; i++) this.next();
  }

  /** Entier 32 bits non signé. */
  nextU32(): number {
    const t = (((this.a + this.b) >>> 0) + this.d) >>> 0;
    this.d = (this.d + 1) >>> 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) >>> 0;
    this.c = ((this.c << 21) | (this.c >>> 11)) >>> 0;
    this.c = (this.c + t) >>> 0;
    return t;
  }

  /** Flottant dans [0, 1). */
  next(): number {
    return this.nextU32() / 4294967296;
  }

  /** Entier dans [min, max] inclus. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Flottant dans [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Choisit n éléments distincts. */
  sample<T>(arr: readonly T[], n: number): T[] {
    const copy = arr.slice();
    this.shuffle(copy);
    return copy.slice(0, n);
  }

  getState(): [number, number, number, number] {
    return [this.a, this.b, this.c, this.d];
  }

  setState(s: [number, number, number, number]): void {
    [this.a, this.b, this.c, this.d] = s;
  }

  static fromState(s: [number, number, number, number]): Rng {
    const r = new Rng(0);
    r.setState(s);
    return r;
  }
}

/** Hash d'une chaîne vers un entier 32 bits (pour les graines et les illustrations). */
export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Graine lisible (6 caractères) pour l'affichage. */
export function seedToCode(seed: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = seed >>> 0;
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[s % 32];
    s = Math.floor(s / 32);
  }
  return out;
}

export function codeToSeed(code: string): number | null {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const clean = code.toUpperCase().replace(/[^A-Z2-9]/g, '');
  if (clean.length !== 6) return null;
  let s = 0;
  for (let i = clean.length - 1; i >= 0; i--) {
    const v = alphabet.indexOf(clean[i]);
    if (v < 0) return null;
    s = s * 32 + v;
  }
  return s >>> 0;
}
