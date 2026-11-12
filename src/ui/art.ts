/**
 * Illustrations génératives des cartes : un seul langage visuel (cercles, arcs, lignes,
 * triangles, lumière) décliné en une trentaine de motifs. Tout est du SVG produit par code.
 * Une carte montre son sujet (le motif) et, quand quelqu'un parle, son orateur (un médaillon de famille).
 */
import { Rng, hashString } from '../core/rng';
import { portrait, type PortraitFam } from './portrait';

let uid = 0;

const f = (n: number) => n.toFixed(1);

function ring(cx: number, cy: number, r: number, n: number, fn: (a: number, i: number) => string): string {
  let s = '';
  for (let i = 0; i < n; i++) s += fn((i / n) * Math.PI * 2, i);
  void cx;
  void cy;
  void r;
  return s;
}

export function motif(name: string, rng: Rng, st: string, fl: string, dim: string, cx = 150, cy = 98): string {
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
    case 'fang': {
      return `<path d="M${cx - 52} ${cy - 40} Q${cx} ${cy - 58} ${cx + 52} ${cy - 40} Q${cx + 30} ${cy - 30} ${cx + 18} ${cy - 22} L${cx + 8} ${cy + 56} L${cx - 4} ${cy - 20} Q${cx - 30} ${cy - 26} ${cx - 52} ${cy - 40} Z" ${F}/>` +
        `<path d="M${cx - 34} ${cy - 34} L${cx - 26} ${cy + 6} L${cx - 18} ${cy - 30} M${cx + 26} ${cy - 30} L${cx + 32} ${cy - 2} L${cx + 38} ${cy - 34}" ${S}/>` +
        `<path d="M${cx - 66} ${cy + 60} H${cx + 66}" ${Sd}/><circle cx="${cx + 6}" cy="${cy + 20}" r="3" fill="${st}"/>`;
    }
    case 'hand': {
      let fingers = '';
      const xs = [-30, -12, 6, 24];
      const hs = [44, 58, 54, 40];
      xs.forEach((x, i) => { fingers += `<rect x="${cx + x - 7}" y="${cy - hs[i]}" width="14" height="${hs[i] + 8}" rx="7" ${F}/>`; });
      return `${fingers}<path d="M${cx - 38} ${cy} H${cx + 32} V${cy + 32} Q${cx + 30} ${cy + 58} ${cx - 2} ${cy + 58} Q${cx - 34} ${cy + 58} ${cx - 38} ${cy + 30} Z" ${F}/>` +
        `<path d="M${cx + 32} ${cy + 8} Q${cx + 56} ${cy - 4} ${cx + 58} ${cy + 16} Q${cx + 50} ${cy + 26} ${cx + 32} ${cy + 34}" ${F}/>` +
        `<circle cx="${cx - 3}" cy="${cy + 28}" r="10" ${Sd}/>`;
    }
    case 'skull': {
      return `<path d="M${cx - 44} ${cy - 4} C${cx - 48} ${cy - 56} ${cx + 48} ${cy - 56} ${cx + 44} ${cy - 4} C${cx + 42} ${cy + 16} ${cx + 30} ${cy + 22} ${cx + 26} ${cy + 34} V${cy + 52} H${cx - 26} V${cy + 34} C${cx - 30} ${cy + 22} ${cx - 42} ${cy + 16} ${cx - 44} ${cy - 4} Z" ${F}/>` +
        `<circle cx="${cx - 18}" cy="${cy - 2}" r="11" fill="rgba(6,5,10,.8)" stroke="${st}" stroke-width="1.2"/><circle cx="${cx + 18}" cy="${cy - 2}" r="11" fill="rgba(6,5,10,.8)" stroke="${st}" stroke-width="1.2"/>` +
        `<path d="M${cx} ${cy + 12} l-6 10 h12 Z" fill="rgba(6,5,10,.8)"/><path d="M${cx - 14} ${cy + 40} V${cy + 52} M${cx} ${cy + 40} V${cy + 52} M${cx + 14} ${cy + 40} V${cy + 52}" ${Sd}/>` +
        `<path d="M${cx - 70} ${cy + 60} H${cx + 70}" ${Sd}/>`;
    }
    case 'house': {
      return `<path d="M${cx - 48} ${cy + 50} V${cy - 6} L${cx} ${cy - 50} L${cx + 48} ${cy - 6} V${cy + 50} Z" ${F}/>` +
        `<rect x="${cx - 12}" y="${cy + 18}" width="24" height="32" fill="rgba(6,5,10,.75)" stroke="${st}" stroke-width="1.2"/>` +
        `<rect x="${cx - 34}" y="${cy + 2}" width="14" height="14" fill="${st}" opacity=".85"/><rect x="${cx + 20}" y="${cy + 2}" width="14" height="14" fill="${st}" opacity=".5"/>` +
        `<path d="M${cx + 24} ${cy - 30} V${cy - 50} H${cx + 34} V${cy - 20}" ${S}/><path d="M${cx - 76} ${cy + 50} H${cx + 76}" ${Sd}/>`;
    }
    case 'ship': {
      return `<path d="M${cx - 62} ${cy + 20} H${cx + 62} L${cx + 44} ${cy + 46} H${cx - 44} Z" ${F}/>` +
        `<line x1="${cx}" y1="${cy + 20}" x2="${cx}" y2="${cy - 62}" ${S}/>` +
        `<path d="M${cx + 4} ${cy - 56} Q${cx + 50} ${cy - 22} ${cx + 4} ${cy + 12} Z" ${F}/><path d="M${cx - 4} ${cy - 44} Q${cx - 38} ${cy - 16} ${cx - 4} ${cy + 10} Z" ${F}/>` +
        `<path d="M${cx} ${cy - 62} l14 6 l-14 6" ${S}/>` +
        `<path d="M${cx - 84} ${cy + 54} q14 -6 28 0 t28 0 t28 0 t28 0 t28 0 t28 0" ${Sd}/>`;
    }
    case 'bird': {
      return `<path d="M${cx - 76} ${cy - 18} Q${cx - 36} ${cy - 26} ${cx - 8} ${cy + 4} Q${cx + 20} ${cy - 40} ${cx + 76} ${cy - 30} Q${cx + 32} ${cy - 6} ${cx + 10} ${cy + 22} Q${cx} ${cy + 30} ${cx - 10} ${cy + 22} Q${cx - 30} ${cy - 2} ${cx - 76} ${cy - 18} Z" ${F}/>` +
        `<path d="M${cx - 6} ${cy + 22} l-8 24 M${cx + 4} ${cy + 22} l6 22" ${S}/><circle cx="${cx + 4}" cy="${cy + 2}" r="3" fill="${st}"/>` +
        `<circle cx="${cx + 52}" cy="${cy - 56}" r="12" ${Sd}/>`;
    }
    case 'key': {
      return `<circle cx="${cx - 34}" cy="${cy}" r="30" ${F}/><circle cx="${cx - 34}" cy="${cy}" r="12" fill="rgba(6,5,10,.8)" stroke="${st}" stroke-width="1.2"/>` +
        `<path d="M${cx - 4} ${cy - 6} H${cx + 70} V${cy + 6} H${cx - 4} Z" ${F}/><path d="M${cx + 42} ${cy + 6} v18 h10 v-18 M${cx + 60} ${cy + 6} v12 h8 v-12" ${F}/>` +
        `<circle cx="${cx - 34}" cy="${cy}" r="44" ${Sd} stroke-dasharray="2 6"/>`;
    }
    case 'road': {
      return `<path d="M${cx - 20} ${cy - 50} L${cx - 90} ${cy + 62} H${cx + 90} L${cx + 20} ${cy - 50} Z" ${F}/>` +
        `<path d="M${cx} ${cy - 44} V${cy - 30} M${cx} ${cy - 16} V${cy + 4} M${cx} ${cy + 20} V${cy + 46}" fill="none" stroke="rgba(6,5,10,.8)" stroke-width="4" stroke-linecap="round"/>` +
        `<circle cx="${cx}" cy="${cy - 62}" r="10" ${Sd}/><path d="M${cx - 110} ${cy - 50} H${cx - 40} M${cx + 40} ${cy - 50} H${cx + 110}" ${Sd}/>`;
    }
    case 'scales': {
      return `<line x1="${cx}" y1="${cy - 56}" x2="${cx}" y2="${cy + 50}" ${S}/><path d="M${cx - 30} ${cy + 50} H${cx + 30}" ${S}/>` +
        `<path d="M${cx - 62} ${cy - 40} L${cx + 62} ${cy - 50}" ${S}/><circle cx="${cx}" cy="${cy - 46}" r="5" fill="${st}"/>` +
        `<path d="M${cx - 62} ${cy - 40} L${cx - 82} ${cy + 4} M${cx - 62} ${cy - 40} L${cx - 42} ${cy + 4} M${cx + 62} ${cy - 50} L${cx + 42} ${cy - 8} M${cx + 62} ${cy - 50} L${cx + 82} ${cy - 8}" ${Sd}/>` +
        `<path d="M${cx - 86} ${cy + 4} Q${cx - 62} ${cy + 24} ${cx - 38} ${cy + 4} Z" ${F}/><path d="M${cx + 38} ${cy - 8} Q${cx + 62} ${cy + 12} ${cx + 86} ${cy - 8} Z" ${F}/>`;
    }
    case 'bell': {
      return `<path d="M${cx - 46} ${cy + 36} C${cx - 40} ${cy + 20} ${cx - 34} ${cy - 50} ${cx} ${cy - 52} C${cx + 34} ${cy - 50} ${cx + 40} ${cy + 20} ${cx + 46} ${cy + 36} Z" ${F}/>` +
        `<rect x="${cx - 52}" y="${cy + 36}" width="104" height="8" rx="3" ${F}/><circle cx="${cx}" cy="${cy + 52}" r="7" fill="${st}"/>` +
        `<path d="M${cx} ${cy - 52} V${cy - 64}" ${S}/><path d="M${cx - 68} ${cy - 20} q-10 14 0 28 M${cx + 68} ${cy - 20} q10 14 0 28" ${Sd}/>`;
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

export interface ArtSpec {
  /** graine visuelle (id de carte) */
  key: string;
  motif: string;
  hue: number;
  /** teinte d'alerte (crise, trahison) */
  alarm?: boolean;
  /** l'orateur : un médaillon de famille, de rivale ou d'ancêtre */
  speaker?: { motif: string; hue: number; mood: number; era: number; scars: number; fam?: PortraitFam };
}

/** Médaillon d'un orateur : même langage, cadre selon l'ère, anneau selon l'humeur, cicatrices des griefs. */
export function medallion(sp: NonNullable<ArtSpec['speaker']>, cx: number, cy: number, r: number, id: string): string {
  const h = sp.hue;
  const moodCol = sp.mood <= -2 ? '#ff6a4d' : sp.mood <= -1 ? '#ffa070' : sp.mood >= 2 ? '#ffe08a' : sp.mood >= 1 ? '#cfe8a0' : `hsla(${h},40%,80%,.6)`;
  const st = `hsl(${h} 85% 82%)`;
  const dim = `hsla(${h},70%,78%,.4)`;
  const k = r / 64;
  const rng = new Rng(hashString(id));
  let frame = '';
  // cadre de l'ère : pierre, laurier, ogive, engrenage, orbite
  if (sp.era === 0) for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283; frame += `<circle cx="${(cx + Math.cos(a) * r * 1.08).toFixed(1)}" cy="${(cy + Math.sin(a) * r * 1.08).toFixed(1)}" r="${(r * 0.07).toFixed(1)}" fill="${dim}"/>`; }
  if (sp.era === 1) for (let i = 0; i < 7; i++) { const a = 2.2 + (i / 6) * 1.9; for (const sgn of [-1, 1]) { const x = cx + sgn * Math.cos(a) * r * 1.1; const y = cy + Math.sin(a) * r * 1.1; frame += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * 0.06).toFixed(1)}" ry="${(r * 0.14).toFixed(1)}" transform="rotate(${((a * 57.3) + sgn * 30).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${dim}"/>`; } }
  if (sp.era === 2) frame = `<path d="M${cx - r * 1.1} ${cy + r * 0.2} V${cy - r * 0.3} Q${cx - r * 1.1} ${cy - r * 1.2} ${cx} ${cy - r * 1.45} Q${cx + r * 1.1} ${cy - r * 1.2} ${cx + r * 1.1} ${cy - r * 0.3} V${cy + r * 0.2}" fill="none" stroke="${dim}" stroke-width="1.4"/>`;
  if (sp.era === 3) for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283; frame += `<rect x="${(cx + Math.cos(a) * r * 1.1 - r * 0.05).toFixed(1)}" y="${(cy + Math.sin(a) * r * 1.1 - r * 0.05).toFixed(1)}" width="${(r * 0.1).toFixed(1)}" height="${(r * 0.1).toFixed(1)}" fill="${dim}"/>`; }
  if (sp.era === 4) frame = `<ellipse cx="${cx}" cy="${cy}" rx="${(r * 1.35).toFixed(1)}" ry="${(r * 0.38).toFixed(1)}" fill="none" stroke="${dim}" stroke-width="1.2" transform="rotate(-16 ${cx} ${cy})"/><circle cx="${(cx + r * 1.25).toFixed(1)}" cy="${(cy - r * 0.38).toFixed(1)}" r="${(r * 0.07).toFixed(1)}" fill="${st}"/>`;
  let scars = '';
  for (let i = 0; i < Math.min(3, sp.scars); i++) {
    const x = cx - r * 0.45 + i * r * 0.32 + rng.range(-4, 4) * k;
    scars += `<path d="M${(x - r * 0.12).toFixed(1)} ${(cy - r * 0.72).toFixed(1)} L${(x + r * 0.14).toFixed(1)} ${(cy - r * 0.38).toFixed(1)}" stroke="#ff7a5c" stroke-width="${(2.2 * k + 0.6).toFixed(1)}" stroke-linecap="round" opacity=".9"/>`;
  }
  if (sp.fam) {
    return `<g>${frame}<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}p)"/>${portrait(sp.fam, sp.era, sp.mood, h, cx, cy, r, id)}` +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${moodCol}" stroke-width="${(2.4 * k + 0.6).toFixed(1)}"/>${scars}</g>`;
  }
  return `<g>${frame}<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}p)" stroke="${moodCol}" stroke-width="${(2.4 * k + 0.6).toFixed(1)}"/>` +
    `<g transform="translate(${cx} ${cy}) scale(${(k * 0.62).toFixed(3)}) translate(-150 -98)">${motif(sp.motif, rng, st, `hsla(${h},80%,60%,.35)`, dim)}</g>${scars}</g>`;
}

/** Illustration d'une carte, en bandeau (viewBox 300×130) : le sujet, et l'orateur s'il y en a un. */
export function cardArt(a: ArtSpec): string {
  const id = `a${uid++}`;
  const rng = new Rng(hashString(a.key));
  const h = a.hue;
  const alarm = !!a.alarm;
  const st = `hsl(${h} 88% ${alarm ? 80 : 82}%)`;
  const dim = `hsla(${h}, 70%, 78%, .38)`;
  const sx = a.speaker ? 196 : 150;
  const cy = 66;
  let rays = '';
  const n = 18 + rng.int(0, 10);
  const off = rng.range(0, 6.28);
  for (let i = 0; i < n; i++) {
    const ang = off + (i / n) * Math.PI * 2;
    const r1 = 52 + rng.range(0, 10);
    const r2 = 120 + rng.range(0, 60);
    rays += `<line x1="${f(sx + Math.cos(ang) * r1)}" y1="${f(cy + Math.sin(ang) * r1)}" x2="${f(sx + Math.cos(ang) * r2)}" y2="${f(cy + Math.sin(ang) * r2)}" stroke="hsla(${h},80%,76%,${(0.05 + rng.next() * 0.09).toFixed(2)})" stroke-width="${rng.chance(0.3) ? 2 : 1}"/>`;
  }
  let dots = '';
  for (let i = 0; i < 12; i++) dots += `<circle cx="${f(rng.range(8, 292))}" cy="${f(rng.range(6, 110))}" r="${f(rng.range(0.5, 1.5))}" fill="hsla(${h},90%,88%,${(0.25 + rng.next() * 0.5).toFixed(2)})"/>`;
  const sp = a.speaker;
  const spDefs = sp ? `<radialGradient id="${id}p" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="hsl(${sp.hue} 55% 30%)"/><stop offset="1" stop-color="hsl(${sp.hue} 45% 9%)"/></radialGradient>` : '';
  return `<svg viewBox="0 0 300 130" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
<radialGradient id="${id}g" cx="${f(sx / 3)}%" cy="50%" r="72%"><stop offset="0" stop-color="hsl(${h} ${alarm ? 78 : 62}% ${alarm ? 30 : 26}%)"/><stop offset=".5" stop-color="hsl(${h} 55% 11%)"/><stop offset="1" stop-color="#07060b"/></radialGradient>
<linearGradient id="${id}m" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="hsla(${h},95%,84%,.95)"/><stop offset="1" stop-color="hsla(${(h + 340) % 360},80%,46%,.5)"/></linearGradient>
<radialGradient id="${id}h" cx="${f(sx / 3)}%" cy="50%" r="34%"><stop offset="0" stop-color="hsla(${h},100%,74%,.45)"/><stop offset="1" stop-color="hsla(${h},100%,70%,0)"/></radialGradient>
<linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset=".62" stop-color="rgba(13,11,18,0)"/><stop offset="1" stop-color="rgba(13,11,18,1)"/></linearGradient>
${spDefs}
</defs>
<rect width="300" height="130" fill="url(#${id}g)"/>
${rays}${dots}
<circle cx="${sx}" cy="${cy}" r="58" fill="none" stroke="hsla(${h},70%,78%,.16)" stroke-width="1"/>
<rect width="300" height="130" fill="url(#${id}h)"/>
<g transform="translate(${sx} ${cy}) scale(.62) translate(-150 -98)">${motif(a.motif, rng, st, `url(#${id}m)`, dim)}</g>
${sp ? medallion(sp, 62, 78, 34, id) : ''}
<rect width="300" height="130" fill="url(#${id}f)"/>
</svg>`;
}
