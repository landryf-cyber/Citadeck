/**
 * Joue des parties complètes dans le navigateur, par l'interface (clavier et clics),
 * et consigne chaque tour. Sert de test de bout en bout et de journal de partie.
 *
 *   npx tsx scripts/playthrough.ts              → build de production, 6 graines
 *   npx tsx scripts/playthrough.ts --url URL    → contre un site déjà déployé
 *   npx tsx scripts/playthrough.ts --seeds 3,9  → graines choisies
 *   npx tsx scripts/playthrough.ts --log        → journal tour par tour
 *   npx tsx scripts/playthrough.ts --until-all  → continue jusqu'à voir les 3 fins
 */
import { chromium, type Page } from '@playwright/test';
import { preview, build } from 'vite';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const arg = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const showLog = args.includes('--log');
const untilAll = args.includes('--until-all');
const seeds = (arg('--seeds') ?? '3,9,14,21,33,47').split(',').map(Number);
const mobile = !args.includes('--desktop');

async function playOne(page: Page, url: string, seed: number, log: string[]): Promise<{ result: string; turns: number; era: number }> {
  await page.goto(url);
  await page.waitForFunction(() => (window as any).__citadeck);
  await page.evaluate((seed) => (window as any).__citadeck.game.newGame(seed), seed);
  let guard = 0;
  for (;;) {
    if (guard++ > 400) throw new Error('partie trop longue');
    // attendre qu'une décision soit possible : carte active, écran de récompense, ou fin
    const st = await page.waitForFunction(
      () => {
        const { game } = (window as any).__citadeck;
        const s = game.state;
        if (!s) return null;
        if (s.phase === 'end' && document.querySelector('.end-cause')) return { kind: 'end' };
        if (document.querySelector('.screen.show .tile')) return { kind: 'reward' };
        if (document.querySelector('.screen.show .wonder-emblem')) return { kind: 'wonder' };
        if (document.querySelector('.screen.show [data-a=keep]')) return { kind: 'remove' };
        if (game.cardView.enabled && document.querySelector('.card:not(.fly)')) return { kind: 'card' };
        return null;
      },
      undefined,
      { timeout: 20000, polling: 60 },
    );
    const kind = ((await st.jsonValue()) as { kind: string }).kind;
    if (kind === 'end') break;
    if (kind === 'reward') {
      const titles = await page.locator('.tile .tile-title').allTextContents();
      const i = seed % titles.length;
      await page.locator('.tile').nth(i).click();
      await page.locator('[data-a=ok]').click();
      log.push(`   ◆ récompense : ${titles.join(' | ')} → ${titles[i]}`);
      await page.waitForTimeout(500);
      continue;
    }
    if (kind === 'wonder') {
      log.push(`   ◆ merveille : ${await page.locator('.screen.show .h-big').textContent()}`);
      await page.locator('.screen.show [data-a=ok]').click();
      await page.waitForTimeout(500);
      continue;
    }
    if (kind === 'remove') {
      await page.locator('[data-a=keep]').click();
      await page.waitForTimeout(500);
      continue;
    }
    // une carte : décider comme un joueur prudent qui regarde l'aperçu
    const info = await page.evaluate(() => {
      const { game, engine } = (window as any).__citadeck;
      const s = game.state;
      const card = engine.card(s.current);
      const G = ['food', 'army', 'knowledge', 'treasure'];
      const score = (side: string) => {
        const d = engine.preview(s, side);
        let sc = 0;
        for (const g of G) {
          const v = s.gauges[g] + (d[g] || 0);
          sc += (v - 52) * (v - 52);
          if (v <= 12 || v >= 88) sc += 900;
          if (v <= 0 || v >= 100) sc += 1e6;
        }
        return sc;
      };
      const l = score('left');
      const r = score('right');
      const pv = (side: string) => {
        const d = engine.preview(s, side);
        return G.filter((g) => d[g]).map((g) => `${g[0].toUpperCase()}${d[g] > 0 ? '+' : ''}${d[g]}`).join(' ');
      };
      return {
        side: l <= r ? 'left' : 'right',
        margin: Math.abs(l - r),
        title: card.title, text: card.text, left: card.left.text, right: card.right.text,
        pl: pv('left'), pr: pv('right'),
        gauges: G.map((g) => s.gauges[g]).join('/'), era: s.era, turn: s.turn, phase: s.phase,
        shown: document.querySelector('.card:not(.fly) .card-title')?.textContent,
      };
    });
    
    log.push(`${String(info.turn + 1).padStart(3)} [ère ${info.era + 1}${info.phase === 'crisis' ? ' CRISE' : ''}] ${info.gauges}  ${info.title} — ${info.text}\n       ‹ ${info.left} (${info.pl})   |   ${info.right} (${info.pr}) ›   → ${info.side === 'left' ? 'gauche' : 'droite'}${info.margin < 60 ? '  (hésitation)' : info.margin > 2500 ? '  (évident)' : ''}`);
    const key = info.side === 'left' ? 'ArrowLeft' : 'ArrowRight';
    // alterne clavier et glisser pour exercer les deux
    if (info.turn % 3 === 2) {
      const box = await page.locator('.card:not(.fly)').boundingBox();
      if (box) {
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height * 0.4;
        const dir = info.side === 'left' ? -1 : 1;
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await page.mouse.move(cx + dir * 60, cy + 4, { steps: 3 });
        await page.mouse.move(cx + dir * 170, cy + 8, { steps: 3 });
        await page.mouse.up();
      }
    } else {
      await page.keyboard.press(key);
      await page.waitForTimeout(40);
      await page.keyboard.press(key);
    }
    await page.waitForFunction((t) => (window as any).__citadeck.game.state.turn > t, info.turn, { timeout: 5000 });
  }
  const end = await page.evaluate(() => {
    const s = (window as any).__citadeck.game.state;
    return { result: s.result.type === 'victory' ? `victoire ${s.result.ending}` : `défaite ${s.result.gauge} ${s.result.bound}`, turns: s.turn, era: s.era };
  });
  log.push(`   ■ ${end.result} — ère ${end.era + 1}, ${end.turns} décisions : « ${await page.locator('.end-cause').textContent()} »`);
  return end;
}

async function main(): Promise<void> {
  let url = arg('--url');
  let close: () => Promise<void> = async () => undefined;
  if (!url) {
    if (!existsSync('dist/index.html') || args.includes('--build')) await build({ logLevel: 'warn' });
    const srv = await preview({ preview: { port: 4321 }, logLevel: 'warn' });
    url = srv.resolvedUrls!.local[0];
    close = () => new Promise((r) => srv.httpServer.close(() => r()));
  }
  let browser;
  try {
    browser = await chromium.launch({ args: ['--no-sandbox'] });
  } catch {
    browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  }
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: false } : { viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript('window.__name = (f) => f;');
  await page.addInitScript(() => {
    if (!localStorage.getItem('citadeck.settings')) localStorage.setItem('citadeck.settings', JSON.stringify({ tutorialDone: true, sound: false, reducedMotion: true }));
  });
  mkdirSync('shots/play', { recursive: true });
  const seen = new Set<string>();
  const queue = seeds.slice();
  let extra = 100;
  let n = 0;
  while (queue.length) {
    const seed = queue.shift()!;
    const log: string[] = [];
    try {
      const end = await playOne(page, url, seed, log);
      seen.add(end.result.split(' ').slice(0, 2).join(' '));
      await page.waitForTimeout(600);
      await page.screenshot({ path: `shots/play/fin-${seed}.png` });
      console.log(`graine ${seed} : ${end.result}, ère ${end.era + 1}, ${end.turns} décisions`);
    } catch (e) {
      errors.push(`graine ${seed} : ${(e as Error).message.split('\n')[0]}`);
      await page.screenshot({ path: `shots/play/erreur-${seed}.png` });
      console.log(`graine ${seed} : ERREUR ${(e as Error).message.split('\n')[0]}`);
    }
    if (showLog) console.log(log.join('\n') + '\n');
    writeFileSync(`shots/play/journal-${seed}.txt`, log.join('\n'));
    n++;
    const endings = ['victoire science', 'victoire military', 'victoire culture'].filter((e) => seen.has(e));
    if (untilAll && queue.length === 0 && endings.length < 3 && n < 60) queue.push(extra++);
  }
  await browser.close();
  await close();
  console.log(`\nFins vues : ${[...seen].sort().join(', ')}`);
  if (errors.length) {
    console.log('Erreurs :\n' + errors.join('\n'));
    process.exitCode = 1;
  } else console.log('Aucune erreur console.');
}

void main();
