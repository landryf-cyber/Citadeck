/**
 * Test à l'aveugle des formes d'ère : chaque ère de deux parties est décrite par sa seule mécanique (rythme, cartes par
 * genre, règles qui agissent, place de la crise), sans nom d'ère, de carte, de merveille ni de crise. Les dix blocs sont
 * mélangés ; un juge doit reformer les cinq paires (la même ère dans les deux parties) et les ordonner.
 *   npx tsx src/sim/blind.ts [graine] → scratchpad : énoncé (blind-enonce.txt) et corrigé (blind-corrige.json)
 */
import { writeFileSync } from 'node:fs';
import { content } from '../data';
import { Engine, type Ev } from '../core/engine';
import { Rng } from '../core/rng';
import type { GameState } from '../core/types';
import { PROFILES, chooseIndex } from './bots';

const WORD: Record<string, string> = {
  famille: 'une carte de famille', evenement: 'un événement', rencontre: 'une rencontre', intrigue: 'une suite',
  rivale: 'une carte de la rivale', ruines: 'des ruines', revenant: 'des revenants', decouverte: 'une découverte',
  trahison: 'une trahison', institution: 'une institution', regle: 'une carte de règle', conseil: 'un vote entre les familles',
};

/** Décrit une ère en mots neutres, à partir de ce que le joueur traverse. */
function describe(e: Engine, s: GameState, p: (typeof PROFILES)[number], rng: Rng): string[] {
  const out: string[][] = [[], [], [], [], []];
  let season = 0;
  let line: string[] = [];
  let cur = s.era;
  const flush = () => { if (line.length) out[cur].push(line.join(', ')); line = []; };
  let g = 0;
  while (s.phase !== 'fin' && g++ < 700) {
    const era = s.era;
    const id = s.prompt?.card ?? '';
    const kind = e.c.cards[id]?.kind;
    if (s.phase === 'presage') { flush(); season = 0; }
    else if (kind === 'carrefour') { flush(); season++; line.push(`saison ${season} : choix d'une route`); }
    else if (kind === 'jalon') { flush(); line.push(id === 'rattrapage' ? 'un chantier de rattrapage' : 'le chantier de la merveille'); }
    else if (kind === 'crise') line.push(s.phase === 'crise' ? 'une carte de crise' : 'une carte de crise au milieu de la saison');
    else if (id === 'disette') line.push('un avertissement de disette');
    else if (/^creance/.test(id)) line.push('une dette à payer');
    else if (kind === 'proces' || /^hommage_/.test(id)) line.push(s.phase === 'crise' ? 'un jugement avant la crise' : 'un procès ou un hommage au bilan');
    else if (kind === 'croissance') line.push('la croissance au bilan');
    else if (id === 'decouverte') line.push('le choix d’une découverte au bilan');
    else if (id === 'colonie') line.push('une carte de règle : fonder un quartier de plus');
    else if (kind && WORD[kind]) line.push(WORD[kind]);
    const before = s.phase;
    const ev: Ev[] = e.act(s, chooseIndex(e, s, p, rng));
    for (const x of ev) {
      if (x.type === 'rot') line.push(x.amount ? `des vivres gagnés à la saison, ${x.amount} pourrissent` : 'des vivres gagnés à la saison');
      if (x.type === 'raceStep') line.push(x.won ? 'la course contre la rivale est gagnée' : x.lost ? 'la course contre la rivale est perdue' : `la rivale avance d'une étape (${x.stage}/${x.of})`);
      if (x.type === 'peace') line.push('une récompense : aucune famille fâchée');
      if (x.type === 'passive') line.push('des revenus de saison');
      if (x.type === 'upkeep' || x.type === 'famine') { flush(); line.push('bilan : la cité mange'); }
    }
    if (before !== 'crise' && s.phase === 'crise') { flush(); line.push('crise'); }
    if (s.era !== era) { flush(); cur = s.era; }
  }
  flush();
  return out.map((x) => x.join(' ; '));
}

export function blindTest(seed = 1): { statement: string; key: Record<string, string> } {
  const e = new Engine(content);
  const p = PROFILES.find((x) => x.name === 'lecteur')!;
  const blocks: { game: number; era: number; text: string }[] = [];
  for (const [gi, d] of [[0, 'etoiles'], [1, 'posterite']] as const) {
    const rng = new Rng(seed * 101 + gi);
    const s = e.newGame(seed * 1000 + gi * 17, { dessein: d });
    describe(e, s, p, rng).forEach((text, era) => text && blocks.push({ game: gi + 1, era: era + 1, text }));
  }
  const order = new Rng(seed * 7 + 3).shuffle(blocks.map((_, i) => i));
  const letters = 'ABCDEFGHIJ';
  const key: Record<string, string> = {};
  const lines = order.map((i, k) => {
    key[letters[k]] = `partie ${blocks[i].game}, ère ${blocks[i].era}`;
    return `${letters[k]}. ${blocks[i].text}`;
  });
  return { statement: lines.join('\n\n'), key };
}

if (process.argv[1]?.endsWith('blind.ts')) {
  const out = process.argv[3] ?? '.';
  const r = blindTest(Number(process.argv[2] ?? 1));
  writeFileSync(`${out}/blind-enonce.txt`, r.statement + '\n');
  writeFileSync(`${out}/blind-corrige.json`, JSON.stringify(r.key, null, 2) + '\n');
  console.log(r.statement);
}
