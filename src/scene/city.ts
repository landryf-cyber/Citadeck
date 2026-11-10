/**
 * La civilisation visible : un agencement déterministe (fonction de la graine et de l'état)
 * et des silhouettes dessinées par code. Aucune mécanique : tout est décor.
 */
import { Rng, hashString } from '../core/rng';
import { KEYWORDS, type Gauges } from '../core/types';

export interface CivSnapshot {
  seed: number;
  era: number;
  growth: number;
  gauges: Gauges;
  /** cartes par mot-clé, dans l'ordre de KEYWORDS */
  kw: number[];
  wonders: string[];
}

export type ElemKind = 'dwelling' | 'sig' | 'wonder' | 'wall' | 'field' | 'stall' | 'granary' | 'heart';

export interface Elem {
  key: string;
  kind: ElemKind;
  /** sous-type : mot-clé pour 'sig', id pour 'wonder' */
  sub: string;
  /** position horizontale 0..1 */
  x: number;
  /** 0 = lointain, 1 = milieu, 2 = proche, 3 = premier plan (champs) */
  layer: number;
  size: number;
  r: number;
  r2: number;
  /** indice d'ancienneté (0 = plus ancien) */
  age: number;
  /** état visuel dépendant des jauges */
  state: number;
}

interface Slots {
  dwell: { x: number; layer: number; r: number; r2: number }[];
  special: { x: number; layer: number; r: number; r2: number }[];
  wonder: { x: number; r: number }[];
  wallOrder: number[];
  fieldOrder: number[];
  stallOrder: number[];
}

const slotCache = new Map<number, Slots>();

function slotsFor(seed: number): Slots {
  const cached = slotCache.get(seed);
  if (cached) return cached;
  const rng = new Rng((seed ^ 0x5eed1e) >>> 0);
  const N = 44;
  const dwell: Slots['dwell'] = [];
  for (let i = 0; i < N; i++) {
    const x = 0.02 + ((i + 0.5 + rng.range(-0.35, 0.35)) / N) * 0.96;
    dwell.push({ x, layer: rng.chance(0.5) ? 1 : 2, r: rng.next(), r2: rng.next() });
  }
  // le village pousse autour du feu : priorité à la proximité du centre, avec du bruit
  const noise = dwell.map(() => rng.range(0, 0.22));
  const order = dwell.map((_, i) => i).sort((a, b) => Math.abs(dwell[a].x - 0.5) + noise[a] - (Math.abs(dwell[b].x - 0.5) + noise[b]));
  const dwellSorted = order.map((i) => dwell[i]);

  const S = 24;
  const special: Slots['special'] = [];
  for (let i = 0; i < S; i++) {
    const x = 0.04 + ((i + 0.5 + rng.range(-0.3, 0.3)) / S) * 0.92;
    special.push({ x, layer: i % 2 === 0 ? 0 : 1, r: rng.next(), r2: rng.next() });
  }
  rng.shuffle(special);

  const wonder: Slots['wonder'] = [];
  for (let i = 0; i < 12; i++) {
    wonder.push({ x: 0.07 + ((i + 0.5 + rng.range(-0.25, 0.25)) / 12) * 0.86, r: rng.next() });
  }
  rng.shuffle(wonder);

  const seq = (n: number) => rng.shuffle(Array.from({ length: n }, (_, i) => i));
  const s: Slots = { dwell: dwellSorted, special, wonder, wallOrder: seq(12), fieldOrder: seq(8), stallOrder: seq(6) };
  slotCache.set(seed, s);
  return s;
}

/** Ordre stable des merveilles, pour leur attribuer un emplacement fixe. */
export const WONDER_ORDER = [
  'w_pierres', 'w_pyramide', 'w_phare', 'w_bibliotheque', 'w_muraille', 'w_jardins',
  'w_colisee', 'w_cathedrale', 'w_universite', 'w_horloge', 'w_barrage', 'w_ascenseur',
];

export function layoutCity(s: CivSnapshot): Elem[] {
  const slots = slotsFor(s.seed);
  const out: Elem[] = [];
  const g = s.gauges;

  // cœur de la cité : feu de camp, puis place
  out.push({ key: 'heart', kind: 'heart', sub: '', x: 0.5, layer: 2, size: 1, r: 0.5, r2: 0.5, age: 0, state: 0 });

  // habitations
  const nDwell = Math.min(slots.dwell.length, Math.floor(4 + s.era * 5 + s.growth * 0.2));
  for (let i = 0; i < nDwell; i++) {
    const d = slots.dwell[i];
    out.push({ key: `d${i}`, kind: 'dwelling', sub: '', x: d.x, layer: d.layer, size: 1, r: d.r, r2: d.r2, age: i / slots.dwell.length, state: 0 });
  }

  // bâtiments-signatures par mot-clé
  KEYWORDS.forEach((k, ki) => {
    const n = Math.min(4, s.kw[ki] ?? 0);
    for (let i = 0; i < n; i++) {
      const sp = slots.special[ki * 4 + i];
      out.push({ key: `s${k}${i}`, kind: 'sig', sub: k, x: sp.x, layer: sp.layer, size: 1 + i * 0.12, r: sp.r, r2: sp.r2, age: i / 4, state: 0 });
    }
  });

  // merveilles
  for (const w of s.wonders) {
    const wi = WONDER_ORDER.indexOf(w);
    if (wi < 0) continue;
    const ws = slots.wonder[wi];
    out.push({ key: w, kind: 'wonder', sub: w, x: ws.x, layer: 0, size: 1, r: ws.r, r2: 0, age: 0, state: 0 });
  }

  // remparts (armée)
  const nWall = Math.round((g.army / 100) * 12);
  for (let i = 0; i < nWall; i++) {
    const idx = slots.wallOrder[i];
    out.push({ key: `w${idx}`, kind: 'wall', sub: '', x: (idx + 0.5) / 12, layer: 1.5, size: 1, r: (idx * 0.37) % 1, r2: 0, age: i / 12, state: g.army <= 20 ? 1 : g.army >= 80 ? 2 : 0 });
  }

  // champs (nourriture)
  const nField = Math.max(1, Math.round((g.food / 100) * 8));
  for (let i = 0; i < nField; i++) {
    const idx = slots.fieldOrder[i];
    out.push({ key: `f${idx}`, kind: 'field', sub: '', x: (idx + 0.5) / 8, layer: 3, size: 1, r: (idx * 0.61) % 1, r2: 0, age: 0, state: g.food <= 20 ? 1 : g.food >= 80 ? 2 : 0 });
  }
  const nGran = g.food >= 70 ? 2 : g.food >= 40 ? 1 : 0;
  for (let i = 0; i < nGran; i++) {
    out.push({ key: `g${i}`, kind: 'granary', sub: '', x: i === 0 ? 0.36 : 0.67, layer: 2, size: 1, r: 0.3 + i * 0.4, r2: 0, age: 0, state: 0 });
  }

  // étals (trésor)
  const nStall = Math.round((g.treasure / 100) * 6);
  for (let i = 0; i < nStall; i++) {
    const idx = slots.stallOrder[i];
    out.push({ key: `m${idx}`, kind: 'stall', sub: '', x: 0.1 + (idx / 5) * 0.8 + 0.03 * Math.sin(idx * 9.1), layer: 2.5, size: 1, r: (idx * 0.43) % 1, r2: 0, age: 0, state: g.treasure >= 80 ? 2 : 0 });
  }

  return out;
}

// ====================================================================== dessin

export interface DrawEnv {
  ctx: CanvasRenderingContext2D;
  era: number;
  t: number;
  /** couleurs résolues */
  body: string;
  window: string;
  accent: string;
  gold: string;
  crop: string;
  /** fraction de fenêtres allumées 0..1 */
  lit: number;
  /** fraction de dorures 0..1 */
  gilded: number;
  /** intensité du scintillement 0..1 */
  flicker: number;
  /** points d'émission (fumée, braises), en coordonnées locales */
  emit: (x: number, y: number, type: 'smoke' | 'ember' | 'beam' | 'climb' | 'blink') => void;
}

type Light = [number, number, number, number, number, number]; // x, y, w, h, kind(0 fenêtre,1 accent,2 or,3 toujours allumé), forme(0 rect,1 cercle)

let lights: Light[] = [];
let wseed = 0;

function h01(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d) >>> 0;
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39) >>> 0;
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296;
}

const W = (x: number, y: number, w: number, h: number, kind = 0, shape = 0) => lights.push([x, y, w, h, kind, shape]);

function grid(x0: number, y0: number, w: number, h: number, cols: number, rows: number, ww: number, wh: number, kind = 0): void {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = x0 + ((c + 0.5) / cols) * w - ww / 2;
      const cy = y0 + ((r + 0.5) / rows) * h - wh / 2;
      W(cx, cy, ww, wh, kind);
    }
  }
}

function poly(ctx: CanvasRenderingContext2D, pts: number[]): void {
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
}

function crenel(ctx: CanvasRenderingContext2D, x0: number, y: number, w: number, n: number, h: number): void {
  const step = w / (n * 2 - 1);
  for (let i = 0; i < n; i++) ctx.rect(x0 + i * 2 * step, y, step, h);
}

function dome(ctx: CanvasRenderingContext2D, cx: number, y: number, r: number, squash = 1): void {
  ctx.moveTo(cx - r, y);
  ctx.ellipse(cx, y, r, r * squash, 0, Math.PI, 0, true);
  ctx.closePath();
}

function blob(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.moveTo(cx + r, cy);
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
}

// ---------------------------------------------------------------------- habitations

function dwelling(env: DrawEnv, e: Elem): void {
  const { ctx, era } = env;
  const r = e.r;
  const r2 = e.r2;
  const old = 1 - e.age;
  if (era === 0) {
    if (r < 0.5) {
      // tipi
      const w = 1.9 + r2 * 0.6;
      const h = 2.0 + r * 1.2;
      poly(ctx, [-w / 2, 0, 0, h, w / 2, 0]);
      poly(ctx, [-0.08, h - 0.1, -0.35, h + 0.5, -0.25, h + 0.5, 0, h - 0.05]);
      poly(ctx, [0.08, h - 0.1, 0.35, h + 0.5, 0.25, h + 0.5, 0, h - 0.05]);
      W(-0.22, 0, 0.44, 0.7, 0);
    } else {
      // hutte ronde
      const w = 2.2 + r2 * 0.8;
      dome(ctx, 0, 0, w / 2, 0.75 + r * 0.2);
      W(-0.25, 0, 0.5, 0.6, 0);
    }
    return;
  }
  if (era === 1) {
    const w = 2.2 + r2 * 0.9;
    const h = 1.5 + r * 1.3 + old * 0.5;
    ctx.rect(-w / 2, 0, w, h);
    ctx.rect(-w / 2 - 0.08, h, w + 0.16, 0.14);
    if (r > 0.55) {
      const w2 = w * 0.55;
      const off = (r2 - 0.5) * 0.6;
      ctx.rect(off - w2 / 2, h, w2, 0.9 + r2 * 0.5);
      W(off - 0.15, h + 0.3, 0.3, 0.35);
    } else if (r < 0.2) {
      poly(ctx, [-w / 2 - 0.15, h + 0.14, 0, h + 0.75, w / 2 + 0.15, h + 0.14]);
    }
    grid(-w / 2 + 0.2, h * 0.35, w - 0.4, h * 0.5, 2, 1, 0.3, 0.38);
    W(-0.18, 0, 0.36, 0.6);
    return;
  }
  if (era === 2) {
    const w = 1.9 + r2 * 0.7;
    const h = 1.4 + r * 1.2 + old * 0.6;
    const roof = 1.2 + r2 * 0.8;
    ctx.rect(-w / 2, 0, w, h);
    poly(ctx, [-w / 2 - 0.22, h, 0, h + roof, w / 2 + 0.22, h]);
    if (r > 0.4) ctx.rect(w * 0.18, h + roof * 0.3, 0.3, roof * 0.6);
    grid(-w / 2 + 0.15, h * 0.3, w - 0.3, h * 0.55, 2, h > 2.2 ? 2 : 1, 0.28, 0.36);
    if (r > 0.7) W(-0.14, h + roof * 0.25, 0.28, 0.3);
    return;
  }
  if (era === 3) {
    if (r < 0.22) {
      // usine à sheds
      const w = 4 + r2 * 1.5;
      const h = 1.8 + r * 2;
      ctx.rect(-w / 2, 0, w, h);
      const n = 3;
      for (let i = 0; i < n; i++) {
        const x0 = -w / 2 + (i * w) / n;
        poly(ctx, [x0, h, x0, h + 0.8, x0 + w / n, h]);
      }
      const cx = w / 2 - 0.5;
      const ch = h + 2.6 + r2 * 2.4;
      poly(ctx, [cx - 0.28, 0, cx - 0.2, ch, cx + 0.2, ch, cx + 0.28, 0]);
      ctx.rect(cx - 0.28, ch - 0.25, 0.56, 0.14);
      env.emit(cx, ch, 'smoke');
      grid(-w / 2 + 0.25, h * 0.3, w - 1.4, h * 0.45, 4, 1, 0.42, 0.5);
      return;
    }
    const w = 2.1 + r2 * 0.8;
    const h = 2.4 + r * 1.6 + old * 1.2;
    ctx.rect(-w / 2, 0, w, h);
    if (r > 0.6) poly(ctx, [-w / 2 - 0.1, h, 0, h + 0.7, w / 2 + 0.1, h]);
    else ctx.rect(-w / 2 - 0.1, h, w + 0.2, 0.16);
    ctx.rect(-w * 0.3, h, 0.3, 0.75 + r2 * 0.5);
    if (r2 > 0.5) ctx.rect(w * 0.15, h, 0.26, 0.6);
    if (r2 > 0.8) env.emit(-w * 0.3 + 0.15, h + 0.9 + r2 * 0.5, 'smoke');
    grid(-w / 2 + 0.2, 0.5, w - 0.4, h - 0.8, 2, Math.max(2, Math.round(h / 1.1)), 0.3, 0.42);
    return;
  }
  // ère spatiale : tours
  const w = 1.5 + r2 * 0.9;
  const h = 3.6 + r * 3.4 + old * 3.2;
  if (r < 0.33) {
    ctx.rect(-w / 2, 0, w, h);
    poly(ctx, [-w / 2, h, -w / 2, h + 0.9, w / 2, h]);
  } else if (r < 0.66) {
    ctx.rect(-w / 2, 0, w, h * 0.7);
    ctx.rect(-w * 0.34, h * 0.7, w * 0.68, h * 0.22);
    ctx.rect(-w * 0.18, h * 0.92, w * 0.36, h * 0.08);
  } else {
    poly(ctx, [-w / 2, 0, -w * 0.38, h, w * 0.38, h, w / 2, 0]);
    ctx.rect(-w * 0.38, h, w * 0.76, 0.12);
  }
  ctx.rect(-0.04, h, 0.08, 1 + r2 * 1.4);
  W(-0.09, h + 0.95 + r2 * 1.4, 0.18, 0.18, 1, 1);
  const rows = Math.max(3, Math.round(h / 0.75));
  const top = r < 0.33 ? h : r < 0.66 ? h * 0.7 : h * 0.95;
  for (let i = 0; i < rows; i++) {
    const y = 0.4 + (i / rows) * (top - 0.6);
    const ww = (r >= 0.66 ? w * (0.82 - (i / rows) * 0.2) : w * 0.78);
    W(-ww / 2, y, ww * 0.44, 0.16);
    W(ww * 0.06, y, ww * 0.44, 0.16);
  }
  if (r2 > 0.45) W(w / 2 - 0.1, 0.3, 0.07, top * 0.8, 1);
}

// ---------------------------------------------------------------------- signatures

function sigFoi(env: DrawEnv, e: Elem): void {
  const { ctx, era } = env;
  if (era === 0) {
    // menhir et autel
    poly(ctx, [-0.5, 0, -0.35, 3.2 + e.r, 0.2, 3.5 + e.r, 0.5, 0]);
    ctx.rect(-1.5, 0, 0.7, 0.5);
    ctx.rect(1, 0, 0.6, 0.8);
    W(-1.3, 0.5, 0.3, 0.35, 3);
    return;
  }
  if (era === 1) {
    // temple à colonnes
    ctx.rect(-2.4, 0, 4.8, 0.35);
    for (let i = 0; i < 6; i++) ctx.rect(-2.2 + i * 0.84, 0.35, 0.28, 2.4);
    ctx.rect(-2.4, 2.75, 4.8, 0.3);
    poly(ctx, [-2.5, 3.05, 0, 4.2, 2.5, 3.05]);
    for (let i = 0; i < 5; i++) W(-1.86 + i * 0.84, 0.4, 0.44, 2.2, 0);
    W(-0.16, 3.25, 0.32, 0.32, 2, 1);
    return;
  }
  if (era === 4) {
    // flèche à halo
    poly(ctx, [-1.4, 0, -0.9, 2.6, 0.9, 2.6, 1.4, 0]);
    poly(ctx, [-0.5, 2.6, 0, 9.5 + e.r * 2, 0.5, 2.6]);
    W(-0.14, 0.4, 0.28, 1.8, 3);
    W(-0.9, 6.2, 1.8, 0.1, 1);
    W(-0.6, 7.2, 1.2, 0.08, 1);
    return;
  }
  // église (médiévale / industrielle)
  const th = era === 2 ? 5.4 + e.r : 6.4 + e.r;
  ctx.rect(-0.2, 0, 3.2, 2.5);
  poly(ctx, [-0.4, 2.5, 1.4, 3.9, 3.2, 2.5]);
  ctx.rect(-1.6, 0, 1.5, th * 0.62);
  poly(ctx, [-1.75, th * 0.62, -0.85, th + 1.4, 0.05, th * 0.62]);
  ctx.rect(-0.9, th + 1.3, 0.1, 0.7);
  ctx.rect(-1.12, th + 1.6, 0.54, 0.1);
  W(-1.1, th * 0.34, 0.5, 0.9, 3);
  grid(0.1, 0.7, 2.7, 1.3, 3, 1, 0.34, 1.0, 1);
  W(1.15, 2.75, 0.5, 0.5, 1, 1);
}

function sigGuerre(env: DrawEnv, e: Elem): void {
  const { ctx, era, t } = env;
  const flag = (x: number, y: number, s = 1) => {
    ctx.rect(x - 0.04, y, 0.08, 1.5 * s);
    const wv = Math.sin(t * 2.4 + e.r * 9) * 0.12;
    poly(ctx, [x, y + 1.5 * s, x + 0.9 * s, y + 1.25 * s + wv, x, y + 0.95 * s]);
  };
  if (era === 0) {
    // mirador en rondins
    ctx.rect(-0.9, 0, 0.16, 3);
    ctx.rect(0.74, 0, 0.16, 3);
    poly(ctx, [-0.9, 0.4, -0.76, 0.4, 0.9, 2.4, 0.76, 2.4]);
    ctx.rect(-1.2, 3, 2.4, 0.2);
    ctx.rect(-1.2, 3.2, 0.14, 0.8);
    ctx.rect(1.06, 3.2, 0.14, 0.8);
    poly(ctx, [-1.4, 4, 0, 4.9, 1.4, 4]);
    for (let i = 0; i < 5; i++) poly(ctx, [-2.4 + i * 0.3, 0, -2.3 + i * 0.3, 1.3 + (i % 2) * 0.3, -2.2 + i * 0.3, 0]);
    return;
  }
  if (era === 1 || era === 2) {
    const h = era === 1 ? 4.2 + e.r : 5.2 + e.r * 1.5;
    const w = 2.2;
    ctx.rect(-w / 2, 0, w, h);
    ctx.rect(-w / 2 - 0.2, h, w + 0.4, 0.3);
    crenel(ctx, -w / 2 - 0.2, h + 0.3, w + 0.4, 4, 0.4);
    if (era === 2) {
      ctx.rect(1.1, 0, 2.2, 2.4);
      crenel(ctx, 1.1, 2.4, 2.2, 4, 0.35);
      poly(ctx, [-w / 2 - 0.3, h + 0.7, 0, h + 2.4, w / 2 + 0.3, h + 0.7]);
      flag(0, h + 2.3);
    } else {
      flag(0, h + 0.6);
    }
    W(-0.12, h * 0.55, 0.24, 0.6);
    W(-0.12, h * 0.25, 0.24, 0.6);
    return;
  }
  if (era === 3) {
    // fort et canons
    poly(ctx, [-3, 0, -2.4, 1.8, 2.4, 1.8, 3, 0]);
    ctx.rect(-1, 1.8, 2, 1.4);
    ctx.rect(-1.15, 3.2, 2.3, 0.2);
    poly(ctx, [1.6, 1.9, 3.6, 2.7, 3.7, 2.45, 1.7, 1.65]);
    poly(ctx, [-1.6, 1.9, -3.6, 2.7, -3.7, 2.45, -1.7, 1.65]);
    flag(0, 3.4, 1.2);
    grid(-0.8, 2.2, 1.6, 0.6, 3, 1, 0.26, 0.4);
    return;
  }
  // silo et radar
  poly(ctx, [-2.2, 0, -1.8, 1.4, 1.8, 1.4, 2.2, 0]);
  ctx.rect(-0.14, 1.4, 0.28, 2.2);
  ctx.save();
  ctx.translate(0, 3.9);
  ctx.rotate(0.5 + Math.sin(t * 0.4 + e.r * 6) * 0.25);
  ctx.moveTo(-1.5, 0.2);
  ctx.quadraticCurveTo(0, -1.1, 1.5, 0.2);
  ctx.lineTo(1.3, 0.3);
  ctx.quadraticCurveTo(0, -0.7, -1.3, 0.3);
  ctx.closePath();
  ctx.rect(-0.04, 0, 0.08, 0.9);
  ctx.restore();
  poly(ctx, [2.6, 0, 2.75, 3.4, 3.0, 4.2, 3.25, 3.4, 3.4, 0]);
  W(2.93, 3.5, 0.14, 0.14, 1, 1);
  W(-1.4, 0.5, 2.8, 0.12, 1);
}

function sigCommerce(env: DrawEnv, e: Elem): void {
  const { ctx, era } = env;
  if (era === 0) {
    // séchoir et étal
    ctx.rect(-1.5, 0, 0.12, 2);
    ctx.rect(1.38, 0, 0.12, 2);
    ctx.rect(-1.6, 1.9, 3.2, 0.12);
    for (let i = 0; i < 5; i++) poly(ctx, [-1.2 + i * 0.6, 1.9, -1.05 + i * 0.6, 1.1 - (i % 2) * 0.2, -0.9 + i * 0.6, 1.9]);
    ctx.rect(-2.6, 0, 0.8, 0.5);
    W(-2.4, 0.5, 0.3, 0.25, 2, 1);
    return;
  }
  if (era === 1) {
    ctx.rect(-2.6, 0, 5.2, 0.3);
    for (let i = 0; i < 5; i++) ctx.rect(-2.4 + i * 1.15, 0.3, 0.22, 1.9);
    poly(ctx, [-2.8, 2.2, -2.6, 2.7, 2.6, 2.7, 2.8, 2.2]);
    for (let i = 0; i < 4; i++) {
      blob(ctx, -1.8 + i * 1.15, 0.62, 0.28);
      W(-1.92 + i * 1.15, 1.2, 0.24, 0.5, i % 2 ? 2 : 0);
    }
    return;
  }
  if (era === 2) {
    // halle couverte
    for (let i = 0; i < 5; i++) ctx.rect(-2.5 + i * 1.2, 0, 0.2, 1.6);
    poly(ctx, [-3, 1.6, -2.2, 3.4, 2.2, 3.4, 3, 1.6]);
    ctx.rect(-0.3, 3.4, 0.6, 0.7);
    poly(ctx, [-0.5, 4.1, 0, 4.8, 0.5, 4.1]);
    for (let i = 0; i < 4; i++) W(-2.1 + i * 1.2, 0.2, 0.7, 0.9, i % 2 ? 2 : 0);
    return;
  }
  if (era === 3) {
    // entrepôt et grue
    ctx.rect(-2.6, 0, 3.8, 2.6);
    poly(ctx, [-2.8, 2.6, -0.7, 3.5, 1.4, 2.6]);
    ctx.rect(2.2, 0, 0.22, 5.6);
    poly(ctx, [0.2, 5.4, 3.6, 5.4, 3.6, 5.62, 0.2, 5.62]);
    poly(ctx, [2.2, 5.6, 2.42, 5.6, 3.5, 6.4, 2.31, 6.6]);
    ctx.rect(0.5, 4.2, 0.05, 1.2);
    ctx.rect(0.3, 3.8, 0.45, 0.4);
    grid(-2.3, 0.5, 3.2, 1.6, 4, 2, 0.36, 0.42);
    return;
  }
  // tour logistique à enseigne
  ctx.rect(-1.3, 0, 2.6, 5.5 + e.r * 2);
  const h = 5.5 + e.r * 2;
  ctx.rect(-1.9, h * 0.55, 0.6, 0.2);
  ctx.rect(1.3, h * 0.3, 0.7, 0.2);
  ctx.rect(-1.5, h, 3, 0.2);
  W(-0.95, h * 0.62, 1.9, 1.3, 1);
  for (let i = 0; i < 5; i++) W(-1.0, 0.4 + i * (h * 0.1), 2.0, 0.14, i % 2 ? 2 : 0);
  W(-2.1, h * 0.55 + 0.2, 0.3, 0.3, 2, 1);
}

function sigScience(env: DrawEnv, e: Elem): void {
  const { ctx, era } = env;
  if (era === 0) {
    // pierre gravée et perche d'observation
    poly(ctx, [-0.9, 0, -0.7, 2.2, 0.5, 2.5, 0.9, 0]);
    ctx.rect(1.6, 0, 0.1, 4.2);
    poly(ctx, [1.3, 4.2, 1.65, 4.9, 2.0, 4.2]);
    W(-0.25, 1.0, 0.5, 0.5, 3, 1);
    return;
  }
  if (era === 1) {
    // bibliothèque : colonnes et flamme
    ctx.rect(-2.2, 0, 4.4, 0.5);
    ctx.rect(-1.9, 0.5, 3.8, 2.6);
    ctx.rect(-2.2, 3.1, 4.4, 0.3);
    ctx.rect(-0.9, 3.4, 1.8, 0.9);
    dome(ctx, 0, 4.3, 0.9, 0.8);
    grid(-1.6, 0.8, 3.2, 2, 4, 1, 0.42, 1.7);
    W(-0.14, 5.1, 0.28, 0.4, 3);
    return;
  }
  if (era === 2) {
    // tour d'astronome
    ctx.rect(-0.9, 0, 1.8, 5 + e.r);
    const h = 5 + e.r;
    ctx.rect(-1.15, h, 2.3, 0.3);
    dome(ctx, 0, h + 0.3, 1.0, 1);
    ctx.rect(1.2, 0, 2, 2.2);
    poly(ctx, [1.0, 2.2, 2.2, 3.2, 3.4, 2.2]);
    W(-0.16, h * 0.7, 0.32, 0.6);
    W(-0.16, h * 0.4, 0.32, 0.6);
    W(1.9, 0.8, 0.5, 0.7);
    poly(ctx, [0.2, h + 0.9, 1.5, h + 2.0, 1.62, h + 1.85, 0.4, h + 0.75]);
    return;
  }
  if (era === 3) {
    // laboratoire : verrière et lunette
    ctx.rect(-2.4, 0, 4.8, 2.4);
    ctx.rect(-2.6, 2.4, 5.2, 0.2);
    dome(ctx, -0.9, 2.6, 1.3, 1);
    poly(ctx, [-1.0, 3.5, 0.6, 5.0, 0.85, 4.75, -0.7, 3.3]);
    ctx.rect(1.5, 2.6, 0.3, 2);
    env.emit(1.65, 4.7, 'smoke');
    grid(-2.1, 0.5, 4.2, 1.5, 6, 1, 0.42, 1.1);
    W(-1.5, 2.9, 1.2, 0.5, 0);
    return;
  }
  // grande antenne parabolique
  poly(ctx, [-1.6, 0, -1.2, 1.2, 1.2, 1.2, 1.6, 0]);
  ctx.rect(-0.2, 1.2, 0.4, 2.2);
  ctx.save();
  ctx.translate(0, 4.2);
  ctx.rotate(-0.55);
  ctx.moveTo(-2.4, 0.9);
  ctx.quadraticCurveTo(0, -1.9, 2.4, 0.9);
  ctx.lineTo(2.1, 1.0);
  ctx.quadraticCurveTo(0, -1.3, -2.1, 1.0);
  ctx.closePath();
  ctx.rect(-0.05, -0.4, 0.1, 2.2);
  ctx.restore();
  W(0.88, 5.75, 0.22, 0.22, 1, 1);
  W(-1.0, 0.4, 2.0, 0.14, 0);
}

function sigCulture(env: DrawEnv, e: Elem): void {
  const { ctx, era } = env;
  if (era === 0) {
    // totem peint
    ctx.rect(-0.35, 0, 0.7, 4 + e.r);
    const h = 4 + e.r;
    poly(ctx, [-1.3, h * 0.8, -0.35, h * 0.72, -0.35, h * 0.86]);
    poly(ctx, [1.3, h * 0.8, 0.35, h * 0.72, 0.35, h * 0.86]);
    poly(ctx, [-0.5, h, 0, h + 0.6, 0.5, h]);
    W(-0.17, h * 0.55, 0.34, 0.34, 1, 1);
    W(-0.17, h * 0.3, 0.34, 0.34, 2, 1);
    return;
  }
  if (era === 1) {
    // théâtre en gradins
    ctx.moveTo(-3, 0);
    ctx.lineTo(-3, 2.6);
    ctx.quadraticCurveTo(0, 0.4, 3, 2.6);
    ctx.lineTo(3, 0);
    ctx.closePath();
    ctx.rect(-3.2, 2.6, 0.5, 0.5);
    ctx.rect(2.7, 2.6, 0.5, 0.5);
    for (let i = 0; i < 5; i++) W(-2.4 + i * 1.07, 0.15, 0.5, 0.7, i === 2 ? 3 : 0);
    return;
  }
  if (era === 2) {
    // grande salle à rosace
    ctx.rect(-2, 0, 4, 3);
    poly(ctx, [-2.2, 3, 0, 5.2, 2.2, 3]);
    ctx.rect(-2.5, 0, 0.5, 3.8);
    ctx.rect(2, 0, 0.5, 3.8);
    poly(ctx, [-2.6, 3.8, -2.25, 4.8, -1.9, 3.8]);
    poly(ctx, [1.9, 3.8, 2.25, 4.8, 2.6, 3.8]);
    W(-0.55, 2.6, 1.1, 1.1, 1, 1);
    grid(-1.6, 0.5, 3.2, 1.5, 3, 1, 0.4, 1.2);
    return;
  }
  if (era === 3) {
    // opéra
    ctx.rect(-2.8, 0, 5.6, 2.6);
    poly(ctx, [-3, 2.6, 0, 3.6, 3, 2.6]);
    dome(ctx, 0, 3.2, 1.5, 0.9);
    ctx.rect(-0.06, 4.5, 0.12, 0.8);
    grid(-2.4, 0.4, 4.8, 1.8, 6, 1, 0.42, 1.4);
    W(-0.2, 3.5, 0.4, 0.4, 2, 1);
    return;
  }
  // coque lumineuse
  ctx.moveTo(-3.2, 0);
  ctx.bezierCurveTo(-3.2, 3.6, -0.5, 4.6, 0.6, 3.4);
  ctx.bezierCurveTo(1.6, 4.4, 3.2, 3.2, 3.2, 0);
  ctx.closePath();
  W(-2.4, 0.5, 4.8, 0.14, 1);
  W(-2.0, 1.2, 4.0, 0.12, 0);
  W(-1.4, 1.9, 2.9, 0.12, 0);
  W(-0.7, 2.6, 1.6, 0.1, 1);
}

function sigNature(env: DrawEnv, e: Elem): void {
  const { ctx, era } = env;
  const tree = (x: number, s: number, shape: number) => {
    ctx.rect(x - 0.1 * s, 0, 0.2 * s, 1.4 * s);
    if (shape === 0) {
      blob(ctx, x, 2.2 * s, 1.1 * s);
      blob(ctx, x - 0.7 * s, 1.7 * s, 0.7 * s);
      blob(ctx, x + 0.7 * s, 1.8 * s, 0.75 * s);
    } else if (shape === 1) {
      // cyprès
      ctx.moveTo(x - 0.5 * s, 0.6 * s);
      ctx.quadraticCurveTo(x - 0.6 * s, 3 * s, x, 4.6 * s);
      ctx.quadraticCurveTo(x + 0.6 * s, 3 * s, x + 0.5 * s, 0.6 * s);
      ctx.closePath();
    } else {
      // sapin
      poly(ctx, [x - 1.0 * s, 0.8 * s, x, 2.4 * s, x + 1.0 * s, 0.8 * s]);
      poly(ctx, [x - 0.8 * s, 1.7 * s, x, 3.2 * s, x + 0.8 * s, 1.7 * s]);
      poly(ctx, [x - 0.55 * s, 2.6 * s, x, 4.0 * s, x + 0.55 * s, 2.6 * s]);
    }
  };
  if (era === 4) {
    // biodôme
    dome(ctx, 0, 0, 2.6, 0.85);
    tree(-0.9, 0.6, 0);
    tree(0.8, 0.75, 0);
    W(-2.2, 0.15, 4.4, 0.1, 1);
    W(-0.1, 2.3, 0.2, 0.2, 1, 1);
    return;
  }
  const shape = era === 1 ? 1 : era === 2 ? (e.r > 0.5 ? 2 : 0) : 0;
  tree(-1.2, 0.9 + e.r * 0.4, shape);
  tree(0.3, 1.2 + e.r2 * 0.4, shape);
  tree(1.6, 0.8 + e.r * 0.3, era === 0 ? 2 : shape);
  if (era === 3) {
    // grille de parc
    for (let i = 0; i < 9; i++) ctx.rect(-2.4 + i * 0.6, 0, 0.06, 0.9);
    ctx.rect(-2.4, 0.7, 4.9, 0.06);
  }
}

// ---------------------------------------------------------------------- merveilles

function wonder(env: DrawEnv, e: Elem): void {
  const { ctx, t } = env;
  switch (e.sub) {
    case 'w_pierres': {
      for (let i = 0; i < 6; i++) {
        const x = -3.2 + i * 1.28;
        const h = 2.6 + ((i * 7) % 3) * 0.5;
        poly(ctx, [x - 0.3, 0, x - 0.22, h, x + 0.25, h + 0.1, x + 0.32, 0]);
      }
      ctx.rect(-2.3, 3.1, 1.9, 0.35);
      ctx.rect(1.55, 3.1, 1.9, 0.35);
      W(-0.2, 0.2, 0.4, 0.4, 3, 1);
      break;
    }
    case 'w_pyramide': {
      poly(ctx, [-5.2, 0, 0, 6.4, 5.2, 0]);
      poly(ctx, [-7.4, 0, -4.9, 3.0, -2.4, 0]);
      W(-0.5, 5.75, 1.0, 0.1, 2);
      W(-0.16, 5.9, 0.32, 0.32, 2, 1);
      W(-0.2, 0, 0.4, 0.7, 3);
      break;
    }
    case 'w_phare': {
      poly(ctx, [-1.6, 0, -1.3, 1.4, 1.3, 1.4, 1.6, 0]);
      poly(ctx, [-0.9, 1.4, -0.55, 8.4, 0.55, 8.4, 0.9, 1.4]);
      ctx.rect(-0.85, 8.4, 1.7, 0.2);
      ctx.rect(-0.5, 8.6, 1.0, 1.0);
      poly(ctx, [-0.7, 9.6, 0, 10.5, 0.7, 9.6]);
      W(-0.36, 8.72, 0.72, 0.76, 3);
      W(-0.12, 3, 0.24, 0.5);
      W(-0.12, 5.4, 0.24, 0.5);
      env.emit(0, 9.1, 'beam');
      break;
    }
    case 'w_bibliotheque': {
      ctx.rect(-4.6, 0, 9.2, 0.6);
      ctx.rect(-4.2, 0.6, 8.4, 0.3);
      for (let i = 0; i < 9; i++) ctx.rect(-4.0 + i * 0.97, 0.9, 0.3, 3.2);
      ctx.rect(-4.3, 4.1, 8.6, 0.4);
      poly(ctx, [-4.5, 4.5, 0, 6.2, 4.5, 4.5]);
      for (let i = 0; i < 8; i++) W(-3.62 + i * 0.97, 1.0, 0.52, 3.0, i % 3 === 1 ? 3 : 0);
      W(-0.3, 4.8, 0.6, 0.6, 2, 1);
      break;
    }
    case 'w_muraille': {
      ctx.rect(-8, 0, 16, 1.6);
      crenel(ctx, -8, 1.6, 16, 24, 0.35);
      for (const x of [-6.5, -1.5, 3.2, 7]) {
        ctx.rect(x - 0.8, 0, 1.6, 3.2);
        crenel(ctx, x - 0.9, 3.2, 1.8, 3, 0.35);
        poly(ctx, [x - 1.1, 3.55, x, 4.3, x + 1.1, 3.55]);
        W(x - 0.14, 2.0, 0.28, 0.5, 3);
      }
      break;
    }
    case 'w_jardins': {
      ctx.rect(-4.6, 0, 9.2, 1.5);
      ctx.rect(-3.4, 1.5, 6.8, 1.4);
      ctx.rect(-2.2, 2.9, 4.4, 1.3);
      ctx.rect(-1.0, 4.2, 2.0, 1.1);
      const bl = (x: number, y: number, r: number) => { blob(ctx, x, y, r); };
      bl(-4.0, 1.9, 0.6); bl(-3.9, 1.3, 0.35); bl(3.9, 1.9, 0.65); bl(4.3, 1.2, 0.3);
      bl(-2.8, 3.3, 0.55); bl(2.8, 3.3, 0.6); bl(-1.6, 4.6, 0.5); bl(1.6, 4.6, 0.5); bl(0, 5.8, 0.7);
      ctx.rect(-0.06, 5.2, 0.12, 0.5);
      for (let i = 0; i < 5; i++) W(-3.8 + i * 1.8, 0.3, 0.5, 0.8, i % 2 ? 0 : 3);
      for (let i = 0; i < 3; i++) W(-2.4 + i * 2.1, 1.75, 0.45, 0.8, 0);
      W(-0.05, 0, 0.1, 4.2, 1);
      break;
    }
    case 'w_colisee': {
      ctx.moveTo(-5, 0);
      ctx.lineTo(-5, 3.6);
      ctx.quadraticCurveTo(0, 4.8, 5, 3.6);
      ctx.lineTo(5, 0);
      ctx.closePath();
      poly(ctx, [2.2, 4.3, 5, 3.6, 5, 5.2, 3.4, 5.6]);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) W(-4.5 + c * 1.04, 0.3 + r * 1.15, 0.58, 0.8, (c + r) % 4 === 0 ? 3 : 0);
      break;
    }
    case 'w_cathedrale': {
      ctx.rect(-1.9, 0, 3.8, 5);
      poly(ctx, [-2.1, 5, 0, 7.2, 2.1, 5]);
      for (const s of [-1, 1]) {
        ctx.rect(s * 2.9 - 0.95, 0, 1.9, 7.4);
        poly(ctx, [s * 2.9 - 1.1, 7.4, s * 2.9, 11, s * 2.9 + 1.1, 7.4]);
        ctx.rect(s * 2.9 - 0.05, 10.9, 0.1, 0.8);
        W(s * 2.9 - 0.25, 5.2, 0.5, 1.5, 3);
        W(s * 2.9 - 0.25, 2.6, 0.5, 1.5, 0);
      }
      W(-0.85, 3.5, 1.7, 1.7, 1, 1);
      W(-0.45, 0, 0.9, 1.8, 3);
      for (let i = 0; i < 3; i++) W(-1.4 + i * 1.1, 2.0, 0.5, 1.1, 1);
      // arcs-boutants
      poly(ctx, [-5.6, 0, -5.4, 3.4, -3.85, 4.6, -3.85, 4.2, -5.0, 3.2, -4.9, 0]);
      poly(ctx, [5.6, 0, 5.4, 3.4, 3.85, 4.6, 3.85, 4.2, 5.0, 3.2, 4.9, 0]);
      break;
    }
    case 'w_universite': {
      ctx.rect(-5, 0, 10, 2.8);
      ctx.rect(-5.2, 2.8, 10.4, 0.25);
      ctx.rect(-1.8, 2.8, 3.6, 1.6);
      ctx.rect(-2, 4.4, 4, 0.25);
      dome(ctx, 0, 4.65, 1.7, 1.05);
      ctx.rect(-0.2, 6.4, 0.4, 0.7);
      poly(ctx, [-0.3, 7.1, 0, 7.8, 0.3, 7.1]);
      grid(-4.6, 0.5, 9.2, 1.9, 9, 1, 0.5, 1.4);
      grid(-1.4, 3.1, 2.8, 1.0, 3, 1, 0.4, 0.8, 3);
      W(-0.14, 6.55, 0.28, 0.4, 2);
      break;
    }
    case 'w_horloge': {
      ctx.rect(-1.5, 0, 3, 2);
      ctx.rect(-1.0, 2, 2, 6.4);
      ctx.rect(-1.25, 8.4, 2.5, 0.25);
      ctx.rect(-1.1, 8.65, 2.2, 2.0);
      poly(ctx, [-1.3, 10.65, 0, 13, 1.3, 10.65]);
      ctx.rect(-0.05, 12.9, 0.1, 0.9);
      W(-0.75, 8.9, 1.5, 1.5, 3, 1);
      for (let i = 0; i < 4; i++) W(-0.15, 2.6 + i * 1.4, 0.3, 0.7, 0);
      W(-0.9, 0.4, 1.8, 1.0, 0);
      break;
    }
    case 'w_barrage': {
      poly(ctx, [-6, 0, -4.6, 4.6, 4.6, 4.6, 6, 0]);
      ctx.rect(-4.8, 4.6, 9.6, 0.25);
      for (let i = 0; i < 6; i++) ctx.rect(-4.3 + i * 1.6, 4.85, 0.5, 0.5);
      ctx.rect(4.4, 0, 1.6, 1.6);
      for (let i = 0; i < 5; i++) W(-3.3 + i * 1.6, 0.2, 0.22, 3.9 - Math.abs(i - 2) * 0.2, 1);
      W(4.7, 0.4, 1.0, 0.7, 3);
      W(-4.5, 4.95, 9.0, 0.08, 2);
      break;
    }
    case 'w_ascenseur': {
      poly(ctx, [-2.6, 0, -1.6, 2.2, 1.6, 2.2, 2.6, 0]);
      poly(ctx, [-1.2, 2.2, -0.5, 4.6, 0.5, 4.6, 1.2, 2.2]);
      ctx.rect(-0.07, 4.6, 0.14, 90);
      ctx.rect(-0.9, 4.6, 1.8, 0.16);
      W(-1.6, 0.6, 3.2, 0.16, 1);
      W(-0.9, 2.8, 1.8, 0.12, 1);
      W(-0.2, 3.6, 0.4, 0.4, 3, 1);
      env.emit(0, 4.8, 'climb');
      void t;
      break;
    }
  }
}

// ---------------------------------------------------------------------- décor des jauges

function wall(env: DrawEnv, e: Elem): void {
  const { ctx, era, t } = env;
  const cracked = e.state === 1;
  const proud = e.state === 2;
  const w = 3.6;
  if (era === 0) {
    // palissade de pieux
    for (let i = 0; i < 9; i++) {
      if (cracked && (i === 3 || i === 6)) continue;
      const x = -w / 2 + i * (w / 9);
      const h = 1.3 + ((i * 5 + Math.floor(e.r * 10)) % 3) * 0.22 - (cracked && i % 2 ? 0.5 : 0);
      poly(ctx, [x, 0, x, h, x + 0.2, h + 0.35, x + 0.4, h, x + 0.4, 0]);
    }
  } else if (era === 4) {
    // barrière énergétique
    ctx.rect(-w / 2, 0, 0.3, 1.9);
    ctx.rect(w / 2 - 0.3, 0, 0.3, 1.9);
    ctx.rect(-w / 2, 0, w, 0.3);
    if (!cracked) {
      W(-w / 2 + 0.3, 0.75, w - 0.6, 0.08, 1);
      W(-w / 2 + 0.3, 1.35, w - 0.6, 0.08, 1);
    }
    W(-w / 2 + 0.07, 1.9, 0.16, 0.16, 1, 1);
  } else {
    const h = era === 1 ? 1.5 : era === 2 ? 1.9 : 1.6;
    if (cracked) {
      poly(ctx, [-w / 2, 0, -w / 2, h, -0.5, h, -0.2, h * 0.45, 0.1, h * 0.7, 0.3, 0]);
      poly(ctx, [0.9, 0, 1.0, h * 0.6, 1.3, h, w / 2, h, w / 2, 0]);
    } else {
      ctx.rect(-w / 2, 0, w, h);
      crenel(ctx, -w / 2, h, w, 6, 0.32);
    }
    if (e.r > 0.5 && !cracked) {
      ctx.rect(-0.7, 0, 1.4, h + 1.1);
      crenel(ctx, -0.8, h + 1.1, 1.6, 3, 0.3);
      W(-0.1, h * 0.7, 0.2, 0.45, 0);
    }
  }
  if ((proud || e.r < 0.5) && !cracked && era !== 4) {
    const x = e.r < 0.5 ? 0.9 : -1.2;
    const base = era === 0 ? 1.4 : 1.9;
    ctx.rect(x - 0.03, base, 0.06, 1.3);
    const wv = Math.sin(t * 2.6 + e.r * 20) * 0.1;
    poly(ctx, [x, base + 1.3, x + 0.75, base + 1.1 + wv, x, base + 0.85]);
  }
}

function field(env: DrawEnv, e: Elem): void {
  // dessiné à part (traits), voir drawField
  void env;
  void e;
}

function granary(env: DrawEnv, e: Elem): void {
  const { ctx, era } = env;
  if (era === 0) {
    for (const s of [-0.5, 0.5]) ctx.rect(s - 0.06, 0, 0.12, 0.6);
    dome(ctx, 0, 0.6, 0.95, 1.2);
  } else if (era <= 2) {
    ctx.rect(-0.8, 0, 1.6, 1.8);
    poly(ctx, [-1.0, 1.8, 0, 3.0, 1.0, 1.8]);
    W(-0.14, 0.9, 0.28, 0.4, 2);
  } else if (era === 3) {
    ctx.rect(-0.8, 0, 1.6, 3.4);
    dome(ctx, 0, 3.4, 0.8, 0.6);
    ctx.rect(0.9, 0, 1.3, 2.6);
    dome(ctx, 1.55, 2.6, 0.65, 0.6);
  } else {
    ctx.rect(-0.7, 0, 1.4, 4.2);
    dome(ctx, 0, 4.2, 0.7, 0.8);
    for (let i = 0; i < 4; i++) W(-0.5, 0.5 + i * 0.9, 1.0, 0.12, 1);
  }
  void e;
}

function stall(env: DrawEnv, e: Elem): void {
  const { ctx, era } = env;
  if (era === 4) {
    ctx.rect(-0.7, 0, 1.4, 1.0);
    W(-0.6, 1.15, 1.2, 0.5, 2);
    W(-0.5, 0.3, 1.0, 0.1, 1);
    return;
  }
  ctx.rect(-0.75, 0, 0.08, 1.2);
  ctx.rect(0.67, 0, 0.08, 1.2);
  ctx.rect(-0.7, 0, 1.4, 0.5);
  if (era === 0) poly(ctx, [-0.95, 1.2, 0, 1.75, 0.95, 1.2]);
  else poly(ctx, [-1.0, 1.1, -0.8, 1.55, 0.8, 1.55, 1.0, 1.1]);
  W(-0.12, 0.62, 0.24, 0.24, 2, 1);
  if (e.state === 2) {
    W(-0.5, 0.58, 0.18, 0.18, 2, 1);
    W(0.32, 0.58, 0.18, 0.18, 2, 1);
  }
}

function heart(env: DrawEnv, e: Elem): void {
  const { ctx, era } = env;
  void e;
  if (era === 0) {
    // foyer : pierres et bûches (les flammes sont dessinées en direct)
    for (let i = 0; i < 5; i++) blob(ctx, -0.8 + i * 0.4, 0.12, 0.2);
    poly(ctx, [-0.7, 0.15, 0.6, 0.55, 0.65, 0.4, -0.65, 0.02]);
    poly(ctx, [0.7, 0.15, -0.6, 0.55, -0.65, 0.4, 0.65, 0.02]);
    env.emit(0, 0.5, 'ember');
    return;
  }
  if (era === 1) {
    // obélisque
    poly(ctx, [-0.35, 0, -0.22, 4.6, 0, 5.1, 0.22, 4.6, 0.35, 0]);
    ctx.rect(-0.8, 0, 1.6, 0.3);
    W(-0.1, 4.55, 0.2, 0.2, 2, 1);
    return;
  }
  if (era === 2) {
    // puits et croix de marché
    ctx.rect(-0.8, 0, 1.6, 0.7);
    ctx.rect(-0.07, 0.7, 0.14, 3.0);
    ctx.rect(-0.5, 3.0, 1.0, 0.14);
    W(-0.12, 3.75, 0.24, 0.3, 3);
    return;
  }
  if (era === 3) {
    // réverbère monumental
    ctx.rect(-0.08, 0, 0.16, 3.6);
    ctx.rect(-0.9, 3.4, 1.8, 0.1);
    ctx.rect(-0.5, 0, 1.0, 0.3);
    W(-1.0, 3.0, 0.3, 0.4, 3);
    W(0.7, 3.0, 0.3, 0.4, 3);
    W(-0.15, 3.6, 0.3, 0.4, 3);
    return;
  }
  // hologramme
  poly(ctx, [-0.9, 0, -0.6, 0.4, 0.6, 0.4, 0.9, 0]);
  W(-0.55, 0.9, 1.1, 1.1, 1, 1);
  W(-0.05, 0.4, 0.1, 0.5, 1);
}

const SIG: Record<string, (env: DrawEnv, e: Elem) => void> = {
  Foi: sigFoi,
  Guerre: sigGuerre,
  Commerce: sigCommerce,
  Science: sigScience,
  Culture: sigCulture,
  Nature: sigNature,
};

/**
 * Dessine un élément à l'origine courante (base au sol, y vers le haut, unité = u).
 * `lightsOut` (0..1) éteint progressivement les fenêtres.
 */
export function drawElem(env: DrawEnv, e: Elem, lightsOut: number, alpha: number): void {
  const { ctx } = env;
  if (e.kind === 'field') {
    drawField(env, e, alpha);
    return;
  }
  lights = [];
  wseed = hashString(e.key);
  ctx.beginPath();
  switch (e.kind) {
    case 'dwelling': dwelling(env, e); break;
    case 'sig': SIG[e.sub]?.(env, e); break;
    case 'wonder': wonder(env, e); break;
    case 'wall': wall(env, e); break;
    case 'granary': granary(env, e); break;
    case 'stall': stall(env, e); break;
    case 'heart': heart(env, e); break;
    default: field(env, e);
  }
  ctx.fillStyle = env.body;
  ctx.globalAlpha = alpha;
  ctx.fill();

  // lumières
  const t = env.t;
  for (let i = 0; i < lights.length; i++) {
    const l = lights[i];
    const kind = l[4];
    const hr = h01(wseed + i * 7919);
    let a = 1;
    if (kind === 0) {
      if (hr >= env.lit * (1 - lightsOut)) continue;
      a = 0.72 + 0.28 * Math.sin(t * (1.1 + hr * 2.3) + hr * 40) * env.flicker + (1 - env.flicker) * 0.2;
      ctx.fillStyle = env.window;
    } else if (kind === 1) {
      if (hr < lightsOut) continue;
      a = 0.75 + 0.25 * Math.sin(t * 1.7 + hr * 30);
      ctx.fillStyle = env.accent;
    } else if (kind === 2) {
      if (hr >= env.gilded * (1 - lightsOut) + 0.15 * (1 - lightsOut)) continue;
      a = 0.85;
      ctx.fillStyle = env.gold;
    } else {
      if (hr * 0.8 + 0.2 < lightsOut) continue;
      a = 0.8 + 0.2 * Math.sin(t * 2.3 + hr * 50) * env.flicker;
      ctx.fillStyle = env.window;
    }
    ctx.globalAlpha = alpha * Math.max(0, Math.min(1, a));
    if (l[5] === 1) {
      ctx.beginPath();
      ctx.arc(l[0] + l[2] / 2, l[1] + l[3] / 2, l[2] / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(l[0], l[1], l[2], l[3]);
    }
  }
  ctx.globalAlpha = 1;
}

/** Centre lumineux approximatif d'un élément (pour le halo), en unités locales. */
export function litCount(): number {
  return lights.length;
}

function drawField(env: DrawEnv, e: Elem, alpha: number): void {
  // Un champ : des sillons en perspective, ponctués de pousses éclairées.
  const { ctx, t } = env;
  const dry = e.state === 1;
  const lush = e.state === 2;
  const farW = 3.0;
  const nearW = 5.4;
  const depth = 1.7;
  const n = dry ? 5 : 7;
  ctx.lineWidth = 0.05;
  ctx.lineCap = 'round';
  const col = dry ? 'rgba(150,132,120,1)' : env.crop;
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1) - 0.5;
    const x0 = f * farW;
    const x1 = f * nearW;
    ctx.globalAlpha = alpha * (dry ? 0.22 : 0.32);
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    if (dry && i % 2) {
      ctx.lineTo(x0 + (x1 - x0) * 0.4, -depth * 0.4);
      ctx.moveTo(x0 + (x1 - x0) * 0.6, -depth * 0.6);
    }
    ctx.lineTo(x1, -depth);
    ctx.stroke();
    if (dry) continue;
    const m = lush ? 6 : 4;
    for (let j = 0; j < m; j++) {
      const k = (j + 0.5 + ((i * 3 + j) % 2) * 0.25) / m;
      const x = x0 + (x1 - x0) * k;
      const y = -depth * k;
      const hgt = (lush ? 0.42 : 0.28) * (0.7 + k * 0.6);
      const sway = Math.sin(t * 1.2 + x * 1.9 + j) * 0.05;
      ctx.globalAlpha = alpha * (0.5 + k * 0.4);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + sway, y + hgt);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + sway, y + hgt, 0.05 + k * 0.035, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
