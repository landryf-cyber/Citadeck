/**
 * Échos : des décisions de l'âge de pierre qui reviennent, des millénaires plus tard.
 * - quatre variantes de cartes de famille pour l'âge de pierre (la graine choisit), chacune avec sa suite ;
 * - deux suites des cartes d'origine (la malédiction du louveteau, la roue spoliée).
 * Les échos sont toujours tirés quand leur souvenir existe (`echo: true`).
 */
import { $, card } from './dsl';

export const echoFamilyCards = [
  card({
    id: 'ourk_1b', kind: 'famille', family: 'ourk', eras: [0], tags: ['Guerre'], art: { motif: 'flame' },
    title: 'La Peinture de guerre',
    text: '« Ourk veut peindre tout le clan en rouge pour la chasse. Le rouge fait peur aux bêtes. » Le rouge se fait avec les baies sacrées de Mère Sel. Mère Sel a les bras croisés.',
    options: [
      { label: 'Tout le clan en rouge', effect: { gain: $('A3'), loy: { ourk: 2, sel: -2 }, mem: ['ourk_rouge'] },
        reply: 'Le clan est rouge vif. Les bêtes fuient, les ennemis aussi, et Mère Sel encore plus vite.' },
      { label: 'Juste les joues', cost: $('V1'), effect: { loy: { ourk: 1 } },
        reply: 'Ourk a des joues rouges. Il a l’air d’avoir honte. Ourk n’a jamais honte. Ourk est furieux.' },
      { label: 'Les baies sont sacrées', effect: { gain: $('V2'), loy: { ourk: -1, sel: 1 } },
        reply: 'Ourk chasse en couleur naturelle. Il revient bredouille, et rouge quand même, de colère.' },
    ],
  }),
  card({
    id: 'sel_1b', kind: 'famille', family: 'sel', eras: [0], tags: ['Foi'], art: { motif: 'eye' },
    title: 'La Première Prophétie',
    text: 'Mère Sel a eu sa première vision : la cité tombera « dans dix mille ans, à cause d’un chef distrait ». Elle voudrait la graver dans la pierre. Elle tend la main pour le burin, et pour la quête.',
    options: [
      { label: 'La graver dans la pierre', cost: $('T2'), effect: { loy: { sel: 2 }, mem: ['prophetie_gravee'] },
        reply: 'La prophétie est gravée sur un grand rocher. Les enfants viennent y lire leur avenir. Il est mauvais, mais lointain.' },
      { label: 'Une prophétie plus gaie', cost: $('V2'), effect: { gain: $('T2'), loy: { sel: 1, brume: -1 } },
        reply: 'Mère Sel revoit sa vision : la cité tombera dans dix mille ans, mais dans la bonne humeur. C’est mieux.' },
      { label: 'Éclater de rire', effect: { loy: { sel: -2, troc: 1 }, mem: ['prophetie_moquee'] },
        reply: 'Vous riez. Le clan rit. Mère Sel ne rit pas. Elle note quelque chose sur un os, et le range.' },
    ],
  }),
  card({
    id: 'brume_1b', kind: 'famille', family: 'brume', eras: [0], tags: ['Science'], art: { motif: 'flame' },
    title: 'Le Feu qui dure',
    text: 'Le vieux Brume a trouvé comment garder le feu toute la nuit : des pierres, de la cendre, et beaucoup de patience. Il voudrait qu’on l’appelle « le feu de Brume ». Ourk voudrait qu’on l’appelle « le feu ».',
    options: [
      { label: '« Le feu de Brume »', effect: { gain: $('S3'), loy: { brume: 2, ourk: -1 }, mem: ['feu_brume'] },
        reply: 'Le feu porte un nom. Le vieux Brume veille dessus et note la température toutes les heures.' },
      { label: '« Le feu », tout court', effect: { gain: $('V2'), loy: { brume: -1, ourk: 1 } },
        reply: 'Le feu est à tout le monde. Le vieux Brume le surveille quand même, de loin, l’air vexé.' },
      { label: 'Le cacher à {rival}', cost: $('V1'), effect: { gain: $('A2'), loy: { brume: 1 }, rival: -1 },
        reply: 'La nuit, vos voisins grelottent et regardent votre camp, qui luit. Ils posent des questions. Personne ne répond.' },
    ],
  }),
  card({
    id: 'troc_1b', kind: 'famille', family: 'troc', eras: [0], tags: ['Commerce'], art: { motif: 'coin' },
    title: 'La Première Dette',
    text: 'Troc vous prête une défense de mammouth, la plus belle du clan. « Vous me la rendrez quand vous pourrez. Avec un petit quelque chose. Rien d’écrit, entre amis. » Il dessine quand même sur un caillou.',
    options: [
      { label: 'Emprunter la défense', effect: { gain: $('T4'), loy: { troc: 1 }, mem: ['dette_ancestrale'] },
        reply: 'La défense trône au milieu du camp. Troc garde le caillou dans sa poche. Il le caresse en souriant.' },
      { label: 'Ne rien devoir à personne', effect: { loy: { troc: -1, ourk: 1 } },
        reply: 'Troc range sa défense. « Une autre fois. » Il dit ça comme on dit « bientôt ».' },
    ],
  }),
];

export const echoEvents = [
  card({
    id: 'ev_pantalon', kind: 'evenement', scale: true, eras: [3], echo: true, cond: { mem: 'ourk_rouge' }, art: { motif: 'shield', hue: 0 },
    title: 'Le Pantalon rouge',
    text: 'Depuis la peinture de guerre de {D:ourk_rouge}, l’armée se bat en rouge. {F:ourk} refuse l’uniforme gris que propose {F:brume}. « Le rouge fait peur. » Les canons ennemis, eux, le trouvent très pratique.',
    options: [
      { label: 'Garder le rouge', effect: { gain: $('A3'), loy: { ourk: 2, brume: -1 }, mem: ['rouge_garde'] },
        reply: 'L’armée reste rouge. Elle se voit de très loin. L’ennemi aussi, mais il est moins beau.' },
      { label: 'Passer au gris', cost: $('T3'), effect: { loy: { ourk: -2, brume: 1 } },
        reply: 'L’armée est grise, invisible et triste. {F:ourk} garde une chaussette rouge, en secret.' },
      { label: 'Gris dehors, rouge dedans', cost: $('T2'), effect: { loy: { ourk: 1 } },
        reply: 'Des uniformes gris doublés de rouge. Les soldats le montrent en ouvrant leur veste. C’est devenu un salut.' },
    ],
  }),
  card({
    id: 'ev_prophetie', kind: 'evenement', scale: true, eras: [4], echo: true, cond: { mem: 'prophetie_gravee' }, art: { motif: 'eye', hue: 44 },
    title: 'Le Rocher de la prophétie',
    text: 'Le rocher où Mère Sel avait gravé sa prophétie, en {D:prophetie_gravee}, est toujours là. Dix mille ans ont passé. {F:sel} vous regarde longuement. « Distrait, disait-elle. »',
    options: [
      { label: 'En faire un musée', cost: $('T3'), effect: { gain: $('S3'), loy: { sel: 1, troc: 1 } },
        reply: 'Les visiteurs se pressent. Ils lisent la prophétie, puis vous regardent, puis relisent. Vous rangez votre bureau.' },
      { label: 'Faire mentir la prophétie', cost: $('V3 A3'), effect: { loy: { sel: 2, ourk: 1 }, mem: ['prophetie_dementie'] },
        reply: 'Vous ne vous laissez plus distraire. Plus de réunions inutiles. Personne ne vous reconnaît.' },
      { label: 'Effacer le rocher', effect: { loy: { sel: -3 } },
        reply: 'Le rocher est poli, lisse, muet. {F:sel} sourit : « Il y avait une copie. Il y a toujours une copie. »' },
    ],
  }),
  card({
    id: 'ev_prophetie_moquee', kind: 'evenement', scale: true, eras: [4], echo: true, cond: { mem: 'prophetie_moquee' }, art: { motif: 'eye', hue: 44 },
    title: 'L’Os de Mère Sel',
    text: 'Les archéologues ont retrouvé un os gravé par Mère Sel le jour où vous aviez ri de sa prophétie, en {D:prophetie_moquee}. Traduction : « Il a ri. Noter. Dans dix mille ans, lui rappeler. » {F:sel} vous le rappelle.',
    options: [
      { label: 'Présenter des excuses', cost: $('T4'), effect: { loy: { sel: 3 } },
        reply: '{F:sel} accepte vos excuses au nom de l’ancêtre. Elle les grave sur un os, pour les dix mille prochaines années.' },
      { label: 'Rire encore', effect: { gain: $('T2'), loy: { sel: -2, troc: 1 } },
        reply: 'Vous riez. {F:sel} note quelque chose sur sa tablette. La tablette a une sauvegarde automatique.' },
    ],
  }),
  card({
    id: 'ev_flamme', kind: 'evenement', scale: true, eras: [2], echo: true, cond: { mem: 'feu_brume' }, art: { motif: 'flame', hue: 205 },
    title: 'La Flamme de Brume',
    text: 'Le feu de Brume brûle sans interruption depuis {D:feu_brume}. Les Brumaire le veillent, frère après frère. Un novice s’est endormi. La flamme vacille. Tout le monde vous regarde, comme si c’était votre faute.',
    options: [
      { label: 'Sauver la flamme', cost: $('S3'), effect: { loy: { brume: 2 }, mem: ['flamme_sauvee'] },
        reply: 'La flamme reprend. Le novice est pardonné, et nommé gardien des allumettes, ce qui est une punition.' },
      { label: 'La laisser s’éteindre', effect: { gain: $('T3'), loy: { brume: -3, ourk: 1 } },
        reply: 'La flamme meurt. On en rallume une autre en deux minutes. Les Brumaire portent le deuil pendant un siècle.' },
    ],
  }),
  card({
    id: 'ev_interets', kind: 'evenement', scale: true, eras: [4], echo: true, cond: { mem: 'dette_ancestrale' }, art: { motif: 'coin', hue: 150 },
    title: 'Les Intérêts',
    text: 'TrocCorp vous présente un caillou : la reconnaissance de dette de la défense de mammouth, empruntée en {D:dette_ancestrale}. Avec dix mille ans d’intérêts composés. Le montant est écrit en notation scientifique.',
    options: [
      { label: 'Rendre la défense', cost: $('T5'), effect: { loy: { troc: 2 } },
        reply: 'Vous retrouvez la défense au musée, la rachetez, la rendez. TrocCorp l’accepte, et vous facture les frais de port.' },
      { label: 'Dette prescrite', effect: { loy: { troc: -3 }, mem: ['dette_prescrite'] },
        reply: 'Prescrite. TrocCorp encadre le caillou dans le hall, avec votre nom, en grand. Les visiteurs prennent des photos.' },
      { label: 'Négocier', cost: $('S3'), effect: { gain: $('T3'), loy: { troc: 1, brume: 1 } },
        reply: '{F:brume} recalcule les intérêts et trouve une erreur en votre faveur. TrocCorp se dit choqué. Il paie l’erreur.' },
    ],
  }),
  // suites des cartes d'origine, proposées par l'éditeur
  card({
    id: 'ev_quarantieme', kind: 'evenement', scale: true, eras: [4], echo: true, cond: { mem: 'sel_bafouee' }, art: { motif: 'eye', hue: 44 },
    title: 'La Quarantième Génération',
    text: '{F:sel} a fait les comptes : vous êtes la quarantième génération depuis le louveteau mangé en {D:sel_bafouee}. « Mère Sel avait un calendrier. Nous l’avons gardé. » Elle tend la main.',
    options: [
      { label: 'Lever la malédiction', cost: $('T5'), effect: { loy: { sel: 2 } },
        reply: 'Levée. Avec un reçu, et une petite malédiction neuve, offerte. « Pour l’entretien. »' },
      { label: 'Un louveteau, enfin', cost: $('V4'), effect: { loy: { sel: 2, ourk: -1 } },
        reply: '{F:ourk} jure de ne pas y toucher. Il le regarde comme on regarde un dîner.' },
      { label: 'Je n’y crois pas', effect: { loy: { sel: -2 } },
        reply: 'Rien ne se passe. Pendant une saison. {F:sel} note la date.' },
    ],
  }),
  card({
    id: 'ev_brevet', kind: 'evenement', scale: true, eras: [3], echo: true, cond: { mem: 'brume_spolie' }, art: { motif: 'gear', hue: 205 },
    title: 'Le Brevet de la roue',
    text: '{F:brume} réclame des droits sur chaque roue fabriquée depuis que l’ancêtre l’a inventée et qu’Ourk en a fait un char, en {D:brume_spolie}. Avec effet rétroactif. « Vous voulez le chiffre, ou vous préférez vous asseoir ? »',
    options: [
      { label: 'Payer', cost: $('T6'), effect: { gain: $('S3'), loy: { brume: 2 } },
        reply: 'Payé. {F:brume} corrige le montant. À la hausse. Puis il vous remercie, sincèrement.' },
      { label: 'Vendre la créance à {H:troc}', effect: { gain: $('T3'), loy: { brume: -2, troc: 1 } },
        reply: '{H:troc} rachètent la créance. Les charrettes ralentissent dans tout le pays, par prudence.' },
      { label: '« C’est le char d’Ourk »', effect: { loy: { ourk: 2, brume: -2 } },
        reply: '{F:ourk} apporte le char au tribunal. {F:brume} précise : « Il est poussé. » Le juge ajourne, très fatigué.' },
    ],
  }),
];

/** Rappels de ces nouveaux souvenirs, en tête des cartes de famille des ères suivantes. */
export const echoRecalls = [
  { family: 'ourk' as const, mem: 'ourk_rouge', line: 'Il porte encore une trace de rouge sur les joues. C’est une tradition depuis la grande peinture de guerre.', tone: 'pos' as const },
  { family: 'sel' as const, mem: 'ourk_rouge', line: 'Depuis qu’on a peint le clan avec ses baies sacrées, sa famille n’en cueille plus. Elle vous le rappelle en vous servant des fruits verts.', tone: 'neg' as const },
  { family: 'sel' as const, mem: 'prophetie_gravee', line: 'Elle passe chaque matin devant le rocher de la prophétie. Elle vous fait signe. Le signe veut dire « distrait ».' },
  { family: 'sel' as const, mem: 'prophetie_moquee', line: 'Elle garde un os gravé dans un coffret. Elle ne dit pas ce qui est écrit dessus. Elle sourit en le regardant.', tone: 'neg' as const },
  { family: 'brume' as const, mem: 'feu_brume', line: 'Une petite flamme brûle dans une lanterne à sa ceinture. Elle vient du premier feu de Brume. {Il:brume} ne la prête pas.', tone: 'pos' as const },
  { family: 'troc' as const, mem: 'dette_ancestrale', line: 'Il a un caillou gravé dans sa poche. Il le sort parfois, le regarde, fait un calcul, et sourit.' },
];
