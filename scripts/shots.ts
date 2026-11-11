/**
 * Captures de l'interface V2, mobile et bureau.
 *   npx tsx scripts/v2shots.ts [filtre…] [--dist] [--hd]
 * Les états avancés sont atteints en jouant la partie dans la page (politique simple et déterministe),
 * puis l'interface reprend la partie à cet endroit.
 */
import { chromium, type Page } from '@playwright/test';
import { createServer, preview } from 'vite';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const filters = args.filter((a) => !a.startsWith('--'));
const hd = args.includes('--hd');
const OUT = 'shots';
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  ...(args.includes('--extra') ? [{ name: 'petit', width: 360, height: 640, mobile: true }, { name: 'tablette', width: 820, height: 1180, mobile: true }] : []),
];

/** Joue dans la page jusqu'à ce que la condition soit vraie, puis reprend l'interface. */
async function jump(page: Page, cond: string, opts: { seed?: number; meta?: boolean; dessein?: string; prefer?: string } = {}): Promise<boolean> {
  return page.evaluate(([condSrc, o]) => {
    const w = window as any;
    const { app, engine } = w.__citadeck;
    const test = new Function('s', 'e', `return (${condSrc});`) as (s: any, e: any) => boolean;
    let rng = (o.seed ?? 7) >>> 0;
    const rand = () => ((rng = (Math.imul(rng ^ (rng >>> 15), 2246822519) + 0x6d2b79f5) >>> 0) / 4294967296);
    const s = engine.newGame(o.seed ?? 7, { dessein: o.dessein ?? 'etoiles', origin: 'feu', name: undefined, ruins: o.meta ? app.meta.chronicle.slice(0, 3) : [] });
    let g = 0;
    while (!test(s, engine) && s.phase !== 'fin' && g++ < 500) {
      const v = engine.view(s);
      const ok = v.options.map((x: any, i: number) => (x.enabled ? i : -1)).filter((i: number) => i >= 0);
      // un joueur raisonnable : il essaie chaque option sur une copie et garde la meilleure (avec un peu de hasard)
      let best = ok[0];
      let top = -1e9;
      for (const i of ok) {
        const c = JSON.parse(JSON.stringify(s));
        engine.act(c, i);
        const loy = Object.values(c.fam).reduce((a: number, f: any) => a + Math.max(-2, f.loy), 0) as number;
        const res = (c.res.vivres + c.res.armee + c.res.savoir + c.res.tresor) * 0.25;
        const sc = (c.phase === 'fin' && c.result?.type === 'defaite' ? -1000 : 0) + c.quartiers * 12 + c.jalons.filter(Boolean).length * 9 + loy * 2 + res + rand() * 6;
        if (sc > top) { top = sc; best = i; }
      }
      if (o.prefer && v.kind === 'carrefour') {
        const k = v.options.findIndex((x: any) => x.ref === o.prefer);
        if (k >= 0) best = k;
      }
      engine.act(s, best);
    }
    app.s = s;
    app.enterGame(false);
    return test(s, engine);
  }, [cond, opts] as const);
}

async function shot(page: Page, vp: string, name: string): Promise<void> {
  if (filters.length && !filters.some((f) => name.includes(f))) return;
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/${vp}/${name}.png` });
  console.log(`${vp}/${name}`);
}

async function main(): Promise<void> {
  const dist = args.includes('--dist');
  const srv = dist ? await preview({ preview: { port: 4327, strictPort: false }, logLevel: 'warn' }) : await createServer({ server: { port: 5327 }, logLevel: 'warn' });
  if (!dist) await (srv as Awaited<ReturnType<typeof createServer>>).listen();
  const url = dist ? (srv as Awaited<ReturnType<typeof preview>>).resolvedUrls!.local[0] : (srv as Awaited<ReturnType<typeof createServer>>).resolvedUrls!.local[0];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const errors: string[] = [];
  for (const vp of VIEWPORTS) {
    mkdirSync(`${OUT}/${vp.name}`, { recursive: true });
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: hd ? 2 : 1, isMobile: vp.mobile, hasTouch: vp.mobile });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${vp.name}: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${vp.name}: ${m.text()}`));
    await page.addInitScript('window.__name = (f) => f;');
    await page.addInitScript(() => localStorage.clear());
    await page.goto(url);
    await page.waitForTimeout(1800);
    await shot(page, vp.name, '01-titre');
    await page.click('text=Fonder une civilisation');
    await page.waitForTimeout(700);
    await shot(page, vp.name, '02-fondation');
    await page.click('.btns .btn >> nth=0');
    await page.waitForTimeout(1200);
    await shot(page, vp.name, '03-presage');
    await page.click('text=En route');
    await page.waitForTimeout(1200);
    await shot(page, vp.name, '04-carrefour');
    await page.click('.opt >> nth=0');
    await page.waitForTimeout(1300);
    await shot(page, vp.name, '05-carte');
    await page.click('.opt:not([disabled]) >> nth=0');
    await page.waitForTimeout(1300);
    await shot(page, vp.name, '06-reponse');

    await jump(page, "s.era === 1 && s.phase === 'saison' && s.saison === 1 && e.card(s.prompt.card).kind === 'famille'", { seed: 11 });
    await page.waitForTimeout(1500);
    await shot(page, vp.name, '10-ere2-famille');
    await jump(page, "s.era === 2 && s.phase === 'chantier'", { seed: 21, dessein: 'posterite' });
    await page.waitForTimeout(1500);
    await shot(page, vp.name, '11-ere3-chantier');
    await jump(page, "s.era === 2 && s.phase === 'crise'", { seed: 21, dessein: 'posterite' });
    await page.waitForTimeout(1500);
    await shot(page, vp.name, '12-ere3-crise');
    await jump(page, "s.phase === 'finere' && s.prompt && s.prompt.card === 'proces'", { seed: 5 });
    await page.waitForTimeout(1500);
    await shot(page, vp.name, '13-proces');
    await jump(page, "s.era === 3 && s.phase === 'saison'", { seed: 33, dessein: 'empire' });
    await page.waitForTimeout(1500);
    await shot(page, vp.name, '14-ere4');
    await jump(page, "s.era === 4 && s.phase === 'saison' && s.saison === 1", { seed: 33, dessein: 'empire' });
    await page.waitForTimeout(1500);
    await shot(page, vp.name, '15-ere5');
    // fin de partie : jouer jusqu'au bout
    await jump(page, "s.phase === 'fin'", { seed: 3 });
    await page.waitForTimeout(3500);
    await shot(page, vp.name, '20-fin');
    await page.click('text=Graver ses derniers mots').catch(() => undefined);
    await page.waitForTimeout(900);
    await shot(page, vp.name, '21-testament');
    await page.click('.testament >> nth=0').catch(() => undefined);
    await page.waitForTimeout(1000);
    await shot(page, vp.name, '22-chronique');
    await page.click('text=Menu').catch(() => undefined);
    await page.waitForTimeout(1500);
    await shot(page, vp.name, '23-titre-ruines');
    await page.click('text=Nouvelle civilisation').catch(() => page.click('text=Fonder une civilisation'));
    await page.waitForTimeout(700);
    await page.click('.btns .btn >> nth=0');
    await page.waitForTimeout(1200);
    await shot(page, vp.name, '24-presage-heritage');
    await jump(page, "s.era === 1 && s.prompt && s.prompt.card === 'ruines'", { seed: 44, meta: true, prefer: 'inconnu' });
    await page.waitForTimeout(1500);
    await shot(page, vp.name, '25-ruines');
    await page.click('.icon-btn[data-act=settings]').catch(() => undefined);
    await page.waitForTimeout(700);
    await shot(page, vp.name, '30-reglages');
    await ctx.close();
  }
  await browser.close();
  await srv.close();
  if (errors.length) {
    console.log('\nErreurs de la page :');
    for (const e of [...new Set(errors)]) console.log(' ', e);
    process.exitCode = 1;
  }
}

void main();
