import { GAUGES, GAUGE_LABEL, TUNING, type Delta, type GaugeId, type Gauges } from '../core/types';
import { gaugeSvg } from './art';
import { el, ICONS } from './dom';

/** à partir de cette amplitude, l'aperçu montre une double flèche */
const BIG = 13;

interface GaugeEl {
  root: HTMLElement;
  fill: SVGRectElement;
  prev: HTMLElement;
  delta: HTMLElement;
  wind: HTMLElement;
}

/** Les quatre jauges, intégrées en haut de la scène. */
export class Hud {
  readonly root: HTMLElement;
  private g = {} as Record<GaugeId, GaugeEl>;

  constructor() {
    this.root = el('header');
    this.root.id = 'hud';
    for (const id of GAUGES) {
      const root = el('div', 'gauge');
      root.dataset.gauge = id;
      root.setAttribute('role', 'meter');
      root.setAttribute('aria-label', GAUGE_LABEL[id]);
      root.setAttribute('aria-valuemin', '0');
      root.setAttribute('aria-valuemax', '100');
      const prev = el('div', 'gauge-prev');
      const icon = el('div', 'gauge-icon', gaugeSvg(id));
      const label = el('div', 'gauge-label', GAUGE_LABEL[id]);
      const delta = el('div', 'gauge-delta');
      const wind = el('div', 'gauge-wind');
      root.append(prev, icon, label, delta, wind);
      this.root.append(root);
      this.g[id] = { root, fill: icon.querySelector('.g-fill') as SVGRectElement, prev, delta, wind };
    }
  }

  set(gauges: Gauges): void {
    for (const id of GAUGES) {
      const v = Math.max(0, Math.min(100, gauges[id]));
      const ge = this.g[id];
      // la forme utile de l'icône occupe ~y 2..38
      const y = 38 - (v / 100) * 36;
      ge.fill.style.transform = `translateY(${y.toFixed(2)}px)`;
      ge.root.classList.toggle('danger', v <= TUNING.dangerLow || v >= TUNING.dangerHigh);
      ge.root.setAttribute('aria-valuenow', String(Math.round(v)));
    }
  }

  /** Le vent de l'ère : un petit chevron permanent sur la jauge qu'il pousse. */
  setWind(wind: Delta): void {
    for (const id of GAUGES) {
      const d = wind[id] ?? 0;
      const ge = this.g[id];
      ge.wind.innerHTML = d ? ICONS[d > 0 ? 'up1' : 'down1'] : '';
      ge.wind.classList.toggle('on', d !== 0);
      ge.wind.title = d ? (d > 0 ? 'Le vent de l’ère fait monter cette jauge' : 'Le vent de l’ère fait baisser cette jauge') : '';
    }
  }

  /** Aperçu d'une option : sens et intensité, jamais la valeur. */
  preview(delta: Delta | null): void {
    for (const id of GAUGES) {
      const ge = this.g[id];
      const d = delta?.[id] ?? 0;
      if (!d) {
        ge.root.classList.remove('prev');
        continue;
      }
      const big = Math.abs(d) >= BIG;
      const key = d > 0 ? (big ? 'up2' : 'up1') : big ? 'down2' : 'down1';
      if (ge.prev.dataset.k !== key) {
        ge.prev.innerHTML = ICONS[key];
        ge.prev.dataset.k = key;
      }
      ge.root.classList.add('prev');
    }
  }

  /** Retour visuel après un choix. */
  bump(delta: Delta): void {
    for (const id of GAUGES) {
      const d = delta[id] ?? 0;
      if (!d) continue;
      const ge = this.g[id];
      const up = d > 0;
      ge.root.classList.remove('bump-up', 'bump-down');
      ge.delta.classList.remove('go-up', 'go-down');
      void ge.root.offsetWidth;
      ge.root.classList.add(up ? 'bump-up' : 'bump-down');
      ge.delta.innerHTML = ICONS[up ? (Math.abs(d) >= BIG ? 'up2' : 'up1') : Math.abs(d) >= BIG ? 'down2' : 'down1'];
      ge.delta.classList.add(up ? 'go-up' : 'go-down');
    }
  }
}
