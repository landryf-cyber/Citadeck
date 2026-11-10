import { card, opt, D } from './dsl';

/** Cartes injectées par la civilisation rivale selon la relation. */
export const rivalNames = ['les Orvandes', 'la Ligue d’Ombre', 'les Harsk', 'l’Empire de Zéphyr', 'les Cités Grises'];

export const rivalHostile = [
  card({
    id: 'v_raid', title: 'Le Raid', kind: 'rival', oneShot: true,
    text: 'Vos voisins ont brûlé trois villages. Ils disent que c’était une erreur de carte.',
    left: opt('Représailles', { when: { gauge: 'army', gte: 50 }, then: { delta: D(0, -5, 0, 6), rival: -10 }, else: { delta: D(-5, -10, 0, -3), rival: -10 } }, 'Trois de leurs villages. Erreur de carte.'),
    right: opt('Encaisser', { delta: D(-7, -3, -3, -4), rival: 4 }, 'Vous avez reconstruit. Ils ont pris des notes.'),
    art: { motif: 'flame' },
  }),
  card({
    id: 'v_ultimatum', title: 'L’Ultimatum', kind: 'rival', oneShot: true, era: 1,
    text: 'Un messager apporte une lettre : « Cédez la vallée ou brûlez. » Il attend une réponse. Il a l’air pressé.',
    left: opt('Céder la vallée', { delta: D(-10, -5, 0, 0), rival: 8 }, 'La vallée est à eux. Le messager a souri.'),
    right: opt('Brûler la lettre', { delta: D(0, 6, 0, -8), rival: -10, add: [{ card: 'v_guerre', delay: 5 }] }, 'Le messager est reparti au galop.'),
    art: { motif: 'scroll' },
  }),
  card({
    id: 'v_guerre', title: 'La Guerre', kind: 'rival', oneShot: true,
    text: 'Leur armée est à deux jours de marche. La vôtre est… quelque part.',
    left: opt('Attaquer les premiers', { when: { gauge: 'army', gte: 55 }, then: { delta: D(-5, -8, 0, 10), rival: -5, flags: ['rivalDefeated'] }, else: { delta: D(-7, -13, 0, -4), rival: -5 } }, 'Victoire. Le champ est plein de choses qu’on préfère ne pas nommer.'),
    right: opt('Défendre les murs', { when: { gauge: 'treasure', gte: 50 }, then: { delta: D(-5, -4, -3, -8), rival: 0 }, else: { delta: D(-8, -8, -4, -5), rival: 0 } }, 'Ils sont repartis. Ils reviendront.'),
    art: { motif: 'shield' },
  }),
  card({
    id: 'v_espion', title: 'L’Espion pris', kind: 'rival', oneShot: true,
    text: 'Un espion des voisins a été pris dans vos archives. Il dit qu’il visitait.',
    left: opt('Le pendre', { delta: D(0, 6, 0, 0), rival: -10 }, 'Pendu. Les voisins ont pendu le vôtre.'),
    right: opt('Le retourner', { delta: D(0, -3, 8, -5), rival: -3 }, 'Il espionne pour vous, maintenant. Ou le contraire.'),
    art: { motif: 'eye' },
  }),
  card({
    id: 'v_blocus', title: 'Le Blocus', kind: 'rival', oneShot: true, era: 1,
    text: 'Les voisins ferment leurs routes et leurs ports. Vos marchands tournent en rond.',
    left: opt('Forcer le passage', { when: { gauge: 'army', gte: 50 }, then: { delta: D(0, -6, 0, 7), rival: -8 }, else: { delta: D(-4, -10, 0, -6), rival: -8 } }, 'Le passage est forcé. Il y a des débris.'),
    right: opt('Produire sur place', { delta: D(-6, 0, 6, -9), rival: 0 }, 'Tout est fait maison. Mal, mais maison.'),
    art: { motif: 'wave' },
  }),
  card({
    id: 'v_frappe', title: 'Le Premier Coup', kind: 'rival', oneShot: true, era: 4,
    text: 'Vos généraux disent que les voisins vont frapper. Les voisins disent la même chose de vous.',
    left: opt('Frapper d’abord', { when: { gauge: 'army', gte: 60 }, then: { delta: D(-6, -8, -4, 6), rival: -20, flags: ['rivalDefeated'] }, else: { delta: D(-12, -14, -4, -6), rival: -20 } }, 'Leur capitale brûle. La vôtre a des trous.'),
    right: opt('Appeler', { delta: D(0, -9, 3, -3), rival: 12 }, 'Vous avez parlé toute la nuit. Personne n’a dormi. Personne n’a frappé.'),
    art: { motif: 'comet' },
  }),
];

export const rivalNeutral = [
  card({
    id: 'v_emissaire', title: 'L’Émissaire', kind: 'rival', oneShot: true,
    text: 'Un émissaire des voisins apporte des cadeaux et des questions sur vos murailles.',
    left: opt('Tout lui montrer', { delta: D(0, -5, 4, 6), rival: 10 }, 'Il a tout vu. Il a dit que c’était joli.'),
    right: opt('Le renvoyer', { delta: D(0, 5, 0, -3), rival: -8 }, 'Il a gardé les cadeaux.'),
    art: { motif: 'mask' },
  }),
  card({
    id: 'v_frontiere', title: 'La Frontière', kind: 'rival', oneShot: true,
    text: 'Un champ. Les voisins disent qu’il est à eux. Votre carte dit le contraire. Les deux cartes sont fausses.',
    left: opt('Le garder', { delta: D(6, 0, 0, 0), rival: -9 }, 'Du blé. Et une lettre furieuse.'),
    right: opt('Le partager', { delta: D(-3, -3, 0, 2), rival: 7 }, 'Demi-champ. Demi-blé. Demi-paix.'),
    art: { motif: 'wheat' },
  }),
  card({
    id: 'v_mariage', title: 'Le Mariage', kind: 'rival', oneShot: true, era: 1,
    text: 'Les voisins proposent un mariage entre vos héritiers. Les héritiers ne sont pas d’accord. Personne ne leur a demandé.',
    left: opt('Accepter', { delta: D(0, -4, 0, -8), rival: 15, flags: ['mariage'] }, 'Noces somptueuses. Les mariés ne se parlent pas.'),
    right: opt('Refuser', { delta: D(0, 4, 0, 3), rival: -10 }, 'Vexés. Ils ont marié leur héritier ailleurs.'),
    art: { motif: 'ring' },
  }),
  card({
    id: 'v_marchands', title: 'Les Marchands voisins', kind: 'rival', oneShot: true,
    text: 'Des marchands des voisins vendent moins cher que les vôtres. Les vôtres sont devant votre porte.',
    left: opt('Les laisser vendre', { delta: D(6, 0, 0, -6), rival: 8 }, 'Pas cher. Vos marchands ont changé de métier.'),
    right: opt('Les taxer', { delta: D(-4, 0, 0, 8), rival: -8 }, 'Vos marchands sont riches. Ils vendent cher.'),
    art: { motif: 'coin' },
  }),
  card({
    id: 'v_refugies', title: 'Les Réfugiés', kind: 'rival', oneShot: true, era: 2,
    text: 'Une famine chez les voisins. Des milliers de gens à votre frontière. Ils ont faim. Ils savent travailler.',
    left: opt('Ouvrir', { delta: D(-10, 0, 3, 5), rival: 10 }, 'Ils travaillent. Ils mangent. Beaucoup des deux.'),
    right: opt('Fermer', { delta: D(4, 4, 0, 0), rival: -12 }, 'La frontière est calme. On entend des choses, la nuit.'),
    art: { motif: 'wheat' },
  }),
];

export const rivalFriendly = [
  card({
    id: 'v_alliance', title: 'L’Alliance', kind: 'rival', oneShot: true,
    text: 'Les voisins proposent une alliance. Contre qui, ils ne disent pas.',
    left: opt('Signer', { delta: D(0, 6, 0, -6), rival: 12, flags: ['rivalAllied'] }, 'Alliés. Ils ont déjà un ennemi en tête.'),
    right: opt('Rester libre', { delta: D(0, -3, 0, 4), rival: -6 }, 'Libre. Seul. Ils ont signé avec quelqu’un d’autre.'),
    art: { motif: 'ring' },
  }),
  card({
    id: 'v_savants', title: 'Les Savants en visite', kind: 'rival', oneShot: true,
    text: 'Leurs savants veulent étudier chez vous. Ils apportent leurs livres. Et leurs questions.',
    left: opt('Les accueillir', { delta: D(-5, 0, 10, -3), rival: 6 }, 'Ils ont tout lu. Ils ont tout noté. Chez eux aussi.'),
    right: opt('Pas de visites', { delta: D(0, 4, -4, 0), rival: -8 }, 'Ils ont étudié ailleurs. Ailleurs est plus savant.'),
    art: { motif: 'scroll' },
  }),
  card({
    id: 'v_cadeau', title: 'Le Cadeau', kind: 'rival', oneShot: true,
    text: 'Les voisins offrent un cheval de bois immense. Très lourd. Il faudrait l’ouvrir.',
    left: opt('L’accepter', { delta: D(4, -6, 0, 8), rival: 6, add: [{ card: 'v_cheval', delay: 4 }] }, 'Magnifique. Il grince, la nuit.'),
    right: opt('Le brûler', { delta: D(0, 5, 0, -2), rival: -14 }, 'Il a crié en brûlant. Bizarre, pour du bois.'),
    art: { motif: 'mask' },
  }),
  card({
    id: 'v_cheval', title: 'Le Cheval, la nuit', kind: 'rival', oneShot: true,
    text: 'Le cheval était plein de soldats. Ils ont ouvert les portes. Ils ont l’air gênés.',
    left: opt('Combattre', { when: { gauge: 'army', gte: 45 }, then: { delta: D(0, -6, 0, 4), rival: -15 }, else: { delta: D(-6, -12, 0, -8), rival: -15 } }, 'Repoussés. Le cheval est en petit bois.'),
    right: opt('Négocier en pyjama', { delta: D(-4, -4, 0, -10), rival: 0 }, 'Ils sont partis avec le trésor. Et le cheval.'),
    art: { motif: 'shield' },
  }),
  card({
    id: 'v_pacte', title: 'Le Pacte', kind: 'rival', oneShot: true, era: 3,
    text: 'Les voisins proposent d’ouvrir les frontières. Pour de bon. Tout circule. Tout.',
    left: opt('Ouvrir', { delta: D(6, -8, 5, 7), rival: 15, flags: ['rivalAllied'] }, 'Plus de frontière. Plus de douane. Plus d’excuse.'),
    right: opt('Pas encore', { delta: D(0, 5, 0, -4), rival: -5 }, 'La frontière reste. Elle a l’air vexée.'),
    art: { motif: 'ring' },
  }),
  card({
    id: 'v_sommet', title: 'Le Sommet', kind: 'rival', oneShot: true, era: 4,
    text: 'Un sommet pour unir les deux civilisations. Deux drapeaux, une table, mille caméras.',
    left: opt('Fusionner', { delta: D(6, -10, 6, 4), rival: 20, flags: ['rivalAllied', 'union'] }, 'Un seul peuple. Deux hymnes. Ça chevauche.'),
    right: opt('Rester deux', { delta: D(0, 5, 0, -3), rival: -6 }, 'Chacun chez soi. Poliment.'),
    art: { motif: 'ring' },
  }),
];
