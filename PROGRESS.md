# PROGRESS — Citadeck V2

Le brief V2 (refonte complète, objectif « publiable ») est dans l'historique de la session.
Documents de référence : `DESIGN-V2.md` (diagnostic, concepts, choix, voix), `EXPERIENCES.md` (journal des expériences), `DECISIONS.md`.

## Fait
- Diagnostic chiffré de la V1 (`src/sim/v1/diagnose.ts`) → DESIGN-V2 §1
- 12 concepts explorés, 3 boucles prototypées sans interface (`src/proto/`), comparées à difficulté égale → P3 « Lignées + Carrefours » retenu (EXPERIENCES E1-E3)
- Avocat du diable (agent séparé) sur le design → réponses DESIGN-V2 §6 (procès, reçus, 4 familles, fusions, ruines personnelles, testament)
- Moteur V2 sans interface : `src/v2/core/` (types, gabarits de texte avec citations datées, moteur, validation)
- Squelette de contenu V2 : `src/v2/data/` — 4 familles × 5 ères + intrigues + trahisons + hommages, 18 rencontres de route, 5 crises × 3, 16 découvertes, ~20 événements, 9 cartes de rivale, ruines et revenants
- Test de cohérence du contenu V2 (`tests/v2.content.test.ts`)
- Bots V2 (`src/v2/sim/`: bots, sim, run avec `--transcript`, econ, sweep) et équilibrage (EXPERIENCES E4-E6) : `TUNING = { crisisK 1.2, envie 0.25 }`

## En cours
- Étape 2 : méta-progression (module pur `src/v2/core/meta.ts`)

## Reste à faire (dans l'ordre)
1. ~~Bots V2, mesures, équilibrage~~ (fait ; annoncer l'envie dans le présage)
2. Méta-progression (chronique, ruines, revenants, testament, déblocages) en module pur + tests
3. Enrichir le contenu là où les transcriptions montrent des répétitions ; relecture des textes
4. Interface V2 : scène ~40 % de hauteur, carte compacte, HUD (ressources, quartiers, familles), carrefour, procès, jalon, découverte, présage, chronique, fin, testament ; ruines et merveilles dans la scène ; portraits de famille qui vieillissent
5. Effets visuels rétablis (cible 30 i/s), son, animations ; tutoriel intégré
6. Retirer la V1 (code, tests) une fois la V2 jouable
7. Mesures finales, tests par agents (joueurs), juges (3, notes ≥ 8), captures ×3 passes, déploiement (page hébergée : le push GitHub est refusé en 403)

## Bloqué
- `git push` refusé (403, l'app GitHub n'a pas l'accès en écriture). Publication par page hébergée claude.ai : https://claude.ai/artifact/PMUcDUwFQCBGfv7Qgceqom
