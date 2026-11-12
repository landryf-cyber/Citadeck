# PROGRESS — Citadeck V2

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
- [ ] republication (version 8), captures, trois nouveaux juges (tour 3)

## Reste à faire (dans l'ordre)
1. Relire 3-4 transcriptions (`npm run sim -- --transcript lecteur N`) : répétitions, textes plats, incohérences ; enrichir
2. Agents « joueurs qui découvrent » (sur captures + transcriptions) et lecteurs de transcriptions ; corriger ce qui ennuie
3. Avocat du diable sur le jeu fini ; mesures finales (`npm run sim -- 200`, `npm run campaign -- 10`)
4. 3 passes DA captures (mobile/bureau, dont animations), relecture de tous les textes, cas limites, perf
5. Trois juges indépendants (notes ≥ 8 sur 7 critères, 5 tours max)
6. Déploiement : `npm run single` → page hébergée https://claude.ai/artifact/PMUcDUwFQCBGfv7Qgceqom (V2 publiée en version 5 le 12/11 ; republier après chaque tour de corrections) ; message final

## Dépôt
- Branche `claude/inspiring-cerf-jcrkjo` poussée sur GitHub le 12/11 (l'accès a été rétabli). Le déploiement GitHub Pages ne se déclenche que sur `main` ; publication courante : page hébergée.
