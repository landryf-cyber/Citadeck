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
