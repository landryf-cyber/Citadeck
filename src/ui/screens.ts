import type { Engine } from '../core/engine';
import { codeToSeed, seedToCode } from '../core/rng';
import { GAUGES, GAUGE_LABEL, KEYWORDS, cardFace, type Delta, type GameState, type GaugeId, type Keyword } from '../core/types';
import type { Settings } from '../save';
import { cardArt, keywordGlyph, GAUGE_PATH, KEYWORD_HUE } from './art';
import { el, esc, ICONS, ROMAN, wait } from './dom';
import { wonderEmblem } from '../scene/emblem';
import { ARCHETYPE, DEFEAT, ENDINGS, relationWord } from './texts';

/** Petites icônes d'effet : la forme de la jauge, puis une flèche (double si l'effet est fort). */
function fxHtml(d: Delta): string {
  return GAUGES.filter((g) => d[g])
    .map((g) => {
      const v = d[g]!;
      const big = Math.abs(v) >= 13;
      const arrow = v > 0 ? (big ? 'M2 8 L8 2 L14 8 M2 14 L8 8 L14 14' : 'M2 11 L8 5 L14 11') : big ? 'M2 2 L8 8 L14 2 M2 8 L8 14 L14 8' : 'M2 5 L8 11 L14 5';
      return `<span class="fx ${v > 0 ? 'up' : 'down'}" title="${GAUGE_LABEL[g]}"><svg viewBox="0 0 40 40"><path class="fx-i" d="${GAUGE_PATH[g]}"/></svg><svg class="fx-a" viewBox="0 0 16 16"><path d="${arrow}"/></svg></span>`;
    })
    .join('');
}

const kwSpan = (k: Keyword) => `<span style="color:hsl(${KEYWORD_HUE[k]} 80% 76%)">${keywordGlyph(k)}${k}</span>`;

const WONDER_HUE: Record<string, number> = {
  w_pierres: 44, w_pyramide: 36, w_phare: 168, w_bibliotheque: 208, w_muraille: 4, w_jardins: 112,
  w_colisee: 300, w_cathedrale: 44, w_universite: 208, w_horloge: 168, w_barrage: 190, w_ascenseur: 208,
};

export interface TitleOpts {
  save: GameState | null;
  onNew: (seed?: number) => void;
  onContinue: () => void;
  onSettings: () => void;
}

export interface EndOpts {
  onReplay: () => void;
  onSameSeed: () => void;
  onTitle: () => void;
}

export class Screens {
  private current: HTMLElement | null = null;
  private toastEl: HTMLElement;
  private toastTimer = 0;
  onUi: () => void = () => undefined;

  constructor(private host: HTMLElement, private eraName: (i: number) => string) {
    this.toastEl = el('div', 'toast');
    this.toastEl.setAttribute('role', 'status');
    host.append(this.toastEl);
  }

  private open(cls: string): HTMLElement {
    const s = el('section', `screen ${cls}`);
    this.host.append(s);
    void s.offsetWidth;
    requestAnimationFrame(() => s.classList.add('show'));
    return s;
  }

  private async shut(s: HTMLElement): Promise<void> {
    s.classList.remove('show');
    await wait(420);
    s.remove();
  }

  closeCurrent(): void {
    if (this.current) {
      void this.shut(this.current);
      this.current = null;
    }
  }

  isOpen(): boolean {
    return this.current !== null || this.modal !== null;
  }

  // ------------------------------------------------------------------ bannière & toast

  banner(kind: 'era' | 'crisis', over: string, big: string, sub: string, note = ''): void {
    const b = el('div', `banner ${kind}`, `<div class="over">${esc(over)}</div><div class="big">${esc(big)}</div><div class="sub">${esc(sub)}</div>${note ? `<div class="note">${esc(note)}</div>` : ''}`);
    b.setAttribute('role', 'status');
    this.host.append(b);
    void b.offsetWidth;
    b.classList.add('show');
    b.addEventListener('animationend', () => b.remove());
    // un geste suffit à l'écarter
    const dismiss = () => {
      window.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('keydown', dismiss);
      b.classList.add('out');
      setTimeout(() => b.remove(), 260);
    };
    setTimeout(() => {
      if (!b.isConnected) return;
      window.addEventListener('pointerdown', dismiss);
      window.addEventListener('keydown', dismiss);
    }, 500);
    setTimeout(() => {
      window.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('keydown', dismiss);
      b.remove();
    }, 5200);
  }

  toast(html: string, ms = 2400): void {
    this.toastEl.innerHTML = html;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }

  // ------------------------------------------------------------------ titre

  title(o: TitleOpts): void {
    this.closeCurrent();
    const s = this.open('title');
    this.current = s;
    const saveLine = o.save ? `Ère ${ROMAN[o.save.era]} · ${o.save.turn} décisions` : '';
    s.innerHTML = `
<div class="title-wrap">
  <h1 class="title-logo">CITADECK</h1>
  <p class="title-sub">Le deck est la cité.</p>
</div>
<div class="spacer"></div>
<div class="title-actions">
  ${o.save ? `<button class="btn" data-a="continue">Continuer<span style="font:600 11px var(--text);letter-spacing:.1em;opacity:.7;text-transform:none">${saveLine}</span></button>` : ''}
  <button class="btn ${o.save ? 'ghost' : ''}" data-a="new">Nouvelle partie</button>
  <div class="seed-row"><input maxlength="6" placeholder="GRAINE" aria-label="Graine de la partie" autocomplete="off" spellcheck="false" /><button class="btn ghost" data-a="seed-go">Jouer</button></div>
  <div class="title-links"><button class="link" data-a="seed">Rejouer une graine</button><button class="link" data-a="settings">Réglages</button></div>
</div>`;
    const seedRow = s.querySelector('.seed-row') as HTMLElement;
    const input = s.querySelector('input') as HTMLInputElement;
    const goSeed = () => {
      const seed = codeToSeed(input.value);
      if (seed === null) {
        input.style.boxShadow = 'inset 0 0 0 1px #ff7a5c';
        input.focus();
        return;
      }
      this.current = null;
      void this.shut(s);
      o.onNew(seed);
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') goSeed();
    });
    s.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
      if (!a) return;
      this.onUi();
      switch (a.dataset.a) {
        case 'new':
          this.current = null;
          void this.shut(s);
          o.onNew();
          break;
        case 'continue':
          this.current = null;
          void this.shut(s);
          o.onContinue();
          break;
        case 'seed':
          seedRow.classList.toggle('open');
          if (seedRow.classList.contains('open')) setTimeout(() => input.focus(), 250);
          break;
        case 'seed-go':
          goSeed();
          break;
        case 'settings':
          o.onSettings();
          break;
      }
    });
  }

  // ------------------------------------------------------------------ récompense

  async reward(engine: Engine, state: GameState): Promise<{ pick: string | null; remove: string | null }> {
    const offer = state.reward!;
    const counts = engine.keywordCounts(state);
    let pick: string | null = null;
    let remove: string | null = null;

    // --- 1. une carte parmi trois
    {
      const s = this.open('veil');
      this.current = s;
      const tiles = offer.cards
        .map((id) => {
          const c = engine.card(id);
          const syn = (c.keywords ?? [])
            .map((k) => (counts[k] > 0 ? `${k} : ${counts[k]} déjà dans votre cité` : `Première carte ${k}`))
            .join(' · ');
          return `<button class="tile" data-id="${id}" aria-label="${esc(c.title)}">
<div class="tile-art">${cardArt(c)}</div>
<div class="tile-body">
<div class="tile-kw">${(c.keywords ?? []).map(kwSpan).join('')}</div>
<div class="tile-title">${esc(c.title)}</div>
<p class="tile-text">${esc(c.text)}</p>
<div class="tile-opts"><span>‹ ${esc(c.left.text)}${fxHtml(engine.computeDelta(state, c, c.left.effect))}</span><span>› ${esc(c.right.text)}${fxHtml(engine.computeDelta(state, c, c.right.effect))}</span></div>
<div class="tile-syn">${esc(syn)}</div>
</div></button>`;
        })
        .join('');
      s.innerHTML = `
<div class="h-over">Fin de l’ère ${ROMAN[state.era]} · ${esc(this.eraName(state.era))}</div>
<h2 class="h-big">Que retient votre civilisation ?</h2>
<p class="h-sub">Une carte rejoint votre deck. Elle reviendra à chaque ère, avec son dilemme. Les icônes montrent ce que chaque réponse fera à vos jauges.</p>
<div class="reward-list">${tiles}</div>
<div class="reward-actions"><button class="btn" data-a="ok" disabled>Choisir une carte</button><button class="link" data-a="skip">Ne rien ajouter</button></div>`;
      const list = s.querySelector('.reward-list') as HTMLElement;
      const ok = s.querySelector('[data-a=ok]') as HTMLButtonElement;
      pick = await new Promise<string | null>((resolve) => {
        let sel: string | null = null;
        s.addEventListener('click', (e) => {
          const t = e.target as HTMLElement;
          const tile = t.closest('.tile') as HTMLElement | null;
          if (tile) {
            this.onUi();
            if (sel === tile.dataset.id) {
              resolve(sel);
              return;
            }
            sel = tile.dataset.id!;
            list.classList.add('has-sel');
            list.querySelectorAll('.tile').forEach((x) => x.classList.toggle('sel', x === tile));
            ok.disabled = false;
            ok.textContent = `Ajouter « ${engine.card(sel).title} »`;
            return;
          }
          const a = (t.closest('[data-a]') as HTMLElement | null)?.dataset.a;
          if (a === 'ok' && sel) resolve(sel);
          if (a === 'skip') resolve(null);
        });
      });
      this.onUi();
      this.current = null;
      await this.shut(s);
    }

    // --- 2. merveille éventuelle
    if (offer.wonder) {
      const w = engine.wonder(offer.wonder);
      const s = this.open('veil');
      this.current = s;
      s.innerHTML = `
<div class="spacer"></div>
<div class="h-over">Une merveille s’élève</div>
<div class="wonder-emblem"></div>
<h2 class="h-big" style="margin-top:20px">${esc(w.name)}</h2>
<p class="h-sub">${esc(w.text)}</p>
<div class="reward-actions" style="margin-top:22px"><button class="btn" data-a="ok">Bâtir</button></div>
<div class="spacer"></div>`;
      const emblem = wonderEmblem(w.id, WONDER_HUE[w.id] ?? 44);
      emblem.style.cssText = 'width:100%;height:100%;display:block';
      s.querySelector('.wonder-emblem')!.append(emblem);
      this.onWonder();
      await new Promise<void>((resolve) => {
        s.querySelector('[data-a=ok]')!.addEventListener('click', () => resolve());
      });
      this.onUi();
      this.current = null;
      await this.shut(s);
    }

    // --- 3. retrait facultatif
    const removable = engine.removableCards(state).filter((id) => id !== pick);
    if (removable.length > 2) {
      const s = this.open('veil');
      this.current = s;
      const chips = removable
        .map((id) => {
          const c = engine.card(id);
          return `<button class="chip" data-id="${id}">${(c.keywords ?? []).map((k) => `<span style="color:hsl(${KEYWORD_HUE[k]} 80% 76%);display:inline-flex">${keywordGlyph(k)}</span>`).join('')}${esc(c.title)}</button>`;
        })
        .join('');
      s.innerHTML = `
<div class="h-over">Avant l’ère ${ROMAN[state.era + 1]} · ${esc(this.eraName(state.era + 1))}</div>
<h2 class="h-big">Oublier une carte ?</h2>
<p class="h-sub">Une carte oubliée ne reviendra plus. Son dilemme non plus.</p>
<div class="chips">${chips}</div>
<div class="chip-detail"></div>
<div class="reward-actions"><button class="btn" data-a="keep">Tout garder</button><button class="btn ghost" data-a="ok" disabled style="margin-top:8px">Oublier</button></div>`;
      const detail = s.querySelector('.chip-detail') as HTMLElement;
      const ok = s.querySelector('[data-a=ok]') as HTMLButtonElement;
      remove = await new Promise<string | null>((resolve) => {
        let sel: string | null = null;
        s.addEventListener('click', (e) => {
          const t = e.target as HTMLElement;
          const chip = t.closest('.chip') as HTMLElement | null;
          if (chip) {
            this.onUi();
            sel = sel === chip.dataset.id ? null : chip.dataset.id!;
            s.querySelectorAll('.chip').forEach((x) => x.classList.toggle('sel', (x as HTMLElement).dataset.id === sel));
            ok.disabled = !sel;
            if (sel) {
              const c = engine.card(sel);
              detail.innerHTML = `<b>${esc(c.title)}.</b> ${esc(c.text)}<br>‹ ${esc(c.left.text)}${fxHtml(engine.computeDelta(state, c, c.left.effect))} &nbsp;·&nbsp; › ${esc(c.right.text)}${fxHtml(engine.computeDelta(state, c, c.right.effect))}`;
              ok.textContent = `Oublier « ${c.title} »`;
            } else {
              detail.innerHTML = '';
              ok.textContent = 'Oublier';
            }
            return;
          }
          const a = (t.closest('[data-a]') as HTMLElement | null)?.dataset.a;
          if (a === 'ok' && sel) resolve(sel);
          if (a === 'keep') resolve(null);
        });
      });
      this.onUi();
      this.current = null;
      await this.shut(s);
    }
    return { pick, remove };
  }

  onWonder: () => void = () => undefined;

  // ------------------------------------------------------------------ fin

  end(engine: Engine, state: GameState, o: EndOpts): void {
    this.closeCurrent();
    const res = state.result!;
    const victory = res.type === 'victory';
    const s = this.open(`soft ${victory ? 'victory' : 'defeat'}`);
    this.current = s;
    const dom = engine.dominantKeyword(state);
    const stats = `<div class="end-stats">
<span>Ère <b>${ROMAN[state.era]}</b></span><span><b>${state.turn}</b> décisions</span>
${dom ? `<span><b>${ARCHETYPE[dom]}</b></span>` : ''}
${state.wonders.length ? `<span><b>${state.wonders.length}</b> merveille${state.wonders.length > 1 ? 's' : ''}</span>` : ''}
<span>Graine <b>${seedToCode(state.seed)}</b></span></div>`;
    let head: string;
    let why = '';
    if (victory) {
      const e = ENDINGS[res.ending!];
      head = `<div class="h-over">${e.over}</div><h2 class="end-cause">${esc(e.title)}</h2><p class="end-text">${esc(e.text)}</p>`;
      const kc = engine.keywordCounts(state);
      const chips = KEYWORDS.filter((k) => kc[k] > 0)
        .map((k) => `<span class="chip static"><span style="color:hsl(${KEYWORD_HUE[k]} 80% 76%);display:inline-flex">${keywordGlyph(k)}</span>${k} ×${kc[k]}</span>`)
        .join('');
      why = `<div class="chips" style="margin-top:14px">${chips}</div>`;
    } else {
      const d = DEFEAT[res.gauge!][res.bound!];
      head = `<div class="h-over" style="color:#ffb4a0">${esc(GAUGE_LABEL[res.gauge!])} ${res.bound === 'low' ? 'à zéro' : 'à son comble'}</div><h2 class="end-cause">${esc(d.title)}</h2><p class="end-text">${esc(d.text)}</p>`;
      why = this.whyBlock(engine, state, res.gauge!, res.bound!);
    }
    s.innerHTML = `
<div class="spacer"></div>
${head}
${stats}
${why}
<div class="end-actions">
  <button class="btn" data-a="replay">${victory ? 'Nouvelle partie' : 'Rejouer'}</button>
  <div class="row"><button class="link" data-a="same">Même graine</button><button class="link" data-a="title">Écran titre</button></div>
</div>
<div class="spacer"></div>`;
    const done = (fn: () => void) => {
      window.removeEventListener('keydown', onKey);
      this.current = null;
      void this.shut(s);
      fn();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        done(o.onReplay);
      }
    };
    setTimeout(() => window.addEventListener('keydown', onKey), 600);
    s.addEventListener('click', (e) => {
      const a = ((e.target as HTMLElement).closest('[data-a]') as HTMLElement | null)?.dataset.a;
      if (!a) return;
      this.onUi();
      if (a === 'replay') done(o.onReplay);
      if (a === 'same') done(o.onSameSeed);
      if (a === 'title') done(o.onTitle);
    });
  }

  /** « Ce qui vous a tué » : les décisions qui ont le plus pesé sur la jauge fatale. */
  private whyBlock(engine: Engine, state: GameState, gauge: GaugeId, bound: 'low' | 'high'): string {
    const sign = bound === 'low' ? -1 : 1;
    const rows: { i: number; d: number }[] = [];
    let prev = 50;
    state.history.forEach((h, i) => {
      const d = h.gauges[gauge] - prev;
      prev = h.gauges[gauge];
      if (d * sign > 0) rows.push({ i, d: Math.abs(d) });
    });
    const last = state.history.length - 1;
    rows.sort((a, b) => b.d - a.d || a.i - b.i);
    const top = rows.slice(0, 3);
    if (!top.some((r) => r.i === last) && rows.some((r) => r.i === last)) top[top.length - 1] = rows.find((r) => r.i === last)!;
    top.sort((a, b) => a.i - b.i);
    if (top.length === 0) return '';
    const origin = (cardId: string, before: number): string => {
      for (let j = before - 1; j >= 0; j--) {
        const h = state.history[j];
        const c = engine.card(h.card);
        const eff = c[h.side].effect;
        const adds = [...(eff.add ?? []), ...(eff.then?.add ?? []), ...(eff.else?.add ?? [])];
        if (adds.some((a) => a.card === cardId)) return ` — suite de « ${cardFace(c, h.era)[h.side]} »`;
      }
      return '';
    };
    const html = top
      .map((r) => {
        const h = state.history[r.i];
        const c = engine.card(h.card);
        const ago = last - r.i;
        const when = ago === 0 ? 'à l’instant' : `il y a ${ago} tour${ago > 1 ? 's' : ''}`;
        const f = cardFace(c, h.era);
        return `<div class="why-row"><span class="w-card">${esc(f.title)}${esc(origin(c.id, r.i))}</span><span class="w-choice">« ${esc(f[h.side])} »</span><span class="w-when"><b>${sign < 0 ? '−' : '+'}${r.d}</b>${when}</span></div>`;
      })
      .join('');
    return `<div class="why"><div class="why-title">Ce qui a pesé sur ${esc(GAUGE_LABEL[gauge].toLowerCase())}</div>${html}</div>`;
  }

  // ------------------------------------------------------------------ réglages & deck (modales)

  private modal: HTMLElement | null = null;

  private openModal(): HTMLElement {
    this.closeModal();
    const s = this.open('veil modal');
    s.style.zIndex = '60';
    this.modal = s;
    const x = el('button', 'icon-btn close-x', ICONS.close);
    x.setAttribute('aria-label', 'Fermer');
    x.addEventListener('click', () => {
      this.onUi();
      this.closeModal();
    });
    s.append(x);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeModal();
        window.removeEventListener('keydown', onKey);
      }
    };
    window.addEventListener('keydown', onKey);
    return s;
  }

  closeModal(): void {
    if (this.modal) {
      void this.shut(this.modal);
      this.modal = null;
      this.onModalClose();
    }
  }

  onModalClose: () => void = () => undefined;

  settings(st: Settings, apply: (s: Settings) => void, extra: { seed?: number; onQuit?: () => void }): void {
    const s = this.openModal();
    const reduced = st.reducedMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
    const body = el('div');
    body.style.display = 'contents';
    body.innerHTML = `
<div class="h-over" style="margin-top:34px">Réglages</div>
<div class="panel">
  <div class="set-row"><span>Son</span><button class="switch" role="switch" data-k="sound" aria-checked="${st.sound}" aria-label="Son"></button></div>
  <div class="set-row"><span>Volume</span><input type="range" min="0" max="1" step="0.05" value="${st.volume}" aria-label="Volume" /></div>
  <div class="set-row"><span>Effets visuels<small>Auto s’adapte à votre appareil.</small></span>
    <div class="seg" role="group" aria-label="Effets visuels">
      <button data-q="auto" aria-pressed="${st.quality === 'auto'}">Auto</button><button data-q="high" aria-pressed="${st.quality === 'high'}">Élevés</button><button data-q="low" aria-pressed="${st.quality === 'low'}">Réduits</button>
    </div></div>
  <div class="set-row"><span>Animations réduites<small>Moins de mouvement, mêmes décisions.</small></span><button class="switch" role="switch" data-k="reduced" aria-checked="${reduced}" aria-label="Animations réduites"></button></div>
  ${extra.seed !== undefined ? `<div class="set-row"><span>Graine de cette partie</span><b style="letter-spacing:.2em;user-select:text;-webkit-user-select:text">${seedToCode(extra.seed)}</b></div>` : ''}
</div>
<div class="reward-actions" style="margin-top:22px">
  <button class="btn" data-a="close">Fermer</button>
  ${extra.onQuit ? '<button class="link" data-a="quit">Abandonner la partie</button>' : ''}
</div>`;
    s.append(body);
    const range = s.querySelector('input[type=range]') as HTMLInputElement;
    range.addEventListener('input', () => {
      st.volume = Number(range.value);
      apply(st);
    });
    let quitArmed = false;
    s.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const sw = t.closest('.switch') as HTMLElement | null;
      if (sw) {
        const on = sw.getAttribute('aria-checked') !== 'true';
        sw.setAttribute('aria-checked', String(on));
        if (sw.dataset.k === 'sound') st.sound = on;
        if (sw.dataset.k === 'reduced') st.reducedMotion = on;
        apply(st);
        this.onUi();
        return;
      }
      const q = t.closest('[data-q]') as HTMLElement | null;
      if (q) {
        st.quality = q.dataset.q as Settings['quality'];
        s.querySelectorAll('[data-q]').forEach((b) => b.setAttribute('aria-pressed', String(b === q)));
        apply(st);
        this.onUi();
        return;
      }
      const a = (t.closest('[data-a]') as HTMLElement | null)?.dataset.a;
      if (a === 'close') {
        this.onUi();
        this.closeModal();
      }
      if (a === 'quit') {
        const b = t.closest('[data-a]') as HTMLElement;
        if (!quitArmed) {
          quitArmed = true;
          b.textContent = 'Abandonner pour de bon ?';
          b.style.color = '#ffb4a0';
        } else {
          this.closeModal();
          extra.onQuit?.();
        }
      }
    });
  }

  deck(engine: Engine, state: GameState): void {
    const s = this.openModal();
    const kc = engine.keywordCounts(state);
    const chips = state.deck
      .map((id) => {
        const c = engine.card(id);
        return `<button class="chip" data-id="${id}">${(c.keywords ?? []).map((k) => `<span style="color:hsl(${KEYWORD_HUE[k]} 80% 76%);display:inline-flex">${keywordGlyph(k)}</span>`).join('')}${esc(c.title)}</button>`;
      })
      .join('');
    const kws = KEYWORDS.filter((k) => kc[k] > 0)
      .map((k) => `<span class="chip static"><span style="color:hsl(${KEYWORD_HUE[k]} 80% 76%);display:inline-flex">${keywordGlyph(k)}</span>${k} ×${kc[k]}</span>`)
      .join('');
    const wonders = state.wonders.map((w) => engine.wonder(w)).map((w) => `<div class="wonder-row"><b>${esc(w.name)}</b>${esc(w.text)}</div>`).join('');
    const body = el('div');
    body.style.display = 'contents';
    body.innerHTML = `
<div class="h-over" style="margin-top:34px">Votre civilisation</div>
<h2 class="h-big">${state.deck.length} cartes</h2>
<p class="h-sub">Ces cartes reviennent à chaque ère. Les cartes d’un même mot-clé se renforcent entre elles.</p>
<div class="deck-sec"><div class="chips">${chips}</div><div class="chip-detail"></div></div>
${kws ? `<div class="deck-sec"><h3>Mots-clés</h3><div class="chips">${kws}</div></div>` : ''}
${wonders ? `<div class="deck-sec"><h3>Merveilles</h3>${wonders}</div>` : ''}
<div class="deck-sec"><h3>Rivale</h3><div class="wonder-row" style="border:0"><b>${esc(state.rival.name[0].toUpperCase() + state.rival.name.slice(1))}</b>Relation ${relationWord(state.rival.relation)}. Elle glisse des cartes dans votre deck.</div></div>
<div class="reward-actions" style="margin:18px 0 10px"><button class="btn" data-a="close">Reprendre</button></div>`;
    s.append(body);
    const detail = s.querySelector('.chip-detail') as HTMLElement;
    s.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const chip = t.closest('.chip[data-id]') as HTMLElement | null;
      if (chip) {
        const c = engine.card(chip.dataset.id!);
        detail.innerHTML = `<b>${esc(c.title)}.</b> ${esc(c.text)}<br>‹ ${esc(c.left.text)}${fxHtml(engine.computeDelta(state, c, c.left.effect))} &nbsp;·&nbsp; › ${esc(c.right.text)}${fxHtml(engine.computeDelta(state, c, c.right.effect))}`;
        this.onUi();
        return;
      }
      if ((t.closest('[data-a]') as HTMLElement | null)?.dataset.a === 'close') {
        this.onUi();
        this.closeModal();
      }
    });
  }
}
