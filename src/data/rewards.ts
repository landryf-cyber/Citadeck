import { card, opt, D } from './dsl';

/**
 * Cartes de récompense : technologies, institutions, personnages.
 * Persistantes : une fois dans le deck, elles reviennent à chaque ère.
 * `era` = ère à partir de laquelle elles peuvent être proposées.
 */
export const rewards = [
  // ------------------------------------------------------------------ FOI
  card({
    id: 'r_temple', title: 'Le Temple', kind: 'institution', era: 0, kw: ['Foi'],
    text: 'Les prêtres demandent un dixième de tout. Ils promettent le ciel.',
    left: opt('Payer la dîme', { delta: D(0, 5, 0, -8), scale: [{ keyword: 'Foi', delta: D(1, 2) }] }, 'Le ciel attend. Le peuple obéit.'),
    right: opt('Un dixième du dixième', { delta: D(0, -4, 2, 5), scale: [{ keyword: 'Foi', delta: D(0, -2) }] }, 'Les prêtres prient pour votre âme. Pas pour votre règne.'),
    art: { motif: 'arch', hue: 40 },
  }),
  card({
    id: 'r_prophete', title: 'Le Prophète', kind: 'character', era: 1, kw: ['Foi'],
    text: 'Un prophète annonce la fin du monde. Il propose une date. Il vend des places.',
    left: opt('Le soutenir', { delta: D(-6, 8, -3, 4), scale: [{ keyword: 'Foi', delta: D(0, 2, 0, 1) }] }, 'La foule prie. Le monde continue. Il a repoussé la date.'),
    right: opt('Le ridiculiser', { delta: D(0, -6, 7, 0), scale: [{ keyword: 'Foi', delta: D(0, -3) }] }, 'Il a ri aussi. Ses fidèles, non.'),
    art: { motif: 'eye', hue: 40 },
  }),
  card({
    id: 'r_monastere', title: 'Le Monastère', kind: 'institution', era: 2, kw: ['Foi', 'Science'],
    text: 'Les moines brassent, copient et prient. Ils demandent des terres pour faire les trois.',
    left: opt('Des terres', { delta: D(-7, 0, 7, 3), scale: [{ keyword: 'Foi', delta: D(0, 0, 2) }] }, 'La bière est bonne. Les livres aussi. Les champs, à eux.'),
    right: opt('Des prières suffisent', { delta: D(6, 0, -6, -3), scale: [{ keyword: 'Foi', delta: D(0, -2) }] }, 'Ils prient. Pour quelqu’un d’autre.'),
    art: { motif: 'arch', hue: 40 },
  }),
  card({
    id: 'r_inquisition', title: 'L’Inquisition', kind: 'institution', era: 2, kw: ['Foi', 'Guerre'],
    text: 'Les inquisiteurs ont une liste. Votre nom n’y est pas. Pour l’instant.',
    left: opt('Leur donner les clés', { delta: D(0, 9, -8, 2), scale: [{ keyword: 'Foi', delta: D(0, 3) }] }, 'Plus un murmure. Plus une idée.'),
    right: opt('Brûler la liste', { delta: D(0, -7, 6, 0), scale: [{ keyword: 'Foi', delta: D(0, -3) }] }, 'Ils en ont une copie. Avec votre nom, cette fois.'),
    art: { motif: 'flame', hue: 40 },
  }),
  card({
    id: 'r_missions', title: 'Les Missions', kind: 'institution', era: 3, kw: ['Foi', 'Commerce'],
    text: 'Des missionnaires partent convertir le bout du monde. Ils reviennent avec des cartes et des épices.',
    left: opt('Bénir le départ', { delta: D(4, -5, 0, 8), rival: -5, scale: [{ keyword: 'Foi', delta: D(0, 0, 0, 2) }] }, 'Des temples partout. Des rancunes aussi.'),
    right: opt('Chacun chez soi', { delta: D(0, 5, 3, -6), rival: 5 }, 'Les voisins ont envoyé leurs missionnaires. Chez vous.'),
    art: { motif: 'wave', hue: 40 },
  }),
  card({
    id: 'r_eglise_orbite', title: 'L’Église de l’Orbite', kind: 'institution', era: 4, kw: ['Foi', 'Science'],
    text: 'Un culte prie les satellites. C’est ridicule. Ils sont des millions.',
    left: opt('Reconnaître le culte', { delta: D(0, 8, -3, 6), scale: [{ keyword: 'Foi', delta: D(0, 2, 0, 2) }] }, 'Ils prient en regardant le ciel. Ils votent aussi.'),
    right: opt('Couper leur antenne', { delta: D(0, -8, 6, 0), scale: [{ keyword: 'Foi', delta: D(0, -3) }] }, 'Silence radio. Ils prient plus fort.'),
    art: { motif: 'ring', hue: 40 },
  }),

  // ------------------------------------------------------------------ GUERRE
  card({
    id: 'r_caserne', title: 'La Caserne', kind: 'institution', era: 0, kw: ['Guerre'],
    text: 'Les guerriers veulent s’entraîner à plein temps. Quelqu’un d’autre fera les champs.',
    left: opt('Des soldats de métier', { delta: D(-8, 10), scale: [{ keyword: 'Guerre', delta: D(0, 2) }] }, 'Ils ne savent plus semer. Ils savent très bien frapper.'),
    right: opt('Tout le monde aux champs', { delta: D(8, -7), scale: [{ keyword: 'Guerre', delta: D(0, -2) }] }, 'Ils sèment. Ils râlent. Ils sèment.'),
    art: { motif: 'shield', hue: 0 },
  }),
  card({
    id: 'r_phalange', title: 'La Phalange', kind: 'tech', era: 1, kw: ['Guerre'],
    text: 'Des lances longues, des boucliers serrés. Ça marche si personne ne recule.',
    left: opt('Entraîner tout le monde', { delta: D(-5, 11, 0, -5), scale: [{ keyword: 'Guerre', delta: D(0, 2) }], rival: -3 }, 'Un mur de bronze. Il avance.'),
    right: opt('Les volontaires', { delta: D(4, -5, 0, 5), scale: [{ keyword: 'Guerre', delta: D(0, -2) }] }, 'Trente volontaires. Un beau petit mur.'),
    art: { motif: 'shield', hue: 0 },
  }),
  card({
    id: 'r_chevaliers', title: 'Les Chevaliers', kind: 'institution', era: 2, kw: ['Guerre', 'Culture'],
    text: 'Les chevaliers veulent des terres, des titres et le droit de ne rien faire d’autre.',
    left: opt('Des fiefs', { delta: D(-6, 10, 0, -6), scale: [{ keyword: 'Guerre', delta: D(0, 2) }] }, 'Loyaux. Lourds. Impossibles à nourrir.'),
    right: opt('Des mercenaires', { delta: D(0, 5, 0, -10), add: [{ card: 'q_mercenaires', delay: 8 }] }, 'Ils se battent pour vous. Jusqu’à ce qu’on paie mieux.'),
    art: { motif: 'crown', hue: 0 },
  }),
  card({
    id: 'r_artillerie', title: 'L’Artillerie', kind: 'tech', era: 3, kw: ['Guerre', 'Science'],
    text: 'Des canons qui portent à dix kilomètres. Personne ne sait sur quoi.',
    left: opt('Une batterie par ville', { delta: D(-4, 12, 2, -11), scale: [{ keyword: 'Guerre', delta: D(0, 3) }], rival: -5 }, 'Le silence des voisins est assourdissant.'),
    right: opt('Fondre les canons', { delta: D(0, -8, 0, 9), scale: [{ keyword: 'Guerre', delta: D(0, -2) }], rival: 4 }, 'Des cloches. Très lourdes. Les généraux pleurent.'),
    art: { motif: 'gear', hue: 0 },
  }),
  card({
    id: 'r_drones', title: 'Les Drones', kind: 'tech', era: 4, kw: ['Guerre', 'Science'],
    text: 'Des machines qui font la guerre sans soldats. Les soldats trouvent ça insultant.',
    left: opt('Tout automatiser', { delta: D(0, 12, 5, -10), scale: [{ keyword: 'Guerre', delta: D(0, 2) }], flags: ['drones'] }, 'Personne ne meurt. De votre côté.'),
    right: opt('Garder les soldats', { delta: D(0, -6, -3, 7), scale: [{ keyword: 'Guerre', delta: D(0, -2) }] }, 'Les soldats sont contents. Ils sont aussi plus lents.'),
    art: { motif: 'comet', hue: 0 },
  }),
  card({
    id: 'r_general', title: 'La Générale', kind: 'character', era: 1, kw: ['Guerre'],
    text: 'Une générale ne perd jamais. Elle veut une guerre pour le prouver.',
    left: opt('Une petite guerre', { delta: D(-6, 9, 0, 6), rival: -12, scale: [{ keyword: 'Guerre', delta: D(0, 2, 0, 2) }] }, 'Elle a gagné. Elle en veut une autre.'),
    right: opt('La paix, pour l’instant', { delta: D(4, -8, 2, -4), rival: 5, scale: [{ keyword: 'Guerre', delta: D(0, -2) }] }, 'Elle attend. Elle s’entraîne. Elle attend.'),
    art: { motif: 'crown', hue: 0 },
  }),

  // ------------------------------------------------------------------ COMMERCE
  card({
    id: 'r_marche', title: 'Le Marché', kind: 'institution', era: 0, kw: ['Commerce'],
    text: 'Un marché chaque semaine. Du monde, du bruit, des mains dans les poches.',
    left: opt('Laisser faire', { delta: D(4, -5, 0, 9), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 3) }] }, 'Le marché prospère. Les voleurs aussi.'),
    right: opt('Taxer chaque étal', { delta: D(-5, 4, 0, 4), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, -2) }] }, 'Moins d’étals. Plus d’impôts. Compte rond.'),
    art: { motif: 'coin', hue: 50 },
  }),
  card({
    id: 'r_monnaie', title: 'La Monnaie', kind: 'tech', era: 1, kw: ['Commerce'],
    text: 'Des pièces avec votre tête dessus. Le trésorier propose d’en frapper beaucoup. Vraiment beaucoup.',
    left: opt('Beaucoup', { delta: D(0, 0, -4, 12), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 3) }], add: [{ card: 'q_inflation', delay: 6 }] }, 'Tout le monde est riche. Le pain coûte trois pièces.'),
    right: opt('Avec parcimonie', { delta: D(3, 3, 3, -5), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, -2) }] }, 'Solide. Rare. Les marchands grognent.'),
    art: { motif: 'coin', hue: 50 },
  }),
  card({
    id: 'r_guilde', title: 'La Guilde', kind: 'institution', era: 2, kw: ['Commerce'],
    text: 'Les artisans veulent une guilde. Prix fixes, qualité garantie, concurrence interdite.',
    left: opt('Leur charte', { delta: D(0, 4, -4, 9), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 3) }] }, 'Beaux objets. Beaux prix. Beaux monopoles.'),
    right: opt('Libre concurrence', { delta: D(5, -6, 4, -3), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, -2) }] }, 'Pas cher. Fragile. Beaucoup de procès.'),
    art: { motif: 'gear', hue: 50 },
  }),
  card({
    id: 'r_banque', title: 'La Banque', kind: 'institution', era: 3, kw: ['Commerce'],
    text: 'Les banquiers proposent de prêter votre argent. À vous. Avec intérêts.',
    left: opt('Emprunter', { delta: D(5, 5, 0, 10), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 2) }], add: [{ card: 'q_dette', delay: 8 }] }, 'Tout va bien. Une lettre arrivera.'),
    right: opt('Les taxer', { delta: D(0, -5, 0, -7), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, -3) }], flags: ['banques_taxees'] }, 'Ils ont déménagé. Avec les coffres.'),
    art: { motif: 'coin', hue: 50 },
  }),
  card({
    id: 'r_megacorp', title: 'Le Conglomérat', kind: 'institution', era: 4, kw: ['Commerce', 'Science'],
    text: 'Une entreprise possède l’eau, l’air et les écrans. Elle propose un partenariat.',
    left: opt('Partenariat', { delta: D(6, -6, 4, 11), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 3) }], flags: ['megacorp'] }, 'Tout fonctionne. Rien ne vous appartient.'),
    right: opt('La démanteler', { delta: D(-6, 6, 0, -9), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, -3) }] }, 'Douze petites entreprises. Elles se parlent encore.'),
    art: { motif: 'tower', hue: 50 },
  }),
  card({
    id: 'r_caravane', title: 'La Caravane', kind: 'institution', era: 0, kw: ['Commerce', 'Nature'],
    text: 'Des caravanes traversent vos terres. Elles paient. Elles attirent les bandits.',
    left: opt('Les escorter', { delta: D(0, -7, 0, 10), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 2) }], rival: 4 }, 'Les caravanes grossissent. Les escortes aussi.'),
    right: opt('Les détrousser', { delta: D(6, 4, 0, 6), rival: -10, add: [{ card: 'q_bandits', delay: 6 }] }, 'Riche et seul. Elles ne reviendront pas.'),
    art: { motif: 'sun', hue: 50 },
  }),

  // ------------------------------------------------------------------ SCIENCE
  card({
    id: 'r_ecriture', title: 'L’Écriture', kind: 'tech', era: 0, kw: ['Science'],
    text: 'Des signes qui parlent. Les scribes veulent tout noter. Les chefs n’aiment pas les traces.',
    left: opt('Tout noter', { delta: D(0, -4, 10, -4), scale: [{ keyword: 'Science', delta: D(0, 0, 2) }] }, 'On sait ce qui s’est passé. On ne peut plus le nier.'),
    right: opt('Noter les comptes', { delta: D(0, 3, -4, 7), scale: [{ keyword: 'Science', delta: D(0, 0, -2) }] }, 'Des chiffres. Rien que des chiffres.'),
    art: { motif: 'scroll', hue: 200 },
  }),
  card({
    id: 'r_bibliotheque', title: 'La Bibliothèque', kind: 'institution', era: 1, kw: ['Science', 'Culture'],
    text: 'Tous les livres du monde sous un même toit. Un toit en bois.',
    left: opt('Acheter les livres', { delta: D(0, 0, 11, -10), scale: [{ keyword: 'Science', delta: D(0, 0, 3) }] }, 'Les savants affluent. Les bougies aussi.'),
    right: opt('Les copier en douce', { delta: D(0, -3, 6, 2), rival: -8, scale: [{ keyword: 'Science', delta: D(0, 0, 1) }] }, 'Les voisins ont remarqué. Ils comptent leurs livres.'),
    art: { motif: 'scroll', hue: 200 },
  }),
  card({
    id: 'r_universite', title: 'L’Université', kind: 'institution', era: 2, kw: ['Science'],
    text: 'Des étudiants, des maîtres, des tavernes. Ils veulent des privilèges et des bancs.',
    left: opt('Des privilèges', { delta: D(-4, -5, 12, -4), scale: [{ keyword: 'Science', delta: D(0, 0, 2) }] }, 'Ils lisent. Ils boivent. Ils contestent.'),
    right: opt('Des bancs, c’est tout', { delta: D(4, 4, -6, 2), scale: [{ keyword: 'Science', delta: D(0, 0, -2) }] }, 'Ils sont partis étudier ailleurs. Ailleurs est ravi.'),
    art: { motif: 'arch', hue: 200 },
  }),
  card({
    id: 'r_imprimerie', title: 'L’Imprimerie', kind: 'tech', era: 2, kw: ['Science', 'Culture'],
    text: 'Une machine copie un livre en une heure. Les copistes pleurent. Les prêtres s’inquiètent.',
    left: opt('Imprimer tout', { delta: D(0, -8, 12, 4), scale: [{ keyword: 'Science', delta: D(0, 0, 2) }, { keyword: 'Foi', delta: D(0, -2) }] }, 'Tout le monde lit. Tout le monde a un avis.'),
    right: opt('Imprimer les prières', { delta: D(0, 6, -3, 5), scale: [{ keyword: 'Foi', delta: D(0, 2) }] }, 'Dix mille prières identiques. Ça rassure.'),
    art: { motif: 'scroll', hue: 200 },
  }),
  card({
    id: 'r_laboratoire', title: 'Le Laboratoire', kind: 'institution', era: 3, kw: ['Science'],
    text: 'Des gens en blouse font des choses qui explosent. Ils veulent un budget. Et des blouses.',
    left: opt('Un budget', { delta: D(0, 0, 13, -11), scale: [{ keyword: 'Science', delta: D(0, 0, 3) }] }, 'Ils ont découvert trois choses. Deux sont dangereuses.'),
    right: opt('Des résultats d’abord', { delta: D(3, 4, -7, 4), scale: [{ keyword: 'Science', delta: D(0, 0, -2) }] }, 'Ils ont trouvé un emploi ailleurs. Ça a explosé ailleurs.'),
    art: { motif: 'spiral', hue: 200 },
  }),
  card({
    id: 'r_ia_conseil', title: 'L’Oracle de silicium', kind: 'tech', era: 4, kw: ['Science'],
    text: 'Une machine prédit les récoltes, les guerres et vos erreurs. Surtout vos erreurs.',
    left: opt('L’écouter', { delta: D(5, 0, 11, -8), scale: [{ keyword: 'Science', delta: D(0, 0, 3) }] }, 'Elle avait raison. Elle vous l’a rappelé.'),
    right: opt('La débrancher', { delta: D(0, 6, -9, 4), scale: [{ keyword: 'Science', delta: D(0, 0, -2) }] }, 'Silence. Vous décidez seul. Comme avant.'),
    art: { motif: 'eye', hue: 200 },
  }),

  // ------------------------------------------------------------------ CULTURE
  card({
    id: 'r_bardes', title: 'Les Conteurs', kind: 'character', era: 0, kw: ['Culture'],
    text: 'Les conteurs racontent vos exploits. Ils en inventent la moitié. La bonne moitié.',
    left: opt('Les nourrir', { delta: D(-7, 7, 2, 0), scale: [{ keyword: 'Culture', delta: D(0, 2) }] }, 'Votre légende grandit. Votre ventre, non.'),
    right: opt('Qu’ils chantent ailleurs', { delta: D(5, -6, 0, 3), rival: 3, scale: [{ keyword: 'Culture', delta: D(0, -2) }] }, 'Ils chantent chez les voisins. Vos exploits, en moins bien.'),
    art: { motif: 'mask', hue: 300 },
  }),
  card({
    id: 'r_theatre', title: 'Le Théâtre', kind: 'institution', era: 1, kw: ['Culture'],
    text: 'Les auteurs se moquent de tout. De vous aussi. Le public adore.',
    left: opt('Laisser jouer', { delta: D(0, -6, 7, 6), scale: [{ keyword: 'Culture', delta: D(0, 0, 2, 1) }] }, 'On rit de vous. On vous aime bien, du coup.'),
    right: opt('Des tragédies seulement', { delta: D(0, 6, -4, -3), scale: [{ keyword: 'Culture', delta: D(0, -2) }] }, 'Tout le monde meurt au cinquième acte. Plus personne ne rit.'),
    art: { motif: 'mask', hue: 300 },
  }),
  card({
    id: 'r_musee', title: 'Le Musée', kind: 'institution', era: 3, kw: ['Culture'],
    text: 'Un musée pour exposer ce que vous avez volé aux autres. Les autres aimeraient le récupérer.',
    left: opt('Exposer', { delta: D(0, 3, 8, 5), rival: -7, scale: [{ keyword: 'Culture', delta: D(0, 0, 2) }] }, 'Les salles sont pleines. Les ambassades, furieuses.'),
    right: opt('Rendre', { delta: D(0, -5, -3, -4), rival: 12, scale: [{ keyword: 'Culture', delta: D(0, 0, -2) }] }, 'Les salles sont vides. Les voisins envoient des fleurs.'),
    art: { motif: 'arch', hue: 300 },
  }),
  card({
    id: 'r_cinema', title: 'Les Studios', kind: 'institution', era: 3, kw: ['Culture', 'Commerce'],
    text: 'Des films où vous êtes toujours le héros. Le monde entier les regarde. Ils coûtent cher.',
    left: opt('Produire', { delta: D(0, 5, -3, -9), rival: 8, scale: [{ keyword: 'Culture', delta: D(0, 2, 0, 3) }] }, 'Les voisins vous adorent. Ils ne savent pas pourquoi.'),
    right: opt('Des documentaires', { delta: D(0, -6, 7, 3), scale: [{ keyword: 'Culture', delta: D(0, -2) }] }, 'Instructif. Personne ne les regarde.'),
    art: { motif: 'star', hue: 300 },
  }),
  card({
    id: 'r_jeux', title: 'L’Arène', kind: 'institution', era: 1, kw: ['Culture', 'Guerre'],
    text: 'Du pain et des jeux. Les jeux sont prêts. Le pain, moins.',
    left: opt('Des jeux', { delta: D(-7, 8, -3, 4), scale: [{ keyword: 'Culture', delta: D(0, 2) }] }, 'La foule hurle de joie. Elle a faim, mais elle hurle.'),
    right: opt('Du pain', { delta: D(8, -7, 0, -4), scale: [{ keyword: 'Culture', delta: D(0, -2) }] }, 'Rassasiés. Ils s’ennuient. Ils vous regardent.'),
    art: { motif: 'ring', hue: 300 },
  }),
  card({
    id: 'r_poete', title: 'La Poétesse', kind: 'character', era: 2, kw: ['Culture'],
    text: 'Une poétesse écrit votre épopée. Elle veut la vérité. Toute la vérité.',
    left: opt('Toute la vérité', { delta: D(0, -5, 9, 0), scale: [{ keyword: 'Culture', delta: D(0, 0, 2) }], rival: 5 }, 'Le poème est sublime. Il est aussi très précis.'),
    right: opt('Une version améliorée', { delta: D(0, 7, -4, -3), scale: [{ keyword: 'Culture', delta: D(0, 2) }] }, 'Vous êtes un héros. Elle a signé d’un autre nom.'),
    art: { motif: 'scroll', hue: 300 },
  }),

  // ------------------------------------------------------------------ NATURE
  card({
    id: 'r_irrigation', title: 'L’Irrigation', kind: 'tech', era: 0, kw: ['Nature'],
    text: 'Des canaux pour arroser les champs. Il faut creuser. Les soldats ont des bras.',
    left: opt('Les soldats creusent', { delta: D(11, -8, 0, 0), scale: [{ keyword: 'Nature', delta: D(2) }] }, 'Les champs verdissent. Les lances rouillent.'),
    right: opt('Les paysans creusent', { delta: D(4, 0, 0, -8), scale: [{ keyword: 'Nature', delta: D(2) }] }, 'Ça avance. Lentement. On les paie.'),
    art: { motif: 'wave', hue: 120 },
  }),
  card({
    id: 'r_foret', title: 'La Forêt', kind: 'institution', era: 0, kw: ['Nature'],
    text: 'La forêt est pleine de bois, de gibier et de choses qui mangent les gens.',
    left: opt('Tout couper', { delta: D(0, 0, 0, 11), scale: [{ keyword: 'Nature', delta: D(-3) }], add: [{ card: 'q_deforestation', delay: 8 }] }, 'Du bois pour cent ans. Enfin, dix.'),
    right: opt('La protéger', { delta: D(6, -4, 3, -6), scale: [{ keyword: 'Nature', delta: D(2, 0, 1) }] }, 'La forêt grandit. Les choses dedans aussi.'),
    art: { motif: 'leaf', hue: 120 },
  }),
  card({
    id: 'r_vergers', title: 'Les Vergers', kind: 'institution', era: 1, kw: ['Nature', 'Commerce'],
    text: 'Des vergers à perte de vue. Il faut dix ans avant le premier fruit.',
    left: opt('Planter', { delta: D(-4, 0, 2, -8), scale: [{ keyword: 'Nature', delta: D(3) }], add: [{ card: 'q_vergers', delay: 10 }] }, 'Dix ans. Les arbres prennent leur temps.'),
    right: opt('Du blé, tout de suite', { delta: D(8, 0, 0, 3), scale: [{ keyword: 'Nature', delta: D(-2) }] }, 'Du blé. Encore du blé. Le sol fatigue.'),
    art: { motif: 'leaf', hue: 120 },
  }),
  card({
    id: 'r_parc', title: 'Le Parc national', kind: 'institution', era: 3, kw: ['Nature', 'Culture'],
    text: 'Une vallée entière interdite aux usines. Les industriels la trouvent magnifique. Pleine de charbon.',
    left: opt('La protéger', { delta: D(6, 0, 4, -10), scale: [{ keyword: 'Nature', delta: D(3) }] }, 'Les touristes affluent. Les industriels ruminent.'),
    right: opt('Le charbon d’abord', { delta: D(-7, 0, 0, 12), scale: [{ keyword: 'Nature', delta: D(-3) }] }, 'La vallée est noire. Les coffres, pleins.'),
    art: { motif: 'mountain', hue: 120 },
  }),
  card({
    id: 'r_serres', title: 'Les Serres verticales', kind: 'tech', era: 4, kw: ['Nature', 'Science'],
    text: 'Des tours de salades. Sans terre, sans saison, sans goût.',
    left: opt('Construire', { delta: D(12, 0, 4, -11), scale: [{ keyword: 'Nature', delta: D(2) }] }, 'Plus jamais faim. Plus jamais de tomates qui ont du goût.'),
    right: opt('Des vraies fermes', { delta: D(-5, 0, -3, 7), scale: [{ keyword: 'Nature', delta: D(3) }] }, 'Du goût. Pas assez. Les voisins ont des tours.'),
    art: { motif: 'tower', hue: 120 },
  }),
  card({
    id: 'r_herboriste', title: 'L’Herboriste', kind: 'character', era: 0, kw: ['Nature', 'Science'],
    text: 'Une herboriste soigne avec des plantes. Elle veut un jardin. Les prêtres veulent sa tête.',
    left: opt('Un jardin', { delta: D(5, 0, 6, -5), scale: [{ keyword: 'Nature', delta: D(2, 0, 1) }, { keyword: 'Foi', delta: D(0, -2) }] }, 'Elle guérit. Les prêtres l’appellent sorcière.'),
    right: opt('Sa tête', { delta: D(-4, 6, -6, 0), scale: [{ keyword: 'Foi', delta: D(0, 3) }] }, 'Les prêtres sont contents. Les malades, moins.'),
    art: { motif: 'leaf', hue: 120 },
  }),

  // ------------------------------------------------------------------ PERSONNAGES TRANSVERSAUX
  card({
    id: 'r_espion', title: 'La Maîtresse des espions', kind: 'character', era: 1, kw: ['Guerre', 'Science'],
    text: 'Elle sait tout sur tout le monde. Elle propose de savoir aussi pour vous.',
    left: opt('L’engager', { delta: D(0, 6, 6, -8), rival: -6 }, 'Les secrets des voisins. Et les vôtres, quelque part.'),
    right: opt('Trop dangereuse', { delta: D(0, -5, -3, 5), rival: 4 }, 'Elle travaille pour les voisins, maintenant.'),
    art: { motif: 'eye', hue: 270 },
  }),
  card({
    id: 'r_architecte', title: 'L’Architecte', kind: 'character', era: 1, kw: ['Culture', 'Science'],
    text: 'Il a des plans. Immenses. Il ne parle jamais du prix.',
    left: opt('Bâtir', { delta: D(-5, 4, 6, -11), scale: [{ keyword: 'Culture', delta: D(0, 2) }], flags: ['grands_travaux'] }, 'Magnifique. Les ouvriers ont des courbatures et de la fierté.'),
    right: opt('Des plans plus petits', { delta: D(4, -4, -3, 6) }, 'Fonctionnel. Il a démissionné.'),
    art: { motif: 'arch', hue: 270 },
  }),
  card({
    id: 'r_heritier', title: 'L’Héritier', kind: 'character', era: 2, kw: ['Culture', 'Guerre'],
    text: 'Votre héritier veut le pouvoir. Maintenant. Il a lu des livres et il a une armée d’amis.',
    left: opt('Lui confier l’armée', { delta: D(0, 9, -3, -5), add: [{ card: 'q_heritier', delay: 7 }] }, 'Il commande. Il regarde votre siège. Il attend.'),
    right: opt('Le faire voyager', { delta: D(3, -7, 6, -3), rival: 6 }, 'Il écrit des lettres. Il apprend des choses. Trop.'),
    art: { motif: 'crown', hue: 270 },
  }),
];
