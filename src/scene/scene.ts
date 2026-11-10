/**
 * Rendu de la scène : ciel, lumière, civilisation, particules.
 * Canvas 2D, trois passes : un fond (demi-résolution, rafraîchi lentement),
 * la cité (pleine résolution, rafraîchie à la demande) et les éléments vivants (chaque image).
 */
import { Rng, hashString } from '../core/rng';
import { TUNING } from '../core/types';
import { layoutCity, drawElem, type CivSnapshot, type DrawEnv, type Elem } from './city';
import { LOOKS, mixLook, mix, rgb, ease, clamp01, lerp, type EraLook, type RGB } from './palette';

export type QualitySetting = 'auto' | 'high' | 'low';
type Tier = 0 | 1 | 2; // 0 bas, 1 moyen, 2 haut

interface Anim {
  elem: Elem;
  born: number;
  dying: number;
  styleEra: number;
  /** instant où le style bascule vers la nouvelle ère */
  restyleAt: number;
  restyleTo: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  type: number; // 0 braise, 1 poussière, 2 luciole, 3 fumée, 4 cendre, 5 neige stellaire, 6 étincelle de construction, 7 étoile filante
  seed: number;
  color: RGB;
}

interface Emitter {
  x: number;
  y: number;
  type: 'smoke' | 'ember' | 'beam' | 'climb' | 'blink';
  k: number;
}

export interface Mood {
  /** 0..1 : au moins une jauge en danger */
  danger: number;
  crisis: boolean;
  dead: boolean;
}

const TIER_CFG = [
  { dpr: 1, backEvery: 12, cityEvery: 30, particles: 18, rays: false, glow: false },
  { dpr: 1.5, backEvery: 4, cityEvery: 10, particles: 44, rays: true, glow: true },
  { dpr: 2, backEvery: 2, cityEvery: 5, particles: 90, rays: true, glow: true },
];

export class Scene {
  private ctx: CanvasRenderingContext2D;
  private back: HTMLCanvasElement;
  private bctx: CanvasRenderingContext2D;
  private city: HTMLCanvasElement;
  private cctx: CanvasRenderingContext2D;
  private W = 1;
  private H = 1;
  private dpr = 1;
  private u = 10;
  private horizon = 0;
  private margin = 18;

  private snap: CivSnapshot | null = null;
  private anims = new Map<string, Anim>();
  private sorted: Anim[] = [];
  private emitters: Emitter[] = [];
  private elemPos = new Map<string, { x: number; y: number; h: number }>();

  private era = 0;
  private trans: { from: number; to: number; t0: number; dur: number } | null = null;
  private look: EraLook = LOOKS[0];
  private particleEra = 0;

  private particles: Particle[] = [];
  private stars: { x: number; y: number; s: number; p: number }[] = [];
  private hills: { a: number[]; f: number[]; p: number[] }[] = [];

  private mood: Mood = { danger: 0, crisis: false, dead: false };
  private dangerSmooth = 0;
  private crisisSmooth = 0;
  private deadAt = 0;
  private lightLevel = 1;
  private pulseAt = -10;
  private pulseStrength = 0;

  private lampAmount = 0;
  private parallax = 0;
  private parallaxTarget = 0;

  private t = 0;
  private last = 0;
  private frame = 0;
  private raf = 0;
  private running = false;
  private cityDirtyUntil = 0;
  private timeScale = 1;

  private setting: QualitySetting = 'auto';
  private tier: Tier = 2;
  private frameEma = 16;
  private slowFrames = 0;
  private fastFrames = 0;
  private downgrades = 0;
  reducedMotion = false;
  /** appelé quand le palier de qualité change (0 bas, 1 moyen, 2 haut) */
  onTier: (tier: number) => void = () => undefined;
  /** images par seconde mesurées (pour les tests de performance) */
  fps = 60;

  private sprites = new Map<string, HTMLCanvasElement>();
  private timelapse: { snaps: CivSnapshot[]; t0: number; dur: number; i: number; done?: () => void } | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.back = document.createElement('canvas');
    this.bctx = this.back.getContext('2d', { alpha: false })!;
    this.city = document.createElement('canvas');
    this.cctx = this.city.getContext('2d')!;
    const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    this.tier = coarse ? 1 : 2;
    const rng = new Rng(0xc17adec);
    for (let i = 0; i < 150; i++) this.stars.push({ x: rng.next(), y: Math.pow(rng.next(), 1.4), s: rng.range(0.5, 1.6), p: rng.range(0, 6.28) });
    this.makeHills(1);
    this.resize();
  }

  // ------------------------------------------------------------------ réglages

  setQuality(q: QualitySetting): void {
    this.setting = q;
    if (q === 'high') this.tier = 2;
    if (q === 'low') this.tier = 0;
    this.resize();
  }

  getTier(): number {
    return this.tier;
  }

  private makeHills(seed: number): void {
    const rng = new Rng((seed ^ 0x41115) >>> 0);
    this.hills = [0, 1].map(() => ({
      a: [rng.range(0.5, 1), rng.range(0.25, 0.6), rng.range(0.1, 0.3)],
      f: [rng.range(1.2, 2.4), rng.range(3.5, 6), rng.range(9, 15)],
      p: [rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28)],
    }));
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.W = Math.max(1, Math.round(rect.width || window.innerWidth));
    this.H = Math.max(1, Math.round(rect.height || window.innerHeight));
    const cfg = TIER_CFG[this.tier];
    this.dpr = Math.min(window.devicePixelRatio || 1, cfg.dpr);
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.back.width = Math.max(2, Math.round((this.W * this.dpr) / 2));
    this.back.height = Math.max(2, Math.round((this.H * this.dpr) / 2));
    this.city.width = Math.round((this.W + this.margin * 2) * this.dpr);
    this.city.height = Math.round(this.H * this.dpr);
    const portrait = this.H > this.W * 1.05;
    this.horizon = this.H * (portrait ? 0.835 : 0.775);
    this.u = Math.max(7.5, Math.min(22, Math.min(this.W / 40, this.H / 42)));
    this.cityDirtyUntil = this.t + 0.1;
    this.frame = 0;
    this.onTier(this.tier);
  }

  // ------------------------------------------------------------------ état

  setMood(m: Partial<Mood>): void {
    const wasDead = this.mood.dead;
    this.mood = { ...this.mood, ...m };
    if (this.mood.dead && !wasDead) this.deadAt = this.t;
    if (!this.mood.dead) this.deadAt = 0;
  }

  setParallax(p: number): void {
    this.parallaxTarget = this.reducedMotion ? 0 : Math.max(-1, Math.min(1, p));
  }

  /** Petite impulsion lumineuse (après un choix, une merveille…). */
  pulse(strength = 0.5): void {
    this.pulseAt = this.t;
    this.pulseStrength = strength;
  }

  setSnapshot(snap: CivSnapshot, opts: { instant?: boolean; eraDuration?: number } = {}): void {
    const instant = !!opts.instant;
    if (!this.snap || this.snap.seed !== snap.seed) this.makeHills(snap.seed);
    const elems = layoutCity(snap);
    const seen = new Set<string>();
    let stagger = 0;
    for (const e of elems) {
      seen.add(e.key);
      const a = this.anims.get(e.key);
      if (!a) {
        const born = instant ? -1e6 : this.t + stagger;
        if (!instant) stagger += 0.09;
        this.anims.set(e.key, { elem: e, born, dying: 0, styleEra: snap.era, restyleAt: 0, restyleTo: snap.era });
      } else {
        a.elem = e;
        if (a.dying) {
          a.dying = 0;
          a.born = instant ? -1e6 : this.t;
        }
      }
    }
    for (const [key, a] of this.anims) {
      if (!seen.has(key) && !a.dying) {
        if (instant) this.anims.delete(key);
        else a.dying = this.t;
      }
    }
    const eraChanged = snap.era !== this.era;
    if (eraChanged) {
      if (instant) {
        this.era = snap.era;
        this.trans = null;
        this.look = LOOKS[snap.era];
        this.particleEra = snap.era;
        for (const a of this.anims.values()) {
          a.styleEra = snap.era;
          a.restyleAt = 0;
        }
      } else {
        const dur = (opts.eraDuration ?? 3.2) * (this.reducedMotion ? 0.5 : 1);
        this.trans = { from: this.era, to: snap.era, t0: this.t, dur };
        const lx = LOOKS[snap.era].lightX;
        for (const a of this.anims.values()) {
          if (a.styleEra === snap.era) continue;
          a.restyleAt = this.t + dur * (0.18 + 0.5 * Math.abs(a.elem.x - lx));
          a.restyleTo = snap.era;
        }
        this.era = snap.era;
      }
    }
    this.snap = snap;
    this.sorted = Array.from(this.anims.values()).sort((a, b) => a.elem.layer - b.elem.layer || a.elem.x - b.elem.x);
    this.cityDirtyUntil = this.t + 1.6 + stagger;
    if (instant) this.cityDirtyUntil = this.t + 0.2;
  }

  /** Rejoue en accéléré la croissance de la civilisation. */
  playTimelapse(snaps: CivSnapshot[], seconds: number, done?: () => void): void {
    if (snaps.length === 0) {
      done?.();
      return;
    }
    this.anims.clear();
    this.setSnapshot(snaps[0], { instant: true });
    this.timelapse = { snaps, t0: this.t, dur: seconds, i: 0, done };
    this.timeScale = 2.2;
  }

  stopTimelapse(): void {
    this.timelapse = null;
    this.timeScale = 1;
  }

  isTransitioning(): boolean {
    return this.trans !== null;
  }

  // ------------------------------------------------------------------ boucle

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const dtMs = now - this.last;
      this.last = now;
      this.step(Math.min(0.05, dtMs / 1000), dtMs);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Avance d'un pas et dessine (exposé pour les captures déterministes). */
  step(dt: number, rawMs = dt * 1000): void {
    this.t += dt;
    this.frame++;
    this.measure(rawMs);
    this.update(dt);
    this.render();
  }

  private measure(ms: number): void {
    if (ms <= 0 || ms > 250) return;
    this.frameEma = this.frameEma * 0.95 + ms * 0.05;
    this.fps = 1000 / this.frameEma;
    if (this.setting !== 'auto') return;
    if (this.frameEma > 21) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 2);
    if (this.frameEma < 13) this.fastFrames++;
    else this.fastFrames = 0;
    if (this.slowFrames > 70 && this.tier > 0) {
      this.tier = (this.tier - 1) as Tier;
      this.downgrades++;
      this.slowFrames = 0;
      this.frameEma = 16;
      this.resize();
    } else if (this.fastFrames > 900 && this.tier < 2 && this.downgrades === 0) {
      const coarse = matchMedia('(pointer: coarse)').matches;
      if (!coarse || this.tier < 1) {
        this.tier = (this.tier + 1) as Tier;
        this.fastFrames = 0;
        this.resize();
      }
    }
  }

  private update(dt: number): void {
    // transition d'ère
    if (this.trans) {
      const p = clamp01((this.t - this.trans.t0) / this.trans.dur);
      this.look = mixLook(LOOKS[this.trans.from], LOOKS[this.trans.to], ease.inOutCubic(p));
      if (p > 0.45) this.particleEra = this.trans.to;
      this.cityDirtyUntil = Math.max(this.cityDirtyUntil, this.t + 0.3);
      if (p >= 1) {
        this.look = LOOKS[this.trans.to];
        this.trans = null;
        this.cityDirtyUntil = this.t + 1.2;
      }
    }
    // changement de style des bâtiments
    for (const a of this.anims.values()) {
      if (a.restyleAt && this.t >= a.restyleAt + 0.28 && a.styleEra !== a.restyleTo) a.styleEra = a.restyleTo;
      if (a.restyleAt && this.t >= a.restyleAt + 1.1) a.restyleAt = 0;
    }
    // éléments disparus
    let removed = false;
    for (const [key, a] of this.anims) {
      if (a.dying && this.t - a.dying > 0.6) {
        this.anims.delete(key);
        removed = true;
      }
    }
    if (removed) this.sorted = Array.from(this.anims.values()).sort((a, b) => a.elem.layer - b.elem.layer || a.elem.x - b.elem.x);

    // timelapse
    if (this.timelapse) {
      const tl = this.timelapse;
      const p = clamp01((this.t - tl.t0) / tl.dur);
      const idx = Math.min(tl.snaps.length - 1, Math.floor(ease.inOutSine(p) * tl.snaps.length));
      if (idx !== tl.i) {
        tl.i = idx;
        this.setSnapshot(tl.snaps[idx], { eraDuration: 0.9 });
      }
      if (p >= 1) {
        const done = tl.done;
        this.timelapse = null;
        this.timeScale = 1;
        done?.();
      }
    }

    const k = 1 - Math.pow(0.001, dt);
    this.dangerSmooth += (this.mood.danger - this.dangerSmooth) * k * 0.6;
    this.crisisSmooth += ((this.mood.crisis ? 1 : 0) - this.crisisSmooth) * k * 0.5;
    this.parallax += (this.parallaxTarget - this.parallax) * k;
    const targetLight = this.mood.dead ? 0.14 : 1;
    this.lightLevel += (targetLight - this.lightLevel) * (1 - Math.pow(this.mood.dead ? 0.55 : 0.25, dt));
    if (this.mood.dead && this.t - this.deadAt < 4.5) this.cityDirtyUntil = Math.max(this.cityDirtyUntil, this.t + 0.2);

    this.updateParticles(dt);
  }

  // ------------------------------------------------------------------ géométrie

  private layerBase(layer: number): number {
    const u = this.u;
    if (layer <= 0) return this.horizon + 0.1 * u;
    if (layer <= 1) return this.horizon + 1.3 * u;
    if (layer <= 1.5) return this.horizon + 2.1 * u;
    if (layer <= 2) return this.horizon + 3.1 * u;
    if (layer <= 2.5) return this.horizon + 3.9 * u;
    return this.horizon + 4.6 * u;
  }

  private layerScale(layer: number): number {
    if (layer <= 0) return 0.82;
    if (layer <= 1) return 1;
    if (layer <= 1.5) return 0.95;
    if (layer <= 2) return 1.14;
    if (layer <= 2.5) return 1.0;
    return 1.25;
  }

  private lightPos(): { x: number; y: number } {
    const l = this.look;
    const sky = this.horizon - l.lightY * this.H;
    const ground = this.layerBase(2) - 0.9 * this.u;
    return { x: l.lightX * this.W, y: lerp(sky, ground, l.lightOnGround) };
  }

  private flickerNoise(): number {
    const t = this.t;
    return 0.5 + 0.5 * Math.sin(t * 13.1) * Math.sin(t * 7.7 + 1.3) * Math.sin(t * 3.1 + 0.4);
  }

  // ------------------------------------------------------------------ rendu

  private render(): void {
    const cfg = TIER_CFG[this.tier];
    const transitioning = this.trans !== null;
    // le fond et la cité ne sont jamais redessinés dans la même image (sauf transition)
    const dying = this.mood.dead && this.t - this.deadAt < 4.5;
    const backDue = this.frame % cfg.backEvery === 1 || transitioning || this.frame < 3 || dying;
    if (backDue) this.renderBack();
    const cityDirty = this.t < this.cityDirtyUntil;
    if (this.frame < 3 || transitioning || ((cityDirty || this.frame % cfg.cityEvery === 2) && (!backDue || cityDirty) && (this.tier > 0 || !cityDirty || this.frame % 2 === 0))) this.renderCity();

    const ctx = this.ctx;
    const { W, H, dpr } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    const px = this.parallax;
    ctx.drawImage(this.back, -px * 3 * dpr - 4 * dpr, 0, this.canvas.width + 8 * dpr, this.canvas.height);
    ctx.drawImage(this.city, (-this.margin - px * 9) * dpr, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(-px * 9, 0);
    this.renderLive(ctx);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // brume d'horizon par-dessus tout
    const l = this.look;
    const fogA = 0.16 * l.fogAmount * this.lightLevel;
    if (fogA > 0.005) {
      const g = ctx.createLinearGradient(0, this.horizon - this.u * 9, 0, this.horizon + this.u * 5);
      g.addColorStop(0, rgb(l.fog, 0));
      g.addColorStop(0.62, rgb(l.fog, fogA));
      g.addColorStop(1, rgb(l.fog, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, this.horizon - this.u * 9, W, this.u * 14);
    }

    // impulsion lumineuse
    const pa = this.t - this.pulseAt;
    if (pa < 0.9) {
      const lp = this.lightPos();
      const a = this.pulseStrength * 0.22 * (1 - ease.outCubic(pa / 0.9));
      const r = Math.max(W, H) * (0.25 + 0.5 * ease.outCubic(pa / 0.9));
      const g = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, r);
      g.addColorStop(0, rgb(l.light, a));
      g.addColorStop(1, rgb(l.light, 0));
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }

    // éclat de transition d'ère
    if (this.trans) {
      const p = clamp01((this.t - this.trans.t0) / this.trans.dur);
      const a = Math.pow(Math.sin(Math.PI * p), 2) * 0.3;
      const lp = this.lightPos();
      const g = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, Math.max(W, H) * 0.9);
      g.addColorStop(0, rgb(l.accent, a));
      g.addColorStop(0.5, rgb(l.light, a * 0.4));
      g.addColorStop(1, rgb(l.light, 0));
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }

    // crise : la lumière se tend, les bords rougissent
    if (this.crisisSmooth > 0.01) {
      const beat = 0.75 + 0.25 * Math.sin(this.t * 2.2);
      const g = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.25, W / 2, H * 0.45, Math.max(W, H) * 0.8);
      g.addColorStop(0, 'rgba(200,40,20,0)');
      g.addColorStop(1, `rgba(190,34,16,${(0.3 * this.crisisSmooth * beat).toFixed(3)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // danger : la lumière vacille
    if (this.dangerSmooth > 0.01 && !this.reducedMotion) {
      const a = this.dangerSmooth * 0.16 * this.flickerNoise();
      ctx.fillStyle = `rgba(0,0,0,${a.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // défaite : la nuit tombe
    if (this.mood.dead) {
      const a = clamp01((this.t - this.deadAt - 1) / 3.5) * 0.3;
      ctx.fillStyle = `rgba(2,2,6,${a.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  private renderBack(): void {
    const ctx = this.bctx;
    const bw = this.back.width;
    const bh = this.back.height;
    const sx = bw / this.W;
    ctx.setTransform(sx, 0, 0, sx, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    const { W, H, horizon } = this;
    const l = this.look;
    const lv = this.lightLevel;
    const crisis = this.crisisSmooth;

    // ciel
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    const low = mix(l.skyLow, [150, 30, 20], crisis * 0.3);
    sky.addColorStop(0, rgb(mix(l.skyTop, [0, 0, 0], 1 - lv)));
    sky.addColorStop(0.55, rgb(mix(l.skyMid, [2, 2, 6], (1 - lv) * 0.9)));
    sky.addColorStop(1, rgb(mix(low, [4, 4, 10], (1 - lv) * 0.9)));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon + 1);
    ctx.fillStyle = rgb(l.ground);
    ctx.fillRect(0, horizon, W, H - horizon);

    // étoiles
    if (l.stars > 0.02) {
      ctx.fillStyle = '#fff';
      for (const s of this.stars) {
        const tw = 0.55 + 0.45 * Math.sin(this.t * (0.6 + s.s * 0.5) + s.p);
        const a = l.stars * tw * (1 - s.y * 0.75) * (0.4 + 0.6 * lv);
        if (a < 0.03) continue;
        ctx.globalAlpha = Math.min(1, a);
        const size = s.s * (W > 700 ? 1.3 : 1);
        ctx.fillRect(s.x * W, s.y * horizon * 0.92, size, size);
      }
      ctx.globalAlpha = 1;
    }

    const lp = this.lightPos();
    const maxDim = Math.max(W, H);
    const flick = this.reducedMotion ? 1 : 1 - this.dangerSmooth * 0.3 * this.flickerNoise();
    const breathe = 1 + (this.reducedMotion ? 0 : 0.04 * Math.sin(this.t * 0.9) + 0.02 * Math.sin(this.t * 2.3));
    const power = lv * flick * (1 + crisis * 0.35);

    ctx.globalCompositeOperation = 'lighter';
    // halo large
    const hr = l.halo * maxDim * breathe;
    let g = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, hr);
    g.addColorStop(0, rgb(l.light, 0.5 * power));
    g.addColorStop(0.25, rgb(l.light, 0.22 * power));
    g.addColorStop(0.6, rgb(l.light, 0.06 * power));
    g.addColorStop(1, rgb(l.light, 0));
    ctx.fillStyle = g;
    ctx.fillRect(lp.x - hr, lp.y - hr, hr * 2, hr * 2);

    // rayons
    if (TIER_CFG[this.tier].rays && l.rays > 0.03) {
      const len = maxDim * 1.1;
      const rg = ctx.createRadialGradient(lp.x, lp.y, this.u, lp.x, lp.y, len);
      rg.addColorStop(0, rgb(l.light, 0.045 * l.rays * power));
      rg.addColorStop(0.5, rgb(l.light, 0.018 * l.rays * power));
      rg.addColorStop(1, rgb(l.light, 0));
      ctx.fillStyle = rg;
      const n = 9;
      const drift = this.reducedMotion ? 0 : this.t * 0.02;
      for (let i = 0; i < n; i++) {
        const base = (i / n) * Math.PI * 2 + drift + Math.sin(i * 12.9) * 0.3;
        const wdt = 0.09 + 0.06 * Math.sin(this.t * 0.31 + i * 2.1) + 0.04 * Math.sin(i * 7.7);
        // trois lames emboîtées : le bord du rayon se fond au lieu de trancher
        for (let k = 0; k < 3; k++) {
          const w2 = wdt * (1 - k * 0.32);
          ctx.beginPath();
          ctx.moveTo(lp.x, lp.y);
          ctx.lineTo(lp.x + Math.cos(base - w2) * len, lp.y + Math.sin(base - w2) * len);
          ctx.lineTo(lp.x + Math.cos(base + w2) * len, lp.y + Math.sin(base + w2) * len);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    ctx.globalCompositeOperation = 'source-over';

    // disque (soleil, lune, planète)
    if (l.disc > 0.05) {
      const r = l.disc * this.u;
      const night = clamp01(l.stars);
      ctx.save();
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, r, 0, Math.PI * 2);
      ctx.clip();
      const dg = ctx.createRadialGradient(lp.x - r * 0.25 * night, lp.y - r * 0.1 * night, r * 0.1, lp.x, lp.y, r);
      dg.addColorStop(0, rgb(mix(l.light, [255, 255, 255], 0.6), power));
      dg.addColorStop(0.8, rgb(l.light, 0.96 * power));
      dg.addColorStop(1, rgb(mix(l.light, l.skyMid, 0.3), 0.9 * power));
      ctx.fillStyle = dg;
      ctx.fillRect(lp.x - r, lp.y - r, r * 2, r * 2);
      // les astres de nuit ont un terminateur doux : un croissant
      if (night > 0.1) {
        const sx2 = lp.x + r * 0.62;
        const sy2 = lp.y - r * 0.22;
        const sg = ctx.createRadialGradient(sx2, sy2, r * 0.55, sx2, sy2, r * 1.28);
        const shade = mix(l.skyMid, l.skyTop, 0.4);
        sg.addColorStop(0, rgb(shade, 0.96 * night));
        sg.addColorStop(0.75, rgb(shade, 0.9 * night));
        sg.addColorStop(1, rgb(shade, 0));
        ctx.fillStyle = sg;
        ctx.fillRect(lp.x - r, lp.y - r, r * 2, r * 2);
      }
      // le soleil industriel est voilé par la suie
      if (l.smoke > 0.5) {
        const vg = ctx.createLinearGradient(0, lp.y - r, 0, lp.y + r);
        vg.addColorStop(0, rgb(l.skyMid, 0));
        vg.addColorStop(0.55, rgb(l.skyMid, 0.25 * l.smoke));
        vg.addColorStop(1, rgb(l.skyMid, 0.75 * l.smoke));
        ctx.fillStyle = vg;
        ctx.fillRect(lp.x - r, lp.y - r, r * 2, r * 2);
      }
      ctx.restore();
      // anneau de la planète (ère spatiale)
      const ringA = clamp01((l.disc - 2.8) / 0.6) * night;
      if (ringA > 0.02) {
        ctx.save();
        ctx.translate(lp.x, lp.y);
        ctx.rotate(-0.38);
        ctx.strokeStyle = rgb(l.light, 0.5 * ringA * power);
        ctx.lineWidth = Math.max(1, this.u * 0.09);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.75, r * 0.34, 0, 0.12 * Math.PI, 0.88 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.75, r * 0.34, 0, 1.12 * Math.PI, 1.88 * Math.PI);
        ctx.globalAlpha = 0.35;
        ctx.stroke();
        ctx.restore();
      }
    }

    // collines lointaines
    for (let hI = 0; hI < this.hills.length; hI++) {
      const hl = this.hills[hI];
      const amp = this.u * (hI === 0 ? 5.5 : 3.2);
      const baseY = horizon - this.u * (hI === 0 ? 1.2 : 0.2);
      const col = hI === 0 ? mix(l.far, l.skyLow, 0.55) : mix(l.far, l.skyLow, 0.22);
      ctx.fillStyle = rgb(mix(col, [3, 3, 8], (1 - lv) * 0.8));
      ctx.beginPath();
      ctx.moveTo(-10, horizon + 2);
      const stepX = Math.max(6, W / 90);
      for (let x = -10; x <= W + 10; x += stepX) {
        const nx = x / W;
        let y = 0;
        for (let k = 0; k < 3; k++) y += hl.a[k] * Math.sin(nx * hl.f[k] * Math.PI * 2 + hl.p[k]);
        ctx.lineTo(x, baseY - (y * 0.5 + 0.5) * amp);
      }
      ctx.lineTo(W + 10, horizon + 2);
      ctx.closePath();
      ctx.fill();
    }

    // nappes de fumée (ère industrielle)
    if (l.smoke > 0.3) {
      for (let i = 0; i < 5; i++) {
        const x = ((i * 0.23 + this.t * 0.006 * (1 + i * 0.2)) % 1.3) * W - W * 0.15;
        const y = horizon * (0.25 + 0.12 * i) + Math.sin(this.t * 0.1 + i) * 8;
        const r = this.u * (9 + i * 2.5);
        const sg = ctx.createRadialGradient(x, y, 0, x, y, r);
        sg.addColorStop(0, rgb(mix(l.skyTop, l.skyMid, 0.4), 0.3 * l.smoke));
        sg.addColorStop(1, rgb(l.skyTop, 0));
        ctx.fillStyle = sg;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(2.2, 0.55);
        ctx.translate(-x, -y);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.restore();
      }
    }
  }

  private renderCity(): void {
    const ctx = this.cctx;
    const { dpr, W, H, horizon, u } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.city.width, this.city.height);
    ctx.setTransform(dpr, 0, 0, dpr, this.margin * dpr, 0);
    const l = this.look;
    const lv = this.lightLevel;
    const lp = this.lightPos();
    const snap = this.snap;
    const cfg = TIER_CFG[this.tier];
    this.emitters.length = 0;

    // sol
    const gg = ctx.createLinearGradient(0, horizon, 0, H);
    gg.addColorStop(0, rgb(mix(mix(l.ground, l.skyLow, 0.2 * lv), l.light, 0.05 * lv)));
    gg.addColorStop(0.35, rgb(l.ground));
    gg.addColorStop(1, rgb(mix(l.ground, [0, 0, 0], 0.55)));
    ctx.fillStyle = gg;
    ctx.fillRect(-this.margin, horizon, W + this.margin * 2, H - horizon);

    // flaque de lumière au sol
    {
      const gy = l.lightOnGround > 0.5 ? this.layerBase(2) : horizon + u * 1.5;
      const r = u * (l.lightOnGround > 0.5 ? 17 : 26);
      const a = (l.lightOnGround > 0.5 ? 0.42 : 0.14) * lv;
      ctx.save();
      ctx.translate(lp.x, gy);
      ctx.scale(1, 0.3);
      const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      pg.addColorStop(0, rgb(l.light, a));
      pg.addColorStop(1, rgb(l.light, 0));
      ctx.fillStyle = pg;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
    }

    if (!snap) return;
    this.lampAmount = l.smoke > 0.5 ? clamp01((l.smoke - 0.5) * 2) : 0;
    const k01 = snap.gauges.knowledge / 100;
    const lit = (snap.gauges.knowledge <= TUNING.dangerLow ? 0.06 + k01 * 0.3 : 0.16 + 0.84 * k01) * (this.mood.dead ? 1 : 0.25 + 0.75 * Math.min(1, lv + 0.2));
    const out = this.mood.dead ? clamp01((this.t - this.deadAt) / 3.2) : 0;
    const env: DrawEnv = {
      ctx,
      era: this.era,
      t: this.t,
      body: '#000',
      window: rgb(l.window),
      accent: rgb(l.accent),
      gold: rgb(l.gold),
      crop: rgb(mix(l.crop, l.ground, 0.25 + (1 - lv) * 0.6)),
      lit,
      gilded: snap.gauges.treasure / 100,
      flicker: this.reducedMotion ? 0 : Math.min(1, 0.45 + this.dangerSmooth * 0.55),
      emit: () => undefined,
    };

    let prevLayer = -1;
    for (const a of this.sorted) {
      const e = a.elem;
      // voile atmosphérique entre les plans
      if (e.layer !== prevLayer) {
        if (prevLayer === 0) {
          const fg = ctx.createLinearGradient(0, horizon - u * 10, 0, horizon + u * 1.5);
          fg.addColorStop(0, rgb(l.fog, 0));
          fg.addColorStop(0.8, rgb(mix(l.fog, l.skyLow, 0.5), 0.2 * l.fogAmount * lv));
          fg.addColorStop(1, rgb(l.fog, 0));
          ctx.fillStyle = fg;
          ctx.fillRect(-this.margin, horizon - u * 10, W + this.margin * 2, u * 11.5);
        }
        prevLayer = e.layer;
      }
      // animation de naissance / disparition / changement de style
      let sy = 1;
      let alpha = 1;
      const age = (this.t - a.born) * this.timeScale;
      if (age < 0) continue;
      if (age < 0.8) {
        const p = clamp01(age / 0.8);
        sy = this.reducedMotion ? 1 : ease.outBack(p);
        alpha = clamp01(age / 0.25);
      }
      if (a.dying) {
        const p = clamp01((this.t - a.dying) / 0.55);
        sy *= 1 - ease.inCubic(p);
        alpha *= 1 - p;
      }
      if (a.restyleAt && this.t >= a.restyleAt) {
        const rp = this.t - a.restyleAt;
        if (rp < 0.28) sy *= 1 - ease.inCubic(rp / 0.28) * 0.92;
        else if (rp < 1.1) sy *= 0.08 + 0.92 * ease.outBack(clamp01((rp - 0.28) / 0.8));
      }
      if (sy <= 0.001 || alpha <= 0.001) continue;

      const px = e.x * W;
      const py = this.layerBase(e.layer);
      const k = u * this.layerScale(e.layer) * e.size * (e.kind === 'wonder' ? 1.0 : 1);
      const bodyCol: RGB =
        e.layer <= 0 ? mix(mix(l.far, l.mid, 0.4), l.skyLow, 0.12) : e.layer <= 1 ? l.mid : e.layer <= 1.5 ? mix(l.mid, l.near, 0.5) : l.near;
      env.body = rgb(mix(bodyCol, [2, 2, 5], (1 - lv) * 0.7));
      env.era = a.styleEra;
      env.emit = (ex, ey, type) => {
        this.emitters.push({ x: px + ex * k, y: py - ey * k * sy, type, k });
      };
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(k, -k * sy);
      drawElem(env, e, out, alpha);
      ctx.restore();

      if (e.kind === 'dwelling' || e.kind === 'sig' || e.kind === 'wonder') {
        this.elemPos.set(e.key, { x: px, y: py, h: k * (e.kind === 'wonder' ? 6 : 2.4) });
      }
      // halo doux autour des bâtiments éclairés
      if (cfg.glow && lit > 0.2 && out < 0.9 && (e.kind === 'sig' || e.kind === 'wonder' || (e.kind === 'dwelling' && e.r2 > 0.55))) {
        const gr = k * (e.kind === 'wonder' ? 7 : e.kind === 'sig' ? 4.2 : 2.6);
        const gy = py - k * (e.kind === 'wonder' ? 3.2 : 1.6) * sy;
        const col = e.kind === 'dwelling' ? l.window : mix(l.window, l.accent, e.kind === 'wonder' ? 0.35 : 0.2);
        const ga = (e.kind === 'wonder' ? 0.2 : 0.11) * lit * (1 - out) * alpha * lv;
        const g2 = ctx.createRadialGradient(px, gy, 0, px, gy, gr);
        g2.addColorStop(0, rgb(col, ga));
        g2.addColorStop(1, rgb(col, 0));
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g2;
        ctx.fillRect(px - gr, gy - gr, gr * 2, gr * 2);
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    // réverbères à gaz (ère industrielle) : une ligne de lueurs au bord de la rue
    if (this.lampAmount > 0.02) {
      const a = this.lampAmount * lv;
      const by = this.layerBase(2.5) + u * 0.5;
      const n = Math.max(5, Math.round(W / (u * 6.5)));
      for (let i = 0; i < n; i++) {
        const x = ((i + 0.5 + 0.2 * Math.sin(i * 5.3)) / n) * W;
        ctx.fillStyle = rgb(l.near);
        ctx.fillRect(x - u * 0.05, by - u * 2.1, u * 0.1, u * 2.1);
        ctx.fillRect(x - u * 0.22, by - u * 2.25, u * 0.44, u * 0.1);
        const fl = this.reducedMotion ? 1 : 0.85 + 0.15 * Math.sin(this.t * 3.1 + i * 1.7);
        const gr = u * 2.6;
        const gy = by - u * 2.05;
        const g3 = ctx.createRadialGradient(x, gy, 0, x, gy, gr);
        g3.addColorStop(0, rgb(l.light, 0.55 * a * fl));
        g3.addColorStop(0.18, rgb(l.light, 0.22 * a * fl));
        g3.addColorStop(1, rgb(l.light, 0));
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g3;
        ctx.fillRect(x - gr, gy - gr, gr * 2, gr * 2);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = rgb(mix(l.light, [255, 255, 255], 0.5), a);
        ctx.fillRect(x - u * 0.09, gy - u * 0.12, u * 0.18, u * 0.2);
      }
    }
  }

  // ------------------------------------------------------------------ éléments vivants

  private sprite(color: RGB, soft = false): HTMLCanvasElement {
    const key = `${color[0] | 0},${color[1] | 0},${color[2] | 0},${soft ? 1 : 0}`;
    let s = this.sprites.get(key);
    if (s) return s;
    s = document.createElement('canvas');
    s.width = s.height = 48;
    const c = s.getContext('2d')!;
    const g = c.createRadialGradient(24, 24, 0, 24, 24, 24);
    if (soft) {
      g.addColorStop(0, rgb(color, 0.5));
      g.addColorStop(0.5, rgb(color, 0.2));
      g.addColorStop(1, rgb(color, 0));
    } else {
      g.addColorStop(0, rgb(mix(color, [255, 255, 255], 0.6), 1));
      g.addColorStop(0.2, rgb(color, 0.7));
      g.addColorStop(0.5, rgb(color, 0.18));
      g.addColorStop(1, rgb(color, 0));
    }
    c.fillStyle = g;
    c.fillRect(0, 0, 48, 48);
    if (this.sprites.size > 40) this.sprites.clear();
    this.sprites.set(key, s);
    return s;
  }

  private renderLive(ctx: CanvasRenderingContext2D): void {
    const l = this.look;
    const lv = this.lightLevel;
    const u = this.u;
    const t = this.t;

    // feu de camp
    if (l.lightOnGround > 0.05 && lv > 0.03) {
      const lp = this.lightPos();
      const base = this.layerBase(2) - 0.2 * u * 1.14;
      const a = l.lightOnGround * Math.min(1, lv * 1.2);
      const dangerShake = this.reducedMotion ? 0 : this.dangerSmooth * 0.25 * this.flickerNoise();
      const scale = u * 1.14 * (1 - dangerShake) * (1 + this.crisisSmooth * 0.35);
      ctx.globalCompositeOperation = 'lighter';
      const sp = this.sprite(l.light, true);
      const gr = scale * (5.2 + 0.4 * Math.sin(t * 9));
      ctx.globalAlpha = 0.85 * a;
      ctx.drawImage(sp, lp.x - gr, base - scale * 1.0 - gr, gr * 2, gr * 2);
      const cols: RGB[] = [[255, 90, 30], [255, 160, 50], [255, 235, 170]];
      for (let i = 0; i < 3; i++) {
        const w = scale * (1.5 - i * 0.4);
        const h = scale * (2.6 - i * 0.65);
        const s1 = this.reducedMotion ? 0 : Math.sin(t * (7 + i * 2) + i) * w * 0.22 + Math.sin(t * 13.3 + i * 2) * w * 0.1;
        const h2 = h * (0.86 + (this.reducedMotion ? 0 : 0.14 * Math.sin(t * (9 + i) + i * 3)));
        ctx.globalAlpha = (0.75 - i * 0.05) * a;
        ctx.fillStyle = rgb(cols[i]);
        ctx.beginPath();
        ctx.moveTo(lp.x - w / 2, base);
        ctx.quadraticCurveTo(lp.x - w * 0.62, base - h2 * 0.5, lp.x + s1, base - h2);
        ctx.quadraticCurveTo(lp.x + w * 0.62, base - h2 * 0.45, lp.x + w / 2, base);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // émetteurs spéciaux
    ctx.globalCompositeOperation = 'lighter';
    for (const em of this.emitters) {
      if (em.type === 'beam' && lv > 0.3) {
        const ang = this.reducedMotion ? 0.3 : t * 0.5;
        const sweep = Math.cos(ang);
        const len = this.W * 0.55 * Math.abs(sweep) + u * 3;
        const dir = sweep >= 0 ? 1 : -1;
        const g = ctx.createLinearGradient(em.x, em.y, em.x + dir * len, em.y);
        g.addColorStop(0, rgb(l.window, 0.42 * lv));
        g.addColorStop(1, rgb(l.window, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(em.x, em.y);
        ctx.lineTo(em.x + dir * len, em.y - len * 0.07);
        ctx.lineTo(em.x + dir * len, em.y + len * 0.07);
        ctx.closePath();
        ctx.fill();
        const sp = this.sprite(l.window);
        const r = em.k * 1.6;
        ctx.globalAlpha = lv;
        ctx.drawImage(sp, em.x - r, em.y - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
      } else if (em.type === 'climb' && lv > 0.3) {
        const span = em.y + 20;
        const p = this.reducedMotion ? 0.4 : (t * 0.09) % 1;
        const y = em.y - p * span;
        const sp = this.sprite(l.accent);
        const r = em.k * 0.9;
        ctx.globalAlpha = lv * Math.sin(Math.PI * p);
        ctx.drawImage(sp, em.x - r, y - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalCompositeOperation = 'source-over';

    // incendies de crise
    if (this.crisisSmooth > 0.05 && this.snap) {
      ctx.globalCompositeOperation = 'lighter';
      let n = 0;
      for (const [key, pos] of this.elemPos) {
        if (!key.startsWith('d')) continue;
        if (hashString(key + this.snap.era) % 7 !== 0) continue;
        if (++n > 4) break;
        const a = this.crisisSmooth * lv;
        const sc = u * 0.7;
        const bx = pos.x;
        const by = pos.y - pos.h * 0.8;
        for (let i = 0; i < 2; i++) {
          const w = sc * (1.3 - i * 0.5);
          const h = sc * (2.4 - i * 0.8);
          const s1 = this.reducedMotion ? 0 : Math.sin(t * (8 + i * 3) + n * 2) * w * 0.25;
          ctx.globalAlpha = 0.7 * a;
          ctx.fillStyle = i === 0 ? 'rgb(255,90,30)' : 'rgb(255,200,110)';
          ctx.beginPath();
          ctx.moveTo(bx - w / 2, by);
          ctx.quadraticCurveTo(bx - w * 0.6, by - h * 0.5, bx + s1, by - h);
          ctx.quadraticCurveTo(bx + w * 0.6, by - h * 0.45, bx + w / 2, by);
          ctx.closePath();
          ctx.fill();
        }
        if (this.frame % 9 === n) this.spawn(3, bx, by - sc * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    this.drawParticles(ctx);
  }

  // ------------------------------------------------------------------ particules

  private spawn(type: number, x: number, y: number): void {
    const cap = TIER_CFG[this.tier].particles * 2.2;
    if (this.particles.length > cap) return;
    const r = Math.random;
    const l = this.look;
    const p: Particle = { x, y, vx: 0, vy: 0, life: 0, max: 3, size: 2, type, seed: r() * 100, color: l.light };
    // les particules ne grossissent pas autant que la scène sur grand écran
    const u = Math.min(this.u, 13);
    switch (type) {
      case 0: // braise
        p.vx = (r() - 0.5) * u * 1.2;
        p.vy = -u * (1.6 + r() * 2.4);
        p.max = 1.6 + r() * 2.6;
        p.size = u * (0.14 + r() * 0.16);
        p.color = r() < 0.5 ? [255, 150, 60] : [255, 200, 110];
        break;
      case 1: // poussière dorée
        p.vx = u * (0.25 + r() * 0.5);
        p.vy = -u * (0.05 + r() * 0.2);
        p.max = 6 + r() * 6;
        p.size = u * (0.1 + r() * 0.16);
        p.color = [255, 226, 160];
        break;
      case 2: // luciole / poussière de bougie
        p.vx = (r() - 0.5) * u * 0.5;
        p.vy = -u * (0.1 + r() * 0.3);
        p.max = 5 + r() * 6;
        p.size = u * (0.12 + r() * 0.14);
        p.color = r() < 0.25 ? [208, 110, 190] : r() < 0.4 ? [120, 150, 255] : [255, 205, 130];
        break;
      case 3: // fumée
        p.vx = u * (0.35 + r() * 0.5);
        p.vy = -u * (0.9 + r() * 0.8);
        p.max = 4 + r() * 3;
        p.size = u * (0.7 + r() * 0.6);
        p.color = [0, 0, 0];
        break;
      case 4: // cendre
        p.vx = u * (0.2 + r() * 0.6);
        p.vy = u * (0.3 + r() * 0.5);
        p.max = 7 + r() * 5;
        p.size = u * (0.07 + r() * 0.08);
        p.color = [226, 222, 150];
        break;
      case 5: // neige stellaire
        p.vx = -u * (0.1 + r() * 0.3);
        p.vy = u * (0.15 + r() * 0.35);
        p.max = 7 + r() * 7;
        p.size = u * (0.1 + r() * 0.14);
        p.color = r() < 0.2 ? [255, 110, 220] : [150, 232, 255];
        break;
      case 6: // étincelle de construction
        p.vx = (r() - 0.5) * u * 3.5;
        p.vy = -u * (1 + r() * 2.5);
        p.max = 0.6 + r() * 0.6;
        p.size = u * (0.1 + r() * 0.12);
        p.color = l.accent;
        break;
      case 7: // étoile filante / satellite
        p.vx = u * (16 + r() * 10) * (r() < 0.5 ? 1 : -1);
        p.vy = u * (2 + r() * 4);
        p.max = 1.1 + r() * 0.8;
        p.size = u * 0.16;
        p.color = [210, 240, 255];
        break;
    }
    this.particles.push(p);
  }

  private updateParticles(dt: number): void {
    const cfg = TIER_CFG[this.tier];
    const { W, H, horizon } = this;
    const lv = this.lightLevel;
    const motion = this.reducedMotion ? 0.3 : 1;
    const target = cfg.particles * motion * (0.3 + 0.7 * lv);
    const era = this.particleEra;
    const ambientType = [0, 1, 2, 4, 5][era];
    let ambient = 0;
    for (const p of this.particles) if (p.type === ambientType) ambient++;

    if (!this.mood.dead || lv > 0.3) {
      const rate = (target - ambient) * dt * 1.4;
      let n = Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0);
      while (n-- > 0) {
        if (era === 0) {
          const em = this.emitters.find((e) => e.type === 'ember');
          const lp = this.lightPos();
          const ex = em ? em.x : lp.x;
          const ey = em ? em.y : lp.y;
          this.spawn(0, ex + (Math.random() - 0.5) * this.u * 1.2, ey - this.u * 0.5);
        } else if (era === 1) {
          this.spawn(1, Math.random() * W * 1.1 - W * 0.1, horizon * (0.25 + Math.random() * 0.85));
        } else if (era === 2) {
          this.spawn(2, Math.random() * W, horizon * (0.45 + Math.random() * 0.62));
        } else if (era === 3) {
          this.spawn(4, Math.random() * W * 1.1 - W * 0.1, Math.random() * horizon * 0.9);
        } else {
          this.spawn(5, Math.random() * W * 1.1, Math.random() * horizon);
        }
      }
      // fumée des cheminées
      if (!this.reducedMotion && this.look.smoke > 0.05) {
        for (const em of this.emitters) {
          if (em.type === 'smoke' && Math.random() < dt * 2.2 * this.look.smoke * (this.tier === 0 ? 0.4 : 1)) this.spawn(3, em.x, em.y);
        }
      }
      // étoiles filantes de l'ère spatiale
      if (era === 4 && !this.reducedMotion && Math.random() < dt * 0.14) this.spawn(7, Math.random() * W, Math.random() * horizon * 0.4);
    }

    const t = this.t;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.max) {
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }
      const wob = p.type === 3 || p.type === 7 ? 0 : Math.sin(t * 1.7 + p.seed) * this.u * 0.35;
      p.x += (p.vx + wob) * dt;
      p.y += p.vy * dt;
      if (p.type === 0) p.vy *= 1 - dt * 0.25;
      if (p.type === 3) {
        p.size += this.u * 0.5 * dt;
        p.vy *= 1 - dt * 0.2;
      }
      if (p.type === 6) p.vy += this.u * 6 * dt;
    }
    void H;
  }

  /** Étincelles discrètes là où quelque chose vient d'être bâti. */
  sparkAt(key: string): void {
    const pos = this.elemPos.get(key);
    if (!pos || this.reducedMotion) return;
    for (let i = 0; i < 7; i++) this.spawn(6, pos.x + (Math.random() - 0.5) * this.u * 2, pos.y - pos.h * 0.4);
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    const lv = Math.min(1, this.lightLevel + 0.1);
    // fumée d'abord (assombrit)
    const smoke = this.sprite(mix(mix(this.look.skyMid, this.look.light, 0.22), [60, 58, 50], 0.3), true);
    for (const p of this.particles) {
      if (p.type !== 3) continue;
      const k = p.life / p.max;
      ctx.globalAlpha = Math.sin(Math.PI * Math.min(1, k * 1.1)) * 0.5 * lv;
      ctx.drawImage(smoke, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      if (p.type === 3) continue;
      const k = p.life / p.max;
      let a = Math.sin(Math.PI * k);
      if (p.type === 0) a = (1 - k) * (0.6 + 0.4 * Math.sin(this.t * 20 + p.seed));
      if (p.type === 2) a *= 0.55 + 0.45 * Math.sin(this.t * 2.4 + p.seed);
      if (p.type === 1 || p.type === 4) a *= 0.7;
      ctx.globalAlpha = Math.max(0, Math.min(1, a * lv));
      const sp = this.sprite(p.color);
      const s = p.size * 2.6;
      if (p.type === 7) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.drawImage(sp, -s * 6, -s * 0.5, s * 7, s);
        ctx.restore();
      } else {
        ctx.drawImage(sp, p.x - s, p.y - s, s * 2, s * 2);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
