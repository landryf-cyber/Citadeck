/**
 * Illustrations de cartes, dessinées par le code en SVG : de vraies scènes (un personnage, un événement, un lieu)
 * dans le langage de la cité : ciel sombre, aplats sombres, contours lumineux, un seul point focal sous un halo,
 * un seul accent chaud, et souvent un petit gag (la chèvre des colons n'est jamais loin).
 * Repère 300×130 (la bande illustrée de la carte), sol commun à y = 112. Aucun fichier externe.
 */
import { LOOKS, mix, type RGB } from '../scene/palette';
import { Rng, hashString } from '../core/rng';
import { portraitBody, type PortraitFam } from './portrait';
import { motif } from './art';

let uid = 0;
const f = (n: number) => n.toFixed(1);
const GROUND = 112;
/** épaisseurs : décor, sujet */
const W1 = 1.5;
const W2 = 2.2;

export interface IllusSpec {
  /** graine visuelle (carte + ère) */
  key: string;
  era: number;
  hue: number;
  /** la scène à dessiner (voir SCENES) */
  scene: string;
  /** une variante de la scène (motif, lieu, menace) */
  variant?: string;
  /** le personnage, pour un portrait */
  fam?: PortraitFam;
  mood?: number;
  alarm?: boolean;
  /** teinte de la rivale (bannières) */
  rivalHue?: number;
}

function hsl(h: number, s: number, l: number): RGB {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const c = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [c(0) * 255, c(8) * 255, c(4) * 255];
}
const col = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

interface Ctx {
  id: string;
  rng: Rng;
  era: number;
  h: number;
  st: string;
  dim: string;
  dark: string;
  mid: string;
  warm: string;
  sky: [RGB, RGB, RGB];
  far: RGB;
  light: RGB;
}

function ctxFor(sp: IllusSpec): Ctx {
  const look = LOOKS[Math.max(0, Math.min(4, sp.era))];
  const h = sp.alarm ? 8 : sp.hue;
  const tint = hsl(h, sp.alarm ? 70 : 55, sp.alarm ? 38 : 42);
  const k = sp.alarm ? 0.4 : 0.25;
  // un ciel toujours sombre : la grammaire commune des cartes
  const night: RGB = [8, 7, 14];
  const sky: [RGB, RGB, RGB] = [mix(mix(look.skyTop, tint, k * 0.6), night, 0.35), mix(mix(look.skyMid, tint, k), night, 0.45), mix(mix(look.skyLow, tint, k * 1.1), night, 0.4)];
  return {
    id: `il${uid++}`,
    rng: new Rng(hashString(sp.key)),
    era: Math.max(0, Math.min(4, sp.era)),
    h,
    st: `hsl(${h} 85% 82%)`,
    dim: `hsla(${h}, 70%, 80%, .5)`,
    dark: col(mix(look.near, hsl(h, 40, 8), 0.5)),
    mid: col(mix(look.mid, hsl(h, 45, 18), 0.45)),
    warm: 'rgba(255,190,110,.95)',
    sky,
    far: mix(mix(look.far, tint, k), night, 0.25),
    light: look.light,
  };
}

// ------------------------------------------------------------------------------ outils

const P = (d: string, fill: string, st: string, w = W1, extra = '') => `<path d="${d}" fill="${fill}" stroke="${st}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
const C = (x: number, y: number, r: number, fill: string, st = 'none', w = W1) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" stroke="${st}" stroke-width="${w}"/>`;

function base(c: Ctx, lx: number, ly: number): string {
  return `<linearGradient id="${c.id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col(c.sky[0])}"/><stop offset=".62" stop-color="${col(c.sky[1])}"/><stop offset="1" stop-color="${col(c.sky[2])}"/></linearGradient>
<radialGradient id="${c.id}l" cx="${f((lx / 300) * 100)}%" cy="${f((ly / 130) * 100)}%" r="45%"><stop offset="0" stop-color="${col(c.light, 0.4)}"/><stop offset=".5" stop-color="${col(c.light, 0.1)}"/><stop offset="1" stop-color="${col(c.light, 0)}"/></radialGradient>
<radialGradient id="${c.id}h" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="hsla(${c.h},95%,70%,.42)"/><stop offset=".55" stop-color="hsla(${c.h},95%,65%,.12)"/><stop offset="1" stop-color="hsla(${c.h},95%,60%,0)"/></radialGradient>
<linearGradient id="${c.id}f" x1="0" y1="0" x2="0" y2="1"><stop offset=".62" stop-color="rgba(13,11,18,0)"/><stop offset="1" stop-color="rgba(13,11,18,1)"/></linearGradient>
<filter id="${c.id}g" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
}

function frame(c: Ctx, lx: number, ly: number, body: string, defs = ''): string {
  // la bande de la carte est plus étirée que le repère : on cadre sur la zone utile (sol et têtes compris)
  return `<svg viewBox="0 16 300 102" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${base(c, lx, ly)}${defs}</defs><rect width="300" height="130" fill="url(#${c.id}s)"/><rect width="300" height="130" fill="url(#${c.id}l)"/>${body}<rect width="300" height="130" fill="url(#${c.id}f)"/></svg>`;
}

/** Le halo du point focal (la signature des anciennes cartes). */
const halo = (c: Ctx, x: number, y: number, r: number) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 1.2)}" ry="${f(r)}" fill="url(#${c.id}h)"/>`;
/** Le sujet : trait épais et lueur. */
const focus = (c: Ctx, g: string) => `<g filter="url(#${c.id}g)">${g}</g>`;

function stars(c: Ctx, n: number, yMax = 64): string {
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${f(c.rng.range(4, 296))}" cy="${f(c.rng.range(3, yMax))}" r="${f(c.rng.range(0.5, 1.3))}" fill="rgba(255,248,230,${(0.3 + c.rng.next() * 0.55).toFixed(2)})"/>`;
  return s;
}

function ridge(c: Ctx, y: number, amp: number, fill: string, rim = 0.3, step = 20): string {
  let d = `M-10 ${f(y)}`;
  let prev = y;
  for (let x = -10; x <= 310; x += step) {
    const ny = y - c.rng.range(0, amp);
    d += ` Q${f(x + step / 4)} ${f(prev)} ${f(x + step / 2)} ${f((prev + ny) / 2)} T${f(x + step)} ${f(ny)}`;
    prev = ny;
  }
  return `<path d="${d} L310 130 L-10 130 Z" fill="${fill}"/><path d="${d}" fill="none" stroke="${c.st}" stroke-opacity="${rim}" stroke-width="1"/>`;
}

const ground = (c: Ctx) => `<rect y="${GROUND}" width="300" height="${130 - GROUND}" fill="${c.dark}"/><path d="M0 ${GROUND} H300" stroke="${c.st}" stroke-opacity=".35" stroke-width="1"/>`;

/** La silhouette de la cité de l'ère, au loin (huttes, temples, tours, usines, tours de verre). */
function skyline(c: Ctx, y: number, x0 = -4, x1 = 304, s = 1): string {
  let g = '';
  let lights = '';
  let x = x0;
  while (x < x1) {
    const w = (10 + c.rng.int(0, 12)) * s;
    const hgt = (c.era === 4 ? 18 + c.rng.int(0, 22) : c.era === 3 ? 12 + c.rng.int(0, 10) : c.era === 2 ? 10 + c.rng.int(0, 14) : c.era === 1 ? 9 + c.rng.int(0, 8) : 6 + c.rng.int(0, 6)) * s;
    const top = y - hgt;
    if (c.era === 0) g += c.rng.chance(0.5) ? `M${f(x)} ${f(y)} L${f(x + w / 2)} ${f(top)} L${f(x + w)} ${f(y)} Z ` : `M${f(x)} ${f(y)} Q${f(x + w / 2)} ${f(top - 4)} ${f(x + w)} ${f(y)} Z `;
    else if (c.era === 1) g += `M${f(x)} ${f(y)} V${f(top)} H${f(x + w)} V${f(y)} Z ` + (c.rng.chance(0.5) ? `M${f(x - 2)} ${f(top)} L${f(x + w / 2)} ${f(top - 6 * s)} L${f(x + w + 2)} ${f(top)} Z ` : '');
    else if (c.era === 2) g += `M${f(x)} ${f(y)} V${f(top)} H${f(x + w)} V${f(y)} Z ` + (c.rng.chance(0.45) ? `M${f(x)} ${f(top)} L${f(x + w / 2)} ${f(top - 12 * s)} L${f(x + w)} ${f(top)} Z ` : '');
    else if (c.era === 3) g += `M${f(x)} ${f(y)} V${f(top)} l${f(w / 2)} ${f(-5 * s)} v${f(5 * s)} l${f(w / 2)} ${f(-5 * s)} V${f(y)} Z ` + (c.rng.chance(0.5) ? `M${f(x + w - 4)} ${f(top)} v${f(-14 * s)} h3 v${f(14 * s)} Z ` : '');
    else g += `M${f(x)} ${f(y)} V${f(top)} H${f(x + w)} V${f(y)} Z ` + (c.rng.chance(0.35) ? `M${f(x + w / 2 - 0.6)} ${f(top)} v${f(-9 * s)} h1.2 v${f(9 * s)} Z ` : '');
    if (c.era >= 1) for (let k = 0; k < 2; k++) if (c.rng.chance(0.5)) lights += `<rect x="${f(x + 2 + c.rng.range(0, Math.max(1, w - 4)))}" y="${f(top + 3 + c.rng.range(0, Math.max(1, hgt - 6)))}" width="1.8" height="1.8" fill="rgba(255,214,150,.7)"/>`;
    x += w + c.rng.int(0, 4) * s;
  }
  return `<path d="${g}" fill="${col(c.far, 0.95)}" stroke="${c.st}" stroke-opacity=".28" stroke-width="1"/>${lights}`;
}

/** Un personnage, en aplat sombre et grosse tête (proportions de dessin animé). */
function person(c: Ctx, x: number, y: number, s: number, o: { fam?: PortraitFam; arm?: 'up' | 'out' | 'down'; hold?: 'spear' | 'torch' | 'staff' | 'bucket' | 'scroll' | 'fork' | 'flag'; flip?: boolean } = {}): string {
  const k = o.flip ? -1 : 1;
  const hy = y - 27 * s;
  let g = P(`M${f(x - 7 * s)} ${f(y)} Q${f(x - 8 * s)} ${f(y - 14 * s)} ${f(x - 5.5 * s)} ${f(y - 20 * s)} Q${f(x)} ${f(y - 23 * s)} ${f(x + 5.5 * s)} ${f(y - 20 * s)} Q${f(x + 8 * s)} ${f(y - 14 * s)} ${f(x + 7 * s)} ${f(y)} Z`, c.dark, c.st, W1);
  // bras
  const hx = x + 6 * s * k;
  const hand = o.arm === 'up' ? [x + 10 * s * k, y - 33 * s] : o.arm === 'out' ? [x + 13 * s * k, y - 18 * s] : [x + 9 * s * k, y - 8 * s];
  g += P(`M${f(hx)} ${f(y - 18 * s)} L${f(hand[0])} ${f(hand[1])}`, 'none', c.st, W1 + 0.6);
  g += P(`M${f(x - 6 * s * k)} ${f(y - 18 * s)} L${f(x - 9 * s * k)} ${f(y - 8 * s)}`, 'none', c.st, W1 + 0.6);
  // tête
  g += C(x, hy, 7 * s, c.dark, c.st, W1);
  g += C(x + 2.2 * s * k, hy - 0.8 * s, 0.9 * s, c.st, 'none');
  // coiffes : la famille, ou à défaut la mode de l'ère (mèche, laurier, capuche, chapeau melon, casque)
  if (!o.fam) {
    if (c.era === 0) g += P(`M${f(x - 4 * s)} ${f(hy - 6 * s)} L${f(x - 1 * s)} ${f(hy - 10 * s)} L${f(x + 1 * s)} ${f(hy - 6.5 * s)} L${f(x + 4 * s)} ${f(hy - 9.5 * s)}`, 'none', c.st, W1);
    else if (c.era === 1) g += P(`M${f(x - 7 * s)} ${f(hy - 2 * s)} Q${f(x)} ${f(hy - 7 * s)} ${f(x + 7 * s)} ${f(hy - 2 * s)}`, 'none', 'rgba(170,220,120,.95)', W1 + 0.4);
    else if (c.era === 2) g += P(`M${f(x - 8 * s)} ${f(hy + 5 * s)} Q${f(x - 9 * s)} ${f(hy - 10 * s)} ${f(x + 2 * s)} ${f(hy - 11 * s)} L${f(x + 8 * s)} ${f(hy - 4 * s)}`, 'none', c.st, W1);
    else if (c.era === 3) g += P(`M${f(x - 9 * s)} ${f(hy - 4 * s)} H${f(x + 9 * s)} M${f(x - 5.5 * s)} ${f(hy - 4 * s)} Q${f(x - 5.5 * s)} ${f(hy - 11 * s)} ${f(x)} ${f(hy - 11 * s)} Q${f(x + 5.5 * s)} ${f(hy - 11 * s)} ${f(x + 5.5 * s)} ${f(hy - 4 * s)}`, c.dark, c.st, W1);
    else g += `<circle cx="${f(x)}" cy="${f(hy)}" r="${f(9 * s)}" fill="rgba(150,230,255,.1)" stroke="${c.st}" stroke-width="${W1}"/>` + P(`M${f(x - 5 * s)} ${f(hy - 1 * s)} H${f(x + 5 * s)}`, 'none', 'rgba(150,240,255,.95)', W1 + 0.6);
  }
  if (o.fam === 'ourk') g += P(`M${f(x - 5 * s)} ${f(hy - 4 * s)} Q${f(x - 11 * s)} ${f(hy - 8 * s)} ${f(x - 9 * s)} ${f(hy - 14 * s)} M${f(x + 5 * s)} ${f(hy - 4 * s)} Q${f(x + 11 * s)} ${f(hy - 8 * s)} ${f(x + 9 * s)} ${f(hy - 14 * s)}`, 'none', c.st, W1);
  if (o.fam === 'sel') g += P(`M${f(x - 8 * s)} ${f(hy + 6 * s)} Q${f(x - 9 * s)} ${f(hy - 9 * s)} ${f(x)} ${f(hy - 10 * s)} Q${f(x + 9 * s)} ${f(hy - 9 * s)} ${f(x + 8 * s)} ${f(hy + 6 * s)}`, 'none', c.st, W1);
  if (o.fam === 'brume') g += P(`M${f(x - 6.5 * s)} ${f(hy - 4 * s)} L${f(x)} ${f(hy - 19 * s)} L${f(x + 6.5 * s)} ${f(hy - 4 * s)} Z`, c.dark, c.st, W1);
  if (o.fam === 'troc') g += P(`M${f(x - 10 * s)} ${f(hy - 4 * s)} H${f(x + 10 * s)} M${f(x - 5 * s)} ${f(hy - 4 * s)} V${f(hy - 10 * s)} H${f(x + 5 * s)} V${f(hy - 4 * s)}`, c.dark, c.st, W1);
  // ce qu'il tient
  const [ax, ay] = hand;
  if (o.hold === 'spear') g += P(`M${f(ax)} ${f(ay + 14 * s)} L${f(ax)} ${f(ay - 16 * s)}`, 'none', c.st, W1) + P(`M${f(ax - 2.4 * s)} ${f(ay - 14 * s)} L${f(ax)} ${f(ay - 21 * s)} L${f(ax + 2.4 * s)} ${f(ay - 14 * s)} Z`, c.dark, c.st, W1 * 0.8);
  if (o.hold === 'torch') g += P(`M${f(ax)} ${f(ay + 4 * s)} L${f(ax)} ${f(ay - 6 * s)}`, 'none', c.st, W1) + flameAt(ax, ay - 8 * s, 0.5 * s);
  if (o.hold === 'staff') g += P(`M${f(ax)} ${f(y)} L${f(ax)} ${f(ay - 10 * s)}`, 'none', c.dim, W1) + C(ax, ay - 12 * s, 2.2 * s, c.warm);
  if (o.hold === 'bucket') g += P(`M${f(ax - 3 * s)} ${f(ay)} L${f(ax - 2.4 * s)} ${f(ay + 6 * s)} L${f(ax + 2.4 * s)} ${f(ay + 6 * s)} L${f(ax + 3 * s)} ${f(ay)} Z`, c.mid, c.st, W1 * 0.8);
  if (o.hold === 'scroll') g += P(`M${f(ax - 4 * s)} ${f(ay - 3 * s)} H${f(ax + 4 * s)} V${f(ay + 4 * s)} H${f(ax - 4 * s)} Z`, 'rgba(240,226,190,.85)', c.st, W1 * 0.7);
  if (o.hold === 'fork') g += P(`M${f(ax)} ${f(ay + 12 * s)} L${f(ax)} ${f(ay - 12 * s)} M${f(ax - 3 * s)} ${f(ay - 12 * s)} V${f(ay - 17 * s)} M${f(ax)} ${f(ay - 12 * s)} V${f(ay - 18 * s)} M${f(ax + 3 * s)} ${f(ay - 12 * s)} V${f(ay - 17 * s)} M${f(ax - 3 * s)} ${f(ay - 12 * s)} H${f(ax + 3 * s)}`, 'none', c.st, W1);
  if (o.hold === 'flag') g += P(`M${f(ax)} ${f(ay + 10 * s)} L${f(ax)} ${f(ay - 20 * s)}`, 'none', c.st, W1) + P(`M${f(ax)} ${f(ay - 20 * s)} l${f(13 * s * k)} ${f(4 * s)} l${f(-13 * s * k)} ${f(5 * s)} Z`, `hsl(${c.h} 70% 50%)`, c.st, W1 * 0.8);
  return g;
}

/** La chèvre des colons, une fois sur trois : un gag qui revient, pas un logo. */
const maybeGoat = (c: Ctx, x: number, y: number, s: number, flip = false) => (c.rng.chance(0.33) ? goat(c, x, y, s, flip) : '');

/** La chèvre des colons : elle apparaît là où on ne l'attend pas. */
function goat(c: Ctx, x: number, y: number, s: number, flip = false): string {
  const k = flip ? -1 : 1;
  return P(`M${f(x - 7 * s * k)} ${f(y - 7 * s)} Q${f(x)} ${f(y - 11 * s)} ${f(x + 6 * s * k)} ${f(y - 8 * s)} Q${f(x + 8 * s * k)} ${f(y - 4 * s)} ${f(x + 5 * s * k)} ${f(y - 3 * s)} L${f(x - 6 * s * k)} ${f(y - 3 * s)} Q${f(x - 9 * s * k)} ${f(y - 4 * s)} ${f(x - 7 * s * k)} ${f(y - 7 * s)} Z`, 'rgba(232,224,210,.92)', c.st, W1 * 0.8)
    + P(`M${f(x - 5 * s * k)} ${f(y - 3 * s)} V${f(y)} M${f(x - 2 * s * k)} ${f(y - 3 * s)} V${f(y)} M${f(x + 2 * s * k)} ${f(y - 3 * s)} V${f(y)} M${f(x + 4.5 * s * k)} ${f(y - 3 * s)} V${f(y)}`, 'none', c.st, W1 * 0.9)
    + P(`M${f(x + 6 * s * k)} ${f(y - 8 * s)} L${f(x + 10 * s * k)} ${f(y - 11 * s)} L${f(x + 11 * s * k)} ${f(y - 8 * s)} L${f(x + 9 * s * k)} ${f(y - 5.5 * s)} Z`, 'rgba(232,224,210,.92)', c.st, W1 * 0.8)
    + P(`M${f(x + 9.5 * s * k)} ${f(y - 11 * s)} Q${f(x + 8 * s * k)} ${f(y - 15 * s)} ${f(x + 6 * s * k)} ${f(y - 14 * s)} M${f(x + 9.5 * s * k)} ${f(y - 5.5 * s)} l${f(0.6 * s * k)} ${f(2.4 * s)}`, 'none', c.st, W1 * 0.8)
    + C(x + 9.6 * s * k, y - 9 * s, 0.6 * s, '#111');
}

function flameAt(x: number, y: number, s: number): string {
  return P(`M${f(x - 6 * s)} ${f(y)} Q${f(x - 8 * s)} ${f(y - 9 * s)} ${f(x - 2 * s)} ${f(y - 15 * s)} Q${f(x - 1 * s)} ${f(y - 9 * s)} ${f(x + 1 * s)} ${f(y - 20 * s)} Q${f(x + 8 * s)} ${f(y - 10 * s)} ${f(x + 6 * s)} ${f(y)} Z`, 'rgba(255,165,70,.92)', 'rgba(255,235,190,.95)', 1)
    + P(`M${f(x - 2.5 * s)} ${f(y)} Q${f(x - 3 * s)} ${f(y - 5 * s)} ${f(x)} ${f(y - 9 * s)} Q${f(x + 3 * s)} ${f(y - 5 * s)} ${f(x + 2.5 * s)} ${f(y)} Z`, 'rgba(255,242,205,.95)', 'none', 0);
}

function fireGlow(c: Ctx, x: number, y: number, r: number): string {
  const id = `${c.id}fg${uid++}`;
  return `<defs><radialGradient id="${id}" cx="50%" cy="70%" r="55%"><stop offset="0" stop-color="rgba(255,185,105,.6)"/><stop offset="1" stop-color="rgba(255,120,40,0)"/></radialGradient></defs><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 0.65)}" fill="url(#${id})"/>`;
}

function campfire(c: Ctx, x: number, y: number, s: number): string {
  let sparks = '';
  for (let i = 0; i < 8; i++) sparks += C(x + c.rng.range(-9, 9) * s, y - c.rng.range(12, 32) * s, c.rng.range(0.5, 1.1), `rgba(255,205,130,${(0.4 + c.rng.next() * 0.5).toFixed(2)})`);
  return fireGlow(c, x, y - 6 * s, 36 * s) + flameAt(x, y, s) + P(`M${f(x - 9 * s)} ${f(y + 1)} L${f(x + 9 * s)} ${f(y - 2)} M${f(x - 8 * s)} ${f(y - 2)} L${f(x + 8 * s)} ${f(y + 1)}`, 'none', c.st, W2) + sparks;
}

function smoke(c: Ctx, x: number, y: number, s: number, n = 4): string {
  let g = '';
  for (let i = 0; i < n; i++) g += `<circle cx="${f(x + i * 5 * s + c.rng.range(-2, 2))}" cy="${f(y - i * 9 * s)}" r="${f((6 + i * 3) * s)}" fill="rgba(40,34,40,${(0.55 - i * 0.1).toFixed(2)})" stroke="${c.dim}" stroke-width=".8"/>`;
  return g;
}

function tent(c: Ctx, x: number, y: number, s: number): string {
  return P(`M${f(x - 12 * s)} ${f(y)} L${f(x)} ${f(y - 16 * s)} L${f(x + 12 * s)} ${f(y)} Z`, c.dark, c.st)
    + P(`M${f(x - 2.6 * s)} ${f(y)} L${f(x)} ${f(y - 6.5 * s)} L${f(x + 2.6 * s)} ${f(y)} Z`, 'rgba(255,190,110,.6)', 'none', 0)
    + P(`M${f(x - 2.4 * s)} ${f(y - 16 * s)} L${f(x)} ${f(y - 20 * s)} L${f(x + 2.4 * s)} ${f(y - 16 * s)}`, 'none', c.st);
}

function house(c: Ctx, x: number, y: number, s: number, lit = true): string {
  return P(`M${f(x - 9 * s)} ${f(y)} V${f(y - 9 * s)} L${f(x)} ${f(y - 17 * s)} L${f(x + 9 * s)} ${f(y - 9 * s)} V${f(y)} Z`, c.dark, c.st)
    + (lit ? `<rect x="${f(x - 2.5 * s)}" y="${f(y - 8 * s)}" width="${f(5 * s)}" height="${f(5 * s)}" fill="rgba(255,205,135,.85)"/>` : '');
}

function temple(c: Ctx, x: number, y: number, s: number): string {
  const e = c.era;
  if (e === 0) return P(`M${f(x - 22 * s)} ${f(y)} Q${f(x)} ${f(y - 44 * s)} ${f(x + 22 * s)} ${f(y)} Z`, c.dark, c.st) + P(`M${f(x - 8 * s)} ${f(y)} Q${f(x)} ${f(y - 16 * s)} ${f(x + 8 * s)} ${f(y)} Z`, 'rgba(255,190,110,.55)', 'none', 0);
  if (e === 1) {
    let cols = '';
    for (let i = 0; i < 5; i++) cols += `M${f(x - 18 * s + i * 9 * s)} ${f(y)} V${f(y - 22 * s)} `;
    return P(`M${f(x - 22 * s)} ${f(y - 22 * s)} L${f(x)} ${f(y - 34 * s)} L${f(x + 22 * s)} ${f(y - 22 * s)} Z M${f(x - 22 * s)} ${f(y)} H${f(x + 22 * s)}`, c.dark, c.st) + P(cols, 'none', c.st);
  }
  if (e === 2) return P(`M${f(x - 18 * s)} ${f(y)} V${f(y - 24 * s)} L${f(x - 9 * s)} ${f(y - 30 * s)} L${f(x - 9 * s)} ${f(y - 46 * s)} L${f(x - 4 * s)} ${f(y - 56 * s)} L${f(x + 1 * s)} ${f(y - 46 * s)} L${f(x + 1 * s)} ${f(y - 30 * s)} L${f(x + 18 * s)} ${f(y - 24 * s)} V${f(y)} Z`, c.dark, c.st) + C(x - 4 * s, y - 36 * s, 3 * s, 'rgba(200,170,255,.7)');
  if (e === 3) return P(`M${f(x - 16 * s)} ${f(y)} V${f(y - 26 * s)} L${f(x)} ${f(y - 36 * s)} L${f(x + 16 * s)} ${f(y - 26 * s)} V${f(y)} Z M${f(x - 4 * s)} ${f(y - 36 * s)} V${f(y - 50 * s)} H${f(x + 4 * s)} V${f(y - 36 * s)}`, c.dark, c.st) + C(x, y - 43 * s, 2.6 * s, 'rgba(255,230,170,.8)', c.st, 1);
  return P(`M${f(x - 20 * s)} ${f(y)} Q${f(x - 20 * s)} ${f(y - 34 * s)} ${f(x)} ${f(y - 36 * s)} Q${f(x + 20 * s)} ${f(y - 34 * s)} ${f(x + 20 * s)} ${f(y)} Z`, c.dark, c.st) + `<circle cx="${f(x)}" cy="${f(y - 46 * s)}" r="${f(5 * s)}" fill="none" stroke="${c.st}" stroke-width="${W1}"/>`;
}

function tower(c: Ctx, x: number, y: number, s: number): string {
  return P(`M${f(x - 7 * s)} ${f(y)} L${f(x - 5 * s)} ${f(y - 46 * s)} H${f(x + 5 * s)} L${f(x + 7 * s)} ${f(y)} Z`, c.dark, c.st)
    + P(`M${f(x - 8 * s)} ${f(y - 46 * s)} H${f(x + 8 * s)} V${f(y - 52 * s)} H${f(x - 8 * s)} Z`, c.mid, c.st)
    + `<rect x="${f(x - 1.5 * s)}" y="${f(y - 40 * s)}" width="${f(3 * s)}" height="${f(5 * s)}" fill="rgba(255,205,135,.85)"/>`;
}

function stall(c: Ctx, x: number, y: number, s: number, hue: number): string {
  let stripes = '';
  for (let i = 0; i < 4; i++) stripes += `<path d="M${f(x - 14 * s + i * 7 * s)} ${f(y - 22 * s)} l${f(7 * s)} 0 l${f(1.5 * s)} ${f(6 * s)} l${f(-8.5 * s)} 0 Z" fill="${i % 2 ? c.dark : `hsl(${hue} 65% 45%)`}" stroke="${c.st}" stroke-width="1"/>`;
  return P(`M${f(x - 13 * s)} ${f(y)} V${f(y - 16 * s)} M${f(x + 13 * s)} ${f(y)} V${f(y - 16 * s)}`, 'none', c.st) + stripes
    + P(`M${f(x - 14 * s)} ${f(y - 8 * s)} H${f(x + 14 * s)} V${f(y)} H${f(x - 14 * s)} Z`, c.mid, c.st)
    + C(x - 6 * s, y - 10 * s, 2.4 * s, c.warm) + C(x, y - 10.5 * s, 2.4 * s, 'rgba(255,220,120,.9)') + C(x + 6 * s, y - 10 * s, 2.4 * s, c.warm);
}

function ship(c: Ctx, x: number, y: number, s: number): string {
  if (c.era >= 3) return P(`M${f(x - 22 * s)} ${f(y - 6 * s)} H${f(x + 24 * s)} L${f(x + 18 * s)} ${f(y + 2 * s)} H${f(x - 18 * s)} Z`, c.dark, c.st) + P(`M${f(x - 6 * s)} ${f(y - 6 * s)} V${f(y - 14 * s)} H${f(x + 8 * s)} V${f(y - 6 * s)} M${f(x)} ${f(y - 14 * s)} V${f(y - 24 * s)} H${f(x + 5 * s)} V${f(y - 14 * s)}`, c.mid, c.st) + smoke(c, x + 3 * s, y - 30 * s, 0.6 * s, 3);
  return P(`M${f(x - 20 * s)} ${f(y - 6 * s)} H${f(x + 20 * s)} Q${f(x + 16 * s)} ${f(y + 2 * s)} ${f(x)} ${f(y + 2 * s)} Q${f(x - 16 * s)} ${f(y + 2 * s)} ${f(x - 20 * s)} ${f(y - 6 * s)} Z`, c.dark, c.st)
    + P(`M${f(x)} ${f(y - 6 * s)} V${f(y - 38 * s)}`, 'none', c.st) + P(`M${f(x + 1)} ${f(y - 36 * s)} Q${f(x + 16 * s)} ${f(y - 24 * s)} ${f(x + 1)} ${f(y - 10 * s)} Z`, 'rgba(236,226,206,.9)', c.st, 1) + P(`M${f(x)} ${f(y - 38 * s)} l${f(8 * s)} ${f(2 * s)} l${f(-8 * s)} ${f(2 * s)}`, `hsl(${c.h} 70% 50%)`, c.st, 1);
}

function gear(c: Ctx, x: number, y: number, r: number): string {
  let d = '';
  const n = 9;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const rr = i % 2 ? r : r * 1.22;
    d += `${i ? 'L' : 'M'}${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)} `;
  }
  return P(`${d}Z`, c.mid, c.st) + C(x, y, r * 0.38, c.dark, c.st);
}

function waves(c: Ctx, y0: number, n: number): string {
  let g = '';
  for (let k = 0; k < n; k++) {
    let d = `M-10 ${f(y0 + k * 6)}`;
    for (let x = -10; x < 310; x += 16) d += ' q4 -3 8 0 t8 0';
    g += `<path d="${d}" fill="none" stroke="${c.st}" stroke-opacity="${(0.6 - k * 0.08).toFixed(2)}" stroke-width="1.1"/>`;
  }
  return g;
}

function water(c: Ctx, y: number): string {
  return `<rect y="${y}" width="300" height="${130 - y}" fill="${col(mix(c.far, [40, 90, 120], 0.45), 0.95)}"/>${waves(c, y + 3, 6)}`;
}

function crowd(c: Ctx, x0: number, x1: number, y: number, s: number, hold?: 'torch' | 'fork'): string {
  let g = '';
  for (let x = x0; x < x1; x += 11 * s + c.rng.range(0, 3)) {
    const hy = y - 14 * s - c.rng.range(0, 3);
    g += P(`M${f(x - 6 * s)} ${f(y)} Q${f(x)} ${f(hy + 2 * s)} ${f(x + 6 * s)} ${f(y)} Z`, c.dark, c.st, 1.2) + C(x, hy - 2 * s, 4.2 * s, c.dark, c.st, 1.2);
    if (hold && c.rng.chance(0.5)) g += hold === 'torch' ? P(`M${f(x + 4 * s)} ${f(hy + 2 * s)} V${f(hy - 12 * s)}`, 'none', c.st, 1.2) + flameAt(x + 4 * s, hy - 13 * s, 0.35 * s) : P(`M${f(x + 4 * s)} ${f(hy + 4 * s)} V${f(hy - 12 * s)} M${f(x + 2 * s)} ${f(hy - 12 * s)} V${f(hy - 16 * s)} M${f(x + 6 * s)} ${f(hy - 12 * s)} V${f(hy - 16 * s)}`, 'none', c.st, 1.1);
  }
  return g;
}

function column(c: Ctx, x: number, y: number, h: number, w: number, broken: boolean): string {
  const top = y - h;
  const crown = broken ? `L${f(x - w / 4)} ${f(top)} L${f(x)} ${f(top + 4)} L${f(x + w / 5)} ${f(top - 1)} L${f(x + w / 2)} ${f(top + 2)}` : `L${f(x + w / 2)} ${f(top + 3)}`;
  return P(`M${f(x - w / 2)} ${f(y)} L${f(x - w / 2)} ${f(top + 3)} ${crown} L${f(x + w / 2)} ${f(y)} Z`, c.mid, c.st)
    + (broken ? '' : P(`M${f(x - w / 2 - 3)} ${f(top)} H${f(x + w / 2 + 3)} V${f(top - 3)} H${f(x - w / 2 - 3)} Z`, c.mid, c.st))
    + P(`M${f(x - w / 6)} ${f(y - 2)} V${f(top + 6)} M${f(x + w / 6)} ${f(y - 2)} V${f(top + 6)}`, 'none', c.dim, 0.9);
}

function soldiers(c: Ctx, x0: number, x1: number, y: number, s: number): string {
  let g = '';
  const weapon = c.era === 3 ? 'rifle' : c.era === 4 ? 'laser' : 'spear';
  for (let x = x0; x < x1; x += 13 * s) {
    g += P(`M${f(x - 5 * s)} ${f(y)} L${f(x - 4 * s)} ${f(y - 16 * s)} H${f(x + 4 * s)} L${f(x + 5 * s)} ${f(y)} Z`, c.dark, c.st, 1.2) + C(x, y - 20 * s, 4.4 * s, c.dark, c.st, 1.2);
    g += c.era <= 1 ? P(`M${f(x - 5 * s)} ${f(y - 22 * s)} Q${f(x)} ${f(y - 28 * s)} ${f(x + 5 * s)} ${f(y - 22 * s)}`, 'none', c.st, 1.2) : P(`M${f(x - 5 * s)} ${f(y - 21 * s)} H${f(x + 5 * s)}`, 'none', c.st, 1.4);
    g += weapon === 'spear' ? P(`M${f(x + 6 * s)} ${f(y)} V${f(y - 36 * s)}`, 'none', c.st, 1.1) + P(`M${f(x + 4.4 * s)} ${f(y - 34 * s)} L${f(x + 6 * s)} ${f(y - 40 * s)} L${f(x + 7.6 * s)} ${f(y - 34 * s)} Z`, c.dark, c.st, 0.9)
      : weapon === 'rifle' ? P(`M${f(x + 3 * s)} ${f(y - 10 * s)} L${f(x + 9 * s)} ${f(y - 30 * s)}`, 'none', c.st, 1.3)
      : P(`M${f(x + 3 * s)} ${f(y - 14 * s)} H${f(x + 12 * s)}`, 'none', 'rgba(150,240,255,.9)', 1.6);
  }
  return g;
}

// ------------------------------------------------------------------------------ scènes

type Scene = (sp: IllusSpec, c: Ctx) => string;

/** Le décor derrière un chef de famille. */
function familyBackdrop(c: Ctx, fam: PortraitFam, hue: number, rivalHue?: number): string {
  if (fam === 'ourk') {
    let g = c.era === 0 ? tent(c, 166, GROUND, 1.1) + tent(c, 206, GROUND, 1.3) + tent(c, 250, GROUND, 1) : skyline(c, GROUND, 140, 304, 1.1);
    g += soldiers(c, 172, 300, GROUND, 0.75) + campfire(c, 214, GROUND, 1.2);
    return g;
  }
  if (fam === 'sel') return skyline(c, GROUND, 140, 304, 0.9) + temple(c, 226, GROUND, 1.25) + campfire(c, 186, GROUND, 0.7) + crowd(c, 160, 296, GROUND, 0.7);
  if (fam === 'brume') return stars(c, 20, 60) + skyline(c, GROUND, 140, 304, 0.9) + tower(c, 232, GROUND, 1.25) + P('M240 52 L262 40', 'none', c.st, W1 + 1) + C(212, 30, 7, 'rgba(255,246,220,.9)', c.st, 1) + gear(c, 270, 100, 8);
  if (fam === 'troc') return skyline(c, GROUND, 140, 304, 0.9) + stall(c, 196, GROUND, 1.2, hue) + stall(c, 252, GROUND, 1.1, (hue + 40) % 360) + C(286, 104, 3, c.warm, c.st, 1) + C(280, 108, 3, c.warm, c.st, 1);
  // la rivale : sa cité, ses bannières
  const rh = rivalHue ?? 280;
  let b = skyline(c, GROUND, 130, 304, 1.25);
  for (let i = 0; i < 4; i++) {
    const x = 160 + i * 36;
    b += P(`M${x} ${GROUND} V${GROUND - 50}`, 'none', c.st) + P(`M${x} ${GROUND - 50} h14 v22 l-7 -5 l-7 5 Z`, `hsl(${rh} 70% 42%)`, c.st, 1.2);
  }
  return b;
}

/** Un personnage : le chef de famille en buste, devant les siens. */
const scenePortrait: Scene = (sp, c) => {
  const fam = sp.fam ?? 'ourk';
  const body = `${stars(c, c.era === 0 || c.era === 4 ? 24 : 8, 50)}${ridge(c, 82, 14, col(c.far, 0.95), 0.25)}
${familyBackdrop(c, fam, sp.hue, sp.rivalHue)}${ground(c)}
${halo(c, 78, 58, 62)}
<g transform="translate(18 12) scale(1.24)">${portraitBody(fam, c.era, sp.mood ?? 0, sp.hue)}</g>`;
  return frame(c, 220, 108, body);
};

/** La crue : l'eau monte jusqu'aux greniers, des poissons finissent dans les arbres. */
const sceneCrue: Scene = (_sp, c) => {
  let rain = '';
  for (let i = 0; i < 40; i++) rain += `M${f(c.rng.range(-10, 300))} ${f(c.rng.range(26, 92))} l-3 9 `;
  let cloud = 'M-10 -5 V22';
  for (let x = -10; x < 310;) { const w = c.rng.range(26, 42); cloud += ` q${f(w / 2)} ${f(c.rng.range(10, 16))} ${f(w)} 0`; x += w; }
  const body = `${ridge(c, 74, 12, col(c.far, 0.95), 0.25)}
<path d="${cloud} L310 -5 Z" fill="rgba(10,10,20,.92)" stroke="${c.st}" stroke-opacity=".3" stroke-width="1"/>
${house(c, 140, 92, 1.2, false)}${house(c, 238, 93, 1.3, false)}
${water(c, 86)}
<path d="M0 98 Q60 96 120 99 T300 98" fill="none" stroke="rgba(120,80,40,.7)" stroke-width="3"/>
${halo(c, 60, 66, 40)}
${focus(c, `${treeAt(c, 60, 104, 1.6)}${fishAt(c, 46, 66, 1.7)}${fishAt(c, 74, 74, 1.5, true)}${fishAt(c, 62, 54, 1.4)}`)}
${maybeGoat(c, 238, 76, 1.1, true)}${person(c, 140, 75, 0.62, { arm: 'up' })}
<path d="${rain}" fill="none" stroke="${c.st}" stroke-opacity=".3" stroke-width=".9"/>`;
  return frame(c, 230, 10, body);
};

function treeAt(c: Ctx, x: number, y: number, s: number): string {
  const cy = y - 27 * s;
  let d = '';
  const n = 11;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = (i % 2 ? 12 : 15) * s;
    const px = x + Math.cos(a) * r * 1.25;
    const py = cy + Math.sin(a) * r * 0.85;
    d += i === 0 ? `M${f(px)} ${f(py)}` : ` Q${f(x + Math.cos(a - Math.PI / n) * r * 1.55)} ${f(cy + Math.sin(a - Math.PI / n) * r * 1.1)} ${f(px)} ${f(py)}`;
  }
  return P(`M${f(x - 2.4 * s)} ${f(y)} L${f(x - 1.4 * s)} ${f(y - 22 * s)} L${f(x + 1.4 * s)} ${f(y - 22 * s)} L${f(x + 2.4 * s)} ${f(y)} Z`, c.dark, c.st) + P(`${d} Z`, c.dark, c.st);
}

function fishAt(c: Ctx, x: number, y: number, s: number, flip = false): string {
  const k = flip ? -1 : 1;
  return P(`M${f(x - 5 * s * k)} ${f(y)} Q${f(x)} ${f(y - 3.4 * s)} ${f(x + 4 * s * k)} ${f(y)} Q${f(x)} ${f(y + 3.4 * s)} ${f(x - 5 * s * k)} ${f(y)} Z M${f(x - 5 * s * k)} ${f(y)} L${f(x - 8 * s * k)} ${f(y - 2.6 * s)} L${f(x - 8 * s * k)} ${f(y + 2.6 * s)} Z`, 'rgba(255,170,90,.95)', c.st, 1.2) + C(x + 2 * s * k, y - 0.6 * s, 0.8, '#111');
}

/** Les ruines : la stèle en héros, une chèvre sur la colonne. */
const sceneRuines: Scene = (sp, c) => {
  let vines = '';
  for (let i = 0; i < 4; i++) { const x = 40 + i * 34 + c.rng.range(-5, 5); vines += `M${f(x)} ${GROUND} q${f(c.rng.range(-6, 6))} -8 ${f(c.rng.range(-3, 3))} -16 t${f(c.rng.range(-4, 4))} -14 `; }
  let flies = '';
  for (let i = 0; i < 9; i++) flies += C(c.rng.range(30, 290), c.rng.range(64, 108), 1.1, `rgba(220,255,170,${(0.45 + c.rng.next() * 0.5).toFixed(2)})`);
  const ghosts = sp.variant === 'revenant' ? `<g opacity=".55">${person(c, 250, GROUND, 0.9, { arm: 'out' })}${person(c, 276, GROUND, 0.8)}</g>` : '';
  const body = `${stars(c, 36, 56)}<circle cx="262" cy="24" r="11" fill="rgba(255,246,220,.92)"/><circle cx="266" cy="21" r="9" fill="${col(c.sky[0], 0.85)}"/>
${ridge(c, 84, 12, col(c.far, 0.95), 0.25)}
${column(c, 30, GROUND, 52, 12, false)}${column(c, 62, GROUND, 36, 12, true)}${column(c, 100, GROUND, 44, 12, true)}
${P('M54 112 L68 104 L118 108 L114 112 Z', c.mid, c.st)}
${maybeGoat(c, 100, GROUND - 44, 1.05)}
${halo(c, 196, 84, 46)}
${focus(c, P('M174 112 L174 74 Q196 60 218 74 L218 112 Z', c.mid, c.st, W2) + P('M182 82 H210 M182 89 H210 M182 96 H204 M182 103 H198', 'none', 'rgba(255,214,150,.95)', 1.6))}
${ghosts}${ground(c)}
<path d="${vines}" fill="none" stroke="hsl(110 50% 60%)" stroke-opacity=".6" stroke-width="1.3"/>${flies}`;
  return frame(c, 262, 24, body);
};

/** Le feu : les toits brûlent, une chaîne de seaux, un habitant qui sauve ses poules. */
const sceneFeu: Scene = (_sp, c) => {
  const body = `${skyline(c, 96)}${ridge(c, 100, 4, c.mid, 0.2)}
${house(c, 120, GROUND, 1.6, false)}${house(c, 168, GROUND, 1.9, false)}${house(c, 214, GROUND, 1.5, false)}
${smoke(c, 150, 52, 1.2, 5)}${fireGlow(c, 168, 84, 70)}
${focus(c, flameAt(120, 86, 1.2) + flameAt(168, 80, 1.8) + flameAt(214, 88, 1.3))}
${ground(c)}
${person(c, 40, GROUND, 0.8, { arm: 'out', hold: 'bucket' })}${person(c, 64, GROUND, 0.8, { arm: 'out', hold: 'bucket', flip: true })}${person(c, 262, GROUND, 0.85, { arm: 'up' })}${maybeGoat(c, 286, GROUND, 0.8, true)}`;
  return frame(c, 168, 86, body);
};

/** Un phénomène céleste au-dessus de la cité, la foule le nez en l'air. */
const sceneCiel: Scene = (sp, c) => {
  const v = sp.variant ?? 'comet';
  let sky = '';
  if (v === 'comet') sky = `${halo(c, 210, 30, 40)}${focus(c, P('M214 28 L60 64 L66 70 Z', 'rgba(255,240,210,.35)', 'none', 0) + C(214, 28, 6, 'rgba(255,248,230,.95)', c.st, W2))}`;
  else if (v === 'sun') sky = `${halo(c, 150, 40, 50)}${focus(c, C(150, 40, 18, 'rgba(255,214,120,.95)', c.st, W2) + C(158, 36, 16, col(c.sky[0], 0.95), 'none'))}`;
  else if (v === 'moon') sky = `${halo(c, 150, 36, 44)}${focus(c, C(150, 36, 16, 'rgba(255,246,220,.95)', c.st, W2))}`;
  else sky = `${halo(c, 150, 34, 46)}${focus(c, P('M150 14 L155 29 L170 34 L155 39 L150 54 L145 39 L130 34 L145 29 Z', 'rgba(255,240,200,.95)', c.st, W2))}`;
  const body = `${stars(c, 46, 70)}${sky}${skyline(c, GROUND - 6)}${ground(c)}${crowd(c, 30, 280, GROUND, 0.95)}${maybeGoat(c, 286, GROUND, 0.75, true)}`;
  return frame(c, 150, 30, body);
};

/** Le marché : étals, balances, et une chèvre qui a déjà goûté la marchandise. */
const sceneMarche: Scene = (sp, c) => {
  const scales = sp.variant === 'scales' ? focus(c, P('M150 56 V96 M128 62 H172 M128 62 L122 78 H134 Z M172 62 L166 78 H178 Z', 'none', c.st, W2) + P('M122 78 H134 M166 78 H178 M140 96 H160', 'none', c.st, W2)) : '';
  const key = sp.variant === 'key' ? focus(c, C(150, 60, 9, 'none', 'rgba(255,214,120,.95)', W2 + 1) + P('M159 60 H186 M178 60 V68 M184 60 V66', 'none', 'rgba(255,214,120,.95)', W2 + 1)) : '';
  const body = `${skyline(c, 96)}${ground(c)}
${halo(c, 150, 76, 54)}
${stall(c, 70, GROUND, 1.5, c.h)}${stall(c, 230, GROUND, 1.5, (c.h + 50) % 360)}
${scales || key || focus(c, C(150, 82, 9, 'rgba(255,214,120,.95)', c.st, W2) + C(140, 92, 7, 'rgba(255,200,110,.95)', c.st, W2) + C(160, 92, 7, 'rgba(255,200,110,.95)', c.st, W2))}
${person(c, 112, GROUND, 0.85, { fam: 'troc', arm: 'out' })}${person(c, 196, GROUND, 0.8, { arm: 'out', flip: true })}${maybeGoat(c, 268, GROUND, 0.9, true)}`;
  return frame(c, 150, 70, body);
};

/** L'armée : une ligne de soldats sur la crête, la bannière au vent. */
const sceneArmee: Scene = (sp, c) => {
  const body = `${ridge(c, 96, 12, col(c.far, 0.95), 0.3)}
<ellipse cx="236" cy="96" rx="60" ry="14" fill="rgba(180,140,100,.25)"/>
${soldiers(c, 150, 300, 98, 0.8)}${ground(c)}
${halo(c, 84, 70, 48)}
${focus(c, person(c, 84, GROUND, 1.25, { fam: sp.variant === 'shield' ? undefined : 'ourk', arm: 'up', hold: 'flag' }) + (sp.variant === 'shield' ? P('M60 84 Q60 100 72 106 Q84 100 84 84 Q72 80 60 84 Z', c.mid, c.st, W2) : ''))}
${maybeGoat(c, 34, GROUND, 0.75)}`;
  return frame(c, 80, 60, body);
};

/** Le temple : l'œil, la cloche ou la spirale au fronton, les fidèles devant. */
const sceneTemple: Scene = (sp, c) => {
  const sym = sp.variant === 'bell' ? P('M140 30 Q140 16 150 16 Q160 16 160 30 L164 38 H136 Z', 'rgba(255,214,120,.95)', c.st, W2) + C(150, 41, 2.4, c.st)
    : sp.variant === 'spiral' ? P('M150 30 m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -9 -2 a9 9 0 1 1 16 4', 'none', 'rgba(220,200,255,.95)', W2)
    : P('M134 30 Q150 18 166 30 Q150 42 134 30 Z', 'rgba(255,240,210,.9)', c.st, W2) + C(150, 30, 4.4, '#1a1020');
  const body = `${stars(c, 18, 50)}${skyline(c, GROUND - 4)}
${halo(c, 150, 60, 60)}
${temple(c, 150, GROUND, 1.7)}
${focus(c, sym)}
${ground(c)}${crowd(c, 40, 120, GROUND, 0.9)}${crowd(c, 184, 270, GROUND, 0.9)}${person(c, 278, GROUND, 0.8, { fam: 'sel', hold: 'staff', flip: true })}`;
  return frame(c, 150, 40, body);
};

/** Le savoir : une table, une bougie, des rouleaux, des étagères qui ploient. */
const sceneSavoir: Scene = (_sp, c) => {
  let shelves = '';
  for (let r = 0; r < 3; r++) {
    shelves += P(`M196 ${40 + r * 22} H290`, 'none', c.st);
    for (let x = 200; x < 286; x += 8 + c.rng.int(0, 3)) shelves += `<rect x="${x}" y="${f(40 + r * 22 - 12 - c.rng.range(0, 6))}" width="6" height="${f(12 + c.rng.range(0, 5))}" fill="hsl(${(c.h + c.rng.int(0, 60)) % 360} 40% 30%)" stroke="${c.st}" stroke-width=".8"/>`;
  }
  const body = `<rect width="300" height="130" fill="rgba(10,8,14,.35)"/>${shelves}
${fireGlow(c, 120, 80, 70)}
${P('M60 96 H200 V102 H60 Z M70 102 V122 M190 102 V122', c.mid, c.st)}
${focus(c, P('M100 96 V84 H108 V96 Z', 'rgba(240,226,190,.95)', c.st, W2) + flameAt(104, 82, 0.5) + P('M128 94 Q150 86 172 94 Q150 98 128 94 Z', 'rgba(240,226,190,.95)', c.st, W2))}
${person(c, 40, GROUND + 6, 0.95, { fam: 'brume', arm: 'out', hold: 'scroll' })}${ground(c)}${maybeGoat(c, 232, GROUND, 0.8)}`;
  return frame(c, 104, 80, body);
};

/** La machine : engrenages, cheminées, vapeur. */
const sceneMachine: Scene = (_sp, c) => {
  const body = `${skyline(c, 96)}${smoke(c, 220, 50, 1.3, 5)}
${P('M180 112 V70 L200 60 V70 L220 60 V70 L240 60 V112 Z M226 70 V30 H234 V70', c.dark, c.st)}
${halo(c, 110, 70, 56)}
${focus(c, gear(c, 98, 70, 22) + gear(c, 136, 88, 14))}
${ground(c)}${person(c, 52, GROUND, 0.9, { arm: 'out' })}${maybeGoat(c, 270, GROUND, 0.8, true)}`;
  return frame(c, 110, 70, body);
};

/** La cour : couronne, cérémonie, conseil ou théâtre. */
const sceneCour: Scene = (sp, c) => {
  const v = sp.variant ?? 'crown';
  let main = '';
  if (v === 'mask') {
    main = P('M40 20 Q80 60 60 112 H40 Z M260 20 Q220 60 240 112 H260 Z', `hsl(${c.h} 60% 30%)`, c.st) + P('M70 108 H230 V112 H70 Z', c.mid, c.st)
      + focus(c, P('M126 54 Q150 40 174 54 Q170 80 150 86 Q130 80 126 54 Z', 'rgba(240,230,210,.95)', c.st, W2) + P('M136 60 Q140 56 144 60 M156 60 Q160 56 164 60 M138 72 Q150 80 162 72', 'none', '#1a1020', 2))
      + person(c, 108, 108, 0.7, { arm: 'up' }) + person(c, 194, 108, 0.7, { arm: 'out', flip: true });
  } else if (v === 'ring') {
    main = P('M80 100 Q150 84 220 100 Q150 112 80 100 Z', c.mid, c.st) + focus(c, C(150, 68, 12, 'none', 'rgba(255,214,120,.95)', W2 + 1))
      + person(c, 92, GROUND, 0.75, { fam: 'ourk' }) + person(c, 124, GROUND, 0.75, { fam: 'sel' }) + person(c, 178, GROUND, 0.75, { fam: 'brume', flip: true }) + person(c, 210, GROUND, 0.75, { fam: 'troc', flip: true });
  } else if (v === 'hand') {
    main = focus(c, person(c, 128, GROUND, 1.15, { fam: 'troc', arm: 'out' }) + person(c, 172, GROUND, 1.15, { fam: 'ourk', arm: 'out', flip: true }) + C(150, 92, 4, 'rgba(255,214,120,.95)', c.st, W2));
  } else {
    main = P('M126 112 V80 H174 V112 Z M120 80 H180 V74 H120 Z', c.mid, c.st) + focus(c, P('M132 60 L136 44 L144 54 L150 40 L156 54 L164 44 L168 60 Z', 'rgba(255,214,120,.95)', c.st, W2))
      + crowd(c, 30, 110, GROUND, 0.9) + crowd(c, 194, 280, GROUND, 0.9);
  }
  const banners = v === 'mask' ? '' : [60, 240].map((x) => P(`M${x} 20 H${x + 18} V60 L${x + 9} 52 L${x} 60 Z`, `hsl(${c.h} 65% 38%)`, c.st)).join('');
  const body = `<rect width="300" height="130" fill="rgba(10,8,14,.3)"/>${banners}${halo(c, 150, 62, 56)}${main}${ground(c)}${v === 'crown' ? goat(c, 284, GROUND, 0.7, true) : ''}`;
  return frame(c, 150, 50, body);
};

/** Les champs : gerbes, épouvantail, oiseaux, et la chèvre dans le blé. */
const sceneChamps: Scene = (sp, c) => {
  let rows = '';
  for (let r = 0; r < 4; r++) for (let x = (r % 2) * 6; x < 300; x += 12) rows += `M${f(x)} ${f(GROUND - r * 4)} l-1.5 -8 M${f(x)} ${f(GROUND - r * 4)} l1.5 -8 `;
  const birds = Array.from({ length: 5 }, (_, i) => `M${f(60 + i * 40 + c.rng.range(-8, 8))} ${f(24 + c.rng.range(0, 18))} q4 -4 8 0 q4 -4 8 0 `).join('');
  const body = `${ridge(c, 92, 10, col(c.far, 0.95), 0.25)}${ground(c)}
<path d="${rows}" fill="none" stroke="rgba(230,190,90,.75)" stroke-width="1.3"/>
${halo(c, 150, 70, 50)}
${focus(c, sp.variant === 'leaf' ? treeAt(c, 150, GROUND, 1.7) : P('M150 112 V58 M136 70 H164 M150 58 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0', c.dark, c.st, W2) + P('M144 50 H156 L152 44 H148 Z', c.mid, c.st, W1))}
<path d="${birds}" fill="none" stroke="${c.st}" stroke-width="1.4"/>
${maybeGoat(c, 220, GROUND - 2, 1)}${person(c, 70, GROUND, 0.85, { arm: 'down', hold: 'fork' })}`;
  return frame(c, 150, 30, body);
};

/** Le port : la mer, les navires, les mouettes. */
const scenePort: Scene = (_sp, c) => {
  const body = `${stars(c, 16, 40)}${ridge(c, 86, 10, col(c.far, 0.95), 0.25)}
${water(c, 92)}
${halo(c, 160, 70, 52)}
${focus(c, ship(c, 160, 96, 1.5))}${ship(c, 260, 98, 0.8)}
${P('M0 104 H70 V112 H0 Z', c.mid, c.st)}${person(c, 40, 104, 0.8, { fam: 'troc', arm: 'out' })}${maybeGoat(c, 14, 104, 0.6)}`;
  return frame(c, 160, 70, body);
};

/** La route : un chemin qui file vers l'horizon, un voyageur, un panneau. */
const sceneRoute: Scene = (sp, c) => {
  const branches = sp.variant === 'carrefour' ? P('M150 112 L150 88 M150 88 L96 70 M150 88 L150 64 M150 88 L204 70', 'none', 'rgba(230,200,150,.8)', 3) : '';
  const road = c.era >= 3 ? 'rgba(90,90,100,.65)' : 'rgba(140,110,80,.55)';
  const body = `${stars(c, 22, 50)}${ridge(c, 80, 14, col(c.far, 0.95), 0.25)}${skyline(c, 86, 10, 120, 0.7)}${skyline(c, 86, 200, 300, 0.7)}${ground(c)}
${P('M100 130 L144 80 L156 80 L200 130 Z', road, c.st, 1)}${c.era >= 3 ? P('M150 128 L150 82', 'none', 'rgba(255,240,200,.55)', 1.2, ' stroke-dasharray="4 4"') : ''}${branches}
${halo(c, 196, 74, 40)}
${focus(c, P('M196 112 V64 M196 70 H226 L232 75 L226 80 H196 M196 84 H170 L164 89 L170 94 H196', c.mid, c.st, W2))}
${person(c, 120, GROUND, 0.9, { arm: 'down', hold: 'staff' })}${maybeGoat(c, 92, GROUND, 0.7)}`;
  return frame(c, 150, 70, body);
};

/** Le village : quelques maisons, ou une tour, ou la terre qui tremble. */
const sceneVillage: Scene = (sp, c) => {
  const v = sp.variant ?? 'house';
  const crack = v === 'mountain' ? P('M150 112 L144 118 L152 122 L146 130', 'none', 'rgba(255,190,110,.9)', 2) : '';
  const main = v === 'tower' ? tower(c, 150, GROUND, 1.5) : v === 'mountain'
    ? P('M60 112 L120 40 L150 70 L170 50 L240 112 Z', c.mid, c.st, W2) + P('M110 52 L120 40 L130 52', 'none', 'rgba(255,246,220,.9)', W2)
    : house(c, 120, GROUND, 1.6) + house(c, 160, GROUND, 2) + house(c, 200, GROUND, 1.5);
  const body = `${stars(c, 20, 50)}${skyline(c, GROUND - 2)}${halo(c, 150, 76, 56)}${focus(c, main)}${ground(c)}${crack}${person(c, 250, GROUND, 0.85, { arm: 'out', flip: true })}${maybeGoat(c, 276, GROUND, 0.75, true)}`;
  return frame(c, 150, 60, body);
};

/** Un lieu de rencontre, selon la route. */
const sceneLieu: Scene = (sp, c) => {
  const v = sp.variant ?? 'inconnu';
  let main = '';
  let fig = '';
  if (v === 'camp_ourk') { main = tent(c, 120, GROUND, 1.6) + tent(c, 190, GROUND, 1.3) + campfire(c, 156, GROUND, 1.3); fig = person(c, 236, GROUND, 0.95, { fam: 'ourk', hold: 'spear', arm: 'out', flip: true }); }
  else if (v === 'grotte_sel') { main = P('M70 112 Q150 10 230 112 Z', c.dark, c.st, W2) + P('M110 112 Q150 50 190 112 Z', '#07060b', c.st) + fireGlow(c, 150, 104, 40) + flameAt(140, 106, 0.5) + flameAt(160, 106, 0.5); fig = person(c, 150, GROUND, 0.9, { fam: 'sel', hold: 'staff' }); }
  else if (v === 'rocher_brume') { main = P('M90 112 L110 60 L150 46 L190 62 L206 112 Z', c.mid, c.st, W2) + tower(c, 150, 50, 0.7) + P('M156 18 L176 8', 'none', c.st, W1 + 1); fig = person(c, 226, GROUND, 0.9, { fam: 'brume', hold: 'scroll', arm: 'out', flip: true }); }
  else if (v === 'comptoir_troc') { main = stall(c, 120, GROUND, 1.6, c.h) + stall(c, 186, GROUND, 1.5, (c.h + 60) % 360) + P('M232 112 H262 V96 H232 Z M240 96 V88 H254 V96', c.mid, c.st); fig = person(c, 80, GROUND, 0.95, { fam: 'troc', arm: 'out' }); }
  else if (v === 'frontiere') { main = P('M40 112 V80 M60 112 V84 M80 112 V82 M100 112 V86 M30 92 H110', 'none', c.st, W2) + tower(c, 200, GROUND, 1.3) + P('M150 130 L176 112 L224 112 L250 130', 'rgba(140,110,80,.4)', 'none', 0); fig = person(c, 248, GROUND, 0.9, { arm: 'out', hold: 'spear', flip: true }); }
  else { main = P('M110 112 V60 M190 112 V60 M104 60 H196 V52 H104 Z', c.mid, c.st, W2) + `<ellipse cx="150" cy="90" rx="26" ry="22" fill="rgba(180,200,255,.18)"/>` + C(150, 88, 3, 'rgba(220,235,255,.95)'); fig = person(c, 236, GROUND, 0.9, { arm: 'up', flip: true }); }
  const body = `${stars(c, 26, 56)}${ridge(c, 84, 12, col(c.far, 0.95), 0.25)}${halo(c, 150, 74, 60)}${focus(c, main)}${ground(c)}${fig}${maybeGoat(c, 34, GROUND, 0.75)}`;
  return frame(c, 150, 60, body);
};

/** Une crise : la menace de l'ère, en grand, la cité en petit. */
const sceneCrise: Scene = (sp, c) => {
  const v = sp.variant ?? 'horde';
  let g = '';
  if (v === 'horde') {
    // des cavaliers sur la crête : cheval, cavalier, lance, et leur poussière
    let riders = '';
    for (let i = 0; i < 5; i++) {
      const x = 130 + i * 32;
      const y = 98 - (i % 2) * 4;
      riders += P(`M${x} ${y - 10} Q${x + 10} ${y - 15} ${x + 22} ${y - 11} L${x + 28} ${y - 18} L${x + 31} ${y - 16} L${x + 27} ${y - 7} L${x + 22} ${y - 6} L${x + 21} ${y} M${x + 4} ${y - 7} L${x + 2} ${y} M${x} ${y - 10} Q${x - 4} ${y - 8} ${x - 6} ${y - 3}`, c.dark, c.st, 1.5)
        + P(`M${x + 9} ${y - 14} L${x + 10} ${y - 24} M${x + 6} ${y - 20} H${x + 14}`, 'none', c.st, 1.5) + C(x + 10, y - 27, 3.2, c.dark, c.st, 1.4)
        + P(`M${x + 14} ${y - 30} L${x + 2} ${y - 4}`, 'none', c.st, 1.2);
    }
    g = `<ellipse cx="210" cy="96" rx="110" ry="16" fill="rgba(200,150,100,.32)"/>${skyline(c, GROUND, -4, 110)}${focus(c, riders)}`;
  } else if (v === 'hiver') {
    let snow = '';
    for (let i = 0; i < 70; i++) snow += C(c.rng.range(0, 300), c.rng.range(0, 110), c.rng.range(0.6, 1.6), 'rgba(240,245,255,.85)');
    g = `${skyline(c, GROUND)}${P('M0 112 Q80 104 150 110 T300 108 V130 H0 Z', 'rgba(230,236,250,.85)', c.st, 1)}${focus(c, P('M220 100 l10 -6 l6 2 l10 -2 l4 6 l-4 4 h-24 Z M244 94 l4 -6 l2 6', c.dark, c.st, W2) + C(247, 97, 1, 'rgba(255,220,120,.95)'))}${snow}`;
  } else if (v === 'peste') {
    g = `${skyline(c, GROUND)}<rect y="70" width="300" height="60" fill="rgba(120,170,60,.25)"/>${focus(c, person(c, 150, GROUND, 1.25, { arm: 'out', hold: 'staff' }) + P('M150 82 l12 4 l-12 3 Z', 'rgba(230,224,210,.95)', c.st, W1))}${crowd(c, 30, 110, GROUND, 0.8)}`;
  } else if (v === 'incendie') return sceneFeu(sp, c);
  else if (v === 'revolte') g = `${skyline(c, GROUND - 6)}${fireGlow(c, 150, 90, 120)}${focus(c, crowd(c, 30, 280, GROUND, 1.15, 'torch'))}`;
  else if (v === 'schisme') g = `${focus(c, `<g transform="translate(-60 0)">${temple(c, 150, GROUND, 1.4)}</g><g transform="translate(60 0)">${temple(c, 150, GROUND, 1.4)}</g>`)}${P('M150 112 L146 90 L154 70 L148 50', 'none', 'rgba(255,190,110,.9)', 2)}${crowd(c, 40, 120, GROUND, 0.75)}${crowd(c, 180, 270, GROUND, 0.75)}`;
  else if (v === 'guerre') g = `${smoke(c, 70, 60, 1.4, 5)}${smoke(c, 220, 66, 1.2, 4)}${skyline(c, GROUND)}${focus(c, P('M120 112 L128 98 H172 L180 112 Z M140 98 L190 84 L192 90 L146 102 Z', c.dark, c.st, W2) + C(200, 82, 6, 'rgba(255,200,120,.95)'))}${soldiers(c, 220, 300, GROUND, 0.7)}`;
  else if (v === 'krach') {
    let coins = '';
    for (let i = 0; i < 14; i++) coins += C(c.rng.range(60, 240), c.rng.range(10, 100), 3.4, 'rgba(255,214,120,.9)', c.st, 1);
    g = `${focus(c, P('M100 112 V60 L150 40 L200 60 V112 Z M110 60 V112 M130 60 V112 M170 60 V112 M190 60 V112', c.mid, c.st, W2))}${coins}${crowd(c, 30, 90, GROUND, 0.8)}${crowd(c, 210, 280, GROUND, 0.8)}`;
  } else if (v === 'filtre') g = `${stars(c, 50, 90)}${focus(c, C(150, 44, 20, 'rgba(255,255,255,.95)', c.st, W2) + `<circle cx="150" cy="44" r="34" fill="none" stroke="${c.st}" stroke-width="1.4" stroke-opacity=".6"/><circle cx="150" cy="44" r="50" fill="none" stroke="${c.st}" stroke-width="1" stroke-opacity=".35"/>`)}${skyline(c, GROUND, -4, 304, 0.7)}`;
  else {
    let grid = '';
    for (let x = 0; x <= 300; x += 20) grid += `M${x} 0 V112 `;
    for (let y = 0; y <= 112; y += 20) grid += `M0 ${y} H300 `;
    g = `<path d="${grid}" stroke="rgba(120,220,255,.18)" stroke-width="1"/>${skyline(c, GROUND)}${focus(c, P('M110 44 Q130 32 150 44 Q130 56 110 44 Z M150 44 Q170 32 190 44 Q170 56 150 44 Z', 'rgba(150,240,255,.25)', 'rgba(150,240,255,.95)', W2) + C(130, 44, 4, 'rgba(150,240,255,.95)') + C(170, 44, 4, 'rgba(150,240,255,.95)'))}`;
  }
  const body = `${halo(c, 150, 60, 70)}${g}${ground(c)}`;
  return frame(c, 150, 50, body);
};

/** Une découverte : l'objet sous la lampe, sur l'établi. */
const sceneDecouverte: Scene = (sp, c) => {
  const st = `hsl(${c.h} 88% 82%)`;
  const obj = motif(sp.variant ?? 'scroll', new Rng(hashString(sp.key)), st, `hsla(${c.h},80%,60%,.35)`, `hsla(${c.h},70%,78%,.45)`);
  const body = `<rect width="300" height="130" fill="rgba(10,8,14,.3)"/>${fireGlow(c, 150, 70, 90)}
${P('M40 100 H260 V106 H40 Z M54 106 V130 M246 106 V130', c.mid, c.st)}
${halo(c, 150, 62, 54)}
${focus(c, `<g transform="translate(150 62) scale(.48) translate(-150 -98)">${obj}</g>`)}
${P('M226 100 V72 M220 72 H232 L230 66 H222 Z', c.mid, c.st)}${flameAt(226, 64, 0.45)}
${maybeGoat(c, 64, 100, 0.7)}`;
  return frame(c, 150, 60, body);
};

/** La colonie : des colons et leurs chèvres en route vers la colline. */
const sceneColonie: Scene = (_sp, c) => {
  const body = `${stars(c, 18, 44)}${ridge(c, 74, 10, col(c.far, 0.95), 0.25)}
${P('M150 112 Q210 70 300 66 V112 Z', c.mid, c.st)}
${halo(c, 236, 66, 46)}
${focus(c, house(c, 222, 76, 1.2) + house(c, 254, 72, 1.4) + P('M276 70 V44 L290 50 L276 56', `hsl(${c.h} 70% 50%)`, c.st, W1))}
${ground(c)}${person(c, 60, GROUND, 0.9, { arm: 'out', hold: 'staff' })}${person(c, 96, GROUND, 0.85, { hold: 'bucket' })}${goat(c, 124, GROUND, 0.9)}${goat(c, 146, GROUND, 0.8)}`;
  return frame(c, 230, 60, body);
};

/** La croissance : un quartier neuf, échafaudages et maçons. */
const sceneCroissance: Scene = (_sp, c) => {
  const body = `${stars(c, 16, 44)}${skyline(c, GROUND - 2, -4, 120)}
${halo(c, 190, 76, 52)}
${focus(c, house(c, 176, GROUND, 1.9) + P('M196 112 V60 M224 112 V60 M196 74 H224 M196 92 H224 M196 74 L224 92', 'none', c.st, W2))}
${ground(c)}${person(c, 210, 74, 0.6, { arm: 'up' })}${person(c, 250, GROUND, 0.9, { hold: 'bucket', flip: true })}${maybeGoat(c, 140, GROUND, 0.8)}`;
  return frame(c, 190, 60, body);
};

const SCENES: Record<string, Scene> = {
  portrait: scenePortrait, crue: sceneCrue, ruines: sceneRuines, feu: sceneFeu, ciel: sceneCiel, marche: sceneMarche,
  armee: sceneArmee, temple: sceneTemple, savoir: sceneSavoir, machine: sceneMachine, cour: sceneCour, champs: sceneChamps,
  port: scenePort, route: sceneRoute, village: sceneVillage, lieu: sceneLieu, crise: sceneCrise, decouverte: sceneDecouverte,
  colonie: sceneColonie, croissance: sceneCroissance,
};

/** Quelle scène pour quel motif d'événement. */
export const MOTIF_SCENE: Record<string, [string, string?]> = {
  wave: ['crue'], flame: ['feu'], comet: ['ciel', 'comet'], star: ['ciel', 'star'], sun: ['ciel', 'sun'], moon: ['ciel', 'moon'],
  coin: ['marche'], scales: ['marche', 'scales'], key: ['marche', 'key'], fang: ['armee'], shield: ['armee', 'shield'],
  eye: ['temple', 'eye'], bell: ['temple', 'bell'], spiral: ['temple', 'spiral'], scroll: ['savoir'], gear: ['machine'],
  crown: ['cour', 'crown'], ring: ['cour', 'ring'], hand: ['cour', 'hand'], mask: ['cour', 'mask'], wheat: ['champs'],
  leaf: ['champs', 'leaf'], bird: ['champs'], ship: ['port'], road: ['route'], skull: ['ruines'], arch: ['ruines'],
  house: ['village', 'house'], tower: ['village', 'tower'], mountain: ['village', 'mountain'],
};

export function illustration(sp: IllusSpec): string {
  const c = ctxFor(sp);
  return (SCENES[sp.scene] ?? sceneVillage)(sp, c);
}

/** Un échantillon de toutes les scènes, pour la planche (scripts/illus.ts tout). */
export const SAMPLES: { title: string; spec: IllusSpec }[] = [
  ...(['ourk', 'sel', 'brume', 'troc', 'rival'] as PortraitFam[]).map((fam, i) => ({ title: `portrait ${fam}`, spec: { key: `p${fam}`, era: i % 5, hue: [8, 44, 205, 150, 280][i], scene: 'portrait', fam, mood: [1, 2, 0, -1, 0][i], rivalHue: 300 } })),
  ...Object.entries(MOTIF_SCENE).map(([m, [scene, variant]], i) => ({ title: `${m} → ${scene}`, spec: { key: `m${m}`, era: i % 5, hue: (i * 47) % 360, scene, variant } })),
  ...['camp_ourk', 'grotte_sel', 'rocher_brume', 'comptoir_troc', 'frontiere', 'inconnu'].map((v, i) => ({ title: `lieu ${v}`, spec: { key: `l${v}`, era: i % 5, hue: [8, 44, 205, 150, 30, 260][i], scene: 'lieu', variant: v } })),
  ...['horde', 'hiver', 'peste', 'incendie', 'revolte', 'schisme', 'guerre', 'krach', 'filtre', 'eveil'].map((v, i) => ({ title: `crise ${v}`, spec: { key: `c${v}`, era: Math.floor(i / 2), hue: 8, scene: 'crise', variant: v, alarm: true } })),
  { title: 'découverte', spec: { key: 'dgear', era: 3, hue: 205, scene: 'decouverte', variant: 'gear' } },
  { title: 'colonie', spec: { key: 'col', era: 1, hue: 40, scene: 'colonie' } },
  { title: 'croissance', spec: { key: 'cro', era: 2, hue: 30, scene: 'croissance' } },
  { title: 'revenants', spec: { key: 'rev', era: 2, hue: 270, scene: 'ruines', variant: 'revenant' } },
];
