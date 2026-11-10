import { card, opt, D } from './dsl';

/** Trois cartes de tutoriel, jouées en tête de la première partie. Ce sont de vrais dilemmes. */
export const tutorial = [
  card({
    id: 't_feu', title: 'Le Premier Feu', kind: 'tutorial', oneShot: true,
    text: 'Une étincelle. Une tribu. Et déjà, quelqu’un qui a faim.',
    tutorial: 'Glissez la carte à gauche ou à droite pour trancher.',
    left: opt('Cuire le gibier', D(8, 0, -3), 'Ça sent bon. Tout le monde arrive.'),
    right: opt('Éclairer la nuit', D(-3, 0, 8), 'On voit. On discute. On a faim.'),
    art: { motif: 'flame' },
  }),
  card({
    id: 't_jauges', title: 'Le Cercle', kind: 'tutorial', oneShot: true,
    text: 'La tribu vous regarde. Elle attend que vous décidiez quelque chose.',
    tutorial: 'Pendant le geste, les jauges touchées s’allument. Flèche haute : ça monte. Basse : ça baisse.',
    left: opt('Chasser plus loin', D(7, -6), 'Le gibier est loin. Les gardes aussi.'),
    right: opt('Faire des outils', D(-5, 0, 0, 7), 'Des éclats de silex. Les premiers bijoux.'),
    art: { motif: 'ring' },
  }),
  card({
    id: 't_zero', title: 'Le Vieux', kind: 'tutorial', oneShot: true,
    text: 'Le vieux dit : « Trop de tout tue aussi sûrement que pas assez. »',
    tutorial: 'Une jauge à 0 ou à 100, et la partie s’arrête. Gardez-les au milieu.',
    left: opt('Il radote', D(0, 6, -4), 'On l’a fait taire. Ça rassure.'),
    right: opt('Il a raison', D(0, -4, 6), 'On l’a écouté. Ça inquiète.'),
    art: { motif: 'moon' },
  }),
];
