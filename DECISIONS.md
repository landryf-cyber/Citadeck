# DECISIONS — Citadeck

Décisions prises en autonomie, avec leur raison. Les décisions de la première version (V1) sont dans
l'historique git (commit `c2d51ea` et avant) ; la V1 a été retirée de l'arbre une fois la V2 jouable.

## V2

1. **Mécanique signature : la mémoire des familles.** Chaque décision importante crée un souvenir qui garde
   la phrase exacte et sa date. Les familles la citent plus tard (cartes de famille, procès, trahisons,
   revenants). Phrase : « Les familles de votre cité se souviennent de tout : humiliez un chasseur à l'âge de
   pierre, et ses descendants mènent la grève générale dix mille ans plus tard. » Ni Reigns, ni Slay the Spire,
   ni Civilization ne citent au joueur ses propres décisions.
2. **Les jauges qui tuent à 0 et à 100 sont supprimées.** Elles forçaient la prudence (accumuler rapprochait de
   la mort) et rendaient le fil rouge impossible (E1, E3). La vie de la cité, ce sont ses quartiers ; les
   ressources se dépensent.
3. **Le coût est affiché, le reste est dans le texte.** Une option montre son coût, ses exigences, les familles
   concernées (sans le sens), un sablier si une suite est programmée, un seuil annoncé, la chance d'un pari.
   Les gains et les loyautés ne sont pas affichés. Mesure : un joueur qui ne lit que les indicateurs survit
   0 % du temps, un lecteur 85 %.
4. **Le glissement gauche/droite disparaît** au profit d'options touchées (deux à quatre) : le jeu a des
   dilemmes à trois voies, des routes, des avocats, des paris. Touches 1 à 4 au clavier.
5. **La gloire se paie en entretien, pas en crises impossibles.** Chaque merveille coûte 2 Vivres par ère
   (annoncé au présage et au bilan) et rend les crises 15 % plus dures. Une première version faisait payer
   40 % de crise par merveille : les joueurs l'ont vécue comme une punition de la réussite (E9).
6. **Le dessein n'est accompli qu'avec la cinquième merveille.** Finir l'ère V sans elle, c'est « survivre ».
   La fin nomme donc honnêtement ce qui a été atteint.
7. **Le testament lègue quelque chose.** À la fin, trois derniers mots possibles, générés depuis la partie
   (une famille fidèle, la leçon de la chute, le dessein) ; chacun donne un héritage concret à la civilisation
   suivante (loyauté de départ ou réserves), doublé pour l'origine « Les Héritiers ». Le choix de fin de partie
   pèse ainsi sur la partie d'après.
8. **Les civilisations victorieuses laissent aussi des ruines** (« partie pour les étoiles… »). Toute partie
   laisse une trace visible dans la suivante : ruines sur la colline, stèle citée, revenants qui réclament le
   grief de la famille la plus maltraitée.
9. **Noms de familles au pluriel à toutes les ères** (« les Ourkonautes », « les Sélestes », « les TrocCorp »)
   : les textes accordent au pluriel ; des noms collectifs au singulier (« l'Église de Sel ») cassaient la
   grammaire dans des dizaines de phrases.
10. **Jamais de blocage** : si aucune option n'est jouable faute de moyens, une issue de secours apparaît
    (« Encaisser » pendant une crise, avec la perte annoncée ; « Ne rien faire » ailleurs).
11. **Performance : tous les effets partout au départ, dégradation seulement sous 30 i/s.** La V1 démarrait
    les téléphones en qualité moyenne et dégradait sous 47 i/s ; les cadences de rafraîchissement d'origine
    sont rétablies, ainsi que le rafraîchissement continu de la cité en crise. Mesuré sans GPU (rendu
    logiciel) sur un profil mobile dpr 2,5 : 44 à 51 i/s avec tous les effets ; avec un CPU ralenti ×2, la
    scène descend d'elle-même d'un palier (25 à 36 i/s), ce qui est le comportement voulu.
12. **Portraits de famille** : un médaillon par famille, dans le même langage visuel que les cartes, dont le
    cadre change à chaque ère, dont l'anneau prend la couleur de l'humeur, et qui porte une cicatrice par
    paire d'affronts. L'orateur d'une carte apparaît ainsi sur son illustration.
13. **La scène raconte la partie** : quartiers (et ruines de ceux qu'on a perdus), maisons des familles qui
    s'agrandissent avec leur loyauté, fument quand elles sont hostiles, restent vides quand elles sont parties ;
    merveilles du dessein sur leur butte ; merveilles de la rivale sur la crête, à sa couleur ; ruines des
    civilisations passées.
14. **Rejouer plutôt que stocker** : la fin rejoue la partie depuis sa graine pour montrer la cité grandir et
    tomber en quelques secondes. Le moteur est déterministe (testé).
15. **Publication hors GitHub** : l'écriture vers GitHub est refusée à cette session (push 403). Le jeu est
    publié en page hébergée (un seul fichier HTML) ; le workflow Pages reste prêt.
16. **Le sacrifice en crise.** Chaque carte de crise à seuil propose de sauver le quartier au prix de −3 de
    loyauté d'une famille (impossible si elle vous en veut déjà). La crise devient un choix sur ce dont les
    familles se souviendront, et il y a toujours au moins deux options jouables.
17. **Trois cartes par saison.** Une partie passe d'environ 70 à environ 60 décisions pour un joueur (25 à
    30 minutes), plus adaptée au téléphone.
18. **Une rivale qui triomphe se voit.** Quand elle achève ses cinq merveilles, une carte « Le Triomphe de
    {rivale} » oblige à réagir (applaudir, saboter, bouder).
19. **Un acquittement ne pardonne rien.** Gagner un procès grâce à un avocat ami clôt l'affaire sans rendre la
    loyauté perdue ; seule la réparation payante (« Plaider coupable ») efface la rancune. Avant, les procès
    gagnés améliorent la loyauté du plaignant : la rancune ne tenait pas (E10).
20. **Les grandes oscillations sont réservées aux actes marquants.** Hors cartes de famille, de crise et
    d'échos, une décision ne déplace une loyauté que d'un cran.
21. **Des crises alternatives tirées par la graine** (le Grand Incendie, le Schisme, le Krach, pour les ères
    II à IV), annoncées au présage comme les autres : une crise reste préparable, mais plus connue d'avance.
22. **La mémoire change les options, pas seulement le texte.** Huit options n'existent que si un souvenir
    précis existe (le clan peint en rouge face à la Horde, la quarantaine sur les navires de Trokos…) ;
    à l'inverse, une option qui suppose un souvenir absent n'est pas proposée.
23. **Des fins qui disent ce qui a été atteint** : « Dessein accompli », « Survie · dessein inachevé »,
    « Survie, dans l'ombre de la rivale » (si elle a achevé ses cinq merveilles), défaite. L'Âge de fer ne se
    débloque qu'avec un dessein accompli.
24. **Une découverte du mot-clé du dessein est toujours proposée** en fin d'ère quand il en reste : le fil
    rouge ne dépend pas du tirage.
25. **Les menaces mordent (tour 3 des juges).** Les sorties de crise offertes par une famille dévouée coûtent une
    ressource et ne servent qu'une fois par partie ; la palissade et l'observatoire parent une perte subie (seuil
    raté, pari perdu, bilan), pas un sacrifice choisi ; une créance refusée se revend à la rivale, et les
    créances montent d'un ton (Créance, Seconde Créance, Saisie) ; à la dernière ère, l'huissier attend
    derrière la porte. Le triomphe de la rivale n'est plus soldé par des applaudissements : elle réclame un
    tribut à chaque fin d'ère. Un sabotage la retarde d'une ère entière. Au Grand Filtre, les merveilles
    réduisent le prix des réponses sans l'annuler.
26. **Une merveille manquée se rattrape.** Le « Chantier oublié » revient à la seconde saison d'une ère
    suivante, plus cher (×1,15 à l'échelle de l'ère) : on peut le payer, mais on arrive plus pauvre au chantier
    de l'ère et à sa crise. Placé d'abord au bilan, juste après la crise, il n'était presque jamais payable.
    Une partie n'est plus morte après deux merveilles manquées ; le présage dit ce qui reste à rattraper.
27. **On montre le sens, pas le montant.** Après deux tours de juges qui jugeaient les choix « à l'aveugle »,
    chaque option affiche le genre de ressource qu'elle rapporte (+Vivres) et le sens de l'effet sur chaque
    famille (▲ ▼, doublé pour un effet appuyé). Les montants, les souvenirs, les suites et les conditions
    restent dans le texte. Le bot qui ne voit que l'interface reste à 2 % de survie contre 81 % pour le lecteur.
28. **Le procès choisit le grief le plus grave** : une dette reniée ou un affront personnel pèse plus qu'un
    blâme de crise, et à gravité égale l'ancien l'emporte ; les plaidoiries changent d'un procès à l'autre.
29. **Les récidives ne se répètent pas.** La deuxième trahison d'une famille la fait passer chez la rivale, la
    troisième la fait faire sécession, chacune avec sa carte ; les créances aussi ont trois cartes.
30. **Une crise alternative à chaque ère** (le Grand Hiver, l'Éveil des machines s'ajoutent), et la partie
    suivante écarte la crise et les variantes de cartes de famille vues à la précédente.
31. **Les merveilles de la postérité coûtent moins cher** : sans les sorties de crise gratuites, ce dessein, qui
    se paie en Trésor (ressource qui s'érode), tombait à 14 % de grandes victoires contre 46 % pour l'empire.
32. **Des visages plutôt que des pictogrammes** : chaque chef de famille a un portrait par ère (fourrure, casque
    à cimier, képi, cornette, écran de BRUME, haut-de-forme), dont l'expression suit l'humeur.
