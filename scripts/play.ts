/**
 * Jouer en mode texte, une décision par commande (pour les testeurs automatiques ou humains au terminal).
 * Montre exactement ce que l'interface montre : coûts, exigences, familles concernées (sans le sens),
 * sablier, seuils, chances des paris ; jamais les gains ni les loyautés cachés.
 *
 *   npx tsx scripts/play.ts new <dossier> [etoiles|empire|posterite] [origine] [graine]
 *   npx tsx scripts/play.ts <dossier> <numéro d'option>
 *   npx tsx scripts/play.ts <dossier> voir           (réafficher la carte en cours)
 *   npx tsx scripts/play.ts <dossier> chiffres       (payer du Savoir pour voir les gains exacts)
 *   npx tsx scripts/play.ts <dossier> famille <ourk|sel|brume|troc>
 *   à la fin : npx tsx scripts/play.ts <dossier> testament <numéro>
 * Le dossier garde la partie (game.json) et la méta (meta.json) : les parties suivantes héritent des ruines.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { content } from '../src/data';
import { Engine, gainText, type Ev } from '../src/core/engine';
import { epitaph, newMeta, nextSetup, recordRun, testaments, loadMeta } from '../src/core/meta';
import { FAMILIES, RES, RES_LABEL, type Bag, type FamilyId, type GameState, type MetaState } from '../src/core/types';
import { capitalize, civName, ERA_NAMES } from '../src/core/text';

const e = new Engine(content);
const [, , a0, a1, a2, a3, a4] = process.argv;
const out: string[] = [];
const P = (s = '') => out.push(s);
const bag = (b: Bag, sign = '') => RES.filter((r) => b[r]).map((r) => `${sign}${b[r]} ${RES_LABEL[r]}`).join(', ');

function load(dir: string): { s: GameState | null; meta: MetaState } {
  const g = `${dir}/game.json`;
  const m = `${dir}/meta.json`;
  return { s: existsSync(g) ? (JSON.parse(readFileSync(g, 'utf8')) as GameState) : null, meta: existsSync(m) ? loadMeta(JSON.parse(readFileSync(m, 'utf8'))) : newMeta() };
}
function save(dir: string, s: GameState | null, meta: MetaState): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/game.json`, JSON.stringify(s));
  writeFileSync(`${dir}/meta.json`, JSON.stringify(meta));
}

function hud(s: GameState): void {
  const fams = FAMILIES.map((f) => {
    const fi = e.familyInfo(s, f);
    return `${fi.house} : ${fi.mood}${fi.loy ? ` (${fi.loy > 0 ? '+' : ''}${fi.loy})` : ''}${fi.neglected ? ' [délaissés]' : ''}`;
  }).join(' · ');
  const upkeep = e.presageInfo(s).upkeep;
  P(`[${ERA_NAMES[s.era]} · ${s.quartiers} ${s.quartiers > 1 ? 'quartiers' : 'quartier'} · ${RES.map((r) => `${s.res[r]} ${RES_LABEL[r]}`).join(', ')} (la cité mangera ${upkeep} Vivres en fin d’ère) · merveilles ${s.jalons.filter(Boolean).length}/5, rivale ${s.rivalJalons}/5]`);
  P(`[${fams}]`);
}

function presage(s: GameState): void {
  const p = e.presageInfo(s);
  P(`=== PRÉSAGE — Ère ${p.era + 1} : ${p.name} (${p.date})`);
  const fm = e.form(s);
  P(`Forme de l'ère : ${fm.name}, ${fm.rhythm} de ${fm.cards} cartes. ${fm.short.replace('{cap}', String(e.carryCap(s)))}`);
  P(`  (règle : ${fm.rule} Objectif : ${fm.objective} Menace : ${fm.threat})`);
  // ce que l'écran montre d'emblée : une phrase, trois lignes, prêt ou pas
  const n = p.crisis.name;
  const toCrisis = n.startsWith('Le ') ? `au ${n.slice(3)}` : n.startsWith('La ') ? `à la ${n.slice(3)}` : n.startsWith('Les ') ? `aux ${n.slice(4)}` : n.startsWith('L’') ? `à l’${n.slice(2)}` : `à ${n}`;
  const cn = /^(Le|La|Les) /.test(n) || n.startsWith('L’') ? n.charAt(0).toLowerCase() + n.slice(1) : n;
  P(p.jalon ? fm.mission.replace('{j}', p.jalon.name.charAt(0).toLowerCase() + p.jalon.name.slice(1)).replace('{cn}', cn).replace('{rival}', p.rival.name) : `Tenir face ${toCrisis}.`);
  const ready = e.crisisReadiness(s);
  P(`  Objectif : ${p.jalon ? `${p.jalon.name} (${bag(p.jalon.cost)})${p.tag && p.tag.total < p.tag.need ? ` — ${p.tag.tag} ${p.tag.total}/${p.tag.need}` : ''}` : 'la merveille de l’ère est debout'}`);
  P(`  Menace : ${p.crisis.name} — ${ready.level === 'pret' ? 'Prêt' : ready.level === 'presque' ? 'Presque prêt' : 'Pas prêt'}`);
  P(`  Rivale : ${capitalize(p.rival.name)} · ${p.rival.count} merveille${p.rival.count > 1 ? 's' : ''} sur 5`);
  P('--- détails (repliés à l’écran) ---');
  P(`Vous avez : ${s.quartiers} ${s.quartiers > 1 ? 'quartiers' : 'quartier'}, ${RES.map((r) => `${s.res[r]} ${RES_LABEL[r]}`).join(', ')}.`);
  if (p.legacy) P(`L’héritage de ${p.legacy.from} : stèle « ${p.legacy.testament ?? '—'} » ; ${p.legacy.label ?? ''}. ${p.legacy.memory ?? ''}`);
  if (p.jalon) P(`Dessein « ${p.dessein} » : cette ère, bâtir ${p.jalon.name} (${bag(p.jalon.cost)}${p.jalon.req ? `, exige ${p.jalon.req}` : ''}). ${p.jalon.text} ${p.jalon.gift}`);
  if (p.alt) P(`  ou ${p.alt.name} (${bag(p.alt.cost)}${p.alt.req ? `, exige ${p.alt.req}` : ''}). ${p.alt.text} ${p.alt.gift}`);
  const missed = e.dessein(s).jalons.filter((_, i) => i < s.era && !s.jalons[i]).map((j) => j.name);
  if (missed.length) P(`Merveille${missed.length > 1 ? 's' : ''} manquée${missed.length > 1 ? 's' : ''} : ${missed.join(', ')}. ${e.form(s).seasons > 1 ? `À la dernière saison, vous pourrez rattraper ${missed[missed.length - 1]}, plus cher.` : 'Trop tard pour la rattraper.'}`);
  if (p.tag) P(`${p.tag.tag} : ${p.tag.total} sur ${p.tag.need}${p.tag.parts.length ? ` (${p.tag.parts.join(', ')})` : ''}. On en gagne avec ${p.tag.how}.`);
  P(`Crise de l’ère : ${p.crisis.name}. ${p.crisis.intro} Ce qui protège : ${p.crisis.protects}.${p.envy ? ` Vos merveilles attirent les regards : crise ${p.envy} % plus dure.` : ''}`);
  P(`Seuils et coûts annoncés, jusqu’à : ${bag(p.needs.bag)}${p.needsIfBuilt ? ` (si vous bâtissez la merveille d’abord : ${bag(p.needsIfBuilt)})` : ''}${p.needs.families.length ? ` ; aide aussi : ${p.needs.families.join(', ')}` : ''}.`);
  if (s.era >= 4) P('Dernier bilan : ni repas ni usure ; seules les révoltes comptent encore.');
  else if (s.era === 3) P(`Au bilan : la cité mangera ${p.upkeep} Vivres ; pas d’usure (la veille du Jugement, on garde tout) ; puis une découverte à choisir.`);
  else P(`Au bilan : la cité mangera ${p.upkeep} Vivres${p.wonderUpkeep ? `, dont ${p.wonderUpkeep} pour entretenir vos merveilles` : ''} ; l’Armée perd 30 % et le Trésor 20 %${s.era < 4 ? ' ; puis une découverte à choisir, payée en Savoir' : ''}.`);
  const lonely = e.present(s).filter((f) => s.era - s.visits[f] >= 2 && s.fam[f].seen < s.era).map((f) => e.c.families[f].house[s.era]);
  if (lonely.length) P(`${capitalize(lonely.join(' et '))} attendent votre visite : sans elle cette ère, ils se sentiront délaissés au bilan (−1).`);
  if (p.nextJalon) P(`À l’ère suivante : ${p.nextJalon.name}${p.nextJalon.req ? `, qui exigera ${p.nextJalon.req}` : ''}.`);
  P(p.rival.count >= 5 ? `Rivale : ${p.rival.name} ont achevé leur grand dessein ; à chaque fin d’ère, ils réclament un tribut. Relations : ${p.rival.rel}.` : `Rivale : ${p.rival.name} (${p.rival.leader}), ${p.rival.count}/5 merveilles ; prochaine : ${p.rival.next}. Relations : ${p.rival.rel}.`);
  P('Options : 1. En route');
}

function card(s: GameState): void {
  if (s.phase === 'fin') return end(s);
  if (s.phase === 'presage') return presage(s);
  const v = e.view(s)!;
  hud(s);
  P(`--- ${v.header ? `(${v.header}) ` : ''}${v.title}${v.speaker && v.kind !== 'carrefour' ? ` — ${v.speaker}` : ''}`);
  P(v.text);
  v.options.forEach((o, i) => {
    const bits = [
      Object.keys(o.cost).length ? `coût ${bag(o.cost)}` : o.loss || o.lossQ || o.spend ? '' : 'gratuit',
      o.loss ? `perte ${bag(o.loss)}` : '',
      o.lossQ ? `perte ${o.lossQ} quartier${o.lossQ > 1 ? 's' : ''}` : '',
      o.gainQ ? `+${o.gainQ} quartier${o.gainQ > 1 ? 's' : ''} (une vie de plus)` : '',
      o.rivalDir ? `rivale ${o.rivalDir > 0 ? '▲' : '▼'}` : '',
      o.req ? `exige ${o.req}${o.reqOk ? '' : ' (manque)'}` : '',
      o.spend ? `dépense ${bag(o.spend)} seulement si le seuil est atteint (sinon rien n’est dépensé, et la perte annoncée tombe)` : '',
      o.gains && Object.keys(o.gains).length ? `rapporte ${RES.filter((r) => o.gains![r]).map((r) => `${gainText(o.gains![r]!, ' à ')} ${RES_LABEL[r]}`).join(', ')}` : '',
      o.families.length ? `concerne ${o.families.map((f) => { const d = o.famDir?.[f] ?? 0; return `${capitalize(e.c.families[f].house[s.era])} ${d ? `${d > 0 ? '▲' : '▼'}${Math.abs(d) > 1 ? Math.abs(d) : ''}` : '? (selon l’issue)'}`; }).join(', ')}` : '',
      o.later ? 'aura une suite (sablier)' : '',
      o.warn ? `attention : ${o.warn}` : '',
      o.risk ? `risque : ${o.risk}` : '',
      o.odds !== undefined ? `chance ${Math.round(o.odds * 100)} %` : '',
      o.detail ?? '',
    ].filter(Boolean);
    P(`  ${i + 1}. ${o.label}  [${bits.join(' · ')}]${o.enabled ? '' : '  (impossible)'}`);
  });
  const pk = e.canPeek(s);
  if (pk.offer) P(`  (commande « chiffres » : voir les gains exacts pour ${e.peekCost(s)} Savoir${pk.afford ? '' : ', Savoir insuffisant'})`);
}

function feedback(s: GameState, ev: Ev[]): void {
  const reply = ev.filter((x) => x.type === 'reply').map((x) => (x as { text: string }).text).join(' ');
  if (reply) P(`» ${reply}`);
  const res = ev.filter((x) => x.type === 'res') as { before: Record<string, number>; after: Record<string, number> }[];
  const parts: string[] = [];
  if (res.length) for (const r of RES) { const d = res[res.length - 1].after[r] - res[0].before[r]; if (d) parts.push(`${d > 0 ? '+' : ''}${d} ${RES_LABEL[r]}`); }
  // ce que le choix a causé, séparé de ce que fait le bilan
  const BILAN = new Set(['bilan', 'revolt', 'defect', 'neglect', 'mend', 'income', 'decay', 'upkeep', 'disette', 'famine', 'spoil', 'peace']);
  const cut = ev.findIndex((x) => BILAN.has(x.type));
  const mine = cut < 0 ? ev : ev.slice(0, cut);
  const loy = new Map<FamilyId, number>();
  for (const x of mine) if (x.type === 'loy') loy.set(x.family, (loy.get(x.family) ?? 0) + x.delta);
  for (const [f, d] of loy) if (d) parts.push(`${capitalize(e.c.families[f].house[s.era])} ${d > 0 ? '▲' : '▼'}${Math.abs(d) > 1 ? Math.abs(d) : ''}`);
  for (const x of mine) {
    if (x.type === 'quartiers' && x.delta) parts.push(`${x.delta > 0 ? '+' : ''}${x.delta} quartier${Math.abs(x.delta) > 1 ? 's' : ''}${x.delta < 0 ? ` (${x.cause})` : ''}`);
    if (x.type === 'quartiers' && x.shielded) parts.push(`une merveille rachète le quartier (${x.cause})${x.paid ? ` contre ${bag(x.paid, '-')}` : ''}`);
    if (x.type === 'sched') parts.push('cela aura des suites');
    if (x.type === 'rot') parts.push(`la chasse rapporte +${x.hunt} Vivres${x.amount ? ` ; on ne porte pas plus de ${x.cap} : ${x.amount} pourrissent` : ''}`);
    if (x.type === 'raceStep') parts.push(x.won ? 'COURSE GAGNÉE : la rivale n’achèvera pas sa merveille cette ère' : x.lost ? 'COURSE PERDUE : la rivale a fini, la crise frappera plus fort' : `la rivale avance : étape ${x.stage} sur ${x.of}`);
    if (x.type === 'bet') parts.push(`pari ${x.win ? 'réussi' : 'raté'} (${Math.round(x.chance * 100)} %)`);
    if (x.type === 'jalon') parts.push(`★ MERVEILLE BÂTIE : ${x.name}`);
    if (x.type === 'card+' && e.card(x.id).kind === 'decouverte') parts.push(`découverte : ${e.card(x.id).title}`);
    if (x.type === 'passive') parts.push(`vos merveilles et découvertes rapportent ${bag(x.bag, '+')}`);
    if (x.type === 'rivalJalon' && !ev.some((y) => y.type === 'upkeep' || y.type === 'famine' || y.type === 'disette')) parts.push(`la rivale ${x.delta < 0 ? 'perd' : 'achève'} ${x.name} (${x.count}/5)`);
  }
  if (parts.length) P(`  (${parts.join(' · ')})`);
  const bil: string[] = [];
  for (const x of ev) {
    if (x.type === 'revolt') bil.push(`${capitalize(e.c.families[x.family].house[s.era])} se révoltent : un quartier brûle.`);
    if (x.type === 'defect') bil.push(`${capitalize(e.c.families[x.family].house[s.era])} passent chez la rivale, avec un quartier.`);
    if (x.type === 'neglect') bil.push(`${capitalize(e.c.families[x.family].house[s.era])} se sentent délaissés (pas visités depuis deux ères).`);
    if (x.type === 'income') bil.push(`Une famille fervente apporte ${bag(x.bag, '+')}.`);
    if (x.type === 'mend') bil.push(`Les Peintures apaisent ${e.c.families[x.family].house[s.era]} : ils remontent d’un cran.`);
    if (x.type === 'rivalJalon' && cut >= 0 && ev.indexOf(x) > cut) bil.push(`La rivale ${x.delta < 0 ? 'perd' : 'achève'} ${x.name} (${x.count}/5).`);
    if (x.type === 'spoil') bil.push(`Les greniers débordent : ${x.amount} Vivres se gâtent (au-delà de trois repas d’avance).`);
    if (x.type === 'peace') bil.push('LA PAIX CIVILE : aucune famille fâchée, un quartier de plus.');
    if (x.type === 'disette') bil.push(`DISETTE : il manquait ${x.missing} Vivres ; pas de quartier perdu, mais toutes les familles grognent (−1).`);
    if (x.type === 'decay') bil.push(`Usure : ${[x.armee ? `-${x.armee} Armée` : '', x.tresor ? `-${x.tresor} Trésor` : ''].filter(Boolean).join(', ')}.`);
    if (x.type === 'upkeep') bil.push(`La cité mange : -${x.amount} Vivres.`);
    if (x.type === 'famine') bil.push(ev.some((y) => y.type === 'quartiers' && y.shielded && y.cause === 'la famine') ? 'FAMINE : une merveille rachète le quartier.' : 'FAMINE : un quartier se vide.');
    if (x.type === 'annex') bil.push(`${capitalize(x.name)} annexent un quartier (leur dessein est achevé ; ils épargnent leurs amis).`);
  }
  if (bil.length) P(`=== BILAN DE L’ÈRE\n  ${bil.join('\n  ')}`);
  const cr = ev.find((x) => x.type === 'crisis') as { name: string } | undefined;
  if (cr) P(`=== CRISE : ${cr.name}`);
  const era = ev.find((x) => x.type === 'era') as { era: number } | undefined;
  if (era) P(`=== NOUVELLE ÈRE : ${ERA_NAMES[era.era]}`);
}

function end(s: GameState): void {
  const r = s.result!;
  P(`=== FIN : ${r.rank === 'triomphe' ? 'TRIOMPHE, dessein accompli' : r.rank === 'victoire' ? 'VICTOIRE' : r.type === 'defaite' ? `CHUTE : ${s.name} est tombée (${ERA_NAMES[s.era]})` : s.rivalJalons >= 5 ? `SURVIE, dans l’ombre de ${e.rival(s).name}` : 'SURVIE, dessein inachevé'} — merveilles ${r.jalons}/5, rivale ${s.rivalJalons}/5`);
  P(`Épitaphe : ${epitaph(e, s)}`);
  for (const l of s.losses) P(`  perte : -${l.amount} ${l.amount > 1 ? 'quartiers' : 'quartier'}, ${l.cause}`);
  P('Derniers mots (choisir avec « testament N ») :');
  testaments(e, s).forEach((t, i) => P(`  ${i + 1}. « ${t.text} » — héritage : ${t.legacy.label}`));
}

const dir = a0 === 'new' ? a1 : a0;
if (!dir) {
  console.log('usage : voir l’en-tête du fichier');
  process.exit(1);
}
let { s, meta } = load(dir);
if (a0 === 'new') {
  const seed = Number(a4 ?? Math.floor(Math.random() * 1e9));
  const setup = { ...nextSetup(meta, { dessein: a2 ?? 'etoiles', origin: a3 ?? 'feu' }), name: civName(seed) };
  s = e.newGame(seed, setup);
  P(`Nouvelle civilisation : ${s.name}. Dessein : ${e.dessein(s).name}. Origine : ${e.c.origins.find((o) => o.id === s!.origin)?.name}. Rivale : ${e.rival(s).name}.`);
  if (s.ruins.length) P(`Sur la colline : les ruines de ${s.ruins.map((x) => x.name).join(', ')}.`);
  P('Victoire : 4 merveilles à la fin de l’ère V ; triomphe : les 5 ; en dessous, simple survie.');
  { const d = e.dessein(s); P(`Les merveilles du dessein exigent ${d.jalons.map((j) => j.req?.tags?.[d.tag] ?? 0).filter(Boolean).join(', ')} de ${d.tag} (découvertes, famille amie, merveilles bâties).`); }
  card(s);
} else if (!s) {
  P('Aucune partie en cours. Lancez « new ».');
} else if (a1 === 'voir') {
  card(s);
} else if (a1 === 'chiffres') {
  P(e.peek(s) ? `(−${e.peekCost(s)} Savoir : les chiffres exacts)` : 'Impossible de voir les chiffres exacts ici.');
  card(s);
} else if (a1 === 'famille') {
  const fi = e.familyInfo(s, a2 as FamilyId);
  P(`${fi.house} (${fi.head}, ${fi.trade}) : ${fi.mood} (${fi.loy}). Domaine ${fi.tag}, ${RES_LABEL[fi.res]}. Méprisent ${e.familyInfo(s, fi.rivalOf).house}.`);
  if (fi.grudge) P(`Ils se souviennent : « ${fi.grudge.label} », ${fi.grudge.date}.`);
  if (fi.favor) P(`Ils vous savent gré : « ${fi.favor.label} », ${fi.favor.date}.`);
} else if (a1 === 'testament' && s.phase === 'fin') {
  const t = testaments(e, s)[Number(a2) - 1] ?? testaments(e, s)[0];
  const rec = recordRun(meta, e, s, t);
  meta = rec.meta;
  P('=== LA CHRONIQUE RETIENDRA');
  for (const l of rec.entry.lines) P(`  · ${l}`);
  for (const u of rec.unlocked) P(`  Débloqué : ${u.name} — ${u.text}`);
  s = null;
} else {
  const i = Number(a1) - 1;
  const v = s.phase === 'presage' ? null : e.view(s);
  if (v && !v.options[i]?.enabled) P('Option impossible.');
  else {
    const ev = e.act(s, i);
    feedback(s, ev);
    P('');
    card(s);
  }
}
save(dir, s, meta);
console.log(out.join('\n'));
