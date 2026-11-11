/** Diagnostic chiffré de la V1 : pourquoi le jeu ennuie. */
import { content } from '../../data';
import { Engine } from '../../core/engine';
import { GAUGES, type CardDef, type Side } from '../../core/types';
import { prudentBot, balancedBot } from '../bots';
import { playGame } from '../simulate';

const engine = new Engine(content);
const N = 400;
let drawn = 0, dependent = 0, obvious = 0, decisions = 0, hiddenOpts = 0, totalOpts = 0;
const deathEra = [0, 0, 0, 0, 0];
let deaths = 0, crisisDeaths = 0, wins = 0;
const titles = new Map<string, number>();
for (const c of Object.values(content.cards)) for (const s of ['left', 'right'] as Side[]) {
  totalOpts++;
  const e = c[s].effect;
  if ((e.add?.length ?? 0) > 0 || e.flags?.length || e.then?.add?.length || e.else?.add?.length) hiddenOpts++;
}
for (let i = 0; i < N; i++) {
  const s = playGame(engine, prudentBot, 1 + i * 7919, (st, card) => {
    drawn++;
    const c = engine.card(card);
    if (c.kind === 'consequence' || c.kind === 'rival') dependent++;
    titles.set(c.title, (titles.get(c.title) ?? 0) + 1);
  });
  decisions += s.turn;
  if (s.result?.type === 'defeat') {
    deaths++;
    deathEra[s.era]++;
    if (engine.card(s.result.card!).kind === 'crisis') crisisDeaths++;
  } else wins++;
}
// part des tours où une option est nettement « évidente » à la seule lecture des flèches
for (let i = 0; i < 100; i++) {
  const st = engine.newGame(500 + i, false);
  let guard = 0;
  while (st.phase !== 'end' && guard++ < 300) {
    if (st.phase === 'reward') { engine.pickReward(st, st.reward!.cards[0] ?? null); engine.nextEra(st); continue; }
    const score = (side: Side) => { const d = engine.preview(st, side); return GAUGES.reduce((a, g) => a + Math.abs(st.gauges[g] + (d[g] ?? 0) - 50), 0); };
    const l = score('left'), r = score('right');
    if (Math.abs(l - r) >= 12) obvious++;
    decisions;
    engine.choose(st, balancedBot.choose(engine, st, { range: () => 0, chance: () => false, next: () => 0.5 } as never));
  }
}
console.log(`Parties prudentes : ${N}, victoires ${(100 * wins / N).toFixed(0)} %, décisions moyennes ${(decisions / N).toFixed(0)}`);
console.log(`Mort par ère (prudente) : ${deathEra.map((n, i) => `ère ${i + 1} : ${(100 * n / N).toFixed(0)} %`).join(', ')}`);
console.log(`Défaites pendant une crise : ${(100 * crisisDeaths / Math.max(1, deaths)).toFixed(0)} %`);
console.log(`Cartes tirées dépendant d'un choix passé (suites + rivale) : ${(100 * dependent / drawn).toFixed(1)} %`);
console.log(`Options ayant un effet caché (suite, drapeau) : ${(100 * hiddenOpts / totalOpts).toFixed(0)} %`);
console.log(`Formes de dilemme : 1 (binaire, deux effets de jauge) sur 100 % des cartes`);
