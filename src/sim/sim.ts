/** Partie automatique, mesures, et transcription lisible. */
import { Rng } from '../core/rng';
import { Engine, type Ev, type Setup } from '../core/engine';
import { newMeta, nextSetup, recordRun, testaments } from '../core/meta';
import { RES_LABEL, type GameState, type MetaState, type RuinInfo } from '../core/types';
import type { Content } from '../core/content';
import { chooseIndex, type Profile } from './bots';

export interface RunStats {
  seed: number;
  profile: string;
  dessein: string;
  win: boolean;
  era: number;
  jalons: number;
  decisions: number;
  /** décisions dont le contenu dépend d'un choix passé */
  dependent: number;
  forms: Set<string>;
  arcsOpen: number;
  arcsDone: number;
  trials: number;
  losses: { cause: string; amount: number; era: number }[];
  mem: string[];
  path: string[];
  lines: string[];
  rivalJalons: number;
  quartiers: number;
}

const DEP_RX = /\{\?(mem|loy|card|jalon|state):|\{Q:|\{D:/;

export function playRun(c: Content, p: Profile, seed: number, opts: { transcript?: boolean; ruins?: RuinInfo[] } = {}): RunStats {
  const e = new Engine(c);
  const rng = new Rng((seed * 2246822519) >>> 0);
  const dessein = p.dessein ?? rng.pick(c.desseins).id;
  const s = e.newGame(seed, { dessein, ruins: opts.ruins });
  const st: RunStats = {
    seed, profile: p.name, dessein, win: false, era: 0, jalons: 0, decisions: 0, dependent: 0, forms: new Set(),
    arcsOpen: 0, arcsDone: 0, trials: 0, losses: [], mem: [], path: [], lines: [], rivalJalons: 0, quartiers: 0,
  };
  const L = (x: string) => opts.transcript && st.lines.push(x);
  L(`# ${s.name} — dessein « ${e.dessein(s).name} » — rivale : ${e.rival(s).name} — profil ${p.name}`);
  let guard = 0;
  while (s.phase !== 'fin' && guard++ < 400) {
    const v = e.view(s)!;
    const raw = c.cards[s.prompt!.card];
    // mesures de forme et de dépendance
    const form = raw.kind === 'carrefour' ? 'route' : raw.kind === 'proces' || raw.kind === 'hommage' ? 'procès' : raw.kind === 'decouverte' ? 'choix'
      : raw.kind === 'jalon' ? 'jalon' : raw.kind === 'croissance' ? 'croissance' : raw.qui ? 'qui' : v.options.some((o) => o.odds !== undefined) ? 'pari'
        : v.options.some((o) => o.warn) ? 'seuil' : v.options.length >= 3 ? 'trois voies' : 'binaire';
    if (raw.kind !== 'presage') {
      st.forms.add(form);
      st.decisions++;
      const dep = !!s.prompt!.from || DEP_RX.test(raw.text) || DEP_RX.test(raw.title) || raw.kind === 'proces' || raw.kind === 'hommage'
        || raw.kind === 'trahison' || raw.kind === 'ruines' || raw.kind === 'revenant' || !!raw.cond?.mem || !!raw.cond?.fam
        || raw.options.some((o) => !!o.effect.if?.mem || !!o.effect.if?.fam)
        || (raw.kind === 'famille' && !!raw.family && e.familyLead(s, raw.family) !== '');
      if (dep) st.dependent++;
      if (raw.kind === 'proces') st.trials++;
    }
    if (raw.kind === 'presage') L(`\n## Ère ${s.era + 1} — jalon : ${e.dessein(s).jalons[s.era].name} — crise : ${c.crises[s.era].name}`);
    const i = chooseIndex(e, s, p, rng);
    if (opts.transcript && raw.kind !== 'presage') {
      L(`\n[${s.res.vivres}V ${s.res.armee}A ${s.res.savoir}S ${s.res.tresor}T | ${s.quartiers} quartiers | ${Object.entries(s.fam).map(([f, x]) => `${f} ${x.loy >= 0 ? '+' : ''}${x.loy}`).join(' ')}]`);
      L(`${v.header ? `(${v.header}) ` : ''}**${v.title}**${v.speaker ? ` — ${v.speaker}` : ''}`);
      if (v.text) L(v.text);
      v.options.forEach((o, k) => {
        const cost = Object.entries(o.cost).map(([r, n]) => `-${n} ${RES_LABEL[r as keyof typeof RES_LABEL]}`).join(' ');
        const tags = [cost, o.req ? `exige ${o.req}${o.reqOk ? '' : ' (manque)'}` : '', o.families.length ? `⚑${o.families.join(',')}` : '', o.later ? '⌛' : '', o.warn ? `⚠ ${o.warn}` : '', o.odds !== undefined ? `${Math.round(o.odds * 100)} %` : '', o.detail ?? '']
          .filter(Boolean).join(' · ');
        L(`  ${k === i ? '→' : ' '} ${o.label}${tags ? `  [${tags}]` : ''}${o.enabled ? '' : '  (impossible)'}`);
      });
    }
    st.path.push(`${raw.id}:${i}`);
    const ev: Ev[] = e.act(s, i);
    if (opts.transcript) {
      for (const x of ev) {
        if (x.type === 'reply') L(`  « ${x.text} »`);
        if (x.type === 'quartiers' && x.delta) L(`  ${x.delta > 0 ? '+' : ''}${x.delta} quartier${Math.abs(x.delta) > 1 ? 's' : ''} (${x.cause})`);
        if (x.type === 'quartiers' && x.shielded) L(`  (une merveille évite la perte : ${x.cause})`);
        if (x.type === 'jalon') L(`  ★ JALON BÂTI : ${x.name}`);
        if (x.type === 'revolt') L(`  ✖ RÉVOLTE des ${x.family}`);
        if (x.type === 'defect') L(`  ✖ ${x.family} passent chez la rivale`);
        if (x.type === 'famine') L('  ✖ FAMINE');
        if (x.type === 'rivalJalon') L(`  ◇ la rivale bâtit : ${x.name} (${x.count}/5)`);
        if (x.type === 'bet') L(`  🎲 ${x.win ? 'gagné' : 'perdu'} (${Math.round(x.chance * 100)} %)`);
        if (x.type === 'neglect') L(`  (${x.family} se sentent délaissés)`);
      }
    }
  }
  st.win = s.result?.type === 'victoire';
  st.era = s.era;
  st.jalons = s.jalons.filter(Boolean).length;
  st.arcsOpen = s.arcs.open.length;
  st.arcsDone = s.arcs.done.length;
  st.losses = s.losses.map((l) => ({ cause: l.cause, amount: l.amount, era: l.era }));
  st.mem = s.mem.slice();
  st.rivalJalons = s.rivalJalons;
  st.quartiers = s.quartiers;
  L(`\n## FIN : ${s.result?.type} — ère ${s.era + 1} — ${st.jalons} jalons — ${s.result?.cause ?? s.result?.ending ?? ''} — rivale ${s.rivalJalons}/5`);
  return st;
}

export function finalState(c: Content, p: Profile, seed: number, setup: Partial<Setup> = {}): GameState {
  const e = new Engine(c);
  const rng = new Rng((seed * 2246822519) >>> 0);
  const s = e.newGame(seed, { dessein: p.dessein ?? rng.pick(c.desseins).id, ...setup });
  let g = 0;
  while (s.phase !== 'fin' && g++ < 400) e.act(s, chooseIndex(e, s, p, rng));
  return s;
}

/** Une suite de parties reliées par la méta-progression (chronique, ruines, testaments, déblocages). */
export function campaign(c: Content, p: Profile, seeds: number[], pickTestament = (n: number) => n % 3): { meta: MetaState; states: GameState[]; unlocks: string[][] } {
  const e = new Engine(c);
  let meta = newMeta();
  const states: GameState[] = [];
  const unlocks: string[][] = [];
  seeds.forEach((seed, k) => {
    const rng = new Rng((seed * 2246822519) >>> 0);
    const dessein = p.dessein ?? rng.pick(c.desseins).id;
    const origin = meta.unlocked.includes('heritiers') && k % 2 === 1 ? 'heritiers' : meta.unlocked.includes('fleuve') && k % 3 === 2 ? 'fleuve' : 'feu';
    const s = e.newGame(seed, nextSetup(meta, { dessein, origin }));
    let g = 0;
    while (s.phase !== 'fin' && g++ < 400) e.act(s, chooseIndex(e, s, p, rng));
    const t = testaments(e, s);
    const r = recordRun(meta, e, s, t[pickTestament(k) % t.length]);
    meta = r.meta;
    states.push(s);
    unlocks.push(r.unlocked.map((u) => u.id));
  });
  return { meta, states, unlocks };
}
