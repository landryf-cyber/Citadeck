/**
 * Variantes des cartes de famille pour l'ère industrielle et l'ère spatiale : la graine choisit
 * entre la carte d'origine et sa variante, pour que deux parties ne racontent pas la même histoire.
 */
import { $, card } from './dsl';

export const familyAltCards = [
  // ------------------------------------------------------------------ ère industrielle
  card({
    id: 'ourk_4b', kind: 'famille', family: 'ourk', eras: [3], tags: ['Guerre'], art: { motif: 'bird' },
    title: 'Le Dirigeable',
    text: '« Le colonel Ourkov veut un dirigeable de guerre. Il flotte, il bombarde, il fait peur. Le colonel a le vertige, mais le colonel ira quand même. »',
    options: [
      { label: 'Un dirigeable de guerre', cost: $('T5'), effect: { gain: $('A6'), loy: { ourk: 2, brume: -1 }, rival: -1, mem: ['zeppelin'] },
        reply: 'Le dirigeable survole la frontière. {Rival} lèvent les yeux, puis construisent des parapluies blindés.' },
      { label: 'Un dirigeable de croisière', cost: $('T3'), effect: { gain: $('T4'), loy: { troc: 1, ourk: -1 } },
        reply: 'On sert le thé à mille mètres. Le colonel Ourkov fait le service, en uniforme, très raide.' },
      { label: 'Les chevaux suffisent', effect: { gain: $('V2'), loy: { ourk: -1, sel: 1 } },
        reply: 'Le colonel garde ses chevaux. Il leur parle de dirigeables, le soir, dans l’écurie.' },
    ],
  }),
  card({
    id: 'sel_4b', kind: 'famille', family: 'sel', eras: [3], tags: ['Foi'], art: { motif: 'bell' },
    title: 'La Radio du dimanche',
    text: 'La prieure Salin veut prêcher à la radio. « Le ciel sera dans chaque cuisine. » {F:brume} fait remarquer que c’est lui qui a inventé la radio. La prieure fait remarquer que c’est le ciel qui a inventé {F:brume}.',
    options: [
      { label: 'Une radio pour l’Église', cost: $('T4'), effect: { gain: $('V4'), loy: { sel: 2, brume: -1 }, mem: ['radio_sel'] },
        reply: 'Le sermon du dimanche passe dans toutes les cuisines. Les gens prient en épluchant les pommes de terre.' },
      { label: 'Une radio d’État', cost: $('T2'), effect: { gain: $('S3'), loy: { brume: 1, sel: -1 } },
        reply: 'La radio donne la météo, l’heure et vos discours. La météo a plus de succès.' },
      { label: 'Le ciel n’a pas besoin d’antenne', effect: { loy: { sel: -2, ourk: 1 } },
        reply: 'La prieure prêche du haut du clocher, très fort. On l’entend jusqu’à la frontière, par vent favorable.' },
    ],
  }),
  card({
    id: 'brume_4b', kind: 'famille', family: 'brume', eras: [3], tags: ['Science'], art: { motif: 'gear' },
    title: 'L’Électricité',
    text: 'Le docteur Brumel veut électrifier la ville. « Plus de bougies, plus de nuit, plus d’excuses pour dormir. » {F:sel} fait remarquer que la nuit, c’est le ciel qui l’a voulue.',
    options: [
      { label: 'Toute la ville', cost: $('T6'), effect: { gain: $('S4 T2'), loy: { brume: 2, sel: -1 }, mem: ['electricite'] },
        reply: 'La ville s’allume d’un coup. Les chiens aboient, les chats partent, les poètes perdent leur sujet.' },
      { label: 'Seulement le palais', cost: $('T2'), effect: { gain: $('S2'), loy: { brume: 1, troc: -1, sel: -1 } },
        reply: 'Le palais brille dans la ville noire. On le voit de très loin. On vous voit aussi, et on vous juge.' },
      { label: 'La bougie suffit', effect: { gain: $('V2'), loy: { brume: -2, sel: 1 } },
        reply: 'Le docteur Brumel range ses câbles. Il garde une ampoule allumée dans son bureau, par principe.' },
    ],
  }),
  card({
    id: 'troc_4b', kind: 'famille', family: 'troc', eras: [3], tags: ['Commerce'], art: { motif: 'mask' },
    title: 'La Réclame',
    text: 'Troc et Fils a couvert la ville d’affiches : votre visage vante un savon. « Votre visage inspire confiance. Le savon, moins. Ensemble, c’est un succès. »',
    options: [
      { label: 'Toucher sa part', effect: { gain: $('T5'), loy: { troc: 1, ourk: -1 } },
        reply: 'Vous touchez votre part. Les enfants vous reconnaissent dans la rue et vous demandent si le savon pique.' },
      { label: 'Exiger qu’on retire tout', effect: { loy: { troc: -2, ourk: 1 } },
        reply: 'Les affiches tombent. Troc et Fils les remplace par votre statue en savon. C’est pire.' },
      { label: 'Vendre aussi le dentifrice', cost: $('T2'), effect: { gain: $('T7'), loy: { troc: 2, sel: -1 } },
        reply: 'Votre sourire est partout. {F:sel} dit que c’est de l’idolâtrie. Elle a quand même acheté le dentifrice.' },
    ],
  }),

  // ------------------------------------------------------------------ ère spatiale
  card({
    id: 'ourk_5b', kind: 'famille', family: 'ourk', eras: [4], tags: ['Guerre'], art: { motif: 'star' },
    title: 'Le Drapeau sur Mars',
    text: '« OURK-7 A PLANTÉ UN DRAPEAU SUR MARS. MARS EST À VOUS. MARS NE LE SAIT PAS ENCORE. OURK-7 PROPOSE DE LE LUI APPRENDRE. »',
    options: [
      { label: 'Une base militaire', cost: $('T6'), effect: { gain: $('A7'), loy: { ourk: 2, brume: -1 }, mem: ['mars'] },
        reply: 'OURK-7 RÈGNE SUR MARS. MARS EST CALME. MARS A TOUJOURS ÉTÉ CALME. OURK-7 PREND ÇA POUR UNE VICTOIRE.' },
      { label: 'Une colonie de savants', cost: $('S5'), effect: { gain: $('S6'), loy: { brume: 2, ourk: -1 } },
        reply: 'Les savants découvrent sur Mars des cailloux très intéressants. Ils en rapportent beaucoup. Ce sont des cailloux.' },
      { label: 'Rendre Mars aux Martiens', effect: { loy: { ourk: -2, sel: 1 } },
        reply: 'Personne ne réclame Mars. L’amiral Ourk-7 laisse le drapeau, au cas où quelqu’un passerait.' },
    ],
  }),
  card({
    id: 'sel_5b', kind: 'famille', family: 'sel', eras: [4], tags: ['Foi'], art: { motif: 'eye' },
    title: 'Le Clone de Mère Sel',
    text: 'La révérende Sel a fait cloner Mère Sel, la toute première, à partir d’un cheveu. Le clone ouvre les yeux, regarde la ville et dit : « Je l’avais prédit. » Elle tend la main.',
    options: [
      { label: 'La proclamer prophétesse', cost: $('T4'), effect: { gain: $('V5'), loy: { sel: 2, brume: -1 }, mem: ['clone_sel'] },
        reply: 'Mère Sel prêche comme il y a dix mille ans. Elle ne comprend rien aux ascenseurs. Les fidèles adorent.' },
      { label: 'Lui demander ses souvenirs', cost: $('S3'), effect: { gain: $('S5'), loy: { brume: 1, sel: 1 } },
        reply: 'Mère Sel raconte l’âge de pierre. Tout le monde y était malheureux, sauf Ourk, qui mangeait bien.' },
      { label: 'La renvoyer au musée', effect: { loy: { sel: -2, troc: 1 } },
        reply: 'Mère Sel visite son propre rocher au musée. Elle corrige les fautes de la plaque, en pleurant un peu.' },
    ],
  }),
  card({
    id: 'brume_5b', kind: 'famille', family: 'brume', eras: [4], tags: ['Science'], art: { motif: 'spiral' },
    title: 'L’Immortalité',
    text: 'BRUME propose de copier votre esprit dans ses serveurs. « Vous serez immortel. En principe. Vous serez aussi très petit, et dans une boîte. » Les familles attendent votre réponse avec intérêt.',
    options: [
      { label: 'Se faire copier', cost: $('S6'), effect: { gain: $('S4'), loy: { brume: 2, sel: -2 }, mem: ['esprit_copie'] },
        reply: 'Vous êtes deux. Votre copie travaille la nuit, sans se plaindre. Elle prend de meilleures décisions. C’est vexant.' },
      { label: 'Copier les familles', cost: $('S4'), effect: { loy: { brume: 1, ourk: -1, troc: 1 } },
        reply: 'Les copies des familles se disputent dans les serveurs, exactement comme les vraies. BRUME demande un serveur de plus.' },
      { label: 'Rester mortel', effect: { gain: $('V2'), loy: { brume: -1, sel: 1 } },
        reply: 'Vous restez mortel, et fier de l’être. BRUME note la date de votre fin probable. {Il:brume} ne vous la dit pas.' },
    ],
  }),
  card({
    id: 'troc_5b', kind: 'famille', family: 'troc', eras: [4], tags: ['Commerce'], art: { motif: 'moon' },
    title: 'La Lune à vendre',
    text: 'TrocCorp a acheté la Lune. Il vend des parcelles avec vue sur la Terre. « La vôtre est la meilleure. Elle a vue sur votre propre palais. Prix d’ami. »',
    options: [
      { label: 'Acheter une parcelle', cost: $('T5'), effect: { gain: $('S2'), loy: { troc: 2 }, mem: ['lune'] },
        reply: 'Vous possédez un cratère. Vous le regardez chaque soir au télescope. Il ne se passe rien, mais c’est à vous.' },
      { label: 'Taxer les ventes', effect: { gain: $('T6'), loy: { troc: -2 } },
        reply: 'Chaque parcelle vendue vous rapporte. TrocCorp répercute la taxe sur la Lune, qui ne dit rien.' },
      { label: 'Décréter la Lune à tous', effect: { loy: { troc: -1, sel: 1, brume: 1 } },
        reply: 'La Lune est à tout le monde. TrocCorp vend désormais des places de parking autour.' },
    ],
  }),
];

/** Rappels de ces souvenirs dans les ères suivantes. */
export const familyAltRecalls = [
  { family: 'ourk' as const, mem: 'zeppelin', line: 'Une maquette de dirigeable pend au plafond de son bureau. Il la regarde comme on regarde une ancienne fiancée.', tone: 'pos' as const },
  { family: 'sel' as const, mem: 'radio_sel', line: 'Elle parle comme à la radio, même en tête-à-tête. Elle laisse des silences pour la publicité.', tone: 'pos' as const },
  { family: 'brume' as const, mem: 'electricite', line: 'Une ampoule grésille au-dessus de sa porte. C’est la première de la ville. {Il:brume} refuse qu’on la change.', tone: 'pos' as const },
];
