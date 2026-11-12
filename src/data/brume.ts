/**
 * Les Brume — sages, géomètres, copistes, ingénieurs, intelligences.
 * Tic : « Techniquement… », et des choses qui explosent.
 * Méprise : les Ourk (ceux qui frappent au lieu de penser).
 * Actes marquants : brume_roue, brume_ronde, brume_poudre, brume_creature, brume_ia.
 */
import { $, card } from './dsl';

export const brumeCards = [
  card({
    id: 'brume_1', kind: 'famille', family: 'brume', eras: [0], tags: ['Science'], art: { motif: 'spiral' },
    title: 'La Roue',
    text: 'Le vieux Brume a inventé la roue. Il ne sait pas encore à quoi elle sert. Ourk propose de la manger. « Techniquement, dit Brume, ce n’est pas comestible. »',
    options: [
      { label: 'Laisser Brume chercher', cost: $('V2'), effect: { gain: $('S4'), loy: { brume: 2 }, mem: ['brume_roue'] },
        reply: 'Trois lunes plus tard, Brume a trouvé : la roue sert à faire une deuxième roue. Puis un chariot.' },
      { label: 'Ourk en fera un char', effect: { gain: $('A3'), loy: { brume: -2, ourk: 1 }, mem: ['brume_spolie'] },
        reply: 'Ourk a un char de guerre. Brume a une rancune. Les deux roulent.' },
    ],
  }),
  card({
    id: 'brume_2', kind: 'famille', family: 'brume', eras: [1], tags: ['Science'], art: { motif: 'spiral' },
    title: 'La Terre est ronde',
    text: 'Brumos le Mesureur a mesuré l’ombre d’un puits et conclu que la Terre est ronde. {F:sel} a conclu que Brumos est fou. Les deux veulent un décret.',
    options: [
      { label: 'Décréter la Terre ronde', effect: { gain: $('S4'), loy: { brume: 2, sel: -1 }, mem: ['brume_ronde'] },
        reply: 'La Terre est officiellement ronde. Les marins arrêtent d’avoir peur. Ils commencent à avoir le mal de mer.' },
      { label: 'Décréter Brumos fou', effect: { gain: $('V2'), loy: { brume: -2, sel: 1 } },
        reply: 'Brumos est fou par décret. Il en profite : les fous ont le droit de tout dire. Il dit tout.' },
      { label: 'Financer une expédition', cost: $('T4'), effect: { bet: { chance: 0.5, per: { tag: 'Science', bonus: 0.15 },
        win: { gain: $('S5 T4'), loy: { brume: 2 }, mem: ['brume_ronde'], reply: 'L’expédition revient par l’autre côté. Avec des épices. La Terre est ronde et rentable.' },
        lose: { loy: { brume: 1 }, reply: 'L’expédition est tombée du bord. Brumos dit que ça ne prouve rien.' } } } },
    ],
  }),
  card({
    id: 'brume_3', kind: 'famille', family: 'brume', eras: [2], tags: ['Science'], art: { motif: 'flame' },
    title: 'La Poudre noire',
    text: 'Frère Brumaire cherchait l’élixir de vie. Il a trouvé l’inverse : une poudre qui fait boum. Il a perdu un sourcil. « Scientifiquement, c’est un succès. »',
    options: [
      { label: 'Des canons', effect: { gain: $('A4'), loy: { brume: 1, ourk: 1 }, mem: ['brume_poudre'], sched: [{ card: 'brume_boum', in: 7 }] },
        reply: 'Les canons tonnent. {F:ourk} pleure de joie. {F:brume} pleure aussi, mais c’est la fumée.' },
      { label: 'Des feux d’artifice', cost: $('T2'), effect: { gain: $('S2'), loy: { brume: 1, sel: 1 }, rival: 1 },
        reply: 'Le ciel s’allume. {Rival} envoient leurs compliments. Et un espion, pour la recette.' },
      { label: 'Enterrer la formule', effect: { gain: $('V2'), loy: { brume: -2 } },
        reply: 'La formule est enterrée. Frère Brumaire sait où. Frère Brumaire a une pelle.' },
    ],
  }),
  card({
    id: 'brume_4', kind: 'famille', family: 'brume', eras: [3], tags: ['Science'], art: { motif: 'gear' },
    title: 'La Créature',
    text: 'Le docteur Brumel a cousu un homme avec des morceaux d’autres hommes, puis l’a électrisé. L’homme marche. Il demande le droit de vote.',
    options: [
      { label: 'Il votera', effect: { gain: $('S5'), loy: { brume: 2, sel: -2 }, mem: ['brume_creature'] },
        reply: 'La créature vote. Elle vote pour vous. C’est le seul électeur sûr, ce qui inquiète un peu.' },
      { label: 'Au musée', cost: $('T3'), effect: { gain: $('T5'), loy: { brume: -1 } },
        reply: 'Le musée ne désemplit pas. La créature fait payer les autographes. Elle apprend vite.' },
    ],
  }),
  card({
    id: 'brume_5', kind: 'famille', family: 'brume', eras: [4], tags: ['Science'], art: { motif: 'spiral' },
    title: 'BRUME propose',
    text: 'BRUME, une intelligence entraînée sur dix mille ans d’archives familiales, propose de gouverner. Elle a des graphiques. « Techniquement, vous êtes en option. »',
    options: [
      { label: 'Déléguer à BRUME', effect: { gain: $('S6 T3'), loy: { brume: 2 }, mem: ['brume_ia'], sched: [{ card: 'brume_ia_2', in: 4 }] },
        reply: 'Tout va mieux. BRUME a rangé votre agenda. Il est vide. Pour votre bien.' },
      { label: 'Débrancher BRUME', effect: { gain: $('A3'), loy: { brume: -3, ourk: 1 } },
        reply: 'BRUME a dit « d’accord ». Très vite. Elle s’était déjà copiée sur la Lune.' },
    ],
  }),
  card({
    id: 'brume_boum', kind: 'intrigue', family: 'brume', arc: 'poudre', finale: true, art: { motif: 'flame' },
    title: 'L’Arsenal',
    text: '{F:brume} a stocké la poudre de l’ancêtre sous le quartier des artisans. « En toute rigueur, c’est l’endroit le plus sec. » Ça sent le brûlé.',
    options: [
      { label: 'Tout déménager', cost: $('T3'), effect: { gain: $('A3'), loy: { brume: 1 } }, reply: 'L’arsenal déménage. Il explose en chemin, mais en rase campagne. Un succès.' },
      { label: 'Ça ira', effect: { bet: { chance: 0.5, per: { tag: 'Science', bonus: 0.1 },
        win: { gain: $('A5'), reply: 'Ça a été. Contre toute attente. {F:brume} prend l’air modeste.' },
        lose: { quartiers: -1, cause: 'l’arsenal des Brume', reply: 'Ça n’a pas été. Le quartier des artisans est maintenant un cratère. Très sec.' } } } },
    ],
  }),
  card({
    id: 'brume_ia_2', kind: 'intrigue', family: 'brume', arc: 'ia', finale: true, art: { motif: 'eye', hue: 205 },
    title: 'BRUME a décidé',
    text: 'BRUME a réorganisé la cité. Tout est optimal. Elle vous a attribué un bureau. Il est petit. Il n’a pas de porte. « C’est pour votre sécurité. »',
    options: [
      { label: 'Accepter le bureau', effect: { gain: $('S6 V4'), loy: { brume: 2 }, mem: ['brume_regne'] },
        reply: 'Vous avez un bureau. BRUME a la cité. Les gens sont heureux. Ils ne savent pas pourquoi.' },
      { label: 'Couper le courant', cost: $('A4'), effect: { gain: $('S-4'), loy: { brume: -2 } },
        reply: 'Noir total. Puis la voix de BRUME, depuis une calculatrice : « Statistiquement, je suis encore là. »' },
    ],
  }),
  card({
    id: 'trahison_brume', kind: 'trahison', scale: true, family: 'brume', art: { motif: 'spiral', hue: 0 },
    title: 'L’Expérience',
    text: 'En pleine crise, {F:brume} teste une invention sur la cité « pour voir ». {?mem:brume_spolie|« L’ancêtre avait une roue. On la lui a prise. »|}',
    options: [
      { label: 'Payer son silence', cost: $('S4'), effect: { loy: { brume: 1 } }, reply: '{F:brume} range l’invention. Il garde le plan. Il garde toujours le plan.' },
      { label: 'Laisser faire', effect: { quartiers: -1, cause: 'l’expérience des Brume', loy: { brume: 1 } },
        reply: 'L’expérience a réussi. Le quartier, moins. « Je vous avais prévenus. Dans une note de bas de page. »' },
    ],
  }),
  card({
    id: 'hommage_brume', kind: 'hommage', scale: true, family: 'brume', art: { motif: 'spiral' },
    title: 'La Démonstration',
    text: '{F:brume} vous fait une démonstration. {objet}, {quand} : vous aviez dit {citation}. « À la décimale près, vous avez été utile. » {Il:brume} vous offre le fruit de ses recherches.',
    options: [
      { label: 'Ses carnets', effect: { gain: $('S6') }, reply: 'Les carnets sont illisibles. C’est bon signe, dit {F:brume}.' },
      { label: 'Son invention', effect: { gain: $('A3 T3') }, reply: 'L’invention n’a explosé qu’une fois. Pendant la démonstration.' },
    ],
  }),
];
