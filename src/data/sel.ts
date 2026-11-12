/**
 * Les Sel — chamanes, oracles, moniales, prélats, télévangélistes.
 * Tic : prédit le malheur et tend la main. « Le ciel est formel. Le ciel accepte les dons. »
 * Méprise : les Troc (ceux qui vendent ce que le ciel donne).
 * Actes marquants : sel_louveteau (Ourk a mangé le louveteau sacré), sel_comete, sel_usure, sel_ecole.
 */
import { $, card } from './dsl';

export const selCards = [
  card({
    id: 'sel_1', kind: 'famille', family: 'sel', eras: [0], tags: ['Foi'], art: { motif: 'eye' },
    title: 'Le Louveteau sacré',
    text: 'Mère Sel est en larmes : Ourk a mangé le louveteau sacré. Ourk dit qu’il ne savait pas qu’il était sacré. Ourk dit qu’il était bon.',
    options: [
      { label: 'Ourk jeûnera une lune', effect: { loy: { sel: 2, ourk: -2 }, mem: ['ourk_puni'], gain: $('V2') },
        reply: 'Ourk jeûne. Ourk regarde les autres manger. Ourk prend des notes, mentalement.' },
      { label: 'Il était bon, c’est vrai', effect: { loy: { sel: -2, ourk: 1 }, mem: ['sel_bafouee'], gain: $('A1') },
        reply: 'Mère Sel maudit votre lignée jusqu’à la quarantième génération. Elle a un calendrier.' },
      { label: 'Un nouveau louveteau', cost: $('V3'), effect: { loy: { sel: 1 } },
        reply: 'Le nouveau louveteau est sacré aussi. Ourk a promis de ne pas le manger. Ourk a promis.' },
    ],
  }),
  card({
    id: 'sel_2', kind: 'famille', family: 'sel', eras: [1], tags: ['Foi'], art: { motif: 'eye' },
    title: 'L’Oracle',
    text: 'Sélènè la Pythie a vu une comète dans ses fumées. « Elle reviendra. Le ciel accepte les dons, pour la précision. »',
    options: [
      { label: 'Payer la prophétie', cost: $('T3'), effect: { loy: { sel: 2 }, mem: ['sel_comete'], sched: [{ card: 'sel_comete_2', in: 9 }] },
        reply: '« La comète reviendra après les grandes moissons. Préparez des greniers. Et un temple. Surtout le temple. »' },
      { label: 'Les fumées, ça suffit', effect: { gain: $('S2'), loy: { sel: -1, brume: 1 } },
        reply: 'Sélènè a toussé, très dignement. Les fumées ont dessiné une main faisant un geste.' },
    ],
  }),
  card({
    id: 'sel_3', kind: 'famille', family: 'sel', eras: [2], tags: ['Foi'], art: { motif: 'bell' },
    title: 'Le Péché d’usure',
    text: 'L’abbesse Salière exige que vous interdisiez le prêt à intérêt. {H:troc} prêtent à intérêt. {H:troc} vous ont prêté à intérêt.',
    options: [
      { label: 'Interdire l’usure', effect: { loy: { sel: 2, troc: -2 }, gain: $('V3'), mem: ['sel_usure'] },
        reply: 'L’usure est interdite. {F:troc} prête désormais « à amitié ». Le taux est le même.' },
      { label: 'Taxer l’usure', effect: { gain: $('T4'), loy: { sel: -1, troc: -1 } },
        reply: 'Le péché rapporte. L’abbesse dit que c’est encore pire. Elle prend sa part quand même.' },
      { label: 'Racheter vos dettes', cost: $('T5'), effect: { loy: { troc: 1, sel: 1 } },
        reply: 'Vous ne devez plus rien à personne. Personne ne sait quoi faire de vous.' },
    ],
  }),
  card({
    id: 'sel_4', kind: 'famille', family: 'sel', eras: [3], tags: ['Foi'], art: { motif: 'bell' },
    title: 'L’École du dimanche',
    text: '{F:sel} veut garder les écoles. {F:brume} veut les lui prendre. Les enfants veulent qu’on les laisse tranquilles. Personne n’écoute les enfants.',
    options: [
      { label: 'Les écoles à l’Église', effect: { loy: { sel: 2, brume: -2 }, gain: $('V4'), mem: ['sel_ecole'] },
        reply: 'Les enfants apprennent le catéchisme. Ils le récitent bien. Ils ne savent pas compter les quêtes.' },
      { label: 'L’école laïque', cost: $('T3'), effect: { loy: { sel: -2, brume: 2 }, gain: $('S5') },
        reply: 'Les enfants savent lire. Ils lisent les journaux. {F:sel} lit vos comptes.' },
    ],
  }),
  card({
    id: 'sel_5', kind: 'famille', family: 'sel', eras: [4], tags: ['Foi'], art: { motif: 'star' },
    title: 'Le Paradis, quatrième étage',
    text: 'La révérende Sel vend des places au paradis. Le paradis existe : c’est une station orbitale. Il reste des places avec vue. « Le ciel a enfin un ascenseur. Les escaliers restent gratuits. »',
    options: [
      { label: 'Bénir la station', cost: $('V4'), effect: { loy: { sel: 2 }, gain: $('T5'), if: { dessein: 'posterite' }, then: { gain: $('T3') } },
        reply: 'Les fidèles montent au ciel. Ils redescendent le dimanche, pour la messe et les courses.' },
      { label: 'Taxer le paradis', effect: { gain: $('T6'), loy: { sel: -2, troc: 1 } },
        reply: 'Le paradis paie l’impôt. La révérende annonce que l’enfer, lui, sera gratuit.' },
    ],
  }),
  card({
    id: 'sel_comete_2', kind: 'intrigue', family: 'sel', arc: 'comete', finale: true, art: { motif: 'comet' },
    title: 'La Comète',
    text: 'La comète est revenue, exactement comme Sélènè la Pythie l’avait prédit en {D:sel_comete}. Tout le monde regarde le ciel. {F:sel} regarde la quête.',
    options: [
      { label: 'Un grand pèlerinage', cost: $('V3'), effect: { gain: $('T6'), loy: { sel: 2 }, quartiers: 1 },
        reply: 'Des pèlerins de partout. Certains restent. On leur construit un quartier, avec vue sur le ciel.' },
      { label: 'Une pierre qui passe, voilà tout', effect: { gain: $('S4'), loy: { sel: -2, brume: 1 } },
        reply: '{F:brume} explique la comète avec un tableau noir. {F:sel} explique {F:brume} avec une malédiction.' },
    ],
  }),
  card({
    id: 'trahison_sel', kind: 'trahison', scale: true, family: 'sel', art: { motif: 'eye', hue: 0 },
    title: 'Le Sermon',
    text: 'En pleine crise, {F:sel} prêche que c’est votre faute. Le ciel est formel.{?mem:sel_bafouee| Il est aussi question d’un louveteau.|} La foule écoute.',
    options: [
      { label: 'Acheter le sermon suivant', cost: $('T4'), effect: { loy: { sel: 1 } }, reply: 'Le sermon suivant parle de patience. Et de dons.' },
      { label: 'Laisser la foule gronder', effect: { quartiers: -1, cause: 'le sermon des Sel', loy: { sel: 1 } },
        reply: 'La foule a grondé, puis brûlé. {F:sel} prie pour le quartier. Très fort, devant tout le monde.' },
    ],
  }),
  card({
    id: 'hommage_sel', kind: 'hommage', scale: true, family: 'sel', art: { motif: 'eye' },
    title: 'La Bénédiction',
    text: '{F:sel} vous bénit en public. {objet}, {quand} : vous aviez dit {citation}. « Le ciel s’en souvient. Il vous offre quelque chose. Gratuitement. Cette fois. »',
    options: [
      { label: 'Des greniers bénis', effect: { gain: $('V5') }, reply: 'Les greniers sont bénis. Les rats aussi, par erreur.' },
      { label: 'Un miracle', effect: { quartiers: 1 }, reply: 'Un quartier a poussé pendant la nuit. Personne n’ose demander comment.' },
    ],
  }),
];
