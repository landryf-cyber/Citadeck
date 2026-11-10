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

## En cours
- Équilibrage : répartition des défaites par jauge (savoir trop sûr, armée trop mortelle),
  puis repasser l'autotune une fois les paramètres globaux figés

## Reste à faire
- Interface : indicateur du vent de l'ère sur la jauge, annonce dans la bannière d'ère
- Passes DA 2 et 3 (dont une sur animations/transitions), ère industrielle à enrichir
- Test de performance 60 fps profil mobile
- Parties complètes jouées à la main dans le navigateur, notes tour par tour
- Tests par agents séparés (x2)
- Déploiement GitHub Pages (workflow), vérification du build déployé
- README, relecture des textes, cas limites
