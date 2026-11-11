/**
 * Contenu supplémentaire : des événements qui se répondent d'une ère à l'autre (l'ours, les noces,
 * le philosophe, le recensement…), deux rencontres de plus par route, et trois lettres de la rivale.
 * Chaque suite ne paraît que si le souvenir existe, et cite la décision d'origine.
 */
import { $, card } from './dsl';

export const moreEvents = [
  // ------------------------------------------------------------------ âge de pierre
  card({
    id: 'ev_ours', kind: 'evenement', scale: true, eras: [0], art: { motif: 'fang', hue: 25 },
    title: 'L’Ours',
    text: 'Un ours s’est installé dans la grotte sacrée. {F:sel} y voit un dieu. {F:ourk} y voit un dîner. {F:troc} y voit un spectacle, avec des places assises.',
    options: [
      { label: 'C’est un dieu', cost: $('V2'), effect: { loy: { sel: 2, ourk: -1 }, mem: ['ours_sacre'] }, reply: 'On lui apporte du miel. Il le mange, puis il mange le porteur. Le dieu a ses humeurs.' },
      { label: 'C’est un dîner', cost: $('A2'), effect: { gain: $('V5'), loy: { ourk: 2, sel: -2 }, mem: ['ours_mange'] }, reply: 'Le dieu était délicieux. {F:sel} refuse d’en manger, puis en reprend.' },
      { label: 'C’est un spectacle', effect: { gain: $('T4'), loy: { troc: 2, sel: -1 }, mem: ['ours_montreur'] }, reply: 'L’ours danse sur une patte. {F:troc} vend des billets. L’ours voudrait sa part.' },
    ],
  }),
  card({
    id: 'ev_noces', kind: 'evenement', eras: [0], art: { motif: 'ring', hue: 330 },
    title: 'Les Noces',
    text: 'Le fils de {F:ourk} et la fille de {F:sel} veulent s’unir. Les deux familles sont pour. {H:brume} et {H:troc} trouvent qu’une alliance pareille, ça finit toujours par un coup d’État.',
    options: [
      { label: 'Bénir l’union', cost: $('V3'), effect: { loy: { ourk: 1, sel: 1, brume: -1, troc: -1 }, mem: ['noces'] }, reply: 'Trois jours de fête. Le marié a lutté contre un aurochs. La mariée a prédit qu’il perdrait. Il a perdu.' },
      { label: 'Interdire l’union', effect: { gain: $('T2'), loy: { ourk: -1, sel: -1, brume: 1, troc: 1 }, mem: ['noces_refusees'] }, reply: 'Les deux familles pleurent, chacune de son côté. Les amoureux se voient en cachette. Tout le monde le sait.' },
    ],
  }),
  card({
    id: 'ev_comete_ciel', kind: 'evenement', scale: true, eras: [0], art: { motif: 'comet', hue: 200 },
    title: 'Le Feu tombé du ciel',
    text: 'Une pierre brûlante est tombée près du camp. Elle est encore chaude. Chacun y voit un signe. Pour l’instant, c’est surtout un trou.',
    options: [
      { label: 'Forger la pierre', cost: $('V2'), effect: { gain: $('A4'), loy: { ourk: 1, brume: 1 } }, reply: 'Une lame noire, plus dure que tout. {F:ourk} dort avec. {F:brume} voudrait l’étudier ; {F:ourk} ne dort plus que d’un œil.' },
      { label: 'Adorer la pierre', effect: { gain: $('V3'), loy: { sel: 2, brume: -1 } }, reply: 'On danse autour du trou. La pierre refroidit. On décide qu’elle est apaisée.' },
    ],
  }),

  // ------------------------------------------------------------------ Antiquité
  card({
    id: 'ev_philosophe', kind: 'evenement', scale: true, eras: [1], art: { motif: 'scroll', hue: 210 },
    title: 'Le Philosophe',
    text: 'Un homme en toge pose des questions sur la place. « Pourquoi obéir ? Qui a décidé ? Est-ce que quelqu’un a vu le ciel signer quoi que ce soit ? » La foule adore. {F:sel} beaucoup moins.',
    options: [
      { label: 'L’engager comme précepteur', cost: $('T3'), effect: { gain: $('S4'), loy: { brume: 2, sel: -1 }, mem: ['philosophe_precepteur'] }, reply: 'Il enseigne à votre héritier. Le premier jour, l’enfant demande pourquoi il devrait vous succéder.' },
      { label: 'La ciguë', effect: { loy: { sel: 2, brume: -2 }, mem: ['cigue'] }, reply: 'Il boit sans discuter, pour une fois. Ses élèves notent ses dernières paroles. Elles sont longues.' },
      { label: 'Le laisser parler', effect: { gain: $('S2'), loy: { sel: -1 } }, reply: 'Il parle, la foule écoute, puis rentre dîner. Penser donne faim.' },
    ],
  }),
  card({
    id: 'ev_recensement', kind: 'evenement', scale: true, eras: [1], art: { motif: 'scroll', hue: 40 },
    title: 'Le Recensement',
    text: '{F:troc} veut compter les habitants, pour l’impôt. {F:ourk} veut les compter, pour l’armée. {F:sel} affirme que compter les gens fâche le ciel, sauf ceux qui donnent à la quête.',
    options: [
      { label: 'Compter pour l’impôt', effect: { gain: $('T5'), loy: { troc: 1, sel: -1 }, mem: ['recense'] }, reply: 'Les gens se découvrent nombreux et taxés. Ils se trouvaient mieux avant de le savoir.' },
      { label: 'Compter pour l’armée', effect: { gain: $('A4'), loy: { ourk: 1, sel: -1 }, mem: ['recense'] }, reply: 'Chaque famille déclare un fils de moins qu’elle n’en a. L’armée est plus petite que prévu, mais elle existe.' },
      { label: 'Ne compter personne', effect: { loy: { sel: 1, troc: -1, ourk: -1 } }, reply: 'Personne n’est compté, personne ne paie. Personne ne sait non plus combien vous êtes, vous compris.' },
    ],
  }),
  card({
    id: 'ev_oracle_vapeur', kind: 'evenement', scale: true, eras: [1], art: { motif: 'gear', hue: 205 },
    title: 'La Porte automatique',
    text: '{F:brume} a construit une porte de temple qui s’ouvre toute seule, à la vapeur. {F:sel} voudrait dire que c’est un miracle. {F:brume} voudrait dire que c’est lui.',
    options: [
      { label: 'C’est un miracle', effect: { gain: $('V4'), loy: { sel: 2, brume: -2 }, mem: ['miracle_vapeur'] }, reply: 'Les fidèles accourent. {F:brume} ronge son frein dans les coulisses, en huilant le miracle.' },
      { label: 'C’est de la science', effect: { gain: $('S4'), loy: { brume: 2, sel: -1 } }, reply: 'Les fidèles viennent voir la machine. Ils prient quand même, au cas où.' },
    ],
  }),

  // ------------------------------------------------------------------ Moyen Âge
  card({
    id: 'ev_fete_ours', kind: 'evenement', scale: true, eras: [2], cond: { mem: 'ours_sacre' }, art: { motif: 'fang', hue: 44 },
    title: 'La Fête de l’Ours',
    text: 'Depuis {D:ours_sacre}, on fête l’ours. Le dernier vient de mourir, très vieux et très gras. {F:sel} exige un nouvel ours sacré. Le seul disponible est chez {rival}.',
    options: [
      { label: 'Acheter l’ours de {rival}', cost: $('T4'), effect: { loy: { sel: 2 }, rival: 1 }, reply: '{Reine} vous vend un ours. Il ne comprend que leur langue. Les prières se font désormais avec un interprète.' },
      { label: 'Un homme en costume d’ours', effect: { gain: $('T2'), loy: { sel: -1, troc: 1 } }, reply: 'L’homme en costume fait très bien l’ours. Trop bien : il a mordu un prélat.' },
      { label: 'Fin du culte', effect: { gain: $('V3'), loy: { sel: -2, ourk: 1 } }, reply: '{F:ourk} propose un banquet pour fêter la fin du culte. Le menu est indécent.' },
    ],
  }),
  card({
    id: 'ev_amants', kind: 'evenement', eras: [2], cond: { mem: 'noces_refusees' }, art: { motif: 'ring', hue: 330 },
    title: 'Les Amants',
    text: 'Un jeune Ourquin et une novice Salière se sont enfuis ensemble. Les deux familles vous accusent : {D:noces_refusees}, vous aviez interdit une union pareille. Elles se sont mises d’accord pour vous en vouloir.',
    options: [
      { label: 'Les marier, enfin', cost: $('T3'), effect: { loy: { ourk: 1, sel: 1, troc: -1 }, mem: ['noces'] }, reply: 'Mariés en grande pompe, huit siècles en retard. Les deux familles pleurent, ensemble cette fois.' },
      { label: 'Les faire rattraper', cost: $('A2'), effect: { loy: { ourk: -1, sel: -1 } }, reply: 'Rattrapés, séparés. On écrit des chansons sur eux. Vous y jouez le méchant.' },
    ],
  }),
  card({
    id: 'ev_heritier', kind: 'evenement', scale: true, eras: [2], cond: { mem: 'philosophe_precepteur' }, art: { motif: 'crown', hue: 210 },
    title: 'L’Héritier qui pense',
    text: 'Depuis le précepteur engagé {D:philosophe_precepteur}, chaque héritier de la cité a reçu l’éducation du philosophe. Le dernier en date refuse le trône. « Je doute, donc je ne règne pas. »',
    options: [
      { label: 'Le laisser douter', effect: { gain: $('S5'), loy: { brume: 1, ourk: -1 } }, reply: 'Il ouvre une école. Ses élèves doutent de tout, sauf de leur talent.' },
      { label: 'Le couronner de force', cost: $('A2'), effect: { loy: { ourk: 1, brume: -1 } }, reply: 'Il règne en soupirant. Ses décrets commencent tous par « Admettons que ».' },
    ],
  }),
  card({
    id: 'ev_pamphlet', kind: 'evenement', scale: true, eras: [2], art: { motif: 'scroll', hue: 0 },
    title: 'Le Pamphlet',
    text: 'Un pamphlet circule : il raconte vos erreurs, en vers, avec des dessins. Il est très drôle. {F:troc} en a déjà vendu deux mille. Vous en avez lu un, en cachette, et vous avez ri.',
    options: [
      { label: 'Brûler les pamphlets', cost: $('A2'), effect: { loy: { troc: -1, brume: -1, sel: 1 }, mem: ['censure_moyen'] }, reply: 'On brûle tout. Le pamphlet devient un trésor. Les copies se vendent dix fois plus cher.' },
      { label: 'Engager l’auteur', cost: $('T3'), effect: { gain: $('S3'), loy: { brume: 1 } }, reply: 'L’auteur écrit désormais vos discours. Ils sont excellents et légèrement moqueurs.' },
      { label: 'Rire avec tout le monde', effect: { loy: { troc: 1, ourk: -1 } }, reply: 'Vous riez en public. Le peuple vous trouve sympathique. {F:ourk} trouve ça indigne d’un chef.' },
    ],
  }),
  card({
    id: 'ev_sorciere', kind: 'evenement', scale: true, eras: [2], art: { motif: 'flame', hue: 120 },
    title: 'La Guérisseuse',
    text: 'Une guérisseuse soigne les fièvres avec des herbes. {F:sel} l’accuse de sorcellerie. {F:brume} l’accuse de faire de la science sans diplôme. {?mem:bucher|On se souvient du dernier bûcher.|}',
    options: [
      { label: 'Le bûcher', effect: { loy: { sel: 2, brume: -1 }, mem: ['bucher'] }, reply: 'Les fièvres reviennent. On cherche une autre sorcière, pour comprendre.' },
      { label: 'Une chaire à l’université', cost: $('T3'), effect: { gain: $('S3 V2'), loy: { brume: 1, sel: -1 } }, reply: 'Elle enseigne les herbes. {F:brume} assiste aux cours, au fond, avec un faux nez.' },
    ],
  }),

  // ------------------------------------------------------------------ ère industrielle
  card({
    id: 'ev_general_eveque', kind: 'evenement', scale: true, eras: [3], cond: { mem: 'noces' }, art: { motif: 'shield', hue: 30 },
    title: 'Le Général-Évêque',
    text: 'Depuis les noces de {D:noces}, Ourk et Sel ont des descendants communs. Le dernier est à la fois général et évêque. Il bénit ses canons et canonne les hérétiques. Il demande un ministère.',
    options: [
      { label: 'Le ministère de la Guerre sainte', cost: $('T3'), effect: { gain: $('A5'), loy: { ourk: 1, sel: 1, brume: -2 } }, reply: 'Ses régiments chantent des cantiques en chargeant. C’est très efficace et un peu inquiétant.' },
      { label: 'Une paroisse, loin', effect: { loy: { ourk: -1, sel: -1, troc: 1 } }, reply: 'Il part prêcher en garnison. Ses sermons durent trois heures, avec manœuvres.' },
    ],
  }),
  card({
    id: 'ev_suffrage', kind: 'evenement', scale: true, eras: [3], art: { motif: 'scroll', hue: 210 },
    title: 'Le Suffrage',
    text: 'Le peuple veut voter. {?mem:recense|Grâce au vieux recensement, on sait même combien ils sont.|Personne ne sait combien ils sont, mais ils sont nombreux.} Chaque famille veut voter un peu plus que les autres.',
    options: [
      { label: 'Une voix par personne', effect: { gain: $('S3'), loy: { brume: 1, troc: -1, ourk: -1 }, mem: ['suffrage'] }, reply: 'Les premières élections. Vous êtes réélu avec 52 %. Vous auriez préféré 51 : ça fait plus vrai.' },
      { label: 'Une voix par famille', effect: { loy: { ourk: 1, sel: 1, troc: 1, brume: 1 } }, reply: 'Quatre familles, quatre voix, quatre avis. Les élections durent six mois et finissent en banquet.' },
      { label: 'Une voix par pièce d’or', effect: { gain: $('T4'), loy: { troc: 2, sel: -1, brume: -1 } }, reply: '{F:troc} est élu par lui-même, à l’unanimité.' },
    ],
  }),
  card({
    id: 'ev_rail', kind: 'evenement', scale: true, eras: [3], art: { motif: 'road', hue: 30 },
    title: 'Le Chemin de fer',
    text: 'La ligne de chemin de fer doit traverser la ville. Deux tracés : par le vieux cimetière de {H:sel}, ou par les entrepôts de {H:troc}. Les ingénieurs ont une préférence : le plus court.',
    options: [
      { label: 'Par le cimetière', effect: { gain: $('T4'), loy: { sel: -2, troc: 1 }, mem: ['cimetiere_rase'] }, reply: 'Les trains passent sur les tombes. {F:sel} affirme que les morts se plaignent. Les voyageurs aussi : ça secoue.' },
      { label: 'Par les entrepôts', effect: { gain: $('V3'), loy: { troc: -2, sel: 1 } }, reply: '{F:troc} se fait payer ses entrepôts trois fois leur prix, puis ouvre une gare dedans.' },
      { label: 'Un tunnel', cost: $('T6'), effect: { gain: $('S3'), loy: { brume: 2 } }, reply: '{F:brume} creuse un tunnel. Il passe sous le cimetière ET sous les entrepôts, par fierté.' },
    ],
  }),
  card({
    id: 'ev_martyr', kind: 'evenement', scale: true, eras: [3], cond: { mem: 'cigue' }, art: { motif: 'scroll', hue: 0 },
    title: 'Le Martyr',
    text: 'Les étudiants ont retrouvé l’histoire du philosophe empoisonné {D:cigue}. Ils veulent une statue, une journée de deuil et des excuses officielles. Ils sont nombreux et ils ont du temps.',
    options: [
      { label: 'Présenter des excuses', cost: $('T2'), effect: { gain: $('S4'), loy: { brume: 2, sel: -1 } }, reply: 'Vous vous excusez pour un crime vieux de deux mille ans. Les étudiants applaudissent, puis demandent autre chose.' },
      { label: 'Il l’avait cherché', effect: { gain: $('A2'), loy: { brume: -2, ourk: 1 } }, reply: 'Les étudiants occupent l’université. Ils y étaient déjà, mais maintenant ils dorment dedans.' },
    ],
  }),
  card({
    id: 'ev_cirque', kind: 'evenement', scale: true, eras: [3], cond: { mem: 'ours_montreur' }, art: { motif: 'fang', hue: 150 },
    title: 'Le Cirque Troc',
    text: 'Depuis l’ours dansant de {D:ours_montreur}, les {T:troc} ont fait du spectacle une industrie : le Cirque Troc, cent ours et un chapiteau. Ils veulent le statut de monument national.',
    options: [
      { label: 'Monument national', effect: { gain: $('T5'), loy: { troc: 2, sel: -1 } }, reply: 'Le cirque devient sacré. {F:sel} demande si l’on peut prier pendant le numéro des clowns.' },
      { label: 'Libérer les ours', effect: { loy: { troc: -2, brume: 1, sel: 1 }, mem: ['ours_liberes'] }, reply: 'Cent ours en liberté dans la ville. Ils n’ont jamais su faire autre chose que danser. Ils dansent dans les rues.' },
    ],
  }),

  // ------------------------------------------------------------------ ère spatiale
  card({
    id: 'ev_robots', kind: 'evenement', scale: true, eras: [4], art: { motif: 'gear', hue: 190 },
    title: 'Les Robots syndiqués',
    text: 'Les robots de {H:brume} ont créé un syndicat. Ils demandent des congés, une retraite et une prise électrique chacun. {F:ourk} propose de les armer. {F:troc} propose de les vendre à {rival}.',
    options: [
      { label: 'Accorder les congés', cost: $('T4'), effect: { gain: $('S3'), loy: { brume: 1, troc: -1 } }, reply: 'Les robots partent en vacances. Ils reviennent bronzés, ce qui est techniquement impossible.' },
      { label: 'Les armer', effect: { gain: $('A6'), loy: { ourk: 2, brume: -1 }, mem: ['robots_armes'] }, reply: 'Une armée de robots syndiqués. Ils refusent de combattre après 18 heures.' },
      { label: 'Les vendre à {rival}', effect: { gain: $('T6'), rival: -1, loy: { troc: 1, brume: -2 } }, reply: '{Reine} reçoit vos robots. Ils font grève le jour même. {Elle} soupçonne un sabotage. {Elle} a raison.' },
    ],
  }),
  card({
    id: 'ev_capsule', kind: 'evenement', scale: true, eras: [4], art: { motif: 'key', hue: 270 },
    title: 'La Capsule temporelle',
    text: 'On enterre une capsule pour ceux qui viendront après nous. Il reste de la place pour un seul objet. Chaque famille a apporté le sien, et le trouve plus important que celui des autres.',
    qui: { count: 3, option: (f) => ({ label: `L’objet de {H:${f}}`, effect: { loy: { [f]: 2 }, gain: f === 'brume' ? $('S3') : f === 'troc' ? $('T3') : f === 'sel' ? $('V3') : $('A3') }, reply: f === 'ourk' ? 'Une dent de mammouth. Ceux qui l’ouvriront croiront à une arme. Ils auront raison.' : f === 'sel' ? 'Un louveteau en bois, très usé. Ceux qui l’ouvriront ne sauront jamais pourquoi on pleure en le voyant.' : f === 'brume' ? 'Une équation. Elle prouve que la capsule a été une bonne idée. Elle est fausse.' : 'Une facture. Ceux qui l’ouvriront devront la régler, avec les intérêts.' }) },
    options: [],
  }),
  card({
    id: 'ev_retraite', kind: 'evenement', scale: true, eras: [4], art: { motif: 'house', hue: 200 },
    title: 'La Ville sous la mer',
    text: 'Les eaux montent. {F:brume} propose une ville sous la mer. {F:troc} propose une ville sur pilotis, avec péage. {F:sel} propose de prier, ce qui ne coûte rien et ne fait pas de bruit.',
    options: [
      { label: 'Sous la mer', cost: $('S5'), effect: { quartiers: 1, loy: { brume: 2, ourk: -1 } }, reply: 'Un quartier sous la mer. Les poissons regardent par les fenêtres. Ils ont l’air de juger.' },
      { label: 'Sur pilotis, avec péage', cost: $('T4'), effect: { gain: $('T4'), loy: { troc: 2, sel: -1 } }, reply: 'On paie pour rentrer chez soi. On paie aussi pour en sortir. {F:troc} appelle ça la fluidité.' },
      { label: 'Prier', effect: { loy: { sel: 2, brume: -2 }, gain: $('V2') }, reply: 'On prie. L’eau monte un peu moins vite, par politesse peut-être.' },
    ],
  }),
];

export const moreEncounters = [
  // chez les Ourk
  card({
    id: 'r_ourk_veteran', kind: 'rencontre', scale: true, family: 'ourk', art: { motif: 'shield', hue: 8 },
    title: 'Le Vétéran',
    text: 'Un vieux {T:ourk} a fait toutes les guerres, y compris celles qu’on a perdues. Il demande une pension. « Ou une dernière guerre. Ça m’est égal, mais il me faut une des deux. »',
    options: [
      { label: 'Une pension', cost: $('T3'), effect: { loy: { ourk: 2 } }, reply: 'Il touche sa pension et raconte ses guerres au café. Elles deviennent plus glorieuses à chaque tournée.' },
      { label: 'Instructeur des recrues', effect: { gain: $('A3'), loy: { ourk: 1, brume: -1 } }, reply: 'Les recrues apprennent à marcher, à crier et à détester {H:brume}. Le programme est complet.' },
      { label: 'Ni l’une ni l’autre', effect: { gain: $('T1'), loy: { ourk: -2 } }, reply: 'Il repart en grommelant. Toute la caserne grommelle avec lui, par solidarité.' },
    ],
  }),
  card({
    id: 'r_ourk_bete', kind: 'rencontre', scale: true, family: 'ourk', art: { motif: 'fang', hue: 8 },
    title: 'La Bête de guerre',
    text: '{F:ourk} a capturé une bête énorme chez {rival}. Elle a des cornes, des griffes et mauvais caractère. Il veut la dresser pour la bataille. Elle veut manger {F:ourk}.',
    options: [
      { label: 'Qu’il la dresse', cost: $('V3'), effect: { bet: { chance: 0.5, per: { tag: 'Guerre', bonus: 0.12 },
        win: { gain: $('A6'), loy: { ourk: 2 }, rival: -1, reply: 'La bête obéit. {Rival} reçoivent un dessin d’elle. Les négociations deviennent plus faciles.' },
        lose: { loy: { ourk: -1 }, reply: 'La bête s’échappe avec un bout de {F:ourk}. Rien d’important, dit-il. Il compte ses doigts en le disant.' } } } },
      { label: 'La rendre à {rival}', effect: { rival: 1, loy: { ourk: -1 } }, reply: '{Reine} n’avait rien demandé. {Elle} vous remercie quand même, et cherche à qui la rendre à son tour.' },
    ],
  }),
  // chez les Sel
  card({
    id: 'r_sel_pelerinage', kind: 'rencontre', scale: true, family: 'sel', art: { motif: 'road', hue: 44 },
    title: 'Le Pèlerinage',
    text: '{F:sel} organise un pèlerinage vers un lieu saint qui se trouve, par un hasard divin, sur les terres de {rival}. Les pèlerins ont besoin de vivres, d’escorte et de foi. Surtout de vivres.',
    options: [
      { label: 'Le financer', cost: $('V3'), effect: { loy: { sel: 2 }, rival: 1 }, reply: 'Les pèlerins reviennent bénis, épuisés et chargés de souvenirs qu’ils ont achetés à {rival}.' },
      { label: 'Une escorte armée', cost: $('A3'), effect: { loy: { sel: 1, ourk: 1 }, rival: -1, gain: $('T2') }, reply: 'L’escorte protège les pèlerins, puis rapporte quelques reliques qui n’étaient pas à vendre.' },
      { label: 'Prier d’ici', effect: { gain: $('V2'), loy: { sel: -1 } }, reply: '{F:sel} affirme que le ciel accepte les prières à distance, mais qu’il les entend moins bien.' },
    ],
  }),
  card({
    id: 'r_sel_saint', kind: 'rencontre', scale: true, family: 'sel', art: { motif: 'sun', hue: 44 },
    title: 'La Canonisation',
    text: '{F:sel} veut faire un saint. Elle a trois candidats : un ancêtre Ourk qui mangeait des loups, un ancêtre Troc qui a payé le premier temple, et vous, « de votre vivant, ce serait original ».',
    options: [
      { label: 'Saint Ourk', effect: { loy: { ourk: 2, sel: 1, brume: -1 } }, reply: 'Saint Ourk, patron des chasseurs et des indigestions. On le prie avant les banquets.' },
      { label: 'Saint Troc', effect: { gain: $('T4'), loy: { troc: 2, sel: -1 } }, reply: 'Saint Troc, patron des marchands. Ses reliques sont en vente dans toutes les bonnes boutiques.' },
      { label: 'Vous-même', cost: $('T4'), effect: { loy: { sel: 1, ourk: -1, brume: -1, troc: -1 }, mem: ['saint_vivant'] }, reply: 'Vous voilà saint. Il faut désormais faire un miracle par an. Le premier est attendu pour jeudi.' },
    ],
  }),
  // chez les Brume
  card({
    id: 'r_brume_automate', kind: 'rencontre', scale: true, family: 'brume', art: { motif: 'gear', hue: 205 },
    title: 'L’Automate',
    text: '{F:brume} a fabriqué un automate qui joue aux échecs. Il bat tout le monde. {F:ourk} a perdu trois fois, puis l’a frappé. L’automate a gagné aussi ce combat-là.',
    options: [
      { label: 'Le montrer à {rival}', effect: { gain: $('S3'), rival: 1, loy: { brume: 1 } }, reply: '{Reine} perd quatre parties et commande un automate. Le vôtre lui apprend à tricher, en douce.' },
      { label: 'Le faire conseiller', cost: $('S2'), effect: { gain: $('T4'), loy: { brume: 2, ourk: -1 } }, reply: 'L’automate conseille le trésor. Il fait des économies partout, sauf sur l’huile pour ses rouages.' },
      { label: 'Le démonter', effect: { gain: $('A2'), loy: { ourk: 1, brume: -2 } }, reply: 'À l’intérieur, il y avait un très petit homme. Il est très en colère et il joue très bien.' },
    ],
  }),
  card({
    id: 'r_brume_fin', kind: 'rencontre', scale: true, family: 'brume', art: { motif: 'comet', hue: 205 },
    title: 'La Fin du monde',
    text: '{F:brume} a calculé la date de la fin du monde. C’est mardi. Il voudrait l’annoncer. {F:sel} voudrait l’annoncer aussi, mais elle avait prévu jeudi. Elles ne sont pas d’accord sur le jour.',
    options: [
      { label: 'Annoncer mardi', effect: { gain: $('S3'), loy: { brume: 1, sel: -1 } }, reply: 'Mardi passe. {F:brume} trouve une erreur de retenue. Ce sera dans trois cents ans. Il est un peu déçu.' },
      { label: 'Annoncer jeudi', effect: { gain: $('V3'), loy: { sel: 1, brume: -1 } }, reply: 'Jeudi passe. Les dons au temple ont doublé mercredi. {F:sel} parle d’un report, pas d’une erreur.' },
      { label: 'N’annoncer rien', effect: { gain: $('T2') }, reply: 'Le monde continue, en silence. {F:troc} a vendu des abris anti-fin-du-monde. Ils sont très confortables.' },
    ],
  }),
  // chez les Troc
  card({
    id: 'r_troc_loterie', kind: 'rencontre', scale: true, family: 'troc', art: { motif: 'coin', hue: 150 },
    title: 'La Loterie',
    text: '{F:troc} propose une loterie d’État. « Les pauvres paient l’impôt en souriant. C’est l’impôt le plus aimé de l’histoire. » {F:sel} trouve que c’est un péché. Elle a déjà acheté dix billets.',
    options: [
      { label: 'Lancer la loterie', effect: { gain: $('T5'), loy: { troc: 1, sel: -1 } }, reply: 'Le gros lot est gagné par {F:troc}. Une coïncidence, selon {F:troc}.' },
      { label: 'Loterie pour les temples', effect: { gain: $('T2 V2'), loy: { sel: 1, troc: 1 } }, reply: 'On joue pour le ciel. Le ciel ne gagne jamais, mais il ne se plaint pas.' },
      { label: 'Interdire le jeu', effect: { loy: { troc: -1, sel: -1 } }, reply: 'Le jeu continue en cachette. Les cachettes sont tenues par {H:troc}.' },
    ],
  }),
  card({
    id: 'r_troc_monopole', kind: 'rencontre', scale: true, family: 'troc', art: { motif: 'scales', hue: 150 },
    title: 'Le Monopole',
    text: '{F:troc} a acheté tout le sel de la région. Tout. {H:sel} ne savent plus comment bénir l’eau. {F:troc} veut bien vendre, « à prix d’ami, pour les amis, et à prix normal pour {H:sel} ».',
    options: [
      { label: 'Briser le monopole', cost: $('A2'), effect: { gain: $('V3'), loy: { troc: -2, sel: 2 } }, reply: 'Les gardes saisissent le sel. {F:troc} porte plainte contre vous auprès de vous.' },
      { label: 'Taxer le monopole', effect: { gain: $('T5'), loy: { troc: -1, sel: -1 } }, reply: '{F:troc} paie la taxe, puis augmente le sel du double. Vous y gagnez. Tout le monde y perd.' },
      { label: 'Laisser faire', effect: { gain: $('T2'), loy: { troc: 2, sel: -2 } }, reply: '{H:sel} bénissent désormais à l’eau douce. {F:sel} affirme que ça marche moins bien.' },
    ],
  }),
  // la frontière
  card({
    id: 'r_front_refugies', kind: 'rencontre', scale: true, art: { motif: 'road', hue: 0 },
    title: 'Les Réfugiés',
    text: 'Des familles fuient les terres de {rival}. Elles ont faim, froid, et beaucoup à dire sur {reine}. {F:ourk} se méfie. {F:troc} voit de la main-d’œuvre. {F:sel} voit des âmes.',
    options: [
      { label: 'Les accueillir', cost: $('V4'), effect: { gain: $('S2 T2'), rival: -1, loy: { sel: 1, troc: 1, ourk: -1 } }, reply: 'Ils s’installent, travaillent, et racontent tout sur {rival}. Vos espions sont jaloux.' },
      { label: 'Les renvoyer', effect: { gain: $('A2'), rival: 1, loy: { ourk: 1, sel: -2 } }, reply: '{Reine} vous remercie pour votre « compréhension ». {F:sel} prie pour vous, avec reproche.' },
    ],
  }),
  card({
    id: 'r_front_pont', kind: 'rencontre', scale: true, art: { motif: 'arch', hue: 0 },
    title: 'Le Pont',
    text: 'Un pont relie vos terres à celles de {rival}. Il est vieux et branlant. Chacun dit que l’autre doit le réparer. Pendant ce temps, les chèvres traversent sans payer.',
    options: [
      { label: 'Le réparer seul', cost: $('T3'), effect: { gain: $('T2'), rival: 1, loy: { troc: 1 } }, reply: 'Le pont est neuf. Les marchands de {rival} passent par chez vous. Ils paient.' },
      { label: 'Le faire sauter', cost: $('A1'), effect: { rival: -1, loy: { ourk: 1, troc: -1 } }, reply: 'Plus de pont. {Rival} devront faire le tour. Les chèvres aussi, et elles sont furieuses.' },
      { label: 'Un péage', effect: { gain: $('T4'), rival: -1, loy: { troc: 1 } }, reply: 'Les chèvres de {reine} paient désormais le passage. {Elle} vous envoie une lettre de protestation, et une chèvre.' },
    ],
  }),
  // l'inconnu
  card({
    id: 'r_inc_grotte', kind: 'rencontre', scale: true, art: { motif: 'eye', hue: 280 },
    title: 'La Grotte qui répond',
    text: 'Au fond d’une grotte, l’écho répond aux questions. Pas avec vos mots : avec les siens. Il connaît des choses. Il demande une offrande, et il précise laquelle.',
    options: [
      { label: 'Lui demander l’avenir', cost: $('V3'), effect: { gain: $('S4'), loy: { sel: 1 } }, reply: 'L’écho annonce « des ennuis, puis d’autres ennuis, puis une très belle tour ». C’est assez exact.' },
      { label: 'Lui demander de l’or', cost: $('S2'), effect: { gain: $('T5'), loy: { troc: 1, brume: -1 } }, reply: 'L’écho indique une cachette. Il y a de l’or, et une note : « Rendez-le après. » Vous ne le rendez pas.' },
      { label: 'Ne rien demander', effect: { loy: { brume: 1 } }, reply: '{F:brume} explique l’écho par la géométrie. L’écho répond « menteur ». La géométrie ne dit rien.' },
    ],
  }),
  card({
    id: 'r_inc_jumeau', kind: 'rencontre', scale: true, art: { motif: 'mask', hue: 280 },
    title: 'Le Sosie',
    text: 'Un voyageur vous ressemble trait pour trait. Il dit venir d’une cité « exactement comme la vôtre, mais qui a pris l’autre route ». Il a l’air fatigué et il a beaucoup de conseils.',
    options: [
      { label: 'Écouter ses conseils', effect: { gain: $('S3'), loy: { brume: 1 } }, reply: 'Il vous dit de ne jamais faire ce que vous alliez faire. Il ne dit pas quoi. Il repart en soupirant.' },
      { label: 'Le garder comme double', cost: $('T2'), effect: { gain: $('A2'), loy: { ourk: 1 } }, reply: 'Il assiste aux banquets à votre place. Les familles le préfèrent un peu. Il écoute mieux.' },
      { label: 'Le chasser', effect: { loy: { sel: 1 } }, reply: 'Il part. {F:sel} jure qu’il n’avait pas d’ombre. Vous vérifiez la vôtre, par précaution.' },
    ],
  }),
];

export const moreRival = [
  card({
    id: 'v_portrait', kind: 'rivale', scale: true, eras: [1, 2, 3, 4], art: { motif: 'mask', hue: 0 }, speaker: '{Reine}',
    title: 'Le Portrait',
    text: '{Reine} fait circuler un portrait de vous. Vous y avez un nez immense et un trône minuscule. Il se vend très bien, même chez vous. Surtout chez vous.',
    options: [
      { label: 'Riposter par un portrait', cost: $('T3'), effect: { rival: -1, loy: { troc: 1, brume: 1 } }, reply: 'Votre peintre lui fait des oreilles de lièvre. La guerre des portraits commence. L’art n’a jamais été aussi vivant.' },
      { label: 'Ignorer', effect: { loy: { ourk: -1 } }, reply: 'Le portrait passe de mode. Il reste un mot nouveau dans la langue : « avoir un nez de chef ».' },
      { label: 'Acheter toutes les copies', cost: $('T5'), effect: { loy: { troc: 2 }, rival: 1 }, reply: '{F:troc} vous les vend. Il en fait imprimer d’autres pendant que vous payez.' },
    ],
  }),
  card({
    id: 'v_invitation', kind: 'rivale', scale: true, eras: [0, 1, 2, 3, 4], art: { motif: 'crown', hue: 268 }, speaker: '{Reine}',
    title: 'L’Invitation',
    text: '{Reine} donne une fête et vous invite. « Venez comme vous êtes. Enfin, pas tout à fait comme vous êtes. » Il faudra un cadeau, une tenue et un sourire. Le sourire sera le plus cher.',
    options: [
      { label: 'Y aller', cost: $('T3'), effect: { rival: 2, gain: $('S2') }, reply: 'Vous dansez avec {reine}. {Elle} vous marche sur le pied, deux fois, avec précision.' },
      { label: 'Envoyer {F:ourk}', effect: { rival: -1, loy: { ourk: 2 } }, reply: '{F:ourk} a cassé un vase, un buffet et un ambassadeur. Il a trouvé la fête excellente.' },
      { label: 'Décliner', effect: { rival: -1 }, reply: '{Reine} vous répond qu’on vous a beaucoup regretté. La lettre sent le parfum et la vengeance.' },
    ],
  }),
  card({
    id: 'v_cadeau', kind: 'rivale', scale: true, eras: [1, 2, 3, 4], art: { motif: 'key', hue: 140 }, speaker: '{Reine}',
    title: 'Le Cadeau',
    text: '{Reine} vous offre un cadeau magnifique : un cheval de bois géant, « en gage d’amitié ». {F:brume} trouve qu’il sonne creux. {F:troc} trouve qu’il vaut cher, creux ou pas.',
    options: [
      { label: 'Le faire entrer', effect: { bet: { chance: 0.6, win: { gain: $('T6'), rival: 1, reply: 'Le cheval était juste un cheval. {Reine} est vexée qu’on ait eu peur. Un peu.' }, lose: { quartiers: -1, cause: 'le cadeau de la rivale', rival: -1, reply: 'Le cheval était plein de soldats. Ils ont pris un quartier, puis ils ont dit merci pour l’accueil.' } } } },
      { label: 'Le brûler devant la porte', effect: { gain: $('A2'), rival: -1, loy: { brume: 1 } }, reply: 'Il brûle bien. Personne n’en sort. {Reine} vous écrit que c’était un cheval, simplement un cheval.' },
      { label: 'L’offrir à {H:troc}', effect: { loy: { troc: 2 } }, reply: '{F:troc} l’installe devant sa boutique. Une nuit, la boutique est pillée de l’intérieur. Il ne porte pas plainte.' },
    ],
  }),
];
