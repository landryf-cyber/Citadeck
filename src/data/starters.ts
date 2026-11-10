import { card, opt, D } from './dsl';

/** Cartes de départ : persistantes, ce sont les tensions de base entre les quatre jauges. */
export const starters = [
  card({
    id: 's_recolte', title: 'La Récolte', kind: 'starter', kw: ['Nature'],
    text: 'Belle récolte. Les voisins en ont entendu parler.',
    left: opt('Vendre le surplus', D(-9, 0, 0, 10), 'Les greniers sonnent creux. Les coffres, non.'),
    right: opt('Bâtir des greniers', D(10, 0, 0, -7), 'Plein à craquer. Les rats applaudissent.'),
    art: { motif: 'wheat' },
  }),
  card({
    id: 's_guetteurs', title: 'Les Guetteurs', kind: 'starter', kw: ['Guerre'],
    text: 'Les guetteurs ont faim. Les champs manquent de bras.',
    left: opt('Aux champs', D(9, -8), 'Personne ne regarde l’horizon. L’horizon regarde.'),
    right: opt('Aux remparts', D(-7, 9), 'Ils veillent. Le ventre vide.'),
    art: { motif: 'shield' },
  }),
  card({
    id: 's_sage', title: 'Le Sage', kind: 'starter', kw: ['Science'],
    text: 'Un vieillard prétend savoir des choses. Il mange beaucoup.',
    left: opt('L’écouter', D(-6, 0, 10), 'Il savait des choses. Il mange toujours.'),
    right: opt('Le mettre au travail', D(0, 0, -8, 7), 'Il creuse. Il grommelle. Il creuse.'),
    art: { motif: 'eye' },
  }),
  card({
    id: 's_solde', title: 'La Solde', kind: 'starter', kw: ['Guerre'],
    text: 'Les soldats veulent leur paie. Les coffres veulent la paix.',
    left: opt('Payer', D(0, 8, 0, -10), 'Payés. Loyaux jusqu’à la prochaine fois.'),
    right: opt('Promettre', { delta: D(0, -9, 0, 3), add: [{ card: 'q_solde_impayee', delay: 7 }] }, 'Ils ont noté. Ils savent compter.'),
    art: { motif: 'coin' },
  }),
  card({
    id: 's_fete', title: 'La Fête', kind: 'starter', kw: ['Culture'],
    text: 'Le peuple réclame une fête. Les scribes réclament des bougies.',
    left: opt('Une fête', D(-7, 6, 0, -5), 'Ils dansent. Demain, ils auront faim et mal au crâne.'),
    right: opt('Des bougies', D(0, -5, 9, -4), 'Les scribes veillent. Le peuple boude dans le noir.'),
    art: { motif: 'flame' },
  }),
  card({
    id: 's_etranger', title: 'L’Étranger', kind: 'starter', kw: ['Commerce'],
    text: 'Un inconnu parle une langue bizarre. Il a l’air de savoir des choses.',
    left: opt('L’accueillir', { delta: D(-4, -5, 9), rival: 6 }, 'Il parle. Beaucoup. Certains notent.'),
    right: opt('Le chasser', { delta: D(0, 6, -7), rival: -6 }, 'Il est parti. Vers chez eux, visiblement.'),
    art: { motif: 'mask' },
  }),
];
