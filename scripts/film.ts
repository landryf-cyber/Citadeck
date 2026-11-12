/**
 * Planches-contact des animations (choix d'une carte, changement d'ère, crise, chute et rejeu) :
 *   npx tsx scripts/film.ts [mobile|desktop] → shots/film-*.png
 * Chaque planche aligne des images prises à intervalles réguliers pendant la transition.
 */
import { chromium, type Page } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';

const vpName = process.argv[2] === 'desktop' ? 'desktop' : 'mobile';
const VP = vpName === 'desktop' ? { width: 1440, height: 900 } : { width: 390, height: 844 };

async function frames(page: Page, n: number, every: number, start?: () => Promise<void>): Promise<string[]> {
  const out: string[] = [];
  const p = start?.();
  for (let i = 0; i < n; i++) {
    out.push((await page.screenshot({ type: 'jpeg', quality: 70 })).toString('base64'));
    await page.waitForTimeout(every);
  }
  await p;
  return out;
}

async function sheet(page: Page, imgs: string[], cols: number, name: string, labels: string[]): Promise<void> {
  const html = `<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px;padding:4px;font:12px sans-serif;color:#ccc">${imgs.map((b, i) => `<figure style="margin:0"><img style="width:100%;display:block" src="data:image/jpeg;base64,${b}"><figcaption>${labels[i] ?? i}</figcaption></figure>`).join('')}</body>`;
  const p2 = await page.context().browser()!.newPage();
  await p2.setViewportSize({ width: cols * (vpName === 'desktop' ? 480 : 260), height: 400 });
  await p2.setContent(html);
  await p2.waitForTimeout(300);
  await p2.screenshot({ path: `shots/film-${vpName}-${name}.png`, fullPage: true });
  await p2.close();
  console.log(`shots/film-${vpName}-${name}.png`);
}

async function jumpTo(page: Page, cond: string, seed: number): Promise<void> {
  await page.evaluate(([c, sd]) => {
    const { app, engine } = (window as any).__citadeck;
    const test = new Function('s', `return (${c});`) as (s: any) => boolean;
    const s = engine.newGame(sd, { dessein: 'posterite' });
    let g = 0;
    while (!test(s) && s.phase !== 'fin' && g++ < 500) {
      const v = engine.view(s);
      let best = 0;
      let top = -1e9;
      v.options.forEach((o: any, i: number) => {
        if (!o.enabled) return;
        const cl = JSON.parse(JSON.stringify(s));
        engine.act(cl, i);
        const sc = (cl.phase === 'fin' && cl.result?.type === 'defaite' ? -999 : 0) + cl.quartiers * 10 + cl.jalons.filter(Boolean).length * 8 + Object.values(cl.res).reduce((a: number, b: any) => a + b, 0) * 0.2;
        if (sc > top) { top = sc; best = i; }
      });
      engine.act(s, best);
    }
    app.s = s;
    app.enterGame(false);
  }, [cond, seed] as const);
  await page.waitForTimeout(1600);
}

async function main(): Promise<void> {
  mkdirSync('shots', { recursive: true });
  const srv = await createServer({ server: { port: 5347 }, logLevel: 'warn' });
  await srv.listen();
  const url = srv.resolvedUrls!.local[0];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: VP });
  const page = await ctx.newPage();
  await page.addInitScript('window.__name = (f) => f;');
  await page.addInitScript(() => localStorage.setItem('citadeck.v2.settings', JSON.stringify({ sound: false, hints: ['debut', 'cout', 'carrefour', 'famille', 'crise', 'bilan', 'proces', 'jalon', 'sablier'] })));
  await page.goto(url);
  await page.waitForTimeout(1500);

  // 1. choisir une carte
  await jumpTo(page, "s.era === 1 && s.phase === 'saison' && s.pile.length > 1", 9);
  const a = await frames(page, 9, 110, async () => {
    await page.waitForTimeout(30);
    await page.click('.opt:not([disabled]) >> nth=0');
  });
  await sheet(page, a, vpName === 'desktop' ? 3 : 5, 'choix', a.map((_, i) => `${i * 110} ms`));

  // 2. la crise
  await jumpTo(page, "s.era === 1 && s.phase === 'chantier'", 9);
  const b = await frames(page, 10, 280, async () => {
    await page.waitForTimeout(30);
    await page.click('.opt:not([disabled]) >> nth=0');
  });
  await sheet(page, b, vpName === 'desktop' ? 3 : 5, 'crise', b.map((_, i) => `${i * 280} ms`));

  // 3. changement d'ère (fin des étapes de l'ère II)
  await jumpTo(page, "s.era === 1 && s.phase === 'finere' && s.steps.length === 0", 9);
  const c = await frames(page, 12, 330, async () => {
    await page.waitForTimeout(30);
    await page.click('.opt:not([disabled]) >> nth=0');
  });
  await sheet(page, c, vpName === 'desktop' ? 4 : 6, 'ere', c.map((_, i) => `${i * 330} ms`));

  // 4. la fin et le rejeu
  await jumpTo(page, "s.era === 4 && s.phase === 'crise' && s.pile.length === 0", 9);
  const d = await frames(page, 14, 700, async () => {
    await page.waitForTimeout(30);
    await page.click('.opt:not([disabled]) >> nth=0');
    await page.waitForTimeout(500);
    const cont = page.locator('text=Continuer');
    if (await cont.count()) await cont.first().click();
  });
  await sheet(page, d, vpName === 'desktop' ? 4 : 7, 'fin', d.map((_, i) => `${(i * 0.7).toFixed(1)} s`));

  await browser.close();
  await srv.close();
}

void main();
