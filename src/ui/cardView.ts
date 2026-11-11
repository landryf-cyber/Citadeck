import type { CardDef, Side } from '../core/types';
import { cardArt, cardHue, keywordGlyph, KEYWORD_HUE } from './art';
import { el, esc, ICONS } from './dom';

export interface CardShowOpts {
  tag?: string;
  crisis?: boolean;
  /** cartes restantes derrière celle-ci (pour l'épaisseur de la pile) */
  remaining: number;
  /** mention sous une option dont l'issue dépend de l'état (« selon l'Armée ») */
  depends?: { left?: string; right?: string };
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** La carte : affichage, glisser, survol, clavier. */
export class CardView {
  readonly root: HTMLElement;
  readonly zone: HTMLElement;
  private optL: HTMLButtonElement | null = null;
  private optR: HTMLButtonElement | null = null;
  private card: HTMLElement | null = null;
  private choiceL: HTMLElement | null = null;
  private choiceR: HTMLElement | null = null;

  enabled = false;
  onPreview: (side: Side | null) => void = () => undefined;
  onChoose: (side: Side) => void = () => undefined;
  onDrag: (frac: number) => void = () => undefined;
  onTouch: () => void = () => undefined;

  private dragging = false;
  private pointerId = -1;
  private startX = 0;
  private startY = 0;
  private dx = 0;
  private lastX = 0;
  private lastT = 0;
  private vx = 0;
  private dragMax = 0;
  private previewSide: Side | null = null;
  private armed: Side | null = null;
  private lastPointerType = 'mouse';
  reducedMotion = false;

  constructor() {
    this.root = el('div');
    this.root.style.display = 'contents';
    this.zone = el('div', 'card-zone');
    this.zone.append(el('div', 'card-back b2'), el('div', 'card-back b1'));
    this.root.append(this.zone);

    this.zone.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointermove', (e) => this.move(e));
    window.addEventListener('pointerup', (e) => this.up(e));
    window.addEventListener('pointercancel', (e) => this.up(e));
    window.addEventListener('keydown', (e) => this.key(e));
  }

  // ------------------------------------------------------------------ affichage

  show(def: CardDef, o: CardShowOpts): void {
    this.dragging = false;
    this.armed = null;
    this.previewSide = null;
    this.dx = 0;
    // une seule carte à la fois : on retire toute carte orpheline
    this.zone.querySelectorAll('.card:not(.fly)').forEach((c) => c.remove());
    const card = el('div', 'card enter' + (o.crisis ? ' crisis' : ''));
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `${def.title}. ${def.text}`);
    const hue = cardHue(def);
    const kws = (def.keywords ?? [])
      .map((k) => `<span style="color:hsl(${KEYWORD_HUE[k]} 80% 76%)">${keywordGlyph(k)}${k}</span>`)
      .join('');
    card.innerHTML = `<div class="card-face" style="--hue:${hue}">
<div class="card-art">${cardArt(def)}${o.tag ? `<div class="card-tag">${esc(o.tag)}</div>` : ''}</div>
<div class="card-body">
<div class="card-kw">${kws}</div>
<h2 class="card-title">${esc(def.title)}</h2>
<div class="card-rule"></div>
<p class="card-text">${esc(def.text)}</p>
</div>
<div class="card-foot">
<button type="button" class="opt left" aria-label="Gauche : ${esc(def.left.text)}">${ICONS.left}<span>${esc(def.left.text)}${o.depends?.left ? `<em>${esc(o.depends.left)}</em>` : ''}</span></button>
<button type="button" class="opt right" aria-label="Droite : ${esc(def.right.text)}"><span>${esc(def.right.text)}${o.depends?.right ? `<em>${esc(o.depends.right)}</em>` : ''}</span>${ICONS.right}</button>
</div>
<div class="card-sheen"></div>
<div class="card-choice left">${esc(def.left.text)}</div>
<div class="card-choice right">${esc(def.right.text)}</div>
</div>`;
    this.choiceL = card.querySelector('.card-choice.left');
    this.choiceR = card.querySelector('.card-choice.right');
    this.zone.append(card);
    this.card = card;
    this.zone.classList.toggle('few', o.remaining === 1);
    this.zone.classList.toggle('last', o.remaining <= 0);
    this.optL = card.querySelector('.opt.left');
    this.optR = card.querySelector('.opt.right');
    for (const [btn, side] of [[this.optL, 'left'], [this.optR, 'right']] as [HTMLButtonElement, Side][]) {
      btn.addEventListener('pointerdown', (e) => {
        this.lastPointerType = e.pointerType;
      });
      btn.addEventListener('click', () => {
        if (!this.enabled || this.card !== card) return;
        if (Math.abs(this.dragMax) > 8) return;
        this.onTouch();
        if (this.lastPointerType === 'mouse' || this.armed === side) this.choose(side);
        else this.arm(side);
      });
    }
    this.zone.classList.remove('empty');
    card.addEventListener('animationend', () => card.classList.remove('enter'), { once: true });
  }

  /** Retire la carte courante sans choix (changement d'écran). */
  clear(): void {
    if (this.card) {
      const c = this.card;
      c.classList.add('fly');
      c.style.transform = 'translateY(16px) scale(0.96)';
      setTimeout(() => c.remove(), 320);
    }
    this.card = null;
    this.zone.classList.add('empty');
    this.setPreview(null);
  }

  /** Masque la pile quand aucune carte n'arrive tout de suite (bannière, écran). */
  setEmpty(on: boolean): void {
    this.zone.classList.toggle('empty', on);
  }

  hasCard(): boolean {
    return this.card !== null;
  }

  // ------------------------------------------------------------------ gestes

  private threshold(): number {
    return Math.min(84, this.zone.clientWidth * 0.26);
  }

  private apply(dx: number, dy = 0): void {
    const c = this.card;
    if (!c) return;
    const w = this.zone.clientWidth || 300;
    const rot = clamp((dx / w) * 15, -22, 22);
    const ry = 0;
    c.style.transform = `translate3d(${dx.toFixed(1)}px, ${(Math.abs(dx) * 0.05 + dy * 0.18).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    c.style.setProperty('--sheen', `${clamp(50 - dx * 0.28, 0, 100).toFixed(1)}%`);
    const a = clamp((Math.abs(dx) - 10) / (this.threshold() * 0.7), 0, 1);
    if (this.choiceL) this.choiceL.style.opacity = dx < 0 ? String(a) : '0';
    if (this.choiceR) this.choiceR.style.opacity = dx > 0 ? String(a) : '0';
    const tag = c.querySelector('.card-tag') as HTMLElement | null;
    if (tag) tag.style.opacity = String(1 - a);
    this.onDrag(clamp(dx / w, -1, 1));
  }

  private setPreview(side: Side | null): void {
    if (side === this.previewSide) return;
    this.previewSide = side;
    this.optL?.classList.toggle('active', side === 'left');
    this.optR?.classList.toggle('active', side === 'right');
    this.onPreview(side);
  }

  private down(e: PointerEvent): void {
    if (!this.enabled || !this.card || this.dragging) return;
    if (e.button !== undefined && e.button > 0) return;
    this.onTouch();
    this.dragging = true;
    this.pointerId = e.pointerId;
    this.lastPointerType = e.pointerType;
    this.startX = e.clientX - (this.armed ? this.dx : 0);
    this.startY = e.clientY;
    this.lastX = e.clientX;
    this.lastT = performance.now();
    this.vx = 0;
    this.dragMax = 0;
    this.armed = null;
    this.optL?.classList.remove('armed');
    this.optR?.classList.remove('armed');
    this.card.classList.remove('settle', 'enter');
    this.card.classList.add('dragging');
    try {
      this.zone.setPointerCapture(e.pointerId);
    } catch {
      /* pointeur synthétique */
    }
  }

  private move(e: PointerEvent): void {
    if (!this.card) return;
    if (this.dragging && e.pointerId === this.pointerId) {
      this.dx = e.clientX - this.startX;
      if (Math.abs(this.dx) > Math.abs(this.dragMax)) this.dragMax = this.dx;
      const now = performance.now();
      const dt = Math.max(1, now - this.lastT);
      this.vx = this.vx * 0.6 + ((e.clientX - this.lastX) / dt) * 0.4;
      this.lastX = e.clientX;
      this.lastT = now;
      this.apply(this.dx, e.clientY - this.startY);
      this.setPreview(this.dx < -14 ? 'left' : this.dx > 14 ? 'right' : null);
      return;
    }
    // survol à la souris : la carte s'incline vers le pointeur et prévisualise
    if (!this.dragging && this.enabled && e.pointerType === 'mouse' && !this.armed) {
      const r = this.zone.getBoundingClientRect();
      const inside = e.clientX > r.left - 40 && e.clientX < r.right + 40 && e.clientY > r.top - 20 && e.clientY < r.bottom + 20;
      if (!inside) {
        if (this.card.dataset.hover) {
          delete this.card.dataset.hover;
          this.card.classList.add('settle');
          this.card.style.transform = '';
          this.card.style.setProperty('--sheen', '50%');
          this.setPreview(null);
        }
        return;
      }
      const rx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1);
      const ry = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1);
      this.card.dataset.hover = '1';
      this.card.classList.remove('settle', 'enter');
      if (!this.reducedMotion) {
        this.card.style.transform = `translate3d(${(rx * 7).toFixed(1)}px, 0, 0) rotateY(${(rx * 7).toFixed(2)}deg) rotateX(${(-ry * 5).toFixed(2)}deg) rotate(${(rx * 1.6).toFixed(2)}deg)`;
        this.card.style.setProperty('--sheen', `${(50 - rx * 26).toFixed(1)}%`);
      }
      this.setPreview(rx < -0.22 ? 'left' : rx > 0.22 ? 'right' : null);
    }
  }

  private up(e: PointerEvent): void {
    if (!this.dragging || e.pointerId !== this.pointerId) return;
    this.dragging = false;
    const c = this.card;
    if (!c) return;
    c.classList.remove('dragging');
    const t = this.threshold();
    const flick = Math.abs(this.vx) > 0.5 && Math.abs(this.dx) > 28 && Math.sign(this.vx) === Math.sign(this.dx);
    if (Math.abs(this.dx) > t || flick) {
      this.choose(this.dx < 0 ? 'left' : 'right');
    } else {
      this.dx = 0;
      c.classList.add('settle');
      c.style.transform = '';
      c.style.setProperty('--sheen', '50%');
      if (this.choiceL) this.choiceL.style.opacity = '0';
      if (this.choiceR) this.choiceR.style.opacity = '0';
      this.setPreview(null);
      this.onDrag(0);
    }
  }

  /** Incline la carte d'un côté sans la lâcher (clavier, boutons). */
  arm(side: Side, soft = false): void {
    if (!this.card || !this.enabled) return;
    this.armed = side;
    this.dx = (side === 'left' ? -1 : 1) * this.threshold() * (soft ? 0.5 : 0.72);
    this.card.classList.remove('enter');
    this.card.classList.add('settle');
    this.apply(this.dx);
    this.optL?.classList.toggle('armed', side === 'left');
    this.optR?.classList.toggle('armed', side === 'right');
    this.setPreview(side);
  }

  disarm(): void {
    if (!this.card || !this.armed) return;
    this.armed = null;
    this.dx = 0;
    this.card.classList.add('settle');
    this.card.style.transform = '';
    this.card.style.setProperty('--sheen', '50%');
    if (this.choiceL) this.choiceL.style.opacity = '0';
    if (this.choiceR) this.choiceR.style.opacity = '0';
    this.optL?.classList.remove('armed');
    this.optR?.classList.remove('armed');
    this.setPreview(null);
    this.onDrag(0);
  }

  private key(e: KeyboardEvent): void {
    if (!this.enabled || !this.card || e.repeat) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    let side: Side | null = null;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q') side = 'left';
    if (e.key === 'ArrowRight' || e.key === 'd') side = 'right';
    if (side) {
      e.preventDefault();
      this.onTouch();
      if (this.armed === side) this.choose(side);
      else this.arm(side);
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && this.armed) {
      e.preventDefault();
      this.choose(this.armed);
    } else if (e.key === 'Escape' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      this.disarm();
    }
  }

  private choose(side: Side): void {
    const c = this.card;
    if (!c || !this.enabled) return;
    this.enabled = false;
    this.card = null;
    this.armed = null;
    this.dragging = false;
    const dir = side === 'left' ? -1 : 1;
    const w = window.innerWidth;
    c.classList.remove('settle', 'dragging', 'enter');
    c.classList.add('fly');
    const tx = dir * (w * 0.5 + this.zone.clientWidth);
    c.style.transform = `translate3d(${tx}px, ${40}px, 0) rotate(${dir * 26}deg)`;
    setTimeout(() => c.remove(), 340);
    this.optL?.classList.remove('active', 'armed');
    this.optR?.classList.remove('active', 'armed');
    this.optL = this.optR = null;
    this.previewSide = null;
    this.onDrag(0);
    this.onChoose(side);
  }
}
