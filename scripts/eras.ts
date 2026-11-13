/**
 * Captures des cinq formes d'ère : le présage de chaque ère, la carte de règle (colonie, Conseil), la course.
 *   npx tsx scripts/eras.ts   → shots/eras/*.png
 */
import { chromium, type Page } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';

const OUT = 'shots/eras';

async function reach(page: Page, cond: string, seeds = 30): Promise<boolean> {
  return page.evaluate(([condSrc, n]) => {
    const w = window as any;
    const { app, engine } = w.__citadeck;
    const test = new Function('s', 'e', `return (${condSrc});`) as (s: any, e: any) => boolean;
    for (let seed = 1; seed <= n; seed++) {
      const s = engine.newGame(seed * 3 + 1, { dessein: ['etoiles', 'empire', 'posterite'][seed % 3], origin: 'feu' });
      let g = 0;
      while (!test(s, engine) && s.phase !== 'fin' && g++ < 600) {
        const v = engine.view(s);
        const en = v.options.map((x: any, i: number) => (x.enabled ? i : -1)).filter((i: number) => i >= 0);
        let best = en[0];
        let top = -1e9;
        for (const i of en) {
          const c = JSON.parse(JSON.stringify(s));
          engine.act(c, i);
          const loy = Object.values(c.fam).reduce((a: number, f: any) => a + Math.max(-2, f.loy), 0) as number;
          const sc = (c.result?.type === 'defaite' ? -1000 : 0) + c.quartiers * 12 + c.jalons.filter(Boolean).length * 9 + loy * 2 + (c.res.vivres + c.res.armee + c.res.savoir + c.res.tresor) * 0.25;
          if (sc > top) { top = sc; best = i; }
        }
        engine.act(s, best);
      }
      if (!test(s, engine)) continue;
      app.s = s;
      app.enterGame(false);
      return true;
    }
    return false;
  }, [cond, seeds] as const);
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const srv = await createServer({ server: { port: 5333 }, logLevel: 'warn' });
  await srv.listen();
  const url = srv.resolvedUrls!.local[0];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.addInitScript('window.__name = (f) => f;');
  const shots: [string, string][] = [
    ...[0, 1, 2, 3, 4].map((k) => [`presage-${k + 1}`, `s.phase === 'presage' && s.era === ${k}`] as [string, string]),
    ['carte-colonie', "s.prompt && s.prompt.card === 'colonie'"],
    ['carte-conseil', "s.prompt && s.prompt.card === 'conseil'"],
    ['course', "s.era === 3 && s.phase === 'saison' && s.saison === 2 && s.prompt && s.prompt.card === 'carrefour'"],
    ['jugement', "s.era === 4 && s.phase === 'crise' && s.prompt && (s.prompt.card === 'proces' || s.prompt.card.startsWith('hommage_'))"],
  ];
  for (const [name, cond] of shots) {
    await page.goto(url);
    await page.waitForTimeout(1000);
    const ok = await reach(page, cond);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log(`${name} ${ok ? '' : '(état non atteint)'}`);
  }
  console.log(errors.length ? `Erreurs : ${errors.join(' | ')}` : 'aucune erreur console');
  await browser.close();
  await srv.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
