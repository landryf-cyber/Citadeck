/**
 * Variantes des cartes de famille pour l'Antiquité et le Moyen Âge : la graine (et la partie
 * précédente) choisit entre la carte d'origine et sa variante, pour que deux parties ne se ressemblent pas.
 */
import { $, card } from './dsl';

export const variantCards = [
  // ------------------------------------------------------------------ Antiquité
  card({
    id: 'ourk_2b', kind: 'famille', family: 'ourk', eras: [1], tags: ['Guerre'], art: { motif: 'shield' },
    title: 'Le Lion d’Ourkos',
    text: 'Ourkos propose des jeux : des gladiateurs, des lions, et lui-même en finale, contre un lion qu’il a choisi personnellement. « Le peuple a besoin de voir qui le protège. Et de quoi. »',
    options: [
      { label: 'Des jeux grandioses', cost: $('T4'), effect: { gain: $('A3'), loy: { ourk: 2 }, mem: ['ourk_jeux'] },
        reply: 'Ourkos gagne en finale. Le lion aussi, aux points. La foule hurle votre nom, puis celui du lion, puis on ne sait plus.' },
      { label: 'Des jeux sans lions', cost: $('T1'), effect: { gain: $('V2'), loy: { ourk: -1 } },
        reply: 'Ourkos affronte un mouton. Il gagne. Personne n’applaudit, sauf le mouton, qui est soulagé.' },
      { label: 'Pas de jeux : les moissons', effect: { gain: $('V4'), loy: { ourk: -2, sel: 1 } },
        reply: 'Les légionnaires moissonnent en rang, au pas, en chantant. La récolte est excellente, et un peu terrifiée.' },
    ],
  }),
  card({
    id: 'sel_2b', kind: 'famille', family: 'sel', eras: [1], tags: ['Foi'], art: { motif: 'flame' },
    title: 'Les Vestales',
    text: 'Sélènè la Pythie veut des vestales pour garder le feu sacré, nuit et jour. « Le feu ne doit jamais s’éteindre. Ni les dons. Surtout pas les dons. »',
    options: [
      { label: 'Un temple et six vestales', cost: $('T3'), effect: { gain: $('V3'), loy: { sel: 2 }, mem: ['sel_vestales'] },
        reply: 'Le feu sacré brûle jour et nuit. Les vestales se relaient, et ont découvert qu’on y cuit très bien le pain.' },
      { label: 'Une vestale, à mi-temps', cost: $('T1'), effect: { gain: $('S1'), loy: { sel: -1 } },
        reply: 'La vestale garde le feu le matin et tient les comptes l’après-midi. Le feu s’éteint vers seize heures. Les comptes sont justes.' },
      { label: 'Confier le feu à {H:brume}', effect: { loy: { sel: -2, brume: 1 }, gain: $('S2') },
        reply: '{F:brume} installe un soufflet automatique. Le feu ne s’éteint plus jamais. {F:sel} le regarde comme on regarde un hérétique très efficace.' },
    ],
  }),
  card({
    id: 'brume_2b', kind: 'famille', family: 'brume', eras: [1], tags: ['Science'], art: { motif: 'scales' },
    title: 'Le Point d’appui',
    text: 'Brumos le Mesureur affirme qu’avec un levier assez long et un point d’appui, il soulèvera le monde. Il demande le levier, le point d’appui, et que personne ne reste dessous.',
    options: [
      { label: 'Lui fournir le levier', cost: $('S4'), effect: { gain: $('T3'), loy: { brume: 2 }, mem: ['brume_levier'] },
        reply: 'Le monde ne bouge pas. Mais le levier soulève les pierres des chantiers comme des plumes. Brumos dit que c’est un début.' },
      { label: 'Une catapulte, plutôt', cost: $('S2'), effect: { gain: $('A3'), loy: { brume: 1, sel: -1 } },
        reply: 'La catapulte lance des pierres très loin. {F:sel} fait remarquer qu’elles retombent. Brumos répond que c’est un détail.' },
      { label: 'Le monde est bien où il est', effect: { gain: $('V2'), loy: { brume: -2, sel: 1 } },
        reply: 'Brumos range son levier. On le surprend le soir à soulever de petites choses, par principe.' },
    ],
  }),
  card({
    id: 'troc_2b', kind: 'famille', family: 'troc', eras: [1], tags: ['Commerce'], art: { motif: 'ship' },
    title: 'L’Assurance',
    text: 'Trokos l’armateur propose d’assurer les navires : on lui paie un peu chaque année ; si le navire coule, on est remboursé. Si le navire ne coule pas, c’est Trokos qui est remboursé.',
    options: [
      { label: 'Assurer la flotte', cost: $('T3'), effect: { gain: $('T6'), loy: { troc: 2 }, mem: ['troc_assurance'] },
        reply: 'Aucun navire ne coule de l’année. Trokos est ravi. L’année suivante, il propose une assurance contre les années sans naufrage.' },
      { label: 'Assurer aussi le temple', cost: $('T2'), effect: { gain: $('T3'), loy: { troc: 1, sel: 1, ourk: -1 } },
        reply: 'Le temple est assuré contre la foudre. {F:sel} trouve l’idée vexante pour le ciel. Elle signe quand même, en petit.' },
      { label: 'Le hasard ne s’achète pas', effect: { gain: $('V3'), loy: { troc: -2 } },
        reply: 'Trokos range ses contrats. Il assure désormais les navires de {rival}, avec un sourire de propriétaire.' },
    ],
  }),

  // ------------------------------------------------------------------ Moyen Âge
  card({
    id: 'ourk_3b', kind: 'famille', family: 'ourk', eras: [2], tags: ['Guerre'], art: { motif: 'crown' },
    title: 'La Croisade',
    text: 'Sire Ourquin veut partir en croisade. Contre qui ? « Nous trouverons en route. » Il a déjà l’armure, le cheval, et un étendard avec votre visage, en plus grand.',
    options: [
      { label: 'Bénir la croisade', cost: $('A3'), effect: { gain: $('T6'), loy: { ourk: 2 }, rival: -1, mem: ['ourk_croisade'] },
        reply: 'Il revient deux ans plus tard avec des épices, des reliques douteuses et un chameau qui le suit partout. Il a oublié contre qui il était parti. Il a gagné.' },
      { label: 'Qu’il garde plutôt les remparts', effect: { gain: $('A3'), loy: { ourk: -1 } },
        reply: 'Sire Ourquin fait le tour des remparts en armure, trois fois par jour. Les remparts n’ont jamais été aussi bien gardés, ni aussi agacés.' },
      { label: 'Interdire les croisades', effect: { gain: $('V3'), loy: { ourk: -2, troc: 1 } },
        reply: 'Sire Ourquin accroche l’étendard au-dessus de sa cheminée. Il le salue chaque soir. Votre visage, en grand, le salue aussi.' },
    ],
  }),
  card({
    id: 'sel_3b', kind: 'famille', family: 'sel', eras: [2], tags: ['Foi'], art: { motif: 'scroll' },
    title: 'Les Indulgences',
    text: 'L’abbesse Salière vend des indulgences : un péché pardonné pour trois pièces, deux pour cinq. « Le ciel fait des promotions. » {F:troc} trouve l’idée excellente, et un peu vexante.',
    options: [
      { label: 'Prendre une part', effect: { gain: $('T5'), loy: { sel: 1, troc: -1 }, mem: ['sel_indulgences'] },
        reply: 'Les indulgences se vendent mieux que le pain. Les boulangers demandent s’ils peuvent pécher en gros.' },
      { label: 'Acheter le pardon de toute la cité', cost: $('T4'), effect: { gain: $('V3'), loy: { sel: 2 } },
        reply: 'Toute la cité est pardonnée pour l’année. On en profite un peu trop. L’abbesse propose déjà l’abonnement.' },
      { label: 'Interdire le commerce des péchés', effect: { gain: $('V2'), loy: { sel: -2, brume: 1 } },
        reply: 'L’abbesse range ses tarifs. Elle pardonne toujours, gratuitement, mais en soupirant très fort.' },
    ],
  }),
  card({
    id: 'brume_3b', kind: 'famille', family: 'brume', eras: [2], tags: ['Science'], art: { motif: 'star' },
    title: 'L’Alchimiste',
    text: 'Frère Brumaire promet de changer le plomb en or. Il lui faut du plomb, de l’or (pour comparer) et une tour où personne ne pose de questions.',
    options: [
      { label: 'Lui donner la tour', cost: $('T4'), effect: { gain: $('S5'), loy: { brume: 2 }, mem: ['brume_alchimie'] },
        reply: 'Pas d’or, mais de l’acide, de la poudre, et trois découvertes que frère Brumaire juge décevantes. Le plomb est devenu du plomb très propre.' },
      { label: 'Du plomb, pas d’or', cost: $('S1'), effect: { gain: $('S2'), loy: { brume: -1 } },
        reply: 'Frère Brumaire change le plomb en plomb. Il appelle ça une étape.' },
      { label: 'Le dénoncer à l’abbesse', effect: { loy: { brume: -2, sel: 1 }, gain: $('V2') },
        reply: 'L’abbesse confisque les fioles et les range dans la crypte, à côté des reliques. Certaines brillent la nuit. Les reliques aussi, depuis.' },
    ],
  }),
  card({
    id: 'troc_3b', kind: 'famille', family: 'troc', eras: [2], tags: ['Commerce'], art: { motif: 'mask' },
    title: 'La Foire',
    text: 'Maître Troquet organise une grande foire : marchands de partout, jongleurs, un ours qui danse et un homme qui vend des ours qui dansent. « Une foire attire l’argent. Et les pickpockets, qui le font circuler. »',
    options: [
      { label: 'Une foire royale', cost: $('T3'), effect: { gain: $('T7'), loy: { troc: 2 }, mem: ['troc_foire'] },
        reply: 'La foire dure dix jours. Il en reste des écus, des dettes, et trois ours qui refusent de repartir.' },
      { label: 'Une foire taxée', effect: { gain: $('T4'), loy: { troc: -1 } },
        reply: 'Les marchands paient la taxe et la remettent sur le prix des ours. Tout le monde y perd un peu, sauf vous et les ours.' },
      { label: 'Pas de foire : des prières', effect: { gain: $('V2'), loy: { troc: -2, sel: 1 } },
        reply: 'Maître Troquet organise sa foire chez {rival}. Il vous envoie une carte postale. Elle est payante.' },
    ],
  }),
];

/** Rappels de ces souvenirs dans les ères suivantes. */
export const variantRecalls = [
  { family: 'ourk' as const, mem: 'ourk_jeux', line: 'Il montre aux enfants la cicatrice laissée par le lion des jeux. Il ajoute un lion à chaque fois.', tone: 'pos' as const },
  { family: 'sel' as const, mem: 'sel_vestales', line: 'Une flamme brûle dans un coin de la pièce. Elle ne s’est jamais éteinte depuis les vestales. Elle fume beaucoup.', tone: 'pos' as const },
  { family: 'brume' as const, mem: 'brume_levier', line: 'Un levier de bronze est accroché au-dessus de sa porte. Le point d’appui, lui, n’a jamais été trouvé.', tone: 'pos' as const },
  { family: 'troc' as const, mem: 'troc_assurance', line: 'Il vous propose une assurance à chaque rencontre : contre les procès, contre les révoltes, et contre lui.', tone: 'pos' as const },
  { family: 'ourk' as const, mem: 'ourk_croisade', line: 'Un chameau broute dans la cour : le petit-fils du chameau de la croisade. Il suit la famille partout.', tone: 'pos' as const },
  { family: 'sel' as const, mem: 'sel_indulgences', line: 'Elle tient un carnet de vos péchés depuis les indulgences. Des pages sont réservées à l’avance.', tone: 'neg' as const },
  { family: 'brume' as const, mem: 'brume_alchimie', line: 'Une fiole brille sur son bureau. Elle contient du plomb. Du plomb très propre.', tone: 'pos' as const },
  { family: 'troc' as const, mem: 'troc_foire', line: 'Un ours empaillé trône sur son comptoir, descendant d’un ours de la foire. Il est à vendre.', tone: 'pos' as const },
];
