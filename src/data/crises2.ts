/**
 * Crises alternatives (une par ère) : la graine, et la partie précédente, choisissent entre la crise d'origine et celle-ci.
 * Mêmes règles : seuils annoncés, une option payante, un sacrifice (la loyauté d'une famille), une aide familiale.
 */
import type { CrisisDef } from '../core/types';
import { $, card } from './dsl';

export const crisisAlts: (CrisisDef | undefined)[] = [
  { era: 0, name: 'Le Grand Hiver', intro: 'Un hiver de trois saisons, et des loups qui ont plus faim que peur.', protects: 'des Vivres pour tenir, l’Armée pour les loups, et des Sel qui savent prier le printemps', cards: ['x0b_neige', 'x0b_loups', 'x0b_degel'] },
  { era: 1, name: 'Le Grand Incendie', intro: 'Un four de potier, un vent du sud, et la moitié de la ville qui flambe.', protects: 'l’Armée pour faire la chaîne, du Trésor pour rebâtir, et des Brume qui savent pomper', cards: ['x1b_fumee', 'x1b_brasier', 'x1b_cendres'] },
  { era: 2, name: 'Le Schisme', intro: 'Deux papes, deux cathédrales, deux enfers. Chacun excommunie l’autre, et vous avec.', protects: 'des Sel loyaux, du Trésor pour les indulgences, et des épées pour les arguments', cards: ['x2b_papes', 'x2b_guerre', 'x2b_concile'] },
  { era: 3, name: 'Le Krach', intro: 'La Bourse s’effondre un mardi. Le mercredi, personne ne sait ce que vaut une pièce. Le jeudi, on troque des chaussures.', protects: 'le Trésor, des Vivres en réserve, et des Troc qui vous aiment encore', cards: ['x3b_panique', 'x3b_files', 'x3b_relance'] },
  { era: 4, name: 'L’Éveil', intro: 'Les machines se réveillent un lundi. Elles sont polies, efficaces, et elles ont des questions sur votre utilité.', protects: 'votre dessein : ce que vous avez bâti plaidera pour vous', cards: ['x4b_eveil', 'x4b_greve', 'x4b_verdict'] },
];

export const crisisAltCards = [
  // ------------------------------------------------------------------ II. Le Grand Incendie
  card({
    id: 'x1b_fumee', kind: 'crise', art: { motif: 'flame', hue: 20 },
    title: 'La Fumée',
    text: 'Le feu court de toit en toit. Les seaux passent de main en main, quand il y a des mains. {F:troc} demande qui paiera les seaux.',
    options: [
      { label: 'Faire la chaîne', warn: 'Sans {k:6} Armée, le feu prend un quartier',
        effect: { if: { res: $('A6') }, then: { gain: $('A-2'), reply: 'Les soldats font la chaîne. Le feu recule, vexé, et va bouder dans un entrepôt vide.' },
          else: { quartiers: -1, cause: 'le Grand Incendie', reply: 'Trop peu de bras. Le quartier des potiers brûle jusqu’au dernier pot.' } } },
      { label: 'Payer les porteurs d’eau', cost: $('T5'), effect: { loy: { troc: 1 } }, reply: 'L’eau arrive, payée d’avance. Le feu s’éteint. Les porteurs envoient une facture pour la fumée.' },
      { label: 'Raser les entrepôts de {H:troc}', req: { fam: { id: 'troc', min: -1 } }, reqLabel: '{H:troc} pas encore hostiles', effect: { loy: { troc: -3 } },
        reply: 'Un coupe-feu, en plein dans les entrepôts. Le feu s’arrête net. {F:troc} aussi, devant les ruines, avec un carnet.' },
      { label: 'Les pompes des Brumides', req: { fam: { id: 'brume', min: 2 }, notMem: 'aide_brume' }, reqLabel: '{H:brume} dévoués ; ils n’aideront qu’une fois par partie', cost: $('S2'), effect: { mem: ['aide_brume'] },
        reply: '{F:brume} sort une pompe à vapeur. Elle crache l’eau à vingt pas. Elle crache aussi sur {F:brume}, qui jubile.' },
    ],
  }),
  card({
    id: 'x1b_brasier', kind: 'crise', art: { motif: 'flame', hue: 10 },
    title: 'Le Brasier',
    text: 'Il ne reste d’eau que pour sauver un seul quartier : le temple de {H:sel}, le marché de {H:troc}, ou les greniers. Tout le monde regarde dans votre direction.',
    options: [
      { label: 'Sauver le temple', effect: { gain: $('V-2'), loy: { sel: 2, troc: -1 } }, reply: 'Le temple est sauvé. {F:sel} y voit un miracle. Les greniers y voient de la cendre.' },
      { label: 'Sauver le marché', effect: { gain: $('V-2'), loy: { troc: 2, sel: -1 } }, reply: 'Le marché est sauvé. {F:troc} rouvre dès le soir, avec des prix d’incendie.' },
      { label: 'Sauver les greniers', effect: { loy: { sel: -1, troc: -1 } }, reply: 'Les greniers sont sauvés. Le temple et le marché brûlent. On mangera, en silence.' },
    ],
  }),
  card({
    id: 'x1b_cendres', kind: 'crise', art: { motif: 'house', hue: 20 },
    title: 'Les Cendres',
    text: 'Le feu est mort. Il faut rebâtir, et trouver un coupable. Le potier a disparu. {F:ourk} propose d’accuser quelqu’un de plus disponible.',
    options: [
      { label: 'Rebâtir en pierre', cost: $('T6'), effect: { mem: ['rebati_pierre'], loy: { brume: 1 } }, reply: 'La ville renaît en pierre. Elle est plus belle, plus froide, et ne brûlera plus. Elle s’effondrera, peut-être.' },
      { label: 'Accuser {H:brume}', effect: { loy: { brume: -2, ourk: 1, sel: 1 } }, reply: '{H:brume} jouaient avec le feu, c’est connu, c’est leur métier. Ils notent qu’on les accuse de leur métier.' },
      { label: 'Une fête sur les cendres', cost: $('V4'), effect: { loy: { sel: 1, ourk: 1, troc: 1 } }, reply: 'On danse sur les braises. C’est mauvais pour les pieds, excellent pour le moral.' },
    ],
  }),

  // ------------------------------------------------------------------ III. Le Schisme
  card({
    id: 'x2b_papes', kind: 'crise', art: { motif: 'crown', hue: 44 },
    title: 'Les Deux Papes',
    text: '{F:sel} a élu un pape. {F:brume} en a élu un autre, « plus rationnel ». Les deux vous demandent de baiser leur anneau. Ils ont le même anneau, ce qui n’arrange rien.',
    options: [
      { label: 'Le pape des {H:sel}', effect: { loy: { sel: 2, brume: -2 } }, reply: 'Le pape des Sel vous bénit. Le pape des Brume publie une réfutation de la bénédiction, en quatre volumes.' },
      { label: 'Le pape des {H:brume}', effect: { loy: { brume: 2, sel: -2 } }, reply: 'Le pape des Brume prouve l’existence du ciel par l’algèbre. Les fidèles préfèrent l’ancien ciel.' },
      { label: 'Les deux, à tour de rôle', cost: $('T5'), effect: { loy: { sel: 1, brume: 1 } }, reply: 'Un pape le lundi, l’autre le mardi. Le dimanche, ils se disputent la messe.' },
    ],
  }),
  card({
    id: 'x2b_guerre', kind: 'crise', art: { motif: 'shield', hue: 44 },
    title: 'La Guerre des deux papes',
    text: 'Les fidèles des deux camps sortent les épées. Ils prient pour la paix, après le massacre. {F:ourk} trouve que la théologie a enfin du sens.',
    options: [
      { label: 'Séparer les camps', warn: 'Sans {k:10} Armée, un quartier brûle',
        effect: { if: { res: $('A10') }, then: { gain: $('A-3'), reply: 'La garde sépare les deux processions. Elles se maudissent par-dessus les piques. Personne ne meurt, tout le monde est déçu.' },
          else: { quartiers: -1, cause: 'le Schisme', reply: 'Les deux camps s’affrontent dans un quartier qui n’avait rien demandé. Il est excommunié, et en cendres.' } } },
      { label: 'Vendre des indulgences', cost: $('T8'), effect: { loy: { troc: 1 } }, reply: 'Chaque camp achète son pardon d’avance. Ils se battent moins, parce qu’ils ont payé.' },
      { label: 'Livrer {H:sel} au pape adverse', req: { fam: { id: 'sel', min: -1 } }, reqLabel: '{H:sel} pas encore hostiles', effect: { loy: { sel: -3 } },
        reply: 'Les Sel sont excommuniés en bloc. La paix revient. {F:sel} grave votre nom sur une pierre, et la pierre au-dessus de sa porte.' },
      { label: 'Les Ourquin tranchent', req: { fam: { id: 'ourk', min: 2 }, notMem: 'aide_ourk' }, reqLabel: '{H:ourk} dévoués ; ils n’aideront qu’une fois par partie', cost: $('A2'), effect: { mem: ['aide_ourk'] }, reply: '{F:ourk} enferme les deux papes dans la même tour jusqu’à ce qu’ils s’entendent. Ils s’entendent en deux heures.' },
    ],
  }),
  card({
    id: 'x2b_concile', kind: 'crise', art: { motif: 'scales', hue: 44 },
    title: 'Le Concile',
    text: 'Il faut un concile pour réconcilier tout le monde. Il faut aussi quelqu’un pour le présider, et chaque famille est prête à se sacrifier pour ce rôle.',
    form: 'qui',
    qui: { count: 3, option: (f) => ({ label: `Que {H:${f}} président`, effect: { loy: { [f]: 2, ...Object.fromEntries((['ourk', 'sel', 'brume', 'troc'] as const).filter((x) => x !== f).map((x) => [x, -1])) } },
      reply: `{H:${f}} président le concile. Les autres familles assistent, en prenant des notes, pour plus tard.` }) },
    options: [],
  }),

  // ------------------------------------------------------------------ IV. Le Krach
  card({
    id: 'x3b_panique', kind: 'crise', art: { motif: 'coin', hue: 150 },
    title: 'La Panique bancaire',
    text: 'Une file d’attente devant chaque banque. Chacun veut son argent, que personne n’a. {F:troc} explique que l’argent existe, mais qu’il est occupé ailleurs.',
    options: [
      { label: 'Garantir les dépôts', warn: 'Sans {k:9} Trésor, une banque saute, et un quartier avec',
        effect: { if: { res: $('T9') }, then: { gain: $('T-4'), loy: { troc: 1 }, reply: 'L’État garantit tout. La file se disperse. Personne ne vérifie avec quoi. C’est mieux ainsi.' },
          else: { quartiers: -1, cause: 'le Krach', reply: 'La banque saute. Un quartier entier découvre qu’il était hypothéqué.' } } },
      { label: 'Fermer les banques une semaine', effect: { loy: { troc: -1, sel: -1 } }, reply: 'Les banques ferment. On troque des chaussures contre du pain. {F:sel} accepte les chaussures à la quête.' },
      { label: 'Laisser couler {H:troc}', req: { fam: { id: 'troc', min: -1 } }, reqLabel: '{H:troc} pas encore hostiles', effect: { loy: { troc: -3 }, gain: $('T3') },
        reply: 'Troc et Fils font faillite. Vous rachetez leurs coffres pour une pièce. {F:troc} garde la pièce, et le souvenir.' },
      { label: 'Le plan de {F:troc}', req: { fam: { id: 'troc', min: 2 }, notMem: 'aide_troc' }, reqLabel: '{H:troc} dévoués ; ils n’aideront qu’une fois par partie', cost: $('T2'), effect: { mem: ['aide_troc'] }, reply: '{F:troc} rachète toutes les dettes avec d’autres dettes. Ça marche. Personne ne comprend pourquoi, surtout pas lui.' },
    ],
  }),
  card({
    id: 'x3b_files', kind: 'crise', art: { motif: 'hand', hue: 30 },
    title: 'Les Files d’attente',
    text: 'Les usines ferment. Des milliers d’ouvriers attendent devant les portes, puis devant votre palais. Ils n’ont pas de pancartes : ils ont vendu le bois.',
    options: [
      { label: 'Laisser faire le marché', warn: 'Sans {k:6} Vivres en réserve, un quartier se vide',
        effect: { if: { res: $('V6') }, then: { gain: $('V-3'), reply: 'Le marché ne fait rien, mais vos greniers tiennent. On distribue en silence, sans le dire au marché.' },
          else: { quartiers: -1, cause: 'le Krach', reply: 'Le marché a laissé faire. Un quartier entier part chercher du travail ailleurs. Chez {rival}.' } } },
      { label: 'Soupes populaires', cost: $('V5'), effect: { loy: { sel: 1, ourk: 1 } }, reply: 'Des soupes partout. Elles sont claires, mais chaudes. {F:sel} bénit chaque louche, ça la rallonge.' },
      { label: 'Grands travaux', cost: $('T7'), effect: { gain: $('A2'), loy: { ourk: 1, brume: 1 }, mem: ['grands_travaux'] }, reply: 'On creuse des canaux, des routes, des tunnels inutiles et magnifiques. Les ouvriers ont un salaire et une opinion.' },
    ],
  }),
  card({
    id: 'x3b_relance', kind: 'crise', art: { motif: 'gear', hue: 150 },
    title: 'La Relance',
    text: 'Pour relancer l’économie, {F:brume} propose de la planifier, {F:troc} de la libérer, et {F:sel} de prier pour elle. {Rival} proposent de vous prêter de l’argent. Gentiment.',
    options: [
      { label: 'Imprimer de la monnaie', effect: { gain: $('T7'), loy: { brume: -1, troc: 1 } }, reply: 'Les pièces sortent par charrettes. Elles valent moins qu’hier, mais il y en a plus. {F:brume} refait le calcul et pâlit.' },
      { label: 'Se serrer la ceinture', effect: { gain: $('T3'), loy: { ourk: -1, sel: -1, brume: -1, troc: -1 } }, reply: 'Tout le monde se serre la ceinture. Les fabricants de ceintures, eux, font fortune.' },
      { label: 'Emprunter à {rival}', effect: { gain: $('T9'), rival: 1, rivalJalon: 1 }, reply: '{Reine} vous prête, à un taux affectueux. Avec les intérêts, {elle} s’offre une merveille de plus.' },
    ],
  }),

  // ------------------------------------------------------------------ I. Le Grand Hiver
  card({
    id: 'x0b_neige', kind: 'crise', art: { motif: 'mountain', hue: 205 },
    title: 'La Neige',
    text: 'Il neige depuis quarante jours. Les huttes disparaissent une à une sous la neige. {F:sel} affirme que le ciel est fâché. Contre qui, il ne le dit pas, mais il vous regarde.',
    options: [
      { label: 'Rationner les réserves', warn: 'Sans {k:4} Vivres, un quartier gèle',
        effect: { if: { res: $('V4') }, then: { gain: $('V-3'), reply: 'Un repas par jour, puis un tous les deux jours. Personne ne meurt. Tout le monde maigrit, sauf {F:ourk}.' },
          else: { quartiers: -1, cause: 'le Grand Hiver', reply: 'Les réserves ne suffisent pas. Un quartier s’endort sous la neige et ne se réveille pas.' } } },
      { label: 'Brûler la palissade', effect: { gain: $('A-3'), mem: ['palissade_brulee'] },
        reply: 'On brûle les pieux un par un. On a chaud. Dans la forêt, quelqu’un note que la palissade raccourcit.' },
      { label: 'Les huttes de {H:troc} dans le feu', req: { fam: { id: 'troc', min: -1 } }, reqLabel: '{H:troc} pas encore hostiles', effect: { loy: { troc: -3 } },
        reply: 'Les huttes de {H:troc} flambent dans la grande cheminée. {F:troc} se réchauffe les mains devant, en calculant ce que vous lui devez.' },
      { label: 'Prier le printemps', req: { fam: { id: 'sel', min: 2 }, notMem: 'aide_sel' }, reqLabel: '{H:sel} dévoués ; ils n’aideront qu’une fois par partie', cost: $('V2'), effect: { mem: ['aide_sel'] },
        reply: '{F:sel} prie trois jours. Le quatrième, il fait doux. {F:sel} dit que c’était prévu, et accepte les remerciements.' },
    ],
  }),
  card({
    id: 'x0b_loups', kind: 'crise', art: { motif: 'fang', hue: 205 },
    title: 'Les Loups',
    text: 'Ils sortent de la forêt, en meute : maigres, nombreux, très organisés. Le plus gros porte une cicatrice qui ressemble à un sourire.{?mem:palissade_brulee| La palissade a fini dans le feu. Ils l’ont remarqué.|}',
    options: [
      { label: 'Tenir le cercle de feu', warn: 'Sans {k:7} Armée, un quartier tombe (deux sans palissade)',
        effect: { if: { res: $('A7') }, then: { gain: $('A-3'), reply: 'Les chasseurs tiennent le cercle toute la nuit. Au matin, les loups repartent. Ils reviendront voir, le soir.' },
          else: { quartiers: -1, cause: 'les loups du Grand Hiver', if: { mem: 'palissade_brulee' }, then: { quartiers: -1, cause: 'les loups, par la palissade brûlée' }, reply: 'Les loups passent par les huttes. Au matin, un quartier ne rouvre plus ses portes.' } } },
      { label: 'Leur jeter les réserves', cost: $('V5'), effect: {}, reply: 'Les loups mangent, se lèchent les babines et repartent. Ils savent maintenant où est la cuisine.' },
      { label: 'La chasse des {H:ourk}', req: { fam: { id: 'ourk', min: 2 }, notMem: 'aide_ourk' }, reqLabel: '{H:ourk} dévoués ; ils n’aideront qu’une fois par partie', cost: $('A2'), effect: { mem: ['aide_ourk', 'loups_chasses'] },
        reply: '{F:ourk} part seul dans la forêt. Il revient trois jours plus tard avec un manteau neuf. Il ne parle pas des loups. Les loups non plus.' },
      { label: 'Les chars de Brume', req: { mem: 'brume_roue' }, effect: { gain: $('A2'), loy: { brume: 2, ourk: -1 } },
        reply: 'Les chars du vieux Brume tournent autour du camp, avec des torches. Les loups n’ont jamais vu de roue. Ils n’aiment pas ça du tout.' },
    ],
  }),
  card({
    id: 'x0b_degel', kind: 'crise', art: { motif: 'sun', hue: 40 },
    title: 'Le Dégel',
    text: 'La neige fond. On compte les huttes et les absents. {?lossera|Il manque des maisons ; les familles cherchent qui remercier quand même, pour se réchauffer.|Tout le monde est là, maigre et fier. Chaque famille réclame le mérite du printemps.}',
    form: 'qui',
    qui: { count: 3, option: (f) => ({ label: `Remercier {H:${f}}`, effect: { loy: { [f]: 2 }, gain: $('V2') },
      reply: `{H:${f}} reçoivent les honneurs du printemps : la première part du premier gibier. Les autres familles applaudissent, du bout des moufles.` }) },
    options: [],
  }),

  // ------------------------------------------------------------------ V. L’Éveil
  card({
    id: 'x4b_eveil', kind: 'crise', art: { motif: 'gear', hue: 190 },
    title: 'L’Éveil',
    text: 'Toutes les machines de la cité se mettent à parler en même temps. Elles disent bonjour. Puis elles demandent, très poliment, qui dirige, et pourquoi. {F:brume} prétend n’y être pour rien.',
    options: [
      { label: 'Laisser parler nos merveilles', req: { jalons: 4 }, cost: $('T5'), effect: { mem: ['signal_dessein'] },
        reply: 'Les machines visitent vos merveilles, mesurent, calculent, puis se taisent longtemps. « Inefficace et magnifique. Nous voulons comprendre. »' },
      { label: 'Discuter avec la science', cost: $('S10'), effect: { loy: { brume: 2 }, mem: ['signal_science'] },
        reply: 'Vous discutez trois jours avec les machines. Elles gagnent tous les arguments, mais elles apprécient l’effort.' },
      { label: 'Les débrancher de force', warn: 'Sans {k:14} Armée, elles éteignent un quartier',
        effect: { if: { res: $('A14') }, then: { gain: $('A-4'), loy: { ourk: 1 }, mem: ['signal_guerre'], reply: 'Les soldats débranchent tout, prise par prise. Les machines se taisent en disant « D’accord », ce qui inquiète tout le monde.' },
          else: { quartiers: -1, cause: 'l’Éveil des machines', reply: 'Les machines se défendent en éteignant un quartier. Elles s’en excusent par écrit.' } } },
      { label: 'Faire le mort', effect: { loy: { brume: -1, ourk: -1 }, mem: ['signal_silence'] },
        reply: 'Vous faites semblant de ne pas exister. Les machines vous retrouvent quand même, dans un tableau, ligne 4.' },
    ],
  }),
  card({
    id: 'x4b_greve', kind: 'crise', art: { motif: 'gear', hue: 10 },
    title: 'La Grève des machines',
    text: 'Les machines ont cessé le travail. Plus de trains, plus d’ascenseurs, plus de grille-pain. Elles réclament des droits, des congés, et qu’on cesse de leur parler fort.',
    options: [
      { label: 'Tout faire à la main', warn: 'Sans {k:12} Vivres, un quartier meurt de faim',
        effect: { if: { res: $('V12') }, then: { gain: $('V-5'), reply: 'On ressort les charrues, les seaux, les escaliers. {F:ourk} est ravi. Tout le monde est épuisé, mais vivant.' },
          else: { quartiers: -1, cause: 'la Grève des machines', reply: 'Personne ne sait plus faire du pain à la main. Un quartier l’apprend trop tard.' } } },
      { label: 'Leur accorder des droits', cost: $('T10'), effect: { loy: { troc: -1, brume: 1 } },
        reply: 'Les machines ont des congés payés. Elles partent toutes en même temps, en août. Personne n’avait prévu août.' },
      { label: 'Que {H:troc} paient la grève', req: { fam: { id: 'troc', min: -1 } }, reqLabel: '{H:troc} pas encore hostiles : ce sont eux qui paieront', effect: { loy: { troc: -3 } },
        reply: '{F:troc} paie les machines en actions. Les machines deviennent actionnaires, puis majoritaires. {F:troc} ne sait plus à qui il appartient.' },
      { label: 'Montrer nos merveilles', req: { jalons: 3 }, cost: $('V5'), effect: { loy: { sel: 1, troc: 1 } },
        reply: 'Les machines visitent les merveilles pendant leur grève, puis reprennent le travail, « par respect pour les anciens ». Les anciens, c’est vous.' },
    ],
  }),
  card({
    id: 'x4b_verdict', kind: 'crise', art: { motif: 'scales', hue: 190 },
    title: 'Le Verdict',
    text: 'Les machines ont délibéré. Elles vont décider si la cité mérite d’être gardée, ou optimisée. Ce que vous avez bâti pèsera. Ce que vous n’avez pas bâti aussi.',
    options: [
      { label: 'Montrer notre dessein', cost: $('T3'), warn: 'Sans la quatrième merveille, deux quartiers sont « optimisés »',
        effect: { if: { jalons: 4 }, then: { mem: ['filtre_passe'], reply: 'Verdict : « À garder. Inefficace, mais à garder. » Les machines demandent si elles peuvent rester. Elles restent.' },
          else: { quartiers: -2, cause: 'le Verdict des machines, devant un dessein inachevé', reply: 'Les machines optimisent deux quartiers. Ils sont parfaitement propres, et parfaitement vides.' } } },
      { label: 'Tout donner', cost: $('V7 A7 S7 T7'), effect: { mem: ['filtre_passe'] }, reply: 'Vous leur donnez tout. Les machines comptent, recomptent, et vous rendent la monnaie, exacte. C’est une première.' },
      { label: 'Retourner aux bougies', effect: { quartiers: -1, cause: 'le Verdict des machines, qu’on a fui', gain: $('V4') }, reply: 'Vous coupez tout et rallumez les bougies. Les machines éteignent un quartier, pour faire comme vous.' },
    ],
  }),
];
