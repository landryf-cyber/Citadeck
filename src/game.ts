/** Contrôleur : relie le moteur, l'interface, la scène, le son et la sauvegarde. */
import { Engine, type GameEvent } from './core/engine';
import { codeToSeed } from './core/rng';
import { TUNING, GAUGES, KEYWORDS, type CardDef, type GameState, type Side } from './core/types';
import type { AudioEngine } from './audio/audio';
import type { Scene } from './scene/scene';
import type { CivSnapshot } from './scene/city';
import { LOOKS, rgb } from './scene/palette';
import { clearGame, loadGame, saveGame, saveSettings, type Settings } from './save';
import { CardView } from './ui/cardView';
import { el, esc, ICONS, ROMAN, wait } from './ui/dom';
import { Hud } from './ui/hud';
import { Screens } from './ui/screens';
import { KIND_TAG } from './ui/texts';

export class Game {
  state: GameState | null = null;
  readonly hud = new Hud();
  readonly cardView = new CardView();
  readonly screens: Screens;
  private app: HTMLElement;
  private reply: HTMLElement;
  private hint: HTMLElement;
  private eraName: HTMLElement;
  private eraProgress: HTMLElement;
  private deckBtn: HTMLElement;
  private deckCount: HTMLElement;
  private replyTimer = 0;
  private demoTimer = 0;
  private demoEra = 0;
  private demoSeed = (Math.random() * 0x3fffffff) | 0;
  private flowToken = 0;

  constructor(
    readonly engine: Engine,
    readonly scene: Scene,
    readonly audio: AudioEngine,
    readonly settings: Settings,
  ) {
    this.app = document.getElementById('app')!;
    this.screens = new Screens(document.body, (i) => engine.content.eras[i].name);
    this.screens.onUi = () => this.audio.ui();
    this.screens.onWonder = () => this.audio.wonder();

    const stage = el('main');
    stage.id = 'stage';
    const msg = el('div', 'msg');
    this.reply = el('p', 'reply');
    this.reply.setAttribute('role', 'status');
    this.hint = el('p', 'hint');
    msg.append(this.reply, this.hint);
    stage.append(this.cardView.zone, msg);

    const foot = el('footer');
    foot.id = 'foot';
    const block = el('div', 'era-block');
    this.eraName = el('div', 'era-name');
    this.eraProgress = el('div', 'era-progress');
    block.append(this.eraName, this.eraProgress);
    const btns = el('div', 'foot-btns');
    this.deckBtn = el('button', 'icon-btn', `${ICONS.deck}<span class="count"></span>`);
    this.deckBtn.setAttribute('aria-label', 'Voir le deck');
    this.deckCount = this.deckBtn.querySelector('.count') as HTMLElement;
    const gear = el('button', 'icon-btn', ICONS.gear);
    gear.setAttribute('aria-label', 'Réglages');
    btns.append(this.deckBtn, gear);
    foot.append(block, btns);
    this.app.append(this.hud.root, stage, foot);

    this.deckBtn.addEventListener('click', () => {
      if (!this.state) return;
      this.audio.ui();
      this.cardView.disarm();
      this.screens.deck(this.engine, this.state);
    });
    gear.addEventListener('click', () => {
      this.audio.ui();
      this.openSettings();
    });

    this.cardView.onPreview = (side) => {
      if (!this.state) return;
      this.hud.preview(side ? this.engine.preview(this.state, side) : null);
    };
    this.cardView.onDrag = (f) => this.scene.setParallax(f);
    this.cardView.onChoose = (side) => this.choose(side);
    this.cardView.onTouch = () => this.audio.unlock();

    const unlock = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);

    this.applySettings();
  }

  // ------------------------------------------------------------------ réglages

  applySettings(): void {
    const s = this.settings;
    const reduced = s.reducedMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene.reducedMotion = reduced;
    this.cardView.reducedMotion = reduced;
    document.documentElement.classList.toggle('reduced', reduced);
    this.scene.onTier = (tier) => document.documentElement.classList.toggle('fx-low', tier === 0);
    this.scene.setQuality(s.quality);
    this.audio.setEnabled(s.sound);
    this.audio.setVolume(s.volume);
    saveSettings(s);
  }

  private openSettings(): void {
    this.cardView.disarm();
    this.screens.settings(this.settings, () => this.applySettings(), {
      seed: this.state?.seed,
      onQuit: this.state && this.state.phase !== 'end' ? () => this.quit() : undefined,
    });
  }

  private quit(): void {
    clearGame();
    this.flowToken++;
    this.cardView.clear();
    this.cardView.enabled = false;
    this.state = null;
    this.showTitle();
  }

  // ------------------------------------------------------------------ titre

  showTitle(): void {
    this.app.classList.add('hidden-ui');
    this.scene.stopTimelapse();
    this.scene.setMood({ dead: false, crisis: false, danger: 0 });
    this.audio.revive();
    this.audio.setTension(0, false);
    this.demoEra = 0;
    this.setAccent(0);
    this.audio.setEra(0);
    this.scene.setSnapshot(this.demoSnap(0), { eraDuration: 1.8 });
    clearInterval(this.demoTimer);
    this.demoTimer = window.setInterval(() => {
      this.demoEra = (this.demoEra + 1) % 5;
      this.scene.setSnapshot(this.demoSnap(this.demoEra), { eraDuration: 4 });
      this.setAccent(this.demoEra);
      this.audio.setEra(this.demoEra);
    }, 9000);
    this.screens.title({
      save: loadGame(),
      onNew: (seed) => this.newGame(seed),
      onContinue: () => {
        const s = loadGame();
        if (s) this.resume(s);
        else this.newGame();
      },
      onSettings: () => this.openSettings(),
    });
  }

  private demoSnap(era: number): CivSnapshot {
    const g = [58, 62, 66, 70, 74][era];
    const kw = [
      [1, 1, 0, 0, 1, 1],
      [2, 1, 1, 1, 1, 1],
      [3, 2, 1, 1, 2, 1],
      [2, 2, 3, 2, 2, 1],
      [2, 2, 3, 4, 3, 2],
    ][era];
    const wonders = [[], ['w_pyramide'], ['w_pyramide', 'w_cathedrale'], ['w_pyramide', 'w_cathedrale', 'w_horloge'], ['w_pyramide', 'w_cathedrale', 'w_horloge', 'w_ascenseur', 'w_phare']][era];
    return { seed: this.demoSeed, era, growth: 8 + era * 22, gauges: { food: g, army: g - 8, knowledge: g + 6, treasure: g }, kw, wonders };
  }

  private setAccent(era: number): void {
    document.documentElement.style.setProperty('--ui', rgb(LOOKS[era].ui));
  }

  // ------------------------------------------------------------------ partie

  newGame(seed?: number): void {
    const s = seed ?? ((Math.random() * 0x3fffffff) | 0);
    const tutorial = !this.settings.tutorialDone;
    this.begin(this.engine.newGame(s, tutorial), true);
  }

  resume(state: GameState): void {
    this.begin(state, false);
  }

  private begin(state: GameState, fresh: boolean): void {
    clearInterval(this.demoTimer);
    this.flowToken++;
    this.state = state;
    this.screens.closeCurrent();
    this.scene.stopTimelapse();
    this.audio.revive();
    this.scene.setMood({ dead: false, crisis: state.phase === 'crisis', danger: this.dangerLevel() });
    this.scene.setSnapshot(this.snap(), { eraDuration: 1.6 });
    this.setAccent(state.era);
    this.audio.setEra(state.era);
    this.hud.set(state.gauges);
    this.hud.preview(null);
    this.app.classList.remove('hidden-ui');
    this.showReply('');
    saveGame(state);
    if (fresh) {
      this.screens.banner('era', `Ère ${ROMAN[state.era]}`, this.engine.content.eras[state.era].name, this.engine.content.eras[state.era].subtitle, this.engine.content.eras[state.era].windText);
      const token = this.flowToken;
      void this.skippableWait(3000).then(() => {
        if (token === this.flowToken) this.deal();
      });
    } else if (state.phase === 'reward') {
      void this.rewardFlow();
    } else {
      const token = this.flowToken;
      void wait(350).then(() => {
        if (token === this.flowToken) this.deal();
      });
    }
    this.updateFoot();
  }

  snap(): CivSnapshot {
    const s = this.state!;
    const kc = this.engine.keywordCounts(s);
    return { seed: s.seed, era: s.era, growth: s.growth, gauges: { ...s.gauges }, kw: KEYWORDS.map((k) => kc[k]), wonders: s.wonders.slice() };
  }

  private dangerLevel(): number {
    const s = this.state;
    if (!s) return 0;
    let worst = 0;
    for (const g of GAUGES) {
      const v = s.gauges[g];
      const d = v <= TUNING.dangerLow ? (TUNING.dangerLow - v) / TUNING.dangerLow : v >= TUNING.dangerHigh ? (v - TUNING.dangerHigh) / (100 - TUNING.dangerHigh) : -1;
      if (d >= 0) worst = Math.max(worst, 0.45 + 0.55 * d);
    }
    return worst;
  }

  private tagFor(card: CardDef): string | undefined {
    const s = this.state!;
    if (card.kind === 'rival') return `Rivale · ${s.rival.name}`;
    if (card.kind === 'crisis' && s.crisis) return `Crise · ${s.crisis.index + 1}/${s.crisis.cards.length}`;
    if (card.kind === 'consequence') {
      // retrouver la décision d'origine
      for (let j = s.history.length - 1; j >= 0; j--) {
        const h = s.history[j];
        const c = this.engine.card(h.card);
        const eff = c[h.side].effect;
        const adds = [...(eff.add ?? []), ...(eff.then?.add ?? []), ...(eff.else?.add ?? [])];
        if (adds.some((a) => a.card === card.id)) return `Suite de · ${c.title}`;
      }
      return KIND_TAG.consequence;
    }
    return KIND_TAG[card.kind];
  }

  private deal(): void {
    const s = this.state;
    if (!s || !s.current || (s.phase !== 'card' && s.phase !== 'crisis')) return;
    const card = this.engine.card(s.current);
    const remaining = s.phase === 'crisis' ? s.crisis!.cards.length - s.crisis!.index - 1 : s.drawPile.length + 1;
    this.cardView.show(card, { tag: this.tagFor(card), crisis: s.phase === 'crisis', remaining });
    this.cardView.enabled = true;
    this.audio.cardIn();
    this.hint.textContent = card.tutorial ?? '';
    this.hint.classList.toggle('show', !!card.tutorial);
    if (card.tutorial) this.showReply('');
    this.updateFoot();
  }

  private showReply(text: string): void {
    clearTimeout(this.replyTimer);
    if (!text) {
      this.reply.classList.remove('show');
      return;
    }
    this.reply.textContent = text;
    this.reply.classList.add('show');
    this.replyTimer = window.setTimeout(() => this.reply.classList.remove('show'), 3600);
  }

  private updateFoot(): void {
    const s = this.state;
    if (!s) return;
    const era = this.engine.content.eras[s.era];
    const crisisDef = this.engine.content.crises.find((c) => c.era === s.era)!;
    if (s.phase === 'crisis' && s.crisis) {
      this.eraName.innerHTML = `<b>Crise</b>${esc(crisisDef.name)}`;
      this.eraName.classList.add('crisis');
    } else {
      this.eraName.innerHTML = `<b>${ROMAN[s.era]}</b>${esc(era.name)}`;
      this.eraName.classList.remove('crisis');
    }
    // pastilles : cartes de l'ère puis crise
    const crisisLen = s.crisis ? s.crisis.cards.length : crisisDef.cards.length + (crisisDef.extraCount ?? 0);
    const inCrisis = s.phase === 'crisis';
    const done = inCrisis ? s.eraTurn - (s.crisis?.index ?? 0) : s.eraTurn;
    const left = inCrisis ? 0 : s.drawPile.length + (s.current ? 1 : 0);
    let html = '';
    for (let i = 0; i < done; i++) html += '<i class="done"></i>';
    for (let i = 0; i < left; i++) html += `<i class="${i === 0 ? 'now' : ''}"></i>`;
    for (let i = 0; i < crisisLen; i++) {
      const ci = s.crisis?.index ?? -1;
      html += `<i class="cr ${inCrisis && i < ci ? 'done' : ''} ${inCrisis && i === ci ? 'now' : ''}"></i>`;
    }
    this.eraProgress.innerHTML = html;
    this.hud.setWind(inCrisis ? {} : era.wind ?? {});
    this.deckCount.textContent = String(s.deck.length);
  }

  // ------------------------------------------------------------------ choix

  private choose(side: Side): void {
    const s = this.state;
    if (!s) return;
    const card = this.engine.currentCard(s);
    if (!card) return;
    const token = this.flowToken;
    this.hint.classList.remove('show');
    this.hud.preview(null);
    this.audio.swipe(side);
    const events = this.engine.choose(s, side);
    saveGame(s);
    if (s.turn >= 3 && !this.settings.tutorialDone) {
      this.settings.tutorialDone = true;
      saveSettings(this.settings);
    }
    this.showReply(card[side].reply ?? '');
    void this.after(events, token);
  }

  private async after(events: GameEvent[], token: number): Promise<void> {
    const s = this.state!;
    let crisisStart: string | null = null;
    let toReward = false;
    let ended = false;
    for (const ev of events) {
      switch (ev.type) {
        case 'gauges': {
          this.hud.set(ev.after);
          this.hud.bump(ev.delta);
          let i = 0;
          GAUGES.forEach((g, gi) => {
            const d = ev.delta[g];
            if (d) this.audio.gauge(gi, d > 0, Math.abs(d) >= 9, i++ * 0.07);
          });
          break;
        }
        case 'cardAdded':
          if (ev.delay >= 0) {
            this.screens.toast('Cela aura des <b>suites</b>.');
            this.flashDeck();
          }
          break;
        case 'cardRemoved':
          break;
        case 'flag':
          if (ev.flag.startsWith('wonderSpent:')) {
            const w = this.engine.wonder(ev.flag.slice(12));
            this.screens.toast(`<b>${esc(w.name)}</b> vous a sauvé. Une fois.`, 3600);
            this.audio.wonder();
          }
          break;
        case 'wonder':
          this.audio.wonder();
          break;
        case 'crisisStart':
          crisisStart = ev.id;
          break;
        case 'crisisEnd':
          this.scene.setMood({ crisis: false });
          break;
        case 'reward':
          toReward = true;
          break;
        case 'defeat':
        case 'victory':
          ended = true;
          break;
        default:
          break;
      }
    }
    this.scene.setSnapshot(this.snap());
    this.scene.pulse(0.3);
    const danger = this.dangerLevel();
    this.scene.setMood({ danger });
    this.audio.setTension(danger, s.phase === 'crisis');
    this.updateFoot();

    if (ended) {
      await this.endFlow(token);
      return;
    }
    if (crisisStart) {
      const def = this.engine.content.crises.find((c) => c.id === crisisStart)!;
      await wait(260);
      if (token !== this.flowToken) return;
      this.scene.setMood({ crisis: true });
      this.audio.crisisHit();
      this.audio.setTension(danger, true);
      this.showReply('');
      this.screens.banner('crisis', 'Crise', def.name, def.intro);
      await wait(1500);
      if (token !== this.flowToken) return;
      this.deal();
      return;
    }
    if (toReward) {
      await wait(900);
      if (token !== this.flowToken) return;
      await this.rewardFlow();
      return;
    }
    await wait(150);
    if (token !== this.flowToken) return;
    this.deal();
  }

  private flashDeck(): void {
    this.deckBtn.classList.remove('flash');
    void this.deckBtn.offsetWidth;
    this.deckBtn.classList.add('flash');
  }

  // ------------------------------------------------------------------ entre deux ères

  private async rewardFlow(): Promise<void> {
    const s = this.state!;
    const token = this.flowToken;
    this.cardView.clear();
    this.cardView.enabled = false;
    this.showReply('');
    this.scene.setMood({ crisis: false });
    this.audio.setTension(this.dangerLevel(), false);
    this.audio.reward();
    this.app.classList.add('hidden-ui');
    const res = await this.screens.reward(this.engine, s);
    if (token !== this.flowToken) return;
    this.engine.pickReward(s, res.pick);
    if (res.remove) this.engine.removeCard(s, res.remove);
    const events = this.engine.nextEra(s);
    saveGame(s);
    for (const ev of events) if (ev.type === 'gauges') this.hud.set(ev.after);
    this.hud.set(s.gauges);
    const era = this.engine.content.eras[s.era];
    this.setAccent(s.era);
    this.audio.setEra(s.era);
    this.audio.eraShift(s.era);
    this.scene.setSnapshot(this.snap(), { eraDuration: 3.4 });
    this.screens.banner('era', `Ère ${ROMAN[s.era]}`, era.name, era.subtitle, era.windText);
    this.app.classList.remove('hidden-ui');
    this.updateFoot();
    // la transition se regarde, mais un geste suffit pour l'écourter
    await this.skippableWait(3000);
    if (token !== this.flowToken) return;
    const danger = this.dangerLevel();
    this.scene.setMood({ danger });
    this.deal();
  }

  /** Attend `ms`, ou moins si le joueur fait un geste (après un court délai de grâce). */
  private async skippableWait(ms: number): Promise<void> {
    let skip: () => void = () => undefined;
    const skipped = new Promise<void>((r) => (skip = r));
    const onSkip = () => skip();
    await wait(600);
    window.addEventListener('pointerdown', onSkip, { once: true });
    window.addEventListener('keydown', onSkip, { once: true });
    await Promise.race([wait(ms - 600), skipped]);
    window.removeEventListener('pointerdown', onSkip);
    window.removeEventListener('keydown', onSkip);
  }

  // ------------------------------------------------------------------ fin

  private timelapseSnaps(): CivSnapshot[] {
    const s = this.state!;
    const h = s.history;
    const step = Math.max(1, Math.floor(h.length / 70));
    const out: CivSnapshot[] = [{ seed: s.seed, era: 0, growth: 0, gauges: { food: 50, army: 50, knowledge: 50, treasure: 50 }, kw: [0, 0, 0, 0, 0, 0], wonders: [] }];
    for (let i = 0; i < h.length; i += step) out.push({ seed: s.seed, era: h[i].era, growth: h[i].turn, gauges: h[i].gauges, kw: h[i].kw, wonders: h[i].wonders });
    out.push(this.snap());
    return out;
  }

  private async endFlow(token: number): Promise<void> {
    const s = this.state!;
    const victory = s.result?.type === 'victory';
    clearGame();
    this.cardView.clear();
    this.cardView.enabled = false;
    this.audio.setTension(0, false);
    if (victory) {
      this.scene.setMood({ crisis: false, danger: 0 });
      this.scene.pulse(1);
      this.audio.victory();
    } else {
      this.scene.setMood({ dead: true, crisis: false, danger: 0 });
      this.audio.defeat();
    }
    await wait(victory ? 900 : 1100);
    if (token !== this.flowToken) return;
    this.app.classList.add('hidden-ui');
    this.showReply('');
    const seed = s.seed;
    this.screens.end(this.engine, s, {
      onReplay: () => this.newGame(),
      onSameSeed: () => this.newGame(seed),
      onTitle: () => {
        this.state = null;
        this.flowToken++;
        this.showTitle();
      },
    });
    // les lumières s'éteignent, puis la croissance est rejouée en accéléré
    await wait(victory ? 1200 : 3400);
    if (token !== this.flowToken) return;
    const snaps = this.timelapseSnaps();
    this.scene.setMood({ dead: false });
    this.scene.playTimelapse(snaps, Math.min(11, 4 + snaps.length * 0.09), () => {
      if (token !== this.flowToken) return;
      if (!victory) this.scene.setMood({ dead: true });
    });
  }

  /** Démarrage : paramètres d'URL ou écran titre. */
  boot(): void {
    const params = new URLSearchParams(location.search);
    const code = params.get('seed');
    const seed = code ? codeToSeed(code) : null;
    if (seed !== null) this.newGame(seed);
    else this.showTitle();
  }
}
