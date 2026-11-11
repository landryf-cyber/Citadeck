/**
 * Produit le jeu en un seul fichier HTML autonome (JS, CSS et polices intégrés) :
 *   npx tsx scripts/single-file.ts  → dist-single/citadeck.html
 * Utile pour l'héberger là où un seul fichier est accepté.
 */
import { build } from 'vite';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';

async function main(): Promise<void> {
  await build({ base: './', logLevel: 'warn', build: { outDir: 'dist-single/build', emptyOutDir: true, cssCodeSplit: false, modulePreload: false } });
  const dir = 'dist-single/build/assets';
  const files = readdirSync(dir);
  let css = readFileSync(`${dir}/${files.find((f) => f.endsWith('.css'))}`, 'utf8');
  const js = readFileSync(`${dir}/${files.find((f) => f.endsWith('.js'))}`, 'utf8');
  // polices : on ne garde que le woff2, en data URI
  css = css.replace(/url\(([^)]+?\.woff2)\)\s*format\(["']woff2["']\)\s*,\s*url\([^)]+?\.woff\)\s*format\(["']woff["']\)/g, (_m, p: string) => {
    const name = p.replace(/^["']?\.?\/?(assets\/)?/, '').replace(/["']$/, '');
    const b64 = readFileSync(`${dir}/${name}`).toString('base64');
    return `url(data:font/woff2;base64,${b64}) format("woff2")`;
  });
  if (/url\((?!data:)/.test(css)) throw new Error('ressource CSS non intégrée');
  const html = `<title>Citadeck</title>
<meta name="theme-color" content="#05050a">
<style>:root{color-scheme:dark}${css}</style>
<canvas id="scene" aria-hidden="true"></canvas>
<div id="vignette" aria-hidden="true"></div>
<div id="grain" aria-hidden="true"></div>
<div id="app"></div>
<div id="rotate" role="status"><div class="rot-icon"></div><p>Citadeck se joue à la verticale.<br>Tournez votre écran.</p></div>
<script type="module">${js.replace(/<\/script/g, '<\\/script')}</script>
`;
  mkdirSync('dist-single', { recursive: true });
  writeFileSync('dist-single/citadeck.html', html);
  console.log(`dist-single/citadeck.html : ${(html.length / 1024).toFixed(0)} Ko`);
}

void main();
