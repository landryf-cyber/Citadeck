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
