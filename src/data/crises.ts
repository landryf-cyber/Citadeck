import { card, opt, D } from './dsl';
import type { CrisisDef } from '../core/types';

/**
 * Crises : une par fin d'ère. 3 cartes imposées + 1 ou 2 tirées parmi les extras.
 * Elles testent l'état des jauges (conditions) et la composition du deck (synergies).
 */
export const crisisCards = [
  // ---------------------------------------------------------------- 0. LA HORDE
  card({
    id: 'x0_eclaireurs', title: 'Les Éclaireurs', kind: 'crisis',
    text: 'Des cavaliers inconnus sur la crête. Ils comptent vos huttes. Ils sourient.',
    left: opt('Les attaquer', { when: { gauge: 'army', gte: 55 }, then: { delta: D(0, -6, 3, 0) }, else: { delta: D(0, -11, 0, -4) } }, 'Deux cavaliers de moins. Ils savent où vous êtes.'),
    right: opt('Offrir un repas', { delta: D(-9, 0, 3, 0), rival: 3 }, 'Ils ont mangé. Ils ont compté les greniers.'),
    art: { motif: 'mountain' },
  }),
  card({
    id: 'x0_portes', title: 'La Horde', kind: 'crisis',
    text: 'Ils sont tous là. Des milliers. Leur chef veut parler. Ou pas.',
    left: opt('Tenir les murs', { when: { gauge: 'army', gte: 50 }, then: { delta: D(-5, -8, -4, 0), scale: [{ keyword: 'Guerre', delta: D(0, 3) }] }, else: { delta: D(-7, -13, -5, -5), scale: [{ keyword: 'Guerre', delta: D(0, 3) }] } }, 'Les murs tiennent. Ils grignotent vos champs en attendant.'),
    right: opt('Payer le tribut', { when: { gauge: 'treasure', gte: 50 }, then: { delta: D(0, -5, 0, -14), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 3) }] }, else: { delta: D(-5, -7, -4, -10), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 3) }] } }, 'Ils sont partis. Avec presque tout.'),
    art: { motif: 'shield' },
  }),
  card({
    id: 'x0_lendemain', title: 'Le Lendemain', kind: 'crisis',
    text: 'La horde est passée. Il reste des cendres, des blessés et des gens qui vous regardent.',
    left: opt('Reconstruire', { delta: D(-4, 0, -4, -9), scale: [{ keyword: 'Nature', delta: D(3) }] }, 'Les huttes repoussent. Plus solides. Les peintures ont brûlé.'),
    right: opt('Se venger', { delta: D(-4, 7, -4, -5), scale: [{ keyword: 'Guerre', delta: D(0, 3) }], rival: -5 }, 'Vous les avez poursuivis. Vous avez trouvé d’autres cendres.'),
    art: { motif: 'flame' },
  }),
  card({
    id: 'x0_traitre', title: 'Le Traître', kind: 'crisis',
    text: 'Quelqu’un a ouvert la palissade. On sait qui. C’est un bon chasseur.',
    left: opt('L’exécuter', { delta: D(-5, 6, -5, 0), scale: [{ keyword: 'Foi', delta: D(0, 3) }] }, 'Mort. Il a dit qu’il avait faim.'),
    right: opt('L’écouter', { delta: D(0, -8, 8, 0), scale: [{ keyword: 'Science', delta: D(0, 0, 3) }] }, 'Il avait des raisons. Elles vous concernaient.'),
    art: { motif: 'mask' },
  }),
  card({
    id: 'x0_otages', title: 'Les Otages', kind: 'crisis',
    text: 'La horde a emmené vingt des vôtres. Elle propose de les vendre. Elle est honnête, pour une horde.',
    left: opt('Les racheter', { delta: D(0, 3, 0, -13), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 3) }] }, 'Ils sont rentrés. Ils ont des histoires.'),
    right: opt('Tant pis pour eux', { delta: D(0, -9, 0, 3), scale: [{ keyword: 'Culture', delta: D(0, -3) }] }, 'On a chanté leurs noms. Une fois.'),
    art: { motif: 'coin' },
  }),
  card({
    id: 'x0_feu', title: 'Les Greniers brûlent', kind: 'crisis',
    text: 'Ils ont lancé des torches. Les greniers ou le temple : vous ne sauverez qu’un des deux.',
    left: opt('Les greniers', { delta: D(3, -4, 0, -4), scale: [{ keyword: 'Foi', delta: D(0, -3) }] }, 'On mangera. Les dieux ont eu chaud.'),
    right: opt('Le temple', { delta: D(-9, 5, -3, 0), scale: [{ keyword: 'Foi', delta: D(0, 4) }] }, 'Les dieux sont sauvés. Ils n’ont rien fait pour vous.'),
    art: { motif: 'flame' },
  }),

  // ---------------------------------------------------------------- 1. LA PESTE
  card({
    id: 'x1_morts', title: 'Les Premiers Morts', kind: 'crisis',
    text: 'Une fièvre au port. Dix morts. Les médecins disent que ce n’est rien. Ils toussent.',
    left: opt('Fermer le port', { delta: D(-3, 0, -4, -11), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, -2) }] }, 'Le port est vide. Les quais sont calmes. Trop.'),
    right: opt('Laisser ouvert', { delta: D(-7, -7, -4, 4), scale: [{ keyword: 'Science', delta: D(3, 2) }], flags: ['peste_ouverte'] }, 'Le commerce continue. Les charrettes aussi.'),
    art: { motif: 'wave' },
  }),
  card({
    id: 'x1_rues', title: 'La Ville tousse', kind: 'crisis',
    text: 'Un tiers de la ville est malade. Les prêtres prient. Les médecins cherchent. Les deux demandent de l’argent.',
    left: opt('Les médecins', { delta: D(0, -4, 6, -10), scale: [{ keyword: 'Science', delta: D(3, 0, 2) }, { keyword: 'Foi', delta: D(0, -2) }] }, 'Ils ont trouvé les rats. Ils cherchent toujours les puces.'),
    right: opt('Les prêtres', { when: { flag: 'peste_ouverte' }, then: { delta: D(-5, 4, -7, -8), scale: [{ keyword: 'Foi', delta: D(2, 3) }] }, else: { delta: D(0, 6, -7, -8), scale: [{ keyword: 'Foi', delta: D(2, 3) }] } }, 'Processions. Les malades suivent. Ils toussent en rythme.'),
    art: { motif: 'spiral' },
  }),
  card({
    id: 'x1_quarantaine', title: 'Les Murs fermés', kind: 'crisis',
    text: 'Les bien-portants veulent sortir. Les malades veulent entrer. Les gardes toussent.',
    left: opt('Personne ne bouge', { when: { gauge: 'army', gte: 45 }, then: { delta: D(-6, -5, -3, 0) }, else: { delta: D(-8, -9, -3, -3) } }, 'La ville est un tombeau. Fermé. Propre.'),
    right: opt('Ouvrir', { delta: D(-6, -5, 0, -8), scale: [{ keyword: 'Nature', delta: D(3) }], rival: -5 }, 'La fièvre a voyagé. Les voisins vous écrivent.'),
    art: { motif: 'tower' },
  }),
  card({
    id: 'x1_rats', title: 'Les Rats', kind: 'crisis',
    text: 'Un enfant dit que ce sont les rats. Les médecins rient. Il y a des rats partout.',
    left: opt('L’écouter', { delta: D(-5, 0, 9, -6), scale: [{ keyword: 'Science', delta: D(3, 0, 2) }] }, 'Les chats sont en or. Les rats, en fuite.'),
    right: opt('Brûler les malades', { delta: D(0, 5, -9, 0), scale: [{ keyword: 'Foi', delta: D(0, 2) }, { keyword: 'Culture', delta: D(0, -3) }] }, 'Les feux brûlent la nuit. On ne chante plus.'),
    art: { motif: 'moon' },
  }),
  card({
    id: 'x1_heritage', title: 'Les Maisons vides', kind: 'crisis',
    text: 'La peste a emporté les riches aussi. Leurs maisons sont vides. Leurs coffres, pleins.',
    left: opt('Tout au trésor', { delta: D(0, -5, 0, 13), scale: [{ keyword: 'Culture', delta: D(0, -3) }] }, 'Riche. Les héritiers survivants vous détestent.'),
    right: opt('Aux survivants', { delta: D(8, 4, 0, -4), scale: [{ keyword: 'Culture', delta: D(0, 2) }] }, 'Les pauvres ont des maisons. Ils ne savent pas quoi en faire.'),
    art: { motif: 'coin' },
  }),
  card({
    id: 'x1_voisins', title: 'Les Voisins malades', kind: 'crisis',
    text: 'La peste frappe les voisins aussi. Plus fort. Ils demandent des médecins. Ou du blé. Ou n’importe quoi.',
    left: opt('Aider', { delta: D(-6, 0, 4, -5), rival: 15 }, 'Ils s’en souviendront. Ils le disent, en tout cas.'),
    right: opt('Fermer la frontière', { delta: D(0, 4, -6, 3), rival: -18 }, 'Ils s’en souviendront aussi.'),
    art: { motif: 'mask' },
  }),

  // ---------------------------------------------------------------- 2. LA RÉVOLTE
  card({
    id: 'x2_murmures', title: 'Les Murmures', kind: 'crisis',
    text: 'Dans les tavernes, on dit que le roi n’est pas nécessaire. On le dit de plus en plus fort.',
    left: opt('Fermer les tavernes', { delta: D(0, 7, -7, -3), scale: [{ keyword: 'Culture', delta: D(0, -3) }] }, 'On murmure dans la rue, maintenant. Plus sobrement.'),
    right: opt('Écouter', { delta: D(0, -8, 7, 0), scale: [{ keyword: 'Science', delta: D(0, 0, 2) }, { keyword: 'Culture', delta: D(0, 3) }] }, 'Ils ont des idées. Certaines sont bonnes. C’est le problème.'),
    art: { motif: 'mask' },
  }),
  card({
    id: 'x2_barricades', title: 'Les Barricades', kind: 'crisis',
    text: 'La ville est à eux. Le palais, encore à vous. Ils demandent du pain, puis votre tête. Dans cet ordre.',
    left: opt('Du pain', { when: { gauge: 'food', gte: 45 }, then: { delta: D(-10, 0, 0, -4), scale: [{ keyword: 'Nature', delta: D(3) }] }, else: { delta: D(-10, -8, 0, -4), scale: [{ keyword: 'Nature', delta: D(3) }] } }, 'Ils ont mangé. Ils ont gardé les barricades. Au cas où.'),
    right: opt('La troupe', { when: { gauge: 'army', gte: 55 }, then: { delta: D(-4, -7, -4, 0), scale: [{ keyword: 'Guerre', delta: D(0, 3) }] }, else: { delta: D(-6, -14, -4, -4), scale: [{ keyword: 'Guerre', delta: D(0, 3) }] } }, 'Les rues sont calmes. Elles ont été nettoyées.'),
    art: { motif: 'flame' },
  }),
  card({
    id: 'x2_charte', title: 'La Charte', kind: 'crisis',
    text: 'Les rebelles proposent une charte. Vous régnez, mais ils décident. Vous signez ou vous partez.',
    left: opt('Signer', { delta: D(0, -10, 4, -7), scale: [{ keyword: 'Culture', delta: D(0, 2, 2) }], flags: ['charte'] }, 'Vous régnez. Entre guillemets.'),
    right: opt('Déchirer', { when: { gauge: 'army', gte: 50 }, then: { delta: D(-5, 6, -7, 3), scale: [{ keyword: 'Guerre', delta: D(0, 2) }] }, else: { delta: D(-8, -8, -8, -4) } }, 'Vous régnez. Sur une ville qui vous regarde de travers.'),
    art: { motif: 'scroll' },
  }),
  card({
    id: 'x2_eveque', title: 'L’Évêque choisit', kind: 'crisis',
    text: 'L’évêque peut bénir la révolte ou la maudire. Il attend de voir qui gagne. Il attend aussi de l’or.',
    left: opt('Acheter sa bénédiction', { delta: D(0, 7, 0, -11), scale: [{ keyword: 'Foi', delta: D(0, 4) }] }, 'Béni. Ruiné. Les rebelles ont perdu la foi.'),
    right: opt('Se passer de lui', { delta: D(0, -7, 5, 3), scale: [{ keyword: 'Foi', delta: D(0, -4) }] }, 'Il a béni les rebelles. Par dépit.'),
    art: { motif: 'arch' },
  }),
  card({
    id: 'x2_mercenaires', title: 'Les Mercenaires à la porte', kind: 'crisis',
    text: 'Une compagnie propose d’écraser la révolte. Ils sont chers. Ils sont efficaces. Ils ne partiront pas.',
    left: opt('Les engager', { delta: D(0, 10, 0, -10), add: [{ card: 'q_mercenaires', delay: 6 }] }, 'La révolte est finie. Les mercenaires restent dîner.'),
    right: opt('Non merci', { delta: D(-4, -10, 2, 0), scale: [{ keyword: 'Guerre', delta: D(0, 3) }] }, 'Ils ont proposé leurs services aux rebelles.'),
    art: { motif: 'shield' },
  }),
  card({
    id: 'x2_imprimeur', title: 'L’Imprimeur', kind: 'crisis',
    text: 'Un imprimeur inonde la ville de pamphlets. Il vous appelle « le gros ». Vous n’êtes pas gros.',
    left: opt('Le pendre', { delta: D(0, 6, -9, 0), scale: [{ keyword: 'Science', delta: D(0, 0, -3) }], flags: ['censure'] }, 'Pendu. Le pamphlet suivant parlait de ça.'),
    right: opt('Répondre par pamphlet', { delta: D(0, -6, 7, -4), scale: [{ keyword: 'Culture', delta: D(0, 3) }] }, 'Le vôtre était drôle. Pas assez.'),
    art: { motif: 'scroll' },
  }),

  // ---------------------------------------------------------------- 3. LA GRANDE GUERRE
  card({
    id: 'x3_mobilisation', title: 'La Mobilisation', kind: 'crisis',
    text: 'Les voisins ont mobilisé. Leurs trains sont pleins de soldats. Les vôtres sont pleins de charbon.',
    left: opt('Mobiliser aussi', { delta: D(-6, 10, 0, -7), scale: [{ keyword: 'Guerre', delta: D(0, 3) }], rival: -10 }, 'Tout le monde est soldat. Personne ne moissonne.'),
    right: opt('Attendre', { delta: D(-3, -11, -4, 0), scale: [{ keyword: 'Science', delta: D(0, 0, 2) }], rival: 5 }, 'Vous avez attendu. Ils aussi. Puis ils ont cessé.'),
    art: { motif: 'gear' },
  }),
  card({
    id: 'x3_tranchees', title: 'Les Tranchées', kind: 'crisis',
    text: 'Le front ne bouge plus. Chaque mètre coûte mille hommes. Les généraux veulent un mètre.',
    left: opt('L’offensive', { when: { gauge: 'army', gte: 60 }, then: { delta: D(-4, -9, -3, -5), scale: [{ keyword: 'Guerre', delta: D(0, 4) }], flags: ['rivalDefeated'] }, else: { delta: D(-8, -15, -3, -5), scale: [{ keyword: 'Guerre', delta: D(0, 4) }] } }, 'Un mètre. Puis deux. Puis la percée.'),
    right: opt('Tenir', { delta: D(-10, -5, 0, -10), scale: [{ keyword: 'Nature', delta: D(3) }] }, 'Rien ne bouge. Tout s’épuise.'),
    art: { motif: 'shield' },
  }),
  card({
    id: 'x3_armistice', title: 'L’Armistice', kind: 'crisis',
    text: 'Tout le monde est épuisé. Les voisins proposent la paix. Leurs conditions tiennent sur dix pages.',
    left: opt('Signer', { delta: D(3, -8, 0, -10), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 3) }], rival: 12 }, 'La paix. Chère. Les généraux parlent de trahison.'),
    right: opt('Dicter vos conditions', { when: { flag: 'rivalDefeated' }, then: { delta: D(4, 4, 0, 10), rival: -15 }, else: { delta: D(-5, -8, -4, -5), rival: -15 } }, 'Vos dix pages contre les leurs. Les leurs sont mieux armées.'),
    art: { motif: 'scroll' },
  }),
  card({
    id: 'x3_usines', title: 'L’Effort de guerre', kind: 'crisis',
    text: 'Les usines doivent choisir : des obus ou du pain. Les ouvrières font les deux. Elles voudraient dormir.',
    left: opt('Des obus', { delta: D(-11, 8, 0, 0), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 3) }] }, 'Le front est fourni. La ville, affamée.'),
    right: opt('Du pain', { delta: D(8, -9, 0, -4), scale: [{ keyword: 'Nature', delta: D(3) }] }, 'La ville mange. Le front envoie des lettres.'),
    art: { motif: 'gear' },
  }),
  card({
    id: 'x3_mutinerie', title: 'La Mutinerie', kind: 'crisis',
    text: 'Un régiment refuse de monter. Ils chantent. Les autres régiments écoutent.',
    left: opt('Fusiller les meneurs', { delta: D(0, 6, -9, -3), scale: [{ keyword: 'Guerre', delta: D(0, 2) }, { keyword: 'Culture', delta: D(0, -3) }] }, 'Silence dans les rangs. Un silence qui dure.'),
    right: opt('Des permissions', { delta: D(-3, -7, 5, -3), scale: [{ keyword: 'Culture', delta: D(0, 3) }] }, 'Ils sont rentrés chez eux. La moitié est revenue.'),
    art: { motif: 'flame' },
  }),
  card({
    id: 'x3_emprunt', title: 'L’Emprunt de guerre', kind: 'crisis',
    text: 'Le trésor est vide. Les banquiers proposent de prêter. Le peuple propose de donner ses bijoux. Il n’en a plus.',
    left: opt('Les banquiers', { delta: D(0, 4, 0, 10), add: [{ card: 'q_dette', delay: 5 }], scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 3) }] }, 'Des obus à crédit. La facture suivra.'),
    right: opt('Les bijoux', { delta: D(-6, 4, 0, 6), scale: [{ keyword: 'Foi', delta: D(0, 3) }] }, 'Des alliances fondues. Des larmes. Des obus.'),
    art: { motif: 'coin' },
  }),

  // ---------------------------------------------------------------- 4. LE GRAND FILTRE
  card({
    id: 'x4_signal', title: 'Le Signal', kind: 'crisis',
    text: 'Les télescopes captent un signal. Pas d’ici. Il répète un nombre. Les voisins l’ont capté aussi.',
    left: opt('Répondre', { delta: D(0, -7, 6, -7), scale: [{ keyword: 'Science', delta: D(0, 0, 0, 2) }], flags: ['signal'], rival: 5 }, 'Vous avez répondu. Le silence qui suit est très long.'),
    right: opt('Se taire', { delta: D(-4, 7, -8, 0), scale: [{ keyword: 'Guerre', delta: D(0, 2) }] }, 'Silence. Les voisins ont répondu, eux.'),
    art: { motif: 'star' },
  }),
  card({
    id: 'x4_penurie', title: 'La Dernière Mine', kind: 'crisis',
    text: 'Il ne reste presque plus de métal sur Terre. Il y en a dans le ciel. Et chez les voisins.',
    left: opt('Le ciel', { delta: D(-6, -4, 4, -12), scale: [{ keyword: 'Science', delta: D(0, 0, 0, 2) }, { keyword: 'Commerce', delta: D(0, 0, 0, 2) }] }, 'Les mines orbitales. Lent. Propre. Ruineux.'),
    right: opt('Les voisins', { when: { gauge: 'army', gte: 60 }, then: { delta: D(-4, -9, 0, 10), rival: -25, flags: ['rivalDefeated'], scale: [{ keyword: 'Guerre', delta: D(0, 2) }] }, else: { delta: D(-7, -13, 0, 2), rival: -25, scale: [{ keyword: 'Guerre', delta: D(0, 2) }] } }, 'Leurs mines sont à vous. Leur rancune aussi.'),
    art: { motif: 'comet' },
  }),
  card({
    id: 'x4_choix', title: 'Le Grand Filtre', kind: 'crisis',
    text: 'Le signal avait un sens : « Montrez ce que vous êtes. » Vos conseillers ont chacun une idée.',
    left: opt('Lancer l’arche', { delta: D(-7, -5, -10, -10), scale: [{ keyword: 'Science', delta: D(0, 0, 2, 2) }], flags: ['endingScience'] }, 'Le vaisseau est parti. Avec vos meilleurs esprits.'),
    right: opt('Ouvrir les archives', { delta: D(-7, -9, -4, 5), scale: [{ keyword: 'Culture', delta: D(0, 2) }, { keyword: 'Foi', delta: D(0, 2) }], flags: ['endingCulture'], rival: 10 }, 'Tout le monde a tout lu. Tout le monde pleure. De joie, dit-on.'),
    art: { motif: 'ring' },
  }),
  card({
    id: 'x4_generaux', title: 'Les Généraux', kind: 'crisis',
    text: 'Les généraux disent que les voisins préparent un coup. Ils proposent le leur. Ce soir.',
    left: opt('Frapper', { when: { gauge: 'army', gte: 55 }, then: { delta: D(-6, -8, -5, 4), rival: -30, flags: ['endingMilitary', 'rivalDefeated'], scale: [{ keyword: 'Guerre', delta: D(0, 2) }] }, else: { delta: D(-11, -12, -5, -6), rival: -30, flags: ['endingMilitary'], scale: [{ keyword: 'Guerre', delta: D(0, 2) }] } }, 'Les voisins n’existent plus. La planète est à vous. Ce qu’il en reste.'),
    right: opt('Les arrêter', { delta: D(0, -11, 3, -5), scale: [{ keyword: 'Culture', delta: D(0, 2) }], rival: 10 }, 'Les généraux sont en prison. L’armée est vexée.'),
    art: { motif: 'shield' },
  }),
  card({
    id: 'x4_exode', title: 'L’Exode', kind: 'crisis',
    text: 'Un milliard de personnes veulent quitter la planète. Il y a de la place pour mille.',
    left: opt('Tirer au sort', { delta: D(-6, -8, 0, -5), scale: [{ keyword: 'Culture', delta: D(0, 2) }, { keyword: 'Foi', delta: D(0, 2) }] }, 'Mille noms. Des émeutes. De la dignité, parfois.'),
    right: opt('Les meilleurs', { delta: D(-6, 4, -9, -6), scale: [{ keyword: 'Science', delta: D(0, 0, 2) }] }, 'Les génies sont partis. La planète est moins intelligente. Plus calme.'),
    art: { motif: 'comet' },
  }),
  card({
    id: 'x4_fusion', title: 'Le Réacteur', kind: 'crisis',
    text: 'Le réacteur à fusion est prêt. Il peut tout alimenter. Ou tout raser. Les ingénieurs disent 90 %.',
    left: opt('Allumer', { when: { keyword: 'Science', min: 3 }, then: { delta: D(8, -4, 5, -8) }, else: { delta: D(-8, -6, 3, -11) } }, 'Ça marche. La nuit n’existe plus.'),
    right: opt('Pas à 90 %', { delta: D(-8, 0, -8, 5), scale: [{ keyword: 'Foi', delta: D(0, 2) }] }, 'Prudence. Le noir continue.'),
    art: { motif: 'sun' },
  }),
];

export const crises: CrisisDef[] = [
  {
    id: 'horde', era: 0, name: 'La Horde',
    intro: 'Des cavaliers. Des milliers. Ils viennent voir ce que vous avez construit.',
    cards: ['x0_eclaireurs', 'x0_portes', 'x0_lendemain'],
    extra: ['x0_traitre', 'x0_otages', 'x0_feu'], extraCount: 1,
  },
  {
    id: 'peste', era: 1, name: 'La Peste',
    intro: 'Une fièvre au port. Dix morts. Puis cent. Puis on arrête de compter.',
    cards: ['x1_morts', 'x1_rues', 'x1_quarantaine'],
    extra: ['x1_rats', 'x1_heritage', 'x1_voisins'], extraCount: 2,
  },
  {
    id: 'revolte', era: 2, name: 'La Révolte',
    intro: 'On murmure que le roi n’est pas nécessaire. On le murmure très fort.',
    cards: ['x2_murmures', 'x2_barricades', 'x2_charte'],
    extra: ['x2_eveque', 'x2_mercenaires', 'x2_imprimeur'], extraCount: 2,
  },
  {
    id: 'guerre', era: 3, name: 'La Grande Guerre',
    intro: 'Les trains sont pleins de soldats. Tous les trains. Dans tous les pays.',
    cards: ['x3_mobilisation', 'x3_tranchees', 'x3_armistice'],
    extra: ['x3_usines', 'x3_mutinerie', 'x3_emprunt'], extraCount: 2,
  },
  {
    id: 'filtre', era: 4, name: 'Le Grand Filtre',
    intro: 'Un signal venu d’ailleurs. Il répète un nombre. Le vôtre, peut-être.',
    cards: ['x4_signal', 'x4_penurie', 'x4_generaux', 'x4_choix'],
    extra: ['x4_exode', 'x4_fusion'], extraCount: 1,
  },
];
