/**
 * Rendu de la scène : ciel, lumière, civilisation, particules.
 * Canvas 2D, trois passes : un fond (demi-résolution, rafraîchi lentement),
 * la cité (pleine résolution, rafraîchie à la demande) et les éléments vivants (chaque image).
 */
import { Rng, hashString } from '../core/rng';
import { layoutCity, drawElem, rivalBuildX, type CivSnapshot, type DrawEnv, type Elem } from './city';
import { LOOKS, BACKDROP_LOOKS, mixLook, mix, rgb, ease, clamp01, lerp, type EraLook, type RGB } from './palette';

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

// palier 2 = tous les effets (cible : 30 images par seconde) ; on ne descend que sous 30 i/s
const TIER_CFG = [
  { dpr: 1, liveDpr: 1, backEvery: 6, cityEvery: 8, liveEvery: 4, particles: 22, rays: false, glow: false },
  { dpr: 1.5, liveDpr: 1.25, backEvery: 3, cityEvery: 5, liveEvery: 2, particles: 48, rays: true, glow: true },
  { dpr: 2, liveDpr: 1.25, backEvery: 2, cityEvery: 4, liveEvery: 3, particles: 90, rays: true, glow: true },
];

function hueRGB(h: number): RGB {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return 0.5 - 0.5 * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [255 * f(0), 255 * f(8), 255 * f(4)];
}

export class Scene {
  private ctx: CanvasRenderingContext2D;
  private back: HTMLCanvasElement;
  private bctx: CanvasRenderingContext2D;
  private city: HTMLCanvasElement;
  private cctx: CanvasRenderingContext2D;
  private W = 1;
  private H = 1;
  private dpr = 1;
  /** résolution de la toile du dessus (flammes, lueurs, fumées, particules : tout y est flou, elle peut être plus légère) */
  private ldpr = 1;
  private u = 10;
  private horizon = 0;
  private margin = 18;

  private snap: CivSnapshot | null = null;
  /** teinte de l'origine sur la première ère (fondu quand on change d'origine) */
  private tintAmt = 0;
  private tintKind: 'feu' | 'fleuve' | 'ruines' = 'feu';
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
  /** en crise, en danger ou pendant la chute, la cité vit (flammes, fenêtres qui vacillent) : redessinée une image sur liveEvery */
  private cityLive = false;
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
  /** voiles plein écran (crise, danger) confiés au compositeur : seule leur opacité change d'une image à l'autre */
  private veils: { crisis: HTMLElement; danger: HTMLElement } | null = null;
  private layered = false;
  private layerX = { back: NaN, city: NaN };
  private veilA = { crisis: -1, danger: -1 };
  private timelapse: { snaps: CivSnapshot[]; t0: number; dur: number; i: number; done?: () => void } | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    // le fond et la cité sont des calques sous la toile principale : le compositeur les assemble et les décale
    // (parallaxe) sans que la toile principale les recopie à chaque image ; elle ne porte plus que ce qui bouge
    this.layered = typeof document !== 'undefined' && !!canvas.parentNode;
    this.ctx = canvas.getContext('2d', { alpha: this.layered })!;
    this.back = document.createElement('canvas');
    this.bctx = this.back.getContext('2d', { alpha: false })!;
    this.city = document.createElement('canvas');
    this.cctx = this.city.getContext('2d')!;
    const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    this.tier = 2;
    void coarse;
    const rng = new Rng(0xc17adec);
    for (let i = 0; i < 150; i++) this.stars.push({ x: rng.next(), y: Math.pow(rng.next(), 1.4), s: rng.range(0.5, 1.6), p: rng.range(0, 6.28) });
    this.makeHills(1);
    if (typeof document !== 'undefined' && canvas.parentNode) {
      const veil = (id: string, bg: string): HTMLElement => {
        const d = document.createElement('div');
        d.id = id;
        d.setAttribute('aria-hidden', 'true');
        d.style.cssText = `position:fixed;inset:0;pointer-events:none;opacity:0;will-change:opacity;background:${bg}`;
        canvas.insertAdjacentElement('afterend', d);
        return d;
      };
      this.veils = { danger: veil('veil-danger', '#000'), crisis: veil('veil-crisis', 'transparent') };
      for (const c of [this.back, this.city]) {
        c.setAttribute('aria-hidden', 'true');
        c.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;will-change:transform';
        canvas.insertAdjacentElement('beforebegin', c);
      }
    }
    this.resize();
  }

  /** Décale un calque (fond ou cité) : la transformation n'est réécrite que si elle a bougé. */
  private placeLayer(k: 'back' | 'city', x: number): void {
    const v = Math.round(x * 20) / 20;
    if (v === this.layerX[k]) return;
    this.layerX[k] = v;
    this[k].style.transform = `translate3d(${v}px,0,0)`;
  }

  /** L'opacité d'un voile, écrite seulement quand elle change assez pour se voir. */
  private setVeil(k: 'crisis' | 'danger', a: number): void {
    if (!this.veils) return;
    const v = a < 0.004 ? 0 : Math.round(a * 400) / 400;
    if (v === this.veilA[k]) return;
    this.veilA[k] = v;
    this.veils[k].style.opacity = String(v);
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
    this.ldpr = this.layered ? Math.min(this.dpr, cfg.liveDpr) : this.dpr;
    this.canvas.width = Math.round(this.W * this.ldpr);
    this.canvas.height = Math.round(this.H * this.ldpr);
    this.back.width = Math.max(2, Math.round((this.W * this.dpr) / 2));
    this.back.height = Math.max(2, Math.round((this.H * this.dpr) / 2));
    this.city.width = Math.round((this.W + this.margin * 2) * this.dpr);
    this.city.height = Math.round(this.H * this.dpr);
    if (this.layered) {
      this.back.style.width = `${this.W + 8}px`;
      this.back.style.height = `${this.H}px`;
      this.city.style.width = `${this.W + this.margin * 2}px`;
      this.city.style.height = `${this.H}px`;
      this.layerX = { back: NaN, city: NaN };
    }
    const portrait = this.H > this.W * 1.05;
    // la cité occupe le bas de l'écran (environ 40 %) : la carte se tient au-dessus
    this.horizon = this.H * (portrait ? 0.83 : 0.8);
    this.u = Math.max(7.5, Math.min(22, portrait ? Math.min(this.W / 33, this.H / 44) : Math.min(this.W / 44, this.H / 40)));
    this.cityDirtyUntil = this.t + 0.1;
    this.frame = 0;
    // le voile de crise : transparent au centre, rouge sur les bords (même dégradé que l'ancien, peint une fois)
    if (this.veils) {
      const r0 = Math.min(this.W, this.H) * 0.25;
      const r1 = Math.max(this.W, this.H) * 0.8;
      this.veils.crisis.style.background = `radial-gradient(circle ${r1}px at 50% 45%, rgba(200,40,20,0) ${r0}px, rgb(190,34,16) ${r1}px)`;
    }
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
    if (instant && !this.trans) {
      const b = snap.era === 0 ? snap.backdrop : undefined;
      if (b) this.tintKind = b;
      this.tintAmt = b ? 1 : 0;
      this.look = b ? BACKDROP_LOOKS[b] : LOOKS[snap.era];
    }
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
    if (this.frameEma > 34) this.slowFrames++;
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
      this.tier = (this.tier + 1) as Tier;
      this.fastFrames = 0;
      this.resize();
    }
  }

  private update(dt: number): void {
    // transition d'ère
    const want = this.snap?.era === 0 ? this.snap.backdrop ?? null : null;
    if (want && this.tintAmt < 0.02) this.tintKind = want;
    const target = want && want === this.tintKind ? 1 : 0;
    if (this.tintAmt !== target) {
      this.tintAmt = target > this.tintAmt ? Math.min(target, this.tintAmt + dt * 1.6) : Math.max(target, this.tintAmt - dt * 1.6);
      if (!this.trans) this.look = this.tintAmt > 0 ? mixLook(LOOKS[this.era], BACKDROP_LOOKS[this.tintKind], ease.inOutCubic(this.tintAmt)) : LOOKS[this.era];
    }
    if (this.trans) {
      const p = clamp01((this.t - this.trans.t0) / this.trans.dur);
      const from = this.trans.from === 0 && this.tintAmt > 0 ? mixLook(LOOKS[0], BACKDROP_LOOKS[this.tintKind], this.tintAmt) : LOOKS[this.trans.from];
      this.look = mixLook(from, LOOKS[this.trans.to], ease.inOutCubic(p));
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
    // en danger, en crise et pendant la chute, la cité vit à chaque image (flammes, lumières qui vacillent)
    this.cityLive = this.mood.dead || this.dangerSmooth > 0.02 || this.crisisSmooth > 0.02;

    this.updateParticles(dt);
  }

  // ------------------------------------------------------------------ géométrie

  private layerBase(layer: number): number {
    const u = this.u;
    if (layer <= -2) return this.horizon - 5.4 * u;
    if (layer <= -1.5) return this.horizon - 4.0 * u;
    if (layer < 0) return this.horizon - 2.6 * u;
    if (layer <= 0) return this.horizon + 0.1 * u;
    if (layer <= 1) return this.horizon + 1.3 * u;
    if (layer <= 1.5) return this.horizon + 2.1 * u;
    if (layer <= 2) return this.horizon + 3.1 * u;
    if (layer <= 2.2) return this.horizon + 3.7 * u;
    if (layer <= 2.5) return this.horizon + 3.9 * u;
    return this.horizon + 4.6 * u;
  }

  private layerScale(layer: number): number {
    if (layer <= -2) return 0.66;
    if (layer <= -1.5) return 0.78;
    if (layer < 0) return 1.25;
    if (layer <= 0) return 0.82;
    if (layer <= 1) return 1;
    if (layer <= 1.5) return 0.95;
    if (layer <= 2) return 1.14;
    if (layer <= 2.2) return 0.72;
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
    if (this.frame < 3 || transitioning || cityDirty || this.frame % cfg.cityEvery === 2 || (this.cityLive && this.frame % cfg.liveEvery === 0)) this.renderCity();

    const ctx = this.ctx;
    const { W, H, ldpr: dpr } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    const px = this.parallax;
    if (this.layered) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.placeLayer('back', -px * 3 - 4);
      this.placeLayer('city', -this.margin - px * 9);
    } else {
      ctx.drawImage(this.back, -px * 3 * dpr - 4 * dpr, 0, this.canvas.width + 8 * dpr, this.canvas.height);
      ctx.drawImage(this.city, (-this.margin - px * 9) * dpr, 0);
    }
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

    // crise : la lumière se tend, les bords rougissent ; danger : la lumière vacille (deux voiles composités)
    this.setVeil('crisis', this.crisisSmooth > 0.01 ? 0.3 * this.crisisSmooth * (0.75 + 0.25 * Math.sin(this.t * 2.2)) : 0);
    this.setVeil('danger', this.dangerSmooth > 0.01 && !this.reducedMotion ? this.dangerSmooth * 0.16 * this.flickerNoise() : 0);

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
    const k01 = snap.res.savoir;
    const lit = (0.3 + 0.7 * k01) * (this.mood.dead ? 1 : 0.25 + 0.75 * Math.min(1, lv + 0.2));
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
      gilded: snap.res.tresor,
      flicker: this.reducedMotion ? 0 : Math.min(1, 0.45 + this.dangerSmooth * 0.55),
      emit: () => undefined,
    };

    let prevLayer = -9;
    let hazed = false;
    for (const a of this.sorted) {
      const e = a.elem;
      // voile atmosphérique entre les plans
      if (e.layer !== prevLayer) {
        if (prevLayer <= 0 && e.layer > 0 && !hazed) {
          hazed = true;
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
        e.layer < 0 ? mix(mix(l.far, l.mid, 0.55), l.skyLow, 0.06) : e.layer <= 0 ? mix(mix(l.far, l.mid, 0.4), l.skyLow, 0.12) : e.layer <= 1 ? l.mid : e.layer <= 1.5 ? mix(l.mid, l.near, 0.5) : l.near;
      let body = bodyCol;
      // la rivale : silhouettes teintées de sa couleur, sur la crête ; les ruines : pierre morte
      if (e.kind === 'rival') body = mix(mix(l.far, l.skyLow, 0.2), hueRGB(e.r2), 0.5);
      if (e.kind === 'relic') body = mix(mix(l.far, l.mid, 0.4), mix(l.light, [196, 186, 170], 0.55), 0.3 - 0.06 * e.r2);
      env.body = rgb(mix(body, [2, 2, 5], (1 - lv) * 0.7));
      env.era = a.styleEra;
      env.emit = e.kind === 'relic' ? () => undefined : (ex, ey, type) => {
        this.emitters.push({ x: px + ex * k, y: py - ey * k * sy, type, k });
      };
      if (e.kind === 'rival' && cfg.glow) {
        // la cité rivale luit de sa couleur, au loin
        const gr = k * 9;
        const g4 = ctx.createRadialGradient(px, py - k * 2, 0, px, py - k * 2, gr);
        g4.addColorStop(0, rgb(hueRGB(e.r2), 0.16 * lv));
        g4.addColorStop(1, rgb(hueRGB(e.r2), 0));
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g4;
        ctx.fillRect(px - gr, py - k * 2 - gr, gr * 2, gr * 2);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (e.kind === 'relic' || e.kind === 'rival') {
        // une butte sous chaque ruine et chaque monument lointain, couleur des collines
        ctx.fillStyle = rgb(mix(mix(l.far, l.skyLow, 0.15), [2, 2, 5], (1 - lv) * 0.7));
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.ellipse(px, horizon + u * 0.4, k * 8.5, horizon + u * 0.4 - py + k * 0.9, 0, Math.PI, 0);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (e.kind === 'wonder') {
        // chaque merveille se dresse sur sa butte, au-dessus des toits
        ctx.fillStyle = env.body;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.ellipse(px, horizon + u * 0.6, k * 9.5, py - horizon - u * 0.6 < 0 ? horizon + u * 0.6 - py + u * 0.25 : u, 0, Math.PI, 0);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(k, -k * sy);
      drawElem(env, e, out, alpha);
      ctx.restore();

      if (e.kind === 'dwelling' || e.kind === 'sig' || e.kind === 'wonder' || e.kind === 'relic') {
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

  /**
   * Ce que la scène montre au lieu de l'écrire : le fleuve de l'origine, le chantier de la rivale (une grue qui
   * clignote sur la crête), la menace de l'ère à l'horizon (plus forte en pleine crise).
   */
  private drawSigns(ctx: CanvasRenderingContext2D): void {
    const snap = this.snap;
    if (!snap) return;
    const { W, u } = this;
    const t = this.reducedMotion ? 0 : this.t;
    const l = this.look;
    const lv = Math.max(0.35, this.lightLevel);
    // le fleuve, devant la cité
    if (snap.backdrop === 'fleuve') {
      const y0 = this.layerBase(2) + u * 0.35;
      const h = u * 2.6;
      const water: RGB = [60, 110, 150];
      const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
      g.addColorStop(0, rgb(mix(water, l.light, 0.35 * lv), 0.85));
      g.addColorStop(0.5, rgb(mix(water, l.far, 0.5), 0.9));
      g.addColorStop(1, rgb(mix(water, l.near, 0.7), 0.95));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-20, y0);
      for (let x = -20; x <= W + 20; x += 14) ctx.lineTo(x, y0 + Math.sin(x * 0.021 + t * 0.8) * u * 0.12);
      ctx.lineTo(W + 20, y0 + h);
      ctx.lineTo(-20, y0 + h);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      // la rive éclairée, puis les reflets qui filent avec le courant
      ctx.strokeStyle = rgb(l.light, 0.35 * lv);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 14) ctx.lineTo(x, y0 + Math.sin(x * 0.021 + t * 0.8) * u * 0.12);
      ctx.stroke();
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 26; i++) {
        const x = ((i * 137 + t * 16 * (0.6 + (i % 3) * 0.3)) % (W + 60)) - 30;
        const y = y0 + h * (0.12 + ((i * 53) % 80) / 100);
        ctx.strokeStyle = rgb(mix(l.light, [200, 230, 255], 0.4), (0.3 + 0.15 * Math.sin(t * 2 + i)) * lv);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + u * (0.6 + (i % 4) * 0.3), y);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    // le chantier de la rivale : une grue à sa couleur, et un feu qui clignote
    const rx = rivalBuildX(snap);
    if (rx !== null) {
      const x = rx * W;
      const y = this.layerBase(-2);
      const hue = snap.rival.hue;
      const col = `hsla(${hue}, 45%, ${18 + 10 * lv}%, 0.9)`;
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(1, u * 0.12);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - u * 3.2);
      ctx.moveTo(x - u * 0.8, y - u * 3.0);
      ctx.lineTo(x + u * 2.2, y - u * 3.0);
      ctx.moveTo(x + u * 1.6, y - u * 3.0);
      ctx.lineTo(x + u * 1.6, y - u * 1.6 - Math.sin(t * 0.6) * u * 0.3);
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.fillRect(x - u * 0.7, y - u * 1.0, u * 1.4, u * 1.0);
      const blink = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `hsla(${hue}, 90%, 65%, ${(0.35 + 0.55 * blink).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(x + u * 2.2, y - u * 3.0, u * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    // la menace de l'ère
    const k = 0.65 + 0.35 * this.crisisSmooth;
    const hz = this.horizon;
    ctx.save();
    switch (snap.threat) {
      case 'horde': {
        // des cavaliers sur la crête, et leur poussière
        const x0 = (rx !== null && rx > 0.5 ? 0.12 : 0.78) * W + Math.sin(t * 0.15) * u * 2;
        const y = this.layerBase(-1.5) + u * 0.2;
        // la poussière, claire, pour que les silhouettes se découpent dessus
        const dust = this.sprite([215, 165, 110], true);
        ctx.globalAlpha = Math.min(1, 1.2 * k);
        ctx.drawImage(dust, x0 - u * 6, y - u * 5, u * 12, u * 6.2);
        ctx.globalAlpha = 0.95 * k;
        ctx.fillStyle = rgb(mix(l.near, [0, 0, 0], 0.4));
        const s = 1.6;
        for (let i = 0; i < 9; i++) {
          const x = x0 - u * 3.6 + i * u * 0.85 + Math.sin(t * 4 + i) * u * 0.08;
          const b = Math.abs(Math.sin(t * 6 + i * 1.7)) * u * 0.14;
          const yy = y - (i % 2) * u * 0.25;
          ctx.fillRect(x, yy - u * 0.55 * s - b, u * 0.55 * s, u * 0.3 * s);
          ctx.fillRect(x + u * 0.3 * s, yy - u * 0.9 * s - b, u * 0.16 * s, u * 0.38 * s);
          ctx.fillRect(x + u * 0.36 * s, yy - u * 1.25 * s - b, u * 0.04 * s, u * 0.5 * s);
        }
        break;
      }
      case 'hiver':
        ctx.fillStyle = `rgba(235,240,255,${(0.8 * k).toFixed(2)})`;
        for (let i = 0; i < 120; i++) {
          const x = ((i * 73 + t * 9 * ((i % 3) + 1) + Math.sin(t + i) * 6) % W);
          const y = ((i * 131 + t * 26 * (0.5 + (i % 4) * 0.2)) % (hz + u * 4));
          const sz = 1.4 + (i % 3) * 0.8;
          ctx.fillRect(x, y, sz, sz);
        }
        break;
      case 'peste': {
        const g = ctx.createRadialGradient(W / 2, hz, u, W / 2, hz, W * 0.6);
        g.addColorStop(0, `rgba(120,170,60,${(0.16 * k).toFixed(3)})`);
        g.addColorStop(1, 'rgba(120,170,60,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, hz - W * 0.4, W, W * 0.8);
        ctx.fillStyle = `rgba(160,210,90,${(0.4 * k).toFixed(2)})`;
        for (let i = 0; i < 24; i++) ctx.fillRect((i * 97 + t * 5) % W, hz - u * 2 - ((i * 37 + t * 4) % (u * 6)), 2, 2);
        break;
      }
      case 'incendie':
      case 'guerre': {
        // fumées sur l'horizon, et des lueurs (canons en guerre)
        const smoke = this.sprite([38, 32, 32], true);
        const n = snap.threat === 'guerre' ? 4 : 2;
        for (let i = 0; i < n; i++) {
          const x = (snap.threat === 'guerre' ? 0.1 + i * 0.27 : 0.42 + i * 0.12) * W;
          for (let j = 0; j < 5; j++) {
            const rise = ((t * 0.4 + j * 0.2 + i * 0.13) % 1);
            ctx.globalAlpha = Math.min(1, 1.1 * k * (1 - rise));
            const r = u * (1.5 + rise * 3.2);
            // deux passes : une fumée épaisse, qui se lit même sur un ciel clair
            for (let pass = 0; pass < 2; pass++) ctx.drawImage(smoke, x - r + rise * u * 2, hz - u * 5 - rise * u * 10 - r, r * 2, r * 2);
          }
          if (snap.threat === 'guerre') {
            const f = Math.max(0, Math.sin(t * 2.3 + i * 1.9));
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = f * f * 0.7 * k;
            ctx.drawImage(this.sprite([255, 200, 120], true), x - u, this.layerBase(-2) - u * 1.5, u * 2, u * 2);
            ctx.globalCompositeOperation = 'source-over';
          }
        }
        break;
      }
      case 'revolte':
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 10; i++) {
          const x = (0.15 + i * 0.075) * W + Math.sin(t * 0.7 + i) * u * 0.8;
          ctx.globalAlpha = (0.5 + 0.5 * Math.sin(t * 11 + i * 3)) * 0.8 * k;
          ctx.drawImage(this.sprite([255, 140, 50], true), x - u * 0.5, this.layerBase(1) - u * 1.6, u, u);
        }
        break;
      case 'schisme':
        ctx.globalCompositeOperation = 'lighter';
        [[0.3, [255, 210, 120]], [0.7, [190, 140, 255]]].forEach(([fx, c], i) => {
          ctx.globalAlpha = (0.45 + 0.35 * Math.sin(t * 1.6 + i * Math.PI)) * k;
          ctx.drawImage(this.sprite(c as RGB, true), (fx as number) * W - u * 1.5, hz - u * 7, u * 3, u * 3);
        });
        break;
      case 'krach':
        ctx.fillStyle = `rgba(255,215,110,${(0.55 * k).toFixed(2)})`;
        for (let i = 0; i < 26; i++) {
          const x = (i * 89) % W;
          const y = ((i * 61 + t * 40) % (hz + u * 3));
          ctx.beginPath();
          ctx.ellipse(x, y, 2.2, 1 + Math.abs(Math.sin(t * 5 + i)) * 1.4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'filtre': {
        // le signal : une étoile étrange, qui pulse et répond
        const x = W * 0.72;
        const y = hz * 0.22;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.9 * k;
        ctx.drawImage(this.sprite([200, 230, 255], true), x - u * 1.2, y - u * 1.2, u * 2.4, u * 2.4);
        ctx.strokeStyle = 'rgba(190,225,255,1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const p = (t * 0.35 + i / 3) % 1;
          ctx.globalAlpha = (1 - p) * 0.5 * k;
          ctx.beginPath();
          ctx.arc(x, y, u * (0.6 + p * 5), 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }
      case 'eveil':
        ctx.strokeStyle = `rgba(110,230,255,${(0.12 * k).toFixed(3)})`;
        ctx.lineWidth = 1;
        for (let i = 1; i < 9; i++) {
          ctx.beginPath();
          ctx.moveTo(0, hz - i * u * 2.2);
          ctx.lineTo(W, hz - i * u * 2.2);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          ctx.globalAlpha = (0.4 + 0.6 * Math.max(0, Math.sin(t * 1.3 + i * 2.1))) * k;
          ctx.drawImage(this.sprite([120, 235, 255], true), (0.25 + i * 0.25) * W - u * 0.6, hz - u * (9 + i * 2) - u * 0.6, u * 1.2, u * 1.2);
        }
        break;
    }
    ctx.restore();
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

    this.drawSigns(ctx);

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
