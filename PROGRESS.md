# PROGRESS — Citadeck

## Fait
- Pile : Vite + TypeScript, Vitest, Playwright, fontes embarquées (Cinzel, Source Sans 3)
- Moteur pur (`src/core`) : jauges, deck, ères, crises, récompenses, merveilles, rivale, fins, RNG à graine
- Contenu (`src/data`) : ~190 cartes, 5 crises, 12 merveilles, enjeux et « vent » par ère
- Tests du moteur et du contenu (32)
- Interface : carte (swipe, souris, clavier), jauges, écrans titre/récompense/merveille/retrait/fin/réglages/deck
- Scène Canvas 2D : lumière par ère, civilisation générative, particules, transitions, défaite, timelapse
- Audio WebAudio, sauvegarde automatique, script de captures (`npm run shots`)
- Simulation (`npm run sim`), bots, cibles automatiques, équilibreur d'options (`npm run autotune`)

- Équilibrage : toutes les cibles de `npm run sim` atteintes (1500 parties par bot)
- Vent de l'ère (moteur + interface), variantes d'ère des cartes de départ, plafond de 24 points par carte
- Passes DA 1, 2 et 3 (la 3e sur pellicules d'animation), cité recomposée (merveilles sur butte, remparts)
- Parties complètes jouées par l'interface (`npm run play`) : les 3 fins vues, aucune erreur console
- Test de performance (`npm run perf`), README, typographie française, écran paysage, tablette
- Workflow GitHub Pages écrit

## En cours
- Test par un agent séparé n°1 (joueur qui découvre), puis corrections, puis agent n°2

## Bloqué
- `git push` refusé (403) et API GitHub en lecture seule : le déploiement Pages demande une action
  du propriétaire du dépôt. Contournement prévu : publication du build comme page hébergée + archive git.

## Reste à faire
- Corrections issues des tests d'agents
- Passe de finition : relecture des textes, cas limites, dernière partie sur le build publié
- Message final
