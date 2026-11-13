/**
 * Événements supplémentaires (quatre par ère) : avec ceux d'origine, une dizaine par ère,
 * dont deux sont tirés à chaque partie (en écartant ceux de la partie précédente).
 */
import { $, card } from './dsl';

export const moreEventCards = [
  // ------------------------------------------------------------------ Âge de pierre
  card({
    id: 'ev_eclipse', kind: 'evenement', scale: true, eras: [0], art: { motif: 'sun', hue: 260 },
    title: 'L’Éclipse',
    text: 'Le soleil s’éteint en plein jour. Tout le monde regarde {F:sel}. {F:sel} regarde le soleil, puis vous. « C’est un message. » De qui, et pour qui : c’est à négocier.',
    options: [
      { label: 'Une offrande au soleil', cost: $('V3'), effect: { loy: { sel: 1 }, gain: $('S1') }, reply: 'Le soleil revient. {F:sel} s’incline : le ciel a reçu les dons. Les dons, eux, sont chez {F:sel}.' },
      { label: 'Laisser Brume expliquer', effect: { gain: $('S3'), loy: { brume: 1, sel: -1 } }, reply: 'Le vieux Brume explique avec deux cailloux et une torche. Personne ne comprend, mais tout le monde se sent moins bête.' },
      { label: 'Piller {rival} dans le noir', effect: { gain: $('V4'), rival: -1 }, reply: 'Vos chasseurs reviennent avec des provisions, et la certitude que le soleil était complice.' },
    ],
  }),
  card({
    id: 'ev_loup', kind: 'evenement', scale: true, eras: [0], art: { motif: 'fang', hue: 30 },
    title: 'Le Loup du feu',
    text: 'Un loup s’est installé près du feu. Il a l’air d’attendre quelque chose. {F:ourk} veut le manger. Les enfants veulent le garder. Le loup veut les restes.',
    options: [
      { label: 'L’adopter', cost: $('V2'), effect: { gain: $('A2'), loy: { ourk: -1 } }, reply: 'Le loup garde le camp la nuit. Il mord {F:troc} une fois, par principe. Ses descendants s’appelleront des chiens.' },
      { label: 'Le chasser', effect: { gain: $('A1'), loy: { ourk: 1 } }, reply: '{F:ourk} chasse le loup. Le loup revient le lendemain, avec un ami.' },
    ],
  }),
  card({
    id: 'ev_baies', kind: 'evenement', scale: true, eras: [0], art: { motif: 'leaf', hue: 300 },
    title: 'Les Baies oubliées',
    text: 'Des baies oubliées dans une outre ont tourné. Ceux qui en ont bu chantent, dansent et proposent des lois. {F:sel} parle de boisson sacrée ; {F:troc}, de boisson payante.',
    options: [
      { label: 'Boisson sacrée', effect: { gain: $('V2'), loy: { sel: 1 } }, reply: 'On ne boit plus qu’aux fêtes. Il y a désormais beaucoup de fêtes.' },
      { label: 'Boisson payante', effect: { gain: $('T4'), loy: { troc: 1, sel: -1 } }, reply: '{F:troc} ouvre la première taverne. La première ardoise suit, trois minutes plus tard.' },
      { label: 'Vider les outres', effect: { gain: $('S1'), loy: { ourk: -1 } }, reply: 'Les outres finissent dans la rivière. Les poissons chantent toute la nuit.' },
    ],
  }),
  card({
    id: 'ev_tombe', kind: 'evenement', scale: true, eras: [0], art: { motif: 'skull', hue: 30 },
    title: 'La Première Tombe',
    text: 'Le plus vieux du camp est mort. Personne ne sait quoi faire du corps. {F:sel} veut l’enterrer avec ses affaires, « pour le voyage ». {F:troc} veut garder les affaires, « pour les vivants ».',
    options: [
      { label: 'L’enterrer avec ses affaires', effect: { gain: $('V1'), loy: { sel: 1, troc: -1 } }, reply: 'On l’enterre avec sa lance, son collier et une galette. La galette disparaît dans la nuit. On accuse le voyage.' },
      { label: 'Partager ses affaires', effect: { gain: $('A2'), loy: { troc: 1, sel: -1 } }, reply: 'Sa lance va aux chasseurs, son collier à {F:troc}, sa galette aux enfants. Le mort ne réclame rien. Pas encore.' },
    ],
  }),

  // ------------------------------------------------------------------ Antiquité
  card({
    id: 'ev_naufrage', kind: 'evenement', scale: true, eras: [1], art: { motif: 'ship', hue: 200 },
    title: 'Le Naufrage',
    text: 'Un navire étranger s’échoue sur la côte, chargé d’amphores, d’épices et d’un éléphant très calme. L’équipage demande de l’aide. L’éléphant ne demande rien.',
    options: [
      { label: 'Secourir l’équipage', cost: $('V3'), effect: { gain: $('S3'), rival: 1 }, reply: 'Les marins repartent en vantant votre bonté. Ils laissent l’éléphant, en remerciement. Il mange beaucoup.' },
      { label: 'Saisir la cargaison', effect: { gain: $('T5'), loy: { sel: -1 } }, reply: 'Les amphores sont à vous. {F:sel} rappelle que les dieux de la mer ont de la mémoire, et des cousins.' },
      { label: 'L’éléphant pour {F:ourk}', effect: { gain: $('A3'), loy: { ourk: 1, troc: -1 } }, reply: '{F:ourk} a un éléphant de guerre. L’éléphant refuse la guerre. Il accepte les défilés.' },
    ],
  }),
  card({
    id: 'ev_banquet', kind: 'evenement', scale: true, eras: [1], art: { motif: 'wheat', hue: 40 },
    title: 'Le Banquet',
    text: '{F:troc} organise un banquet en votre honneur : douze plats, trois poètes, un dromadaire farci. La facture arrivera avec le dessert.',
    options: [
      { label: 'Payer le banquet', cost: $('T4'), effect: { loy: { troc: 1, ourk: 1 } }, reply: 'Le banquet dure trois jours. On y compose votre éloge en vers. Les vers sont mauvais, mais nombreux.' },
      { label: 'Un banquet frugal', cost: $('V1'), effect: { gain: $('S1'), loy: { sel: 1, troc: -1 } }, reply: 'Pain, olives, eau. {F:sel} approuve. Les poètes écrivent sur la faim, avec talent.' },
      { label: 'Pas de banquet', effect: { gain: $('T2'), loy: { troc: -1 } }, reply: 'Vous dînez seul. Le dromadaire farci part chez {rival}, qui en parle encore.' },
    ],
  }),
  card({
    id: 'ev_seisme', kind: 'evenement', scale: true, eras: [1], art: { motif: 'mountain', hue: 25 },
    title: 'La Terre tremble',
    text: 'La terre tremble une nuit. Rien ne tombe, sauf la statue de {F:ourk} et la confiance générale. {F:sel} y voit un signe ; {F:brume}, une faille ; {F:troc}, une occasion.',
    options: [
      { label: 'Redresser la statue', cost: $('T3'), effect: { gain: $('V2'), loy: { ourk: 1 } }, reply: 'La statue de {F:ourk} est redressée, plus grande. Elle tremble encore un peu, comme son modèle quand on parle d’argent.' },
      { label: 'Étudier la faille', cost: $('S2'), effect: { gain: $('S4'), loy: { brume: 1 } }, reply: '{F:brume} descend dans la faille et en remonte avec trois théories et une sandale qui n’est pas à lui.' },
      { label: 'Vendre les décombres', effect: { gain: $('T4'), loy: { troc: 1, ourk: -1 } }, reply: '{H:troc} revendent les décombres en « pierres historiques ». On rebâtit avec, plus cher.' },
    ],
  }),
  card({
    id: 'ev_epopee', kind: 'evenement', scale: true, eras: [1], art: { motif: 'scroll', hue: 45 },
    title: 'L’Épopée',
    text: 'Un poète écrit une épopée sur votre règne. Il en est au chant XII et vous n’êtes toujours pas né. Il demande une pension, pour tenir jusqu’au chant XL.',
    options: [
      { label: 'Lui verser une pension', cost: $('T3'), effect: { gain: $('S2'), loy: { sel: 1 } }, reply: 'Au chant XL, vous naissez enfin. Le public pleure. Le poète réclame une pension pour la suite.' },
      { label: 'Exiger un résumé', effect: { gain: $('S1'), loy: { brume: 1 } }, reply: 'Le poète résume : « Il régna. » C’est exact, et ça tient sur une tablette.' },
      { label: 'L’envoyer chez {rival}', effect: { gain: $('T2'), rival: -1 }, reply: 'Le poète écrit chez {rival} une satire sur votre nez. Elle a un grand succès. Votre nez aussi.' },
    ],
  }),

  // ------------------------------------------------------------------ Moyen Âge
  card({
    id: 'ev_dragon', kind: 'evenement', scale: true, eras: [2], art: { motif: 'flame', hue: 10 },
    title: 'Le Dragon',
    text: 'Un paysan jure avoir vu un dragon dans la montagne. Il a des preuves : une écaille, une odeur de brûlé, et une très grande peur. {F:ourk} demande la permission de partir en chasse.',
    options: [
      { label: 'Une chasse au dragon', cost: $('A3'), effect: { bet: { chance: 0.5, per: { tag: 'Guerre', bonus: 0.1 },
        win: { gain: $('T6'), loy: { ourk: 1 }, reply: '{F:ourk} revient avec la tête du dragon. C’est un très gros lézard. On l’empaille quand même.' },
        lose: { gain: $('A-2'), reply: 'La chasse revient bredouille et roussie. Le dragon, s’il existe, a gagné la première manche.' } } } },
      { label: 'Vendre des reliques du dragon', effect: { gain: $('T4'), loy: { troc: 1, sel: -1 } }, reply: '{F:troc} vend des écailles de dragon. Elles ressemblent à des écailles de carpe. Elles se vendent mieux.' },
      { label: 'Il n’y a pas de dragon', effect: { gain: $('S2'), loy: { brume: 1 } }, reply: '{F:brume} démontre qu’il n’y a pas de dragon. La nuit, il ferme quand même sa fenêtre.' },
    ],
  }),
  card({
    id: 'ev_herboriste', kind: 'evenement', scale: true, eras: [2], art: { motif: 'leaf', hue: 120 },
    title: 'L’Herboriste',
    text: 'On accuse une herboriste de sorcellerie : elle guérit trop bien. {F:sel} réclame un procès ; {F:brume}, ses recettes ; la foule, un bûcher, par habitude.',
    options: [
      { label: 'Un procès en règle', effect: { gain: $('V2'), loy: { sel: 1, brume: -1 } }, reply: 'Le procès dure trois mois. Elle est acquittée, puis embauchée par l’abbesse, discrètement.' },
      { label: 'La prendre sous protection', cost: $('A2'), effect: { gain: $('S4'), loy: { brume: 1, sel: -1 } }, reply: 'L’herboriste soigne la cour. Vous n’avez plus jamais mal au dos. On dit que vous êtes ensorcelé ; vous ne démentez pas.' },
      { label: 'La bannir', effect: { gain: $('T3'), loy: { brume: -1 }, rival: -1 }, reply: 'Elle part chez {rival} avec ses recettes ; sa maison est vendue aux enchères. Chez {rival}, on ne tousse plus.' },
    ],
  }),
  card({
    id: 'ev_epices', kind: 'evenement', scale: true, eras: [2], art: { motif: 'road', hue: 30 },
    title: 'La Caravane des épices',
    text: 'Une caravane apporte du poivre, de la cannelle, et des récits de pays où l’on mange épicé. Le poivre vaut son poids d’or. {F:troc} a déjà sorti sa balance.',
    options: [
      { label: 'Acheter tout le poivre', cost: $('T5'), effect: { gain: $('V4 S2'), loy: { troc: 1 } }, reply: 'La cité mange épicé. On conserve la viande, on éternue, on prospère.' },
      { label: 'Taxer la caravane', effect: { gain: $('T4'), loy: { troc: -1 } }, reply: 'La caravane paie, puis repart vers {rival} en racontant que vous êtes un péage avec une couronne.' },
      { label: 'Troquer contre nos vins', cost: $('V3'), effect: { gain: $('T6') }, reply: 'Le poivre contre le vin : tout le monde est content, et un peu gris.' },
    ],
  }),
  card({
    id: 'ev_moulin', kind: 'evenement', scale: true, eras: [2], art: { motif: 'wheat', hue: 50 },
    title: 'Le Moulin à vent',
    text: 'Un meunier a bâti un moulin à vent. Il tourne seul, moud le grain et effraie les chevaux. {F:ourk} veut l’attaquer : il est certain que c’est un géant.',
    options: [
      { label: 'Des moulins partout', cost: $('T3'), effect: { gain: $('V5'), loy: { ourk: -1 } }, reply: 'Les moulins tournent sur toutes les collines. {F:ourk} les surveille, lance à la main. On ne sait jamais.' },
      { label: 'Laisser {F:ourk} charger', effect: { gain: $('A2'), loy: { ourk: 1 } }, reply: '{F:ourk} charge le moulin et perd. Il dit qu’il a gagné. Le moulin ne dit rien.' },
      { label: 'Un seul, au palais', cost: $('T1'), effect: { gain: $('V2') }, reply: 'Le moulin du palais moud votre grain. Les gens viennent le regarder tourner. Ça ne nourrit personne, mais c’est joli.' },
    ],
  }),

  // ------------------------------------------------------------------ Ère industrielle
  card({
    id: 'ev_photo', kind: 'evenement', scale: true, eras: [3], art: { motif: 'eye', hue: 30 },
    title: 'La Photographie',
    text: 'Un inventeur veut faire votre portrait avec une boîte. Il faut rester immobile une heure. Il promet que le résultat durera plus longtemps que vous.',
    options: [
      { label: 'Poser une heure', effect: { gain: $('S2'), loy: { brume: 1 } }, reply: 'Le portrait est réussi. Vous y avez l’air de quelqu’un qui pose depuis une heure.' },
      { label: 'Photographier les familles', cost: $('T3'), effect: { loy: { ourk: 1, sel: 1 } }, reply: 'Les quatre chefs de famille sur la même photo. Personne ne sourit. C’est très ressemblant.' },
      { label: 'Interdire la boîte', effect: { gain: $('V2'), loy: { brume: -1 }, rival: -1 }, reply: 'L’inventeur part photographier {rival}, qui pose très bien.' },
    ],
  }),
  card({
    id: 'ev_magasin', kind: 'evenement', scale: true, eras: [3], art: { motif: 'coin', hue: 150 },
    title: 'Le Grand Magasin',
    text: '{F:troc} ouvre un grand magasin : tout sous le même toit, des escaliers qui bougent, des vendeurs qui vous appellent « Votre Majesté ». On entre pour un bouton, on ressort avec un piano.',
    options: [
      { label: 'Inaugurer en personne', effect: { gain: $('T5'), loy: { troc: 1, sel: -1 } }, reply: 'Vous coupez le ruban. Le magasin vend votre portrait au rayon souvenirs. Il part très bien, en solde.' },
      { label: 'Taxer le luxe', effect: { gain: $('T3'), loy: { troc: -1 } }, reply: 'Les pianos coûtent plus cher. Les gens achètent des boutons, par vengeance.' },
      { label: 'Un rayon pour les pauvres', cost: $('T2'), effect: { gain: $('V3'), loy: { sel: 1 } }, reply: 'Au sous-sol, tout est presque gratuit. La queue va jusqu’à la gare.' },
    ],
  }),
  card({
    id: 'ev_tourfer', kind: 'evenement', scale: true, eras: [3], art: { motif: 'tower', hue: 20 },
    title: 'La Tour de fer',
    text: 'Un ingénieur propose une tour de fer, très haute, très laide, qui ne sert à rien. Il jure que dans cent ans, tout le monde l’adorera.',
    options: [
      { label: 'La construire', cost: $('T5'), effect: { gain: $('T4 S2'), loy: { brume: 1 } }, reply: 'Tout le monde déteste la tour. Puis tout le monde vient la voir, pour la détester de plus près.' },
      { label: 'Une tour plus petite', cost: $('T2'), effect: { gain: $('T2') }, reply: 'La petite tour ne déplaît à personne. Personne ne vient la voir non plus.' },
      { label: 'Pas de tour', effect: { gain: $('V2'), loy: { brume: -1 }, rival: -1 }, reply: 'L’ingénieur bâtit sa tour chez {rival}. Elle devient leur symbole. Vous la voyez de chez vous.' },
    ],
  }),
  card({
    id: 'ev_telephone', kind: 'evenement', scale: true, eras: [3], art: { motif: 'bell', hue: 200 },
    title: 'Le Téléphone',
    text: '{F:brume} a inventé un appareil pour parler à distance. Il a appelé {F:sel}, qui a raccroché : elle préfère qu’on vienne la voir. {F:troc} y voit déjà des factures mensuelles.',
    options: [
      { label: 'Un téléphone par foyer', cost: $('T4'), effect: { gain: $('T6'), loy: { brume: 1 } }, reply: 'Tout le monde s’appelle. Personne ne se voit plus. On se dispute deux fois plus vite.' },
      { label: 'Une ligne entre familles', cost: $('S2'), effect: { loy: { brume: 1, sel: 1 } }, reply: 'Les quatre chefs de famille ont une ligne directe. Ils s’en servent pour se raccrocher au nez.' },
      { label: 'On se parle en face', effect: { loy: { sel: 1, brume: -1 } }, reply: '{F:sel} approuve. {F:brume} vend son appareil à {rival}, qui vous téléphone pour vous l’annoncer.' },
    ],
  }),

  // ------------------------------------------------------------------ Ère spatiale
  card({
    id: 'ev_meteo', kind: 'evenement', scale: true, eras: [4], art: { motif: 'wave', hue: 200 },
    title: 'La Météo sur mesure',
    text: 'BRUME propose de régler la météo : pluie la nuit, soleil le jour, neige à Noël. {F:sel} demande ce que fera le ciel, s’il n’a plus rien à décider.',
    options: [
      { label: 'Régler la météo', cost: $('S5'), effect: { gain: $('V6'), loy: { brume: 1, sel: -1 } }, reply: 'Il pleut à trois heures du matin, pile. Les agriculteurs pleurent de joie ; les poètes, d’ennui.' },
      { label: 'Seulement pour les fêtes', cost: $('S2'), effect: { gain: $('V2'), loy: { sel: 1 } }, reply: 'Il fait beau à chaque fête. Le ciel garde les jours ordinaires, comme avant.' },
      { label: 'Laisser le ciel tranquille', effect: { loy: { brume: -1, sel: 1 } }, reply: 'Le ciel reste imprévisible. On en parle beaucoup plus. C’est peut-être à ça qu’il sert.' },
    ],
  }),
  card({
    id: 'ev_livre', kind: 'evenement', scale: true, eras: [4], art: { motif: 'scroll', hue: 40 },
    title: 'Le Dernier Livre',
    text: 'Toutes les bibliothèques sont numérisées. Il reste un dernier livre en papier, au musée. Une foule veut le lire ; une autre, le brûler, pour voir ce que ça fait.',
    options: [
      { label: 'L’exposer sous verre', cost: $('T3'), effect: { gain: $('S3'), loy: { sel: 1 } }, reply: 'Des files de visiteurs regardent le livre sans le toucher. Personne ne le lit. Tout le monde se sent cultivé.' },
      { label: 'Le lire à voix haute', effect: { gain: $('V3') }, reply: 'On le lit sur toutes les chaînes. C’est un livre de cuisine. Le pays entier fait la même soupe.' },
      { label: 'Le vendre aux enchères', effect: { gain: $('T6'), loy: { troc: 1, sel: -1 } }, reply: '{F:troc} l’achète et en fait un abonnement : une page par mois.' },
    ],
  }),
  card({
    id: 'ev_nostalgie', kind: 'evenement', scale: true, eras: [4], art: { motif: 'mountain', hue: 30 },
    title: 'La Mode préhistorique',
    text: 'Une mode balaie la cité : vivre comme à l’âge de pierre. Grottes climatisées, feux de bois certifiés, mammouths en résine. {F:ourk} se sent enfin compris.',
    options: [
      { label: 'Lancer la mode', effect: { gain: $('T4'), loy: { ourk: 1, brume: -1 } }, reply: 'Tout le monde chasse le mammouth en résine. {F:ourk} donne des cours. Il est complet jusqu’à l’an prochain.' },
      { label: 'Ouvrir un musée', cost: $('T3'), effect: { gain: $('S3') }, reply: 'Au musée, une reconstitution de vous, à l’âge de pierre, avec une massue. Le nez est fidèle.' },
      { label: 'Laisser passer la mode', effect: { gain: $('V2') }, reply: 'La mode passe. Il en reste une grotte climatisée par quartier, qu’on transforme en cave à vin.' },
    ],
  }),
  card({
    id: 'ev_juge', kind: 'evenement', scale: true, eras: [4], art: { motif: 'scales', hue: 190 },
    title: 'Le Juge automatique',
    text: 'BRUME propose un juge automatique : impartial, rapide, incorruptible. {F:troc} trouve l’idée terrifiante. Il a déjà demandé le prix.',
    options: [
      { label: 'L’installer', cost: $('S4'), effect: { gain: $('T3'), loy: { brume: 1, troc: -1 } }, reply: 'Le juge rend mille verdicts par jour. Il vous condamne une fois, pour excès de vitesse. Vous faites appel. Il rit.' },
      { label: 'Pour les petits délits', cost: $('S2'), effect: { gain: $('T2') }, reply: 'Le juge automatique s’occupe des vols de vélo. Il est sans pitié avec les vélos.' },
      { label: 'Garder les juges humains', effect: { loy: { brume: -1, troc: 1 } }, reply: 'Les juges humains restent, lents et corruptibles. {F:troc} est rassuré : il les connaît tous.' },
    ],
  }),
];
