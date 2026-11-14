/**
 * L'interface V2 : un écran titre, la fondation, puis la partie (HUD, carte, retours),
 * les présages, les bilans d'ère, la chute ou la victoire, le testament et la chronique.
 */
import { ERA_SCALE, gainText, TUNING, type Engine, type Ev, type OptionView, type View, type PresageInfo, type FamilyInfo } from '../core/engine';
import { chronicleLines, epitaph, nextSetup, recordRun, testaments, UNLOCKS, type Testament, type Unlock } from '../core/meta';
import { FAMILIES, FAMILY_ROLE, RES, RES_LABEL, type ChronicleEntry, type FamilyId, type GameState, type MetaState, type Res } from '../core/types';
import { civName, ERA_NAMES, ERA_SUBTITLES, capitalize, fill } from '../core/text';
import type { Scene } from '../scene/scene';
import { LOOKS, rgb } from '../scene/palette';
import { drawElem, type DrawEnv, type Elem } from '../scene/city';
import type { AudioEngine } from '../audio';
import { medallion, motif, type ArtSpec } from './art';
import { Rng } from '../core/rng';
import { bagChips, el, esc, ICON, rich, RES_ICON, ROMAN, wait } from './dom';
import { replaySnapshots, snapshot, THREAT } from './snapshot';
import { illustration, MOTIF_SCENE, type IllusSpec } from './illus';
import { store, type Settings } from './store';

const KIND_LABEL: Record<string, string> = {
  evenement: 'Événement', intrigue: 'Suite', rencontre: 'Rencontre', ruines: 'Les ruines', revenant: 'Les revenants',
  trahison: 'Trahison', croissance: 'Croissance', tutoriel: 'Conseil', institution: 'Institution',
  regle: 'Règle de l’ère', conseil: 'Le Conseil',
};
const KIND_MOTIF: Record<string, string> = {
  carrefour: 'road', jalon: 'tower', decouverte: 'scroll', croissance: 'house', proces: 'scales', hommage: 'crown', ruines: 'skull', revenant: 'hand', presage: 'eye',
};

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
    // la barre de boutons collante n'a de fond que si l'écran déborde
    const fit = () => sc.querySelectorAll('.btns.stick').forEach((b) => b.classList.toggle('over', sc.scrollHeight > sc.clientHeight + 4));
    const mo = new MutationObserver(() => requestAnimationFrame(fit));
    mo.observe(inner, { childList: true, subtree: true });
    window.addEventListener('resize', fit);
    this.screenOff = () => { mo.disconnect(); window.removeEventListener('resize', fit); };
    requestAnimationFrame(fit);
    this.screenEl = sc;
    this.keyHandler = keys ?? null;
    return sc;
  }

  private screenOff?: () => void;

  private closeScreen(): void {
    const sc = this.screenEl;
    if (!sc) return;
    this.screenEl = null;
    this.screenOff?.();
    this.screenOff = undefined;
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
    const first = this.meta.runs === 0;
    // première partie : une seule décision, le dessein, avec un choix conseillé déjà sélectionné
    let dessein = first ? 'posterite' : 'etoiles';
    let origin = 'feu';
    let iron = false;
    const open = new Set<string>();
    // le départ d'une origine, comparé à celui des Gens du Feu (l'origine de la première partie)
    const ref = this.e.c.origins.find((x) => x.id === 'feu')!;
    const delta = (n: number, m: number) => (n === m || ref === undefined ? '' : ` <em class="${n > m ? 'up' : 'down'}">(${n > m ? '+' : '−'}${Math.abs(n - m)})</em>`);
    const startLine = (od: (typeof this.e.c.origins)[number]) => `${RES.map((r) => `<span class="w r-${r}">${RES_ICON[r]}${od.res[r]} ${RES_LABEL[r]}</span>${od.id === 'feu' ? '' : delta(od.res[r], ref.res[r])}`).join(', ')} ; ${od.quartiers} quartiers${od.id === 'feu' ? '' : delta(od.quartiers, ref.quartiers)} (la cité tombe à zéro).`;
    const preview = (o: string, tile?: HTMLElement | null) => {
      const ruins = nextSetup(this.meta, { dessein, origin: o }).ruins ?? [];
      const demo = this.e.newGame(seed, { dessein, origin: o, ruins: o === 'heritiers' ? ruins : [] });
      const snap = snapshot(this.e, demo);
      snap.threat = undefined;
      if (o === 'heritiers' && !snap.ruins.length) snap.ruins = ['cercle', 'tour', 'dome'];
      this.scene.setSnapshot(snap);
      // une légende sur la scène, pour qu'on remarque ce qui change (sur grand écran, où la scène se voit)
      const sc = document.querySelector('.screen.setup');
      if (sc && !first) {
        let cap = sc.querySelector('.scene-cap') as HTMLElement | null;
        if (!cap) sc.appendChild((cap = el('div', 'scene-cap')));
        const what = o === 'fleuve' ? 'le fleuve, qui déborde chaque printemps' : o === 'heritiers' ? 'les ruines de vos ancêtres, sur la colline' : 'le grand feu de la tribu';
        const od = this.e.c.origins.find((x) => x.id === o)!;
        cap.innerHTML = `<i>Aperçu</i><b>${esc(od.name)}</b> : ${esc(what)}<span class="nums">Au départ : ${startLine(od)}</span>`;
        // à côté de la tuile survolée (ou choisie), près du regard
        const tl = tile ?? (sc.querySelector('.tile.origin.sel') as HTMLElement | null);
        if (tl) {
          const r = tl.getBoundingClientRect();
          cap.style.top = `${Math.round(r.top + r.height / 2)}px`;
          cap.style.left = `${Math.round(r.right + 18)}px`;
          cap.classList.toggle('room', r.right + 18 + 290 < window.innerWidth);
        }
        cap.classList.remove('flash');
        void cap.offsetWidth;
        cap.classList.add('flash');
      }
    };
    preview(origin);
    this.openScreen('soft setup', (inner) => {
      const render = () => {
        inner.innerHTML = `<div class="over">Votre civilisation</div><h2 class="big">${esc(name)}</h2>
          <div class="label">Que voulez-vous devenir ?</div>`;
        const hook = (d: (typeof this.e.c.desseins)[number]) => esc(d.pitch.replace('{rival}', 'la cité voisine').replace('{cite}', name));
        const reqLine = (d: (typeof this.e.c.desseins)[number]) => {
          const reqs = d.jalons.map((j) => j.req?.tags?.[d.tag] ?? 0).filter(Boolean).join(', ');
          const src = d.tag === 'Science' ? 'découvertes de Science, Brume amicaux' : d.tag === 'Guerre' ? 'découvertes de Guerre, Ourk amicaux' : 'découvertes de Culture, familles dévouées';
          return `Une merveille par ère. Quatre à la fin des temps : la victoire ; les cinq : le triomphe. Elles exigent ${reqs} de ${esc(d.tag)} (${src}).`;
        };
        const need = (d: (typeof this.e.c.desseins)[number]) => `<span class="need r-${d.res}">${RES_ICON[d.res]}<b>${RES_LABEL[d.res]}</b> et ${esc(d.need)}</span>`;
        // parties suivantes : les desseins, déjà connus, tiennent sur une ligne ; l'origine a la place
        if (!first) {
          const row = el('div', 'tiles compact');
          for (const d of this.e.c.desseins) {
            const t = el('button', `tile${d.id === dessein ? ' sel' : ''}`, `<span class="ico r-${d.res}">${RES_ICON[d.res]}</span><b>${esc(d.name)}</b>`);
            t.addEventListener('click', () => {
              dessein = d.id;
              this.audio.ui();
              render();
            });
            row.appendChild(t);
          }
          inner.appendChild(row);
          const d = this.e.c.desseins.find((x) => x.id === dessein)!;
          const pl = el('p', 'pick-line', `${need(d)} <span class="hook">${hook(d)}</span> <span class="more" role="button" tabindex="0">${open.has(d.id) ? 'Masquer' : 'Détails'}</span>${open.has(d.id) ? `<span class="req-line">${reqLine(d)}</span>` : ''}`);
          pl.querySelector('.more')!.addEventListener('click', () => {
            if (open.has(d.id)) open.delete(d.id);
            else open.add(d.id);
            render();
          });
          inner.appendChild(pl);
        }
        const tiles = el('div', 'tiles');
        if (first) for (const d of this.e.c.desseins) {
          const rec = first && d.id === 'posterite';
          const t = el('button', `tile dessein${d.id === dessein ? ' sel' : ''}`, `<b>${esc(d.name)}${rec ? ' <i class="rec">Conseillé pour commencer</i>' : ''}</b>${need(d)}<span class="hook">${hook(d)}</span>
            <span class="more" role="button" tabindex="0">${open.has(d.id) ? 'Masquer les détails' : 'Détails'}</span>
            ${open.has(d.id) ? `<span class="req-line">${reqLine(d)}</span>` : ''}`);
          t.addEventListener('click', (ev) => {
            if ((ev.target as HTMLElement).classList.contains('more')) {
              if (open.has(d.id)) open.delete(d.id);
              else open.add(d.id);
            } else dessein = d.id;
            this.audio.ui();
            render();
          });
          tiles.appendChild(t);
        }
        if (first) inner.appendChild(tiles);
        // l'origine, les Héritiers et l'Âge de fer n'apparaissent qu'après une première partie terminée
        if (!first) {
          inner.appendChild(el('div', 'label', `Qui êtes-vous ?${this.meta.runs === 1 ? ' <i class="rec">Nouveau</i>' : ''}`));
          const r0 = nextSetup(this.meta, { dessein, origin: 'heritiers' }).ruins?.[0];
          // le détail chiffré d'une origine : réserves, quartiers, familles, règle propre, cartes à elle
          const originDetails = (o: (typeof this.e.c.origins)[number]) => {
            const fams = FAMILIES.filter((f) => o.loy?.[f]).map((f, k) => `${esc(k ? this.e.c.families[f].house[0] : capitalize(this.e.c.families[f].house[0]))} (${FAMILY_ROLE[f]}) ${o.loy![f]! > 0 ? 'amicaux' : 'méfiants'}`);
            const rule = (o.deck ?? []).map((id) => this.e.c.cards[id]).filter((c) => c?.passive).map((c) => `${esc(c.title)} : ${esc(c.gift ?? '')}`);
            const own = Object.values(this.e.c.cards).filter((c) => c.id.startsWith('or_') && c.cond?.mem && o.mem?.includes(c.cond.mem)).map((c) => esc(c.title));
            return `<span class="odet">
              <span>Au départ : ${startLine(o)}</span>
              ${fams.length ? `<span>Familles : ${fams.length === 4 && FAMILIES.every((f) => (o.loy?.[f] ?? 0) > 0) ? 'les quatre vous aiment déjà (+1)' : fams.join(', ')}.</span>` : ''}
              ${rule.map((x) => `<span>Règle : ${x}</span>`).join('')}
              ${o.mem?.includes('heritiers') ? '<span>Ce que la cité précédente a laissé compte double : son héritage, ses amitiés et ses rancunes.</span>' : ''}
              ${own.length ? `<span>Des cartes à vous : ${own.join(', ')}.</span>` : ''}
            </span>`;
          };
          const ot = el('div', 'tiles origins');
          for (const o of this.e.c.origins) {
            const unlocked = o.id === 'feu' || this.meta.unlocked.includes(o.id);
            const u = UNLOCKS.find((x) => x.id === o.id);
            const tr = this.e.originTraits(o);
            const emblem = `<svg class="emblem" viewBox="78 26 144 144" aria-hidden="true">${motif(o.id === 'fleuve' ? 'wave' : o.id === 'heritiers' ? 'arch' : 'flame', new Rng(7), 'hsl(36 90% 80%)', 'hsla(30,90%,60%,.35)', 'hsla(36,70%,78%,.4)')}</svg>`;
            const t = el('button', `tile origin${o.id === origin ? ' sel' : ''}`, unlocked
              ? `${emblem}<div>${o.badge ? `<em class="badge">${esc(o.badge)}</em>` : ''}<b>${esc(o.name)}</b><span>${esc(o.style)}</span>${o.id === 'heritiers' && r0 ? `<span class="inherit">Héritage de ${esc(r0.name)}${r0.legacy?.label ? ` : ${esc(r0.legacy.label.charAt(0).toLowerCase() + r0.legacy.label.slice(1))}` : ''}</span>` : ''}<span class="tags" title="${esc([...tr.ups.map((x) => '+ ' + x), ...tr.downs.map((x) => '− ' + x)].join('\n'))}"><i class="good">${esc(tr.atout)}</i><i class="bad">${esc(tr.handicap)}</i></span>
                <span class="more" role="button" tabindex="0">${open.has(o.id) ? 'Masquer les détails' : 'Détails'}</span>${open.has(o.id) ? originDetails(o) : ''}</div>`
              : `${emblem}<div><em>${ICON.lock} Pas encore</em><b>${esc(o.name)}</b><span>${esc(u?.how ?? '')}</span></div>`);
            if (!unlocked) t.disabled = true;
            t.addEventListener('mouseenter', () => unlocked && preview(o.id, t));
            t.addEventListener('focus', () => unlocked && preview(o.id, t));
            t.addEventListener('mouseleave', () => preview(origin));
            t.addEventListener('click', (ev) => {
              if ((ev.target as HTMLElement).classList.contains('more')) {
                if (open.has(o.id)) open.delete(o.id);
                else open.add(o.id);
              } else origin = o.id;
              this.audio.ui();
              preview(origin);
              render();
            });
            ot.appendChild(t);
          }
          inner.appendChild(ot);
          if (this.meta.unlocked.includes('fer')) {
            const tg = el('button', `toggle${iron ? ' on' : ''}`, `<span><b>L’Âge de fer</b><br><small style="color:var(--dim)">Un défi : les crises sont 20 % plus dures.</small></span><i></i>`);
            tg.addEventListener('click', () => {
              iron = !iron;
              render();
            });
            inner.appendChild(tg);
          }
        }
        const go = el('div', 'btns stick');
        go.appendChild(this.button(`Fonder ${name}`, () => this.start(seed, { dessein, origin, iron, name })));
        go.appendChild(this.button('Retour', () => this.title(), 'ghost small'));
        inner.appendChild(go);
      };
      render();
      requestAnimationFrame(() => preview(origin));
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
    if (this.meta.runs === 0) this.intro(() => this.enterGame(true));
    else this.enterGame(true);
  }

  /** Premier lancement : les quatre familles se présentent, chacune avec sa voix. */
  private intro(done: () => void): void {
    const s = this.s!;
    const lines: Record<FamilyId, string> = {
      ourk: '« Ourk chasse. Ourk protège. Ourk n’oublie jamais qui l’a fait attendre. »',
      sel: '« Le ciel voit tout. Pour un petit don, il sait aussi fermer les yeux. »',
      brume: '« Techniquement, c’est nous qui avons inventé le feu. Vous l’avez juste allumé. »',
      troc: '« Tout s’échange. Même l’amitié. Surtout l’amitié. Prix d’ami. »',
    };
    const go = () => {
      this.closeScreen();
      done();
    };
    this.openScreen('veil intro', (inner) => {
      inner.innerHTML = `<div class="over">Il y a dix mille ans</div><h2 class="big">${esc(s.name)}</h2><p class="sub">Un feu, une vallée, et quatre familles autour.</p>`;
      const list = el('div', 'fam-intro');
      FAMILIES.forEach((f, i) => {
        const fi = this.e.familyInfo(s, f);
        const row = el('div', 'fi-row', `${this.famSvg(fi, 64, 0)}<div><b>${esc(fi.house)}</b> <span>${esc(fi.tag === 'Guerre' ? 'les chasseurs' : fi.tag === 'Foi' ? 'les chamanes' : fi.tag === 'Science' ? 'les sages' : 'les troqueurs')}</span><p>${esc(lines[f])}</p></div>`);
        row.style.animationDelay = `${0.3 + i * 0.35}s`;
        list.appendChild(row);
      });
      inner.appendChild(list);
      const last = el('p', 'sub', 'Elles se souviendront de tout ce que vous déciderez. Leurs descendants aussi.');
      last.style.cssText = 'animation: fadeUp 1s 1.9s var(--ease-out) both';
      inner.appendChild(last);
      const b = el('div', 'btns');
      b.appendChild(this.button('Allumer le feu', go));
      inner.appendChild(b);
    }, (k) => {
      if (k === 'Enter' || k === ' ') go();
    });
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
    const upkeep = this.e.presageInfo(s).upkeep;
    const rv = this.e.rival(s);
    const fm = this.e.form(s);
    const nSeasons = fm.seasons;
    const phaseIdx = s.phase === 'saison' ? s.saison : s.phase === 'chantier' ? nSeasons : s.phase === 'crise' ? nSeasons + 1 : s.phase === 'finere' ? nSeasons + 2 : -1;
    // une créance en cours : son montant et le nombre de cartes avant l'huissier
    const dues = s.sched.filter((x) => /^creance/.test(x.card));
    const debt = dues.length ? `<span class="debt" title="Créance : ${dues.map((d) => `${d.pay ?? '?'} Trésor dans ${Math.max(1, d.at - s.turn + 1)} carte(s), ou un quartier`).join(' ; ')}">−${dues.reduce((a, d) => a + (d.pay ?? 0), 0)} ⌛${Math.max(1, Math.min(...dues.map((d) => d.at - s.turn + 1)))}</span>` : '';
    const top = `<div class="hud-top">
      <div class="stat q${s.quartiers <= 2 ? ' low' : ''}" data-k="q" title="Quartiers : votre cité. À zéro, elle tombe.">${ICON.house}<b>${s.quartiers}</b><small>${s.quartiers > 1 ? 'quartiers' : 'quartier'}</small><span class="delta"></span></div>
      ${RES.map((r) => `<div class="stat r-${r}${r === 'vivres' && s.res.vivres < upkeep ? ' hunger' : ''}" data-k="${r}" title="${RES_LABEL[r]}${r === 'vivres' ? ` — la cité en mangera ${upkeep} en fin d’ère` : ''}">${RES_ICON[r]}<b>${s.res[r]}</b><span class="delta"></span>${r === 'tresor' ? debt : ''}</div>`).join('')}
      <div class="hud-sp"></div>
      <div class="era-pill" title="${esc(ERA_NAMES[s.era])} · ${esc(fm.name)} : ${esc(fm.rhythm)}, le chantier, la crise, le bilan"><div class="era-name"><b>${ROMAN[s.era]}</b><span>${esc(ERA_NAMES[s.era].replace(/^L’|^L'|^Le |^La /, ''))}</span></div>
        <div class="phase">${Array.from({ length: nSeasons + 3 }, (_, i) => `<i class="${i === nSeasons + 1 ? 'cr ' : ''}${i < phaseIdx ? 'done' : i === phaseIdx ? 'now' : ''}"></i>`).join('')}</div></div>
      RACE
      <button class="icon-btn deck-btn" data-act="deck" aria-label="Votre civilisation">${ICON.book}<span class="count">${s.deck.length + s.jalons.filter(Boolean).length}</span></button>
      <button class="icon-btn" data-act="settings" aria-label="Réglages">${ICON.gear}</button>
    </div>`;
    const fams = FAMILIES.map((f) => this.famHtml(this.e.familyInfo(s, f))).join('');
    const race = `<div class="race" style="--rh:${rv.hue}" title="Votre dessein contre celui de ${esc(rv.name)}">
      <div class="rr me">${[0, 1, 2, 3, 4].map((i) => `<i class="${s.jalons[i] ? 'on' : ''}"></i>`).join('')}</div>
      <div class="rr them">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < s.rivalJalons ? 'on' : ''}"></i>`).join('')}</div></div>`;
    hud.innerHTML = `${top.replace('RACE', race)}<div class="hud-row2"><div class="fams">${fams}</div></div>`;
    hud.querySelector('[data-act=settings]')!.addEventListener('click', () => this.settingsScreen(() => this.closeScreen()));
    hud.querySelector('[data-act=deck]')!.addEventListener('click', () => this.deckScreen());
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
    const sp = { motif: fi.motif, hue: fi.hue, mood: fi.loy, era, scars: fi.scars, fam: fi.id };
    return `<svg class="med" viewBox="0 0 100 100" width="${size}" height="${size}"><defs><radialGradient id="${id}p" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="hsl(${fi.hue} 55% 32%)"/><stop offset="1" stop-color="hsl(${fi.hue} 45% 9%)"/></radialGradient></defs>${medallion(sp, 50, 52, 38, id)}</svg>`;
  }

  private famHtml(fi: FamilyInfo): string {
    const pips = [-3, -2, -1, 0, 1, 2, 3]
      .map((v) => (v === 0 ? '<i class="mid"></i>' : `<i class="${(v < 0 && fi.loy <= v) || (v > 0 && fi.loy >= v) ? 'on ' : ''}${v < 0 ? 'neg' : 'pos'}"></i>`))
      .join('');
    const cls = fi.state !== 'presente' ? 'gone' : fi.loy <= -2 ? 'hostile' : fi.loy >= 2 ? 'devoted' : '';
    const short = fi.house.replace(/^Les /, '');
    const anc = ({ ourk: 'Ourk', sel: 'Sel', brume: 'Brume', troc: 'Troc' } as Record<string, string>)[fi.id];
    return `<button class="fam ${cls}" data-f="${fi.id}" aria-label="${esc(fi.house)} : ${esc(fi.mood)}">${this.famSvg(fi, 34, this.s!.era)}
      <span class="fn"><span class="fh"><span class="long">${esc(short)}</span><span class="short">${esc(anc)}</span></span><span class="pips">${pips}</span><span class="fm">${esc(fi.mood)}</span></span>
      ${fi.neglected ? `<span class="neg-mark" title="Délaissés">${ICON.warn}</span>` : ''}<span class="fdelta"></span></button>`;
  }

  private famPopover(f: FamilyId, anchor: HTMLElement): void {
    const s = this.s!;
    const fi = this.e.familyInfo(s, f);
    const riv = this.e.familyInfo(s, fi.rivalOf);
    const veil = el('div', 'pop-veil');
    const pop = el('div', 'pop');
    pop.innerHTML = `<div class="row" style="display:flex;gap:10px;align-items:center">${this.famSvg(fi, 72, s.era)}<div><h4>${esc(fi.house)}</h4><p class="note">${esc(fi.head)} · ${esc(fi.trade)} · ${esc(fi.mood)} (${fi.loy > 0 ? '+' : ''}${fi.loy})</p></div></div>
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
    const spec: ArtSpec = { key: c.id + s.era, motif: c.art?.motif ?? KIND_MOTIF[c.kind] ?? (fi?.motif ?? 'star'), hue, alarm: c.kind === 'crise' || c.kind === 'trahison', era: s.era };
    if (fi) spec.speaker = { motif: fi.motif, hue: fi.hue, mood: fi.loy, era: s.era, scars: fi.scars, fam: fi.id };
    else if (c.kind === 'rivale' || c.id === 'creance_rivale' || c.id === 'tribut') spec.speaker = { motif: 'crown', hue: this.e.rival(s).hue, mood: s.rivalRel, era: s.era, scars: 0, fam: 'rival' };
    if (spec.speaker && spec.motif === spec.speaker.motif) spec.motif = KIND_MOTIF[c.kind] ?? 'star';
    return spec;
  }

  /** La scène qui illustre une carte : un personnage, un lieu, un événement, une crise, un objet. */
  private illusFor(v: View): IllusSpec {
    const s = this.s!;
    const c = v.card;
    const a = this.artFor(v);
    const base = { key: c.id + s.era, era: s.era, hue: a.hue };
    const rv = this.e.rival(s);
    const fam = (f: FamilyId | undefined) => (f ? { fam: f as IllusSpec['fam'], mood: s.fam[f].loy, hue: this.e.c.families[f].hue } : {});
    // les gens : familles, trahisons, hommages, procès, la rivale, les créanciers
    if (c.kind === 'famille' || c.kind === 'trahison') return { ...base, scene: 'portrait', ...fam(v.family ?? c.family), alarm: c.kind === 'trahison' };
    if (c.kind === 'proces' && s.prompt?.plaintiff) return { ...base, scene: 'portrait', ...fam(s.prompt.plaintiff as FamilyId) };
    if (/^hommage_/.test(c.id)) return { ...base, scene: 'portrait', ...fam(c.id.slice(8) as FamilyId) };
    if (c.kind === 'rivale' || c.id === 'creance_rivale' || c.id === 'tribut' || c.id === 'triomphe') return { ...base, scene: 'portrait', fam: 'rival', mood: s.rivalRel, hue: rv.hue, rivalHue: rv.hue };
    if (/^creance/.test(c.id)) return { ...base, scene: 'portrait', ...fam('troc') };
    // les lieux et les moments de la partie
    if (c.kind === 'rencontre') {
      const route = this.e.c.routes.find((r) => r.encounters.includes(c.id));
      if (route) return { ...base, scene: 'lieu', variant: route.id };
    }
    if (c.kind === 'crise') {
      const cr = [...this.e.c.crises, ...(this.e.c.crisisAlts ?? [])].find((x) => x?.cards.includes(c.id));
      return { ...base, scene: 'crise', variant: cr ? THREAT[cr.cards[0]] : 'horde', alarm: true };
    }
    if (c.kind === 'decouverte') return { ...base, scene: 'decouverte', variant: c.id === 'decouverte' ? 'scroll' : a.motif };
    if (c.kind === 'ruines') return { ...base, scene: 'ruines' };
    if (c.kind === 'revenant') return { ...base, scene: 'ruines', variant: 'revenant' };
    if (c.kind === 'carrefour') return { ...base, scene: 'route', variant: 'carrefour' };
    if (c.kind === 'croissance') return { ...base, scene: 'croissance' };
    if (c.id === 'colonie') return { ...base, scene: 'colonie' };
    if (c.kind === 'conseil') return { ...base, scene: 'cour', variant: 'ring' };
    if (c.id === 'disette') return { ...base, scene: 'champs', alarm: true };
    // les événements : la scène du motif
    const [scene, variant] = MOTIF_SCENE[a.motif] ?? ['village', 'house'];
    return { ...base, scene, variant, alarm: a.alarm };
  }

  private renderCard(v: View): void {
    const s = this.s!;
    const stage = document.getElementById('stage')!;
    const fi = v.family ? this.e.familyInfo(s, v.family) : undefined;
    const head = v.header ?? (v.kind === 'famille' && fi ? fi.house : KIND_LABEL[v.kind] ?? '');
    const from = s.prompt?.from;
    const card = el('article', `card enter${v.kind === 'crise' || v.kind === 'trahison' ? ' alarm' : ''}`);
    const art = v.kind === 'jalon' ? this.wonderArt(s) : illustration(this.illusFor(v));
    card.innerHTML = `<div class="card-art">${art}<div class="card-head"><span${from ? ' class="from"' : ''}>${esc(head)}</span><span>${v.kind === 'carrefour' ? esc(s.name) : esc((s.history.length ? s.history[s.history.length - 1].date : '').replace(' avant le Calendrier', ' av. C.'))}</span></div></div>
      <div class="card-body"><h2 class="card-title">${esc(v.title)}</h2>${v.speaker && v.kind !== 'carrefour' ? `<p class="card-speaker">${esc(capitalize(v.speaker))}</p>` : ''}<div class="card-rule"></div><p class="card-text">${rich(v.text)}</p></div>`;
    const opts = el('div', 'opts');
    v.options.forEach((o, i) => opts.appendChild(this.optButton(o, i, v)));
    card.appendChild(opts);
    // voir les chiffres exacts, contre un peu de Savoir (la Science et les merveilles resserrent les fourchettes)
    const pk = this.e.canPeek(s);
    if (pk.offer) {
      const cost = this.e.peekCost(s);
      const b = el('button', 'peek', `${RES_ICON.savoir}<span>Voir les chiffres exacts</span><b>${cost} Savoir</b>`);
      b.title = 'Les fourchettes se resserrent avec la Science (découvertes, savants qui vous aiment) et les merveilles.';
      if (!pk.afford) b.disabled = true;
      b.addEventListener('click', () => {
        if (!this.e.peek(s)) return;
        store.saveGame(s);
        this.audio.ui();
        const v2 = this.e.view(s)!;
        opts.innerHTML = '';
        v2.options.forEach((o, i) => opts.appendChild(this.optButton(o, i, v2)));
        b.remove();
        this.renderHud();
      });
      card.appendChild(b);
    }
    stage.innerHTML = '';
    stage.appendChild(card);
    this.audio.cardIn();
    if ((v.kind === 'ruines' || v.kind === 'revenant') && s.ruins[0]) this.scene.sparkAt(`old0_${s.ruins[0].shape ?? 'cercle'}`);
    if (v.kind === 'ruines' || v.kind === 'revenant') this.audio.mystery();
    if (v.kind === 'proces') this.audio.gavel();
    this.keyHandler = (k) => {
      const n = Number(k);
      if (n >= 1 && n <= v.options.length) void this.choose(n - 1);
    };
    this.cardHints(v);
  }

  /** Le chantier montre la (ou les) silhouette(s) de la merveille, telle qu'elle se dressera dans la cité. */
  private wonderArt(s: GameState): string {
    const era = s.prompt?.missed ?? s.era;
    const j = this.e.dessein(s).jalons[era];
    const alt = this.e.jalonAltOf(s, era);
    const shapes = alt ? [j.shape, alt.shape] : [j.shape];
    const imgs = shapes.map((sh) => `<img src="${wonderIcon(sh, 38, 220).toDataURL()}" alt="">`).join('');
    return `<div class="wonder-art">${imgs}</div>`;
  }

  private optButton(o: OptionView, i: number, v: View): HTMLButtonElement {
    const s = this.s!;
    const b = el('button', 'opt');
    const lossChips = (o.loss ? RES.filter((r) => o.loss![r]).map((r) => `<span class="chip loss r-${r}${s.res[r] < (o.loss![r] ?? 0) ? ' short' : ''}" title="Perte certaine">${RES_ICON[r]}<b>−${o.loss![r]}</b></span>`).join('') : '')
      + (o.lossQ ? `<span class="chip loss q" title="Quartier perdu à coup sûr">${ICON.house}<b>−${o.lossQ}</b></span>` : '')
      + (o.gainQ ? `<span class="chip gain q" title="Quartier gagné : une vie de plus pour la cité, et une bouche de plus à nourrir">${ICON.house}<b>+${o.gainQ}</b></span>` : '')
      + (o.spend ? RES.filter((r) => o.spend![r]).map((r) => `<span class="chip spend r-${r}" title="Dépensé seulement si le seuil est atteint ; sinon, rien n’est dépensé et la perte annoncée tombe">${RES_ICON[r]}<b>−${o.spend![r]}</b><small>si seuil</small></span>`).join('') : '');
    const costs = Object.keys(o.cost).length || lossChips
      ? RES.filter((r) => o.cost[r]).map((r) => `<span class="chip r-${r}${s.res[r] < (o.cost[r] ?? 0) ? ' short' : ''}">${RES_ICON[r]}<b>${o.cost[r]}</b></span>`).join('') + lossChips
      : v.kind === 'carrefour' || v.kind === 'presage' ? '' : '<span class="chip free">gratuit</span>';
    // ce qui rentre : le genre et l'ampleur (+ un peu, ++ bien, +++ beaucoup), pas le montant (le texte le dit)
    const gains = RES.filter((r) => o.gains?.[r]).map((r) => { const g = o.gains![r]!; return `<span class="chip gain r-${r}${g[0] === g[1] ? ' exact' : ''}" title="Rapporte ${gainText(g, ' à ')} ${RES_LABEL[r]}">+${gainText(g)}${RES_ICON[r]}</span>`; }).join('');
    const fams = o.families.map((f) => {
      const d = this.e.c.families[f];
      const dir = o.famDir?.[f] ?? 0;
      const arrow = dir ? `<i class="dir ${dir > 0 ? 'up' : 'down'}">${dir > 0 ? '▲' : '▼'}${Math.abs(dir) > 1 ? Math.abs(dir) : ''}</i>` : '<i class="dir unk">?</i>';
      const what = dir > 0 ? `y gagnent (+${dir})` : dir < 0 ? `y perdent (${dir})` : 'sont concernés, selon l’issue';
      return `<span class="fdot" style="--h:${d.hue}" title="${esc(capitalize(d.house[s.era]))} ${what}">${this.miniMotif(d.motif, d.hue)}${arrow}</span>`;
    }).join('');
    const meta = `${fams}${o.later ? `<span class="meta-ico" title="Cela aura des suites">${ICON.hourglass}</span>` : ''}${o.odds !== undefined ? `<span class="odds" title="Chance de réussite">${ICON.dice}${Math.round(o.odds * 100)} %</span>` : ''}`;
    b.innerHTML = `<span class="opt-n">${i + 1}</span><span class="opt-main"><span class="opt-label">${esc(o.label)}</span>
      ${o.detail ? `<span class="opt-detail">${esc(o.detail)}</span>` : ''}
      ${o.risk ? `<span class="opt-warn">${ICON.warn}<span>${esc(o.risk)}</span></span>` : ''}
      ${o.warn ? `<span class="opt-warn">${ICON.warn}<span>${esc(o.warn)}</span></span>` : ''}
      ${o.req ? `<span class="opt-req${o.reqOk ? '' : ' ko'}">${o.reqOk ? '✓' : ICON.lock}<span>Exige ${esc(o.req)}</span></span>` : ''}
      </span><span class="opt-side"><span class="opt-cost">${costs}${gains}</span><span class="opt-meta">${meta}</span></span>`;
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
    await this.feedback(ev, v, v.options[i].label);
    this.lock = false;
  }

  /** Montre ce que le choix a fait : réserves, familles, quartiers, réponse, et les grands moments. */
  private async feedback(ev: Ev[], v: View, picked?: string): Promise<void> {
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
    // ce que le choix a causé, séparé de ce que fait le bilan (qui a son propre écran)
    const BILAN = new Set(['revolt', 'defect', 'neglect', 'mend', 'income', 'decay', 'upkeep', 'disette', 'famine', 'spoil', 'peace']);
    const cut = ev.findIndex((x) => BILAN.has(x.type));
    const mine = cut < 0 ? ev : ev.slice(0, cut);
    const loy = new Map<FamilyId, number>();
    for (const x of mine) if (x.type === 'loy') loy.set(x.family, (loy.get(x.family) ?? 0) + x.delta);
    for (const [f, d] of loy) {
      if (!d) continue;
      const h = capitalize(this.e.c.families[f].house[s.era]).replace(/^Les /, '');
      chips.push(`<span class="chip fam ${d > 0 ? 'up' : 'down'}">${esc(h)} <b>${d > 0 ? '▲' : '▼'}${Math.abs(d) > 1 ? Math.abs(d) : ''}</b></span>`);
    }
    for (const x of mine) {
      if (x.type === 'quartiers' && x.delta) chips.push(`<span class="chip q${x.delta > 0 ? ' gain' : ''}">${ICON.house}<b>${x.delta > 0 ? '+' : '−'}${Math.abs(x.delta)}</b>&nbsp;${Math.abs(x.delta) > 1 ? 'quartiers' : 'quartier'}${x.delta < 0 ? ` · ${esc(x.cause)}` : ''}</span>`);
      if (x.type === 'quartiers' && x.shielded) chips.push(`<span class="chip note">${esc(x.by ?? 'Une merveille')} rachète le quartier</span>`);
      if (x.type === 'sched') chips.push(`<span class="chip note">${ICON.hourglass}&nbsp;Cela aura des suites</span>`);
      if (x.type === 'bet') chips.push(`<span class="chip note">${ICON.dice}&nbsp;${x.win ? 'Réussi' : 'Raté'} (${Math.round(x.chance * 100)} %)</span>`);
      if (x.type === 'card+' && this.e.card(x.id).kind === 'decouverte') chips.push(`<span class="chip note">Découverte : ${esc(this.e.card(x.id).title)}</span>`);
      if (x.type === 'rot') chips.push(`<span class="chip note">La chasse : ${bagChips({ vivres: x.hunt }, '+')}${x.amount ? ` ; on ne porte pas plus de ${x.cap} : ${bagChips({ vivres: x.amount }, '−')} pourrissent` : ''}</span>`);
      if (x.type === 'raceStep') chips.push(`<span class="chip note${x.won ? ' good' : x.lost ? ' bad' : ''}">${x.won ? `Course gagnée : ${esc(this.e.rival(s).name)} n’achèveront pas leur merveille cette ère` : x.lost ? `Course perdue : ${esc(this.e.rival(s).name)} ont fini ; la crise frappera plus fort` : `${esc(capitalize(this.e.rival(s).name))} avancent : étape ${x.stage} sur ${x.of}`}</span>`);
      if (x.type === 'rival') chips.push(`<span class="chip note">${esc(capitalize(this.e.rival(s).name))} ${x.delta > 0 ? '▲' : '▼'}</span>`);
      if (x.type === 'rivalJalon' && !ev.some((y) => y.type === 'upkeep' || y.type === 'famine' || y.type === 'disette')) chips.push(`<span class="chip note">${esc(capitalize(this.e.rival(s).name))} ${x.delta < 0 ? 'perdent' : 'achèvent'} ${esc(x.name)} (${x.count}/5)</span>`);
    }
    // la réponse s'affiche sous la carte suivante : on rappelle à quoi elle répond
    if (reply) after.appendChild(el('p', 'reply', `${picked ? `<span class="reply-of">${esc(v.title)} · ${esc(picked)}</span>` : ''}${esc(reply)}`));
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
    const jal = ev.find((x) => x.type === 'jalon') as { name: string; era: number } | undefined;
    if (jal) {
      // la merveille rattrapée prend sa place dans l'ordre des ères, pas forcément la dernière
      setTimeout(() => this.scene.sparkAt(`j${s.jalons.slice(0, jal.era + 1).filter(Boolean).length - 1}`), 900);
      this.audio.wonder();
      await this.banner('Merveille bâtie', jal.name, 'gold');
    }
    if (ev.some((x) => x.type === 'end')) {
      await this.endFlow();
      return;
    }
    const eraEnd = ev.some((x) => x.type === 'upkeep' || x.type === 'famine' || x.type === 'disette');
    if (eraEnd) await this.showBilan(ev);
    const cr = ev.find((x) => x.type === 'crisis') as { name: string } | undefined;
    if (cr) {
      this.audio.crisisHit();
      this.audio.setTension(0.7, true);
      this.scene.setMood({ crisis: true });
      this.hint('crise', 'La <b>crise</b> : trois cartes, et les seuils annoncés au présage.');
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
    (this.root.querySelector('.after') as HTMLElement).innerHTML = '';
    const fm = this.e.form(s, era);
    await this.banner(`Ère ${ROMAN[era]}`, ERA_NAMES[era], '', `${fm.name} · ${ERA_SUBTITLES[era]}`);
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
    let details = false;
    this.openScreen('soft presage', (inner) => {
      const render = () => {
        const rv = this.e.rival(s);
        const ready = this.e.crisisReadiness(s);
        const jName = p.jalon ? p.jalon.name.charAt(0).toLowerCase() + p.jalon.name.slice(1) : '';
        // « à » + article : au Grand Hiver, à la Horde, à l'Éveil
        const n = p.crisis.name;
        const toCrisis = n.startsWith('Le ') ? `au ${n.slice(3)}` : n.startsWith('La ') ? `à la ${n.slice(3)}` : n.startsWith('Les ') ? `aux ${n.slice(4)}` : n.startsWith('L’') ? `à l’${n.slice(2)}` : `à ${n}`;
        // un message principal : l'objectif de l'ère, dans la forme de l'ère, en une phrase
        const fm = this.e.form(s);
        const cn = /^(Le|La|Les|L’) /.test(n) || n.startsWith('L’') ? n.charAt(0).toLowerCase() + n.slice(1) : n;
        // la course n'a plus d'enjeu quand la rivale a déjà ses cinq merveilles
        const mission = fm.id === 'course' && p.rival.count >= 5 ? 'Bâtir {j}, puis tenir face {c}.' : fm.mission;
        const main = p.jalon
          ? esc(mission.replace('{j}', jName).replace('{cn}', cn).replace('{c}', toCrisis).replace('{rival}', p.rival.name.charAt(0).toLowerCase() + p.rival.name.slice(1)))
          : `Tenir face ${esc(toCrisis)}.`;
        const words = (b: Partial<Record<Res, number>>) => RES.filter((r) => b[r]).map((r) => `<span class="w r-${r}">${RES_ICON[r]}${b[r]} ${RES_LABEL[r]}</span>`).join(', ');
        const miss = words(ready.missing);
        // pas de « presque prêt » : ce qui manque, pour quelle réponse, ce qu'elle coûte et ce que vous avez
        const needTxt = ready.answerNeed ? RES.filter((r) => ready.answerNeed![r]).map((r) => `${ready.answerNeed![r]} ${RES_LABEL[r]} (vous : ${s.res[r]})`).join(', ') : '';
        const readyTxt = ready.level === 'pret' ? 'Vous êtes prêt à l’affronter'
          : miss ? `Il vous manque ${miss}${ready.answer ? ` pour « ${esc(ready.answer)} », qui demande ${needTxt}` : ''}` : 'Pas encore prêt : certaines réponses exigent des familles qui vous aiment';
        // la merveille et la réponse à la crise puisent-elles dans la même réserve ?
        const shared = p.jalon && ready.answerNeed ? RES.filter((r) => (p.jalon!.cost[r] ?? 0) > 0 && (ready.answerNeed![r] ?? 0) > 0 && s.res[r] < (p.jalon!.cost[r] ?? 0) + (ready.answerNeed![r] ?? 0)) : [];
        const rivalTxt = p.rival.count >= 5 ? `${esc(capitalize(p.rival.name))}, la cité rivale, ont achevé leurs cinq merveilles : ils vous rançonnent à chaque ère.`
          : `${esc(capitalize(p.rival.name))}, la cité rivale, ont bâti <b>${p.rival.count} merveille${p.rival.count > 1 ? 's' : ''} sur 5</b>. S’ils achèvent les cinq, ils vous rançonneront à chaque ère.`;
        const missed = this.e.dessein(s).jalons.filter((_, k) => k < s.era && !s.jalons[k]).map((j) => j.name);
        const lonely = this.e.present(s).filter((f) => s.era - s.visits[f] >= 2 && s.fam[f].seen < s.era).map((f) => this.e.c.families[f].house[s.era]);
        const notes = [
          ...(missed.length ? [fm.seasons > 1 ? `${esc(missed[missed.length - 1])} : vous pourrez la rattraper, plus cher, à la dernière saison` : `${missed.length > 1 ? 'des merveilles manquées' : 'une merveille manquée'} : trop tard pour la rattraper`] : []),
          ...(lonely.length ? [`${esc(capitalize(lonely.join(' et ')))} attendent votre visite cette ère`] : []),
          ...(shared.length ? [`l’objectif et la menace puisent dans le même ${shared.map((r) => RES_LABEL[r]).join(' et ')}`] : []),
        ];
        inner.innerHTML = `<div class="over">${esc(s.name)} · Ère ${ROMAN[p.era]} · ${esc(p.date.replace(' avant le Calendrier', ' av. C.'))}</div><h2 class="big">${esc(p.name)}</h2>
          <p class="form-line"><b>${esc(fm.name)}</b> · ${esc(fm.rhythm)}</p>
          <p class="mission">${main}</p>
          <p class="rule-line">${esc(fm.short.replace('{cap}', String(this.e.carryCap(s))))}</p>
          <div class="brief">
            <div class="bl"><i class="k">Objectif</i><span>${p.jalon ? `<b>${esc(p.jalon.name)}</b>, qui coûte ${words(p.jalon.cost)} <span class="have">(vous : ${RES.filter((r) => p.jalon!.cost[r]).map((r) => `${s.res[r]}`).join(', ')})</span>${p.tag && p.tag.total < p.tag.need ? ` <em class="warn">et ${p.tag.need} de ${esc(p.tag.tag)} (vous : ${p.tag.total})</em>` : ''}${fm.goal && !(fm.id === 'course' && p.rival.count >= 5) ? ` ; ${esc(fm.goal)}` : ''}` : 'La merveille de l’ère est debout.'}</span></div>
            <div class="bl"><i class="k">Menace</i><span><b>${esc(p.crisis.name)}</b>, ${esc(fm.when)}<br><em class="ready ${ready.level}">${readyTxt}</em></span></div>
            <div class="bl"><i class="k">Rivale</i><span>${rivalTxt}</span></div>
            ${p.legacy && p.legacy.label ? `<div class="bl"><i class="k">Héritage</i><span>Grâce à ${esc(p.legacy.from)}, votre ancienne cité : ${esc(p.legacy.label.charAt(0).toLowerCase() + p.legacy.label.slice(1))}${p.legacy.heirs ? ' (compté double)' : ''}</span></div>` : ''}
            ${notes.length ? `<div class="bl note"><i class="k">À noter</i><span>${notes.join(' · ')}</span></div>` : ''}
          </div>`;
        const more = el('button', 'more-btn', details ? 'Masquer les détails' : 'Détails : seuils, coûts, règles');
        more.addEventListener('click', () => {
          details = !details;
          render();
        });
        inner.appendChild(more);
        if (details) {
          if (p.legacy) {
            inner.appendChild(el('div', 'panel legacy', `<h3>L’héritage de ${esc(p.legacy.from)}</h3>
              ${p.legacy.testament ? `<p>Sur leur stèle : <q>« ${esc(p.legacy.testament)} »</q></p>` : ''}
              ${p.legacy.label ? `<p class="note">${esc(p.legacy.label)}${p.legacy.heirs ? ' (compté double : vous êtes leurs héritiers)' : ''}.</p>` : ''}
              ${p.legacy.memory ? `<p class="note">${esc(p.legacy.memory)}</p>` : ''}`));
          }
          const stars = `<span class="stars">${[0, 1, 2, 3, 4].map((k) => `<i class="${s.jalons[k] ? 'on' : ''}"></i>`).join('')}</span>`;
          const jal = p.jalon
            ? `<p><b>${esc(p.jalon.name)}</b> : ${esc(p.jalon.text)}</p><div class="row">${bagChips(p.jalon.cost)}${p.jalon.req ? `<span class="note">· exige ${esc(p.jalon.req)}</span>` : ''}</div><p class="note">${esc(p.jalon.gift)}</p>
              ${p.tag ? `<p class="note">${esc(p.tag.tag)} : ${p.tag.total} sur ${p.tag.need}${p.tag.parts.length ? ` (${esc(p.tag.parts.join(', '))})` : ''}. On en gagne avec ${esc(p.tag.how)}.</p>` : ''}
              ${p.alt ? `<p>Ou bien <b>${esc(p.alt.name)}</b> : ${esc(p.alt.text)}</p><div class="row">${bagChips(p.alt.cost)}</div>` : ''}`
            : '';
          const rule = `<p class="note">${fm.id === 'course' ? 'Le chantier ouvre à la fin de chaque saison si vous en avez les moyens, et de nouveau avant la crise.' : fm.seasons > 1 ? 'Le chantier ouvre à la fin de la première saison si vous en avez les moyens, et de nouveau avant la crise.' : 'Le chantier ouvre avant la crise.'} Quatre merveilles à la fin des temps : la victoire ; les cinq : le triomphe.</p>`;
          inner.appendChild(el('div', 'panel', `<h3>La forme de l’ère · ${esc(fm.name)}</h3><p><b>Rythme :</b> ${esc(fm.rhythm)} de ${fm.cards} cartes, puis le chantier, la crise et le bilan.</p><p><b>Règle :</b> ${esc(fm.rule)}</p><p><b>Objectif :</b> ${esc(fm.objective)}</p><p><b>Menace :</b> ${esc(fm.threat)}</p>`));
          const nxt = p.nextJalon ? `<p class="note">À l’ère suivante : ${esc(p.nextJalon.name)}${p.nextJalon.req ? `, qui exigera ${esc(p.nextJalon.req.replace(/ \(vous : \d+\)/, ''))}` : ''}.</p>` : '';
          inner.appendChild(el('div', 'panel', `<h3><span>Le dessein · ${esc(p.dessein)}</span>${stars}</h3>${jal}${rule}${nxt}`));
          const needs = Object.keys(p.needs.bag).length ? `<div class="row"><span class="note">Seuils et coûts annoncés, jusqu’à :</span>${bagChips(p.needs.bag)}</div>` : '';
          const ifBuilt = p.needsIfBuilt && RES.some((r) => (p.needsIfBuilt![r] ?? 0) > (p.needs.bag[r] ?? 0)) ? `<div class="row"><span class="note">Si vous bâtissez la merveille d’abord :</span>${bagChips(p.needsIfBuilt)}</div>` : '';
          inner.appendChild(el('div', 'panel crisis', `<h3>${esc(p.crisis.name)}</h3><p>${esc(p.crisis.intro)}</p><p><b>Ce qui protège :</b> ${esc(p.crisis.protects)}.</p>${needs}${ifBuilt}
            <p class="note">Réponses qui tiennent déjà : ${ready.covered} sur ${ready.total}.${p.envy ? ` Vos merveilles attirent les regards : crise ${p.envy} % plus dure.` : ''}</p>`));
          inner.appendChild(el('div', 'panel', `<h3><span>La rivale · ${esc(p.rival.name)}</span><span class="stars them" style="--rh:${rv.hue}">${[0, 1, 2, 3, 4].map((k) => `<i class="${k < p.rival.count ? 'on' : ''}"></i>`).join('')}</span></h3>
            <p>${p.rival.count >= 5 ? `${esc(p.rival.name)} ont achevé leur dessein : ils réclament un tribut à chaque ère.` : `${esc(p.rival.leader)} bâtit ${esc(p.rival.next)}, à achever en fin d’ère si personne ne l’en empêche. À cinq merveilles, la vallée leur paie tribut.`}</p>`));
          inner.appendChild(el('p', 'note', s.era >= 4 ? 'Dernier bilan : ni repas ni usure ; seules les révoltes comptent encore.' : `Au bilan : la cité mangera ${p.upkeep} Vivres${p.wonderUpkeep ? ` (dont ${p.wonderUpkeep} pour les merveilles)` : ''} ; l’Armée perd ${Math.round(TUNING.armyDecay * 100)} % et le Trésor ${Math.round(TUNING.treasureDecay * 100)} %${s.era < 4 ? ' ; puis une découverte à choisir, payée en Savoir' : ''}.`));
        }
        const btns = el('div', 'btns stick');
        btns.appendChild(this.button('En route', go));
        inner.appendChild(btns);
      };
      render();
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
      if (x.type === 'revolt') lines.push({ cls: 'bad', ico: ICON.warn, html: `<b>${esc(H(x.family))} se révoltent.</b> Un quartier brûle. Ils se calment, pour l’instant. <span class="chip loss q">${ICON.house}<b>−1</b></span>` });
      if (x.type === 'defect') lines.push({ cls: 'bad', ico: ICON.warn, html: `<b>${esc(H(x.family))} passent chez ${esc(this.e.rival(s).name)}.</b> Avec un quartier entier.` });
      if (x.type === 'neglect') lines.push({ cls: 'bad', ico: ICON.warn, html: `${esc(H(x.family))} se sentent délaissés : vous n’êtes pas passé chez eux depuis deux ères.` });
      if (x.type === 'income') lines.push({ cls: 'good', ico: ICON.star, html: `Une famille fervente apporte sa part : ${bagChips(x.bag, '+')}` });
      if (x.type === 'mend') lines.push({ cls: 'good', ico: ICON.star, html: `Les Peintures de la grotte apaisent ${esc(this.e.c.families[x.family].house[s.era])} : ils remontent d’un cran.` });
      if (x.type === 'disette') lines.push({ cls: 'bad', ico: ICON.warn, html: `<b>Disette.</b> Il manquait ${x.missing} Vivres : pas de quartier perdu, mais toutes les familles grognent (−1 chacune).` });
      if (x.type === 'decay') lines.push({ cls: '', ico: RES_ICON.armee, html: `Les vétérans rentrent chez eux, les comptables se servent : ${bagChips({ armee: x.armee, tresor: x.tresor }, '−')}` });
      if (x.type === 'upkeep') lines.push({ cls: '', ico: RES_ICON.vivres, html: `La cité mange, et ses merveilles s’entretiennent : ${bagChips({ vivres: x.amount }, '−')}` });
      if (x.type === 'famine') lines.push({ cls: 'bad', ico: ICON.warn, html: ev.some((y) => y.type === 'quartiers' && y.shielded && y.cause === 'la famine') ? '<b>Famine.</b> Les greniers sont vides ; une merveille rachète le quartier.' : '<b>Famine.</b> Les greniers sont vides. Un quartier se vide aussi.' });
      if (x.type === 'spoil') lines.push({ cls: '', ico: RES_ICON.vivres, html: `Les greniers débordent : au-delà de trois repas d’avance, une part se gâte. ${bagChips({ vivres: x.amount }, '−')}` });
      if (x.type === 'peace') lines.push({ cls: 'good', ico: ICON.star, html: `<b>La paix civile.</b> Aucune famille fâchée : un quartier de plus. <span class="chip q">${ICON.house}<b>+1</b></span>` });
      if (x.type === 'annex') lines.push({ cls: 'bad', ico: ICON.warn, html: `<b>${esc(capitalize(x.name))} annexent un quartier.</b> Leur dessein est achevé ; ils s’étendent, sauf chez leurs amis.` });
      if (x.type === 'rivalJalon') lines.push({ cls: x.delta < 0 ? 'good' : 'bad', ico: ICON.star, html: `${esc(capitalize(this.e.rival(s).name))} ${x.delta < 0 ? 'perdent' : 'achèvent'} <b>${esc(x.name)}</b> (${x.count}/5).` });
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
        this.hint('bilan', 'Le <b>bilan</b> : la cité mange, l’armée et le trésor s’usent, la rivale avance.', inner);
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
      await this.banner(r.rank === 'triomphe' ? 'Triomphe' : r.rank === 'victoire' ? 'Victoire' : 'Survie', s.name, 'gold');
    }
    if (this.s !== s) return;
    await this.timelapse(s);
    if (this.s !== s) return;
    this.endScreen(s);
  }

  /** Dix mille ans en quelques secondes : la cité rejouée de sa fondation à sa fin. */
  private timelapse(s: GameState): Promise<void> {
    if (document.documentElement.classList.contains('reduced')) return Promise.resolve();
    const snaps = replaySnapshots(this.e, s);
    if (snaps.length < 4) return Promise.resolve();
    return new Promise((done) => {
      const dead = s.result?.type === 'defaite';
      document.body.classList.add('cinema');
      const short = (d: string) => d.replace(' avant le Calendrier', ' av. C.');
      const cap = el('div', 'cinema-cap', `<div class="over">${esc(s.name)}</div><p>De l’${esc(short(s.history[0]?.date ?? 'an 9 200 avant le Calendrier'))}<br>à l’${esc(short(s.history[s.history.length - 1]?.date ?? ''))}</p><span>Toucher pour passer</span>`);
      document.body.appendChild(cap);
      this.scene.setMood({ dead: false, crisis: false, danger: 0 });
      this.setEraColor(0);
      let finished = false;
      const end = () => {
        if (finished) return;
        finished = true;
        this.scene.stopTimelapse();
        this.scene.setSnapshot(snapshot(this.e, s), { instant: true });
        this.setEraColor(s.era);
        if (dead) this.scene.setMood({ dead: true });
        document.body.classList.remove('cinema');
        cap.remove();
        window.removeEventListener('pointerdown', end);
        this.keyHandler = null;
        done();
      };
      window.addEventListener('pointerdown', end);
      this.keyHandler = () => end();
      this.scene.playTimelapse(snaps, Math.min(10, 4 + snaps.length * 0.06), () => setTimeout(end, 900));
    });
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
      return `<li><span class="d">${esc((h?.date ?? '').replace(' avant le Calendrier', ' av. C.'))}</span><span><span class="c">−${l.amount} ${l.amount > 1 ? 'quartiers' : 'quartier'} : ${esc(l.cause)}</span></span>${why ? `<span class="w">${why}</span>` : ''}</li>`;
    }).join('');
    this.openScreen('veil end', (inner) => {
      const shadow = r.type === 'victoire' && !r.ending && s.rivalJalons >= 5;
      const label = r.rank === 'triomphe' ? 'Triomphe · dessein accompli' : r.rank === 'victoire' ? `Victoire · ${r.jalons} merveilles sur 5` : r.type === 'defaite' ? `Chute · ${esc(ERA_NAMES[s.era])}` : shadow ? `Survie, dans l’ombre de ${esc(this.e.rival(s).name)}` : 'Survie · dessein inachevé';
      inner.innerHTML = `<div class="over">${label}</div>
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

  /** Votre civilisation : les merveilles, les découvertes, et ce que comptent vos mots-clés. */
  private deckScreen(): void {
    const s = this.s!;
    const prevKeys = this.keyHandler;
    const close = () => {
      this.closeScreen();
      this.keyHandler = prevKeys;
    };
    this.openScreen('veil deck', (inner) => {
      inner.innerHTML = `<div class="over">Votre civilisation</div><h2 class="big" style="font-size:clamp(26px,8vw,40px)">${esc(s.name)}</h2>
        <p class="sub">${esc(this.e.dessein(s).name)} · ${s.jalons.filter(Boolean).length} merveille${s.jalons.filter(Boolean).length > 1 ? 's' : ''} sur 5</p>`;
      const tags = el('div', 'panel');
      tags.innerHTML = '<h3>Mots-clés</h3>' + (['Science', 'Guerre', 'Foi', 'Commerce', 'Culture'] as const).map((t) => {
        const src = this.e.tagSources(s, t);
        return `<p><b>${esc(t)} : ${src.total}</b>${src.parts.length ? ` <span class="note">— ${esc(src.parts.join(', '))}</span>` : ''}</p>`;
      }).join('') + '<p class="note">Les mots-clés ouvrent les merveilles du dessein et améliorent les chances des paris qui les citent.</p>';
      inner.appendChild(tags);
      const built = s.jalons.map((b, i) => (b ? this.e.jalonOf(s, i) : null)).filter(Boolean);
      const w = el('div', 'panel');
      w.innerHTML = '<h3>Merveilles</h3>' + (built.length ? built.map((j) => `<p><b>${esc(j!.name)}</b> <span class="note">— ${esc(fill(j!.gift, s, this.e.c))}</span></p>`).join('') : '<p class="note">Aucune pour l’instant.</p>');
      inner.appendChild(w);
      const d = el('div', 'panel');
      const disc = s.deck.map((id) => this.e.card(id)).filter((c) => c.kind === 'decouverte');
      d.innerHTML = '<h3>Découvertes</h3>' + (disc.length ? disc.map((c) => `<p><b>${esc(c.title)}</b> <span class="note">— ${esc(fill(c.gift ?? '', s, this.e.c))}</span></p>`).join('') : '<p class="note">Aucune. On en choisit une à la fin de chaque ère, avec du Savoir.</p>');
      inner.appendChild(d);
      // dettes et promesses : ce qui reviendra
      const dues = s.sched.map((x) => {
        const c = this.e.c.cards[x.card];
        const n = Math.max(1, x.at - s.turn + 1);
        return /^creance/.test(x.card) ? `Créance : ${x.pay ?? '?'} Trésor, ou un quartier, dans ${n} carte${n > 1 ? 's' : ''}` : `Une suite de « ${x.from ?? '…'} » viendra${c ? '' : ''}`;
      });
      if (s.mem.includes('dette_ancestrale')) dues.push('Une défense de mammouth, empruntée aux Troc à l’âge de pierre, n’a jamais été rendue.');
      if (s.mem.includes('dette_refusee')) dues.push('Une dette refusée court toujours, quelque part chez la rivale.');
      if (dues.length) {
        const dd = el('div', 'panel');
        dd.innerHTML = '<h3>Dettes et promesses</h3>' + dues.map((x) => `<p class="note">${esc(x)}</p>`).join('');
        inner.appendChild(dd);
      }
      const b = el('div', 'btns');
      b.appendChild(this.button('Fermer', close));
      inner.appendChild(b);
    }, (k) => {
      if (k === 'Escape' || k === 'Enter') close();
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

  /** Une notion, une phrase, la première fois qu'elle apparaît ; une seule bulle par carte, les autres attendent leur tour. */
  private cardHints(v: View): void {
    const seen = (k: string) => this.settings.hints.includes(k);
    const tips: [string, boolean, string][] = [
      ['carrefour', v.kind === 'carrefour', 'À chaque <b>saison</b>, une route : elle mène à une famille, et celles qu’on ne visite pas se vexent.'],
      ['jalon', v.kind === 'jalon', 'Le <b>chantier</b> : chaque merveille rapproche du dessein, et rend la crise suivante plus dure.'],
      ['proces', v.kind === 'proces', 'Le <b>procès</b> : la famille la plus lésée cite contre vous votre pire décision.'],
      ['famille', v.kind === 'famille', 'Les familles <b>se souviennent</b> : leurs descendants vous citeront ce choix.'],
      ['rivale', v.kind === 'rivale', 'La <b>rivale</b> bâtit aussi : à cinq merveilles, la vallée lui paie tribut.'],
      ['regle', v.kind === 'regle', 'Une <b>colonie</b> : un quartier de plus, c’est une vie de plus pour la cité ; celui-ci se nourrit lui-même.'],
      ['conseil', v.kind === 'conseil', 'Le <b>Conseil</b> : soutenir une famille froisse sa rivale.'],
      ['credit', v.options.some((o) => o.label.endsWith('(à crédit)')), 'À <b>crédit</b> : les Troc avancent la somme, à rendre plus cher deux saisons plus tard.'],
      ['pari', v.options.some((o) => o.odds !== undefined), 'Un <b>pari</b> : la chance affichée est la vraie.'],
      ['cout', v.options.some((o) => Object.keys(o.cost).length > 0), 'Le <b>coût</b> est sûr ; ce qui rentre est une fourchette, et les flèches disent l’effet sur chaque famille.'],
      ['sablier', v.options.some((o) => o.later), 'Le <b>sablier</b> : ce choix aura une suite, plus tard.'],
    ];
    const tip = tips.find(([k, when]) => when && !seen(k));
    if (tip) this.hint(tip[0], tip[2]);
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
