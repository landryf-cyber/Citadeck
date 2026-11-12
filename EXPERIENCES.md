# EXPERIENCES — Citadeck V2

Journal des expériences : hypothèse, changement, test, résultat, décision.

## E1 — Diagnostic de la V1
- **Hypothèse** : l'ennui vient de la structure (mort aux deux bouts, aperçu qui donne la réponse, but uniquement négatif), pas du contenu.
- **Test** : `src/sim/v1/diagnose.ts`, 400 parties d'un bot prudent, plus une analyse des textes.
- **Résultat** : le prudent meurt à l'ère 3 dans 37 % des parties ; le meilleur bot gagne 40 % sans lire un mot ; 0 personnage nommé ; 1 seule forme de dilemme ; 21 % des cartes dépendent d'un choix passé.
- **Décision** : H1, H3, H5, H8 confirmées. La règle « une jauge à 0 ou à 100 tue » est supprimée.

## E2 — Premier passage des prototypes (raté)
- **Hypothèse** : comparer trois boucles (P1 Reigns + Dessein, P2 Lignées, P3 Lignées + Carrefours) avec les mêmes bots.
- **Test** : `src/proto/compare.ts`, contenu synthétique.
- **Résultat** : P1 tue 98 % des parties, P2 en sauve 96 %. On comparait des réglages de difficulté, pas des structures.
- **Décision** : ajouter un étalonnage automatique (survie du bot lecteur ≈ 60 % pour chaque boucle). Les dégâts de crise, arrondis en marches, empêchaient l'étalonnage : rendus continus.

## E3 — Comparaison des boucles à difficulté égale
- **Hypothèse** : une boucle où les ressources se dépensent (coûts visibles, gains dans le texte), où la vie est la cité et où les crises sont annoncées rend la lecture nécessaire, ouvre plusieurs stratégies et rend les défaites attribuables. Les routes ajoutent le contrôle du risque.
- **Test** : `npx tsx src/proto/compare.ts 1000`, 8 bots, 1000 parties par bot et par boucle.
- **Résultat** :

| Mesure | P1 | P2 | P3 |
|---|---|---|---|
| Lecteur − indicateurs (points de survie) | 38 | 54 | 56 |
| Stratégies viables | 0 | 6 | 6 |
| Grande victoire du meilleur | 1 % | 53 % | 69 % |
| Prudent survit | 62 % | 60 % | 77 % |
| Ère moyenne gourmand / prudent | 4,78 / 4,78 | 3,28 / 3,69 | 3,25 / 4,18 |
| Défaites forcées | 3 % | 12 % | 5,5 % |
| Pertes attribuables à une décision | non mesurable (dérive) | 100 % | 90 % |
| Cartes dépendant d'un choix passé | 23 % | 46 % | 42 % |
| Formes de dilemme | 4 | 6 | 7 |

- **Lecture** : dans P1, le dessein est inatteignable parce qu'accumuler une jauge rapproche de la mort à 100 : le cadre Reigns interdit le fil rouge. P2 rend le texte décisif mais laisse 12 % de défaites que rien ne permettait d'éviter. P3 divise ce chiffre par deux : choisir sa route, c'est choisir son risque. C'est aussi P3 qui sépare le mieux le prudent (survit) du gourmand (meurt plus tôt).
- **Limite** : contenu synthétique ; les spécialistes y gagnent un peu moins que le prudent. Le vrai contenu devra récompenser davantage la spécialisation (options réservées plus fortes, jalons exigeants).
- **Décision** : **P3 retenu**. Garder les dégâts de crise déterministes (seuils annoncés) pour que chaque perte soit attribuable.

## E4 — Premier passage des bots sur le vrai contenu V2 : trop facile
- **Hypothèse** : le squelette de contenu (4 familles, rencontres, crises, découvertes) produit déjà une partie tendue.
- **Test** : `npx tsx src/sim/run.ts 150`, 8 profils de bots (lecteur qui simule chaque option sur une copie de l'état, indicateurs seuls, prudent, gourmand, trois spécialistes, aléatoire).
- **Résultat** : lecture nécessaire (lecteur 95 % contre indicateurs 0 %), 33-37 % de cartes dépendantes, ~10 formes de dilemme par partie. Mais le lecteur survit 99 % et le prudent aussi : l'économie ne pèse pas. Les ressources s'accumulent sans limite dès l'ère III.
- **Décision** : ajouter de la pression sans hasard pur : humeurs des familles et procès (E5), mise à l'échelle par ère, chantier avant la crise, érosion de l'armée et du trésor.

## E5 — Mise à l'échelle, chantier avant la crise, érosion
- **Changement** : les cartes `scale` (rencontres, rivale, découvertes, ruines, trahisons…) multiplient coûts, gains et seuils par ère (×1 à ×2,7) ; le jalon se bâtit avant la crise (on paie la gloire avec ce qui protège) ; 30 % de l'armée et 20 % du trésor s'érodent à chaque fin d'ère ; les crises ont leur propre coefficient (`crisisK`).
- **Résultat** : la survie du lecteur tombe vers 80-90 %, mais le gourmand (tout dans les jalons) devient dominant : 93 % de survie, 83 % de grandes victoires. Construire ne coûte rien de plus à long terme.
- **Décision** : le profil gourmand est rendu réaliste (il dépense tout dans le dessein, sans tricher sur les crises) et on cherche un mécanisme qui fasse payer la gloire *plus tard*.

## E6 — L'envie : les merveilles attirent les crises
- **Hypothèse** : si chaque jalon bâti durcit les crises suivantes (« vos merveilles attirent les regards »), la gloire devient un pari : le gourmand gagne plus souvent grand mais meurt plus souvent, le prudent survit mais reste modeste. Sans toucher à la lisibilité : le présage annonce l'intensité.
- **Changement** : intensité de crise = `crisisK × (1 + envie × jalons bâtis)`.
- **Test** : `npx tsx src/sim/sweep.ts '[...]' 60`, trois réglages (survie / grande victoire) :

| Réglage | lecteur | prudent | gourmand | étoiles | empire | postérité |
|---|---|---|---|---|---|---|
| K 1,2 · envie 0,15 | 83/53 | 92/17 | 80/70 | 88/65 | 93/47 | 82/58 |
| K 1,2 · envie 0,25 | 85/52 | 88/25 | 75/68 | 75/58 | 88/43 | 78/55 |
| K 1,1 · envie 0,35 | 68/38 | 90/20 | 72/65 | 83/60 | 92/45 | 62/35 |

- **Décision** : **K 1,2 · envie 0,25**. Mesure complète (200 parties par profil) : lecteur 85 % de survie / 50 % de grandes victoires ; prudent 91 % / 17 % ; gourmand 71 % / 63 %, mort en moyenne à l'ère 4,1 ; indicateurs seuls 0 %, aléatoire 3 %. Quatre stratégies viables (étoiles, empire, postérité, gourmand) ; aucune défaite forcée ; les trois desseins gagnent (45 / 66 / 58 victoires). Les pertes viennent surtout des crises, de la famine et des trahisons : des causes que le joueur voit venir.
- **Reste** : le présage doit annoncer l'envie en clair, sinon la règle est invisible.

## E7 — Plus de redites : tout ne se joue qu'une fois, la partie raccourcit
- **Constat (lecture de transcriptions)** : les découvertes revenaient à chaque ère avec le même dilemme (l'Aqueduc trois fois), les événements à cheval sur deux ères et les rencontres revenaient à l'identique, et chaque humeur de famille n'avait qu'une phrase (« Troc vous offre un cadeau… » à chaque ère).
- **Changement** : événements, rencontres, lettres de la rivale et dilemmes des découvertes sont à usage unique ; trois phrases par humeur et par famille ; 31 cartes nouvelles, dont 9 suites qui ne paraissent que si un souvenir existe et le citent (l'ours de l'âge de pierre et sa fête au Moyen Âge, les noces Ourk-Sel et le Général-Évêque, le philosophe empoisonné et son martyr, le recensement et le suffrage…).
- **Résultat** : la partie passe de ~130 à ~82 décisions (le diagnostic V1 notait des parties trop longues). Mais l'économie, réglée pour plus de cartes, devient trop généreuse : le lecteur survit 96 %, le prudent 99 %, le gourmand 87 % avec 79 % de grandes victoires.
- **Réglage** (balayages `npm run sweep`) : l'intensité de crise seule ne change presque rien (les réserves suffisent à payer). Le levier efficace est un coefficient sur les gains cachés (0,8), avec un entretien de 1,8 Vivres par quartier, une envie de 40 % par merveille et des merveilles d'empire un peu moins chères.
- **Mesure finale (150 parties par profil)** : lecteur 91 % / 41 % de grandes victoires ; indicateurs seuls 0 % ; prudent 84 % / 3 % ; gourmand 72 % / 59 %, mort plus tôt (ère 3,5 contre 3,8) ; spécialistes étoiles 89/49, empire 93/43, postérité 88/47 ; quatre stratégies viables ; aucune défaite forcée ; distance entre deux histoires 0,67.
- **Décision** : garder. La famine devient la première cause de perte : elle est annoncée (présage, réserve de Vivres en rouge dans le bandeau, bilan d'ère).

## E8 — Ce que l'éditeur et le premier joueur ont vu (et que les bots ne voyaient pas)
- **Test** : un agent éditeur a lu quatre transcriptions sans voir le code ; un agent joueur a joué en mode texte (`scripts/play.ts`), en notant tout. Rapports dans le dossier de travail de la session.
- **Bugs révélés** : les dilemmes des découvertes n'offraient jamais que « Rien de nouveau » (le moteur les prenait pour la carte de choix) ; des pertes cachées s'affichaient « gratuit » ; une rivale qui perdait une merveille était annoncée « achève » ; le revenu des merveilles s'affichait comme un bilan d'ère ; des répliques annonçaient un quartier brûlé qu'une merveille avait sauvé ; les procès rejugeaient la même faute, citaient des choix de procès et presque toujours une décision de la même ère.
- **Problèmes de clarté** : la Science exigée par les merveilles d'« étoiles » sans qu'on sache d'où elle vient (dessein « mort » dès l'ère I) ; seuils de crise inconnus avant la crise (« sentiment d'injustice ») ; effets de rivalité entre familles non annoncés ; options mentionnant ce qui n'a pas eu lieu (« les chars de Brume » sans roue).
- **Changements** : corrections ci-dessus ; présage avec réserves, seuils chiffrés de la crise et sources du mot-clé exigé ; pertes certaines affichées comme coût ; procès sur le grief le plus lourd et le plus ancien, jamais deux fois, cité avec son contexte (« Cela remonte à l'âge de pierre »), verdicts dans la voix de l'avocat, seulement quand une famille est à −1 ou moins ; une seule accroche par carte de famille, accordée à l'humeur ; échos toujours tirés ; quatre variantes d'âge de pierre (une par famille) avec chacune une suite des millénaires plus tard ; voix propres à chaque rivale ; grammaire (dates, accords, genres, rivales au pluriel) et tics réduits.
- **Mesure (120 parties par profil)** : procès par partie 3,3 → ~1,8 ; distance entre deux histoires 0,68 → 0,74, entre leurs souvenirs 0,62 → 0,72 ; lecteur 90 % / 43 % ; indicateurs seuls 0 % ; prudent 90 % / 5 % ; gourmand 76 % / 62 % ; quatre stratégies viables ; aucune défaite forcée.
- **Leçon** : les bots mesurent l'équilibre, pas la lisibilité. Les pires défauts (dessein impossible sans le savoir, choix forcés vécus comme injustes, procès absurdes) n'apparaissaient que dans la lecture humaine.

## E9 — Deux joueuses et joueurs qui découvrent : honnêteté des indicateurs, réussite punie, longueur
- **Test** : deux agents ont joué en mode texte sans voir le code (une partie prudente « étoiles », deux parties audacieuses). Envie de rejouer : 6/10 chacun (4/10 avant les corrections d'E8).
- **Ce qui ressort** : des pertes de quartier certaines encore non affichées ; des cartes de crise où une seule option reste jouable, et elle fait perdre un quartier (les coûts multipliés par l'envie rendent l'alternative payante inabordable) ; « réussir son dessein mène à des crises impossibles » (31 Armée pour le Front avec deux merveilles) ; le dessein « étoiles » vécu comme un piège (les paliers de Science n'étaient révélés qu'ère par ère) ; une rivale qui atteint 5/5 sans conséquence ; des souvenirs recopiés mot pour mot à chaque ère ; 30 à 40 minutes par partie, trop pour un téléphone.
- **Changements** : pertes de quartier affichées ; une option de **sacrifice** sur chaque carte de crise à seuil (le quartier est sauvé au prix de −3 de loyauté d'une famille, impossible si elle vous en veut déjà) — la crise devient un dilemme sur la mémoire des familles plutôt qu'une taxe ; l'**envie** passe de 40 % à 15 % par merveille et la gloire se paie autrement, en **entretien** (2 Vivres par merveille et par ère, annoncés au présage et au bilan) ; exigences de toutes les merveilles annoncées dès la fondation, merveille suivante annoncée au présage, seuils « si vous bâtissez d'abord » ; carte « Le Triomphe de la rivale » quand elle achève ses cinq merveilles ; souvenirs montrés l'ère suivante puis plusieurs ères plus tard seulement ; **3 cartes par saison** au lieu de 4.
- **Balayages** : avec les sacrifices, l'intensité des crises ne change presque plus rien (le lecteur omniscient plafonne vers 97 %), et l'écart prudent/gourmand disparaît. L'entretien des merveilles le rétablit (gourmand 58-65 % contre prudent 92-97 %).
- **Mesure (120 parties par profil, intensité 2)** : lecteur 93 % / 43 % ; indicateurs seuls 0 % ; prudent 98 % / 3 % ; gourmand 70 % / 53 %, mort plus tôt (ère 3,9 contre 4,7) ; à l’intensité 1,3, finalement retenue pour que la Horde de l’âge de pierre reste jouable (9 Armée au lieu de 14), l’équilibre est le même (lecteur 90 %, prudent 98 %, gourmand 65 %) ; quatre stratégies viables ; aucune défaite forcée ; ~74 décisions par partie pour le bot (carrefours et présages compris) au lieu de ~82 ; distance entre deux histoires 0,73, entre leurs souvenirs 0,75. Première cause de perte : la famine, annoncée et chiffrée.

## E10 — L'avocat du diable sur le jeu fini
- **Test** : un agent « avocat du diable » a joué deux parties complètes en mode texte, fait jouer un bot « toujours gratuit », lu 13 transcriptions et les captures (rapport dans le dossier de travail).
- **Objections** : (1) le dessein est facultatif (le prudent survit avec 1,4 merveille ; une « victoire » à 0 merveille contre une rivale à 5) ; (2) la fin se joue toute seule (11 décisions imposées sur 30 aux ères IV-V, seuils à 29-35 Armée, la famine écrase le reste) ; (3) la rancune ne tient pas (5 procès sur 6 gagnés gratuitement *améliorent* la loyauté du plaignant ; la grève générale se règle par des excuses gratuites qui rapportent de l'Armée) ; (4) on a tout vu à la deuxième partie (15 cartes de crise identiques, ~20 % des décisions) ; (5) des gabarits non remplis sur les écrans à partager ; (6) la signature dépend du hasard ; (7) des risques cachés (l'échec d'un pari coûtait un quartier non affiché).
- **Changements** : causes et chroniques passées au remplisseur et à la grammaire, test sur 60 parties contre toute accolade ; risque d'échec des paris et avance de la rivale affichés ; jour décisif choisi parmi les choix libres ; l'acquittement clôt l'affaire sans effacer la rancune (seule la réparation payante l'efface), excuses de la grève payantes, deux plaidoiries par avocat, trahisons récidivistes qui se savent ; loyautés amorties à ±1 hors cartes de famille, de crise et d'échos ; plus de sacrifice au Grand Filtre (le dessein y répond pour vous) ; fins nommées « dessein inachevé » et « dans l'ombre de la rivale », l'Âge de fer réservé aux desseins accomplis ; une découverte du mot-clé du dessein garantie à chaque ère ; seuils des ères III-V abaissés d'environ 20 %, entretien allégé, entretien futur affiché avant de fonder un quartier ; **trois crises alternatives** (le Grand Incendie, le Schisme, le Krach) tirées par la graine ; **huit options qui n'existent que par un souvenir** (le clan peint en rouge face à la Horde, l'ours sacré pendant la Peste, la quarantaine sur les navires de Trokos, les dernières paroles du sage au Grand Filtre…).
- **Constat sur la famine** : les bots la subissent ~1,4 fois par partie *volontairement* (fonder un quartier, puis le perdre faute de Vivres) ; un humain tomberait dans le même piège, d'où l'entretien futur affiché sur « Fonder un quartier ».
- **Mesure (100 parties par profil)** : lecteur 90 % / 39 % ; indicateurs seuls 0 % ; prudent 92 % ; gourmand 50 % / 43 %, mort plus tôt (ère 3,6 contre 4,6) ; étoiles 86/48, empire 94/58, postérité 86/40 : quatre stratégies viables ; aucune défaite forcée ; choix imposés du lecteur 5 à 15 % selon l'ère ; distance entre deux histoires 0,74 → 0,82, entre leurs souvenirs 0,77 → 0,85.

## E11 — Trois juges, tour 1 : « une plume rare dans un moule trop visible »
- **Test** : trois agents juges indépendants (critique, designer de roguelites, scénariste), sans voir le code, ont joué une partie complète chacun plus le début d'une seconde, regardé captures et planches, lu des transcriptions.
- **Notes** (originalité · tension · fil rouge · humour · impact · rejouer · beauté) : 6·5·7·7·7·6·7 ; 6·6·7·8·6·6·7 ; 7·6·6·8·6·6·7. Aucun critère à 8 chez les trois, sauf l'humour chez deux juges.
- **Faiblesses communes** : (1) des impasses (cartes à une seule option jouable, une partie perdue à 5/5 merveilles sur une trahison sans alternative) et des enjeux sans dents (« victoire » en survivant, rivale réduite à un compteur, une défaite sur dix-sept transcriptions) ; (2) un squelette répétitif (mêmes cartes de famille d'une partie à l'autre, procès à chaque ère, inauguration identique pour toutes les merveilles, fins de crise qui ignorent l'issue) ; (3) des incohérences (dette de mammouth inversée, accords), un héritage mince, des pictogrammes génériques.
- **Changements** : paliers de fin (triomphe à 5 merveilles, victoire à 4, survie en dessous, chute) annoncés dès la fondation ; la rivale part avec sa première merveille, triomphe donc avant la fin et annexe ensuite un quartier par ère (sauf en bons termes) ; jamais une seule option jouable : la moins chère des autres devient possible **à crédit**, avec une **créance** différée (payer, gager un quartier, ou se brouiller) ; une famille ne coûte qu'un quartier par ère ; procès réservés aux rancunes graves (−2), hommage une fois par famille, griefs pondérés par la gravité ; au Grand Filtre, le dessein répond dès le premier acte ; une inauguration écrite pour chacune des 18 merveilles ; fins de crise selon leur issue ; huit variantes de cartes de famille pour les ères IV et V ; la partie suivante écarte les événements et rencontres vus à la précédente ; les familles se souviennent de la cité précédente (alliée +1, ennemie −1, doublé pour les Héritiers) ; silhouette de la merveille en illustration du chantier ; carte plus grande sur bureau, noms courts sur mobile ; dette de mammouth remise dans le bon sens, élisions automatiques (« d'Ourk »).
- **Équilibrage** : le crédit faisait remonter la survie du lecteur à 98 % ; la créance différée, la rivale plus rapide et des gains à 0,9 ramènent la tension, et surtout les paliers changent la lecture : le lecteur omniscient finit en triomphe 13 %, victoire 25 %, survie (dessein inachevé) 58 %, chute 4 % ; le prudent survit presque toujours mais ne gagne que 9 % du temps ; le gourmand gagne le plus (59 %) et meurt le plus (32 %). Quatre stratégies viables ; distance entre deux histoires 0,83, entre leurs souvenirs 0,88.

## E12 — Trois juges, tour 2, et ce qu'en a fait le tour 3
- **Test** : trois nouveaux juges (rédacteur de magazine indé, joueuse de roguelites, auteur de fiction interactive) sur la version 7.
- **Notes** (originalité · tension · fil rouge · humour · impact · rejouer · beauté) : 7·8·7·8·8·6·7 ; 6·5·8·7·5·6·7 ; 6·6·7,5·7·6·6·7. Le fil rouge et l'humour montent ; la rejouabilité et la beauté restent à 6-7 chez les trois.
- **Faiblesses communes** : (1) répétitions : mêmes cartes d'une partie à l'autre (« Les Navires » dans 17 transcriptions sur 21), mêmes crises aux ères I et V, créance, trahison et plaidoiries identiques, tics d'écriture ; (2) choix illisibles : gains cachés jugés arbitraires, sens des loyautés caché, procès sur le dernier blâme ; (3) menaces sans dents : sorties de crise gratuites par une famille dévouée, palissade qui annule les sacrifices choisis, crédits d'ère V jamais réclamés, triomphe rival soldé par « Applaudir », sabotage reconstruit au même bilan, parties mortes après deux merveilles manquées.
- **Ablation** (lecteur, 200 parties) : chaque durcissement coûte de la survie : chaîne des créances −10 points, sorties de crise payantes −8, Grand Filtre −4 ; ensemble, 97 % → 80 %. Les sorties de crise étaient aussi ce qui portait la postérité (40 % → 14 % de grandes victoires).
- **Choix** : on garde les trois durcissements, dosés (aide des dévoués une fois par partie, prix du crédit écrit en clair, bot qui voit les créances en attente comme le sablier), on allège les merveilles de la postérité et leur entretien, et on ajoute le rattrapage des merveilles manquées (à la seconde saison : au bilan, il était impayable).
- **Résultat** : lecteur 81 % de survie (triomphe 10 %, victoire 33 %, survie 38 %, chute 20 %), prudent 86 %, gourmand 29 % et mort plus tôt (ère 4,0 contre 4,8) ; trois stratégies viables (étoiles 50 %, empire 63 %, postérité 42 % de grandes victoires) ; indicateurs seuls 2 % malgré les gains et sens affichés ; distance entre deux histoires 0,89, entre leurs souvenirs 0,97 (0,83 et 0,88 avant).

## E13 — Trois juges, tour 3, et le tour 4
- **Notes** (originalité · tension · fil rouge · humour · impact · rejouer · beauté) : 6·6·7·7·7·6·6 ; 6,5·6·7,5·7,5·5,5·6,5·7 ; 7·6·8·7·6·6·6. Le fil rouge touche 8 chez une juge ; l'impact des choix descend chez la plus « systèmes » des trois.
- **Constat commun** : l'interface ment (« gratuit » qui consomme, ▼▼ qui coûte ▼3, crédit « environ 8 » qui coûte 11 huit cartes plus tard, perte gratuite à stock vide, options dominées), les filets dissolvent les dilemmes (palissade à 0 Armée, plancher des Peintures, Culture jamais bloquante), la fin n'a pas d'adversaire (Trésor qui s'accumule, famine forfaitaire, tribut absent quand la rivale finit par une dette, Verdict gratuit).
- **Expériences** : (1) compter les pertes comme des coûts faisait passer les choix imposés à 18 % à l'ère V et doublait les crédits : remplacé par un cran de loyauté ; (2) retirer les merveilles du compte des mots-clés effondrait le dessein des étoiles (3 % de grandes victoires) : seuils de Science et de Guerre baissés d'un cran, étoiles remonte à 47 % ; (3) donner à chaque option payante de quoi battre la gratuite menait à 99 % de survie et 39 % de triomphes : l'écart est désormais partagé, et les gains passent à 0,95 ; (4) les choix imposés qui restent sont structurels (présage, chantier hors de portée, découverte) : aucun dilemme sans issue.
- **Résultat** : lecteur 90 % de survie (triomphe 9 %, victoire 36 %, survie 46 %, chute 10 %), prudent 94 %, gourmand 40 % et mort plus tôt (ère 4,3 contre 4,8) ; quatre stratégies viables ; indicateurs seuls 1 % ; famine sortie des premières causes de pertes (disette), les créances y entrent (le prix du crédit, annoncé).
