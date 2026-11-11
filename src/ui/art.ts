/**
 * Illustrations génératives des cartes : un seul langage visuel (cercles, arcs, lignes,
 * triangles, lumière) décliné en vingt motifs. Tout est du SVG produit par code.
 */
import { Rng, hashString } from '../core/rng';
import type { CardDef, Keyword } from '../core/types';

export const KEYWORD_HUE: Record<Keyword, number> = {
  Foi: 44,
  Guerre: 4,
  Commerce: 168,
  Science: 208,
  Culture: 300,
  Nature: 112,
};

let uid = 0;

export function cardHue(card: CardDef): number {
  if (card.art?.hue !== undefined) return card.art.hue;
  if (card.kind === 'crisis') return 8;
  if (card.kind === 'rival') return 262;
  const k = card.keywords?.[0];
  if (k) return KEYWORD_HUE[k];
  return 30;
}

const f = (n: number) => n.toFixed(1);

function ring(cx: number, cy: number, r: number, n: number, fn: (a: number, i: number) => string): string {
  let s = '';
  for (let i = 0; i < n; i++) s += fn((i / n) * Math.PI * 2, i);
  void cx;
  void cy;
  void r;
  return s;
}

function motif(name: string, rng: Rng, st: string, fl: string, dim: string): string {
  const cx = 150;
  const cy = 98;
  const S = `fill="none" stroke="${st}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"`;
  const Sd = `fill="none" stroke="${dim}" stroke-width="1" stroke-linecap="round"`;
  const F = `fill="${fl}" stroke="${st}" stroke-width="1.2" stroke-linejoin="round"`;
  switch (name) {
    case 'sun': {
      const n = 12 + rng.int(0, 2) * 4;
      let rays = '';
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const r1 = 36;
        const r2 = i % 2 ? 50 : 62;
        rays += `<line x1="${f(cx + Math.cos(a) * r1)}" y1="${f(cy + Math.sin(a) * r1)}" x2="${f(cx + Math.cos(a) * r2)}" y2="${f(cy + Math.sin(a) * r2)}" ${S}/>`;
      }
      return `${rays}<circle cx="${cx}" cy="${cy}" r="27" ${F}/><circle cx="${cx}" cy="${cy}" r="17" ${Sd}/>`;
    }
    case 'moon': {
      const r = 40;
      return `<path d="M${cx + 8} ${cy - r} A${r} ${r} 0 1 0 ${cx + 8} ${cy + r} A${r * 0.72} ${r * 0.72} 0 1 1 ${cx + 8} ${cy - r} Z" ${F}/>` +
        `<circle cx="${cx + 38}" cy="${cy - 26}" r="2.2" fill="${st}"/><circle cx="${cx + 54}" cy="${cy + 6}" r="1.5" fill="${st}"/><circle cx="${cx + 30}" cy="${cy + 30}" r="1.2" fill="${st}"/>` +
        `<path d="M${cx - 62} ${cy + 52} H${cx + 62}" ${Sd}/>`;
    }
    case 'mountain': {
      const p = rng.range(-12, 12);
      return `<circle cx="${f(cx + 34 + p)}" cy="${cy - 30}" r="13" ${Sd}/>` +
        `<path d="M${cx - 78} ${cy + 46} L${f(cx - 22 + p)} ${cy - 44} L${cx + 30} ${cy + 46} Z" ${F}/>` +
        `<path d="M${cx - 4} ${cy + 46} L${cx + 40} ${cy - 12} L${cx + 82} ${cy + 46} Z" fill="rgba(0,0,0,.35)" stroke="${st}" stroke-width="1.2" stroke-linejoin="round"/>` +
        `<path d="M${f(cx - 34 + p)} ${cy - 22} l8 9 l6 -7 l7 10" ${S}/>`;
    }
    case 'wave': {
      let s = `<circle cx="${cx}" cy="${cy - 10}" r="26" ${F}/>`;
      for (let i = 0; i < 4; i++) {
        const y = cy + 6 + i * 14;
        const amp = 7 - i;
        let d = `M${cx - 84} ${y}`;
        for (let k = 0; k < 6; k++) d += ` q14 ${k % 2 ? amp : -amp} 28 0`;
        s += `<path d="${d}" fill="none" stroke="${i === 0 ? st : dim}" stroke-width="${i === 0 ? 1.6 : 1.1}" stroke-linecap="round"/>`;
      }
      return `<g>${s}</g><rect x="${cx - 86}" y="${cy + 8}" width="172" height="56" fill="rgba(6,5,10,.55)"/>` +
        (() => {
          let w = '';
          for (let i = 0; i < 4; i++) {
            const y = cy + 6 + i * 14;
            const amp = 7 - i;
            let d = `M${cx - 84} ${y}`;
            for (let k = 0; k < 6; k++) d += ` q14 ${k % 2 ? amp : -amp} 28 0`;
            w += `<path d="${d}" fill="none" stroke="${i === 0 ? st : dim}" stroke-width="${i === 0 ? 1.6 : 1.1}" stroke-linecap="round"/>`;
          }
          return w;
        })();
    }
    case 'tower': {
      const h = 92;
      const w = 30;
      const x0 = cx - w / 2;
      const y0 = cy + 48;
      let cr = '';
      for (let i = 0; i < 3; i++) cr += `<rect x="${f(x0 - 4 + i * 14)}" y="${y0 - h - 9}" width="8" height="9" ${F}/>`;
      return `<path d="M${x0 - 4} ${y0 - h} H${x0 + w + 4} V${y0 - h + 6} H${x0 + w} L${x0 + w + 5} ${y0} H${x0 - 5} L${x0} ${y0 - h + 6} H${x0 - 4} Z" ${F}/>${cr}` +
        `<path d="M${cx - 6} ${y0} v-16 a6 6 0 0 1 12 0 v16" ${S}/><line x1="${cx}" y1="${y0 - 56}" x2="${cx}" y2="${y0 - 44}" ${S}/>` +
        `<path d="M${cx - 70} ${y0} H${cx + 70}" ${Sd}/><path d="M${cx + 22} ${y0 - h + 2} l44 -22 M${cx - 22} ${y0 - h + 2} l-44 -22" ${Sd}/>`;
    }
    case 'eye': {
      let lashes = '';
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + (i + 0.5) * (Math.PI / 9);
        lashes += `<line x1="${f(cx + Math.cos(a) * 46)}" y1="${f(cy + Math.sin(a) * 34)}" x2="${f(cx + Math.cos(a) * 58)}" y2="${f(cy + Math.sin(a) * 46)}" ${Sd}/>`;
      }
      return `${lashes}<path d="M${cx - 62} ${cy} Q${cx} ${cy - 46} ${cx + 62} ${cy} Q${cx} ${cy + 46} ${cx - 62} ${cy} Z" ${F}/>` +
        `<circle cx="${cx}" cy="${cy}" r="19" fill="rgba(6,5,10,.7)" stroke="${st}" stroke-width="1.3"/><circle cx="${cx}" cy="${cy}" r="7" fill="${st}"/>`;
    }
    case 'spiral': {
      let d = '';
      const turns = 3.2;
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * turns * Math.PI * 2 + rng.next() * 0;
        const r = 4 + (i / 120) * 52;
        d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`;
      }
      return `<circle cx="${cx}" cy="${cy}" r="58" ${Sd} stroke-dasharray="2 6"/><path d="${d}" ${S}/><circle cx="${cx}" cy="${cy}" r="5" fill="${st}"/>`;
    }
    case 'crown': {
      const y0 = cy + 30;
      const pts = [-52, 0, -52, -44, -28, -18, 0, -62, 28, -18, 52, -44, 52, 0];
      let d = '';
      for (let i = 0; i < pts.length; i += 2) d += `${i ? 'L' : 'M'}${cx + pts[i]} ${y0 + pts[i + 1]}`;
      return `<path d="${d} Z" ${F}/><rect x="${cx - 56}" y="${y0}" width="112" height="12" ${F}/>` +
        `<circle cx="${cx - 52}" cy="${y0 - 49}" r="4.5" fill="${st}"/><circle cx="${cx}" cy="${y0 - 67}" r="5.5" fill="${st}"/><circle cx="${cx + 52}" cy="${y0 - 49}" r="4.5" fill="${st}"/>`;
    }
    case 'leaf': {
      let veins = '';
      for (let i = 1; i <= 5; i++) {
        const y = cy + 48 - i * 16;
        const w = 30 * Math.sin((i / 6) * Math.PI);
        veins += `<path d="M${cx} ${y} l${f(w)} ${-10} M${cx} ${y} l${f(-w)} ${-10}" ${Sd}/>`;
      }
      return `<path d="M${cx} ${cy - 60} C${cx + 58} ${cy - 30} ${cx + 44} ${cy + 36} ${cx} ${cy + 56} C${cx - 44} ${cy + 36} ${cx - 58} ${cy - 30} ${cx} ${cy - 60} Z" ${F}/>` +
        `<line x1="${cx}" y1="${cy - 50}" x2="${cx}" y2="${cy + 64}" ${S}/>${veins}`;
    }
    case 'gear': {
      const n = 10;
      let d = '';
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2;
        const a1 = ((i + 0.5) / n) * Math.PI * 2;
        const pt = (a: number, r: number) => `${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`;
        d += `${i ? 'L' : 'M'}${pt(a0 - 0.1, 42)} L${pt(a0 - 0.06, 54)} L${pt(a0 + 0.2, 54)} L${pt(a0 + 0.24, 42)} L${pt(a1 + 0.1, 42)}`;
      }
      return `<path d="${d} Z" ${F}/><circle cx="${cx}" cy="${cy}" r="24" fill="rgba(6,5,10,.7)" stroke="${st}" stroke-width="1.3"/><circle cx="${cx}" cy="${cy}" r="7" ${S}/>`;
    }
    case 'star': {
      let d = '';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 ? 13 : i % 4 === 0 ? 62 : 36;
        d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`;
      }
      return `<circle cx="${cx}" cy="${cy}" r="44" ${Sd}/><path d="${d} Z" ${F}/><circle cx="${cx}" cy="${cy}" r="4" fill="${st}"/>`;
    }
    case 'flame': {
      const y0 = cy + 52;
      return `<path d="M${cx} ${cy - 62} C${cx + 14} ${cy - 30} ${cx + 44} ${cy - 8} ${cx + 34} ${cy + 26} C${cx + 28} ${y0 - 4} ${cx - 28} ${y0 - 4} ${cx - 34} ${cy + 26} C${cx - 42} ${cy - 2} ${cx - 16} ${cy - 16} ${cx} ${cy - 62} Z" ${F}/>` +
        `<path d="M${cx + 2} ${cy - 14} C${cx + 10} ${cy + 4} ${cx + 20} ${cy + 14} ${cx + 14} ${cy + 30} C${cx + 10} ${cy + 42} ${cx - 12} ${cy + 42} ${cx - 15} ${cy + 30} C${cx - 18} ${cy + 16} ${cx - 4} ${cy + 8} ${cx + 2} ${cy - 14} Z" fill="rgba(6,5,10,.55)" stroke="${st}" stroke-width="1.2"/>` +
        `<path d="M${cx - 60} ${y0 + 6} H${cx + 60}" ${Sd}/>`;
    }
    case 'shield': {
      return `<path d="M${cx - 46} ${cy - 54} H${cx + 46} V${cy - 6} C${cx + 46} ${cy + 28} ${cx + 22} ${cy + 48} ${cx} ${cy + 60} C${cx - 22} ${cy + 48} ${cx - 46} ${cy + 28} ${cx - 46} ${cy - 6} Z" ${F}/>` +
        `<path d="M${cx} ${cy - 54} V${cy + 60} M${cx - 46} ${cy - 12} H${cx + 46}" ${Sd}/>` +
        `<path d="M${cx - 22} ${cy - 30} L${cx} ${cy - 44} L${cx + 22} ${cy - 30}" ${S}/>`;
    }
    case 'scroll': {
      let lines = '';
      for (let i = 0; i < 5; i++) lines += `<line x1="${cx - 30}" y1="${cy - 30 + i * 14}" x2="${f(cx + 30 - (i === 4 ? 22 : rng.range(0, 10)))}" y2="${cy - 30 + i * 14}" ${Sd}/>`;
      return `<rect x="${cx - 44}" y="${cy - 48}" width="88" height="96" ${F}/><circle cx="${cx - 44}" cy="${cy - 48}" r="8" ${F}/><circle cx="${cx + 44}" cy="${cy - 48}" r="8" ${F}/>` +
        `<circle cx="${cx - 44}" cy="${cy + 48}" r="8" ${F}/><circle cx="${cx + 44}" cy="${cy + 48}" r="8" ${F}/>${lines}`;
    }
    case 'coin': {
      let stack = '';
      for (let i = 0; i < 4; i++) stack += `<ellipse cx="${cx + 38}" cy="${cy + 44 - i * 11}" rx="30" ry="9" ${F}/>`;
      return `${stack}<circle cx="${cx - 22}" cy="${cy - 4}" r="44" ${F}/><circle cx="${cx - 22}" cy="${cy - 4}" r="34" ${Sd}/>` +
        `<rect x="${cx - 32}" y="${cy - 14}" width="20" height="20" fill="rgba(6,5,10,.7)" stroke="${st}" stroke-width="1.3"/>`;
    }
    case 'comet': {
      const hx = cx + 40;
      const hy = cy + 26;
      return `<path d="M${hx - 8} ${hy - 10} Q${cx - 20} ${cy - 30} ${cx - 86} ${cy - 56}" ${S}/><path d="M${hx - 12} ${hy - 2} Q${cx - 30} ${cy - 8} ${cx - 92} ${cy - 24}" ${Sd}/>` +
        `<path d="M${hx - 2} ${hy - 14} Q${cx} ${cy - 46} ${cx - 60} ${cy - 76}" ${Sd}/>` +
        `<circle cx="${hx}" cy="${hy}" r="17" ${F}/><circle cx="${hx}" cy="${hy}" r="6" fill="${st}"/>` +
        `<circle cx="${cx - 50}" cy="${cy + 36}" r="1.6" fill="${st}"/><circle cx="${cx - 12}" cy="${cy + 50}" r="1.2" fill="${st}"/>`;
    }
    case 'ring': {
      return `<ellipse cx="${cx}" cy="${cy}" rx="66" ry="22" ${Sd} transform="rotate(-18 ${cx} ${cy})"/>` +
        `<circle cx="${cx}" cy="${cy}" r="30" ${F}/>` +
        `<path d="M${cx - 62} ${cy + 22} A66 22 -18 0 0 ${cx + 62} ${cy - 22}" ${S}/>` +
        `<circle cx="${cx + 60}" cy="${cy - 23}" r="5" fill="${st}"/>`;
    }
    case 'arch': {
      const y0 = cy + 52;
      return `<path d="M${cx - 50} ${y0} V${cy - 10} A50 50 0 0 1 ${cx + 50} ${cy - 10} V${y0} H${cx + 30} V${cy - 8} A30 30 0 0 0 ${cx - 30} ${cy - 8} V${y0} Z" ${F}/>` +
        `<path d="M${cx - 62} ${y0} H${cx + 62} M${cx - 70} ${y0 + 8} H${cx + 70}" ${S}/>` +
        `<path d="M${cx} ${cy - 30} V${y0} M${cx - 16} ${cy - 22} L${cx - 22} ${y0} M${cx + 16} ${cy - 22} L${cx + 22} ${y0}" ${Sd}/>`;
    }
    case 'wheat': {
      let grains = '';
      for (let i = 0; i < 6; i++) {
        const y = cy + 28 - i * 15;
        grains += `<ellipse cx="${cx - 11}" cy="${y}" rx="6" ry="11" transform="rotate(-28 ${cx - 11} ${y})" ${F}/>`;
        grains += `<ellipse cx="${cx + 11}" cy="${y}" rx="6" ry="11" transform="rotate(28 ${cx + 11} ${y})" ${F}/>`;
      }
      return `<line x1="${cx}" y1="${cy + 62}" x2="${cx}" y2="${cy - 52}" ${S}/>${grains}<ellipse cx="${cx}" cy="${cy - 60}" rx="6" ry="11" ${F}/>` +
        `<path d="M${cx - 60} ${cy + 62} H${cx + 60}" ${Sd}/>`;
    }
    case 'mask':
    default: {
      return `<path d="M${cx - 40} ${cy - 44} Q${cx} ${cy - 62} ${cx + 40} ${cy - 44} V${cy + 6} C${cx + 40} ${cy + 40} ${cx + 14} ${cy + 58} ${cx} ${cy + 60} C${cx - 14} ${cy + 58} ${cx - 40} ${cy + 40} ${cx - 40} ${cy + 6} Z" ${F}/>` +
        `<path d="M${cx} ${cy - 53} V${cy + 60}" ${Sd}/>` +
        `<path d="M${cx - 28} ${cy - 14} q10 -9 20 0 q-10 7 -20 0 Z M${cx + 8} ${cy - 14} q10 -9 20 0 q-10 7 -20 0 Z" fill="rgba(6,5,10,.8)" stroke="${st}" stroke-width="1.2"/>` +
        `<path d="M${cx - 18} ${cy + 28} Q${cx - 8} ${cy + 38} ${cx} ${cy + 30} Q${cx + 8} ${cy + 22} ${cx + 18} ${cy + 30}" ${S}/>`;
    }
  }
  void ring;
}

/** SVG de l'illustration d'une carte (viewBox 300×200). */
export function cardArt(card: CardDef): string {
  const id = `a${uid++}`;
  const rng = new Rng(hashString(card.id));
  const h = cardHue(card);
  const crisis = card.kind === 'crisis';
  const st = `hsl(${h} 88% ${crisis ? 80 : 82}%)`;
  const dim = `hsla(${h}, 70%, 78%, .38)`;
  const name = card.art?.motif ?? 'star';
  const gx = 150 + rng.range(-18, 18);
  let rays = '';
  const n = 18 + rng.int(0, 10);
  const off = rng.range(0, 6.28);
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * Math.PI * 2;
    const r1 = 70 + rng.range(0, 14);
    const r2 = 150 + rng.range(0, 60);
    rays += `<line x1="${f(150 + Math.cos(a) * r1)}" y1="${f(98 + Math.sin(a) * r1)}" x2="${f(150 + Math.cos(a) * r2)}" y2="${f(98 + Math.sin(a) * r2)}" stroke="hsla(${h},80%,76%,${(0.05 + rng.next() * 0.09).toFixed(2)})" stroke-width="${rng.chance(0.3) ? 2 : 1}"/>`;
  }
  let dots = '';
  for (let i = 0; i < 14; i++) {
    dots += `<circle cx="${f(rng.range(8, 292))}" cy="${f(rng.range(8, 150))}" r="${f(rng.range(0.5, 1.5))}" fill="hsla(${h},90%,88%,${(0.25 + rng.next() * 0.5).toFixed(2)})"/>`;
  }
  return `<svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
<radialGradient id="${id}g" cx="${f(gx / 3)}%" cy="49%" r="72%"><stop offset="0" stop-color="hsl(${h} ${crisis ? 78 : 62}% ${crisis ? 30 : 27}%)"/><stop offset=".45" stop-color="hsl(${h} 55% 12%)"/><stop offset="1" stop-color="#07060b"/></radialGradient>
<linearGradient id="${id}m" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="hsla(${h},95%,84%,.95)"/><stop offset="1" stop-color="hsla(${(h + 340) % 360},80%,46%,.5)"/></linearGradient>
<radialGradient id="${id}h" cx="50%" cy="49%" r="36%"><stop offset="0" stop-color="hsla(${h},100%,74%,.5)"/><stop offset="1" stop-color="hsla(${h},100%,70%,0)"/></radialGradient>
<linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset=".7" stop-color="rgba(13,11,18,0)"/><stop offset="1" stop-color="rgba(13,11,18,1)"/></linearGradient>
</defs>
<rect width="300" height="200" fill="url(#${id}g)"/>
${rays}${dots}
<circle cx="150" cy="98" r="84" fill="none" stroke="hsla(${h},70%,78%,.16)" stroke-width="1"/>
<circle cx="150" cy="98" r="70" fill="none" stroke="hsla(${h},70%,78%,.24)" stroke-width="1" stroke-dasharray="1 5"/>
<rect width="300" height="200" fill="url(#${id}h)"/>
${motif(name, rng, st, `url(#${id}m)`, dim)}
<rect width="300" height="200" fill="url(#${id}f)"/>
</svg>`;
}

// ---------------------------------------------------------------------- icônes de jauge

export const GAUGE_PATH: Record<string, string> = {
  // grain
  food: 'M20 2 C33 11 36 25 20 38 C4 25 7 11 20 2 Z',
  // bouclier
  army: 'M6 5 H34 V19 C34 28.5 27.5 34 20 37.5 C12.5 34 6 28.5 6 19 Z',
  // hexagone (la lanterne du savoir)
  knowledge: 'M20 2 L35.6 11 V29 L20 38 L4.4 29 V11 Z',
  // pièce
  treasure: 'M20 3 A17 17 0 1 1 19.99 3 Z',
};

export const GAUGE_DETAIL: Record<string, string> = {
  food: '<path d="M20 9 V31" /><path d="M20 17 l5 -4 M20 23 l5 -4 M20 17 l-5 -4 M20 23 l-5 -4"/>',
  army: '<path d="M20 5 V37 M6 17 H34"/>',
  knowledge: '<path d="M20 12 L22 18 L28 20 L22 22 L20 28 L18 22 L12 20 L18 18 Z"/>',
  treasure: '<rect x="15.5" y="15.5" width="9" height="9"/>',
};

export function gaugeSvg(id: string): string {
  const path = GAUGE_PATH[id];
  return `<svg viewBox="0 0 40 40" aria-hidden="true">
<defs><clipPath id="gc-${id}"><path d="${path}"/></clipPath></defs>
<path class="g-bg" d="${path}"/>
<g clip-path="url(#gc-${id})"><rect class="g-fill" x="0" y="0" width="40" height="40"/></g>
<g class="g-detail">${GAUGE_DETAIL[id]}</g>
<path class="g-line" d="${path}"/>
</svg>`;
}

export function keywordGlyph(k: Keyword): string {
  // petite forme distincte par mot-clé (jamais la couleur seule)
  const g: Record<Keyword, string> = {
    Foi: '<path d="M6 1 V11 M2.5 4.5 H9.5"/>',
    Guerre: '<path d="M2 10 L10 2 M7 2 H10 V5"/>',
    Commerce: '<circle cx="6" cy="6" r="4"/><path d="M6 4 V8"/>',
    Science: '<path d="M6 1 L7.5 4.5 L11 6 L7.5 7.5 L6 11 L4.5 7.5 L1 6 L4.5 4.5 Z"/>',
    Culture: '<path d="M2 3 Q6 0 10 3 V6 Q10 10 6 11 Q2 10 2 6 Z"/>',
    Nature: '<path d="M6 1 C10 4 10 8 6 11 C2 8 2 4 6 1 Z"/>',
  };
  return `<svg class="kw-glyph" viewBox="0 0 12 12" aria-hidden="true">${g[k]}</svg>`;
}
