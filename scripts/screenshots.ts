/**
 * Captures de chaque écran, en mobile et en desktop.
 *
 *   npm run shots                 → toutes les captures (serveur de dev)
 *   npm run shots -- --dist       → sur le build de production (dist/)
 *   npm run shots -- era2 reward  → seulement les captures dont le nom contient ces mots
 *   npm run shots -- --hd         → deviceScaleFactor 2
 *
 * Chromium : celui de Playwright s'il est installé, sinon un binaire déjà présent
 * (PW_CHROMIUM, /opt/pw-browsers/chromium, chromium du système).
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { createServer, preview, build } from 'vite';
import { existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const useDist = args.includes('--dist');
const hd = args.includes('--hd');
const filters = args.filter((a) => !a.startsWith('--'));
const OUT = 'shots';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  ...(process.argv.includes('--extra')
    ? [
        { name: 'paysage', width: 844, height: 390, mobile: true },
        { name: 'petit', width: 360, height: 640, mobile: true },
        { name: 'tablette', width: 820, height: 1180, mobile: true },
      ]
    : []),
];

async function launch(): Promise<Browser> {
  const candidates = [process.env.PW_CHROMIUM, undefined, '/opt/pw-browsers/chromium'];
  for (const cmd of ['chromium', 'chromium-browser', 'google-chrome']) {
    try {
      candidates.push(execSync(`command -v ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim());
    } catch {
      /* absent */
    }
  }
  let lastErr: unknown;
  for (const executablePath of candidates) {
    if (executablePath && !existsSync(executablePath)) continue;
    try {
      return await chromium.launch({ executablePath, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/** Avance une partie jusqu'à l'état voulu, avec un joueur prudent, puis la reprend dans l'interface. */
async function jump(page: Page, target: { era: number; phase: string; minTurn?: number; god?: boolean; seed?: number }): Promise<void> {
  const ok = await page.evaluate((t) => {
    const { game, engine } = (window as any).__citadeck;
    const G = ['food', 'army', 'knowledge', 'treasure'];
    for (let seed = t.seed ?? 1; seed < (t.seed ?? 1) + 400; seed++) {
      const s = engine.newGame(seed, false);
      const pick = () => {
        let best = 'left';
        let bestScore = Infinity;
        for (const side of ['left', 'right']) {
          const d = engine.preview(s, side);
          let sc = 0;
          for (const g of G) {
            const v = s.gauges[g] + (d[g] || 0);
            sc += Math.pow(Math.abs(v - 50), 2);
            if (v <= 0 || v >= 100) sc += 1e6;
          }
          if (sc < bestScore) {
            bestScore = sc;
            best = side;
          }
        }
        return best;
      };
      let guard = 0;
      let reached = false;
      while (guard++ < 800 && s.phase !== 'end') {
        if (s.era === t.era && s.phase === t.phase && s.eraTurn >= (t.minTurn ?? 0)) {
          reached = true;
          break;
        }
        if (s.phase === 'reward') {
          engine.pickReward(s, s.reward.cards[seed % 3] ?? null);
          engine.nextEra(s);
          continue;
        }
        engine.choose(s, pick());
        if (t.god && s.phase !== 'end') for (const g of G) s.gauges[g] = Math.max(34, Math.min(66, s.gauges[g]));
      }
      if (reached) {
        game.resume(s);
        return true;
      }
    }
    return false;
  }, target);
  if (!ok) throw new Error(`état inatteignable : ${JSON.stringify(target)}`);
}

async function settle(page: Page, ms = 2200): Promise<void> {
  await page.waitForTimeout(ms);
}

type Shot = { name: string; run: (page: Page, mobile: boolean) => Promise<void> };

const SHOTS: Shot[] = [
  { name: '01-title', run: async (p) => settle(p, 2600) },
  ...[0, 1, 2, 3, 4].map((era) => ({
    name: `1${era}-era${era}`,
    run: async (p: Page) => {
      await jump(p, { era, phase: 'card', minTurn: 8, god: true, seed: 3 + era * 11 });
      await settle(p, 2600);
    },
  })),
  {
    name: '20-drag',
    run: async (p, mobile) => {
      await jump(p, { era: 1, phase: 'card', minTurn: 3, god: true, seed: 5 });
      await settle(p, 1800);
      const box = await p.locator('.card').boundingBox();
      if (!box) return;
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      if (mobile) {
        await p.evaluate(([x, y]) => {
          const zone = document.querySelector('.card-zone')!;
          const o = { bubbles: true, pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, isPrimary: true };
          zone.dispatchEvent(new PointerEvent('pointerdown', o));
          window.dispatchEvent(new PointerEvent('pointermove', { ...o, clientX: x + 78, clientY: y + 6 }));
        }, [cx, cy]);
      } else {
        await p.mouse.move(cx, cy);
        await p.mouse.down();
        await p.mouse.move(cx + 96, cy + 8, { steps: 6 });
      }
      await p.waitForTimeout(350);
    },
  },
  {
    name: '21-danger',
    run: async (p) => {
      await jump(p, { era: 2, phase: 'card', minTurn: 5, god: true, seed: 9 });
      await p.evaluate(() => {
        const { game } = (window as any).__citadeck;
        game.state.gauges.food = 9;
        game.state.gauges.knowledge = 12;
        game.state.gauges.army = 88;
        game.resume(game.state);
      });
      await settle(p, 2200);
    },
  },
  {
    name: '22-crisis',
    run: async (p) => {
      await jump(p, { era: 0, phase: 'crisis', god: true, seed: 2 });
      await settle(p, 2400);
    },
  },
  {
    name: '23-crisis-banner',
    run: async (p) => {
      await jump(p, { era: 2, phase: 'card', minTurn: 5, god: true, seed: 4 });
      await p.evaluate(() => {
        const { game } = (window as any).__citadeck;
        game.state.drawPile = [];
        game.state.scheduled = [];
        game.resume(game.state);
      });
      await settle(p, 1200);
      await p.keyboard.press('ArrowLeft');
      await p.keyboard.press('ArrowLeft');
      await p.waitForTimeout(1050);
    },
  },
  {
    name: '30-reward',
    run: async (p) => {
      await jump(p, { era: 1, phase: 'reward', god: true, seed: 6 });
      await settle(p, 1800);
      await p.locator('.tile').nth(1).click();
      await p.waitForTimeout(500);
    },
  },
  {
    name: '31-wonder',
    run: async (p) => {
      await jump(p, { era: 0, phase: 'reward', god: true, seed: 6 });
      await settle(p, 1600);
      await p.locator('.tile').first().click();
      await p.locator('[data-a=ok]').click();
      await p.waitForTimeout(1900);
    },
  },
  {
    name: '32-remove',
    run: async (p) => {
      await jump(p, { era: 0, phase: 'reward', god: true, seed: 6 });
      await settle(p, 1600);
      await p.locator('.tile').first().click();
      await p.locator('[data-a=ok]').click();
      await p.waitForTimeout(900);
      await p.locator('[data-a=ok]').click();
      await p.waitForTimeout(1200);
      await p.locator('.chip').nth(2).click();
      await p.waitForTimeout(400);
    },
  },
  {
    name: '33-era-transition',
    run: async (p) => {
      await jump(p, { era: 1, phase: 'reward', god: true, seed: 6 });
      await settle(p, 1400);
      await p.locator('.tile').first().click();
      await p.locator('[data-a=ok]').click();
      await p.waitForTimeout(700);
      if (await p.locator('.wonder-emblem').count()) {
        await p.locator('[data-a=ok]').click();
        await p.waitForTimeout(700);
      }
      await p.locator('[data-a=keep]').click();
      await p.waitForTimeout(1500);
    },
  },
  {
    name: '40-defeat',
    run: async (p) => {
      await jump(p, { era: 2, phase: 'card', minTurn: 6, god: true, seed: 8 });
      await p.evaluate(() => {
        const { game, engine } = (window as any).__citadeck;
        const s = game.state;
        const d = engine.preview(s, 'left');
        const g = Object.keys(d).find((k) => d[k] < 0) ?? 'food';
        s.gauges[g] = 4;
        (window as any).__fatal = g;
        game.resume(s);
      });
      await settle(p, 900);
      await p.keyboard.press('ArrowLeft');
      await p.keyboard.press('ArrowLeft');
      await p.waitForTimeout(3000);
    },
  },
  {
    name: '41-defeat-timelapse',
    run: async (p) => {
      await jump(p, { era: 3, phase: 'card', minTurn: 6, god: true, seed: 8 });
      await p.evaluate(() => {
        const { game, engine } = (window as any).__citadeck;
        const s = game.state;
        const d = engine.preview(s, 'right');
        const g = Object.keys(d).find((k) => d[k] > 0) ?? 'food';
        s.gauges[g] = 97;
        game.resume(s);
      });
      await settle(p, 900);
      await p.keyboard.press('ArrowRight');
      await p.keyboard.press('ArrowRight');
      await p.waitForTimeout(9500);
    },
  },
  {
    name: '42-victory',
    run: async (p) => {
      await jump(p, { era: 4, phase: 'crisis', god: true, seed: 12 });
      await p.evaluate(() => {
        const { game } = (window as any).__citadeck;
        const s = game.state;
        s.crisis.index = s.crisis.cards.length - 1;
        s.current = s.crisis.cards[s.crisis.index];
        for (const g of ['food', 'army', 'knowledge', 'treasure']) s.gauges[g] = 55;
        game.resume(s);
      });
      await settle(p, 900);
      await p.keyboard.press('ArrowLeft');
      await p.keyboard.press('ArrowLeft');
      await p.waitForTimeout(4200);
    },
  },
  {
    name: '50-settings',
    run: async (p) => {
      await jump(p, { era: 1, phase: 'card', minTurn: 2, god: true, seed: 5 });
      await settle(p, 1200);
      await p.locator('[aria-label="Réglages"]').click();
      await p.waitForTimeout(800);
    },
  },
  {
    name: '51-deck',
    run: async (p) => {
      await jump(p, { era: 3, phase: 'card', minTurn: 2, god: true, seed: 5 });
      await settle(p, 1200);
      await p.locator('[aria-label="Voir le deck"]').click();
      await p.waitForTimeout(800);
      await p.locator('.chip[data-id]').nth(1).click();
      await p.waitForTimeout(300);
    },
  },
  ...(['a', 'b'] as const).map((v) => ({
    // deux parties aux choix opposés, même graine : deux silhouettes
    name: `70-contraste-${v}`,
    run: async (p: Page) => {
      await p.evaluate((v) => {
        const { game, engine } = (window as any).__citadeck;
        const s = engine.newGame(4242, false);
        s.era = 3;
        s.growth = 70;
        if (v === 'a') {
          s.deck.push('r_caserne', 'r_phalange', 'r_chevaliers', 'r_artillerie', 'r_temple', 'r_inquisition');
          s.wonders = ['w_muraille', 'w_colisee', 'w_cathedrale'];
          s.gauges = { food: 32, army: 86, knowledge: 22, treasure: 38 };
        } else {
          s.deck.push('r_ecriture', 'r_bibliotheque', 'r_universite', 'r_marche', 'r_guilde', 'r_foret', 'r_vergers');
          s.wonders = ['w_phare', 'w_bibliotheque', 'w_jardins', 'w_horloge'];
          s.gauges = { food: 78, army: 24, knowledge: 84, treasure: 72 };
        }
        game.resume(s);
      }, v);
      await settle(p, 2600);
    },
  })),
  {
    name: '60-tutorial',
    run: async (p) => {
      await p.evaluate(() => localStorage.setItem('citadeck.settings', JSON.stringify({ tutorialDone: false, sound: false })));
      await p.reload();
      await p.waitForFunction(() => (window as any).__citadeck);
      await p.waitForTimeout(1200);
      await p.locator('[data-a=new]').click();
      await p.waitForTimeout(3300);
    },
  },
];

async function main(): Promise<void> {
  let url: string;
  let close: () => Promise<void>;
  if (useDist) {
    if (!existsSync('dist/index.html')) await build({ logLevel: 'warn' });
    const srv = await preview({ preview: { port: 4317, strictPort: false }, logLevel: 'warn' });
    url = srv.resolvedUrls!.local[0];
    close = () => new Promise((r) => srv.httpServer.close(() => r()));
  } else {
    const srv = await createServer({ server: { port: 5317 }, logLevel: 'warn' });
    await srv.listen();
    url = srv.resolvedUrls!.local[0];
    close = () => srv.close();
  }
  const browser = await launch();
  const errors: string[] = [];
  for (const vp of VIEWPORTS) {
    mkdirSync(`${OUT}/${vp.name}`, { recursive: true });
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: hd ? 2 : 1,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    });
    for (const shot of SHOTS) {
      if (filters.length && !filters.some((f) => shot.name.includes(f))) continue;
      const page = await ctx.newPage();
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(`[${vp.name}/${shot.name}] ${m.text()}`);
      });
      page.on('pageerror', (e) => errors.push(`[${vp.name}/${shot.name}] ${e.message}`));
      // tsx (esbuild) enveloppe les fonctions nommées avec __name : on le définit côté page
      await page.addInitScript('window.__name = (f) => f;');
      await page.addInitScript(() => {
        try {
          if (!localStorage.getItem('citadeck.settings')) localStorage.setItem('citadeck.settings', JSON.stringify({ tutorialDone: true, sound: false }));
        } catch {
          /* ignore */
        }
      });
      await page.goto(url);
      await page.waitForFunction(() => (window as any).__citadeck);
      try {
        await shot.run(page, vp.mobile);
        await page.screenshot({ path: `${OUT}/${vp.name}/${shot.name}.png` });
        console.log(`✓ ${vp.name}/${shot.name}`);
      } catch (e) {
        errors.push(`[${vp.name}/${shot.name}] ${(e as Error).message}`);
        console.log(`✗ ${vp.name}/${shot.name}: ${(e as Error).message.split('\n')[0]}`);
      }
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  await close();
  if (errors.length) {
    console.log('\nErreurs :\n' + errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('\nAucune erreur console.');
  }
}

void main();
