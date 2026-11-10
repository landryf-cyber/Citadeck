/**
 * Pellicules d'animation : capture des séquences image par image pour juger les transitions.
 *   npx tsx scripts/filmstrip.ts   → shots/film/<séquence>-<n>.png
 */
import { chromium, type Page } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';

async function frames(page: Page, name: string, count: number, everyMs: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await page.screenshot({ path: `shots/film/${name}-${String(i).padStart(2, '0')}.png` });
    await page.waitForTimeout(everyMs);
  }
}

async function main(): Promise<void> {
  const srv = await createServer({ server: { port: 5318 }, logLevel: 'warn' });
  await srv.listen();
  const url = srv.resolvedUrls!.local[0];
  let browser;
  try {
    browser = await chromium.launch({ args: ['--no-sandbox'] });
  } catch {
    browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  }
  mkdirSync('shots/film', { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await ctx.newPage();
  await page.addInitScript('window.__name = (f) => f;');
  await page.addInitScript(() => localStorage.setItem('citadeck.settings', JSON.stringify({ tutorialDone: true, sound: false })));
  const fresh = async (setup: string) => {
    await page.goto(url);
    await page.waitForFunction(() => (window as any).__citadeck);
    await page.evaluate(setup);
    await page.waitForTimeout(1800);
  };
  const state = (era: number, extra = '') => `(() => { const { game, engine } = window.__citadeck; const s = engine.newGame(${40 + era}, false); s.era = ${era}; s.growth = ${10 + era * 20}; s.deck.push('r_temple','r_caserne','r_marche','r_ecriture'); ${extra} game.resume(s); })()`;

  // 1. swipe : la carte part, la suivante arrive, les jauges réagissent
  await fresh(state(1));
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(250);
  await page.keyboard.press('ArrowRight');
  await frames(page, 'swipe', 8, 70);

  // 2. transition d'ère
  await fresh(state(1, "s.phase='reward'; s.current=null; s.reward={cards:['r_theatre','r_monnaie','r_phalange'], wonder: undefined};"));
  await page.locator('.tile').first().click();
  await page.locator('[data-a=ok]').click();
  await page.waitForTimeout(900);
  await page.locator('[data-a=keep]').click();
  await frames(page, 'ere', 9, 420);

  // 3. défaite : les lumières s'éteignent
  await fresh(state(2, 's.gauges.food = 2; s.gauges.army = 2; s.gauges.treasure = 2; s.gauges.knowledge = 2;'));
  await page.evaluate(() => {
    const { game, engine } = (window as any).__citadeck;
    const s = game.state;
    const side = (engine.preview(s, 'left').food ?? 0) < 0 ? 'left' : 'right';
    (window as any).__side = side;
  });
  const side = await page.evaluate(() => (window as any).__side);
  const key = side === 'left' ? 'ArrowLeft' : 'ArrowRight';
  await page.keyboard.press(key);
  await page.keyboard.press(key);
  await frames(page, 'defaite', 8, 550);

  // 4. crise : bannière et lumière
  await fresh(state(0, 's.drawPile = []; s.scheduled = [];'));
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await frames(page, 'crise', 7, 380);

  await browser.close();
  await srv.close();
}

void main();
