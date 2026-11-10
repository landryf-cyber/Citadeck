import { card, opt, D } from './dsl';

/** Cartes de départ : persistantes, ce sont les tensions de base entre les quatre jauges. */
export const starters = [
  card({
    id: 's_recolte', title: 'La Récolte', kind: 'starter', kw: ['Nature'],
    text: 'Belle récolte. Les voisins en ont entendu parler.',
    left: opt('Vendre le surplus', D(-9, 0, 0, 10), 'Les greniers sonnent creux. Les coffres, non.'),
    right: opt('Bâtir des greniers', D(10, 0, 0, -7), 'Plein à craquer. Les rats applaudissent.'),
    variants: {
      1: { title: 'Les Moissons', text: 'Le blé déborde des silos. Les marchands grecs rôdent, la bourse ouverte.', left: 'Vendre aux marchands', right: 'Agrandir les silos', replyLeft: 'Des amphores d’argent. Des silos qui résonnent.', replyRight: 'On tiendra trois hivers. Les marchands boudent.' },
      2: { title: 'L’Année grasse', text: 'Année grasse. Le bailli veut vendre, l’intendant veut stocker. Ils se détestent.', left: 'Écouter le bailli', right: 'Écouter l’intendant', replyLeft: 'Les coffres se remplissent. L’intendant note tout.', replyRight: 'Les granges sont pleines. Le bailli fait la tête.' },
      3: { title: 'Les Excédents', text: 'Les machines agricoles produisent trop. Le cours du blé s’effondre. Trop de pain, c’est un problème, paraît-il.', left: 'Exporter', right: 'Stocker', replyLeft: 'Vos navires nourrissent le monde. Vos villes, moins.', replyRight: 'Des montagnes de grain. Des rats comblés.' },
      4: { title: 'Les Stocks', text: 'Les fermes automatiques tournent à plein. Les algorithmes hésitent : vendre ou garder.', left: 'Vendre', right: 'Garder', replyLeft: 'Le marché applaudit. Les frigos sont vides.', replyRight: 'Dix ans de réserves. Dont neuf périmées.' },
    },
    art: { motif: 'wheat' },
  }),
  card({
    id: 's_guetteurs', title: 'Les Guetteurs', kind: 'starter', kw: ['Guerre'],
    text: 'Les guetteurs ont faim. Les champs manquent de bras.',
    left: opt('Aux champs', D(9, -8), 'Personne ne regarde l’horizon. L’horizon regarde.'),
    right: opt('Aux remparts', D(-7, 9), 'Ils veillent. Le ventre vide.'),
    variants: {
      1: { title: 'La Garnison', text: 'Les hoplites réclament du pain. Les moissons réclament des hoplites.', left: 'Aux moissons', right: 'Aux murailles', replyLeft: 'Des soldats avec des faux. Ça moissonne droit.', replyRight: 'Les murs sont gardés. Le blé pourrit sur pied.' },
      2: { title: 'Le Guet', text: 'Le guet veut des hommes. Les seigneurs veulent leurs serfs aux champs.', left: 'Aux champs', right: 'Au guet', replyLeft: 'Les sillons sont droits. Les créneaux, vides.', replyRight: 'On veille. On jeûne.' },
      3: { title: 'La Conscription', text: 'L’armée veut deux ans de la vie de chaque jeune homme. Les fermes aussi.', left: 'Les fermes d’abord', right: 'Le service d’abord', replyLeft: 'Ils labourent. L’état-major s’étrangle.', replyRight: 'Ils marchent au pas. Les champs attendent.' },
      4: { title: 'Les Réservistes', text: 'Les drones surveillent les frontières. Il faut des gens pour surveiller les drones. Ou pour cueillir.', left: 'Aux serres', right: 'Aux écrans', replyLeft: 'Les serres tournent. Les écrans clignotent seuls.', replyRight: 'Tout est surveillé. Rien n’est cueilli.' },
    },
    art: { motif: 'shield' },
  }),
  card({
    id: 's_sage', title: 'Le Sage', kind: 'starter', kw: ['Science'],
    text: 'Un vieillard prétend savoir des choses. Il mange beaucoup.',
    left: opt('L’écouter', D(-6, 0, 10), 'Il savait des choses. Il mange toujours.'),
    right: opt('Le mettre au travail', D(0, 0, -8, 7), 'Il creuse. Il grommelle. Il creuse.'),
    variants: {
      1: { title: 'Le Précepteur', text: 'Un précepteur grec enseigne la géométrie aux enfants. Il coûte le prix d’un attelage.', left: 'Le garder', right: 'Louer ses services', replyLeft: 'Les enfants tracent des cercles. Partout.', replyRight: 'Il calcule les impôts. Très bien. Trop bien.' },
      2: { title: 'L’Érudit', text: 'Un érudit traduit des livres que personne ne lit. Il brûle beaucoup de chandelles.', left: 'Le laisser traduire', right: 'Lui confier les comptes', replyLeft: 'Aristote, en latin. Ça servira. Un jour.', replyRight: 'Les comptes sont justes. Aristote attendra.' },
      3: { title: 'L’Inventeur', text: 'Un inventeur veut un atelier. Il promet une machine. Il ne sait pas encore laquelle.', left: 'Un atelier', right: 'Un emploi à l’usine', replyLeft: 'Ça fume, ça siffle. Ça ne sert à rien. Pour l’instant.', replyRight: 'Il serre des boulons. Il soupire en mesure.' },
      4: { title: 'La Chercheuse', text: 'Une chercheuse demande dix ans et aucun résultat garanti. Le privé lui offre le triple.', left: 'Dix ans', right: 'La louer au privé', replyLeft: 'Elle cherche. C’est tout ce qu’on sait.', replyRight: 'Elle optimise des publicités. Brillamment.' },
    },
    art: { motif: 'eye' },
  }),
  card({
    id: 's_solde', title: 'La Solde', kind: 'starter',
    text: 'Les soldats veulent leur paie. Les coffres veulent la paix.',
    left: opt('Payer', D(0, 8, 0, -10), 'Payés. Loyaux jusqu’à la prochaine fois.'),
    right: opt('Promettre', { delta: D(0, -9, 0, 3), add: [{ card: 'q_solde_impayee', delay: 7 }] }, 'Ils ont noté. Ils savent compter.'),
    variants: {
      1: { title: 'La Solde des légions', text: 'Les légions veulent leur solde. En argent, pas en promesses de terres.', left: 'Payer', right: 'Promettre des terres', replyLeft: 'Payées. Loyales jusqu’aux prochaines ides.', replyRight: 'Ils ont noté. Sur du marbre.' },
      2: { title: 'Les Gages', text: 'Les hommes d’armes réclament leurs gages. Le trésorier réclame un miracle.', left: 'Payer', right: 'Promettre', replyLeft: 'Payés. Ils boivent à votre santé.', replyRight: 'Ils ont noté. Ils savent compter, même gantés.' },
      3: { title: 'Les Pensions', text: 'Les régiments veulent leur solde et des pensions. Le budget veut des chemins de fer.', left: 'Payer', right: 'Promettre', replyLeft: 'Payés. Le chemin de fer attendra.', replyRight: 'Ils ont noté. En trois exemplaires.' },
      4: { title: 'Le Budget de la défense', text: 'L’état-major veut son budget. Le ministre des finances veut des vacances.', left: 'Voter le budget', right: 'Reporter', replyLeft: 'Voté. Les généraux sourient. C’est inquiétant.', replyRight: 'Reporté. Ils ont de la mémoire. Et des satellites.' },
    },
    art: { motif: 'coin' },
  }),
  card({
    id: 's_fete', title: 'La Fête', kind: 'starter', kw: ['Culture'],
    text: 'Le peuple réclame une fête. Les scribes réclament des bougies.',
    left: opt('Une fête', D(-7, 6, 0, -5), 'Ils dansent. Demain, ils auront faim et mal au crâne.'),
    right: opt('Des bougies', D(0, -5, 9, -4), 'Les scribes veillent. Le peuple boude dans le noir.'),
    variants: {
      1: { title: 'Les Jeux du peuple', text: 'Le peuple veut des jeux. Les scribes veulent du papyrus. Le papyrus coûte moins cher qu’un lion.', left: 'Des jeux', right: 'Du papyrus', replyLeft: 'La foule hurle de joie. Le lion aussi.', replyRight: 'Les scribes écrivent. Le peuple grogne, illettré.' },
      2: { title: 'Le Carnaval', text: 'Le peuple veut son carnaval. L’université veut des chandelles et du silence.', left: 'Le carnaval', right: 'Les chandelles', replyLeft: 'Trois jours de masques. Neuf mois plus tard, des baptêmes.', replyRight: 'On étudie. Dehors, on s’ennuie fort.' },
      3: { title: 'La Fête nationale', text: 'Le peuple veut des feux d’artifice. Les écoles veulent des livres. C’est la même poudre, dit le ministre.', left: 'Les feux', right: 'Les livres', replyLeft: 'Oh ! Ah ! Et plus un sou.', replyRight: 'Ils lisent. Sans feu d’artifice. Ils lisent Zola.' },
      4: { title: 'Le Festival', text: 'Les villes veulent un festival mondial. Les laboratoires veulent le même budget.', left: 'Le festival', right: 'Les laboratoires', replyLeft: 'Dix millions de gens chantent faux. C’est beau.', replyRight: 'Une publication. Trois lecteurs. Ravis.' },
    },
    art: { motif: 'flame' },
  }),
  card({
    id: 's_etranger', title: 'L’Étranger', kind: 'starter', kw: ['Commerce'],
    text: 'Un inconnu parle une langue bizarre. Il a l’air de savoir des choses.',
    left: opt('L’accueillir', { delta: D(-4, -5, 9), rival: 6 }, 'Il parle. Beaucoup. Certains notent.'),
    right: opt('Le chasser', { delta: D(0, 6, -7), rival: -6 }, 'Il est parti. Vers chez eux, visiblement.'),
    variants: {
      1: { title: 'Le Voyageur', text: 'Un voyageur d’Orient décrit des machines, des épices et des dieux inconnus. Les prêtres froncent.', left: 'L’écouter', right: 'Le reconduire', replyLeft: 'Il dessine un moulin. Les prêtres, un bûcher.', replyRight: 'Reparti. Avec ses plans. Vers chez eux.' },
      2: { title: 'Le Marchand lointain', text: 'Un marchand apporte des chiffres étranges. Un rond qui ne vaut rien. Très pratique, dit-il.', left: 'L’accueillir', right: 'Le chasser', replyLeft: 'Le zéro. Vos comptables pleurent de joie.', replyRight: 'Il a vendu son zéro aux voisins.' },
      3: { title: 'L’Ingénieur étranger', text: 'Un ingénieur étranger propose ses brevets. Les généraux flairent l’espion.', left: 'Acheter ses brevets', right: 'L’expulser', replyLeft: 'Ses machines marchent. Ses lettres partent loin.', replyRight: 'Expulsé. Les voisins ont ses brevets.' },
      4: { title: 'La Transfuge', text: 'Une physicienne des voisins demande l’asile. Elle sait des choses. Les voisins savent qu’elle sait.', left: 'Accorder l’asile', right: 'La renvoyer', replyLeft: 'Elle parle. Les voisins écoutent aussi, de loin.', replyRight: 'Renvoyée. On ne saura jamais quoi.' },
    },
    art: { motif: 'mask' },
  }),
];
