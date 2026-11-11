/**
 * Images par seconde de la V2, profil mobile (390×844, dpr 2,5, CPU ralenti), tous effets, en crise.
 *   npx tsx scripts/v2perf.ts [ralentissement=2] [--build]
 * Chromium tourne ici sans GPU : c'est plus sévère qu'un vrai téléphone.
 * Cible : 30 i/s au palier 2 (tous les effets). La qualité ne se dégrade que sous 30 i/s.
 */
import { chromium } from '@playwright/test';
import { preview, build } from 'vite';
import { existsSync } from 'node:fs';

async function main(): Promise<void> {
  if (!existsSync('dist/index.html') || process.argv.includes('--build')) await build({ logLevel: 'warn' });
  const srv = await preview({ preview: { port: 4328, strictPort: false }, logLevel: 'warn' });
  const url = srv.resolvedUrls!.local[0];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const throttle = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 2);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript('window.__name = (f) => f;');
  await page.addInitScript(() => localStorage.setItem('citadeck.v2.settings', JSON.stringify({ sound: false, hints: ['debut', 'cout', 'carrefour', 'famille'] })));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  let worst = 999;
  for (const era of [0, 1, 2, 3, 4]) {
    await page.goto(url);
    await page.waitForFunction(() => (window as any).__citadeck);
    await page.evaluate((era) => {
      const { app, engine } = (window as any).__citadeck;
      const ruins = [{ name: 'Vorie', dessein: 'empire', era: 3, jalons: 3, cause: 'la famine', epitaph: 'x', shape: 'forteresse' }, { name: 'Sarane', dessein: 'etoiles', era: 4, jalons: 5, cause: 'le départ', epitaph: 'x', shape: 'arche' }];
      const s = engine.newGame(77 + era, { dessein: ['etoiles', 'empire', 'posterite'][era % 3], ruins });
      for (let i = 0; i < 400 && !(s.era === era && s.phase === 'saison'); i++) {
        const v = engine.view(s);
        const ok = v.options.findIndex((o: any) => o.enabled);
        engine.act(s, ok < 0 ? 0 : ok);
        if (s.phase === 'fin') break;
      }
      s.quartiers = 6 + era;
      s.jalons = [0, 1, 2, 3, 4].map((i) => i <= era);
      s.rivalJalons = era + 1;
      s.fam.ourk.loy = 3; s.fam.sel.loy = -2; s.fam.brume.loy = 2; s.fam.troc.loy = 1;
      app.s = s;
      app.enterGame(false);
      app.scene.setMood({ crisis: true, danger: 0.5 });
    }, era);
    await page.waitForTimeout(2500);
    const res = await page.evaluate(async () => {
      const { scene } = (window as any).__citadeck;
      const frames: number[] = [];
      let last = performance.now();
      await new Promise<void>((resolve) => {
        const t0 = last;
        const loop = (now: number) => {
          frames.push(now - last);
          last = now;
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
    console.log(`ère ${era + 1} : ${res.fps.toFixed(1)} i/s en moyenne, 95e centile ${res.p95.toFixed(1)} ms, palier ${res.tier}`);
  }
  await browser.close();
  await new Promise<void>((r) => srv.httpServer.close(() => r()));
  console.log(`\nCPU ralenti ×${throttle}. Pire moyenne : ${worst.toFixed(1)} i/s.${errors.length ? `\nErreurs : ${errors.join(' | ')}` : ''}`);
  process.exitCode = worst >= 30 && !errors.length ? 0 : 1;
}

void main();
