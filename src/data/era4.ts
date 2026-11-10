import { card, opt, D } from './dsl';

/** Ère spatiale. */
export const era4 = [
  card({
    id: 'e4_fusee', title: 'La Fusée', kind: 'era', era: 4, kw: ['Science'],
    text: 'Les ingénieurs ont une fusée. Il manque un pilote, un budget, et un plan.',
    left: opt('Lancer', { delta: D(0, 0, 12, -13), scale: [{ keyword: 'Science', delta: D(0, 0, 2) }], flags: ['rocket'], rival: 4 }, 'Elle a volé. Le pilote reviendra. Probablement.'),
    right: opt('Des missiles d’abord', { delta: D(0, 11, -4, -6), scale: [{ keyword: 'Guerre', delta: D(0, 2) }], rival: -6 }, 'Les fusées pointent vers le bas. Les voisins ont remarqué.'),
    art: { motif: 'comet' },
  }),
  card({
    id: 'e4_robot', title: 'Les Automates', kind: 'era', era: 4, kw: ['Science', 'Commerce'],
    text: 'Les machines font tout. Les gens ne font plus rien. Ils trouvent ça moyen.',
    left: opt('Tout automatiser', { delta: D(7, -8, 5, 10), add: [{ card: 'q_revolte_machines', delay: 7 }] }, 'Productivité record. Mélancolie record.'),
    right: opt('Un humain par machine', D(-5, 6, -3, -5), 'Inefficace, rassurant, syndiqué.'),
    art: { motif: 'gear' },
  }),
  card({
    id: 'e4_reseau', title: 'Le Réseau', kind: 'era', era: 4, kw: ['Culture', 'Science'],
    text: 'Tout le monde est connecté à tout le monde. Tout le monde s’insulte.',
    left: opt('Tout laisser passer', { delta: D(0, -9, 9, 5), scale: [{ keyword: 'Culture', delta: D(0, 0, 2) }] }, 'Le savoir circule. Les rumeurs aussi, plus vite.'),
    right: opt('Filtrer', { delta: D(0, 8, -7, -3), flags: ['censure'] }, 'Calme. Un calme de salle d’attente.'),
    art: { motif: 'ring' },
  }),
  card({
    id: 'e4_climat', title: 'La Canicule', kind: 'era', era: 4, kw: ['Nature'],
    text: 'Les étés brûlent les récoltes. Les scientifiques disent que c’est de votre faute, en gros.',
    left: opt('Tout changer', { delta: D(5, 0, 6, -13), scale: [{ keyword: 'Nature', delta: D(3) }] }, 'Cher. Lent. Les étés restent chauds, pour l’instant.'),
    right: opt('Importer de la glace', D(-10, 0, -3, 8), 'Les glaces fondent. Le trésor, non.'),
    art: { motif: 'sun' },
  }),
  card({
    id: 'e4_satellite', title: 'L’Œil en orbite', kind: 'era', era: 4, kw: ['Guerre', 'Science'],
    text: 'Un satellite pourrait voir tout ce que font les voisins. Et vos citoyens. C’est le même satellite.',
    left: opt('Tout voir', { delta: D(0, 10, 4, -8), rival: -7, flags: ['surveillance'] }, 'Vous savez tout. Ça ne rend pas heureux.'),
    right: opt('Fermer les yeux', { delta: D(0, -8, 0, 7), rival: 5 }, 'La vie privée existe. Les voisins vous observent.'),
    art: { motif: 'eye' },
  }),
  card({
    id: 'e4_ia', title: 'La Machine qui pense', kind: 'era', era: 4, kw: ['Science'],
    text: 'Une intelligence artificielle propose de gouverner à votre place. Elle a des graphiques.',
    left: opt('Déléguer', { delta: D(6, 0, 12, 6), add: [{ card: 'q_ia', delay: 5 }], scale: [{ keyword: 'Science', delta: D(0, 0, 2) }] }, 'Tout va mieux. Vous n’avez plus rien à faire. Attendez.'),
    right: opt('La débrancher', D(-4, 6, -10, -3), 'Elle a dit « d’accord ». Un peu vite.'),
    art: { motif: 'spiral' },
  }),
  card({
    id: 'e4_lune', title: 'La Base lunaire', kind: 'era', era: 4, kw: ['Science', 'Culture'],
    text: 'Une colonie sur la Lune. Inutile, magnifique, hors de prix.',
    left: opt('Magnifique', { delta: D(-6, 0, 9, -12), flags: ['lune'], scale: [{ keyword: 'Culture', delta: D(0, 0, 2) }] }, 'Douze personnes. Un drapeau. Des larmes partout.'),
    right: opt('Hors de prix', D(7, 4, -7, 5), 'Les voisins y sont allés. Vous avez des greniers pleins.'),
    art: { motif: 'moon' },
  }),
  card({
    id: 'e4_pandemie', title: 'Le Virus', kind: 'era', era: 4, kw: ['Science', 'Nature'],
    text: 'Un virus nouveau. Les frontières sont ouvertes, les hôpitaux pleins, les experts en désaccord.',
    left: opt('Tout fermer', { delta: D(-9, 5, 0, -8), scale: [{ keyword: 'Science', delta: D(3) }] }, 'Le virus s’ennuie. Les gens aussi.'),
    right: opt('Tout ouvrir', { delta: D(0, -9, 0, 10), add: [{ card: 'q_virus', delay: 4 }] }, 'L’économie tousse moins que les gens.'),
    art: { motif: 'spiral' },
  }),
  card({
    id: 'e4_asteroide', title: 'L’Astéroïde', kind: 'era', era: 4, kw: ['Commerce', 'Science'],
    text: 'Un astéroïde en métal précieux passe à portée. Il faudrait aller le chercher. Vite.',
    left: opt('Le capturer', { delta: D(0, -7, 5, 14), scale: [{ keyword: 'Science', delta: D(0, 0, 0, 2) }], add: [{ card: 'q_asteroide', delay: 6 }] }, 'Du platine partout. Le cours du platine s’effondre.'),
    right: opt('Le laisser passer', D(5, 6, -6, -4), 'Il est passé. On l’a regardé. C’était joli.'),
    art: { motif: 'comet' },
  }),
  card({
    id: 'e4_megapole', title: 'La Mégapole', kind: 'era', era: 4, kw: ['Culture', 'Nature'],
    text: 'La ville s’étend. Elle a mangé les champs. Elle veut manger la forêt.',
    left: opt('Qu’elle s’étende', { delta: D(-10, 0, 4, 11), scale: [{ keyword: 'Nature', delta: D(-2) }] }, 'Des tours jusqu’au ciel. Des tomates en import.'),
    right: opt('Une ceinture verte', { delta: D(9, -3, 0, -9), scale: [{ keyword: 'Nature', delta: D(3) }] }, 'Des parcs. Des loyers fous.'),
    art: { motif: 'tower' },
  }),
  card({
    id: 'e4_clone', title: 'Le Généticien', kind: 'era', era: 4, kw: ['Science', 'Foi'],
    text: 'Un généticien peut rendre les enfants plus forts. Les temples s’étranglent. Les parents hésitent.',
    left: opt('Autoriser', { delta: D(4, 7, 7, -5), scale: [{ keyword: 'Foi', delta: D(0, -3) }], flags: ['genetique'] }, 'Les enfants sont magnifiques. Ils vous regardent de haut.'),
    right: opt('Interdire', { delta: D(0, -5, -8, 3), scale: [{ keyword: 'Foi', delta: D(0, 3) }] }, 'Les voisins n’ont pas interdit. Leurs enfants sont grands.'),
    art: { motif: 'leaf' },
  }),
];
