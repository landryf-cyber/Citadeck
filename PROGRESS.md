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
- Contenu sans redites (usage unique), 3 humeurs par famille, 31 cartes nouvelles dont 9 suites ; rééquilibrage E7 (`TUNING crisisK 1.3, envie 0.4, entretien 1.8, gains ×0.8`)
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
- [ ] suites liées aux souvenirs toujours tirées (priorité) ; variantes d'âge de pierre par famille ; voix propres à chaque rivale ; deux cartes de l'éditeur (Quarantième Génération, Brevet de la roue)
Ensuite : relancer les joueurs A et B (limite d'usage levée vers 2 h 10 UTC) via SendMessage, mesures, captures.

## Reste à faire (dans l'ordre)
1. Relire 3-4 transcriptions (`npm run sim -- --transcript lecteur N`) : répétitions, textes plats, incohérences ; enrichir
2. Agents « joueurs qui découvrent » (sur captures + transcriptions) et lecteurs de transcriptions ; corriger ce qui ennuie
3. Avocat du diable sur le jeu fini ; mesures finales (`npm run sim -- 200`, `npm run campaign -- 10`)
4. 3 passes DA captures (mobile/bureau, dont animations), relecture de tous les textes, cas limites, perf
5. Trois juges indépendants (notes ≥ 8 sur 7 critères, 5 tours max)
6. Déploiement : `npm run single` → page hébergée claude.ai (URL précédente : https://claude.ai/artifact/PMUcDUwFQCBGfv7Qgceqom) ; message final

## Bloqué
- `git push` refusé (403). Publication par page hébergée.
