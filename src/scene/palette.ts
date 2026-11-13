/** Palettes et paramètres de lumière par ère. Tout est interpolable pour les transitions. */

export type RGB = [number, number, number];

export interface EraLook {
  skyTop: RGB;
  skyMid: RGB;
  skyLow: RGB;
  /** couleur de la source de lumière */
  light: RGB;
  /** couleur secondaire (vitrail, néon) */
  accent: RGB;
  /** silhouettes, du plus loin au plus proche */
  far: RGB;
  mid: RGB;
  near: RGB;
  ground: RGB;
  window: RGB;
  gold: RGB;
  crop: RGB;
  fog: RGB;
  /** position de la source (fraction de l'écran, y mesuré depuis l'horizon vers le haut en fraction de hauteur) */
  lightX: number;
  lightY: number;
  /** 1 = la source est au sol (feu de camp), 0 = dans le ciel */
  lightOnGround: number;
  /** rayon du halo en fraction de la plus grande dimension */
  halo: number;
  /** disque visible (soleil/lune) : rayon en unités de scène, 0 = pas de disque */
  disc: number;
  rays: number;
  stars: number;
  fogAmount: number;
  smoke: number;
  /** accent CSS de l'interface */
  ui: RGB;
}

const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const LOOKS: EraLook[] = [
  // 0 — Âge de pierre : feu de camp et braises
  {
    skyTop: hex('#04050d'), skyMid: hex('#0b0d22'), skyLow: hex('#3a1a12'),
    light: hex('#ff8a3a'), accent: hex('#ffd9a0'),
    far: hex('#15122a'), mid: hex('#0d0a16'), near: hex('#07060c'), ground: hex('#0a0709'),
    window: hex('#ffad5c'), gold: hex('#ffcf7a'), crop: hex('#b8843a'), fog: hex('#ff7a30'),
    lightX: 0.5, lightY: 0.012, lightOnGround: 1, halo: 0.42, disc: 0, rays: 0.25, stars: 1, fogAmount: 0.5, smoke: 0.25,
    ui: hex('#ffb873'),
  },
  // 1 — Antiquité : soleil doré et poussière
  {
    skyTop: hex('#16203c'), skyMid: hex('#6b4a52'), skyLow: hex('#f2b060'),
    light: hex('#ffd98a'), accent: hex('#fff1c8'),
    far: hex('#8a5a4a'), mid: hex('#3a2218'), near: hex('#1a0f0a'), ground: hex('#160d08'),
    window: hex('#ffe2a6'), gold: hex('#ffe08a'), crop: hex('#e8b850'), fog: hex('#ffc470'),
    lightX: 0.73, lightY: 0.17, lightOnGround: 0, halo: 0.6, disc: 2.6, rays: 1, stars: 0, fogAmount: 0.75, smoke: 0.05,
    ui: hex('#ffd98a'),
  },
  // 2 — Moyen Âge : bougie et vitrail
  {
    skyTop: hex('#04050f'), skyMid: hex('#151038'), skyLow: hex('#3a2358'),
    light: hex('#ffc878'), accent: hex('#d0509a'),
    far: hex('#1f1840'), mid: hex('#100b22'), near: hex('#08060f'), ground: hex('#09070f'),
    window: hex('#ffc070'), gold: hex('#f0c060'), crop: hex('#7f8a4a'), fog: hex('#7a4ab0'),
    lightX: 0.24, lightY: 0.42, lightOnGround: 0, halo: 0.34, disc: 1.5, rays: 0.4, stars: 0.8, fogAmount: 0.55, smoke: 0.15,
    ui: hex('#e8b8ff'),
  },
  // 3 — Ère industrielle : lueur de gaz et fumée
  {
    skyTop: hex('#0c0e0d'), skyMid: hex('#3a3320'), skyLow: hex('#b08a2e'),
    light: hex('#e6ee7a'), accent: hex('#ff9a40'),
    far: hex('#3a3828'), mid: hex('#161610'), near: hex('#0a0a08'), ground: hex('#0b0a08'),
    window: hex('#f0e078'), gold: hex('#e8c860'), crop: hex('#8a8448'), fog: hex('#b8b050'),
    lightX: 0.7, lightY: 0.24, lightOnGround: 0, halo: 0.55, disc: 2.3, rays: 0.5, stars: 0, fogAmount: 1, smoke: 1,
    ui: hex('#e6ee7a'),
  },
  // 4 — Ère spatiale : froid bleuté et néons
  {
    skyTop: hex('#01020a'), skyMid: hex('#051233'), skyLow: hex('#0c4466'),
    light: hex('#8ae6ff'), accent: hex('#ff4fd0'),
    far: hex('#0a2a48'), mid: hex('#06101f'), near: hex('#03070f'), ground: hex('#04070d'),
    window: hex('#a8ecff'), gold: hex('#ffe9a8'), crop: hex('#4ad0a0'), fog: hex('#2aa0d8'),
    lightX: 0.3, lightY: 0.5, lightOnGround: 0, halo: 0.5, disc: 3.4, rays: 0.5, stars: 1.2, fogAmount: 0.6, smoke: 0.1,
    ui: hex('#8ae6ff'),
  },
];

/** L'origine teinte la première ère : le feu de camp, le fleuve qui déborde, les ruines au crépuscule. */
export const BACKDROP_LOOKS: Record<'feu' | 'fleuve' | 'ruines', EraLook> = {
  feu: { ...LOOKS[0], skyLow: hex('#52200e'), halo: 0.56, fogAmount: 0.62, smoke: 0.38, rays: 0.4 },
  fleuve: {
    ...LOOKS[0], skyMid: hex('#0a1626'), skyLow: hex('#1e4250'), fog: hex('#5aa6b8'), far: hex('#10222e'),
    crop: hex('#7fa45a'), light: hex('#ffb066'), halo: 0.36, fogAmount: 0.6,
  },
  ruines: {
    ...LOOKS[0], skyMid: hex('#140c26'), skyLow: hex('#3e1a40'), fog: hex('#a874c8'), far: hex('#1e1534'),
    accent: hex('#e0c0ff'), light: hex('#ff9a66'), halo: 0.34, fogAmount: 0.55,
  },
};

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function rgb(c: RGB, a = 1): string {
  return a >= 1
    ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`
    : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, a).toFixed(3)})`;
}

export function mixLook(a: EraLook, b: EraLook, t: number): EraLook {
  const out = {} as Record<string, unknown>;
  for (const k of Object.keys(a) as (keyof EraLook)[]) {
    const va = a[k];
    const vb = b[k];
    out[k] = Array.isArray(va) ? mix(va as RGB, vb as RGB, t) : lerp(va as number, vb as number, t);
  }
  return out as unknown as EraLook;
}

// ------------------------------------------------------------------ easing

export const ease = {
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inCubic: (t: number) => t * t * t,
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
};

export function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
