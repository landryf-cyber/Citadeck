/**
 * L'interface V2 : un écran titre, la fondation, puis la partie (HUD, carte, retours),
 * les présages, les bilans d'ère, la chute ou la victoire, le testament et la chronique.
 */
import { ERA_SCALE, type Engine, type Ev, type OptionView, type View, type PresageInfo, type FamilyInfo } from '../core/engine';
import { chronicleLines, epitaph, nextSetup, recordRun, testaments, UNLOCKS, type Testament, type Unlock } from '../core/meta';
import { FAMILIES, RES, RES_LABEL, type ChronicleEntry, type FamilyId, type GameState, type MetaState, type Res } from '../core/types';
import { civName, ERA_NAMES, ERA_SUBTITLES, capitalize } from '../core/text';
import type { Scene } from '../scene/scene';
import { LOOKS, rgb } from '../scene/palette';
import { drawElem, type DrawEnv, type Elem } from '../scene/city';
import type { AudioEngine } from '../audio';
import { cardArt, medallion, type ArtSpec } from './art';
import { bagChips, el, esc, ICON, rich, RES_ICON, ROMAN, wait } from './dom';
import { snapshot } from './snapshot';
import { store, type Settings } from './store';

const KIND_LABEL: Record<string, string> = {
  evenement: 'Événement', intrigue: 'Suite', rencontre: 'Rencontre', ruines: 'Les ruines', revenant: 'Les revenants',
  trahison: 'Trahison', croissance: 'Croissance', tutoriel: 'Conseil', institution: 'Institution',
};
const KIND_MOTIF: Record<string, string> = {
  carrefour: 'road', jalon: 'tower', decouverte: 'scroll', croissance: 'house', proces: 'scales', hommage: 'crown', ruines: 'skull', revenant: 'hand', presage: 'eye',
};
const PHASES = ['saison0', 'saison1', 'chantier', 'crise', 'finere'];

export class App {
  private root = document.getElementById('app')!;
  private s: GameState | null = null;
  private meta: MetaState = store.meta();
  private settings: Settings = store.settings();
  private lock = false;
  private hudRes: Partial<Record<Res, number>> = {};
  private hudQ = -1;
  private screenEl: HTMLElement | null = null;
  private keyHandler: ((k: string) => void) | null = null;

  constructor(private e: Engine, private scene: Scene, private audio: AudioEngine) {}

  // ======================================================================= démarrage

  boot(): void {
    this.applySettings();
    window.addEventListener('keydown', (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      this.keyHandler?.(ev.key);
    });
    const unlock = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    this.title();
  }

  private applySettings(): void {
    const st = this.settings;
    this.audio.setEnabled(st.sound);
    this.audio.setVolume(st.volume);
    this.scene.setQuality(st.quality);
    const sys = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reduced = st.reducedMotion ?? sys;
    document.documentElement.classList.toggle('reduced', reduced);
    (this.scene as unknown as { reducedMotion: boolean }).reducedMotion = reduced;
  }

  private setEraColor(era: number): void {
    document.documentElement.style.setProperty('--ui', rgb(LOOKS[era].ui));
  }

  // ======================================================================= écrans génériques

  private openScreen(cls: string, build: (inner: HTMLElement) => void, keys?: (k: string) => void): HTMLElement {
    this.closeScreen();
    document.body.classList.add('screen-open');
    const sc = el('div', `screen ${cls}`);
    const inner = el('div', 'inner');
    sc.appendChild(inner);
    build(inner);
    document.body.appendChild(sc);
    requestAnimationFrame(() => sc.classList.add('show'));
    this.screenEl = sc;
    this.keyHandler = keys ?? null;
    return sc;
  }

  private closeScreen(): void {
    const sc = this.screenEl;
    if (!sc) return;
    this.screenEl = null;
    document.body.classList.remove('screen-open');
    sc.classList.remove('show');
    sc.style.pointerEvents = 'none';
    setTimeout(() => sc.remove(), 450);
  }

  private banner(over: string, big: string, cls = '', sub = ''): Promise<void> {
    const b = el('div', `banner ${cls}`, `<div class="over">${esc(over)}</div><div class="big">${esc(big)}</div>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}`);
    document.body.appendChild(b);
    requestAnimationFrame(() => b.classList.add('show'));
    const reduced = document.documentElement.classList.contains('reduced');
    return wait(reduced ? 1200 : 2300).then(() => b.remove());
  }

  private toast(html: string): void {
    const t = el('div', 'toast', html);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3700);
  }

  // ======================================================================= titre

  private title(): void {
    this.root.innerHTML = '';
    this.s = null;
    this.audio.setEra(0);
    // le paysage du titre : les ruines des civilisations passées, au pied d'un feu neuf
    const demo = this.e.newGame(this.meta.runs * 977 + 13, nextSetup(this.meta, { dessein: 'etoiles' }));
    this.setEraColor(0);
    this.scene.setMood({ danger: 0, crisis: false, dead: false });
    this.scene.setSnapshot(snapshot(this.e, demo), { instant: true });
    const saved = store.game();
    const last = this.meta.chronicle[0];
    this.openScreen('soft title', (inner) => {
      inner.style.margin = 'auto 0';
      inner.innerHTML = `<h1 class="logo">Citadeck</h1>
        <p class="tagline">Dix mille ans, quatre familles, une cité. Les familles se souviennent de tout.</p>
        ${last ? `<p class="title-past">Sur la colline, les ruines de <b>${esc(last.name)}</b>. ${esc(last.epitaph)}</p>` : ''}`;
      const btns = el('div', 'btns');
      if (saved) btns.appendChild(this.button(`Reprendre ${saved.name}`, () => this.resume(saved)));
      btns.appendChild(this.button(saved ? 'Nouvelle civilisation' : 'Fonder une civilisation', () => this.setup(), saved ? 'ghost' : ''));
      inner.appendChild(btns);
      const small = el('div', 'btns');
      if (this.meta.chronicle.length) small.appendChild(this.button(`Chronique (${this.meta.chronicle.length})`, () => this.chronicleScreen(), 'ghost small'));
      small.appendChild(this.button('Réglages', () => this.settingsScreen(() => this.title()), 'ghost small'));
      inner.appendChild(small);
    }, (k) => {
      if (k === 'Enter') saved ? this.resume(saved) : this.setup();
    });
  }

  private button(label: string, fn: () => void, cls = ''): HTMLButtonElement {
    const b = el('button', `btn ${cls}`, esc(label));
    b.addEventListener('click', () => {
      this.audio.ui();
      fn();
    });
    return b;
  }

  // ======================================================================= fondation

  private setup(): void {
    const seed = (Date.now() % 1_000_000_007) ^ Math.floor(Math.random() * 1e6);
    const name = civName(seed);
    let dessein = 'etoiles';
    let origin = 'feu';
    let iron = false;
    const first = this.meta.runs === 0;
    this.openScreen('veil setup', (inner) => {
      const render = () => {
        inner.innerHTML = `<div class="over">Une nouvelle civilisation</div><h2 class="big">${esc(name)}</h2>
          <p class="sub">${first ? 'Un feu, quatre familles. Choisissez ce que vous voulez devenir.' : 'Sur les ruines des précédentes, une autre tentative.'}</p>
          <div class="label">Le grand dessein</div>`;
        const tiles = el('div', 'tiles');
        for (const d of this.e.c.desseins) {
          const t = el('button', `tile${d.id === dessein ? ' sel' : ''}`, `<em>${esc(d.tag === 'Science' ? 'Science' : d.tag === 'Guerre' ? 'Guerre' : 'Culture')} · 5 merveilles</em><b>${esc(d.name)}</b><span>${esc(d.pitch.replace('{rival}', 'la rivale').replace('{cite}', name))}</span>`);
          t.addEventListener('click', () => {
            dessein = d.id;
            this.audio.ui();
            render();
          });
          tiles.appendChild(t);
        }
        inner.appendChild(tiles);
        inner.appendChild(el('div', 'label', 'L’origine'));
        const ot = el('div', 'tiles');
        for (const o of this.e.c.origins) {
          const open = o.id === 'feu' || this.meta.unlocked.includes(o.id);
          const u = UNLOCKS.find((x) => x.id === o.id);
          const t = el('button', `tile${o.id === origin ? ' sel' : ''}`, open
            ? `<b>${esc(o.name)}</b><span>${esc(o.text)}</span>`
            : `<em>${ICON.lock} Verrouillée</em><b>${esc(o.name)}</b><span>${esc(u?.how ?? '')}</span>`);
          if (!open) t.disabled = true;
          t.addEventListener('click', () => {
            origin = o.id;
            this.audio.ui();
            render();
          });
          ot.appendChild(t);
        }
        inner.appendChild(ot);
        if (this.meta.unlocked.includes('fer')) {
          const tg = el('button', `toggle${iron ? ' on' : ''}`, `<span><b>L’Âge de fer</b><br><small style="color:var(--dim)">Crises 20 % plus dures.</small></span><i></i>`);
          tg.addEventListener('click', () => {
            iron = !iron;
            render();
          });
          inner.appendChild(tg);
        }
        const go = el('div', 'btns');
        go.appendChild(this.button(`Fonder ${name}`, () => this.start(seed, { dessein, origin, iron, name })));
        go.appendChild(this.button('Retour', () => this.title(), 'ghost'));
        inner.appendChild(go);
      };
      render();
    }, (k) => {
      if (k === 'Enter') this.start(seed, { dessein, origin, iron, name });
      if (k === 'Escape') this.title();
    });
  }

  private start(seed: number, c: { dessein: string; origin: string; iron: boolean; name: string }): void {
    const setup = { ...nextSetup(this.meta, c), name: c.name };
    this.s = this.e.newGame(seed, setup);
    store.saveGame(this.s);
    this.audio.revive();
    this.enterGame(true);
  }

  private resume(s: GameState): void {
    this.s = s;
    this.audio.revive();
    this.enterGame(false);
  }

  // ======================================================================= partie

  private enterGame(fresh: boolean): void {
    const s = this.s!;
    this.closeScreen();
    this.root.innerHTML = '';
    this.root.append(el('header', '', ''), el('main', '', ''), el('div', 'after'));
    (this.root.children[0] as HTMLElement).id = 'hud';
    (this.root.children[1] as HTMLElement).id = 'stage';
    this.hudRes = {};
    this.hudQ = -1;
    this.setEraColor(s.era);
    this.audio.setEra(s.era);
    this.scene.setMood({ danger: 0, crisis: s.phase === 'crise', dead: false });
    this.scene.setSnapshot(snapshot(this.e, s), { instant: true });
    this.renderHud();
    if (fresh) this.hint('debut', `<b>${esc(s.name)}</b> commence. En haut, vos réserves et vos quatre familles. En bas, la cité : elle grandit avec vous.`);
    this.next();
  }

  private next(): void {
    const s = this.s!;
    if (s.phase === 'fin') {
      void this.endFlow();
      return;
    }
    if (s.phase === 'presage') {
      this.showPresage();
      return;
    }
    this.renderCard(this.e.view(s)!);
  }

  // ----------------------------------------------------------------------- HUD

  private renderHud(): void {
    const s = this.s!;
    const hud = document.getElementById('hud')!;
    const upkeep = Math.ceil(s.quartiers * 1.5);
    const rv = this.e.rival(s);
    const phaseIdx = s.phase === 'saison' ? s.saison : s.phase === 'chantier' ? 2 : s.phase === 'crise' ? 3 : s.phase === 'finere' ? 4 : -1;
    const top = `<div class="hud-top">
      <div class="stat q${s.quartiers <= 2 ? ' low' : ''}" data-k="q" title="Quartiers : votre cité. À zéro, elle tombe.">${ICON.house}<b>${s.quartiers}</b><small>quartiers</small><span class="delta"></span></div>
      ${RES.map((r) => `<div class="stat r-${r}${r === 'vivres' && s.res.vivres < upkeep ? ' hunger' : ''}" data-k="${r}" title="${RES_LABEL[r]}${r === 'vivres' ? ` — la cité en mangera ${upkeep} en fin d’ère` : ''}">${RES_ICON[r]}<b>${s.res[r]}</b><span class="delta"></span></div>`).join('')}
      <div class="hud-sp"></div>
      <div class="era-pill" title="${esc(ERA_NAMES[s.era])} : deux saisons, le chantier, la crise, le bilan"><div class="era-name"><b>${ROMAN[s.era]}</b><span>${esc(ERA_NAMES[s.era].replace(/^L’|^L'|^Le |^La /, ''))}</span></div>
        <div class="phase">${PHASES.map((_, i) => `<i class="${i === 3 ? 'cr ' : ''}${i < phaseIdx ? 'done' : i === phaseIdx ? 'now' : ''}"></i>`).join('')}</div></div>
      RACE
      <button class="icon-btn" data-act="settings" aria-label="Réglages">${ICON.gear}</button>
    </div>`;
    const fams = FAMILIES.map((f) => this.famHtml(this.e.familyInfo(s, f))).join('');
    const race = `<div class="race" style="--rh:${rv.hue}" title="Votre dessein contre celui de ${esc(rv.name)}">
      <div class="rr me">${[0, 1, 2, 3, 4].map((i) => `<i class="${s.jalons[i] ? 'on' : ''}"></i>`).join('')}</div>
      <div class="rr them">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < s.rivalJalons ? 'on' : ''}"></i>`).join('')}</div></div>`;
    hud.innerHTML = `${top.replace('RACE', race)}<div class="hud-row2"><div class="fams">${fams}</div></div>`;
    hud.querySelector('[data-act=settings]')!.addEventListener('click', () => this.settingsScreen(() => this.closeScreen()));
    hud.querySelectorAll<HTMLElement>('.fam').forEach((b) => b.addEventListener('click', () => this.famPopover(b.dataset.f as FamilyId, b)));
    // deltas animés
    for (const r of RES) {
      const old = this.hudRes[r];
      if (old !== undefined && old !== s.res[r]) this.flashStat(r, s.res[r] - old);
      this.hudRes[r] = s.res[r];
    }
    if (this.hudQ >= 0 && this.hudQ !== s.quartiers) this.flashStat('q', s.quartiers - this.hudQ);
    this.hudQ = s.quartiers;
  }

  private flashStat(k: string, d: number): void {
    const st = document.querySelector<HTMLElement>(`#hud .stat[data-k="${k}"]`);
    if (!st) return;
    const de = st.querySelector('.delta')!;
    de.textContent = `${d > 0 ? '+' : '−'}${Math.abs(d)}`;
    de.className = `delta ${d > 0 ? 'up' : 'down'}`;
    st.classList.remove('bump');
    void st.offsetWidth;
    st.classList.add('bump');
  }

  private famSvg(fi: FamilyInfo, size: number, era: number): string {
    const id = `m${fi.id}${Math.random().toString(36).slice(2, 7)}`;
    const sp = { motif: fi.motif, hue: fi.hue, mood: fi.loy, era, scars: fi.scars };
    return `<svg class="med" viewBox="0 0 100 100" width="${size}" height="${size}"><defs><radialGradient id="${id}p" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="hsl(${fi.hue} 55% 32%)"/><stop offset="1" stop-color="hsl(${fi.hue} 45% 9%)"/></radialGradient></defs>${medallion(sp, 50, 52, 38, id)}</svg>`;
  }

  private famHtml(fi: FamilyInfo): string {
    const pips = [-3, -2, -1, 0, 1, 2, 3]
      .map((v) => (v === 0 ? '<i class="mid"></i>' : `<i class="${(v < 0 && fi.loy <= v) || (v > 0 && fi.loy >= v) ? 'on ' : ''}${v < 0 ? 'neg' : 'pos'}"></i>`))
      .join('');
    const cls = fi.state !== 'presente' ? 'gone' : fi.loy <= -2 ? 'hostile' : fi.loy >= 2 ? 'devoted' : '';
    const short = fi.house.replace(/^Les /, '');
    return `<button class="fam ${cls}" data-f="${fi.id}" aria-label="${esc(fi.house)} : ${esc(fi.mood)}">${this.famSvg(fi, 34, this.s!.era)}
      <span class="fn"><span class="fh">${esc(short)}</span><span class="pips">${pips}</span><span class="fm">${esc(fi.mood)}</span></span>
      ${fi.neglected ? `<span class="neg-mark" title="Délaissés">${ICON.warn}</span>` : ''}<span class="fdelta"></span></button>`;
  }

  private famPopover(f: FamilyId, anchor: HTMLElement): void {
    const s = this.s!;
    const fi = this.e.familyInfo(s, f);
    const riv = this.e.familyInfo(s, fi.rivalOf);
    const veil = el('div', 'pop-veil');
    const pop = el('div', 'pop');
    pop.innerHTML = `<div class="row" style="display:flex;gap:10px;align-items:center">${this.famSvg(fi, 54, s.era)}<div><h4>${esc(fi.house)}</h4><p class="note">${esc(fi.head)} · ${esc(fi.trade)} · ${esc(fi.mood)} (${fi.loy > 0 ? '+' : ''}${fi.loy})</p></div></div>
      <p>Domaine : ${esc(fi.tag)}, ${esc(RES_LABEL[fi.res])}. Ils méprisent ${esc(riv.house.toLowerCase().replace(/^les /, 'les '))} : les favoriser vous coûte leur amitié.</p>
      ${fi.grudge ? `<p>Ils se souviennent : <q>« ${esc(fi.grudge.label)} »</q>, ${esc(fi.grudge.date)}.</p>` : ''}
      ${fi.favor ? `<p>Ils vous savent gré : <q>« ${esc(fi.favor.label)} »</q>, ${esc(fi.favor.date)}.</p>` : ''}
      ${fi.neglected ? '<p style="color:#ffc0a8">Vous ne leur avez pas rendu visite depuis deux ères. Ils le prennent mal.</p>' : ''}
      <p class="note">À −3, ils se révoltent. À −2, ils trahissent pendant les crises. À +2, ils comptent pour la Culture. À +3, ils apportent leur part.</p>`;
    const r = anchor.getBoundingClientRect();
    pop.style.left = `${Math.max(8, Math.min(window.innerWidth - Math.min(window.innerWidth * 0.92, 360) - 8, r.left + r.width / 2 - 180))}px`;
    pop.style.top = `${r.bottom + 8}px`;
    const close = () => {
      veil.remove();
      pop.remove();
    };
    veil.addEventListener('click', close);
    pop.addEventListener('click', close);
    document.body.append(veil, pop);
  }

  // ----------------------------------------------------------------------- carte

  private artFor(v: View): ArtSpec {
    const s = this.s!;
    const c = v.card;
    const fam = v.family;
    const fi = fam ? this.e.familyInfo(s, fam) : undefined;
    let hue = c.art?.hue ?? (fi ? fi.hue : c.kind === 'crise' ? 8 : c.kind === 'rivale' ? this.e.rival(s).hue : c.kind === 'ruines' || c.kind === 'revenant' ? 270 : 32);
    if (c.kind === 'jalon') hue = 42;
    const spec: ArtSpec = { key: c.id + s.era, motif: c.art?.motif ?? KIND_MOTIF[c.kind] ?? (fi?.motif ?? 'star'), hue, alarm: c.kind === 'crise' || c.kind === 'trahison' };
    if (fi) spec.speaker = { motif: fi.motif, hue: fi.hue, mood: fi.loy, era: s.era, scars: fi.scars };
    else if (c.kind === 'rivale') spec.speaker = { motif: 'crown', hue: this.e.rival(s).hue, mood: s.rivalRel, era: s.era, scars: 0 };
    if (spec.speaker && spec.motif === spec.speaker.motif) spec.motif = KIND_MOTIF[c.kind] ?? 'star';
    return spec;
  }

  private renderCard(v: View): void {
    const s = this.s!;
    const stage = document.getElementById('stage')!;
    const fi = v.family ? this.e.familyInfo(s, v.family) : undefined;
    const head = v.header ?? (v.kind === 'famille' && fi ? fi.house : KIND_LABEL[v.kind] ?? '');
    const from = s.prompt?.from;
    const card = el('article', `card enter${v.kind === 'crise' || v.kind === 'trahison' ? ' alarm' : ''}`);
    card.innerHTML = `<div class="card-art">${cardArt(this.artFor(v))}<div class="card-head"><span${from ? ' class="from"' : ''}>${esc(head)}</span><span>${esc((s.history.length ? s.history[s.history.length - 1].date : '').replace(' avant le Calendrier', ' av. C.'))}</span></div></div>
      <div class="card-body"><h2 class="card-title">${esc(v.title)}</h2>${v.speaker && v.kind !== 'carrefour' ? `<p class="card-speaker">${esc(v.speaker)}</p>` : ''}<div class="card-rule"></div><p class="card-text">${rich(v.text)}</p></div>`;
    const opts = el('div', 'opts');
    v.options.forEach((o, i) => opts.appendChild(this.optButton(o, i, v)));
    card.appendChild(opts);
    stage.innerHTML = '';
    stage.appendChild(card);
    this.audio.cardIn();
    this.keyHandler = (k) => {
      const n = Number(k);
      if (n >= 1 && n <= v.options.length) void this.choose(n - 1);
    };
    this.cardHints(v);
  }

  private optButton(o: OptionView, i: number, v: View): HTMLButtonElement {
    const s = this.s!;
    const b = el('button', 'opt');
    const costs = Object.keys(o.cost).length
      ? RES.filter((r) => o.cost[r]).map((r) => `<span class="chip r-${r}${s.res[r] < (o.cost[r] ?? 0) ? ' short' : ''}">${RES_ICON[r]}<b>${o.cost[r]}</b></span>`).join('')
      : v.kind === 'carrefour' || v.kind === 'presage' ? '' : '<span class="chip free">gratuit</span>';
    const fams = o.families.map((f) => {
      const d = this.e.c.families[f];
      return `<span class="fdot" style="--h:${d.hue}" title="${esc(capitalize(d.house[s.era]))} sont concernés">${this.miniMotif(d.motif, d.hue)}</span>`;
    }).join('');
    const meta = `${fams}${o.later ? `<span class="meta-ico" title="Cela aura des suites">${ICON.hourglass}</span>` : ''}${o.odds !== undefined ? `<span class="odds" title="Chance de réussite">${ICON.dice}${Math.round(o.odds * 100)} %</span>` : ''}`;
    b.innerHTML = `<span class="opt-n">${i + 1}</span><span class="opt-main"><span class="opt-label">${esc(o.label)}</span>
      ${o.detail ? `<span class="opt-detail">${esc(o.detail)}</span>` : ''}
      ${o.risk ? `<span class="opt-warn">${ICON.warn}<span>${esc(o.risk)}</span></span>` : ''}
      ${o.warn ? `<span class="opt-warn">${ICON.warn}<span>${esc(o.warn)}</span></span>` : ''}
      ${o.req ? `<span class="opt-req${o.reqOk ? '' : ' ko'}">${o.reqOk ? '✓' : ICON.lock}<span>Exige ${esc(o.req)}</span></span>` : ''}
      </span><span class="opt-side"><span class="opt-cost">${costs}</span><span class="opt-meta">${meta}</span></span>`;
    if (!o.enabled) b.disabled = true;
    b.addEventListener('click', () => void this.choose(i));
    return b;
  }

  private miniMotif(m: string, hue: number): string {
    const letter: Record<string, string> = { fang: 'O', eye: 'S', spiral: 'B', coin: 'T' };
    return `<svg viewBox="0 0 18 18"><text x="9" y="13" text-anchor="middle" font-family="Cinzel, serif" font-weight="700" font-size="10" fill="hsl(${hue} 80% 82%)">${letter[m] ?? '•'}</text></svg>`;
  }

  // ----------------------------------------------------------------------- choisir

  private async choose(i: number): Promise<void> {
    const s = this.s;
    if (!s || this.lock) return;
    const v = this.e.view(s);
    if (!v || !v.options[i]?.enabled) return;
    this.lock = true;
    this.keyHandler = null;
    const card = document.querySelector('#stage .card');
    card?.querySelectorAll('.opt')[i]?.classList.add('picked');
    this.audio.swipe(i % 2 ? 'right' : 'left');
    await wait(160);
    const ev = this.e.act(s, i);
    store.saveGame(s.phase === 'fin' ? null : s);
    card?.classList.add('leave');
    await wait(240);
    await this.feedback(ev, v);
    this.lock = false;
  }

  /** Montre ce que le choix a fait : réserves, familles, quartiers, réponse, et les grands moments. */
  private async feedback(ev: Ev[], v: View): Promise<void> {
    const s = this.s!;
    const after = this.root.querySelector('.after') as HTMLElement;
    after.innerHTML = '';
    const reply = ev.filter((x) => x.type === 'reply').map((x) => (x as { text: string }).text).join(' ');
    const chips: string[] = [];
    // ressources (bilan net)
    const res = ev.filter((x) => x.type === 'res') as { before: Record<Res, number>; after: Record<Res, number> }[];
    if (res.length) {
      const b0 = res[0].before;
      const a1 = res[res.length - 1].after;
      for (const r of RES) {
        const d = a1[r] - b0[r];
        if (d) chips.push(`<span class="chip r-${r}">${RES_ICON[r]}<b>${d > 0 ? '+' : '−'}${Math.abs(d)}</b></span>`);
      }
    }
    const loy = new Map<FamilyId, number>();
    for (const x of ev) if (x.type === 'loy') loy.set(x.family, (loy.get(x.family) ?? 0) + x.delta);
    for (const [f, d] of loy) {
      if (!d) continue;
      const h = capitalize(this.e.c.families[f].house[s.era]).replace(/^Les /, '');
      chips.push(`<span class="chip fam ${d > 0 ? 'up' : 'down'}">${esc(h)} <b>${d > 0 ? '▲' : '▼'}${Math.abs(d) > 1 ? Math.abs(d) : ''}</b></span>`);
    }
    for (const x of ev) {
      if (x.type === 'quartiers' && x.delta) chips.push(`<span class="chip q${x.delta > 0 ? ' gain' : ''}">${ICON.house}<b>${x.delta > 0 ? '+' : '−'}${Math.abs(x.delta)}</b>&nbsp;${x.delta < 0 ? `quartier · ${esc(x.cause)}` : 'quartier'}</span>`);
      if (x.type === 'quartiers' && x.shielded) chips.push(`<span class="chip note">Une merveille vous protège : ${esc(x.cause)} évitée</span>`);
      if (x.type === 'sched') chips.push(`<span class="chip note">${ICON.hourglass}&nbsp;Cela aura des suites</span>`);
      if (x.type === 'bet') chips.push(`<span class="chip note">${ICON.dice}&nbsp;${x.win ? 'Réussi' : 'Raté'} (${Math.round(x.chance * 100)} %)</span>`);
      if (x.type === 'card+' && this.e.card(x.id).kind === 'decouverte') chips.push(`<span class="chip note">Découverte : ${esc(this.e.card(x.id).title)}</span>`);
      if (x.type === 'rival') chips.push(`<span class="chip note">${esc(capitalize(this.e.rival(s).name))} ${x.delta > 0 ? '▲' : '▼'}</span>`);
    }
    if (reply) after.appendChild(el('p', 'reply', esc(reply)));
    if (chips.length) after.appendChild(el('div', 'fx', chips.join('')));
    requestAnimationFrame(() => after.querySelector('.reply')?.classList.add('show'));
    // familles : éclat sur l'emblème
    this.renderHud();
    for (const [f, d] of loy) {
      const b = document.querySelector<HTMLElement>(`#hud .fam[data-f="${f}"]`);
      if (!b || !d) continue;
      b.classList.add(d > 0 ? 'up' : 'down');
      const fd = b.querySelector('.fdelta')!;
      fd.textContent = d > 0 ? `+${d}` : `−${-d}`;
      fd.className = `fdelta ${d > 0 ? 'up' : 'down'}`;
      this.audio.gauge(FAMILIES.indexOf(f), d > 0, Math.abs(d) > 1);
    }
    // la scène réagit
    this.scene.setMood({ danger: s.quartiers <= 1 ? 1 : s.quartiers <= 2 ? 0.5 : 0, crisis: s.phase === 'crise' });
    const lostQ = ev.some((x) => x.type === 'quartiers' && x.delta < 0);
    if (lostQ) this.audio.crisisHit();
    this.scene.setSnapshot(snapshot(this.e, s));
    this.scene.pulse(lostQ ? 0.2 : 0.45);

    // les grands moments
    const jal = ev.find((x) => x.type === 'jalon') as { name: string } | undefined;
    if (jal) {
      this.audio.wonder();
      await this.banner('Merveille bâtie', jal.name, 'gold');
    }
    if (ev.some((x) => x.type === 'end')) {
      await this.endFlow();
      return;
    }
    const eraEnd = ev.some((x) => x.type === 'upkeep' || x.type === 'famine');
    if (eraEnd) await this.showBilan(ev);
    const cr = ev.find((x) => x.type === 'crisis') as { name: string } | undefined;
    if (cr) {
      this.audio.crisisHit();
      this.audio.setTension(0.7, true);
      this.scene.setMood({ crisis: true });
      this.hint('crise', 'La <b>crise</b> commence : trois cartes, des seuils annoncés. Ce qui la protège était écrit dans le présage.');
      await this.banner(`Crise · ${ROMAN[s.era]}`, cr.name, 'crisis');
    }
    const era = ev.find((x) => x.type === 'era') as { era: number } | undefined;
    if (era) {
      this.audio.setTension(0, false);
      this.scene.setMood({ crisis: false });
      await this.eraTransition(era.era);
    }
    this.next();
  }

  private async eraTransition(era: number): Promise<void> {
    const s = this.s!;
    this.setEraColor(era);
    this.audio.setEra(era);
    this.audio.eraShift(era);
    this.scene.setSnapshot(snapshot(this.e, s), { eraDuration: 3.4 });
    this.renderHud();
    document.getElementById('stage')!.innerHTML = '';
    await this.banner(`Ère ${ROMAN[era]}`, ERA_NAMES[era], '', ERA_SUBTITLES[era]);
  }

  // ----------------------------------------------------------------------- présage

  private showPresage(): void {
    const s = this.s!;
    const p = this.e.presageInfo(s);
    document.getElementById('stage')!.innerHTML = '';
    const go = () => {
      if (this.lock) return;
      this.closeScreen();
      const ev = this.e.act(s, 0);
      store.saveGame(s);
      void this.feedback(ev, this.e.view(s)!);
    };
    this.openScreen('soft presage', (inner) => {
      inner.innerHTML = `<div class="over">Ère ${ROMAN[p.era]} · ${esc(p.date)}</div><h2 class="big">${esc(p.name)}</h2><p class="sub">${esc(p.subtitle)}</p>`;
      if (p.legacy) {
        inner.appendChild(el('div', 'panel legacy', `<h3>L’héritage de ${esc(p.legacy.from)}</h3>
          ${p.legacy.testament ? `<p>Sur leur stèle : <q>« ${esc(p.legacy.testament)} »</q></p>` : ''}
          ${p.legacy.label ? `<p class="note">${esc(p.legacy.label)}${p.legacy.heirs ? ' (compté double : vous êtes leurs héritiers)' : ''}.</p>` : ''}`));
      }
      const stars = `<span class="stars">${[0, 1, 2, 3, 4].map((i) => `<i class="${s.jalons[i] ? 'on' : ''}"></i>`).join('')}</span>`;
      const jal = p.jalon
        ? `<p>Cette ère, on peut bâtir <b>${esc(p.jalon.name)}</b> : ${esc(p.jalon.text)}</p><div class="row">${bagChips(p.jalon.cost)}${p.jalon.req ? `<span class="note">· exige ${esc(p.jalon.req)}</span>` : ''}</div><p class="note">${esc(p.jalon.gift)}</p>
          ${p.alt ? `<p>Ou bien <b>${esc(p.alt.name)}</b> : ${esc(p.alt.text)}</p><div class="row">${bagChips(p.alt.cost)}${p.alt.req ? `<span class="note">· exige ${esc(p.alt.req)}</span>` : ''}</div><p class="note">${esc(p.alt.gift)}</p>` : ''}`
        : '<p class="note">Le jalon de cette ère est déjà debout.</p>';
      inner.appendChild(el('div', 'panel', `<h3><span>Le dessein · ${esc(p.dessein)}</span>${stars}</h3>${jal}<p class="note">Le chantier ouvre après les deux saisons, juste avant la crise.</p>`));
      inner.appendChild(el('div', 'panel crisis', `<h3>La crise de l’ère · ${esc(p.crisis.name)}</h3><p>${esc(p.crisis.intro)}</p><p><b>Ce qui protège :</b> ${esc(p.crisis.protects)}.</p>
        ${p.envy ? `<p class="warnline">Vos ${p.built} merveille${p.built > 1 ? 's' : ''} attire${p.built > 1 ? 'nt' : ''} les regards : la crise sera ${p.envy} % plus dure.</p>` : ''}`));
      const rv = this.e.rival(s);
      inner.appendChild(el('div', 'panel', `<h3><span>La rivale · ${esc(p.rival.name)}</span><span class="stars them" style="--rh:${rv.hue}">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < p.rival.count ? 'on' : ''}"></i>`).join('')}</span></h3>
        <p>${esc(p.rival.leader)} ${p.rival.count ? `a déjà ${p.rival.count} merveille${p.rival.count > 1 ? 's' : ''}` : 'n’a encore rien bâti'}. À la fin de l’ère : ${esc(p.rival.next)}, si personne ne l’en empêche. Relations : ${p.rival.rel <= -2 ? 'la guerre froide' : p.rival.rel === -1 ? 'tendues' : p.rival.rel === 0 ? 'polies' : p.rival.rel === 1 ? 'cordiales' : 'chaleureuses, presque suspectes'}.</p>`));
      inner.appendChild(el('p', 'note', `En fin d’ère, la cité mangera ${p.upkeep} Vivres${s.res.vivres < p.upkeep ? ` (vous en avez ${s.res.vivres})` : ''}. L’Armée et le Trésor s’érodent un peu.`));
      (inner.lastChild as HTMLElement).style.cssText = 'color:var(--dim);font-size:13px;text-align:center;margin:0';
      const btns = el('div', 'btns');
      btns.appendChild(this.button('En route', go));
      inner.appendChild(btns);
      if (s.tutorial && s.era === 0) inner.appendChild(el('p', 'hint', 'Le <b>présage</b> annonce l’ère : la merveille à bâtir, la crise qui vient, ce qui en protège. Tout le reste, il faudra le lire sur les cartes.'));
    }, (k) => {
      if (k === 'Enter' || k === ' ') go();
    });
  }

  // ----------------------------------------------------------------------- bilan d'ère

  private showBilan(ev: Ev[]): Promise<void> {
    const s = this.s!;
    const lines: { cls: string; ico: string; html: string }[] = [];
    const H = (f: FamilyId) => capitalize(this.e.c.families[f].house[s.era]);
    for (const x of ev) {
      if (x.type === 'revolt') lines.push({ cls: 'bad', ico: ICON.warn, html: `<b>${esc(H(x.family))} se révoltent.</b> Un quartier brûle. Ils se calment, pour l’instant.` });
      if (x.type === 'defect') lines.push({ cls: 'bad', ico: ICON.warn, html: `<b>${esc(H(x.family))} passent chez ${esc(this.e.rival(s).name)}.</b> Avec un quartier entier.` });
      if (x.type === 'neglect') lines.push({ cls: 'bad', ico: ICON.warn, html: `${esc(H(x.family))} se sentent délaissés : vous n’êtes pas passé chez eux depuis deux ères.` });
      if (x.type === 'income') lines.push({ cls: 'good', ico: ICON.star, html: `Une famille dévouée apporte sa part : ${bagChips(x.bag, '+')}` });
      if (x.type === 'decay') lines.push({ cls: '', ico: RES_ICON.armee, html: `Les vétérans rentrent chez eux, les comptables se servent : ${bagChips({ armee: x.armee, tresor: x.tresor }, '−')}` });
      if (x.type === 'upkeep') lines.push({ cls: '', ico: RES_ICON.vivres, html: `La cité mange : ${bagChips({ vivres: x.amount }, '−')}` });
      if (x.type === 'famine') lines.push({ cls: 'bad', ico: ICON.warn, html: '<b>Famine.</b> Les greniers sont vides. Un quartier se vide aussi.' });
      if (x.type === 'rivalJalon') lines.push({ cls: 'bad', ico: ICON.star, html: `${esc(capitalize(this.e.rival(s).name))} achèvent <b>${esc(x.name)}</b> (${x.count}/5).` });
    }
    if (!lines.length) return Promise.resolve();
    return new Promise((done) => {
      const finish = () => {
        this.closeScreen();
        done();
      };
      this.openScreen('soft bilan', (inner) => {
        inner.innerHTML = `<div class="over">Fin de l’ère · ${esc(ERA_NAMES[s.era])}</div><h2 class="big" style="font-size:clamp(26px,7vw,40px)">Le bilan</h2>`;
        const ul = el('ul', 'ledger');
        lines.forEach((l, i) => {
          const li = el('li', l.cls, `<span class="ico">${l.ico}</span><span>${l.html}</span>`);
          li.style.animationDelay = `${i * 0.12}s`;
          ul.appendChild(li);
        });
        inner.appendChild(ul);
        const b = el('div', 'btns');
        b.appendChild(this.button('Continuer', finish));
        inner.appendChild(b);
        this.hint('bilan', 'Chaque fin d’ère : on mange, on s’use, la rivale avance. Puis viennent la croissance, le procès et les découvertes.', inner);
      }, (k) => {
        if (k === 'Enter' || k === ' ') finish();
      });
    });
  }

  // ======================================================================= fin de partie

  private async endFlow(): Promise<void> {
    const s = this.s!;
    const r = s.result;
    if (!r) return;
    document.getElementById('stage')!.innerHTML = '';
    store.saveGame(null);
    if (r.type === 'defaite') {
      this.scene.setMood({ dead: true });
      this.audio.defeat();
      await this.banner('La chute', `${s.name} est tombée`, 'crisis');
    } else {
      this.audio.victory();
      await this.banner(r.ending ? 'Dessein accompli' : 'La fin des temps', s.name, 'gold');
    }
    if (this.s !== s) return;
    this.endScreen(s);
  }

  private endScreen(s: GameState): void {
    const r = s.result!;
    const ep = epitaph(this.e, s);
    const losses = s.losses.map((l) => {
      const h = s.history.filter((x) => x.turn <= l.turn).pop();
      const real = !!this.e.c.cards[l.card];
      const fam = /^(revolte|defection)_(\w+)/.exec(l.card)?.[2] as FamilyId | undefined;
      const why = real && h
        ? `votre choix : « ${esc(h.label)} » (${esc(h.title)})`
        : l.card === 'famine'
          ? `en fin d’ère, les greniers étaient vides`
          : fam
            ? `en fin d’ère : ${esc(capitalize(this.e.c.families[fam].house[l.era]))} étaient à bout${this.e.familyInfo(s, fam).grudge ? `, depuis « ${esc(this.e.familyInfo(s, fam).grudge!.label)} »` : ''}`
            : '';
      return `<li><span class="d">${esc((h?.date ?? '').replace(' avant le Calendrier', ' av. C.'))}</span><span><span class="c">−${l.amount} quartier : ${esc(l.cause)}</span></span>${why ? `<span class="w">${why}</span>` : ''}</li>`;
    }).join('');
    this.openScreen('veil end', (inner) => {
      inner.innerHTML = `<div class="over">${r.type === 'defaite' ? `Défaite · ${esc(ERA_NAMES[s.era])}` : r.ending ? 'Dessein accompli' : 'Survie'}</div>
        <h2 class="big">${esc(s.name)}</h2><p class="epitaph">${esc(ep)}</p>
        <div class="panel"><div class="row" style="justify-content:space-between"><span>Ère atteinte : <b>${ROMAN[s.era]}</b></span><span>Merveilles : <b>${r.jalons}/5</b></span><span>Rivale : <b>${s.rivalJalons}/5</b></span></div></div>
        ${losses ? `<div class="panel"><h3>${r.type === 'defaite' ? 'Ce qui l’a perdue' : 'Ses blessures'}</h3><ul class="losses">${losses}</ul></div>` : ''}`;
      const b = el('div', 'btns');
      b.appendChild(this.button('Graver ses derniers mots', () => this.testamentScreen()));
      inner.appendChild(b);
    }, (k) => {
      if (k === 'Enter') this.testamentScreen();
    });
  }

  private testamentScreen(): void {
    const s = this.s!;
    const ts = testaments(this.e, s);
    const pick = (t: Testament) => {
      const rec = recordRun(this.meta, this.e, s, t);
      this.meta = rec.meta;
      store.saveMeta(this.meta);
      this.chronicleEnd(rec.entry, rec.unlocked);
    };
    this.openScreen('veil testament-screen', (inner) => {
      inner.innerHTML = `<div class="over">Sur la stèle</div><h2 class="big" style="font-size:clamp(24px,7vw,40px)">Derniers mots</h2>
        <p class="sub">La prochaine civilisation trouvera ces mots dans les ruines. Et ce qu’ils lèguent.</p>`;
      ts.forEach((t, i) => {
        const b = el('button', 'testament', `<q>« ${esc(t.text)} »</q><span>Héritage : ${esc(t.legacy.label)}</span>`);
        b.addEventListener('click', () => {
          this.audio.reward();
          pick(t);
        });
        b.dataset.i = String(i);
        inner.appendChild(b);
      });
    }, (k) => {
      const n = Number(k);
      if (n >= 1 && n <= ts.length) pick(ts[n - 1]);
    });
  }

  private chronicleEnd(entry: ChronicleEntry, unlocked: Unlock[]): void {
    const text = `${entry.lines.join('\n')}\n— Citadeck`;
    this.openScreen('veil chronicle-end', (inner) => {
      inner.innerHTML = `<div class="over">La chronique retiendra</div><h2 class="big" style="font-size:clamp(26px,8vw,46px)">${esc(entry.name)}</h2>
        <div class="panel"><ul class="chron">${entry.lines.map((l) => `<li>${rich(l)}</li>`).join('')}</ul></div>`;
      for (const u of unlocked) inner.appendChild(el('div', 'unlock', `<span class="ico">${ICON.star}</span><span><b>Débloqué : ${esc(u.name)}</b><br><span>${esc(u.text)}</span></span>`));
      const b = el('div', 'btns');
      b.appendChild(this.button('Une autre civilisation', () => this.setup()));
      const share = this.button('Copier la chronique', () => {
        void navigator.clipboard?.writeText(text).then(() => this.toast('Chronique copiée.'), () => this.toast('Impossible de copier.'));
      }, 'ghost');
      b.appendChild(share);
      b.appendChild(this.button('Menu', () => this.title(), 'ghost'));
      inner.appendChild(b);
      inner.appendChild(el('p', 'note', 'Ses ruines vous attendent dans la prochaine partie.'));
      (inner.lastChild as HTMLElement).style.cssText = 'color:var(--faint);font-size:13px;margin:0';
    }, (k) => {
      if (k === 'Enter') this.setup();
    });
  }

  // ======================================================================= chronique et réglages

  private chronicleScreen(): void {
    this.openScreen('veil chronicle', (inner) => {
      inner.innerHTML = `<div class="over">${this.meta.chronicle.length} civilisation${this.meta.chronicle.length > 1 ? 's' : ''}</div><h2 class="big" style="font-size:clamp(26px,8vw,46px)">La Chronique</h2>`;
      const list = el('div', 'past');
      for (const c of this.meta.chronicle) {
        const d = el('details');
        d.innerHTML = `<summary><b>${esc(c.name)}</b><span>${c.result === 'victoire' ? (c.ending ? 'Dessein accompli' : 'Survie') : `Tombée à ${esc(ERA_NAMES[c.era].toLowerCase())}`} · ${esc(c.epitaph)}</span></summary><ul class="chron">${c.lines.map((l) => `<li>${rich(l)}</li>`).join('')}</ul>`;
        list.appendChild(d);
      }
      inner.appendChild(list);
      const locked = UNLOCKS.filter((u) => !this.meta.unlocked.includes(u.id));
      if (locked.length) {
        inner.appendChild(el('div', 'label', 'À découvrir'));
        const p = el('div', 'panel');
        p.innerHTML = locked.map((u) => `<p class="note">${ICON.lock.replace('<svg', '<svg style="width:12px;height:12px;display:inline;fill:none;stroke:currentColor;stroke-width:2;vertical-align:-1px"')} <b>${esc(u.name)}</b> — ${esc(u.how)}</p>`).join('');
        inner.appendChild(p);
      }
      const b = el('div', 'btns');
      b.appendChild(this.button('Retour', () => this.title(), 'ghost'));
      inner.appendChild(b);
    }, (k) => {
      if (k === 'Escape') this.title();
    });
  }

  private settingsScreen(back: () => void): void {
    const prevKeys = this.keyHandler;
    const close = () => {
      store.saveSettings(this.settings);
      this.keyHandler = prevKeys;
      back();
    };
    this.openScreen('veil settings', (inner) => {
      const render = () => {
        const st = this.settings;
        inner.innerHTML = `<div class="over">Citadeck</div><h2 class="big" style="font-size:clamp(26px,8vw,40px)">Réglages</h2>`;
        const t = el('button', `toggle${st.sound ? ' on' : ''}`, '<span>Son</span><i></i>');
        t.addEventListener('click', () => {
          st.sound = !st.sound;
          this.applySettings();
          render();
        });
        inner.appendChild(t);
        const seg = (label: string, opts: [string, string][], cur: string, set: (v: string) => void) => {
          const row = el('div', 'toggle', `<span>${esc(label)}</span>`);
          const sg = el('div', 'seg');
          for (const [v, l] of opts) {
            const b = el('button', v === cur ? 'on' : '', esc(l));
            b.addEventListener('click', () => {
              set(v);
              this.applySettings();
              render();
            });
            sg.appendChild(b);
          }
          row.appendChild(sg);
          inner.appendChild(row);
        };
        seg('Volume', [['0.35', 'Bas'], ['0.7', 'Moyen'], ['1', 'Fort']], String(st.volume), (v) => (st.volume = Number(v)));
        seg('Effets', [['auto', 'Auto'], ['high', 'Hauts'], ['low', 'Sobres']], st.quality, (v) => (st.quality = v as Settings['quality']));
        seg('Animations', [['sys', 'Système'], ['on', 'Réduites'], ['off', 'Pleines']], st.reducedMotion === null ? 'sys' : st.reducedMotion ? 'on' : 'off', (v) => (st.reducedMotion = v === 'sys' ? null : v === 'on'));
        const reset = el('button', 'btn ghost small', 'Effacer la progression');
        let armed = false;
        reset.addEventListener('click', () => {
          if (!armed) {
            armed = true;
            reset.textContent = 'Vraiment ? Toute la chronique sera perdue';
            return;
          }
          store.resetAll();
          this.meta = store.meta();
          this.settings = store.settings();
          this.applySettings();
          this.title();
        });
        const b = el('div', 'btns');
        b.appendChild(this.button('Fermer', close));
        if (this.s) b.appendChild(this.button('Quitter la partie', () => {
          store.saveSettings(this.settings);
          this.title();
        }, 'ghost'));
        inner.appendChild(b);
        const rb = el('div', 'btns');
        rb.appendChild(reset);
        inner.appendChild(rb);
        inner.appendChild(el('p', 'note', 'La partie est sauvegardée à chaque décision. Touches : 1 à 4 pour choisir, Entrée pour continuer.'));
        (inner.lastChild as HTMLElement).style.cssText = 'color:var(--faint);font-size:12.5px;text-align:center;margin:0';
      };
      render();
    }, (k) => {
      if (k === 'Escape') close();
    });
  }

  // ======================================================================= conseils (première partie)

  private hint(key: string, html: string, where?: HTMLElement): void {
    if (!this.s?.tutorial || this.settings.hints.includes(key)) return;
    this.settings.hints.push(key);
    store.saveSettings(this.settings);
    const box = where ?? (this.root.querySelector('.after') as HTMLElement | null);
    if (!box) return;
    box.appendChild(el('p', 'hint', html));
  }

  private cardHints(v: View): void {
    if (v.kind === 'carrefour') this.hint('carrefour', 'Deux <b>saisons</b> par ère. Choisissez où les passer : chaque route mène à une famille, ou vers l’inconnu. Les familles qu’on ne visite pas se vexent.');
    else if (v.options.some((o) => Object.keys(o.cost).length)) this.hint('cout', 'Le <b>coût</b> est affiché. Les gains et les rancunes, non : ils sont dans le texte. Les pastilles disent seulement qui sera concerné.');
    if (v.kind === 'famille') this.hint('famille', 'Les familles <b>se souviennent</b>. Ce que vous décidez ici, leurs descendants vous le reprocheront ou vous en remercieront, citation à l’appui.');
    if (v.kind === 'proces') this.hint('proces', 'Le <b>procès</b> : la famille la plus lésée cite votre pire décision contre elle. Choisissez bien votre avocat.');
    if (v.kind === 'jalon') this.hint('jalon', 'Le <b>chantier</b> : bâtir rapproche du dessein, mais chaque merveille attire la convoitise. La crise suivante sera plus dure.');
    if (v.options.some((o) => o.later)) this.hint('sablier', 'Le <b>sablier</b> : ce choix aura une suite, plus tard.');
  }
}

/** Silhouette d'une merveille sur fond lumineux (présage, fin de partie). */
export function wonderIcon(shape: string, hue: number, size = 128): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const bg = ctx.createRadialGradient(size / 2, size * 0.62, 0, size / 2, size * 0.55, size * 0.62);
  bg.addColorStop(0, `hsl(${hue} 85% 62%)`);
  bg.addColorStop(0.4, `hsl(${hue} 70% 28%)`);
  bg.addColorStop(1, '#08070c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  const env: DrawEnv = { ctx, era: 2, t: 0, body: '#07060b', window: '#ffe2a8', accent: '#ffcf80', gold: '#ffd76a', crop: '#000', lit: 0.8, gilded: 0.6, flicker: 0, emit: () => undefined };
  const k = size / 16;
  ctx.translate(size / 2, size * 0.86);
  ctx.scale(k, -k);
  const e: Elem = { key: shape, kind: 'wonder', sub: shape, x: 0.5, layer: -1, size: 1, r: 0.5, r2: 0, age: 0, state: 0 };
  drawElem(env, e, 0, 1);
  void ERA_SCALE;
  return c;
}
