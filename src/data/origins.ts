/**
 * Ce que chaque origine change vraiment : une règle, et des cartes à elle (tirées d'office à leur ère).
 * Gens du Feu : une tribu soudée (familles amicales, réserves maigres).
 * Gens du Fleuve : des paysans au bord d'un fleuve capricieux (limon et crues, armée faible).
 * Héritiers : bâtir sur des ruines (héritage et rancunes doublés, les ruines à fouiller dès le départ).
 */
import { $, card } from './dsl';

export const originCards = [
  // ------------------------------------------------------------------ le limon du fleuve (règle passive)
  card({
    id: 'o_limon', kind: 'decouverte', eras: [], art: { motif: 'wave', hue: 190 },
    passive: [{ type: 'income', res: 'vivres', amount: 1 }], gift: '+1 Vivre par saison : le fleuve nourrit qui vit sur ses rives.',
    title: 'Le Limon du fleuve', text: 'Chaque crue laisse une terre noire où tout pousse, même ce qu’on n’a pas semé.', options: [],
  }),

  // ------------------------------------------------------------------ Gens du Feu
  card({
    id: 'or_feu_sacre', kind: 'evenement', eras: [0], echo: true, cond: { mem: 'origine_feu' }, art: { motif: 'flame', hue: 25 },
    title: 'Le Feu qui ne doit pas mourir',
    text: 'Le feu de la tribu vacille : la pluie, le vent, et {F:ourk} qui s’est assis dessus par distraction. Tout le monde regarde le foyer, puis vous.',
    options: [
      { label: 'Veiller toute la nuit', cost: $('V2'), effect: { loy: { sel: 1, troc: 1 }, mem: ['feu_veille'] },
        reply: 'Toute la tribu veille autour des braises. On se raconte des histoires ; au matin, le feu brûle et chacun connaît celles des autres.' },
      { label: 'Laisser {F:brume} le rallumer', effect: { gain: $('S2'), loy: { brume: 1, sel: -1 } },
        reply: '{F:brume} frotte deux bâtons, puis trois, puis se fâche. Le feu repart. {F:sel} affirme que c’est le ciel qui a cédé.' },
      { label: 'Un feu par famille', cost: $('T2'), effect: { gain: $('A2'), loy: { ourk: 1, brume: 1 } },
        reply: 'Quatre feux au lieu d’un. Plus de chaleur, moins de disputes, et quatre façons de faire griller la viande.' },
    ],
  }),
  card({
    id: 'or_feu_veillee', kind: 'evenement', scale: true, eras: [1], echo: true, cond: { mem: 'origine_feu' }, art: { motif: 'flame', hue: 35 },
    title: 'La Veillée des ancêtres',
    text: 'Une fois l’an, on rallume le premier feu et l’on raconte la fondation. Chaque famille veut que le récit commence par la sienne.{?mem:feu_veille| Les anciens se souviennent de la nuit où personne n’a dormi.|}',
    options: [
      { label: 'Commencer par Ourk', effect: { gain: $('A3'), loy: { ourk: 1, brume: -1 } }, reply: 'Le récit commence par un mammouth, finit par un mammouth, et le milieu est surtout du mammouth.' },
      { label: 'Commencer par Sel', effect: { gain: $('V3'), loy: { sel: 1, troc: -1 } }, reply: 'Le récit commence par une prophétie. Personne ne se souvient laquelle, mais tout le monde hoche la tête.' },
      { label: 'Commencer par vous', cost: $('T2'), effect: { gain: $('S3'), loy: { ourk: -1, sel: -1 } }, reply: 'Dans le récit, vous allumez le feu seul, d’un regard. Les familles applaudissent poliment, puis racontent la vraie version entre elles.' },
    ],
  }),

  // ------------------------------------------------------------------ Gens du Fleuve
  card({
    id: 'or_crue', kind: 'evenement', eras: [0], echo: true, cond: { mem: 'origine_fleuve' }, art: { motif: 'wave', hue: 195 },
    title: 'La Crue',
    text: 'Le fleuve déborde, comme chaque printemps, mais plus fort. L’eau monte jusqu’aux greniers. Elle laissera un limon noir, très fertile, et des poissons dans les arbres.',
    options: [
      { label: 'Bâtir une digue', cost: $('A1 T2'), effect: { mem: ['digue'], loy: { brume: 1 } },
        reply: 'Une digue de terre et de rondins. Le fleuve la regarde, la contourne, puis se calme. {F:brume} prend des mesures pour la prochaine.' },
      { label: 'Laisser l’eau faire', effect: { gain: $('V6'), quartiers: -1, cause: 'la crue du fleuve' },
        reply: 'L’eau emporte les huttes basses et laisse une terre magnifique. On replante, on rebâtit plus haut, on mange bien.' },
      { label: 'Une offrande aux eaux', cost: $('V3'), effect: { loy: { sel: 1, troc: 1 } },
        reply: '{F:sel} jette les offrandes au fleuve. Le fleuve redescend, par hasard ou par politesse. {F:troc} repêche ce qui flotte.' },
    ],
  }),
  card({
    id: 'or_bac', kind: 'evenement', scale: true, eras: [1], echo: true, cond: { mem: 'origine_fleuve' }, art: { motif: 'ship', hue: 195 },
    title: 'Le Bac',
    text: 'Un passeur propose un bac pour traverser le fleuve, jusque chez {rival}. Le commerce y gagnerait. Les espions aussi, dans les deux sens.',
    options: [
      { label: 'Un bac de commerce', effect: { gain: $('T4'), rival: 1, loy: { troc: 1 } }, reply: 'Le bac va et vient, chargé d’épices et de rumeurs. Les rumeurs paient moins de droits.' },
      { label: 'Un pont fortifié', cost: $('A3'), effect: { gain: $('T2'), rival: -1, loy: { ourk: 1 } }, reply: 'Un pont, des tours, une herse. Le commerce passe, au pas, sous le regard des archers.' },
      { label: 'Garder le fleuve pour frontière', effect: { gain: $('V3'), loy: { ourk: 1, troc: -1 } }, reply: 'Pas de bac. Le fleuve reste un mur liquide. Les pêcheurs, eux, sont ravis.' },
    ],
  }),
  card({
    id: 'or_crue_2', kind: 'evenement', scale: true, eras: [2], echo: true, cond: { mem: 'origine_fleuve' }, art: { motif: 'wave', hue: 205 },
    title: 'La Grande Crue',
    text: 'Le fleuve sort de son lit comme jamais.{?mem:digue| La vieille digue des ancêtres tient encore ; elle ne tiendra pas seule.| Il n’y a jamais eu de digue : l’eau entre dans les rues.} {F:brume} propose des écluses, {F:sel} des processions.',
    options: [
      { label: 'Des écluses', cost: $('S3 T2'), effect: { gain: $('V4'), loy: { brume: 1 } }, reply: 'Les écluses domptent le fleuve. On irrigue, on navigue, on se dispute les horaires.' },
      { label: 'Une procession', cost: $('V2'), effect: { if: { mem: 'digue' }, then: { loy: { sel: 1 }, reply: 'La procession longe la digue. L’eau monte jusqu’aux pieds des fidèles, puis renonce.' }, else: { quartiers: -1, cause: 'la Grande Crue', loy: { sel: 1 }, reply: 'La procession avance les pieds dans l’eau. Un quartier bas est emporté pendant les cantiques.' } },
        warn: 'Sans la digue des ancêtres, un quartier sera emporté' },
      { label: 'Évacuer vers les collines', effect: { gain: $('A2'), loy: { troc: -1 } }, reply: 'On monte sur les collines avec les chèvres et les archives. On redescend une semaine plus tard ; les chèvres préfèrent les collines.' },
    ],
  }),

  // ------------------------------------------------------------------ Héritiers
  card({
    id: 'or_inventaire', kind: 'evenement', eras: [0], echo: true, cond: { mem: 'heritiers' }, art: { motif: 'skull', hue: 280 },
    title: 'L’Inventaire des ruines',
    text: 'Les ruines de {ancienne} regorgent d’objets. Personne ne sait à quoi sert la moitié. L’autre moitié est maudite, d’après {F:sel}.',
    options: [
      { label: 'Tout vendre aux Troc', effect: { gain: $('T5'), loy: { troc: 1, sel: -1 } }, reply: '{F:troc} rachète tout au poids. Il revendra les malédictions à part, plus cher.' },
      { label: 'Étudier les objets', cost: $('V2'), effect: { gain: $('S4'), loy: { brume: 1 } }, reply: '{F:brume} trie, étiquette, et découvre que les anciens savaient faire le pain. Personne n’ose lui dire qu’on savait aussi.' },
      { label: 'Tout enterrer à nouveau', effect: { gain: $('V2'), loy: { sel: 1, troc: -1 } }, reply: 'On rend aux morts ce qui était aux morts. {F:sel} bénit la fosse ; {F:troc} note l’emplacement, au cas où.' },
    ],
  }),
];
