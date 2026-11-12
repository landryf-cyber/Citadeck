/**
 * Les cinq crises : une par ère, annoncées au début de l'ère (nature et protections, pas les seuils).
 * Les seuils sont révélés dans la scène. Une famille qui vous hait peut trahir au milieu.
 */
import type { CrisisDef } from '../core/types';
import { $, card } from './dsl';

export const crises: CrisisDef[] = [
  { era: 0, name: 'La Horde', intro: 'Des cavaliers, des milliers. Ils viennent voir ce que vous avez bâti, et le prendre.', protects: 'l’Armée, et des Ourk qui vous aiment', cards: ['x0_eclaireurs', 'x0_horde', 'x0_lendemain'] },
  { era: 1, name: 'La Peste', intro: 'Une fièvre au port. Dix morts, puis cent. Puis on arrête de compter.', protects: 'le Savoir, des Vivres en réserve, et ceux qui soignent', cards: ['x1_port', 'x1_fievre', 'x1_maisons'] },
  { era: 2, name: 'La Révolte', intro: 'On murmure que vous n’êtes pas nécessaire. On le murmure de plus en plus fort.', protects: 'des familles loyales, du Trésor, du pain', cards: ['x2_rumeur', 'x2_barricades', 'x2_charte'] },
  { era: 3, name: 'La Grande Guerre', intro: '{Rival} mobilisent. Les trains sont pleins de soldats. Tous les trains.', protects: 'l’Armée, le Trésor, et l’état de vos relations avec {rival}', cards: ['x3_mobilisation', 'x3_front', 'x3_armistice'] },
  { era: 4, name: 'Le Grand Filtre', intro: 'Un signal venu d’ailleurs. Il répète une question : « Qu’êtes-vous ? »', protects: 'votre dessein : ce que vous avez bâti répondra pour vous', cards: ['x4_signal', 'x4_panique', 'x4_reponse'] },
];

export const crisisCards = [
  // ------------------------------------------------------------------ I. La Horde
  card({
    id: 'x0_eclaireurs', kind: 'crise', art: { motif: 'mountain', hue: 8 },
    title: 'Les Éclaireurs',
    text: 'Trois cavaliers sur la crête. Ils comptent vos huttes. Ils comptent mal, mais ils recommencent.',
    options: [
      { label: 'Les abattre', warn: 'Sans {k:4} Armée, ils s’enfuient et préviennent la horde',
        effect: { if: { res: $('A4') }, then: { gain: $('A-1'), mem: ['horde_aveugle'], reply: 'Deux tombent, le troisième aussi. La horde ne sait pas ce qui l’attend. Vous non plus.' },
          else: { mem: ['horde_prevenue'], reply: 'Ils s’enfuient en riant. La horde saura tout, et elle rit fort.' } } },
      { label: 'Leur offrir à manger', cost: $('V3'), effect: { mem: ['horde_amadouee'] }, reply: 'Ils mangent, remercient, et repartent annoncer qu’ici on mange bien.' },
      { label: 'L’embuscade des Ourk', req: { fam: { id: 'ourk', min: 2 }, notMem: 'aide_ourk' }, reqLabel: '{H:ourk} dévoués ; ils n’aideront qu’une fois par partie', cost: $('A2'), effect: { mem: ['horde_aveugle', 'aide_ourk'] },
        reply: '{F:ourk} revient avec trois chevaux. « Ourk a demandé leur chemin. Ourk a gardé les chevaux. »' },
    ],
  }),
  card({
    id: 'x0_horde', kind: 'crise', art: { motif: 'shield', hue: 8 },
    title: 'La Horde',
    text: 'Ils sont là. {?mem:horde_prevenue|Ils savent exactement où frapper.|{?mem:horde_aveugle|Ils hésitent : ils ne savent pas ce que vous cachez.|Ils sont nombreux, et polis, ce qui est pire.}}',
    options: [
      { label: 'Tenir les murs', warn: 'Sans {k:7} Armée, un quartier tombe (deux si la horde est prévenue)',
        effect: { if: { res: $('A7') }, then: { gain: $('A-3'), reply: 'Les murs tiennent. La horde fait le tour, deux fois, puis rentre chez elle en boudant.' },
          else: { quartiers: -1, cause: 'la Horde', if: { mem: 'horde_prevenue' }, then: { quartiers: -1, cause: 'la Horde, prévenue par ses éclaireurs' }, reply: 'La horde passe. Elle emporte un quartier, et ce qui traînait dedans.' } } },
      { label: 'Payer le tribut', cost: $('T5'), effect: { if: { mem: 'horde_amadouee' }, then: { gain: $('T2'), reply: 'Ils se souviennent du repas. Ils prennent moins. Ils prennent quand même.' } },
        reply: 'Ils prennent l’or, saluent, et promettent de revenir. Ils tiennent toujours leurs promesses.' },
      { label: 'Livrer les réserves de {H:troc}', req: { fam: { id: 'troc', min: -1 } }, reqLabel: '{H:troc} pas encore hostiles', effect: { loy: { troc: -3 } },
        reply: 'La horde repart chargée des réserves de {F:troc}. {F:troc} a tout noté, au caillou près. {F:troc} note tout.' },
      { label: 'Les chars de Brume', req: { mem: 'brume_roue' }, effect: { gain: $('A2'), loy: { brume: 2, ourk: -1 } },
        reply: 'Les chars du vieux Brume chargent. La horde n’a jamais vu de roue. Elle en verra beaucoup.' },
    ],
  }),
  card({
    id: 'x0_lendemain', kind: 'crise', art: { motif: 'flame', hue: 20 },
    title: 'Le Lendemain',
    text: 'La horde est passée. {?lossera|Il reste des cendres, des blessés, et quatre familles qui vous regardent pour savoir à qui la faute.|Les murs ont tenu, cette fois. Les quatre familles se disputent le mérite, et cherchent quand même un coupable, pour la peur.}',
    form: 'qui',
    qui: { count: 3, option: (f) => ({ label: `Blâmer {H:${f}}`, effect: { loy: { [f]: -2, ...Object.fromEntries((['ourk', 'sel', 'brume', 'troc'] as const).filter((x) => x !== f).map((x) => [x, 1])) }, gain: $('V2') },
      reply: `{H:${f}} sont coupables, c’est décidé. Les autres familles se sentent mieux. {H:${f}} gravent la date quelque part. Elle sera citée.` }) },
    options: [],
  }),

  // ------------------------------------------------------------------ II. La Peste
  card({
    id: 'x1_port', kind: 'crise', art: { motif: 'wave', hue: 120 },
    title: 'Le Port',
    text: 'La fièvre arrive par les navires. {F:troc} dit que fermer le port coûtera une fortune. {F:sel} dit que l’ouvrir coûtera des âmes. Les âmes ne paient pas d’impôts.',
    options: [
      { label: 'Fermer le port', cost: $('T6'), effect: { loy: { troc: -1, sel: 1 }, mem: ['port_ferme'] }, reply: 'Les quais sont vides. Les rats, déçus, prennent la route.' },
      { label: 'Laisser ouvert', effect: { gain: $('T4'), loy: { troc: 1 }, mem: ['port_ouvert'] }, reply: 'Le commerce continue. La fièvre aussi, à bord des charrettes.' },
    ],
  }),
  card({
    id: 'x1_fievre', kind: 'crise', art: { motif: 'spiral', hue: 120 },
    title: 'La Fièvre',
    text: 'Un tiers de la ville tousse. {F:brume} veut des médecins. {F:sel} veut des processions. Les deux veulent un budget.',
    options: [
      { label: 'Les médecins', warn: 'Sans {k:9} Savoir, un quartier se vide{?mem:port_ouvert| (deux : le port était ouvert)|}',
        effect: { loy: { brume: 1, sel: -1 }, if: { res: $('S9') }, then: { gain: $('S-3'), reply: 'Les médecins trouvent : ce sont les rats. Les rats nient.' },
          else: { quartiers: -1, cause: 'la Peste', if: { mem: 'port_ouvert' }, then: { quartiers: -1, cause: 'la Peste, entrée par le port' }, reply: 'Les médecins cherchent ; ils sont trop peu. Un quartier se tait. On ferme les volets, et on ne les rouvre plus.' } } },
      { label: 'Les processions', cost: $('V6'), warn: 'Il faut que les Sel vous aiment',
        effect: { if: { fam: { id: 'sel', min: 1 } }, then: { loy: { sel: 1 }, reply: 'Les processions ont rassemblé tout le monde. Par chance, la fièvre aussi est partie se promener.' },
          else: { quartiers: -1, cause: 'la Peste, et des processions sans ferveur', reply: 'Les processions ont rassemblé tout le monde, et la fièvre en a profité.' } } },
      { label: 'Enfermer les malades au temple', req: { fam: { id: 'sel', min: -1 } }, reqLabel: '{H:sel} pas encore hostiles', effect: { loy: { sel: -3 }, gain: $('S1') },
        reply: 'Les temples deviennent des hospices. {F:sel} prie avec un linge sur la bouche. Elle n’oubliera pas qui a fermé les portes.' },
      { label: 'Le remède des Brumides', req: { fam: { id: 'brume', min: 2 }, notMem: 'aide_brume' }, reqLabel: '{H:brume} dévoués ; ils n’aideront qu’une fois par partie', cost: $('S2'), effect: { mem: ['aide_brume'] },
        reply: 'Le remède est infect. Il marche. {F:brume} le savait, et le dit, deux fois.' },
    ],
  }),
  card({
    id: 'x1_maisons', kind: 'crise', art: { motif: 'house', hue: 120 },
    title: 'Les Maisons vides',
    text: '{?lossera|La fièvre a emporté des riches aussi. Leurs maisons sont vides, leurs coffres pleins.|La fièvre est passée sans trop de morts. Quelques riches, quand même : leurs maisons sont vides, leurs coffres pleins.} {F:troc} a déjà des clés.',
    options: [
      { label: 'Tout au trésor', effect: { gain: $('T7'), loy: { sel: -1 } }, reply: 'Les coffres sont pleins. Les héritiers survivants vous détestent avec méthode.' },
      { label: 'Aux survivants', effect: { gain: $('V4'), loy: { sel: 1, troc: -1 }, quartiers: 1 }, reply: 'Les pauvres ont des maisons. Un quartier renaît, plus pauvre et plus reconnaissant.' },
    ],
  }),

  // ------------------------------------------------------------------ III. La Révolte
  card({
    id: 'x2_rumeur', kind: 'crise', art: { motif: 'mask', hue: 300 },
    title: 'La Rumeur',
    text: 'Quelqu’un a lancé la rumeur que vous n’êtes pas nécessaire. Il faut un coupable avant ce soir. N’importe lequel, mais avant ce soir.',
    form: 'qui',
    qui: { count: 3, option: (f) => ({ label: `Accuser {H:${f}}`, effect: { loy: { [f]: -2 }, gain: $('A2'), if: { fam: { id: f, max: -1 } }, then: { reply: `{H:${f}} étaient vraiment coupables. Ça arrive. Ils vous en veulent quand même.` } },
      reply: `{H:${f}} sont arrêtés. Ils étaient innocents, ce qui les rend furieux et très crédibles.` }) },
    options: [],
  }),
  card({
    id: 'x2_barricades', kind: 'crise', art: { motif: 'flame', hue: 300 },
    title: 'Les Barricades',
    text: 'La ville est aux insurgés. Ils réclament du pain, puis votre tête, dans cet ordre. Il est encore temps de choisir l’ordre.',
    options: [
      { label: 'Du pain pour tous', cost: $('V7'), effect: { loy: { sel: 1 } }, reply: 'Ils mangent. Ils gardent les barricades, au cas où. On ne sait jamais avec vous.' },
      { label: 'La troupe', warn: 'Sans {k:11} Armée, un quartier brûle',
        effect: { loy: { ourk: 1, sel: -1 }, if: { res: $('A11') }, then: { gain: $('A-4'), reply: 'Les rues sont calmes. Elles ont été nettoyées. Avec quoi, on ne le dit pas.' },
          else: { quartiers: -1, cause: 'la Révolte', reply: 'La troupe a hésité, puis rejoint les barricades. Un quartier brûle sous les vivats.' } } },
      { label: 'Promettre n’importe quoi', effect: { loy: { ourk: -1, sel: -1, brume: -1, troc: -1 }, mem: ['promesses'] },
        reply: 'Vous promettez tout à tout le monde. La foule rentre chez elle. Chaque famille a noté une promesse différente.' },
      { label: 'Les Salière calment la foule', req: { fam: { id: 'sel', min: 2 }, notMem: 'aide_sel' }, reqLabel: '{H:sel} dévoués ; ils n’aideront qu’une fois par partie', cost: $('V2'), effect: { mem: ['aide_sel'] },
        reply: '{F:sel} parle. La foule écoute, pleure, rentre chez elle. On ne sait pas ce qu’elle a dit.' },
    ],
  }),
  card({
    id: 'x2_charte', kind: 'crise', art: { motif: 'scroll', hue: 300 },
    title: 'La Charte',
    text: 'Les insurgés proposent une charte : vous régnez, mais ils décident. Vous signez, ou vous expliquez pourquoi pas.',
    options: [
      { label: 'Signer', effect: { loy: { ourk: 1, sel: 1, brume: 1, troc: 1 }, gain: $('T-4'), mem: ['charte'] }, reply: 'Vous régnez, entre guillemets. Tout le monde est content, sauf vous et les guillemets.' },
      { label: 'Déchirer', warn: 'Sans {k:10} Armée, un quartier brûle',
        effect: { if: { res: $('A10') }, then: { gain: $('A-3 T3'), loy: { brume: -1 }, reply: 'Déchirée. Les morceaux circulent sous le manteau. Ils sont très lus.' },
          else: { quartiers: -1, cause: 'la Révolte, après la charte déchirée', reply: 'Déchirée devant la foule. Mauvaise idée, devant la foule.' } } },
    ],
  }),

  // ------------------------------------------------------------------ IV. La Grande Guerre
  card({
    id: 'x3_mobilisation', kind: 'crise', art: { motif: 'gear', hue: 0 },
    title: 'La Mobilisation',
    text: '{Reine} a mobilisé. {?rival>=1|{Elle} vous écrit que ce n’est « pas contre vous ». {Elle} souligne « pas ».|{Elle} vous écrit que c’est contre vous. {Elle} souligne « vous ».}',
    options: [
      { label: 'Mobiliser aussi', cost: $('V7'), effect: { gain: $('A8'), rival: -1 }, reply: 'Tout le monde est soldat. Personne ne moissonne. On mangera la guerre.' },
      { label: 'Négocier', req: { rival: { min: 1 } }, reqLabel: 'Relations cordiales avec la rivale', effect: { mem: ['guerre_negociee'], rival: 1 },
        reply: 'Une table, deux chaises, douze avocats. La guerre est repoussée d’une saison. C’est déjà ça.' },
      { label: 'Attendre', effect: { gain: $('T3') }, reply: 'Vous attendez. {Rival} n’attendent pas.' },
    ],
  }),
  card({
    id: 'x3_front', kind: 'crise', art: { motif: 'shield', hue: 0 },
    title: 'Le Front',
    text: 'Le front ne bouge plus. Chaque mètre coûte mille hommes. {F:ourk} veut un mètre.{?mem:guerre_negociee| Les avocats négocient encore. Ça aide un peu.|}',
    options: [
      { label: 'Tenir le front', warn: 'Sans {k:14} Armée, deux quartiers tombent{?mem:guerre_negociee| (un : la négociation aide)|}{?mem:rouge_garde| ; en pantalon rouge, le front coûte bien plus d’hommes|}',
        effect: { if: { res: $('A14') }, then: { gain: $('A-5'), reply: 'Le front tient. Personne ne sait plus très bien pourquoi, mais il tient.',
          if: { mem: 'rouge_garde' }, then: { gain: $('A-4'), reply: 'Le front tient. Les pantalons rouges se voient de très loin : il a fallu deux fois plus d’hommes. {F:ourk} trouve que ça valait le coup.' } },
          else: { quartiers: -2, cause: 'la Grande Guerre', if: { mem: 'guerre_negociee' }, then: { quartiers: 1 }, reply: 'Le front a craqué. Deux quartiers de la frontière sont désormais chez {rival}.' } } },
      { label: 'Acheter des alliés', cost: $('T11'), effect: { rival: -1 }, reply: 'Des alliés arrivent, chers et vexés d’arriver si tard. Le front tient, grâce à eux et malgré eux.' },
      { label: '{H:ourk} en première ligne', req: { fam: { id: 'ourk', min: -1 } }, reqLabel: '{H:ourk} pas encore hostiles', effect: { loy: { ourk: -3 } },
        reply: 'Le front tient. {H:ourk} comptent leurs morts, et ils tiennent la liste à jour, avec votre nom en haut.' },
      { label: 'L’offensive Ourkov', req: { fam: { id: 'ourk', min: 2 }, notMem: 'aide_ourk' }, reqLabel: '{H:ourk} dévoués ; ils n’aideront qu’une fois par partie', cost: $('A2'), effect: { gain: $('T2'), rivalJalon: -1, mem: ['aide_ourk', 'rival_vaincu'] },
        reply: 'Le colonel Ourkov perce le front, prend un chantier de {rival} et l’inaugure à votre nom.' },
    ],
  }),
  card({
    id: 'x3_armistice', kind: 'crise', art: { motif: 'scroll', hue: 0 },
    title: 'L’Armistice',
    text: 'Tout le monde est épuisé. {Reine} propose la paix. Ses conditions tiennent sur dix pages, écrites très petit.',
    options: [
      { label: 'Signer ses conditions', effect: { gain: $('T-5'), rival: 2, rivalJalon: 1 }, reply: 'La paix. Chère. {Reine} vous offre la plume en souvenir. {Elle} la facture.' },
      { label: 'Dicter les vôtres', warn: 'Il faut avoir vaincu sur le front, sinon un quartier tombe',
        effect: { if: { mem: 'rival_vaincu' }, then: { gain: $('T6'), rival: -1, reply: 'Vos dix pages contre les siennes. Les vôtres sont mieux armées.' },
          else: { quartiers: -1, cause: 'la Grande Guerre, prolongée par orgueil', rival: -1, reply: 'Vous dictez. {Elle} rit. La guerre reprend un mois, juste pour vous.' } } },
    ],
  }),

  // ------------------------------------------------------------------ V. Le Grand Filtre
  card({
    id: 'x4_signal', kind: 'crise', art: { motif: 'star', hue: 220 },
    title: 'Le Signal',
    text: 'Les antennes captent un signal. Il répète : « Qu’êtes-vous ? » {Rival} l’ont capté aussi. {Reine} a déjà répondu, en trois pages.',
    options: [
      { label: 'Laisser parler nos merveilles', req: { jalons: 4 }, cost: $('T5'), effect: { mem: ['filtre_passe', 'signal_dessein'] }, reply: 'Vous illuminez vos merveilles, toutes, toute la nuit. Elles répondent pour vous, de toute leur hauteur. Le signal se tait, impressionné, et note votre nom.' },
      { label: 'Répondre avec la science', cost: $('S10'), effect: { loy: { brume: 2 }, mem: ['signal_science'] }, reply: 'Vous envoyez les décimales de pi. Le signal répond : « Et ensuite ? »' },
      { label: 'Répondre avec une chanson', cost: $('T10'), effect: { loy: { sel: 1, troc: 1 }, mem: ['signal_culture'] }, reply: 'Vous envoyez votre hymne. Le silence qui suit est poli. Très poli.' },
      { label: 'Pointer les canons', cost: $('A10'), effect: { loy: { ourk: 2 }, mem: ['signal_guerre'] }, reply: 'Vous pointez les canons vers le ciel. Le signal se tait. Il a peut-être peur. Il a peut-être pitié.' },
      { label: 'Faire le mort', effect: { loy: { brume: -1, ourk: -1 }, mem: ['signal_silence'] }, reply: 'Vous ne répondez pas. Le signal répète la question, plus lentement, comme à un enfant.' },
    ],
  }),
  card({
    id: 'x4_panique', kind: 'crise', art: { motif: 'comet', hue: 220 },
    title: 'La Panique',
    text: 'Tout le monde croit à la fin du monde. Certains prient, d’autres pillent, quelques-uns font les deux.',
    options: [
      { label: 'Rationner', cost: $('V10'), effect: { loy: { sel: 1 } }, reply: 'Rations pour tous. La fin du monde est remise à plus tard, faute de participants.' },
      { label: 'Couvre-feu', warn: 'Sans {k:15} Armée, un quartier brûle',
        effect: { if: { res: $('A15') }, then: { gain: $('A-4'), reply: 'Couvre-feu. La fin du monde est priée de rentrer avant vingt heures.' },
          else: { quartiers: -1, cause: 'la Panique du Grand Filtre', reply: 'Le couvre-feu a été annoncé. Personne ne l’a respecté. Un quartier brûle de joie.' } } },
      { label: 'Laisser BRUME calmer la foule', req: { fam: { id: 'sel', min: -1 } }, reqLabel: '{H:sel} pas encore hostiles : ce sont eux qui paieront', effect: { loy: { sel: -3, troc: -1, brume: 1 } },
        reply: 'BRUME calme la foule avec des statistiques. Personne ne panique plus. Personne ne sourit plus non plus. {H:sel} trouvent ça inhumain.' },
      { label: 'Montrer nos merveilles', req: { jalons: 3 }, cost: $('V5'), effect: { loy: { sel: 1, troc: 1 } },
        reply: 'On ouvre les merveilles, on y distribue la soupe. La foule se calme : on ne détruit pas ce qui est beau. Pas tout de suite.' },
    ],
  }),
  card({
    id: 'x4_reponse', kind: 'crise', art: { motif: 'ring', hue: 220 },
    title: 'La Réponse',
    text: 'Le signal attend votre réponse définitive. Ce que vous avez bâti parlera. Ce que vous n’avez pas bâti aussi, mais moins bien.',
    options: [
      { label: 'Montrer notre dessein', cost: $('T3'), warn: 'Sans quatre merveilles, un quartier tombe (deux sous trois merveilles)',
        effect: { if: { jalons: 4 }, then: { mem: ['filtre_passe'], reply: 'Le signal se tait longuement. Puis : « D’accord. » Personne ne sait à quoi on a dit oui.' },
          else: { if: { jalons: 3 }, then: { quartiers: -1, cause: 'le Grand Filtre, devant un dessein presque achevé', reply: 'Le signal hésite. Trois merveilles, c’est presque une réponse. Il n’éteint qu’un quartier, par politesse.' },
            else: { quartiers: -2, cause: 'le Grand Filtre, devant un dessein inachevé', reply: 'Le signal n’est pas impressionné. Il éteint deux quartiers, pour voir.' } } } },
      { label: 'Tout donner', cost: $('V5 A5 S5 T5'), effect: { mem: ['filtre_passe'] }, reply: 'Vous envoyez tout ce que vous avez. Le signal accepte. Il ne rend pas la monnaie.' },
      { label: 'Se cacher', effect: { quartiers: -1, cause: 'le Grand Filtre, à qui l’on n’a pas répondu', gain: $('V4') }, reply: 'Vous éteignez tout. Le signal passe, sans vous voir. Il emporte un quartier, par distraction.' },
    ],
  }),
];
