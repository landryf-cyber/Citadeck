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
- Captures : `npm run shots` (mobile + bureau, ~19 écrans) ; perf : `npm run perf -- 2`

## En cours
- Relecture éditoriale des transcriptions, enrichissement du contenu (humour, voix, variété), puis agents joueurs

## Reste à faire (dans l'ordre)
1. Relire 3-4 transcriptions (`npm run sim -- --transcript lecteur N`) : répétitions, textes plats, incohérences ; enrichir
2. Agents « joueurs qui découvrent » (sur captures + transcriptions) et lecteurs de transcriptions ; corriger ce qui ennuie
3. Avocat du diable sur le jeu fini ; mesures finales (`npm run sim -- 200`, `npm run campaign -- 10`)
4. 3 passes DA captures (mobile/bureau, dont animations), relecture de tous les textes, cas limites, perf
5. Trois juges indépendants (notes ≥ 8 sur 7 critères, 5 tours max)
6. Déploiement : `npm run single` → page hébergée claude.ai (URL précédente : https://claude.ai/artifact/PMUcDUwFQCBGfv7Qgceqom) ; message final

## Bloqué
- `git push` refusé (403). Publication par page hébergée.
