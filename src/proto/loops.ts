/**
 * Prototypes de boucles de jeu, sans interface, avec du contenu synthétique.
 * Compare trois structures avec les mêmes bots et les mêmes mesures :
 *   P1 « Reigns + Dessein » : mort à 0 et à 100, aperçu complet, familles à mémoire, dessein.
 *   P2 « Lignées » : ressources à dépenser (coûts visibles, gains dans le texte), cité-vie,
 *      familles à mémoire, crises annoncées dont les options dépendent du deck, dessein.
 *   P3 « Lignées + Carrefours » : P2 avec des routes à risque entre les saisons.
 * Le contenu est généré : seule la structure est comparée, pas l'écriture.
 */
import { Rng } from '../core/rng';

export type Loop = 'P1' | 'P2' | 'P3';
type R = [number, number, number, number]; // Vivres, Armée, Savoir, Trésor
const TAGS = 3; // Science, Guerre, Culture : un par dessein

interface Opt {
  vis: R; // ce que l'interface montre
  hid: R; // ce que seul le texte dit
  fam: number; // famille concernée (-1 aucune)
  loy: number; // variation de loyauté (dit par le texte)
  sched: number; // valeur d'une suite programmée (+ bonne, - mauvaise), dite par le texte
  tag: number; // tag de deck gagné (-1 aucun)
  gate?: { tag: number; n: number }; // option disponible seulement avec n cartes du tag
}
interface Card { kind: 'famille' | 'event' | 'suite' | 'crise' | 'qui' | 'pari'; fam: number; opts: Opt[]; dep: boolean; id: string }

export interface Bot {
  name: string;
  /** reader : voit tout ; indicator : ne voit que ce que l'interface montre */
  sight: 'reader' | 'indicator' | 'random';
  /** 0 = équilibré ; 1..3 = spécialiste d'un dessein */
  focus: number;
  /** réserve visée avant de dépenser pour le dessein (prudent haut, gourmand bas) */
  reserve: number;
}

export interface Run {
  win: boolean;
  era: number;
  jalons: number;
  decisions: number;
  dependent: number;
  forms: Set<string>;
  intrigues: number;
  resolved: number;
  story: string[];
  /** part des pertes de vie causées par une décision identifiable (suite, famille hostile, crise mal préparée) */
  attributable: number;
  totalLoss: number;
}

const add = (a: R, b: R, k = 1): R => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k, a[3] + b[3] * k];

export const KNOB = { P1: 1, P2: 1, P3: 1 };

function genOpt(rng: Rng, loop: Loop, era: number, fam: number): Opt {
  const st = (1 + era * 0.25) * (loop === 'P1' ? KNOB.P1 : 1);
  const o: Opt = { vis: [0, 0, 0, 0], hid: [0, 0, 0, 0], fam, loy: 0, sched: 0, tag: -1 };
  if (loop === 'P1') {
    // à la Reigns : deux effets de jauge, entièrement montrés
    const a = rng.int(0, 3);
    let b = rng.int(0, 3);
    if (b === a) b = (a + 1) % 4;
    o.vis[a] = Math.round(rng.range(6, 12) * st);
    o.vis[b] = -Math.round(rng.range(6, 12) * st);
    if (rng.chance(0.3)) o.loy = rng.chance(0.5) ? 1 : -1;
    if (rng.chance(0.15)) o.sched = Math.round(rng.range(-10, 10));
  } else {
    // ressources : un coût montré, des gains dits par le texte
    const c = rng.int(0, 3);
    o.vis[c] = -rng.int(1, 4) - Math.floor(era / 2);
    const g = rng.int(0, 3);
    o.hid[g] += rng.int(2, 7) + era;
    if (rng.chance(0.35)) o.hid[rng.int(0, 3)] += rng.int(1, 4);
    if (rng.chance(0.25)) o.hid[rng.int(0, 3)] -= rng.int(1, 4); // un revers caché
    o.loy = fam >= 0 ? (rng.chance(0.5) ? 1 : -1) * (rng.chance(0.3) ? 2 : 1) : 0;
    if (rng.chance(0.35)) o.sched = Math.round(rng.range(-9, 9));
    if (rng.chance(0.3)) o.tag = rng.int(0, TAGS - 1);
  }
  return o;
}

export function makeContent(loop: Loop, seed: number): Card[][] {
  const rng = new Rng(seed);
  const eras: Card[][] = [];
  for (let e = 0; e < 5; e++) {
    const cards: Card[] = [];
    for (let i = 0; i < 26; i++) {
      const fam = i < 10 ? i % 5 : -1;
      const kindRoll = rng.next();
      const kind: Card['kind'] = loop !== 'P1' && kindRoll < 0.12 ? 'qui' : loop !== 'P1' && kindRoll < 0.22 ? 'pari' : fam >= 0 ? 'famille' : 'event';
      const opts = [genOpt(rng, loop, e, fam), genOpt(rng, loop, e, fam)];
      if (kind === 'qui') opts.push(genOpt(rng, loop, e, (fam + 2) % 5));
      if (loop !== 'P1' && rng.chance(0.3)) {
        // une option réservée à un deck spécialisé, nettement meilleure
        const g = genOpt(rng, loop, e, fam);
        g.gate = { tag: rng.int(0, TAGS - 1), n: 2 + Math.floor(e / 2) };
        g.vis = g.vis.map((v) => Math.round(v / 2)) as R;
        g.hid = g.hid.map((v) => (v > 0 ? v + 4 : v)) as R;
        opts.push(g);
      }
      cards.push({ kind, fam, opts, dep: fam >= 0 && loop !== 'P1' ? true : fam >= 0 && rng.chance(0.4), id: `${loop}-${e}-${i}` });
    }
    eras.push(cards);
  }
  return eras;
}

interface S {
  r: R;
  life: number;
  loyal: number[];
  tags: number[];
  dessein: number;
  jalons: number;
  sched: { at: number; v: number; fam: number }[];
  t: number;
}

function value(s: S, o: Opt, bot: Bot, loop: Loop, sightOverride?: Bot['sight']): number {
  const sight = sightOverride ?? bot.sight;
  const d = sight === 'reader' ? add(o.vis, o.hid) : o.vis;
  const after = add(s.r, d);
  let v = 0;
  if (loop === 'P1') {
    for (const x of after) v -= Math.pow(Math.abs(x - 50) / 50, 2) * 40 + (x <= 0 || x >= 100 ? 1e5 : 0);
    if (bot.focus > 0) v += after[[2, 1, 3][bot.focus - 1]] * 0.25;
  } else {
    const weights = [1, 1, 1, 1];
    if (bot.focus > 0) weights[[2, 1, 3][bot.focus - 1]] = 1.8;
    for (let i = 0; i < 4; i++) {
      const x = after[i];
      v += Math.min(x, 30) * weights[i] - (x < 0 ? 1e5 : 0) - (x < bot.reserve ? (bot.reserve - x) * 0.8 : 0);
    }
    if (sight === 'reader' && o.tag >= 0) v += o.tag === bot.focus - 1 ? 7 : bot.focus === 0 ? 3 : 1;
  }
  if (sight === 'reader') {
    v += o.sched * 1.1;
    if (o.fam >= 0) v += o.loy * (s.loyal[o.fam] <= -2 ? 9 : 4);
  }
  return v;
}

function available(s: S, o: Opt): boolean {
  if (o.gate && s.tags[o.gate.tag] < o.gate.n) return false;
  return true;
}

export function play(loop: Loop, content: Card[][], bot: Bot, seed: number): Run {
  const rng = new Rng(seed);
  const s: S = {
    r: loop === 'P1' ? [50, 50, 50, 50] : [8, 6, 5, 6],
    life: 3,
    loyal: [0, 0, 0, 0, 0],
    tags: [0, 0, 0],
    dessein: bot.focus > 0 ? bot.focus - 1 : rng.int(0, 2),
    jalons: 0,
    sched: [],
    t: 0,
  };
  const run: Run = { win: false, era: 0, jalons: 0, decisions: 0, dependent: 0, forms: new Set(), intrigues: 0, resolved: 0, story: [], attributable: 0, totalLoss: 0 };
  const dead = () => (loop === 'P1' ? s.r.some((x) => x <= 0 || x >= 100) : s.life <= 0);
  const loseLife = (n: number, attributable: boolean) => {
    s.life -= n;
    run.totalLoss += n;
    if (attributable) run.attributable += n;
  };
  const choose = (c: Card) => {
    const opts = c.opts.filter((o) => available(s, o));
    let pick = opts[0];
    if (bot.sight === 'random') pick = rng.pick(opts);
    else {
      let best = -Infinity;
      for (const o of opts) {
        const v = value(s, o, bot, loop) + rng.range(-2, 2);
        if (v > best) { best = v; pick = o; }
      }
    }
    s.r = add(add(s.r, pick.vis), pick.hid);
    if (loop !== 'P1') s.r = s.r.map((x) => Math.max(0, x)) as R;
    if (pick.fam >= 0) s.loyal[pick.fam] = Math.max(-3, Math.min(3, s.loyal[pick.fam] + pick.loy));
    if (pick.tag >= 0) s.tags[pick.tag]++;
    if (pick.sched !== 0) { s.sched.push({ at: s.t + rng.int(3, 9), v: pick.sched, fam: pick.fam }); run.intrigues++; }
    run.decisions++;
    run.forms.add(c.kind);
    run.story.push(`${c.id}:${c.opts.indexOf(pick)}`);
    s.t++;
    // suites programmées : la carte revient, bonne ou mauvaise
    for (const q of s.sched.filter((x) => x.at <= s.t)) {
      run.dependent++;
      run.resolved++;
      run.decisions++;
      run.forms.add('suite');
      if (loop === 'P1') s.r[rng.int(0, 3)] += q.v;
      else if (q.v < -5) loseLife(1, true);
      else s.r[rng.int(0, 3)] += Math.round(q.v / 2);
    }
    s.sched = s.sched.filter((x) => x.at > s.t);
  };

  for (let e = 0; e < 5; e++) {
    run.era = e;
    const pool = rng.sample(content[e], loop === 'P1' ? 18 : 12);
    // P3 : deux carrefours par ère, trois routes chacun
    const saisons = loop === 'P3' ? 2 : 1;
    const per = Math.ceil(pool.length / saisons);
    for (let si = 0; si < saisons; si++) {
      if (loop === 'P3') {
        run.forms.add('carrefour');
        run.decisions++;
        const routes = [0, 1, 2].map(() => rng.int(0, 5));
        // 0 fertile, 1 frontière (risque), 2 marché, 3 académie, 4 chantier, 5 inconnu
        const score = (k: number) => {
          if (bot.sight === 'random') return rng.next();
          const focusRes = bot.focus > 0 ? [2, 1, 3][bot.focus - 1] : -1;
          switch (k) {
            case 0: return 6 + (s.r[0] < 6 ? 6 : 0);
            case 1: return s.r[1] >= 8 + e * 2 ? 10 + (focusRes === 1 ? 6 : 0) : bot.reserve > 6 ? -8 : 3;
            case 2: return s.r[3] >= 6 ? 8 + (bot.focus > 0 ? 3 : 0) : 0;
            case 3: return 6 + (focusRes === 2 ? 5 : 0);
            case 4: return bot.reserve < 6 ? 12 : 5;
            default: return bot.reserve > 6 ? 2 : 7;
          }
        };
        const k = routes.reduce((a, b) => (score(b) > score(a) ? b : a));
        if (k === 0) s.r[0] += 5;
        if (k === 1) { if (s.r[1] >= 8 + e * 2) { s.r[1] += 4; s.r[3] += 4; } else loseLife(1, true); }
        if (k === 2 && s.r[3] >= 6) { s.r[3] -= 6; s.tags[bot.focus > 0 ? bot.focus - 1 : rng.int(0, 2)] += 2; }
        if (k === 3) s.r[2] += 6;
        if (k === 4) { const i = [2, 1, 3][s.dessein]; if (s.r[i] >= 6) { s.r[i] -= 6; s.jalons += 0.5; } }
        if (k === 5) { if (rng.chance(0.5)) s.r[rng.int(0, 3)] += 9; else loseLife(1, false); }
      }
      for (const c of pool.slice(si * per, (si + 1) * per)) {
        if (c.dep) run.dependent++;
        choose(c);
        if (loop === 'P1') {
          // le vent de l'ère et la dérive : la part non attribuable
          s.r[e % 4] += e % 2 ? 1 : -1;
          if (dead()) return run;
        } else if (dead()) return run;
      }
    }
    // familles hostiles : révolte (cause identifiable)
    if (loop !== 'P1') {
      for (let f = 0; f < 5; f++) if (s.loyal[f] <= -3) { loseLife(1, true); s.loyal[f] = -1; }
      if (dead()) return run;
    }
    // crise de fin d'ère
    run.forms.add('crise');
    if (loop === 'P1') {
      for (let k = 0; k < 3; k++) {
        const c: Card = { kind: 'crise', fam: -1, id: `crise-${e}-${k}`, dep: false, opts: [0, 1].map(() => {
          const o = genOpt(rng, 'P1', e + 1, -1);
          o.vis = o.vis.map((v) => (v < 0 ? Math.round(v * 1.6) : v)) as R;
          return o;
        }) };
        choose(c);
        if (dead()) return run;
      }
    } else {
      // crise annoncée : la menace porte sur une ressource et un tag, connus d'avance
      const need = [1, 0, 2, 1, 3][e];
      const tag = e % TAGS;
      const k = KNOB[loop as 'P2' | 'P3'];
      const ready = s.r[need] / ((6 + e * 3) * k) + s.tags[tag] / (3 * k) + s.loyal.filter((l) => l >= 2).length * 0.25;
      const raw = 2.2 * k - ready;
      const dmg = Math.max(0, Math.min(3, Math.floor(raw + rng.next())));
      s.r[need] = Math.max(0, s.r[need] - (4 + e * 2));
      run.decisions += 3;
      if (dmg > 0) loseLife(dmg, true);
      if (dead()) return run;
    }
    // jalon du dessein
    if (loop === 'P1') {
      const i = [2, 1, 3][s.dessein];
      if (s.r[i] >= 60) s.jalons++;
    } else {
      const i = [2, 1, 3][s.dessein];
      const cost = 6 + e * 3;
      const keep = bot.reserve;
      if (s.r[i] - cost >= keep * 0.6 && s.tags[s.dessein] >= Math.floor(e / 2)) { s.r[i] -= cost; s.jalons++; }
      // croissance et entretien de la cité
      const upkeep = s.life * 2;
      if (s.r[0] >= upkeep + 4) { s.r[0] -= upkeep; s.life++; }
      else if (s.r[0] >= upkeep) s.r[0] -= upkeep;
      else { s.r[0] = 0; loseLife(1, true); }
      if (dead()) return run;
    }
  }
  run.win = true;
  run.jalons = Math.floor(s.jalons);
  return run;
}
