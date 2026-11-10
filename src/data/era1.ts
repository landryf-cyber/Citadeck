import { card, opt, D } from './dsl';

/** Antiquité. */
export const era1 = [
  card({
    id: 'e1_bronze', title: 'Le Bronze', kind: 'era', era: 1, kw: ['Science'],
    text: 'Un forgeron mélange deux métaux. Le résultat coupe très bien.',
    left: opt('Des épées', { delta: D(0, 11, 0, -8), scale: [{ keyword: 'Guerre', delta: D(0, 2) }] }, 'Luisantes. Tranchantes. Impatientes.'),
    right: opt('Des charrues', { delta: D(10, -5, 3, -5), scale: [{ keyword: 'Nature', delta: D(2) }] }, 'Les sillons sont droits. Les frontières, moins.'),
    art: { motif: 'gear' },
  }),
  card({
    id: 'e1_ecriture', title: 'Les Tablettes', kind: 'era', era: 1, kw: ['Science'],
    text: 'Les scribes veulent tout noter. Surtout vos dettes.',
    left: opt('Tout noter', { delta: D(0, 0, 10, -6), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 3) }] }, 'Tout est écrit. Même ce qu’on aurait préféré oublier.'),
    right: opt('La mémoire suffit', D(0, 5, -8, 5), 'Personne ne se souvient de qui doit quoi. Pratique.'),
    art: { motif: 'scroll' },
  }),
  card({
    id: 'e1_monument', title: 'Le Monument', kind: 'era', era: 1, kw: ['Culture'],
    text: 'L’architecte propose une statue de vous. Très grande. Très chère.',
    left: opt('Très grande', { delta: D(-6, 6, 0, -11), scale: [{ keyword: 'Culture', delta: D(0, 2) }], add: [{ card: 'q_statue', delay: 8 }] }, 'On la voit de loin. On vous voit de loin.'),
    right: opt('Un buste suffira', D(0, -5, 3, 6), 'Modeste. Les soldats trouvent ça suspect.'),
    art: { motif: 'crown' },
  }),
  card({
    id: 'e1_prisonniers', title: 'Les Prisonniers', kind: 'era', era: 1, kw: ['Guerre'],
    text: 'La guerre a fait des prisonniers. Ils ont des bras et de la rancune.',
    left: opt('Aux carrières', { delta: D(4, 0, 0, 10), rival: -8, add: [{ card: 'q_revolte_carrieres', delay: 7 }] }, 'Les pierres s’empilent. Les regards aussi.'),
    right: opt('Les renvoyer', { delta: D(-3, -8, 0, -3), rival: 10 }, 'Ils sont partis en vous remerciant. C’est louche.'),
    art: { motif: 'shield' },
  }),
  card({
    id: 'e1_oracle', title: 'L’Oracle', kind: 'era', era: 1, kw: ['Foi'],
    text: 'L’oracle a parlé. Personne n’a compris. Elle demande un paiement quand même.',
    left: opt('Payer', { delta: D(0, 6, 0, -9), scale: [{ keyword: 'Foi', delta: D(0, 2, 0, 1) }], add: [{ card: 'q_oracle', delay: 6 }] }, '« Le fleuve montera. » Il monte chaque année.'),
    right: opt('Interpréter soi-même', { delta: D(0, -6, 8, 0), scale: [{ keyword: 'Foi', delta: D(0, -2) }] }, 'Vous avez décidé que c’était un bon présage. Les prêtres, non.'),
    art: { motif: 'eye' },
  }),
  card({
    id: 'e1_jeux', title: 'Les Jeux', kind: 'era', era: 1, kw: ['Culture'],
    text: 'Les cités voisines organisent des jeux. Il faut envoyer des athlètes. Ou des espions.',
    left: opt('Des athlètes', { delta: D(-5, 4, 0, -5), rival: 8, scale: [{ keyword: 'Culture', delta: D(0, 2) }] }, 'Une couronne de laurier. Ça ne se mange pas.'),
    right: opt('Des espions', { delta: D(0, 0, 9, -3), rival: -7 }, 'Vous savez tout de leurs murailles. Ils savent que vous savez.'),
    art: { motif: 'crown' },
  }),
  card({
    id: 'e1_philosophe', title: 'Le Philosophe', kind: 'era', era: 1, kw: ['Science'],
    text: 'Un homme pieds nus pose des questions sur la place. Les jeunes l’adorent.',
    left: opt('Le laisser parler', { delta: D(0, -7, 11), scale: [{ keyword: 'Science', delta: D(0, 0, 2) }] }, 'Il demande ce qu’est la justice. Les gardes n’aiment pas ça.'),
    right: opt('La ciguë', { delta: D(0, 8, -9), flags: ['cigue'] }, 'Il est mort en souriant. C’est le pire.'),
    art: { motif: 'eye' },
  }),
  card({
    id: 'e1_pirates', title: 'Les Pirates', kind: 'era', era: 1, kw: ['Commerce'],
    text: 'Des pirates vendent ce qu’ils ont volé. Pas cher. Des trucs à vous, parfois.',
    left: opt('Acheter', { delta: D(6, -6, 0, 6), add: [{ card: 'q_pirates', delay: 7 }] }, 'Bonne affaire. Vous avez racheté vos propres amphores.'),
    right: opt('Les pendre', D(-4, 8, 0, -6), 'Les ports sont sûrs. Et vides.'),
    art: { motif: 'wave' },
  }),
  card({
    id: 'e1_route', title: 'La Route', kind: 'era', era: 1, kw: ['Commerce'],
    text: 'Une route pavée jusqu’à la mer. Les marchands rêvent. Les soldats aussi : elle va dans les deux sens.',
    left: opt('Paver', { delta: D(0, -7, 0, 12), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 3) }], add: [{ card: 'q_route', delay: 9 }] }, 'Les chariots roulent. On entend des sabots, la nuit.'),
    right: opt('Des sentiers suffisent', D(3, 6, 0, -7), 'Rien ne passe. Personne ne vient.'),
    art: { motif: 'arch' },
  }),
  card({
    id: 'e1_colonie', title: 'La Colonie', kind: 'era', era: 1, kw: ['Nature'],
    text: 'Des familles veulent fonder une cité de l’autre côté de la mer. Avec vos bateaux.',
    left: opt('Qu’ils partent', { delta: D(8, -6, 0, -6), add: [{ card: 'q_colonie', delay: 10 }] }, 'Moins de bouches. Moins de bras. Des lettres, parfois.'),
    right: opt('Personne ne part', D(-7, 6, 0, 4), 'Ils restent. Ils râlent. Ils travaillent.'),
    art: { motif: 'wave' },
  }),
  card({
    id: 'e1_tyran', title: 'Le Général', kind: 'era', era: 1, kw: ['Guerre'],
    text: 'Le général revient en triomphe. Il salue la foule. La foule salue le général.',
    left: opt('Un triomphe', { delta: D(-5, 9, 0, -6), scale: [{ keyword: 'Guerre', delta: D(0, 2) }], add: [{ card: 'q_general', delay: 6 }] }, 'Il défile. Il sourit. Il regarde votre siège.'),
    right: opt('Un poste lointain', { delta: D(0, -8, 3, 5), rival: -4 }, 'Il garde une frontière. Il écrit beaucoup.'),
    art: { motif: 'crown' },
  }),
];
