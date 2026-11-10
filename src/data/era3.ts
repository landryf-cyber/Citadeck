import { card, opt, D } from './dsl';

/** Ère industrielle. */
export const era3 = [
  card({
    id: 'e3_usine', title: 'La Filature', kind: 'era', era: 3, kw: ['Commerce'],
    text: 'Une machine fait le travail de cent fileuses. Les cent fileuses sont devant votre porte.',
    left: opt('Vive la machine', { delta: D(-6, -5, 4, 13), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 3) }], add: [{ card: 'q_chomage', delay: 6 }] }, 'Le tissu coule à flots. Les fileuses, à la rue.'),
    right: opt('Casser la machine', D(5, 6, -8, -6), 'Les fileuses chantent. L’ingénieur a émigré.'),
    art: { motif: 'gear' },
  }),
  card({
    id: 'e3_greve', title: 'La Grève', kind: 'era', era: 3, kw: ['Culture'],
    text: 'Les mineurs arrêtent le travail. Sans charbon, rien ne tourne. Ni les usines, ni vous.',
    left: opt('Envoyer la troupe', { delta: D(0, 5, -4, 7), scale: [{ keyword: 'Guerre', delta: D(0, 2) }], add: [{ card: 'q_martyrs', delay: 5 }] }, 'La mine rouvre. Il y a eu des coups de feu. On en parlera.'),
    right: opt('Négocier', D(5, -7, 3, -8), 'Dix heures par jour au lieu de quatorze. Les patrons pleurent.'),
    art: { motif: 'flame' },
  }),
  card({
    id: 'e3_rails', title: 'Le Chemin de fer', kind: 'era', era: 3, kw: ['Science', 'Commerce'],
    text: 'Des rails jusqu’à la frontière. Les marchands applaudissent. Les généraux aussi, pour d’autres raisons.',
    left: opt('Poser les rails', { delta: D(6, -6, 4, -10), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 4) }], rival: 5 }, 'Tout va plus vite. Les rumeurs aussi.'),
    right: opt('Trop cher', D(-4, 6, -5, 6), 'Le monde roule. Vous marchez.'),
    art: { motif: 'arch' },
  }),
  card({
    id: 'e3_colonie', title: 'Les Comptoirs', kind: 'era', era: 3, kw: ['Guerre', 'Commerce'],
    text: 'Au-delà des mers, des terres qui ne demandent rien. On vous propose de les prendre quand même.',
    left: opt('Planter le drapeau', { delta: D(6, -7, 0, 12), rival: -8, add: [{ card: 'q_colonies', delay: 9 }] }, 'Le sucre arrive. Les nouvelles aussi, moins douces.'),
    right: opt('Rester chez soi', { delta: D(-3, 5, 3, -7), rival: 4 }, 'Les voisins y sont allés. Ils ont du sucre.'),
    art: { motif: 'wave' },
  }),
  card({
    id: 'e3_journal', title: 'Le Journal', kind: 'era', era: 3, kw: ['Culture'],
    text: 'Un journal paraît chaque matin. Il parle de vous. Pas gentiment.',
    left: opt('Liberté de la presse', { delta: D(0, -9, 9, 3), scale: [{ keyword: 'Culture', delta: D(0, 0, 2) }] }, 'Ils vous dessinent en cochon. Les ventes explosent.'),
    right: opt('Censure', { delta: D(0, 8, -8, -2), flags: ['censure'] }, 'Le journal parle de la pluie. Beaucoup de pluie.'),
    art: { motif: 'scroll' },
  }),
  card({
    id: 'e3_vaccin', title: 'Le Vaccin', kind: 'era', era: 3, kw: ['Science'],
    text: 'Un médecin veut injecter du pus de vache à tout le monde. Il jure que ça marche.',
    left: opt('Tout le monde', { delta: D(8, -6, 7, -7), scale: [{ keyword: 'Science', delta: D(2, 0, 1) }] }, 'Il avait raison. Les gens ne lui pardonneront jamais.'),
    right: opt('Les volontaires', D(-4, 4, -3, 4), 'Trois volontaires. Deux vaches.'),
    art: { motif: 'spiral' },
  }),
  card({
    id: 'e3_canon', title: 'L’Arsenal', kind: 'era', era: 3, kw: ['Guerre'],
    text: 'Un industriel propose des canons rayés. Les voisins en ont déjà. C’est son argument.',
    left: opt('Acheter', { delta: D(-5, 12, 0, -11), scale: [{ keyword: 'Guerre', delta: D(0, 2) }], rival: -5 }, 'Les canons brillent. Les voisins en commandent d’autres.'),
    right: opt('Des fusils suffisent', { delta: D(4, -8, 2, 6), rival: 3 }, 'Économies. Les généraux font la tête.'),
    art: { motif: 'shield' },
  }),
  card({
    id: 'e3_charbon', title: 'La Suie', kind: 'era', era: 3, kw: ['Nature'],
    text: 'Le fleuve est noir, l’air aussi. Les usines tournent. Les poumons, moins.',
    left: opt('Les usines d’abord', { delta: D(-8, 0, 0, 11), add: [{ card: 'q_smog', delay: 7 }] }, 'Le ciel a disparu. Les coffres sont pleins.'),
    right: opt('Fermer les pires', { delta: D(6, -3, 3, -9), scale: [{ keyword: 'Nature', delta: D(3) }] }, 'On revoit le soleil. Les patrons voient rouge.'),
    art: { motif: 'sun' },
  }),
  card({
    id: 'e3_bourse', title: 'La Bourse', kind: 'era', era: 3, kw: ['Commerce'],
    text: 'Tout le monde achète des actions d’une compagnie qui ne produit rien. Sauf des actions.',
    left: opt('Acheter aussi', { delta: D(0, 0, -4, 13), add: [{ card: 'q_krach', delay: 6 }] }, 'Vous êtes riche sur le papier. Le papier est fragile.'),
    right: opt('Interdire', D(0, 4, 4, -9), 'La bulle a éclaté ailleurs. On vous traite de rabat-joie.'),
    art: { motif: 'coin' },
  }),
  card({
    id: 'e3_exposition', title: 'L’Exposition', kind: 'era', era: 3, kw: ['Culture', 'Science'],
    text: 'Une exposition universelle. Une tour en fer, provisoire. Le monde entier viendrait voir.',
    left: opt('Bâtir la tour', { delta: D(0, -4, 7, -12), scale: [{ keyword: 'Culture', delta: D(0, 0, 0, 3) }], rival: 6 }, 'Hideuse, disent les poètes. Ils y montent tous.'),
    right: opt('Trop frivole', D(5, 5, -6, 2), 'Les voisins ont fait une tour. On y va en touristes.'),
    art: { motif: 'tower' },
  }),
  card({
    id: 'e3_ecole', title: 'L’École', kind: 'era', era: 3, kw: ['Science'],
    text: 'Obligatoire, gratuite, laïque. Les enfants protestent. Les curés aussi. Les usines surtout.',
    left: opt('Obligatoire', { delta: D(-5, -4, 12, -6), scale: [{ keyword: 'Foi', delta: D(0, -2) }] }, 'Ils savent lire. Ils lisent les journaux.'),
    right: opt('Les champs d’abord', D(8, 3, -9, 3), 'Ils ne lisent pas. Ils cueillent. Ils cueillent bien.'),
    art: { motif: 'scroll' },
  }),
];
