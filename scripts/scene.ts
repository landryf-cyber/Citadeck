/** Captures de la scène seule (ruines, rivale, merveilles) à trois ères : npx tsx scripts/scene.ts → shots/scene-*.png */
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
async function main() {
  const srv = await createServer({ server: { port: 5337 }, logLevel: 'warn' });
  await srv.listen();
  const url = srv.resolvedUrls!.local[0];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  for (const vp of [{ n: 'mobile', w: 390, h: 844 }, { n: 'desktop', w: 1440, h: 900 }]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await page.addInitScript('window.__name = (f) => f;');
    await page.goto(url);
    await page.waitForTimeout(1200);
    for (const era of [0, 2, 4]) {
      await page.evaluate((era) => {
        const { scene } = (window as any).__citadeck;
        document.querySelectorAll('.screen').forEach((x) => ((x as HTMLElement).style.display = 'none'));
        scene.setSnapshot({ seed: 77, era, growth: 30, quartiers: 5, lost: 2, fam: [{ tag: 'Guerre', loy: 3, gone: false }, { tag: 'Foi', loy: -2, gone: false }, { tag: 'Science', loy: 1, gone: false }, { tag: 'Commerce', loy: 0, gone: true }], jalons: ['grotte', 'theatre', 'cathedrale', 'tour_fer', 'recit'].slice(0, era + 1), rival: { count: era + 1, hue: 268 }, ruins: ['arche', 'forteresse', 'cathedrale'], res: { vivres: 0.6, armee: 0.5, savoir: 0.7, tresor: 0.5 } }, { instant: true });
      }, era);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `shots/scene-${vp.n}-${era}.png` });
    }
  }
  await browser.close();
  await srv.close();
}
void main();
