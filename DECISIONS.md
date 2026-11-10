# DECISIONS — Citadeck

Décisions prises en autonomie, avec leur raison.

1. **Le nom reste « Citadeck ».** Le brief donne le nom et demande aussi d'en trouver un. « Citadeck » (cité + deck) porte déjà l'idée centrale : le deck est la cité. Sous-titre : « Le deck est la cité. »
2. **Pile de rendu : DOM/CSS pour la carte, Canvas 2D pour la scène.** La carte a besoin d'un texte net et d'une transformation 3D fluide (CSS le fait mieux que tout). La scène est faite de silhouettes, d'aplats et de halos additifs : Canvas 2D suffit, tient 60 fps sur mobile et évite la fragilité d'un pipeline WebGL. Aucune dépendance d'exécution hors fontes.
3. **L'aperçu montre le sens et l'intensité, pas la valeur.** Reigns cache le sens ; ici une flèche (haut/bas, simple/double) apparaît sur chaque jauge touchée. Le brief demande des décisions « rapides et instinctives » : cacher le sens transformerait chaque carte en devinette.
4. **Structure du deck : cartes persistantes + paquet d'ère.** Le deck du joueur (départ, récompenses) revient à chaque ère ; chaque ère y mêle 7 cartes tirées d'un pool propre à l'époque. Sans paquet d'ère, l'âge spatial rejouerait les dilemmes de l'âge de pierre.
5. **Conséquences à retardement = cartes à usage unique planifiées N tours plus tard.** Le joueur revoit littéralement sa décision revenir sous forme de carte.
6. **La rivale est un flux de cartes, pas une simulation.** Une relation (−100..100) choisit le registre (hostile, neutre, amical) des cartes qu'elle injecte toutes les ~6 cartes.
7. **La fin est calculée, puis infléchie par la dernière crise.** Score par voie (mots-clés du deck + jauges + choix de la crise finale).
