/** Familles, desseins, origines, rivales, routes et cartes du moteur. */
import type { DesseinDef, FamilyDef, FamilyId, OriginDef, RivalDef, RouteDef } from '../core/types';
import { $, card } from './dsl';

export const families: Record<FamilyId, FamilyDef> = {
  ourk: {
    id: 'ourk', tag: 'Guerre', res: 'armee', hue: 8, motif: 'fang',
    head: ['Ourk', 'Ourkos', 'Sire Ourquin', 'le colonel Ourkov', 'l’amirale Ourk-7'],
    house: ['les Ourk', 'les Ourkides', 'les Ourquin', 'les Ourkov', 'les Ourkonautes'],
    trade: ['chasseurs', 'légionnaires', 'chevaliers', 'officiers', 'amiraux'],
    voice: 'Parle de lui à la troisième personne. Depuis dix mille ans.',
  },
  sel: {
    id: 'sel', tag: 'Foi', res: 'vivres', hue: 44, motif: 'eye',
    head: ['Mère Sel', 'Sélènè la Pythie', 'l’abbesse Salière', 'Monseigneur Salin', 'la révérende Sel'],
    house: ['les Sel', 'les Sélénides', 'les Salière', 'les Salin', 'les Sélestes'],
    trade: ['chamanes', 'oracles', 'moniales', 'prélats', 'télévangélistes'],
    voice: 'Prédit le malheur et tend la main.',
  },
  brume: {
    id: 'brume', tag: 'Science', res: 'savoir', hue: 205, motif: 'spiral',
    head: ['le vieux Brume', 'Brumos le Mesureur', 'frère Brumaire', 'le docteur Brumel', 'BRUME'],
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
      { name: 'Le Cercle de pierres', text: 'Des pierres dressées qui annoncent les saisons.', cost: $('S5'), gift: 'Il rapporte 1 Savoir par saison.', passive: { type: 'income', res: 'savoir', amount: 1 }, shape: 'cercle' },
      { name: 'La Tour des astronomes', text: 'Une tour pour regarder plus haut que les autres.', cost: $('S9 V3'), req: { tags: { Science: 2 } }, gift: 'Les découvertes coûtent 2 Savoir de moins.', passive: { type: 'discount', res: 'savoir', amount: 2 }, shape: 'tour' },
      { name: 'L’Observatoire', text: 'Une coupole et une lunette. On y voit venir les ennuis.', cost: $('S14 T5'), req: { tags: { Science: 3 } }, gift: 'Chaque ère, la première perte de quartier est évitée.', passive: { type: 'shield', amount: 1 }, shape: 'dome',
        alt: { lock: 'alt_etoiles', name: 'Le Grand Télescope', text: 'Un tube de cuivre long comme une rue. On y voit {reine} se gratter le nez, de l’autre côté de la vallée.', cost: $('S12 T7'), req: { tags: { Science: 3 } }, gift: 'Il rapporte 2 Savoir par saison.', passive: { type: 'income', res: 'savoir', amount: 2 }, shape: 'telescope' } },
      { name: 'Le Pas de tir', text: 'Du béton, des tours de lancement, des ingénieurs nerveux.', cost: $('S19 T8'), req: { tags: { Science: 4 } }, gift: 'Il rapporte 2 Savoir par saison.', passive: { type: 'income', res: 'savoir', amount: 2 }, shape: 'fusee' },
      { name: 'L’Arche', text: 'Un vaisseau assez grand pour emporter une civilisation. Et ses rancunes.', cost: $('S22 T9 V6'), req: { tags: { Science: 5 } }, gift: 'Le départ.', shape: 'arche' },
    ],
  },
  {
    id: 'empire', name: 'Soumettre la vallée', tag: 'Guerre', ending: 'military',
    pitch: 'La vallée sera à vous, et {rival} avec. Il faudra de l’Armée, et des guerriers fidèles.',
    jalons: [
      { name: 'La Palissade', text: 'Des pieux, des guetteurs, une porte qui ne grince pas.', cost: $('A5'), gift: 'Chaque ère, la première perte de quartier est évitée.', passive: { type: 'shield', amount: 1 }, shape: 'palissade' },
      { name: 'La Légion', text: 'Six mille hommes qui marchent au même pas.', cost: $('A8 T3'), req: { tags: { Guerre: 2 } }, gift: 'Elle rapporte 1 Armée par saison.', passive: { type: 'income', res: 'armee', amount: 1 }, shape: 'aigle' },
      { name: 'La Forteresse', text: 'Des murs si épais qu’on y loge les ennemis, pour les impressionner.', cost: $('A11 V4'), req: { tags: { Guerre: 3 } }, gift: 'Elle compte pour deux cartes Guerre.', passive: { type: 'tagBonus', tag: 'Guerre', amount: 2 }, shape: 'forteresse',
        alt: { lock: 'alt_empire', name: 'La Voie impériale', text: 'Une route droite d’un bout à l’autre de la vallée. Les légions arrivent partout en trois jours. Les impôts, en deux.', cost: $('A9 T6'), req: { tags: { Guerre: 3 } }, gift: 'Elle rapporte 2 Trésor par saison.', passive: { type: 'income', res: 'tresor', amount: 2 }, shape: 'voie' } },
      { name: 'L’Arsenal', text: 'Une usine qui ne fabrique qu’une chose. Beaucoup.', cost: $('A15 T6'), req: { tags: { Guerre: 4 } }, gift: 'Il rapporte 2 Armée par saison.', passive: { type: 'income', res: 'armee', amount: 2 }, shape: 'arsenal' },
      { name: 'La Capitulation', text: '{Rival} signent. Sur votre table, avec votre stylo.', cost: $('A19 T8 V5'), req: { tags: { Guerre: 5 } }, gift: 'La vallée.', shape: 'drapeau' },
    ],
  },
  {
    id: 'posterite', name: 'Être chantés pour toujours', tag: 'Culture', ending: 'culture',
    pitch: 'Qu’on chante {cite} quand plus personne ne se souviendra de {rival}. Il faudra du Trésor, et une culture.',
    jalons: [
      { name: 'Les Peintures de la grotte', text: 'Des mains, des bisons, et vous, plus grand que nature.', cost: $('T5'), gift: 'Personne ne peut tout à fait vous haïr : aucune loyauté ne descend sous −2.', passive: { type: 'loyalty', family: 'all', floor: -2 }, shape: 'grotte' },
      { name: 'Le Théâtre', text: 'Des gradins de pierre où l’on rit de vous, ce qui vous rend populaire.', cost: $('T9 V3'), req: { tags: { Culture: 2 } }, gift: 'Il rapporte 1 Trésor par saison.', passive: { type: 'income', res: 'tresor', amount: 1 }, shape: 'theatre' },
      { name: 'La Cathédrale', text: 'Trois siècles de chantier. On y entend une mouche penser.', cost: $('T13 S5'), req: { tags: { Culture: 3 } }, gift: 'Elle rapporte 2 Vivres par saison.', passive: { type: 'income', res: 'vivres', amount: 2 }, shape: 'cathedrale',
        alt: { lock: 'alt_posterite', name: 'La Bibliothèque', text: 'Tous les livres du monde. Certains en deux exemplaires, au cas où. Le bibliothécaire refuse de prêter.', cost: $('T11 S7'), req: { tags: { Culture: 3 } }, gift: 'Elle compte pour deux cartes Culture.', passive: { type: 'tagBonus', tag: 'Culture', amount: 2 }, shape: 'bibliotheque' } },
      { name: 'L’Exposition universelle', text: 'Une tour de fer, provisoire. Elle restera.', cost: $('T18 S7'), req: { tags: { Culture: 4 } }, gift: 'Elle rapporte 2 Trésor par saison.', passive: { type: 'income', res: 'tresor', amount: 2 }, shape: 'tour_fer' },
      { name: 'Le Grand Récit', text: 'Votre histoire, gravée, chantée, diffusée, traduite dans toutes les langues. Même les mortes.', cost: $('T22 V6 S6'), req: { tags: { Culture: 5 } }, gift: 'L’éternité.', shape: 'recit' },
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
  { id: 'ombre', name: 'la Ligue d’Ombre', hue: 230, she: true, voice: 'Ne signe jamais. Sait déjà ce que vous allez répondre.',
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
    promise: 'Les affaires de {H:troc}. Du Trésor, à prix d’ami.', encounters: ['r_troc_marche', 'r_troc_contrat', 'r_troc_faillite'] },
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
  card({ id: 'decouverte', kind: 'decouverte', title: 'Que découvrir ?', text: 'Les savants proposent trois pistes. Une seule sera suivie. Les autres iront chez {rival}.', options: [], art: { motif: 'scroll' } }),
  card({ id: 'croissance', kind: 'croissance', title: 'Les Greniers débordent', text: 'Assez de vivres pour fonder un nouveau quartier. Ou pour tenir le prochain hiver, qui sera long. Ils le sont tous.', options: [], art: { motif: 'house' } }),
  card({ id: 'proces', kind: 'proces', title: 'Le Procès', text: '{maison} vous traduisent en justice. {plaignant} lit l’acte d’accusation : {citation}, {quand}. « Nous n’avons pas oublié. » Qui plaidera pour vous ?', options: [], art: { motif: 'scales' } }),
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
