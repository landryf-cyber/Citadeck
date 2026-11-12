/** Familles, desseins, origines, rivales, routes et cartes du moteur. */
import type { DesseinDef, FamilyDef, FamilyId, OriginDef, RivalDef, RouteDef } from '../core/types';
import { $, card } from './dsl';

export const families: Record<FamilyId, FamilyDef> = {
  ourk: {
    id: 'ourk', tag: 'Guerre', res: 'armee', hue: 8, motif: 'fang',
    head: ['Ourk', 'Ourkos', 'Sire Ourquin', 'le colonel Ourkov', 'l’amiral Ourk-7'],
    house: ['les Ourk', 'les Ourkides', 'les Ourquin', 'les Ourkov', 'les Ourkonautes'],
    trade: ['chasseurs', 'légionnaires', 'chevaliers', 'officiers', 'amiraux'],
    voice: 'Parle de lui à la troisième personne. Depuis dix mille ans.',
  },
  sel: {
    id: 'sel', tag: 'Foi', res: 'vivres', hue: 44, motif: 'eye',
    head: ['Mère Sel', 'Sélènè la Pythie', 'l’abbesse Salière', 'la prieure Salin', 'la révérende Sel'],
    she: [true, true, true, true, true],
    house: ['les Sel', 'les Sélénides', 'les Salière', 'les Salin', 'les Sélestes'],
    trade: ['chamanes', 'oracles', 'moniales', 'prélats', 'télévangélistes'],
    voice: 'Prédit le malheur et tend la main.',
  },
  brume: {
    id: 'brume', tag: 'Science', res: 'savoir', hue: 205, motif: 'spiral',
    head: ['le vieux Brume', 'Brumos le Mesureur', 'frère Brumaire', 'le docteur Brumel', 'BRUME'],
    she: [false, false, false, false, true],
    house: ['les Brume', 'les Brumides', 'les Brumaire', 'les Brumel', 'les BRUME'],
    trade: ['sages', 'géomètres', 'copistes', 'ingénieurs', 'intelligences'],
    voice: 'Corrige tout le monde. Fait exploser des choses.',
  },
  troc: {
    id: 'troc', tag: 'Commerce', res: 'tresor', hue: 150, motif: 'coin',
    head: ['Troc', 'Trokos l’armateur', 'maître Troquet', 'Troc et Fils', 'TrocCorp'],
    house: ['les Troc', 'les Trokides', 'les Troquet', 'les Troc-et-Fils', 'les TrocCorp'],
    trade: ['troqueurs', 'armateurs', 'banquiers', 'industriels', 'actionnaires'],
    voice: 'A un prix pour tout. Surtout pour l’amitié.',
  },
};

export const rivalries: Record<FamilyId, FamilyId> = { ourk: 'brume', brume: 'ourk', sel: 'troc', troc: 'sel' };

export const desseins: DesseinDef[] = [
  {
    id: 'etoiles', name: 'Toucher les étoiles', tag: 'Science', ending: 'science',
    pitch: 'Partir. Un jour, tous. Il faudra du Savoir, et des savants qui vous aiment.',
    jalons: [
      { name: 'Le Cercle de pierres', text: 'Des pierres dressées qui annoncent les saisons.', cost: $('S5'), gift: 'Il rapporte 1 Savoir par saison.', passive: { type: 'income', res: 'savoir', amount: 1 }, shape: 'cercle', built: 'Les pierres sont dressées. Au solstice, le soleil se lève pile entre les deux plus grosses. {F:brume} prétend l’avoir prévu ; {F:sel} prétend l’avoir demandé.' },
      { name: 'La Tour des astronomes', text: 'Une tour pour regarder plus haut que les autres.', cost: $('S8 V3'), req: { tags: { Science: 1 } }, gift: 'Les découvertes coûtent 2 Savoir de moins.', passive: { type: 'discount', res: 'savoir', amount: 2 }, shape: 'tour', built: 'La tour dépasse enfin le temple. {F:sel} parle d’orgueil ; {F:brume} parle de vue. Ils montent quand même ensemble, pour voir qui a raison.' },
      { name: 'L’Observatoire', text: 'Une coupole et une lunette. On y voit venir les ennuis.', cost: $('S12 T5'), req: { tags: { Science: 2 } }, gift: 'Chaque ère, la première perte de quartier subie se rachète {s:4} Savoir, si vous les avez.', passive: { type: 'shield', amount: 4, res: 'savoir' }, shape: 'dome', built: 'La coupole s’ouvre pour la première fois. La lunette montre une étoile, puis {reine} en train de regarder la même étoile. On lui fait signe.',
        alt: { lock: 'alt_etoiles', name: 'Le Grand Télescope', text: 'Un tube de cuivre long comme une rue. On y voit {reine} se gratter le nez, de l’autre côté de la vallée.', cost: $('S12 T7'), req: { tags: { Science: 2 } }, gift: 'Il rapporte 2 Savoir par saison.', passive: { type: 'income', res: 'savoir', amount: 2 }, shape: 'telescope', built: 'Le grand télescope pivote, grince, et se fixe sur la cité de {rival}. {Reine} se gratte le nez. Toute la ville l’a vu.' } },
      { name: 'Le Pas de tir', text: 'Du béton, des tours de lancement, des ingénieurs nerveux.', cost: $('S17 T7'), req: { tags: { Science: 2 } }, gift: 'Il rapporte 2 Savoir par saison.', passive: { type: 'income', res: 'savoir', amount: 2 }, shape: 'fusee', built: 'Le premier essai décolle, monte, hésite, et retombe dans la mer. Le deuxième ne retombe pas. Les ingénieurs pleurent, puis réclament une prime.' },
      { name: 'L’Arche', text: 'Un vaisseau assez grand pour emporter une civilisation. Et ses rancunes.', cost: $('S20 T8 V6'), req: { tags: { Science: 3 } }, gift: 'Le départ.', shape: 'arche', built: 'L’Arche est prête. Il y a une place pour chacun, et une cabine pour chaque rancune. Les familles comparent la taille de leurs cabines.' },
    ],
  },
  {
    id: 'empire', name: 'Soumettre la vallée', tag: 'Guerre', ending: 'military',
    pitch: 'La vallée sera à vous, et {rival} avec. Il faudra de l’Armée, et des guerriers fidèles.',
    jalons: [
      { name: 'La Palissade', text: 'Des pieux, des guetteurs, une porte qui ne grince pas.', cost: $('A5'), gift: 'Chaque ère, la première perte de quartier subie se rachète {s:4} Armée, si vous les avez.', passive: { type: 'shield', amount: 4, res: 'armee' }, shape: 'palissade', built: 'La palissade fait le tour du camp. {F:ourk} la parcourt trois fois, en touchant chaque pieu. Il en manque un : il le plante lui-même, avec la tête.' },
      { name: 'La Légion', text: 'Six mille hommes qui marchent au même pas.', cost: $('A7 T3'), req: { tags: { Guerre: 1 } }, gift: 'Elle rapporte 1 Armée par saison.', passive: { type: 'income', res: 'armee', amount: 1 }, shape: 'aigle', built: 'Six mille hommes défilent au même pas. Le sol tremble. Au loin, {rival} décident que la marche à pied, c’est surfait.' },
      { name: 'La Forteresse', text: 'Des murs si épais qu’on y loge les ennemis, pour les impressionner.', cost: $('A10 V4'), req: { tags: { Guerre: 2 } }, gift: 'Elle compte pour deux cartes Guerre.', passive: { type: 'tagBonus', tag: 'Guerre', amount: 2 }, shape: 'forteresse', built: 'La forteresse est achevée. Elle est si épaisse qu’on a oublié de prévoir des fenêtres. {F:ourk} trouve ça parfait.',
        alt: { lock: 'alt_empire', name: 'La Voie impériale', text: 'Une route droite d’un bout à l’autre de la vallée. Les légions arrivent partout en trois jours. Les impôts, en deux.', cost: $('A9 T6'), req: { tags: { Guerre: 2 } }, gift: 'Elle rapporte 2 Trésor par saison.', passive: { type: 'income', res: 'tresor', amount: 2 }, shape: 'voie', built: 'La voie est tracée, droite comme une flèche, d’un bout à l’autre de la vallée. Les légions la parcourent en trois jours. Les collecteurs d’impôts, en deux.' } },
      { name: 'L’Arsenal', text: 'Une usine qui ne fabrique qu’une chose. Beaucoup.', cost: $('A13 T6'), req: { tags: { Guerre: 3 } }, gift: 'Il rapporte 2 Armée par saison.', passive: { type: 'income', res: 'armee', amount: 2 }, shape: 'arsenal', built: 'Les cheminées fument jour et nuit. On fabrique des canons, puis des canons pour fabriquer des canons. Personne ne sait plus très bien qui a commencé.' },
      { name: 'La Capitulation', text: '{Rival} signent. Sur votre table, avec votre stylo.', cost: $('A17 T8 V5'), req: { tags: { Guerre: 4 } }, gift: 'La vallée.', shape: 'drapeau', built: '{Rival} signent, sur votre table, avec votre stylo. {Reine} garde le stylo. Vous le lui laissez : c’est la seule chose qu’{elle} emporte.' },
    ],
  },
  {
    id: 'posterite', name: 'Être chantés pour toujours', tag: 'Culture', ending: 'culture',
    pitch: 'Qu’on chante {cite} quand plus personne ne se souviendra de {rival}. Il faudra du Trésor, et une culture.',
    jalons: [
      { name: 'Les Peintures de la grotte', text: 'Des mains, des bisons, et vous, plus grand que nature.', cost: $('T5'), gift: 'On pardonne à qui l’on a peint : à chaque fin d’ère, les familles hostiles remontent d’un cran.', passive: { type: 'mend' }, shape: 'grotte', built: 'Des mains, des bisons, et vous, immense, au milieu. Les enfants viennent toucher la paroi. Dans dix mille ans, on la visitera avec des billets.' },
      { name: 'Le Théâtre', text: 'Des gradins de pierre où l’on rit de vous, ce qui vous rend populaire.', cost: $('T8 V2'), req: { tags: { Culture: 2 } }, gift: 'Il rapporte 1 Trésor par saison.', passive: { type: 'income', res: 'tresor', amount: 1 }, shape: 'theatre', built: 'La première pièce se moque de vous pendant trois heures. Le public rit, vous aussi, par politique. La deuxième pièce se moque du public.' },
      { name: 'La Cathédrale', text: 'Trois siècles de chantier. On y entend une mouche penser.', cost: $('T11 S4'), req: { tags: { Culture: 3 } }, gift: 'Elle rapporte 2 Vivres par saison.', passive: { type: 'income', res: 'vivres', amount: 2 }, shape: 'cathedrale', built: 'Trois siècles de chantier, et la cathédrale est debout. Le premier architecte est mort, le dernier aussi, et la flèche penche un peu. On dira que c’est voulu.',
        alt: { lock: 'alt_posterite', name: 'La Bibliothèque', text: 'Tous les livres du monde. Certains en deux exemplaires, au cas où. Le bibliothécaire refuse de prêter.', cost: $('T10 S6'), req: { tags: { Culture: 3 } }, gift: 'Elle compte pour deux cartes Culture.', passive: { type: 'tagBonus', tag: 'Culture', amount: 2 }, shape: 'bibliotheque', built: 'Tous les livres du monde sous un même toit. Le bibliothécaire en prête un, le premier jour, puis se ravise.' } },
      { name: 'L’Exposition universelle', text: 'Une tour de fer, provisoire. Elle restera.', cost: $('T15 S6'), req: { tags: { Culture: 4 } }, gift: 'Elle rapporte 2 Trésor par saison.', passive: { type: 'income', res: 'tresor', amount: 2 }, shape: 'tour_fer', built: 'La tour de fer domine la ville. Les poètes signent une pétition contre elle, puis montent au sommet pour la vue.' },
      { name: 'Le Grand Récit', text: 'Votre histoire, gravée, chantée, diffusée, traduite dans toutes les langues. Même les mortes.', cost: $('T19 V5 S5'), req: { tags: { Culture: 5 } }, gift: 'L’éternité.', shape: 'recit', built: 'Votre histoire part sur toutes les ondes, dans toutes les langues, même les mortes. Quelque part, très loin, quelqu’un l’écoute. Il rit aux bons endroits.' },
    ],
  },
];

export const origins: OriginDef[] = [
  { id: 'feu', name: 'Les Gens du Feu', text: 'Un feu, quatre familles, et déjà des problèmes.', res: { vivres: 6, armee: 4, savoir: 3, tresor: 4 }, quartiers: 3, families: ['ourk', 'sel', 'brume', 'troc'] },
  { id: 'fleuve', name: 'Les Gens du Fleuve', text: 'Une terre grasse, un fleuve qui déborde. On mange bien, on se bat mal.', res: { vivres: 10, armee: 2, savoir: 3, tresor: 4 }, quartiers: 4, families: ['ourk', 'sel', 'brume', 'troc'], unlock: 'atteindre le Moyen Âge' },
  { id: 'heritiers', name: 'Les Héritiers', text: 'Vous bâtissez sur les ruines d’une civilisation morte. Elle avait laissé de l’or. Et une famille qui vous en veut déjà.', res: { vivres: 5, armee: 4, savoir: 5, tresor: 7 }, quartiers: 3, families: ['ourk', 'sel', 'brume', 'troc'], mem: ['heritiers'], unlock: 'laisser une première civilisation derrière soi' },
];

export const rivals: RivalDef[] = [
  { id: 'orvandes', name: 'les Orvandes', hue: 268, she: true, voice: 'Une politesse assassine, par lettres.',
    leader: ['la cheffe Ysolde', 'la reine Ysolde II', 'la reine Ysolde IX', 'la présidente Ysolde', 'Ysolde-∞'],
    jalons: ['le Menhir des Orvandes', 'le Colosse d’Ysolde', 'la Grande Muraille', 'le Chemin de fer d’Ysolde', 'l’Ascenseur spatial'] },
  { id: 'harsk', name: 'les Harsk', hue: 0, she: false, voice: 'Hurle ses lettres. Les signe avec une hache.',
    leader: ['le grand Harsk', 'Harsk le Conquérant', 'le roi Harsk XIV', 'le maréchal Harsk', 'HARSK PRIME'],
    jalons: ['le Tumulus des Harsk', 'l’Arène de Harsk', 'la Forteresse noire', 'l’Usine à canons', 'la Lune de guerre'] },
  { id: 'ombre', name: 'les Ombres', hue: 230, she: true, voice: 'Ne signe jamais. Sait déjà ce que vous allez répondre.',
    leader: ['l’Ombre', 'l’Ombre pourpre', 'le Conseil d’Ombre', 'la Directrice', 'OMBRE'],
    jalons: ['la Pierre qui écoute', 'la Bibliothèque fermée', 'le Labyrinthe', 'le Bureau des fiches', 'le Grand Miroir'] },
];

const N = <T>(a: T, b: T, c: T, d: T, e: T): [T, T, T, T, T] => [a, b, c, d, e];

export const routes: RouteDef[] = [
  { id: 'camp_ourk', family: 'ourk', art: { motif: 'fang', hue: 8 },
    name: N('Le Camp des Ourk', 'La Caserne des Ourkides', 'Le Château des Ourquin', 'L’État-major Ourkov', 'La Base orbitale Ourk-7'),
    promise: 'Les affaires de {H:ourk}. On en revient avec de l’Armée.', encounters: ['r_ourk_recrue', 'r_ourk_defile', 'r_ourk_trophee'] },
  { id: 'grotte_sel', family: 'sel', art: { motif: 'eye', hue: 44 },
    name: N('La Grotte de Mère Sel', 'Le Sanctuaire de Sélènè', 'L’Abbaye des Salière', 'L’Évêché Salin', 'L’Église orbitale'),
    promise: 'Les affaires de {H:sel}. Des vivres, des miracles, des factures.', encounters: ['r_sel_miracle', 'r_sel_relique', 'r_sel_jeune'] },
  { id: 'rocher_brume', family: 'brume', art: { motif: 'spiral', hue: 205 },
    name: N('Le Rocher de Brume', 'La Tour des Brumides', 'Le Scriptorium des Brumaire', 'Le Laboratoire Brumel', 'Le Centre de calcul'),
    promise: 'Les affaires de {H:brume}. Du Savoir, et des choses qui explosent.', encounters: ['r_brume_eleve', 'r_brume_erreur', 'r_brume_machine'] },
  { id: 'comptoir_troc', family: 'troc', art: { motif: 'coin', hue: 150 },
    name: N('Le Comptoir de Troc', 'Le Port des Trokides', 'La Banque Troquet', 'Les Usines Troc et Fils', 'La Tour TrocCorp'),
    promise: 'Les affaires de {H:troc}. Du Trésor, et des contrats à relire deux fois.', encounters: ['r_troc_marche', 'r_troc_contrat', 'r_troc_faillite'] },
  { id: 'frontiere', art: { motif: 'road', hue: 0 },
    name: 'La Frontière', promise: 'Du butin, et des nouvelles de {rival}.', risk: 'Sans Armée, la frontière se défend mal.',
    encounters: ['r_front_raid', 'r_front_marchands', 'r_front_deserteur'] },
  { id: 'inconnu', art: { motif: 'moon', hue: 280 },
    name: 'L’Inconnu', promise: 'Ruines, présages, bizarreries.', risk: 'Personne n’en revient tout à fait pareil.',
    encounters: ['r_inc_voyageur', 'r_inc_puits', 'r_inc_comete'] },
];

/** Cartes que le moteur assemble lui-même. */
export const engineCards = [
  card({ id: 'presage', kind: 'presage', title: 'Présage', text: '', options: [{ label: 'En route', effect: {} }] }),
  card({ id: 'carrefour', kind: 'carrefour', title: 'Le Carrefour', text: 'Une saison commence. Où porter vos pas ?', options: [], art: { motif: 'road' } }),
  card({ id: 'jalon', kind: 'jalon', title: 'Le Jalon', text: '', options: [], art: { motif: 'tower' } }),
  card({ id: 'disette', kind: 'intrigue', title: 'Les Greniers vides', text: '', options: [], art: { motif: 'wheat', hue: 30 } }),
  card({ id: 'rattrapage', kind: 'jalon', title: 'Le Chantier oublié', text: '', options: [], art: { motif: 'tower' } }),
  card({ id: 'decouverte', kind: 'decouverte', title: 'Que découvrir ?', text: 'Les savants proposent trois pistes. Une seule sera suivie. Les autres iront chez {rival}.', options: [], art: { motif: 'scroll' } }),
  card({ id: 'croissance', kind: 'croissance', title: 'Les Greniers débordent', text: 'Assez de vivres pour fonder un nouveau quartier. Ou pour tenir le prochain hiver, qui sera long. Ils le sont tous.', options: [], art: { motif: 'house' } }),
  card({
    id: 'triomphe', kind: 'rivale', oneShot: true, scale: true, title: 'Le Triomphe de {rival}', speaker: '{Reine}', art: { motif: 'crown', hue: 268 },
    text: '{Rival} ont achevé leur grand dessein. {Reine} vous invite à la cérémonie, au premier rang, « pour que vous voyiez bien ». Toute la vallée regarde ce que vous allez faire.',
    options: [
      { label: 'Applaudir', cost: $('T3'), effect: { rival: 2, loy: { troc: 1 } }, reply: 'Vous applaudissez, très fort. {Reine} remarque que vous applaudissez faux, et vous remercie quand même.' },
      { label: 'Saboter la cérémonie', cost: $('A3'), effect: { rival: -2, bet: { chance: 0.5, per: { tag: 'Guerre', bonus: 0.1 },
        win: { rivalJalon: -1, loy: { ourk: 1 }, reply: 'Le monument s’effondre pendant le discours. {Reine} finit son discours quand même, sur les gravats.' },
        lose: { quartiers: -1, cause: 'les représailles de {rival}', reply: 'Les saboteurs sont pris. {Rival} répondent. Un quartier en paie le prix.' } } } },
      { label: 'Ne pas y aller', effect: { loy: { ourk: -1, sel: -1, brume: -1, troc: -1 } }, reply: 'Vous restez chez vous. La vallée vous trouve petit. Vos familles aussi, et elles le disent.' },
    ],
  }),
  card({
    id: 'tribut', kind: 'intrigue', scale: true, title: 'Le Tribut de {rival}', speaker: '{Reine}', art: { motif: 'crown', hue: 268 },
    text: '{Rival} ont achevé leur dessein, et la vallée leur appartient un peu, de l’avis de {reine}. « Un petit tribut, ma chère voisine. Pour l’entretien de la vallée. Et de mes merveilles, qui vous font de l’ombre. »',
    options: [
      { label: 'Payer le tribut', cost: $('T4'), effect: { rival: 1 }, reply: '{Reine} compte devant vous, puis vous rend une pièce : « Pour votre peine. » C’est la pièce la plus chère de votre vie.' },
      { label: 'Céder un quartier', effect: { quartiers: -1, cause: 'le tribut de {rival}', rival: 1 }, reply: 'Un quartier change de drapeau. On y parle déjà comme chez {rival}, avec l’accent.' },
      { label: 'Refuser, armes à la main', warn: 'Sans {s:4} Armée, ils prennent un quartier de force',
        effect: { rival: -1, if: { res: $('A4') }, then: { gain: $('A-2'), mem: ['tribut_refuse'], reply: 'Vos soldats tiennent la frontière. {Reine} remballe sa liste. {elle} la gardera pour l’ère prochaine.' },
          else: { quartiers: -1, cause: '{rival}, venus chercher leur tribut', reply: '{Rival} viennent se servir. Ils emportent un quartier, et laissent une facture pour le dérangement.' } } },
      { label: 'Saboter une de leurs merveilles', cost: $('A3'), effect: { rival: -2, bet: { chance: 0.45, per: { tag: 'Guerre', bonus: 0.1 },
        win: { rivalJalon: -1, reply: 'Une de leurs merveilles s’effondre en pleine nuit. Plus de triomphe, plus de tribut : {reine} doit tout recommencer, et vous regarde autrement.' },
        lose: { quartiers: -1, cause: 'les représailles de {rival}', reply: 'Les saboteurs sont pris. {Rival} répondent sans attendre. Un quartier en paie le prix.' } } } },
    ],
  }),
  card({
    id: 'creance', kind: 'intrigue', scale: true, family: 'troc', title: 'La Créance', art: { motif: 'scales', hue: 150 },
    text: '{F:troc} présente la note du crédit. « Le principal, les intérêts, les intérêts des intérêts, et un petit quelque chose pour l’émotion. » Il a apporté un huissier. L’huissier a apporté un autre huissier.',
    options: [
      { label: 'Payer rubis sur l’ongle', cost: $('T6'), effect: { loy: { troc: 1 } }, reply: 'Vous payez. {F:troc} compte deux fois, puis vous serre la main. Il garde le reçu pour la prochaine fois.' },
      { label: 'Gager un quartier', effect: { quartiers: -1, cause: 'la créance des Troc', loy: { troc: 1 } }, reply: 'Un quartier passe aux mains de {H:troc}. Ils y installent des boutiques, et vous facturent le droit d’y passer.' },
      { label: 'Refuser de payer', effect: { loy: { troc: -3 }, mem: ['dette_refusee'], sched: [{ card: 'creance_rivale', in: 3 }] }, reply: 'Vous refusez. {F:troc} sourit, range la note dans sa sacoche, et prend la route de chez {rival}. Une dette, ça se revend.' },
    ],
  }),
  card({
    id: 'creance_2', kind: 'intrigue', scale: true, family: 'troc', title: 'La Seconde Créance', art: { motif: 'scales', hue: 150 },
    text: '{F:troc} revient avec la note. Elle est plus épaisse. « Nous avons ajouté les frais de la première, et les frais de rédaction de la seconde. » L’huissier salue : il commence à se sentir chez lui.',
    options: [
      { label: 'Payer, en grinçant', cost: $('T7'), effect: { loy: { troc: 1 } }, reply: 'Vous payez. {F:troc} vous offre un calendrier, avec les échéances déjà entourées.' },
      { label: 'Gager un quartier', effect: { quartiers: -1, cause: 'la seconde créance des Troc' }, reply: 'Un quartier de plus passe aux mains de {H:troc}. Ils le rebaptisent « Quartier de la Confiance ». Il y a un péage.' },
      { label: 'Refuser de payer', effect: { loy: { troc: -3 }, mem: ['dette_refusee'], sched: [{ card: 'creance_rivale', in: 3 }] }, reply: 'Vous refusez encore. {F:troc} soupire comme on soupire sur un mauvais placement, et part vendre votre dette à {rival}, avec une remise.' },
    ],
  }),
  card({
    id: 'creance_3', kind: 'intrigue', scale: true, family: 'troc', title: 'La Saisie', art: { motif: 'scales', hue: 150 },
    text: 'Cette fois, {F:troc} ne présente pas de note. Il présente des déménageurs. « Nous sommes des gens patients. Nous avons été patients trois fois. » Ils ont déjà mesuré vos fenêtres.',
    options: [
      { label: 'Tout rembourser', cost: $('T9'), effect: { loy: { troc: 2 } }, reply: 'Vous payez tout. {F:troc} est si ému qu’il vous propose aussitôt un nouveau crédit. Vous le raccompagnez.' },
      { label: 'Laisser saisir un quartier', effect: { quartiers: -1, cause: 'la saisie des Troc', loy: { troc: -1 } }, reply: 'Les déménageurs emportent un quartier, maison par maison. Ils laissent les rues, qu’ils jugent invendables.' },
      { label: 'Faire jeter les huissiers dehors', effect: { loy: { troc: -3 }, mem: ['dette_refusee'], sched: [{ card: 'creance_rivale', in: 2 }] }, reply: 'Les huissiers volent par la fenêtre. Ils atterrissent chez {rival}, qui rachète votre dette en les relevant.' },
    ],
  }),
  card({
    id: 'creance_rivale', kind: 'intrigue', scale: true, title: 'La Note de {rival}', speaker: '{Reine}', art: { motif: 'scroll', hue: 268 },
    text: '« Ma chère voisine, vous me devez quelque chose. Je ne voudrais pas insister. J’insiste. » La lettre est accompagnée de soldats, à titre de rappel.',
    options: [
      { label: 'Payer', cost: $('T6'), effect: { rival: 1 }, reply: '{Reine} vous remercie de votre ponctualité, avec une surprise feinte.' },
      { label: 'Céder un quartier', effect: { quartiers: -1, cause: 'la dette envers {rival}', rival: 1 }, reply: 'Un quartier change de drapeau. {Reine} y fait planter des fleurs, pour que vous les voyiez.' },
      { label: 'Ignorer la lettre', warn: '{Rival} se paieront : une merveille de plus chez eux, ou votre Trésor (à sec : un quartier) s’ils les ont toutes ; à la dernière ère, un quartier', effect: { rival: -2, if: { rivalJalons: 5 }, then: { if: { res: $('T8') }, then: { gain: $('T-8'), reply: '{Reine} n’a plus de merveille à bâtir : {elle} se sert dans vos coffres. Les soldats comptent devant vous, et laissent la monnaie.' }, else: { quartiers: -1, cause: '{rival}, qui se paient sur votre territoire', reply: 'Vos coffres sont vides : {reine} se paie en terrain. Un quartier change de drapeau.' } }, else: { if: { era: { min: 4 } }, then: { quartiers: -1, cause: '{rival}, qui se paient avant la fin des temps', reply: 'Plus le temps de bâtir quoi que ce soit : {reine} se paie en terrain, tout de suite. Un quartier change de drapeau.' }, else: { rivalJalon: 1, reply: '{Reine} se rembourse en pierres de taille : une merveille de plus chez {rival}.' } } } },
    ],
  }),
  card({ id: 'proces', kind: 'proces', title: 'Le Procès', text: '{maison} vous traduisent en justice. {plaignant} lit l’acte d’accusation. {objet}, {quand} : vous avez dit {citation}. {depuis}« Nous n’avons pas oublié. » Qui plaidera pour vous ?', options: [], art: { motif: 'scales' } }),
  card({
    id: 'ruines', kind: 'ruines', scale: true, title: 'Les Ruines de {ancienne}', art: { motif: 'skull' },
    text: 'Sous la colline dorment les restes de {ancienne}, tombée par {cause}. Sur une stèle, leurs derniers mots : « {testament} ».',
    options: [
      { label: 'Fouiller les ruines', cost: $('V2'), effect: { gain: $('S5 T3'), mem: ['ruines_fouillees'] },
        reply: 'Des outils, des tablettes, et une statue de quelqu’un qui vous ressemble beaucoup. Gênant.' },
      { label: 'Bâtir par-dessus', cost: $('V3'), effect: { quartiers: 1, mem: ['ruines_baties'], sched: [{ card: 'ruines_caves', in: 5 }] },
        reply: 'Un nouveau quartier, sur des fondations solides. Les caves font des bruits, la nuit.' },
      { label: 'Honorer les morts', cost: $('T2'), effect: { loy: { sel: 2, ourk: 1 }, mem: ['ruines_honorees'] },
        reply: '{F:sel} officie. Elle dit que les morts sont contents. Elle dit ça de tous les morts.' },
    ],
  }),
  card({
    id: 'ruines_caves', kind: 'intrigue', scale: true, arc: 'caves', finale: true, title: 'Les Caves', art: { motif: 'skull', hue: 280 },
    text: 'Sous le quartier bâti sur {ancienne}, les caves murmurent. Les habitants entendent des voix. Elles répètent : « {testament} » Les loyers baissent.',
    options: [
      { label: 'Exorciser', cost: $('T3'), effect: { loy: { sel: 1 } }, reply: '{F:sel} chasse les voix avec de l’encens et une facture. Les voix se taisent. La facture, non.' },
      { label: 'Faire visiter', effect: { gain: $('T5'), loy: { sel: -1, troc: 1 } }, reply: '{F:troc} vend des billets pour « les Caves hantées de {ancienne} ». Les voix font salle comble.' },
      { label: 'Écouter les voix', cost: $('S2'), effect: { gain: $('S4'), loy: { brume: 1 }, mem: ['caves_ecoutees'] }, reply: '{F:brume} enregistre les voix et les traduit. Elles se plaignent surtout des loyers.' },
    ],
  }),
  card({
    id: 'revenants', kind: 'revenant', scale: true, title: 'Les Revenants', art: { motif: 'hand' },
    text: 'Des réfugiés arrivent des ruines de {ancienne}. Ce sont {griefmaison}. Ils portent une stèle : « {griefdate} : {grief} ». Ils pensent que c’était vous. Ils n’ont pas tout à fait tort.',
    options: [
      { label: 'Les accueillir', cost: $('V4'), effect: { quartiers: 1, mem: ['revenants_accueillis'] },
        reply: 'Ils s’installent. Ils sont travailleurs, rancuniers et très nombreux. Un quartier entier.' },
      { label: 'Leur demander pardon', effect: { gain: $('S3'), loy: { sel: 1 }, mem: ['revenants_pardon'] },
        reply: 'Vous demandez pardon pour ce qu’a fait votre prédécesseur. Ils acceptent. Ils gardent la stèle.' },
      { label: 'Les chasser', effect: { gain: $('A2'), rival: -1, mem: ['revenants_chasses'] },
        reply: 'Ils partent chez {rival}. {Reine} les accueille, et lit leur stèle avec beaucoup d’intérêt.' },
    ],
  }),
];
