/**
 * Mesure des images par seconde sur un profil mobile (390×844, dpr 2,5, CPU ralenti ×2) :
 *   npm run perf        → ralentissement ×2 (défaut)
 *   npm run perf -- 4   → ralentissement ×4
 * Chromium tourne ici sans GPU (rendu logiciel) : c'est plus sévère qu'un vrai téléphone.
 * À ×4, même une page sans canvas plafonne vers 48 fps dans cet environnement.
 * Le jeu doit tenir ~60 fps ; sinon la qualité se dégrade toute seule (voir Scene.measure).
 */
import { chromium } from '@playwright/test';
import { preview, build } from 'vite';
import { existsSync } from 'node:fs';

async function main(): Promise<void> {
  if (!existsSync('dist/index.html') || process.argv.includes('--build')) await build({ logLevel: 'warn' });
  const srv = await preview({ preview: { port: 4318 }, logLevel: 'warn' });
  const url = srv.resolvedUrls!.local[0];
  let browser;
  try {
    browser = await chromium.launch({ args: ['--no-sandbox'] });
  } catch {
    browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  }
  const throttle = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 2);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript('window.__name = (f) => f;');
  await page.addInitScript(() => localStorage.setItem('citadeck.settings', JSON.stringify({ tutorialDone: true, sound: false })));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  let worst = 999;
  for (const era of [0, 1, 2, 3, 4]) {
    await page.goto(url);
    await page.waitForFunction(() => (window as any).__citadeck);
    await page.evaluate((era) => {
      const { game, engine } = (window as any).__citadeck;
      const s = engine.newGame(77 + era, false);
      s.era = era;
      s.growth = 20 + era * 22;
      s.deck.push('r_temple', 'r_caserne', 'r_marche', 'r_ecriture', 'r_bardes', 'r_foret', 'r_universite', 'r_banque');
      s.wonders = ['w_phare', 'w_cathedrale', 'w_horloge', 'w_ascenseur'].slice(0, era);
      game.resume(s);
    }, era);
    await page.waitForTimeout(2500);
    // mesure : images réellement produites pendant 4 s, en glissant la carte
    const res = await page.evaluate(async () => {
      const { scene } = (window as any).__citadeck;
      const frames: number[] = [];
      let last = performance.now();
      await new Promise<void>((resolve) => {
        const t0 = last;
        const loop = (now: number) => {
          frames.push(now - last);
          last = now;
          const card = document.querySelector('.card') as HTMLElement | null;
          if (card) card.style.transform = `translate3d(${Math.sin(now / 300) * 60}px,0,0) rotate(${Math.sin(now / 300) * 6}deg)`;
          if (now - t0 < 4000) requestAnimationFrame(loop);
          else resolve();
        };
        requestAnimationFrame(loop);
      });
      frames.sort((a, b) => a - b);
      const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
      return { fps: 1000 / avg, p95: frames[Math.floor(frames.length * 0.95)], tier: scene.getTier() };
    });
    worst = Math.min(worst, res.fps);
    console.log(`ère ${era + 1} : ${res.fps.toFixed(1)} fps en moyenne, 95e centile ${res.p95.toFixed(1)} ms, palier de qualité ${res.tier}`);
  }
  await browser.close();
  await new Promise<void>((r) => srv.httpServer.close(() => r()));
  console.log(`\nCPU ralenti ×${throttle}. Pire moyenne : ${worst.toFixed(1)} fps.`);
  process.exitCode = worst >= 55 ? 0 : 1;
}

void main();
