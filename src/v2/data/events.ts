/** Événements d'ère, et quelques suites qui n'appartiennent à aucune famille. */
import { $, card } from './dsl';

export const eventCards = [
  // ------------------------------------------------------------------ ère I
  card({
    id: 'ev_hiver', kind: 'evenement', eras: [0], art: { motif: 'moon', hue: 210 },
    title: 'Les Anciens',
    text: 'Les anciens annoncent un hiver long. Ils l’annoncent chaque année. Une année, ils auront raison, et ils ne vous le pardonneront pas.',
    options: [
      { label: 'Stocker', cost: $('T2'), effect: { gain: $('V5'), loy: { sel: 1 } }, reply: 'L’hiver fut doux. Les anciens sont insupportables. Les greniers, pleins.' },
      { label: 'Ils radotent', effect: { gain: $('T2'), sched: [{ card: 'ev_hiver_2', in: 4 }] }, reply: 'Les anciens se taisent. Ils regardent le ciel avec une patience inquiétante.' },
    ],
  }),
  card({
    id: 'ev_hiver_2', kind: 'intrigue', arc: 'hiver', finale: true, art: { motif: 'moon', hue: 210 },
    title: 'L’Hiver, vraiment',
    text: 'Les anciens avaient raison. Il neige depuis quarante jours. Ils ne disent rien. Ils sourient, et c’est pire.',
    options: [
      { label: 'Rationner', cost: $('V4'), effect: { loy: { sel: 1 } }, reply: 'Tout le monde a faim, équitablement. Les anciens prennent double ration, pour l’expérience.' },
      { label: 'Manger les chevaux', effect: { gain: $('A-3 V3') }, reply: 'On survit. Au printemps, {H:ourk} tireront les chariots eux-mêmes.' },
    ],
  }),
  card({
    id: 'ev_peintre', kind: 'evenement', eras: [0], tags: ['Culture'], art: { motif: 'hand', hue: 300 },
    title: 'Les Mains sur la paroi',
    text: 'Quelqu’un a peint des mains sur la paroi de la grotte. Des centaines. Personne ne sait qui. Ourk soupçonne Brume. Brume soupçonne l’art.',
    options: [
      { label: 'Encourager l’artiste', cost: $('V2'), effect: { gain: $('T3'), mem: ['art_grotte'] }, reply: 'Les mains se multiplient. Il y en a une qui fait un geste grossier vers la hutte d’Ourk.' },
      { label: 'Chasser plutôt', effect: { gain: $('V3') }, reply: 'On chasse. Les mains restent sur la paroi. Elles ont l’air d’attendre.' },
    ],
  }),
  card({
    id: 'ev_etranger', kind: 'evenement', scale: true, eras: [0, 1], art: { motif: 'mask', hue: 268 },
    title: 'L’Étranger',
    text: 'Un inconnu parle une langue bizarre. Il dessine des cartes de chez {rival}. Il a très faim et un sourire très large.',
    options: [
      { label: 'L’accueillir', cost: $('V2'), effect: { gain: $('S3'), rival: 1, mem: ['etranger_accueilli'] }, reply: 'Il dessine, mange, dessine. Ses cartes sont fausses, mais très belles.' },
      { label: 'Le renvoyer', effect: { gain: $('A1'), rival: -1 }, reply: 'Il repart chez {rival}. Avec vos cartes à vous, qu’il a dessinées en mangeant.' },
    ],
  }),

  // ------------------------------------------------------------------ ère II
  card({
    id: 'ev_statue', kind: 'evenement', eras: [1], tags: ['Culture'], art: { motif: 'crown', hue: 40 },
    title: 'La Statue',
    text: 'Un sculpteur propose une statue de vous. Très grande. Très chère. « Les statues durent plus longtemps que les rois. C’est un argument. »',
    options: [
      { label: 'Très grande', cost: $('T5'), effect: { mem: ['statue'], sched: [{ card: 'ev_statue_2', in: 6 }] }, reply: 'On la voit de loin. On vous voit de loin. Le sculpteur a exagéré le menton.' },
      { label: 'Un buste suffira', effect: { gain: $('T2'), loy: { ourk: -1 } }, reply: 'Un buste modeste. {F:ourk} trouve ça suspect. Les rois modestes cachent quelque chose.' },
    ],
  }),
  card({
    id: 'ev_statue_2', kind: 'intrigue', arc: 'statue', finale: true, art: { motif: 'crown', hue: 40 },
    title: 'La Statue, encore',
    text: 'Votre statue attire les foules. {Rival} viennent la voir et rient de votre menton. On pourrait faire payer l’entrée. Ou la tête.',
    options: [
      { label: 'Faire payer l’entrée', effect: { gain: $('T6'), rival: -1 }, reply: 'Des files d’attente. Des souvenirs. Votre menton en porte-clés.' },
      { label: 'Entrée libre', effect: { gain: $('V2'), rival: 1, loy: { sel: 1 } }, reply: 'Tout le monde l’adore. Même {reine}, qui en commande une copie, plus petite.' },
    ],
  }),
  card({
    id: 'ev_jeux', kind: 'evenement', scale: true, eras: [1, 2], art: { motif: 'ring', hue: 30 },
    title: 'Les Jeux',
    text: 'Les jeux des cités voisines commencent. Il faut envoyer des athlètes. Ou des espions déguisés en athlètes, qui courent moins vite.',
    options: [
      { label: 'Des athlètes', cost: $('V2'), effect: { rival: 1, bet: { chance: 0.5, per: { tag: 'Guerre', bonus: 0.1 },
        win: { gain: $('T5'), loy: { ourk: 1 }, reply: 'Une couronne de laurier ! Ça ne se mange pas, mais ça se revend.' },
        lose: { reply: '{Rival} gagnent tout. {Reine} vous envoie un laurier, par pitié.' } } } },
      { label: 'Des espions', effect: { gain: $('S4'), rival: -1 }, reply: 'Vos espions arrivent derniers à toutes les courses. Mais ils connaissent les plans de {rival}.' },
    ],
  }),
  card({
    id: 'ev_inflation', kind: 'intrigue', arc: 'monnaie', finale: true, art: { motif: 'coin', hue: 150 },
    title: 'L’Inflation',
    text: 'Le pain coûte un sac de pièces. Le sac coûte deux sacs. {F:troc} propose de vous racheter vos pièces, au poids.',
    options: [
      { label: 'Fondre la moitié', effect: { gain: $('T-5'), loy: { troc: 1 } }, reply: 'La monnaie vaut quelque chose. Il n’y en a plus. Équilibre.' },
      { label: 'Frapper encore', effect: { gain: $('T4 V-4'), loy: { sel: -1 } }, reply: 'Des brouettes de pièces. Le pain est en rupture. Les brouettes aussi.' },
    ],
  }),

  // ------------------------------------------------------------------ ère III
  card({
    id: 'ev_croisade', kind: 'evenement', eras: [2], tags: ['Foi', 'Guerre'], art: { motif: 'shield', hue: 44 },
    title: 'L’Appel',
    text: 'Un prédicateur appelle à une guerre sainte, très loin. {H:ourk} s’ennuient. {H:sel} s’enflamment. {H:troc} louent des bateaux.',
    options: [
      { label: 'Qu’ils partent', effect: { gain: $('A-3 T4'), loy: { ourk: 1, sel: 1, troc: 1 }, sched: [{ card: 'ev_croisade_2', in: 7 }] }, reply: 'Le château est calme. Trop calme. Les bateaux de {F:troc} sont pleins.' },
      { label: 'Personne ne part', effect: { gain: $('A2'), loy: { ourk: -1, sel: -1 } }, reply: 'Ils restent. Ils s’ennuient. Ils ont trouvé une taverne, puis une autre.' },
    ],
  }),
  card({
    id: 'ev_croisade_2', kind: 'intrigue', arc: 'croisade', finale: true, art: { motif: 'shield', hue: 44 },
    title: 'Le Retour',
    text: 'Les croisés reviennent. Riches, malades, et très sûrs d’eux. Ils rapportent des reliques, des épices et une fièvre qui n’a pas de nom.',
    options: [
      { label: 'Accueil triomphal', effect: { gain: $('T5 A3'), loy: { ourk: 1 }, bet: { chance: 0.6, per: { tag: 'Science', bonus: 0.1 }, win: { reply: 'Reliques, épices, gloire. La fièvre est restée sur le bateau.' }, lose: { quartiers: -1, cause: 'la fièvre des croisés', reply: 'Reliques, épices, gloire, et la fièvre. Un quartier en meurt.' } } } },
      { label: 'Quarantaine', cost: $('V3'), effect: { gain: $('T3'), loy: { ourk: -1 } }, reply: 'Ils attendent devant les murs. Ils prient très fort. Ils vous maudissent aussi, très fort.' },
    ],
  }),
  card({
    id: 'ev_heretique', kind: 'evenement', eras: [2], tags: ['Foi'], art: { motif: 'flame', hue: 20 },
    title: 'L’Hérétique',
    text: 'Une femme prêche que Dieu n’a pas besoin d’intermédiaires. {F:sel} est un intermédiaire. {F:sel} demande un bûcher.',
    options: [
      { label: 'Le bûcher', effect: { loy: { sel: 2, brume: -1 }, gain: $('V2'), mem: ['bucher'] }, reply: 'L’ordre est rétabli. La foule a retenu son visage. Elle le peint, en cachette.' },
      { label: 'La laisser prêcher', effect: { loy: { sel: -2 }, gain: $('S3 T2') }, reply: '{F:sel} fulmine. La foule réfléchit. Dangereux, les deux.' },
    ],
  }),
  card({
    id: 'ev_horloge', kind: 'evenement', scale: true, eras: [2, 3], art: { motif: 'gear', hue: 40 },
    title: 'L’Horloge',
    text: 'Une horloge sur la place sonne les heures. Les gens arrivent à l’heure. Personne ne sait si c’est un progrès ou une malédiction.',
    options: [
      { label: 'Une horloge par quartier', cost: $('T3'), effect: { gain: $('S2 V2'), loy: { brume: 1 } }, reply: 'Tout le monde est à l’heure. Les retardataires sont mal vus. Les ponctuels aussi.' },
      { label: 'Arrêter l’horloge', effect: { loy: { sel: 1, troc: -1 } }, reply: 'Le temps s’arrête, officiellement. {F:troc} perd des millions en intérêts.' },
    ],
  }),

  // ------------------------------------------------------------------ ère IV
  card({
    id: 'ev_journal', kind: 'evenement', eras: [3], tags: ['Culture'], art: { motif: 'scroll', hue: 0 },
    title: 'Le Journal',
    text: 'Un journal paraît chaque matin. Il vous dessine en cochon. Les ventes explosent. Le dessinateur demande une audience, pour croquer d’après nature.',
    options: [
      { label: 'Liberté de la presse', effect: { gain: $('S3 T2'), loy: { ourk: -1 } }, reply: 'Ils vous dessinent en cochon tous les jours. Vous devenez populaire, comme les cochons.' },
      { label: 'Censure', effect: { gain: $('A2'), loy: { brume: -1, troc: -1 }, mem: ['censure'] }, reply: 'Le journal parle de la pluie. Beaucoup de pluie. Il pleut sur votre réputation.' },
    ],
  }),
  card({
    id: 'ev_exposition', kind: 'evenement', eras: [3], tags: ['Culture', 'Commerce'], art: { motif: 'tower', hue: 40 },
    title: 'La Course aux colonies',
    text: '{Rival} plantent leurs drapeaux sur des terres lointaines. Vos ministres veulent les vôtres. Les terres lointaines n’ont rien demandé.',
    options: [
      { label: 'Planter le drapeau', cost: $('A3'), effect: { gain: $('T6 V2'), rival: -1, sched: [{ card: 'ev_colonies_2', in: 6 }] }, reply: 'Du sucre, du café, du coton. Les nouvelles de là-bas sont moins sucrées.' },
      { label: 'Rester chez soi', effect: { gain: $('S2'), rival: 1 }, reply: '{Rival} ont du sucre. Vous avez la conscience tranquille. Elle n’est pas sucrée.' },
    ],
  }),
  card({
    id: 'ev_colonies_2', kind: 'intrigue', arc: 'colonies', finale: true, art: { motif: 'ship', hue: 20 },
    title: 'Les Comptoirs se révoltent',
    text: 'Les colonies se révoltent. Elles ont appris la guerre. De vous, essentiellement.',
    options: [
      { label: 'Tenir', warn: 'Sans 14 Armée, un quartier tombe',
        effect: { if: { res: $('A14') }, then: { gain: $('A-4 T4'), reply: 'Tenu. À quel prix, personne ne compte. Les comptables refusent.' },
          else: { quartiers: -1, cause: 'la révolte des colonies', reply: 'Les colonies ont gagné. Elles gardent le sucre. Et un quartier de marchands.' } } },
      { label: 'Partir', effect: { gain: $('T-3'), loy: { troc: -1 }, rival: 1 }, reply: 'Les bateaux rentrent, vides. Les colonies deviennent des pays. Ils vous envoient des cartes postales.' },
    ],
  }),
  card({
    id: 'ev_greve_mineurs', kind: 'evenement', eras: [3], art: { motif: 'hand', hue: 30 },
    title: 'Les Mineurs',
    text: 'Les mineurs arrêtent le travail. Sans charbon, rien ne tourne : ni les usines, ni les trains, ni vous.',
    options: [
      { label: 'Négocier', cost: $('T4'), effect: { loy: { sel: 1, troc: -1 } }, reply: 'Dix heures par jour au lieu de quatorze. {F:troc} pleure, avec des larmes de quatorze heures.' },
      { label: 'Briser la grève', warn: 'Sans 13 Armée, un quartier brûle',
        effect: { if: { res: $('A13') }, then: { gain: $('T4'), loy: { sel: -1, troc: 1 }, reply: 'La mine rouvre. Il y a eu des coups de feu. On en reparlera, longtemps.' },
          else: { quartiers: -1, cause: 'la grève des mineurs', reply: 'La troupe ne passe pas. Le quartier des mines s’éteint, lampe par lampe.' } } },
    ],
  }),

  // ------------------------------------------------------------------ ère V
  card({
    id: 'ev_reseau', kind: 'evenement', eras: [4], art: { motif: 'ring', hue: 200 },
    title: 'Le Réseau',
    text: 'Tout le monde est connecté à tout le monde. Tout le monde s’insulte. {H:troc} vendent les insultes. {H:brume} les comptent.',
    options: [
      { label: 'Laisser couler', effect: { gain: $('T4 S2'), loy: { sel: -1 } }, reply: 'Le savoir circule. Les rumeurs aussi, plus vite. Elles ont plus d’abonnés.' },
      { label: 'Tout filtrer', cost: $('S3'), effect: { gain: $('A3'), loy: { troc: -1, brume: -1 } }, reply: 'Calme plat. Un calme de salle d’attente. Tout le monde attend quelque chose.' },
    ],
  }),
  card({
    id: 'ev_clone', kind: 'evenement', eras: [4], art: { motif: 'mask', hue: 160 },
    title: 'Votre Clone',
    text: 'Le laboratoire vous a cloné, « par précaution ». Le clone est plus aimable que vous. Les familles le préfèrent déjà un peu.',
    options: [
      { label: 'Garder le clone', effect: { loy: { ourk: 1, sel: 1, brume: 1, troc: 1 }, mem: ['clone'], sched: [{ card: 'ev_clone_2', in: 5 }] }, reply: 'Le clone inaugure, sourit, serre des mains. Vous gouvernez dans l’ombre. Il gouverne dans la lumière.' },
      { label: 'Le débrancher', effect: { gain: $('S4'), loy: { brume: -1 } }, reply: 'Le clone vous regarde avec vos yeux. « Je comprends. Je l’aurais fait aussi. »' },
    ],
  }),
  card({
    id: 'ev_clone_2', kind: 'intrigue', arc: 'clone', finale: true, art: { motif: 'mask', hue: 160 },
    title: 'Le Clone a des idées',
    text: 'Le clone propose un débat télévisé. Contre vous. Les sondages le donnent gagnant. Il a votre visage, en mieux éclairé.',
    options: [
      { label: 'Débattre', cost: $('T4'), effect: { bet: { chance: 0.5, per: { tag: 'Culture', bonus: 0.1 },
        win: { loy: { ourk: 1, sel: 1, brume: 1, troc: 1 }, reply: 'Vous gagnez. Le clone vous félicite chaleureusement. Avec vos mots.' },
        lose: { loy: { ourk: -1, sel: -1, brume: -1, troc: -1 }, reply: 'Il gagne. Il vous nomme ministre de vous-même. C’est humiliant et bien payé.' } } } },
      { label: 'Exil sur la Lune', effect: { gain: $('A2'), loy: { sel: -1 } }, reply: 'Le clone part sur la Lune. Il y fonde un parti. Il gagne toutes les élections, là-haut.' },
    ],
  }),
  card({
    id: 'ev_climat', kind: 'evenement', eras: [4], art: { motif: 'sun', hue: 20 },
    title: 'La Canicule',
    text: 'Les étés brûlent les récoltes. Les scientifiques disent que c’est votre faute, en gros. Ils ont des graphiques, en très gros.',
    options: [
      { label: 'Tout changer', cost: $('T5'), effect: { gain: $('V6'), loy: { brume: 1, troc: -1 } }, reply: 'Cher, lent, nécessaire. Les étés restent chauds, mais ils ont honte.' },
      { label: 'Climatiser', effect: { gain: $('T3 V-3'), loy: { troc: 1 } }, reply: 'Tout le monde est au frais. Dehors, il fait encore plus chaud. Dedans, on ne sort plus.' },
    ],
  }),
  card({
    id: 'ev_musee', lock: 'musee', kind: 'evenement', scale: true, eras: [3], cond: { ruins: 2 }, tags: ['Culture'], art: { motif: 'skull', hue: 40 },
    title: 'Le Musée des civilisations',
    text: 'On ouvre une salle pour {ruine:0}, une pour {ruine:1}. Un conservateur demande s’il faut prévoir une salle pour {cite}. « Par précaution. »',
    options: [
      { label: 'Ouvrir le musée', cost: $('T3'), effect: { gain: $('S4'), loy: { brume: 1, sel: 1 }, mem: ['musee'] }, reply: 'Les écoliers défilent devant les ruines de {ruine:0}. Ils trouvent la fin très drôle. Ils ont tort.' },
      { label: 'Vendre les collections', effect: { gain: $('T7'), loy: { sel: -1, troc: 1 } }, reply: '{Rival} achètent tout. Le testament de {ruine:0} est exposé chez eux, mal traduit.' },
      { label: 'Prévoir la salle', cost: $('S2'), effect: { loy: { sel: 1 }, mem: ['salle_prevue'] }, reply: 'La salle de {cite} est prête. Elle est vide. Le conservateur la dépoussière chaque matin, en sifflant.' },
    ],
  }),
];

/** Cartes de la rivale, selon l'état de la relation. */
export const rivalCards = [
  card({
    id: 'v_lettre', kind: 'rivale', scale: true, eras: [0, 1, 2, 3, 4], art: { motif: 'scroll', hue: 268 }, speaker: '{Reine}',
    title: 'Une lettre de {reine}',
    text: '« Ma chère voisine, j’ai appris vos difficultés. Je prie pour vous. J’envoie aussi un ambassadeur, pour prier de plus près. Affectueusement. »',
    options: [
      { label: 'Recevoir l’ambassadeur', cost: $('V2'), effect: { rival: 1, gain: $('S2') }, reply: 'L’ambassadeur prie beaucoup, surtout près des archives.' },
      { label: 'Répondre poliment non', effect: { rival: -1, gain: $('A1') }, reply: '{Reine} vous répond qu’{elle} comprend. {Elle} ne comprend pas.' },
    ],
  }),
  card({
    id: 'v_frontiere', kind: 'rivale', scale: true, eras: [0, 1, 2, 3, 4], art: { motif: 'wheat', hue: 268 }, speaker: '{Reine}',
    title: 'Le Champ de la discorde',
    text: 'Un champ. {Rival} disent qu’il est à eux. Votre carte dit le contraire. Les deux cartes sont fausses, mais la vôtre est mieux dessinée.',
    options: [
      { label: 'Le garder', effect: { gain: $('V4'), rival: -1 }, reply: 'Du blé, et une lettre furieuse. Le blé est meilleur.' },
      { label: 'Le partager', effect: { gain: $('V2'), rival: 1 }, reply: 'Demi-champ, demi-blé, demi-paix. Tout le monde est à moitié content.' },
    ],
  }),
  card({
    id: 'v_mariage', kind: 'rivale', scale: true, eras: [1, 2, 3], art: { motif: 'ring', hue: 268 }, speaker: '{Reine}',
    title: 'Le Mariage',
    text: '{Reine} propose un mariage entre vos héritiers. Les héritiers ne sont pas d’accord. Personne ne leur a demandé, c’est l’usage.',
    options: [
      { label: 'Accepter', cost: $('T4'), effect: { rival: 2, mem: ['mariage'] }, reply: 'Des noces somptueuses. Les mariés ne se parlent pas. Les familles, si : elles comptent.' },
      { label: 'Refuser', effect: { rival: -1, loy: { ourk: 1 } }, reply: '{Reine}, {?rivalshe|vexée|vexé}, marie son héritier ailleurs. Avec quelqu’un de plus grand.' },
    ],
  }),
  card({
    id: 'v_raid', kind: 'rivale', scale: true, eras: [0, 1, 2, 3, 4], art: { motif: 'flame', hue: 0 }, speaker: '{Reine}',
    title: 'Les Villages brûlés',
    text: '{Rival} ont brûlé trois villages. {Reine} parle d’une « erreur de carte ». Les cartes, chez {rival}, se trompent souvent dans votre direction.',
    options: [
      { label: 'Représailles', warn: 'Sans {s:6} Armée, un quartier brûle',
        effect: { rival: -1, if: { res: $('A6') }, then: { gain: $('A-2 T4'), rivalJalon: -1, reply: 'Trois de leurs villages, et un chantier. Erreur de carte, évidemment.' },
          else: { quartiers: -1, cause: 'les raids de la rivale', reply: 'Vos représailles ont été repoussées. Ils ont brûlé un quartier, pour l’erreur de carte.' } } },
      { label: 'Encaisser', effect: { gain: $('V-3'), rival: 1 }, reply: 'Vous reconstruisez. {Reine} vous envoie des condoléances, et une facture pour les torches.' },
    ],
  }),
  card({
    id: 'v_ultimatum', kind: 'rivale', scale: true, eras: [1, 2, 3, 4], art: { motif: 'scroll', hue: 0 }, speaker: '{Reine}',
    title: 'L’Ultimatum',
    text: '« Cédez la vallée ou brûlez. » La lettre est signée « {reine}, affectueusement ». Le messager attend une réponse. Il a l’air pressé, et inflammable.',
    options: [
      { label: 'Céder la vallée', effect: { gain: $('V-5'), rival: 2 }, reply: 'La vallée est à eux. Le messager sourit. Il repart en sifflotant votre hymne.' },
      { label: 'Brûler la lettre', cost: $('A3'), effect: { rival: -2, loy: { ourk: 2 } }, reply: '{F:ourk} brûle la lettre. Puis le messager, presque. Il repart au galop.' },
    ],
  }),
  card({
    id: 'v_espion', kind: 'rivale', scale: true, eras: [1, 2, 3, 4], art: { motif: 'eye', hue: 268 }, speaker: '{Reine}',
    title: 'L’Espion',
    text: 'Un espion de {rival} a été pris dans vos archives. Il dit qu’il visitait. Il visitait avec un plan, une lanterne et un faux nez.',
    options: [
      { label: 'Le retourner', cost: $('T2'), effect: { gain: $('S3'), rivalJalon: -1, rival: -1 }, reply: 'Il espionne pour vous désormais. Ou pour eux. Il ne sait plus lui-même, mais le chantier de {rival} a pris du retard.' },
      { label: 'Le pendre', effect: { gain: $('A2'), rival: -2 }, reply: 'Pendu. {Rival} pendent le vôtre. Vous ne saviez pas que vous en aviez un.' },
    ],
  }),
  card({
    id: 'v_alliance', kind: 'rivale', scale: true, eras: [0, 1, 2, 3, 4], art: { motif: 'ring', hue: 140 }, speaker: '{Reine}',
    title: 'L’Alliance',
    text: '{Reine} propose une alliance. Contre qui, {elle} ne le précise pas. « Nous trouverons bien. »',
    options: [
      { label: 'Signer', cost: $('T3'), effect: { rival: 1, gain: $('A4'), mem: ['alliance'] }, reply: 'Alliés. {Elle} a déjà un ennemi en tête. Vous espérez que ce n’est pas vous.' },
      { label: 'Rester libre', effect: { gain: $('S2'), rival: -1 }, reply: 'Libre et seul. {Elle} signe avec quelqu’un d’autre, plus petit, plus docile.' },
    ],
  }),
  card({
    id: 'v_savants', kind: 'rivale', scale: true, eras: [1, 2, 3, 4], art: { motif: 'scroll', hue: 140 }, speaker: '{Reine}',
    title: 'L’Échange de savants',
    text: '{Reine} propose d’échanger des savants. {Elle} envoie les siens. {Elle} voudrait {F:brume}, en échange. Juste pour une saison.',
    options: [
      { label: 'Accepter l’échange', effect: { gain: $('S6'), rival: 1, loy: { brume: -2 } }, reply: '{F:brume} part. Les savants de {rival} arrivent, très polis, très curieux. {F:brume} revient en colère, et plus savant.' },
      { label: 'Garder Brume', effect: { loy: { brume: 2 }, rival: -1 }, reply: '{F:brume} est touché. Il le dit en corrigeant votre grammaire.' },
    ],
  }),
  card({
    id: 'v_commerce', kind: 'rivale', scale: true, eras: [0, 1, 2, 3, 4], art: { motif: 'coin', hue: 140 }, speaker: '{Reine}',
    title: 'Le Traité de commerce',
    text: '{Reine} propose d’ouvrir les frontières au commerce. Vos marchands applaudissent. Les siens aussi, et ils sont plus nombreux.',
    options: [
      { label: 'Ouvrir', effect: { gain: $('T5'), rival: 1, loy: { troc: 1, ourk: -1 } }, reply: 'Les marchandises circulent. Les rumeurs aussi. Elles sont toutes en sa faveur.' },
      { label: 'Taxer ses marchands', effect: { gain: $('T3'), rival: -1 }, reply: 'Ses marchands paient. {Elle} taxe les vôtres, deux fois plus. Par amitié.' },
    ],
  }),
];
