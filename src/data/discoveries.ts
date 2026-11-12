/**
 * Découvertes : la récompense de fin d'ère (technologie et institution à la fois).
 * Une découverte entre dans le deck : elle donne un passif et revient chaque ère avec son dilemme.
 * `eras` : ère où elle devient disponible (proposée à la fin de l'ère précédente).
 */
import { $, card } from './dsl';

export const discoveryCards = [
  // ------------------------------------------------------------------ proposées à la fin de l'âge de pierre
  card({
    id: 'd_ecriture', kind: 'decouverte', scale: true, eras: [1], tags: ['Science'], art: { motif: 'scroll', hue: 205 }, price: 3,
    passive: [{ type: 'income', res: 'savoir', amount: 1 }], gift: '+1 Savoir par saison. Compte pour la Science.',
    title: 'L’Écriture',
    text: 'Les scribes veulent tout noter. Surtout ce que vous préféreriez oublier.',
    options: [
      { label: 'Tout noter', effect: { gain: $('S3'), loy: { brume: 1, ourk: -1 } }, reply: 'Tout est écrit. {F:ourk} découvre qu’on peut le citer. Il n’aime pas ça du tout.' },
      { label: 'Noter les dettes', effect: { gain: $('T3'), loy: { troc: 1 } }, reply: 'Les dettes sont écrites. Elles sont plus difficiles à oublier, et c’était le but.' },
    ],
  }),
  card({
    id: 'd_bronze', kind: 'decouverte', scale: true, eras: [1], tags: ['Guerre'], art: { motif: 'shield', hue: 30 }, price: 3,
    passive: [{ type: 'income', res: 'armee', amount: 1 }], gift: '+1 Armée par saison. Compte pour la Guerre.',
    title: 'Le Bronze',
    text: 'Les forgerons demandent : des épées ou des charrues ? « Les deux, c’est possible, mais pas avec le même bras. »',
    options: [
      { label: 'Des épées', cost: $('V2'), effect: { gain: $('A4'), loy: { ourk: 1 } }, reply: 'Les épées brillent. Les champs, un peu moins.' },
      { label: 'Des charrues', cost: $('A1'), effect: { gain: $('V4'), loy: { sel: 1 } }, reply: 'Les sillons sont droits. {F:ourk} trouve ça d’un ennui mortel.' },
    ],
  }),
  card({
    id: 'd_calendrier', kind: 'decouverte', scale: true, eras: [1], tags: ['Foi'], art: { motif: 'moon', hue: 44 }, price: 3,
    passive: [{ type: 'income', res: 'vivres', amount: 1 }], gift: '+1 Vivres par saison. Compte pour la Foi.',
    title: 'Le Calendrier',
    text: 'Le nouveau calendrier compte deux cents jours de fête. {F:sel} en propose un de plus. {F:troc} propose d’en vendre.',
    options: [
      { label: 'Une fête de plus', cost: $('V2'), effect: { loy: { sel: 1, ourk: 1 } }, reply: 'Deux cent un jours de fête. On travaille le reste du temps, quand on se réveille.' },
      { label: 'Moins de fêtes', effect: { gain: $('V3 T2'), loy: { sel: -1 } }, reply: 'On travaille plus. On râle aussi plus. Le calendrier ne compte pas les jours de râle.' },
    ],
  }),
  card({
    id: 'd_conte', kind: 'decouverte', scale: true, eras: [1], tags: ['Culture'], art: { motif: 'mask', hue: 300 }, price: 3,
    passive: [{ type: 'income', res: 'tresor', amount: 1 }], gift: '+1 Trésor par saison. Compte pour la Culture.',
    title: 'Les Conteurs',
    text: 'Les conteurs racontent vos exploits. Ils en inventent la moitié. La meilleure moitié. Ils demandent à être payés pour l’autre.',
    options: [
      { label: 'Les payer', cost: $('T2'), effect: { loy: { ourk: 1, sel: 1 }, gain: $('A2') }, reply: 'Votre légende grandit. Vous avez tué un dragon. Il n’y a pas de dragons. C’est dire.' },
      { label: 'Qu’ils racontent tout', effect: { gain: $('S2'), loy: { troc: -1 } }, reply: 'Ils racontent tout, y compris vos comptes. {F:troc} est pris dans une histoire, en méchant.' },
    ],
  }),

  // ------------------------------------------------------------------ fin de l'Antiquité
  card({
    id: 'd_monnaie', kind: 'decouverte', scale: true, eras: [2], tags: ['Commerce'], art: { motif: 'coin', hue: 150 }, price: 4,
    passive: [{ type: 'income', res: 'tresor', amount: 1 }, { type: 'discount', res: 'tresor', amount: 1 }], gift: '+1 Trésor par saison, et les coûts en Trésor baissent de 1.',
    title: 'La Monnaie',
    text: 'Des pièces à votre effigie. Le trésorier propose d’en frapper beaucoup. Vraiment beaucoup. Il a déjà frappé les premières.',
    options: [
      { label: 'Frapper beaucoup', effect: { gain: $('T6'), loy: { troc: -1 }, sched: [{ card: 'ev_inflation', in: 5 }] }, reply: 'Tout le monde est riche. Le pain coûte trois pièces, puis cinq.' },
      { label: 'Avec parcimonie', effect: { gain: $('T2'), loy: { troc: 1 } }, reply: 'Une monnaie solide. Rare. {F:troc} la thésaurise avec tendresse.' },
    ],
  }),
  card({
    id: 'd_aqueduc', kind: 'decouverte', scale: true, eras: [2], tags: ['Culture'], art: { motif: 'arch', hue: 190 }, price: 4,
    passive: [{ type: 'income', res: 'vivres', amount: 2 }], gift: '+2 Vivres par saison. Compte pour la Culture.',
    title: 'L’Aqueduc',
    text: 'L’eau arrive en ville. Les ingénieurs veulent un deuxième aqueduc, juste au cas où le premier aurait une idée.',
    options: [
      { label: 'Un deuxième', cost: $('T3'), effect: { gain: $('V4'), loy: { brume: 1 } }, reply: 'Deux aqueducs. La ville est si propre que {F:sel} parle d’orgueil.' },
      { label: 'Des bains publics', cost: $('V2'), effect: { loy: { troc: 1, sel: -1 }, gain: $('T3') }, reply: 'Les bains sont pleins. Les affaires s’y traitent en toge, ce qui accélère les choses.' },
    ],
  }),
  card({
    id: 'd_philosophie', kind: 'decouverte', scale: true, eras: [2], tags: ['Science', 'Culture'], art: { motif: 'eye', hue: 230 }, price: 5,
    passive: [], gift: 'Compte pour la Science et pour la Culture.',
    title: 'La Philosophie',
    text: 'Un philosophe pieds nus demande sur la place ce qu’est la justice. Les jeunes l’adorent. Les juges le détestent. Les deux ont raison.',
    options: [
      { label: 'Le laisser parler', effect: { gain: $('S4'), loy: { ourk: -1, brume: 1 } }, reply: 'Il demande ce qu’est un roi. On attend votre réponse. Elle tarde.' },
      { label: 'La ciguë', effect: { gain: $('A2'), loy: { brume: -2 }, mem: ['cigue'] }, reply: 'Il est mort en souriant. C’est le pire : tout le monde l’a vu sourire.' },
    ],
  }),
  card({
    id: 'd_cavalerie', kind: 'decouverte', scale: true, eras: [2], tags: ['Guerre'], art: { motif: 'road', hue: 10 }, price: 4,
    passive: [{ type: 'income', res: 'armee', amount: 1 }], gift: '+1 Armée par saison. Compte pour la Guerre.',
    title: 'La Cavalerie',
    text: 'Les chevaux mangent plus que les soldats. Les soldats veulent des chevaux. Les chevaux, eux, ne veulent rien, ce qui les rend précieux.',
    options: [
      { label: 'Nourrir les chevaux', cost: $('V3'), effect: { gain: $('A5') }, reply: 'La cavalerie charge. Elle charge surtout les greniers, à l’heure des repas.' },
      { label: 'Vendre des chevaux', effect: { gain: $('T4'), rival: 1 }, reply: 'Vendus à {rival}. Ils vous chargeront peut-être un jour. Avec vos chevaux.' },
    ],
  }),

  // ------------------------------------------------------------------ fin du Moyen Âge
  card({
    id: 'd_imprimerie', kind: 'decouverte', scale: true, eras: [3], tags: ['Science', 'Culture'], art: { motif: 'scroll', hue: 260 }, price: 6,
    passive: [{ type: 'income', res: 'savoir', amount: 1 }], gift: '+1 Savoir par saison. Compte pour la Science et la Culture.',
    title: 'L’Imprimerie',
    text: 'Une machine copie un livre en une heure. Les copistes pleurent. {F:sel} s’inquiète de ce que les gens vont lire. Avec raison.',
    options: [
      { label: 'Imprimer de tout', effect: { gain: $('S4'), loy: { sel: -1, brume: 1 } }, reply: 'Tout le monde lit. Tout le monde a un avis. Le vôtre est très discuté.' },
      { label: 'Imprimer les prières', effect: { gain: $('V3'), loy: { sel: 2, brume: -1 } }, reply: 'Dix mille livres de prières, tous identiques. Ça rassure, comme un mur.' },
    ],
  }),
  card({
    id: 'd_comptabilite', kind: 'decouverte', scale: true, eras: [3], tags: ['Commerce'], art: { motif: 'scales', hue: 150 }, price: 5,
    passive: [{ type: 'income', res: 'tresor', amount: 2 }], gift: '+2 Trésor par saison. Compte pour le Commerce.',
    title: 'La Partie double',
    text: 'Les comptables écrivent tout deux fois. Ils ont découvert que vous dépensez plus que vous ne gagnez. Deux fois.',
    options: [
      { label: 'Réduire les dépenses', effect: { gain: $('T4'), loy: { ourk: -1 } }, reply: 'Les fêtes sont annulées, les soldats paient leur soupe. Le budget est équilibré, l’humeur non.' },
      { label: 'Changer de comptables', cost: $('T2'), effect: { gain: $('S2'), loy: { troc: 1 } }, reply: 'Les nouveaux comptables trouvent que tout va bien. Ils sont très chers, mais rassurants.' },
    ],
  }),
  card({
    id: 'd_poudre', kind: 'decouverte', scale: true, eras: [3], tags: ['Guerre'], art: { motif: 'flame', hue: 15 }, price: 5,
    passive: [{ type: 'income', res: 'armee', amount: 2 }], gift: '+2 Armée par saison. Compte pour la Guerre.',
    title: 'L’Artillerie',
    text: 'Des canons qui portent à mille pas. {F:ourk} veut savoir sur quoi tirer. {F:brume} veut savoir pourquoi c’est toujours sur lui.',
    options: [
      { label: 'Des remparts à canons', cost: $('T3'), effect: { gain: $('A4'), loy: { ourk: 1 } }, reply: 'Les remparts tonnent les jours de fête. Les oiseaux ont quitté la région.' },
      { label: 'Des feux de joie', effect: { gain: $('T3'), loy: { sel: 1 } }, reply: 'On tire pour célébrer. {Rival} croient à une attaque, et s’excusent d’avance.' },
    ],
  }),
  card({
    id: 'd_universite', kind: 'decouverte', scale: true, eras: [3], tags: ['Science'], art: { motif: 'arch', hue: 205 }, price: 6,
    passive: [{ type: 'discount', res: 'savoir', amount: 1 }, { type: 'income', res: 'savoir', amount: 1 }], gift: '+1 Savoir par saison, et les coûts en Savoir baissent de 1.',
    title: 'L’Université',
    text: 'Des étudiants, des maîtres, des tavernes. Les étudiants veulent des privilèges. Les maîtres veulent des étudiants. Les tavernes veulent tout le monde.',
    options: [
      { label: 'Des privilèges', effect: { gain: $('S4'), loy: { brume: 1, ourk: -1 } }, reply: 'Ils lisent, boivent et contestent. Dans cet ordre, puis dans le désordre.' },
      { label: 'Des bancs, c’est tout', effect: { gain: $('V2 T2'), loy: { brume: -1 } }, reply: 'Les étudiants partent étudier chez {rival}. {Rival} manquaient justement d’étudiants.' },
    ],
  }),

  // ------------------------------------------------------------------ fin de l'ère industrielle
  card({
    id: 'd_vaccin', kind: 'decouverte', scale: true, eras: [4], tags: ['Science'], art: { motif: 'spiral', hue: 160 }, price: 7,
    passive: [{ type: 'shield', amount: 1 }], gift: 'Chaque ère, la première perte de quartier est évitée. Compte pour la Science.',
    title: 'Le Vaccin',
    text: 'Le docteur Brumel veut injecter du pus de vache à tout le monde. Il jure que ça marche. La vache n’a pas été consultée.',
    options: [
      { label: 'Tout le monde', cost: $('V2'), effect: { gain: $('S3'), loy: { brume: 1, sel: -1 } }, reply: 'Ça marche. Les gens ne le lui pardonneront jamais.' },
      { label: 'Les volontaires', effect: { gain: $('V2') }, reply: 'Trois volontaires, deux vaches. La science avance à la vitesse d’une vache.' },
    ],
  }),
  card({
    id: 'd_cinema', kind: 'decouverte', scale: true, eras: [4], tags: ['Culture'], art: { motif: 'star', hue: 300 }, price: 6,
    passive: [{ type: 'income', res: 'tresor', amount: 2 }, { type: 'tagBonus', tag: 'Culture', amount: 1 }], gift: '+2 Trésor par saison. Compte pour deux cartes Culture.',
    title: 'Le Cinéma',
    text: 'Des images qui bougent. On propose un film sur votre vie. Le scénariste veut savoir si vous préférez la vérité ou le succès.',
    options: [
      { label: 'Le succès', cost: $('T3'), effect: { gain: $('T5'), rival: 1, loy: { ourk: 1 } }, reply: 'Dans le film, vous terrassez {rival} à mains nues. {Reine} l’a vu trois fois.' },
      { label: 'La vérité', effect: { gain: $('S3'), loy: { troc: -1, brume: 1 } }, reply: 'Le film dure onze heures. Il est très précis. Personne ne l’a vu en entier.' },
    ],
  }),
  card({
    id: 'd_vapeur', kind: 'decouverte', scale: true, eras: [4], tags: ['Commerce'], art: { motif: 'gear', hue: 40 }, price: 6,
    passive: [{ type: 'income', res: 'tresor', amount: 1 }, { type: 'income', res: 'vivres', amount: 1 }], gift: '+1 Trésor et +1 Vivres par saison. Compte pour le Commerce.',
    title: 'La Vapeur',
    text: 'Une machine fait le travail de cent fileuses. Les cent fileuses sont devant votre porte. Elles ont des questions.',
    options: [
      { label: 'Vive la machine', effect: { gain: $('T6'), loy: { troc: 1, sel: -1 } }, reply: 'Le tissu coule à flots. Les fileuses aussi, dans la rue.' },
      { label: 'Garder les fileuses', cost: $('T2'), effect: { gain: $('V3'), loy: { sel: 1 } }, reply: 'Les fileuses chantent en filant. Lentement, mais elles chantent.' },
    ],
  }),
  card({
    id: 'd_radar', kind: 'decouverte', scale: true, eras: [4], tags: ['Guerre', 'Science'], art: { motif: 'ring', hue: 0 }, price: 7,
    passive: [{ type: 'income', res: 'armee', amount: 1 }, { type: 'income', res: 'savoir', amount: 1 }], gift: '+1 Armée et +1 Savoir par saison. Compte pour la Guerre et la Science.',
    title: 'Le Radar',
    text: 'Une antenne voit tout ce qui vole à cent lieues. Elle voit aussi les pigeons. Elle déclenche l’alerte pour chaque pigeon.',
    options: [
      { label: 'Abattre les pigeons', effect: { gain: $('A3'), loy: { ourk: 1, sel: -1 } }, reply: 'Plus de fausses alertes. Plus de pigeons. {F:sel} parle d’un signe.' },
      { label: 'Recalibrer', cost: $('S2'), effect: { gain: $('S3'), loy: { brume: 1 } }, reply: 'Le radar ignore les pigeons. Il ignore aussi les petits avions. On verra bien.' },
    ],
  }),
  // ------------------------------------------------------------------ débloquées par la méta-progression
  card({
    id: 'd_silos', lock: 'silos', kind: 'decouverte', scale: true, eras: [1, 2], tags: ['Foi'], art: { motif: 'house', hue: 44 }, price: 3,
    passive: [{ type: 'income', res: 'vivres', amount: 2 }], gift: '+2 Vivres par saison. Compte pour la Foi.',
    title: 'Les Silos',
    text: 'Des tours à grain, hautes et sans fenêtres. Quelqu’un, quelque part, se souvient d’avoir eu très faim. {F:troc} propose d’y stocker aussi l’or.',
    options: [
      { label: 'Du grain, rien que du grain', effect: { gain: $('V4'), loy: { sel: 1 } }, reply: 'Les silos sont pleins. On les regarde le soir, comme d’autres regardent la mer.' },
      { label: 'Louer la moitié à {H:troc}', effect: { gain: $('T4 V1'), loy: { troc: 1, sel: -1 } }, reply: 'Moitié grain, moitié or. En cas de famine, on pourra toujours manger l’or. Non.' },
    ],
  }),
  card({
    id: 'd_archeologie', lock: 'archeologie', kind: 'decouverte', scale: true, eras: [2, 3], tags: ['Culture'], art: { motif: 'skull', hue: 30 }, price: 4,
    passive: [{ type: 'income', res: 'tresor', amount: 1 }], gift: '+1 Trésor par saison. Compte pour la Culture.',
    title: 'L’Archéologie',
    text: 'Sous la ville, des savants trouvent {ruine:0}. Sous {ruine:0}, une autre ville. {?ruins>=2|C’est {ruine:1}.|Personne ne sait laquelle.} Ils demandent s’il faut continuer à creuser.',
    options: [
      { label: 'Exposer les trouvailles', cost: $('T2'), effect: { gain: $('S4'), loy: { brume: 1, sel: 1 } }, reply: 'Les visiteurs défilent devant les crânes de vos prédécesseurs. Ils trouvent qu’ils vous ressemblent.' },
      { label: 'Revendre les trouvailles', effect: { gain: $('T6'), loy: { sel: -1, troc: 1 } }, reply: 'Les morts n’ont pas d’avocat. {F:sel} se propose, contre honoraires.' },
    ],
  }),
  card({
    id: 'd_ambassade', lock: 'ambassade', kind: 'decouverte', scale: true, eras: [2, 3], tags: ['Commerce'], art: { motif: 'scroll', hue: 268 }, price: 4,
    passive: [{ type: 'income', res: 'tresor', amount: 1 }], gift: '+1 Trésor par saison. Chaque ère : parler à {rival} avant qu’ils ne tirent.',
    title: 'L’Ambassade',
    text: 'Un palais chez {rival}, avec votre drapeau et un cuisinier. L’ambassadeur demande ses instructions. Il demande aussi un meilleur cuisinier.',
    options: [
      { label: 'Porter des cadeaux', cost: $('T3'), effect: { rival: 1, loy: { troc: 1 } }, reply: '{Reine} accepte les cadeaux. {Elle} les fait expertiser devant l’ambassadeur.' },
      { label: 'Écouter aux portes', effect: { gain: $('S4'), rival: -1, loy: { brume: 1 } }, reply: 'L’ambassadeur rapporte des plans, des rumeurs et une recette. Le cuisinier, lui, est resté là-bas.' },
    ],
  }),
  card({
    id: 'd_droit', lock: 'droit', kind: 'decouverte', scale: true, eras: [2, 3], tags: ['Foi'], art: { motif: 'scales', hue: 44 }, price: 4,
    passive: [{ type: 'discount', res: 'tresor', amount: 1 }], gift: 'Tous les coûts en Trésor baissent de 1 : les juristes négocient pour vous. Compte pour la Foi.',
    title: 'Le Droit',
    text: 'Des juges, des codes, des robes noires. Vous avez eu tant de procès que la justice s’est organisée autour de vous. Reste à savoir pour qui elle travaille.',
    options: [
      { label: 'Juger les puissants', effect: { gain: $('V3'), loy: { sel: 1, ourk: -1, troc: -1 } }, reply: 'Un amiral et un banquier en prison le même jour. La foule applaudit. Les puissants prennent des notes.' },
      { label: 'Juger les pauvres', effect: { gain: $('T5'), loy: { troc: 1, sel: -1 } }, reply: 'Les prisons se remplissent de voleurs de pain. Les voleurs de banques vous remercient.' },
    ],
  }),
];
