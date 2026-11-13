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
33. **L'affichage ne ment plus (tour 4 des juges).** Une option à seuil montre ce qu'elle consomme si elle tient ;
    les flèches donnent l'effet exact sur chaque famille, contrecoup du mépris compris (▼3 et non ▼▼) ; les gains
    ont une ampleur (+, ++, +++) mais pas de montant ; un crédit annonce son prix exact et son échéance (trois
    cartes, ou la suivante en crise), avec un compte à rebours sous le Trésor ; une perte plus grosse que la
    réserve coûte un cran de loyauté à la famille de cette ressource. Le bot qui ne lit que l'interface reste à
    1 % de survie contre 90 % pour le lecteur : le texte reste nécessaire.
34. **Payer est un investissement.** À l'assemblage, une option payante sans suite cachée rapporte au moins un
    point de plus que la meilleure option gratuite de sa carte ; l'écart se partage entre l'option payante (plus)
    et la gratuite (moins), pour ne pas gonfler l'économie (tout donner à la payante menait à 99 % de survie).
35. **Des filets qui coûtent.** Palissade, observatoire et vaccin rachètent la première perte subie de l'ère contre
    des réserves (Armée, Savoir, Vivres) : à sec, ils ne protègent rien. Les Peintures de la grotte ne posent plus
    de plancher (qui faisait d'une famille hostile un souffre-douleur gratuit) : elles font remonter d'un cran les
    familles hostiles à chaque bilan.
36. **Les merveilles ne comptent plus pour les mots-clés** (elles rendaient les exigences de Culture, de Science
    et de Guerre automatiques) ; les seuils de Science et de Guerre baissent d'un cran pour compenser.
37. **La famine prévient et se proportionne.** Avant le bilan, si les greniers ne suffiront pas, une carte le dit
    et propose d'acheter du grain au prix fort (2 Trésor par Vivre manquant, un usage au Trésor qui s'accumulait)
    ou de réquisitionner chez les Sel ; un petit manque fait grogner les familles, un grand vide un quartier.
38. **La rivale triomphe dès ses cinq merveilles**, même payées par vos dettes, et réclame alors son tribut ; la
    réponse finale au Grand Filtre (ou au Verdict) coûte aussi aux bâtisseurs.
39. **Moins de moule.** Le chantier ouvre dès la fin de la première saison si la merveille est à portée (bâtir tôt
    rapporte ses revenus plus tôt, mais appauvrit la seconde saison) ; la première trahison n'est pas celle de la
    partie précédente ; l'anti-redite couvre les deux dernières parties ; une découverte n'est proposée que pour
    l'ère où elle sera jouée (plus de philosophe antique en 1810).
40. **Une silhouette de l'ère dans chaque illustration**, des portraits modelés, des étiquettes lisibles sur
    l'image, une réponse sur fond sombre : la beauté était le critère le plus bas des trois derniers juges.
41. **Calibrer pour un humain, pas pour le bot (tour 5).** Au tour 4, les trois juges humains ont perdu ou fini sans
    dessein alors que le bot lecteur survivait à 90 % : il voit les effets exacts. Un profil « distrait » (lecteur
    bruité, un choix sur cinq au jugé) sert désormais de repère pour la difficulté humaine. Les crises sont allégées
    (intensité 1,15 au lieu de 1,4, convoitise 0,10), les gains remontent (1,05).
42. **Plus de bouc émissaire gratuit** : une famille déjà au plus bas n'est plus proposée pour un blâme.
43. **Le crédit ne peut plus être une affaire** : il coûte au moins un quart de plus que le comptant, un seul à la
    fois, jamais prêté par des Troc hostiles ; refuser de payer les met en révolte. Une créance peut se payer en
    nature (Vivres et Armée). La lettre de la rivale ignorée saisit du Trésor plutôt qu'un quartier.
44. **Des fourchettes chiffrées et fixes** (« +3–5 ») plutôt qu'une ampleur relative à l'ère, que les juges ont lue
    comme un mensonge (« +++ » valait 5 puis 14) ; « ? » sur les effets qui dépendent de l'issue ; le présage
    annonce les prix réduits du chantier ; les rachats affichent leur prix exact ; la palissade protège aussi
    des trahisons, des dettes et des crises (seuls les sacrifices choisis dans une affaire de famille lui échappent).
45. **La fin garde un adversaire** : le tribut arrive au début de chaque ère, la dernière comprise, et on peut tenter
    de saboter une merveille rivale pour l'arrêter ; l'épreuve finale est proportionnelle (un quartier à trois
    merveilles, deux en dessous) ; un hommage peut rebâtir un quartier quand la cité n'en a plus que deux.
46. **Quelques cartes graves sans chute** (le travail des enfants, la peste) : l'humour ne doit pas tout recouvrir.
47. **Après le dernier tour de juges** (corrections sans nouveau jugement) : la palissade ne rachète jamais un
    quartier qu'on cède soi-même (elle prélevait d'office l'Armée d'un joueur qui avait choisi de céder) ; une
    option qui ferait passer une famille à −3 l'annonce, et la dernière carte avant le bilan dit ce que coûteront
    les révoltes ; le bilan s'affiche aussi après une disette ; une perte impayable coûte un cran de loyauté même
    dans une branche, et la dette rivale ignorée à sec ou à la dernière ère coûte un quartier ; le chantier annonce
    l'entretien de la merveille, le présage l'usure du bilan et la découverte ; la nouvelle cité ne reprend pas le
    nom de ses ruines.

## Ronde 2
48. **Le tag de retour reste local.** La session n'a le droit de pousser que sur sa branche (le serveur refuse le tag,
    HTTP 403). Le tag `v11-avant-ronde-2` est créé localement sur `4c8dc9c`, commit présent sur la branche distante :
    `git tag v11-avant-ronde-2 4c8dc9c` le recrée chez soi.
49. **« Pour que je puisse tester dans la foulée » et « pas de version intermédiaire ».** Lecture retenue : après les
    points 2, 3, 4, 5 et 7, la page hébergée est republiée (même adresse) pour qu'elle soit testable, sans message ni
    attente ; le travail continue aussitôt sur les points 1 et 6.
50. **Le crédit refait.** Son prix croît avec la somme empruntée (1,4 fois le montant, plus 0,2 par crédit déjà pris,
    plus un point de frais) ; seuls les Troc prêtent (hostiles, absents ou visés par la carte : pas de crédit) ; pas
    de crédit pour payer une dette (cela bouclait) ; « gager un quartier » disparaît : à défaut de payer (en Trésor
    ou en nature), on laisse saisir les réserves, Trésor d'abord, puis Vivres, Armée, Savoir, et un quartier
    seulement à sec ; la saisie n'est proposée qu'à qui ne peut pas payer (sinon elle serait dominée). Le crédit est
    sorti des causes de pertes (il en était la première).
51. **Aucune option dominée, mesuré.** `npm run dominance` rejoue des états réels (trois profils) et cherche une option
    au moins aussi bonne qu'une autre partout (quartiers, réserves, chaque famille, rivale, merveilles), paris compris
    à leur espérance exacte ; les options qui laissent une trace différente (souvenir, suite) ne sont pas comparées.
    Un test l'exige à zéro.
52. **« Ne pas trancher ».** Quand la pauvreté ne laisse qu'une issue coûteuse sur une carte de récit, on peut ne pas
    trancher, pour un Trésor (« les avocats se font payer ») : le choix ne disparaît plus, et l'issue de repli n'est
    jamais dominée ni dominante.
53. **La difficulté se règle sur deux profils humains** : « pressé » (bruit 12, un choix sur douze au jugé, 83 % de
    survie) et « distrait » (bruit 25, un sur cinq, 61 %). Cibles : un joueur attentif survit presque toujours, un
    joueur distrait une fois sur deux ou trois, le gourmand meurt plus tôt que le prudent. Gains à 1,12 ; se cacher du
    Grand Filtre sauve la cité au prix de la confiance des familles.
54. **Seuil des répétitions** : zéro réplique ou texte de carte relu mot pour mot dans une même partie ; au plus 5 % des
    textes d'une partie déjà lus à la précédente (6 % toléré par le test) ; aucun texte dans plus de la moitié des
    parties. Mesuré par `npm run repeats` sur des parties enchaînées (chronique et anti-redite comprises).
55. **Variantes « A‖B‖C »** : la n-ième fois qu'un texte revient (sur la même carte ou une autre), on lit la variante
    suivante ; la graine décale le départ. Écrites en priorité là où la mesure montrait les répétitions : lettres et
    tributs de la rivale, créances, saisies, croissance, disette, merveilles remises ou oubliées, inaugurations des 18
    merveilles, hommages.
56. **Première partie : un seul choix.** Le dessein « Être chantés pour toujours » est présélectionné et marqué
    « Conseillé pour commencer » : c'est le plus indulgent (les Peintures apaisent les familles, le Trésor sert à tout)
    et celui où le lecteur gagne le plus souvent. L'origine vaut « Gens du Feu » sans être montrée ; origine, Héritiers
    et Âge de fer apparaissent après une première partie terminée.
57. **Des origines qui changent la partie, ou rien.** Chacune a une règle et des cartes à elle (Feu : familles
    amicales, réserves maigres, la veillée et le feu sacré ; Fleuve : le limon, +1 Vivres par saison, guerriers
    méfiants, la Crue, le Bac, la Grande Crue ; Héritiers : héritage et rancunes doublés, l'inventaire des ruines).
    L'atout et le handicap affichés sont calculés à partir de ces données, jamais écrits à la main. Un conseil mesuré
    s'y ajoute : Feu « Conseillé », Fleuve « Le plus sûr » (survie la plus haute des profils humains), Héritiers
    « Pour les habitués ».
58. **L'aperçu de l'origine se voit dans la scène** : chaque origine teinte la première ère (feu chaud, fleuve
    bleu-vert, ruines au crépuscule violet), le fleuve coule devant la cité, et une légende chiffrée apparaît à côté
    de la tuile survolée (grand écran). Sur téléphone, l'aperçu suit la sélection.
59. **Le présage : une phrase, trois lignes, des mots.** « Bâtir X, puis tenir face à Y. » ; puis Objectif (coût en
    toutes lettres et ce que vous avez), Menace (« Vous êtes prêt à l'affronter » ou « il vous manque 3 Trésor pour
    « Payer le tribut » », calculé sur la réponse la plus proche), Rivale (« ont bâti 1 merveille sur 5 ; s'ils
    achèvent les cinq, ils vous rançonneront à chaque ère »). Seuils, intensité, règles et bilan sont repliés sous
    « Détails ». Les mots « Prêt » seul et « 1/5 » ont été abandonnés : aucun testeur ne savait qui était prêt.
60. **Les familles se présentent par leur rôle** (guerriers, prêtres, savants, marchands) dans les étiquettes et
    l'héritage, pour qui n'a pas encore retenu leurs noms.
61. **Bulles d'aide : une phrase, la première fois, une par carte.** Les notions attendent leur carte (pari, crédit,
    rivale, chantier…) ; si plusieurs se présentent ensemble, une seule bulle, les autres à la carte suivante. Le
    bilan ne parle plus de ce qui vient après lui.
62. **Voir clair (point 5).** Les gains s'affichent en fourchette large (1–2, 3–5, 6–9, 10–15, 16+) ; à 2 points de
    clairvoyance, en fourchette fine (1, 2, 3–4, 5–6, 7–9, 10–12, 13–15, 16–20, 21+) ; à 5 points, au chiffre près.
    Points : chaque carte ou famille qui compte pour la Science, une merveille sur deux, un Savoir de 10 ou plus.
    Sinon, « Voir les chiffres exacts » coûte 1 à 3 Savoir (selon l'ère) pour la carte en cours. Les petites
    valeurs (1, 2) deviennent exactes dès la fourchette fine : c'est voulu, l'écart compte peu.
63. **Une forme par ère (point 1)**, calée sur les crises qui existaient déjà, pour que règle, rythme, objectif et
    menace se répondent :
    - I **L'Errance** : 3 saisons de 2 cartes ; la tribu chasse (+2 Vivres par saison) mais ne porte pas plus que ce que
      la cité mange, plus deux ; la crise tombe d'un bloc.
    - II **La Contagion** : 2 saisons de 3 cartes, chacune ouverte par une colonie à fonder (un quartier qui se nourrit
      lui-même, jamais à crédit) ; la crise se répand, une carte à la fin de chaque saison, la dernière avant le bilan.
    - III **Le Conseil** : 2 saisons ouvertes par un vote (soutenir une famille froisse sa rivale) ; la famille la moins
      fidèle trahit dès qu'elle vous en veut ; aucune famille fâchée au bilan : +1 quartier (paix civile).
    - IV **La Course** : 4 saisons de 2 cartes ; le chantier ouvre à chaque saison ; la rivale avance d'une étape par
      saison ; bâtir avant sa dernière étape lui fait manquer sa merveille ; perdre rend la crise (éclair, deux cartes)
      un quart plus forte. Plus d'enjeu si la rivale a déjà ses cinq merveilles.
    - V **Le Jugement** : une seule saison de 4 cartes, plus aucun revenu ; avant la crise, la famille la plus lésée vous
      fait un procès (ou la plus fidèle vous rend hommage) ; après la crise, l'histoire s'arrête, sans dernier repas.
64. **Le présage reste à trois lignes** : la forme apparaît sous le titre (nom, rythme), dans la phrase principale
    (« Bâtir l'Arsenal avant les Orvandes. ») et en une ligne de règle ; le détail complet est replié.
65. **Difficulté après les formes** : gains 1,0, consommation 1,65 par quartier. Les formes ajoutent des filets
    (colonies, paix civile, pas de dernier repas) : la survie est indulgente (distrait 76 %, pressé 92 %), la victoire
    exigeante (grandes victoires : distrait 8 %, pressé 28 %, lecteur 62 %). Les réglages globaux ne bougent presque
    plus la survie du distrait ; ce sont ses choix au hasard qui le perdent.
66. **Les variantes de texte tournent d'une partie à l'autre** (selon le nombre de parties jouées, plus la graine) : deux
    parties de suite ne lisent pas les mêmes variantes. La carte des ruines ne se joue plus qu'une fois : la mesure,
    enfin enchaînée comme chez un vrai joueur (avec ses ruines), la montrait jusqu'à trois fois par partie.
