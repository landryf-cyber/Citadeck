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

- Tests joueurs par agents séparés : n°1 (partiel), n°2 (complet, clarté 4/10), n°3 (une partie) ; corrections appliquées après chacun
  (options cliquables, jauges en barres avec zones rouges, aides ponctuelles, conditions explicites,
  répliques d'échec, sursis, plafond de 15 points par carte, rivale sans répétition)
- Build en un seul fichier, publié : https://claude.ai/artifact/PMUcDUwFQCBGfv7Qgceqom

- Test joueur n°4 complet (clarté 6, tension 7, textes 8,5, beauté 9, envie de rejouer 7) : remarques corrigées
- Test joueur n°5 interrompu par quota après 13 décisions : aucune incompréhension ni blocage relevé sur ce début
- Vérification finale : 42 tests, cibles de simulation, 60 fps profil mobile, parties complètes sur le fichier publié

## Non terminé
- Un test joueur complet sur la toute dernière version n'a pas pu aller au bout (quotas des agents épuisés).
- `git push` refusé (403) : le déploiement GitHub Pages attend que le propriétaire rétablisse l'accès,
  pousse la branche, la fusionne dans `main` et active Pages (Settings → Pages → Source : GitHub Actions).

## Publié
- https://claude.ai/artifact/PMUcDUwFQCBGfv7Qgceqom (build en un seul fichier)
