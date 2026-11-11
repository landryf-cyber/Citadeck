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
