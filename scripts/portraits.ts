/** Planche des portraits : 5 maisons × 5 ères × 3 humeurs, plus la taille réelle du bandeau. */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { medallion } from '../src/ui/art';
import type { PortraitFam } from '../src/ui/portrait';

const out = process.argv[2] ?? 'shots/portraits.png';
const BIG = Number(process.argv[3] ?? 96);
const SMALL = Math.round(BIG * 2 / 3);
const fams: [PortraitFam, number][] = [['ourk', 8], ['sel', 44], ['brume', 205], ['troc', 150], ['rival', 268]];
let html = '<html><body style="margin:0;background:#0d0b12;color:#ddd;font:12px sans-serif;padding:12px">';
let n = 0;
for (const [fam, hue] of fams) {
  html += '<div style="display:flex;gap:6px;margin-bottom:6px;align-items:center">';
  for (let era = 0; era < 5; era++) for (const mood of [-3, 0, 3]) {
    const id = `p${n++}`;
    html += `<svg viewBox="0 0 100 100" width="${mood === 0 ? BIG : SMALL}" height="${mood === 0 ? BIG : SMALL}"><defs><radialGradient id="${id}p" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="hsl(${hue} 55% 32%)"/><stop offset="1" stop-color="hsl(${hue} 45% 9%)"/></radialGradient></defs>${medallion({ motif: 'eye', hue, mood, era, scars: mood < 0 ? 2 : 0, fam }, 50, 52, 38, id)}</svg>`;
  }
  html += '</div>';
}
html += '<div style="display:flex;gap:10px">';
for (const [fam, hue] of fams) for (let era = 0; era < 5; era += 2) {
  const id = `q${n++}`;
  html += `<svg viewBox="0 0 100 100" width="34" height="34"><defs><radialGradient id="${id}p" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="hsl(${hue} 55% 32%)"/><stop offset="1" stop-color="hsl(${hue} 45% 9%)"/></radialGradient></defs>${medallion({ motif: 'eye', hue, mood: 1, era, scars: 0, fam }, 50, 52, 38, id)}</svg>`;
}
html += '</div></body></html>';
const tmp = out.replace(/\.png$/, '.html');
writeFileSync(tmp, html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: Math.round(1500 * BIG / 96), height: 640 } });
await p.goto('file://' + (tmp.startsWith('/') ? tmp : process.cwd() + '/' + tmp));
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log(out);
