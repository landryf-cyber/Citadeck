# PROGRESS — Citadeck V2

## RONDE 2 (en cours) — demandée après la version 11
Point de retour : tag local `v11-avant-ronde-2` sur le commit `4c8dc9c` (la publication des tags est refusée à cette session : `git tag v11-avant-ronde-2 4c8dc9c` le recrée).
Ordre demandé : points 2, 3, 4, 5, 7 (puis déploiement pour test), ensuite 1 et 6. Arrêt : toutes les notes ≥ 8, ou deux tours de juges consécutifs sans amélioration.
### A. Vrais choix, crédit, difficulté (point 2)
- [x] mesure de dominance sur des états échantillonnés (`npm run dominance`, test) → 0
- [x] crédit : coût qui croît avec la somme, saisie des réserves avant le quartier, seuls les Troc prêtent ; absent des causes de pertes
- [x] profils humains (distrait 61 %, pressé 83 %) ; gourmand meurt plus tôt que prudent ; causes de pertes variées (E16)
### B. Écriture (point 3)
- [x] mesure des répliques répétées (`npm run repeats`, test) : 0 dans une partie, ~4 % de la partie précédente (E17)
### C. Clarté des écrans (point 4)
- [x] fondation : accroche + ressource en clair + « détails », Fonder visible, première partie = dessein seul (conseillé présélectionné), origines après la première partie, desseins compacts ensuite (DECISIONS 56)
- [x] origines : nom + style d'une ligne, atout/handicap calculés, emblème, scène teintée au survol avec légende chiffrée, détails (départ comparé au Feu, règle, cartes à elles) ; règle et cartes propres, effet mesuré (DECISIONS 57-58, E18)
- [x] briefing d'ère : une phrase, trois lignes en mots (coûts et réserves, « vous êtes prêt » ou ce qui manque pour quelle réponse), détails repliés, bouton collant ; menace de l'ère et grue de la rivale dans la scène (DECISIONS 59)
- [x] bulles d'aide d'une phrase, une par carte, au premier contact (DECISIONS 61) ; agents « nouveau joueur » à 10 s : 5 tours (E19)
### D. Fourchettes (point 5)
- [x] fourchettes larges, fines (2 points de Science/merveilles/Savoir), exactes (5 points) ; « Voir les chiffres exacts » contre 1 à 3 Savoir ; test (DECISIONS 62, E20)
### E. Vérifications (point 7)
- [x] rejouées dans l'interface par `scripts/verify.ts` (captures dans shots/verify, 4/4 OK, aucune erreur console) ; jugées sur preuves
### F. Déploiement intermédiaire (A-E) — fait : version 12, même adresse
- [x] page republiée (https://claude.ai/artifact/PMUcDUwFQCBGfv7Qgceqom, version 12) ; perf : ère V à 28-34 i/s au palier 1, CPU ralenti ×2 et sans GPU (la mesure v11 de l'ère V était fausse : son joueur naïf mourait à l'ère III)
### G. Structure des ères (point 1)
- [x] une forme par ère : règle, rythme, objectif, forme de la menace (Errance, Contagion, Conseil, Course, Jugement) ; présage, pastilles, bilan (DECISIONS 63-66)
- [x] mesure de similarité de structure (0,75 → 0,53 entre ères ; `npm run structure`, test) ; test à l'aveugle : 5 paires sûres contre 3 en v12 (E22)
### H. Illustrations (point 6)
- [x] essai de style sur 3 cartes (personnage, événement, lieu) jugé (4/3/4 → 7/7/6), puis généralisation à toutes les cartes (20 scènes ; DECISIONS 67-68, E23)
### I. Juges sévères jusqu'à l'arrêt ; README ; déploiement final
- [x] tours 1 à 3 : amélioration (E24-E26) ; tour 4 : pas d'amélioration (impact 6 → 5,3), passe sur l'impact (DECISIONS 75, E27)
- [x] cadence rétablie : scène en calques, palier 2 partout, pire moyenne 30,2 i/s (DECISIONS 76, E28)
- [x] tour 5 (nouveaux juges) : somme 48,0 comme au tour 4 → arrêt motivé (E29) ; corrections factuelles du tour 5 (DECISIONS 77)
- [ ] README, page finale republiée, message final


Le brief V2 (refonte complète, objectif « publiable ») est dans l'historique de la session.
Documents : `DESIGN-V2.md` (diagnostic, concepts, choix, voix), `EXPERIENCES.md` (journal), `DECISIONS.md`, `README.md`.

## Fait
- Diagnostic chiffré de la V1, 12 concepts, 3 boucles prototypées (`src/proto/`) → P3 « Lignées + Carrefours » (EXPERIENCES E1-E3)
- Avocat du diable sur le design → DESIGN-V2 §6
- Moteur (`src/core/`), contenu (`src/data/`), bots et mesures (`src/sim/`), équilibrage (E4-E6 : `TUNING crisisK 1.2, envie 0.25`)
- Méta-progression (`src/core/meta.ts`) : chronique, épitaphe, testament + héritage, grief → Revenants, déblocages ; campagne simulée
- Interface (`src/ui/`, `src/scene/`) : titre (ruines des civilisations passées), fondation (dessein, origine, Âge de fer), HUD (quartiers, réserves, 4 familles en médaillons, course aux merveilles contre la rivale), carte compacte (illustration avec orateur, options coûtées, pastilles de familles, sablier, seuils, paris), présage, bilan d'ère, bannières (merveille, crise, ère), fin (pertes expliquées), rejeu en accéléré, testament, chronique, réglages, conseils de première partie
- Effets rétablis : palier 2 partout, dégradation sous 30 i/s ; rafraîchissement continu en crise
- V1 retirée (historique git), arborescence aplatie, README et DECISIONS à jour
- Tests : contenu, moteur (pas de blocage, déterminisme, gabarits résolus), méta, rejeu — `npm test`
- Captures : `npm run shots` (mobile + bureau, ~19 écrans) ; perf : `npm run perf -- 2` ; scène seule : `npx tsx scripts/scene.ts` ; planches d'animation : `npx tsx scripts/film.ts` (à réparer : le saut vers le chantier)
- Contenu sans redites (usage unique), 3 humeurs par famille, 31 cartes nouvelles dont 9 suites ; rééquilibrage E11 (`TUNING crisisK 1.4, envie 0.15, entretien 1.5 + 1.25 par merveille, gains ×0.9, 3 cartes par saison`, rivale à 1 merveille au départ)
- Joueur en mode texte pour testeurs : `npx tsx scripts/play.ts new <dossier> [dessein] [origine] [graine]`
- Introduction des quatre familles au premier lancement ; ruines et rivale lisibles sur la crête ; sons du procès et des ruines
- Rapport de l'éditeur (agent) : `scratchpad/rapport-editeur.md` ; notes du joueur A (arrêté par la limite d'usage) : `scratchpad/notesA.txt`

## En cours — corrections issues de l'éditeur et du joueur A
P1 bugs et indicateurs trompeurs
- [x] cartes de découverte : leurs propres options n'apparaissent jamais (seul « Rien de nouveau ») — branche `decouverte` de `baseOptions`
- [x] pertes de ressources cachées affichées « gratuit » (La Charte : −7 Trésor) → afficher les pertes directes comme coût
- [x] rivale qui perd une merveille annoncée « achève » ; revenu des merveilles étiqueté « famille dévouée » (événement distinct)
- [x] réplique « le quartier brûle » alors qu'une merveille l'a sauvé → complément de réplique
- [x] procès : rejuge la même faute, cite des choix de procès et des libellés sans contexte, toujours la même ère → exclure les rouages, préférer l'ancien, marquer « jugé », citer le titre ; verdicts dans la voix de chaque famille ; procès seulement si loyauté ≤ −1
- [x] effets en cascade (rivalité) non annoncés par les pastilles ; options dont l'exigence est un souvenir absent (chars sans roue) → masquer
P2 clarté
- [x] présage : réserves actuelles, seuils chiffrés de la crise à venir, d'où vient la Science/Guerre/Culture et combien on en a
- [x] merveille bâtie : une phrase (réplique), pas seulement ★
P3 textes
- [x] grammaire : « des les », rivales au pluriel (Ligue d'Ombre), genres (amirale Ourk-7, Monseigneur Salin, BRUME), {RIVAL}, « Un vieux légionnaires », « On lui a pris », dates « en l'an »
- [x] une seule accroche par carte de famille (souvenir OU humeur, en alternance, souvenirs filtrés par le ton) ; tics (« techniquement », « prix d'ami », « le ciel est formel », « coffre plein de plans »)
- [x] cartes : Comète (Mère Sel/Sélènè, éclipse), Canons (fondre les cloches), titre « Troc et Fils », Loterie et Suffrage (options dominantes), gains d'Armée injustifiés (espion, ambassadeur), Carrefour (promesses)
P4 variété
- [x] suites liées aux souvenirs toujours tirées (priorité) ; variantes d'âge de pierre par famille ; voix propres à chaque rivale ; deux cartes de l'éditeur (Quarantième Génération, Brevet de la roue)
- [x] retours des joueurs A et B (6/10 chacun) : sacrifices en crise, entretien des merveilles, exigences annoncées, triomphe de la rivale, 3 cartes par saison (E9)
- [x] passe DA animations (planches `scripts/film.ts`), écran « Votre civilisation », V2 publiée (version 5)
## Tour « avocat du diable » (rapport : scratchpad/rapport-avocat.md)
- [x] A. bugs et risques cachés : gabarits dans les causes ({rival}), « le quartier tient » alors qu'un quartier tombe, jour décisif parmi les choix libres, risque d'échec des paris affiché, avance de la rivale annoncée, test anti-accolades sur épitaphes/chroniques
- [x] B. rancune : l'acquittement n'efface pas la rancune (seule la réparation payante), excuses de la grève payantes, verdicts et trahisons variés, loyautés ±1 hors cartes de famille et de crise
- [x] C. dessein : pas de sacrifice au Grand Filtre, « Survie » nommée comme fin médiocre (et « dans l'ombre de la rivale »), une découverte du mot-clé du dessein proposée à chaque ère
- [x] D. fin de partie : mesurer les choix imposés par ère ; seuils de crise des ères III-V abaissés ; entretien allégé
- [x] E. une crise alternative par ère (II à IV), tirée par la graine
- [x] F. souvenirs qui changent les options (options visibles seulement si le souvenir existe)
- [x] republié (version 6)
## Juges — tour 1 (fait, version 6)
- Notes (originalité · tension · fil rouge · humour · impact · rejouer · beauté) : critique 6·5·7·7·7·6·7 ; designer 6·6·7·8·6·6·7 ; scénariste 7·6·6·8·6·6·7. Verdicts dans `scratchpad/juges/juge-1..3.md`.
- Trois faiblesses : (1) impasses et enjeux sans dents ; (2) squelette répétitif ; (3) cohérence, héritage mince, illustrations génériques.
## Tour 2 de corrections (fait, fusionné dans la branche de travail, publié en version 7)
- [x] paliers de fin (triomphe, victoire, survie, chute), rivale qui annexe un quartier par ère après son triomphe, crédit quand une seule option est jouable, une perte de quartier au plus par famille et par ère
- [x] procès seulement pour les rancunes graves (−2), hommage une fois par famille, griefs pondérés par la gravité
- [x] Grand Filtre : le dessein répond dès le premier acte
- [x] une inauguration écrite pour chaque merveille ; fins de crise selon leur issue
- [x] la partie suivante écarte les cartes vues à la précédente ; les familles se souviennent de la cité précédente
- [x] cohérence : dette de mammouth, élisions (« d'Ourk »), « À », libellés
- [x] interface : paliers de fin, annexion au bilan, noms courts sur mobile, carte plus grande sur bureau, silhouettes des merveilles en illustration
- [x] variantes de cartes de famille pour les ères IV et V
- [x] mesures, tests, fusion, republication (version 7)
## Juges — tour 2 (fait, version 7)
- Notes (originalité · tension · fil rouge · humour · impact · rejouer · beauté) : rédacteur 7·8·7·8·8·6·7 ; joueuse de roguelites 6·5·8·7·5·6·7 ; auteur de fiction interactive 6·6·7,5·7·6·6·7. Verdicts dans `scratchpad/juges/juge-4..6.md`.
- Trois faiblesses : (1) répétitions (mêmes cartes d'une partie à l'autre, mêmes crises aux ères I et V, cartes de système identiques, tics d'écriture) ; (2) choix illisibles ou inéquitables (gains cachés trop amples, sens des loyautés caché, options payantes moins bonnes que les gratuites, loyautés volatiles, procès sur le dernier grief) ; (3) menaces sans dents (sorties de crise gratuites, palissade détournable, dettes d'ère V jamais réclamées, triomphe et sabotage de la rivale sans effet, parties mortes après deux merveilles manquées, fin incohérente).
## Tour 3 de corrections (fait, fusionné dans la branche de travail)
- [x] portraits des chefs de famille (un buste par maison et par ère, expression selon l'humeur)
- [x] bugs : texte de la Horde, « en toge » en 2150, plancher des Peintures, sabotage rebâti au même bilan, étiquette des transcriptions, stèle d'empire
- [x] menaces : aide des dévoués payante et une fois par partie, palissade limitée aux pertes subies, créances qui montent (Créance, Seconde Créance, Saisie) et se revendent à la rivale, échéance immédiate à la dernière ère, tribut après le triomphe rival, sabotage qui retarde d'une ère, merveilles qui allègent le Grand Filtre sans l'annuler, rattrapage d'une merveille manquée (seconde saison), plus rien après la dernière crise
- [x] lisibilité : genre de gain affiché sans chiffre, sens de l'effet sur chaque famille (▲ ▼), prix du crédit écrit, procès sur le grief le plus grave ; « texte nécessaire » mesuré (indicateurs seuls 2 % contre lecteur 81 %)
- [x] répétitions : crises alternatives aux ères I et V, trois cartes de créance, trahisons qui s'aggravent (8 cartes), plaidoiries variées, 8 variantes de familles (Antiquité, Moyen Âge), anti-redite élargi aux crises et variantes, tics allégés
- [x] interface : présage allégé (merveilles manquées, tribut), humeur « fervents », réponse rattachée à son choix, carte agrandie sur tablette
- [x] mesures (E12), tests (24), README, DECISIONS 25-32
- [x] republication (version 8, 12/11), captures (mobile, bureau, tablette, petit écran, scène, planches)
## Juges — tour 3 (fait, version 8)
- Notes (originalité · tension · fil rouge · humour · impact · rejouer · beauté) : journaliste mobile 6·6·7·7·7·6·6 ; autrice de jeux de société 6,5·6·7,5·7,5·5,5·6,5·7 ; joueuse occasionnelle 7·6·8·7·6·6·6. Verdicts dans `scratchpad/juges/juge-7..9.md`.
- Trois faiblesses : (1) l'affichage ment (« gratuit » qui consomme, flèches sous-estimées, crédit au montant et à l'échéance faux, perte gratuite à stock vide, options dominées) ; (2) filets qui dissolvent les dilemmes et fin sans adversaire (palissade à 0 Armée, plancher des Peintures, Culture jamais bloquante, Trésor sans usage, famine forfaitaire, tribut absent, Verdict gratuit) ; (3) ères coulées dans le même moule, anachronismes, trahisons revues, illustrations génériques.
## Tour 4 de corrections (fait, fusionné dans la branche de travail)
- [x] vingt nouveaux événements, variantes réécrites
- [x] affichage honnête : dépense des options à seuil, flèches exactes (mépris compris), ampleur des gains (+, ++, +++), crédit à prix fixe et compte à rebours, perte à sec payée en loyauté, vocabulaire, coquilles, options payantes jamais dominées
- [x] filets et fin : rachat payant (palissade, observatoire, vaccin), Peintures qui réconcilient, merveilles hors du compte des mots-clés, famine proportionnelle et disette (acheter du grain), tribut dès cinq merveilles rivales, réponse finale payante
- [x] moule : chantier ouvert dès la fin de la première saison, trahisons et cartes des deux dernières parties écartées, découvertes de la bonne ère, anachronismes, réponse lisible, flèches plus grandes, silhouette d'ère, portraits modelés
- [x] mesures (E13), tests (27), README, DECISIONS 33-40
- [x] republication (version 9, 12/11), captures (mobile, bureau, tablette, petit écran, scène, planches)
## Juges — tour 4 (fait, version 9)
- Notes (originalité · tension · fil rouge · humour · impact · rejouer · beauté) : critique 7·7·7,5·7,5·7,5·6,5·6,5 ; optimisatrice 7·5·8·7·5·6·7 ; romancière 6·6·7·7·6·6·7. Verdicts dans `scratchpad/juges/juge-10..12.md`.
- Les trois humains perdent ou survivent sans dessein (le bot lecteur, qui voit les effets exacts, survit à 90 %).
- Trois faiblesses : (1) spirale de déclin (seuils de crise hors d'atteinte, crise = choix du bouc émissaire, famille au plancher sacrifiable gratis) ; (2) crédit exploitable (moins cher que le comptant, prêts des hostiles, cascade de créances) et affichage encore inexact (ampleur relative à l'ère, présage ≠ chantier, effets incertains sans « ? », rattrapage « au bilan », palissade et trahisons) ; (3) répétitions et prose monocorde, rivale sans enjeu après son triomphe, coquilles, vide sur bureau.
## Tour 5 de corrections (le dernier, fait, fusionné)
- [x] crises atteignables (intensité 1,15, convoitise 0,10, gains 1,05), pas de bouc émissaire au plus bas, hommage qui rebâtit un quartier en détresse, épreuve finale proportionnelle
- [x] crédit : toujours plus cher que le comptant, pas de prêt des Troc hostiles, un à la fois, refus qui révolte, paiement en nature, lettre rivale qui saisit du Trésor
- [x] affichage : fourchettes chiffrées fixes, présage aux prix du chantier, « ? » des effets incertains, prix exacts des rachats, palissade contre trahisons et dettes, textes d'aide exacts, pluriels, dettes et promesses, orateur capitalisé
- [x] tribut en début d'ère (même la dernière), sabotage d'une merveille rivale ; cartes graves sans chute ; répliques variées ; carte plus large sur bureau
- [x] mesures (E14, profil « distrait »), tests (27), README, DECISIONS 41-46
- [x] republication (version 10)
## Juges — tour 5 (le dernier, fait, version 10)
- Notes (originalité · tension · fil rouge · humour · impact · rejouer · beauté) : éditeur indé 6·6·8·7·7·6·6 ; streameuse de stratégie 7·6·8·7·6·7·7 ; joueur mobile 7·6·8·8·6·7·7. Verdicts dans `scratchpad/juges/juge-13..15.md`.
- Cinq tours atteints : la consigne s'arrête là. Les notes sous 8 sont expliquées dans le message final et dans EXPERIENCES (E15).
## Après le dernier tour (fait, version 11 publiée)
- [x] palissade jamais sur une cession choisie, révoltes annoncées avant le bilan, bilan après une disette, pertes impayables qui coûtent, dette rivale ignorée à sec ou à la dernière ère, entretien et usure annoncés, nom de cité distinct des ruines
- [x] mesures finales (E15), 27 tests, performance (pire moyenne 37 i/s au palier 2, profil mobile sans GPU), aucune erreur de console sur le parcours complet
- [x] version 11 publiée (page hébergée) ; branche poussée

## Reste à faire
- Rien : le plan (relectures, joueurs, avocat du diable, passes DA, cinq tours de juges, déploiement) est exécuté. Campagne de 10 parties vérifiée sur la version finale (origines débloquées, ruines, héritages, noms distincts). Message final envoyé.

## Dépôt
- Branche `claude/inspiring-cerf-jcrkjo` poussée sur GitHub le 12/11 (l'accès a été rétabli). Le déploiement GitHub Pages ne se déclenche que sur `main` ; publication courante : page hébergée.
