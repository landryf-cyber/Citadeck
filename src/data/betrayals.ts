/**
 * Trahisons qui s'aggravent : une famille qui trahit une deuxième, puis une troisième fois,
 * ne refait pas le même coup. La deuxième fois, elle passe chez la rivale ; la troisième, elle fait sécession.
 */
import { $, card } from './dsl';

export const betrayalCards = [
  // ------------------------------------------------------------------ Ourk
  card({
    id: 'trahison_ourk_2', kind: 'trahison', scale: true, family: 'ourk', art: { motif: 'fang', hue: 0 },
    title: 'Les Épées à louer',
    text: 'En pleine crise, {H:ourk} louent leurs épées à {rival}, à l’heure. « C’est de l’entraînement », assure {F:ourk}. Contre qui ? « Surtout contre vous. »',
    options: [
      { label: 'Payer une solde double', cost: $('T5'), effect: { loy: { ourk: 1 } },
        reply: '{F:ourk} revient avec votre solde et celle de {rival}. Il a été payé deux fois. Il trouve ça juste.' },
      { label: 'Les laisser partir', effect: { gain: $('A-3'), rivalJalon: 1, loy: { ourk: 1 } },
        reply: '{Rival} bâtissent sous la garde de vos propres soldats. Ils sont très bien gardés.' },
    ],
  }),
  card({
    id: 'trahison_ourk_3', kind: 'trahison', scale: true, family: 'ourk', art: { motif: 'fang', hue: 0 },
    title: 'Le Coup de force',
    text: '{F:ourk} a encerclé le palais. « Ce n’est pas un coup d’État. C’est une visite. Avec des canons. » Il propose de régner à votre place, pour que vous puissiez vous reposer.',
    options: [
      { label: 'Acheter sa retraite', cost: $('T7'), effect: { loy: { ourk: 1 } },
        reply: '{F:ourk} accepte une retraite dorée, un titre ronflant et un balcon. Il y passe ses journées à vous surveiller.' },
      { label: 'Lui céder un quartier', effect: { quartiers: -1, cause: 'le coup de force des Ourk', loy: { ourk: 2 } },
        reply: '{F:ourk} règne sur un quartier. Il y fait régner l’ordre, le couvre-feu, et une fanfare à six heures du matin.' },
    ],
  }),
  // ------------------------------------------------------------------ Sel
  card({
    id: 'trahison_sel_2', kind: 'trahison', scale: true, family: 'sel', art: { motif: 'eye', hue: 0 },
    title: 'L’Excommunication',
    text: 'En pleine crise, {F:sel} vous excommunie. Les cloches sonnent à l’envers. Les fidèles ne savent plus s’ils doivent vous saluer ou vous plaindre : ils font les deux, de loin.',
    options: [
      { label: 'Faire pénitence en public', cost: $('V5'), effect: { loy: { sel: 1 } },
        reply: 'Vous marchez pieds nus jusqu’au temple. {F:sel} vous pardonne devant témoins. Les témoins en parlent encore.' },
      { label: 'Ignorer les cloches', effect: { quartiers: -1, cause: 'l’excommunication des Sel', loy: { sel: 1 } },
        reply: 'Un quartier entier refuse de vous obéir. Il obéit au ciel, qui lui répond très bien.' },
    ],
  }),
  card({
    id: 'trahison_sel_3', kind: 'trahison', scale: true, family: 'sel', art: { motif: 'eye', hue: 0 },
    title: 'La Cité sainte',
    text: '{H:sel} fondent une cité sainte dans la cité. Murs, portes, péage pour les pécheurs. D’après le règlement, vous êtes le premier des pécheurs.',
    options: [
      { label: 'Racheter le quartier saint', cost: $('T8'), effect: { loy: { sel: 1 } },
        reply: '{F:sel} vous vend le quartier, avec la bénédiction en option. Vous prenez l’option. On ne sait jamais.' },
      { label: 'Le laisser faire sécession', effect: { quartiers: -1, cause: 'la sécession des Sel', loy: { sel: 2 } },
        reply: 'Le quartier saint ferme ses portes. Le soir, on l’entend chanter contre vous. Juste, et très fort.' },
    ],
  }),
  // ------------------------------------------------------------------ Brume
  card({
    id: 'trahison_brume_2', kind: 'trahison', scale: true, family: 'brume', art: { motif: 'spiral', hue: 0 },
    title: 'La Fuite des cerveaux',
    text: 'En pleine crise, {H:brume} emportent leurs plans chez {rival}. {F:brume} laisse un mot : « Les conditions de recherche y sont meilleures. Il y a des fenêtres. »',
    options: [
      { label: 'Rattraper les plans', cost: $('A4'), effect: { loy: { brume: 1 } },
        reply: 'Les plans reviennent. Il en manque une page. {F:brume} jure qu’elle n’a jamais existé.' },
      { label: 'Les laisser partir', effect: { gain: $('S-4'), rivalJalon: 1, loy: { brume: 1 } },
        reply: '{Rival} bâtissent avec vos plans. Ils ont gardé vos fautes de calcul : c’est ce qui tient le toit.' },
    ],
  }),
  card({
    id: 'trahison_brume_3', kind: 'trahison', scale: true, family: 'brume', art: { motif: 'spiral', hue: 0 },
    title: 'La Machine à gouverner',
    text: '{F:brume} a branché une machine sur la cité. Elle prend les décisions à votre place. Elle vient de décider que vous étiez une erreur d’arrondi.',
    options: [
      { label: 'Débrancher la machine', cost: $('S7'), effect: { loy: { brume: 1 } },
        reply: 'La machine s’éteint en chantant une comptine. {F:brume} pleure un peu. {Il:brume} garde la comptine.' },
      { label: 'Laisser calculer', effect: { quartiers: -1, cause: 'la machine des Brume', loy: { brume: 2 } },
        reply: 'La machine optimise un quartier : rues droites, maisons identiques, personne dedans. C’est parfait.' },
    ],
  }),
  // ------------------------------------------------------------------ Troc
  card({
    id: 'trahison_troc_2', kind: 'trahison', scale: true, family: 'troc', art: { motif: 'coin', hue: 0 },
    title: 'La Banque d’en face',
    text: 'En pleine crise, {H:troc} ouvrent une banque chez {rival}. Vos réserves y sont déjà, « pour leur sécurité ». Les taux sont excellents. Pour {rival}.',
    options: [
      { label: 'Rapatrier les réserves', cost: $('A4'), effect: { loy: { troc: 1 } },
        reply: 'Vos soldats ramènent l’or en charrette. {F:troc} facture le transport, et les charrettes.' },
      { label: 'Laisser l’or là-bas', effect: { gain: $('T-6'), rivalJalon: 1, loy: { troc: 1 } },
        reply: '{Rival} bâtissent avec votre or. Votre nom figure sur une plaque, tout en bas, en petit.‖Votre or finance le chantier de {rival}. À l’inauguration, on vous remercie chaleureusement, depuis l’autre rive.‖{Rival} gardent l’or et vous envoient une lettre de remerciements, sur papier doré, avec votre or.' },
    ],
  }),
  card({
    id: 'trahison_troc_3', kind: 'trahison', scale: true, family: 'troc', art: { motif: 'coin', hue: 0 },
    title: 'La Zone franche',
    text: '{H:troc} déclarent leur quartier zone franche : drapeau, monnaie, hymne (une publicité). « Rien de personnel. C’est la conjoncture. »',
    options: [
      { label: 'Racheter le quartier', cost: $('T8'), effect: { loy: { troc: 1 } },
        reply: 'Vous rachetez votre propre quartier, au prix du marché. {F:troc} vous félicite pour cet excellent investissement.' },
      { label: 'Le laisser partir', effect: { quartiers: -1, cause: 'la sécession des Troc', loy: { troc: 2 } },
        reply: 'La zone franche prospère. Vous y allez faire vos courses. On vous fait payer l’entrée.' },
    ],
  }),
];
