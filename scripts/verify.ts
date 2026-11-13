/**
 * Vérifie, dans la vraie interface, quatre corrections de la version 11, avec captures et constats écrits :
 *   1. les révoltes sont annoncées sur la dernière carte avant le bilan ;
 *   2. la palissade rachète une perte de quartier subie (contre de l'Armée) ;
 *   3. après une disette, le bilan s'affiche et la dit ;
 *   4. le nom de la cité est le même à la fondation et dans la partie.
 *   npx tsx scripts/verify.ts      → shots/verify/*.png et shots/verify/rapport.txt
 */
import { chromium, type Page } from '@playwright/test';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'shots/verify';
const report: string[] = [];
const ok = (cond: boolean, what: string) => report.push(`${cond ? 'OK   ' : 'ÉCHEC'} ${what}`);

/** Joue (politique simple) jusqu'à l'état voulu, applique une retouche, puis l'interface reprend la partie. */
async function reach(page: Page, cond: string, tweak: string, opts: { dessein?: string; seeds?: number } = {}): Promise<number> {
  return page.evaluate(([condSrc, tweakSrc, o]) => {
    const w = window as any;
    const { app, engine } = w.__citadeck;
    const test = new Function('s', 'e', `return (${condSrc});`) as (s: any, e: any) => boolean;
    const fix = new Function('s', 'e', tweakSrc) as (s: any, e: any) => unknown;
    for (let seed = 1; seed <= (o.seeds ?? 40); seed++) {
      const s = engine.newGame(seed, { dessein: o.dessein ?? 'etoiles', origin: 'feu' });
      let g = 0;
      while (!test(s, engine) && s.phase !== 'fin' && g++ < 500) {
        const v = engine.view(s);
        const en = v.options.map((x: any, i: number) => (x.enabled ? i : -1)).filter((i: number) => i >= 0);
        // un joueur prudent : la meilleure option sur une copie (quartiers, merveilles, familles, réserves)
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
      const r = fix(s, engine);
      if (r === false) continue;
      app.s = s;
      app.enterGame(false);
      return typeof r === 'number' ? r : -1;
    }
    return -2;
  }, [cond, tweak, opts] as const);
}

const text = (page: Page, sel: string) => page.evaluate((q) => Array.from(document.querySelectorAll(q)).map((x) => (x as HTMLElement).innerText.replace(/\s*\n\s*/g, ' ')).join(' | '), sel);

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const srv = await createServer({ server: { port: 5331 }, logLevel: 'warn' });
  await srv.listen();
  const url = srv.resolvedUrls!.local[0];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.addInitScript('window.__name = (f) => f;');
  await page.addInitScript(() => localStorage.clear());
  await page.goto(url);
  await page.waitForTimeout(1500);

  // 4. le nom de la cité : écran de fondation, puis intro de la partie
  await page.click('text=Fonder une civilisation');
  await page.waitForTimeout(700);
  const nameSetup = (await text(page, '.screen.setup h2.big')).trim();
  await page.screenshot({ path: `${OUT}/4a-nom-fondation.png` });
  await page.click('.btns .btn >> nth=0');
  await page.waitForTimeout(2600);
  const nameIntro = (await text(page, '.screen h2.big')).trim();
  await page.screenshot({ path: `${OUT}/4b-nom-intro.png` });
  const nameState = await page.evaluate(() => (window as any).__citadeck.app.s?.name);
  ok(!!nameSetup && nameSetup === nameIntro && nameIntro === nameState, `nom de la cité : fondation « ${nameSetup} », intro « ${nameIntro} », partie « ${nameState} »`);

  // 1. révoltes annoncées : dernière carte de crise, une famille à −3 que l'option ne touche pas
  const fam = await reach(page, "s.phase === 'crise' && s.pile.length === 0 && s.prompt", `
    const f = e.present(s).find((x) => true);
    s.fam[f].loy = -3;
    return ['ourk', 'sel', 'brume', 'troc'].indexOf(f);`, { dessein: 'etoiles' });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/1a-revolte-annoncee.png` });
  const risks = await text(page, '.opt');
  ok(fam >= 0 && /Au bilan, .* se révolter/.test(risks), `révolte annoncée sur la dernière carte avant le bilan : ${(risks.match(/Au bilan[^|]*/) ?? ['(rien)'])[0].slice(0, 120)}`);
  await page.click('.opt:not([disabled]) >> nth=0');
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${OUT}/1b-bilan-revolte.png` });
  const bil1 = await text(page, '.screen, .after, .stage');
  ok(/révolt/i.test(bil1), `le bilan montre la révolte : ${(bil1.match(/[^.]*révolt[^.]*\./i) ?? ['(rien)'])[0].trim().slice(0, 120)}`);

  // chaque scénario repart d'une page neuve (un bilan en cours garde l'interface occupée)
  await page.goto(url);
  await page.waitForTimeout(1200);
  // 2. palissade : merveille de l'ère I bâtie, une option à seuil raté qui coûte un quartier, 8 Armée en réserve
  const opt = await reach(page, "s.jalons[0] && s.prompt && e.view(s).options.some((o, i) => { const x = e.options(s)[i]; return o.enabled && x.effect.if && x.effect.if.res && !x.effect.if.res.armee && x.effect.else && x.effect.else.quartiers < 0; })", `
    const v = e.view(s);
    const i = v.options.findIndex((o, k) => { const x = e.options(s)[k]; return o.enabled && x.effect.if && x.effect.if.res && !x.effect.if.res.armee && x.effect.else && x.effect.else.quartiers < 0; });
    const x = e.options(s)[i];
    for (const r of Object.keys(x.effect.if.res)) s.res[r] = 0;
    s.res.armee = 8;
    s.shieldUsed = undefined;
    window.__q = s.quartiers;
    return i;`, { dessein: 'empire' });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/2a-palissade-avant.png` });
  if (opt >= 0) await page.click(`.opt >> nth=${opt}`);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/2b-palissade-apres.png` });
  const after2 = await text(page, '.after, .chip.note');
  const q2 = await page.evaluate(() => ({ before: (window as any).__q, now: (window as any).__citadeck.app.s.quartiers, armee: (window as any).__citadeck.app.s.res.armee }));
  ok(opt >= 0 && /rachète/.test(after2) && q2.now === q2.before, `palissade : « ${(after2.match(/[^|]*rachète[^|]*/) ?? ['(rien)'])[0].trim().slice(0, 100)} », quartiers ${q2.before} → ${q2.now}, Armée restante ${q2.armee}`);

  await page.goto(url);
  await page.waitForTimeout(1200);
  // 3. disette : la carte, puis le bilan
  const dis = await reach(page, "s.prompt && s.prompt.card === 'disette'", 'return 0;', { dessein: 'posterite', seeds: 80 });
  if (dis === -2) {
    // aucune graine n'y mène avec ce joueur prudent : on vide les greniers avant le bilan
    await reach(page, "s.phase === 'crise' && s.pile.length === 0 && s.prompt", 's.res.vivres = 0; return 0;', { dessein: 'posterite' });
    await page.waitForTimeout(1200);
    await page.click('.opt:not([disabled]) >> nth=0');
    await page.waitForTimeout(1600);
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/3a-disette.png` });
  const disCard = await text(page, '.card-title');
  // ne rien acheter : laisser venir la disette
  await page.click('.opt:not([disabled]) >> nth=-1');
  await page.waitForTimeout(3200);
  await page.screenshot({ path: `${OUT}/3b-bilan-apres-disette.png` });
  const bil3 = await text(page, '.screen, .after');
  ok(/Disette|Famine/.test(bil3) && /Le bilan/.test(bil3), `après « ${disCard.trim()} » (sans acheter), le bilan s'affiche et dit : ${(bil3.match(/(Disette|Famine)[^\n|]*/) ?? ['(rien)'])[0].slice(0, 140)}`);

  ok(errors.length === 0, `aucune erreur console${errors.length ? ` : ${errors.slice(0, 3).join(' ; ')}` : ''}`);
  writeFileSync(`${OUT}/rapport.txt`, report.join('\n') + '\n');
  console.log(report.join('\n'));
  await browser.close();
  await srv.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
