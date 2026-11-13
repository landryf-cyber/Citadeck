/**
 * Planche des illustrations : avant (symbole) et après (scène), ou toutes les scènes d'un coup.
 *   npx tsx scripts/illus.ts [essai|tout] → shots/illus/*.png
 */
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';

const mode = process.argv[2] ?? 'essai';

async function main(): Promise<void> {
  mkdirSync('shots/illus', { recursive: true });
  const srv = await createServer({ server: { port: 5342 }, logLevel: 'warn' });
  await srv.listen();
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 760 }, deviceScaleFactor: mode === 'essai' ? 2 : 1 });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript('window.__name = (f) => f;');
  await page.goto(srv.resolvedUrls!.local[0]);
  await page.waitForTimeout(800);
  await page.evaluate(async (m) => {
    // chargés par le serveur de développement, dans la page
    const il = await import(/* @vite-ignore */ '/src/ui/illus.ts' as string);
    const art = await import(/* @vite-ignore */ '/src/ui/art.ts' as string);
    const css = '<style>body{background:#0b0910;color:#eee;font:13px sans-serif;margin:16px} .row{display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap} .c{width:460px} .c div{width:460px;height:200px;border-radius:12px;overflow:hidden} .t .c{width:300px} .t .c div{width:300px;height:130px} svg{width:100%;height:100%} p{margin:4px 0}</style>';
    if (m === 'essai') {
      const specs = [
        { key: 'ourk_1', era: 0, hue: 8, scene: 'portrait', fam: 'ourk', mood: 1, motif: 'fang', title: 'Personnage : Ourkos (ère I)' },
        { key: 'or_crue', era: 0, hue: 195, scene: 'crue', motif: 'wave', title: 'Événement : La Crue' },
        { key: 'ruines', era: 1, hue: 270, scene: 'ruines', motif: 'skull', title: 'Lieu : Les Ruines' },
      ];
      document.body.innerHTML = css + specs.map((s) => `<div class="row"><div class="c"><p>Avant · ${s.title}</p><div>${art.cardArt({ key: s.key, motif: s.motif, hue: s.hue, era: s.era, speaker: s.fam ? { motif: s.motif, hue: s.hue, mood: 1, era: s.era, scars: 0, fam: s.fam } : undefined } as never)}</div></div><div class="c"><p>Après · ${s.title}</p><div>${il.illustration(s as never)}</div></div></div>`).join('');
    } else {
      const list = (il as unknown as { SAMPLES: { title: string; spec: unknown }[] }).SAMPLES;
      document.body.innerHTML = css + `<div class="row t">${list.map((x) => `<div class="c"><p>${x.title}</p><div>${il.illustration(x.spec as never)}</div></div>`).join('')}</div>`;
    }
  }, mode);
  // la feuille de style du jeu fige la page : on agrandit la fenêtre à la hauteur de la planche
  const height = await page.evaluate(() => { document.documentElement.style.overflow = 'visible'; document.body.style.overflow = 'visible'; document.body.style.height = 'auto'; return document.body.scrollHeight + 40; });
  await page.setViewportSize({ width: 1000, height });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `shots/illus/${mode}.png`, fullPage: true });
  console.log(`shots/illus/${mode}.png${errors.length ? ` — erreurs : ${errors.join(' | ')}` : ''}`);
  await browser.close();
  await srv.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
