# Citadeck — Design V2

> Ce document est écrit avant le code, puis complété par les résultats des prototypes (section 4) et le plan (section 5).

## 1. Diagnostic : pourquoi la V1 ennuie

Mesures faites sur la V1 (`src/sim/v1/diagnose.ts`, 400 parties d'un bot prudent) :

| Mesure | V1 | Ce que ça dit |
|---|---|---|
| Mort du joueur prudent à l'ère 3 | 37 % des parties | « J'ai perdu à l'ère 3 en cherchant l'équilibre » est le cas *typique*, pas un accident |
| Victoire d'un bot qui ne lit aucun texte | 40 % (meilleur bot) | Le texte ne sert à rien : tout ce qui compte est dans les flèches |
| Formes de dilemme | 1 (binaire, deux effets de jauge) | « Chaque dilemme a la même forme » |
| Cartes avec un personnage nommé | 0 sur 197 | Personne ne parle : « le chaman », « le sage » |
| Cartes qui dépendent d'un choix passé | 21 % des cartes tirées | Les choix pèsent rarement, et loin, noyés dans le reste |
| Textes au patron « X veut / propose / réclame » | 31 % | Une seule rhétorique |
| Décisions par partie | 88 | Long, parce que chaque décision pèse pareil |

Causes, de la plus profonde à la plus visible :

1. **Le seul but est négatif.** Survivre en évitant le rouge. Rien à accomplir, donc pas de fil rouge : la partie est une suite de cartes sans direction (H1 confirmée).
2. **La mort des deux côtés rend l'équilibre dominant.** Avec quatre jauges qui tuent à 0 *et* à 100, la seule stratégie est de recentrer. Toute spécialisation est punie. Le choix se réduit à un calcul : quelle option rapproche les jauges du milieu (H3 confirmée). C'est une règle du premier cahier des charges : elle est supprimée.
3. **L'aperçu donne la réponse.** Les flèches montrent tout l'effet de chaque option ; les effets cachés (16 % des options) sont faibles. Lire est inutile, donc on ne lit pas (H5 confirmée, mesurée : le meilleur bot ne lit rien).
4. **Le hasard tue plus que les décisions.** Le vent de l'ère, la montée des enjeux et les crises s'additionnent au moment où le deck tire mal : on meurt à l'ère 3 sans erreur identifiable. Le « sursis » ajouté en V1 soignait le symptôme.
5. **Les dilemmes sont isolés et anonymes.** Pas de personnages, pas d'intrigues qui montent et se dénouent, des suites rares et lointaines (H2, H8 confirmées).
6. **Le deck ne se sent pas.** On ajoute une carte par ère parmi une vingtaine ; ses effets sont des bonus de +2. Aucune carte ne crée d'option nouvelle ailleurs (H4 confirmée). Slay the Spire est absent : pas de routes, pas de risque choisi, pas de synergie qui change une décision.
7. **Civilization est un décor.** Pas de technologies à choisir, des merveilles offertes sans effort, une rivale qui n'est qu'un flux de cartes, une fin calculée en coulisse.
8. **Le rythme est plat.** Toutes les cartes pèsent pareil ; les crises sont trois cartes de plus. D'où la longueur ressentie (H6 confirmée).
9. **Aucune trace d'une partie à l'autre.** Pas de méta-progression : la défaite n'apprend rien et ne laisse rien.

Ce qui marche et qu'on garde : la direction artistique et la scène, la voix sèche et ironique des répliques, l'écran de défaite qui nomme les décisions coupables, la graine, la sauvegarde.

## 2. Concepts de boucle explorés

1. **Le Grand Dessein.** On choisit au départ un projet de civilisation (les étoiles, l'empire, la postérité). Chaque ère a un jalon, bâti ou manqué, visible dans le paysage. Donne le fil rouge et transforme la survie en moyen. *Classique, indispensable.*
2. **Les Lignées.** Les cartes sont des familles qui se souviennent de tout, de génération en génération. Humilier un chasseur à l'âge de pierre, et ses descendants mènent la grève générale dix mille ans plus tard. Chaque famille a une loyauté, une mémoire, un nom qui évolue avec les ères (Ourk, Ourkos, Sire Ourquin, Camarade Ourkov, Commandante Ourk-7). *Audacieux, candidat signature.*
3. **La cité comme barre de vie.** Plus de mort à 0 ou à 100. La vie, ce sont les quartiers de la cité, visibles dans la scène : on les gagne en grandissant, on les perd quand une crise ou une famille en colère frappe. Les quatre jauges deviennent des ressources à dépenser.
4. **Les extrêmes engendrent.** Une jauge très haute ne tue pas : elle fait naître une intrigue (une armée énorme fait rêver les généraux ; un trésor énorme attire la rivale). L'humour de Reigns sans sa mort arbitraire.
5. **Les Carrefours.** Entre deux saisons, on choisit sa route parmi deux ou trois, chacune avec son risque et sa récompense (marché, frontière, académie, chantier, inconnu). Le Slay the Spire du jeu.
6. **Les Ruines.** Une civilisation morte devient des ruines dans le paysage des suivantes. On peut les fouiller : on y trouve ses reliques, ses merveilles, et parfois ses vieilles rancunes. *Audacieux, candidat signature méta.*
7. **La course à la rivale.** La rivale a son propre horizon, qui grandit à gauche de l'écran. Elle construit les merveilles que vous tardez à bâtir et accueille les familles que vous trahissez.
8. **Qui envoyer ?** Certaines cartes ne proposent pas « oui ou non » mais « qui » : les options sont tirées de votre deck (quelle famille accuser, envoyer, sacrifier). Le deck devient la question.
9. **Remettre à plus tard.** Un troisième geste reporte n'importe quelle carte ; elle revient pire. *Audacieux, testé sur papier.*
10. **Le sablier.** Chaque option coûte des années ; l'ère finit quand le sablier est vide, on choisit quelles cartes affronter. *Audacieux.*
11. **Les prophéties scellées.** L'oracle annonce la crise de l'ère et des présages cachés, révélés plus tard. Le boss de Slay the Spire, raconté.
12. **Le pari.** Des options à issue incertaine, dont les chances dépendent du deck (combien de cartes Guerre, quelle famille est loyale).

## 3. Évaluation sur papier

| Concept | Fil rouge | Impact des choix | Lecture nécessaire | Variété | Coût | Verdict |
|---|---|---|---|---|---|---|
| Grand Dessein | +++ | ++ | + | + | moyen | gardé |
| Lignées | ++ | +++ | +++ | +++ | élevé (écriture) | gardé, signature |
| Cité-vie | + | ++ | + | + | moyen | à prototyper contre Reigns |
| Extrêmes engendrent | + | ++ | ++ | ++ | faible | gardé |
| Carrefours | ++ | ++ | + | ++ | moyen | à prototyper |
| Ruines | ++ (entre parties) | ++ | + | +++ | moyen | gardé, signature méta |
| Course rivale | ++ | ++ | + | + | moyen | gardé |
| Qui envoyer ? | + | ++ | ++ | +++ | faible | gardé (forme de dilemme) |
| Plus tard | 0 | + | + | + | élevé (deux versions de chaque carte) | abandonné |
| Sablier | + | + | 0 | + | élevé | abandonné : brouille le geste de Reigns |
| Prophéties | ++ | + | ++ | + | faible | gardé (crise annoncée) |
| Pari | 0 | + | ++ | ++ | faible | gardé (forme de dilemme) |

Trois boucles sont prototypées sans interface (section 4) :
- **P1 « Reigns + Dessein »** : la V1 avec un dessein à jalons et des familles qui se souviennent, mais la mort aux deux bouts et l'aperçu complet.
- **P2 « Lignées »** : ressources à dépenser (coûts visibles, gains dans le texte), cité-vie, familles à mémoire, crises annoncées dont les options dépendent du deck.
- **P3 « Lignées + Carrefours »** : P2 avec des routes à risque entre les saisons.

## 4. Prototypes et choix

Détail dans `EXPERIENCES.md` (E2, E3). À difficulté égale, **P3 « Lignées + Carrefours »** l'emporte sur toutes les mesures qui comptent : la lecture y est décisive (56 points d'écart entre un bot qui lit et un bot qui ne voit que les indicateurs), six stratégies y sont viables, le prudent survit (77 %) quand le gourmand meurt plus tôt, et les défaites forcées tombent à 5,5 %. P1, le cadre Reigns, rend le dessein inatteignable : c'est la preuve que la mort aux deux bouts était la racine de l'ennui.

## 5. Le jeu retenu

### En une phrase
*Les familles de votre cité se souviennent de tout : humiliez un chasseur à l'âge de pierre, et ses descendants mènent la grève générale dix mille ans plus tard.*

### La signature : les Lignées
Cinq familles fondatrices sont des cartes permanentes du deck. Chacune a un emblème, une couleur, une voix, une loyauté (de −3 à +3) et une mémoire de vos actes. À chaque ère, elle revient sous un nouveau nom (Ourk, Ourkos, Sire Ourquin, Colonel Ourkov, Amirale Ourk-7) et sa carte change selon ce que vous avez fait à ses ancêtres. Loyale, elle vous ouvre des options que personne d'autre n'a ; ulcérée, elle se révolte, coûte des quartiers, ou passe chez la rivale. Aucun des trois jeux d'inspiration n'a de rancune transmise par le deck.

### Le fil rouge : le Grand Dessein
Au départ, on choisit un dessein (les étoiles, l'empire, la postérité). Chaque ère a un jalon à bâtir, avec un coût et une exigence de deck, visible dans le paysage quand il est bâti. Les cinq jalons mènent à l'une des trois fins ; en manquer change la fin.

### La boucle d'une ère
1. **Ouverture** : la scène change de lumière ; l'ère annonce son jalon et sa crise (ce qui protège, ce qui expose).
2. **Deux saisons**. Chacune commence par un **carrefour** : trois routes, chacune avec son risque et sa récompense (terres fertiles, frontière, marché, académie, chantier, inconnu). La route amène une rencontre, puis quatre cartes du deck.
3. **La crise**, en trois scènes, avec des seuils annoncés et des options réservées aux decks qui l'ont préparée. Les dégâts sont des quartiers qui brûlent.
4. **Fin d'ère** : le jalon (bâti ou manqué), la croissance ou la famine, une technologie à étudier, une carte à recruter.

### Les ressources et la vie
- Vivres, Armée, Savoir, Trésor sont des **ressources à dépenser**, sans plafond mortel. Les coûts sont affichés sur les options ; les gains, les loyautés et les suites ne le sont pas : c'est le texte qui les dit.
- La **vie, ce sont les quartiers** de la cité, visibles dans la scène. On en gagne en grandissant, on en perd par la famine, les crises et les révoltes. Plus de quartiers : la chute.
- **Les extrêmes engendrent** : une armée énorme réveille l'ambition d'un général ; un trésor énorme attire la rivale.

### Slay the Spire
Deck qui grandit (une recrue par ère, achats au marché, cartes qu'on retire), routes à risque, synergies par mot-clé qui *ouvrent des options* au lieu d'ajouter +2, crise annoncée comme un boss.

### Civilization
Technologies à choisir (une par ère, payées en Savoir, qui débloquent options et bâtiments), merveilles à construire avant la rivale, rivale visible sur l'horizon avec sa reine et sa voix, trois fins par dessein.

### Formes de dilemme
Binaire ; « qui envoyer ? » (les options sont vos familles) ; pari aux chances annoncées ; dosage à trois niveaux ; carrefour ; crise à seuils ; choix de technologie ou de recrue.

### Méta-progression
- **La chronique** des civilisations passées : nom, dessein, ère atteinte, épitaphe.
- **Les ruines** : les dernières civilisations mortes restent dans le paysage. Une partie sur deux, on tombe sur leurs ruines : fouiller (relique), bâtir dessus (trésor), ou réveiller leurs fantômes.
- **Déblocages** : origines (conditions de départ), une sixième famille, merveilles et recrues supplémentaires, gagnés par des faits de partie.

### Ce qui est supprimé
La mort aux deux bouts, l'aperçu des gains, le vent de l'ère, la montée des enjeux, le sursis, les 197 cartes de la V1 (la moitié des textes de réplique, les meilleurs, sont réécrits dans la nouvelle voix).

### Plan
1. Moteur V2 sans interface + squelette de contenu qui traverse les 5 ères ; bots et mesures ; valider fil rouge, impact, méta.
2. Contenu complet : familles, événements, intrigues, crises, rivale, routes, institutions, technologies, merveilles, ruines.
3. Interface : scène à 40 %, carte compacte, HUD ressources + quartiers + familles, carrefours, crises, fin d'ère, chronique, fin.
4. Effets visuels rétablis (cible 30 images/s), son, animations.
5. Mesures finales, tests par agents, avocat du diable, juges.

## 6. Avocat du diable : objections et réponses

Un agent séparé, chargé de démolir ce design, a rendu huit risques et trois idées. Ce qui change :

| Objection | Réponse |
|---|---|
| La rancune persistante existe (Crusader Kings, King of Dragon Pass). Seul le nom qui change à chaque ère est neuf. | La signature devient **le reçu** : la famille cite votre décision mot pour mot, avec la date, dix mille ans plus tard. Voir « Le Procès ». |
| Cinq familles écrites en gabarits s'effondreront à la troisième partie. | **Quatre familles**, écrites à la main ère par ère, chacune avec 3 à 5 actes marquants qui ont leur propre réplique. Une famille est écrite de bout en bout avant les autres, pour tester la voix. |
| Validé sur contenu synthétique. | Les mesures sont refaites sur le vrai contenu ; des transcriptions sont relues par des agents avant l'interface. |
| Sans aperçu des gains, on devine. | Les options montrent ce qui est en jeu sans dire le sens : le coût chiffré, l'emblème de la famille touchée, un sablier si l'acte aura une suite. Textes de deux lignes. |
| Trop de systèmes. | **Fusions** : technologies et recrues deviennent une seule récompense de fin d'ère, la *découverte* (une carte avec un passif et un dilemme). Les merveilles *sont* les jalons du dessein. Un seul moyen de retirer une carte. Origines et déblocages viennent après le cœur. |
| Les extrêmes punissent : on recentre encore. | Les extrêmes offrent des cartes désirables : l'armée énorme rend le coup d'État *possible*, et c'est une option. |
| Le carrefour est un dilemme de plus, réglé par le calcul. | La route **choisit qui vous parle** : chaque famille a son domaine (le camp des Ourk, l'observatoire de Brume…) ; y aller, c'est affronter ses cartes. Une famille qu'on ne visite pas deux ères de suite le prend mal. |
| Crise annoncée = liste de courses. | On annonce la **nature** de la crise et ce qui protège, pas les seuils. Et une famille ulcérée peut **trahir pendant la crise** : c'est attribuable, mais pas annoncé. |
| Les déblocages diluent la signature ; les ruines seront ignorées. | Les ruines sont **obligatoires et personnelles** : la famille la plus furieuse de la civilisation morte revient dans la suivante, et cite ce que vous lui aviez fait. |
| Pas de méchant. | La rivale a une reine qui écrit des lettres, et une dynastie, comme vos familles. Elle poursuit son propre dessein, visible sur son horizon : c'est une course. |
| Les familles ne parlent qu'à vous. | Rivalités croisées : Ourk méprise Brume (la force contre le savoir), Sel méprise Troc (la foi contre l'argent). Favoriser l'une froisse l'autre. |
| Pas de moment à raconter. | **Le Procès** à chaque fin d'ère et **le testament** à la mort ; l'écran de fin est une chronique en cinq lignes, faite pour la capture. |

### Le Procès de l'ère (idée retenue)
À chaque fin d'ère, la famille la plus lésée vous traduit en justice. Elle cite la décision qui l'a le plus blessée, mot pour mot, avec sa date (« An 3 de l'âge de pierre : vous avez dit "Qu'il mange le louveteau" »). Vous choisissez votre avocat parmi vos autres familles : c'est leur loyauté qui plaide. Si aucune famille n'est lésée, la plus dévouée vous rend hommage, et cite elle aussi.

### Le portrait qui vieillit (idée retenue)
L'emblème de chaque famille change avec les ères (les crocs des Ourk prennent un casque, puis des rouages) et porte une cicatrice quand la famille vous en veut.

### Le testament (idée retenue)
À la chute, vous choisissez vos derniers mots parmi trois. La civilisation suivante les trouve gravés dans vos ruines, lus à voix haute par la famille qui vous haïssait.

### Les quatre familles
| Famille | Mot-clé | Ressource | Méprise | Noms au fil des ères |
|---|---|---|---|---|
| Ourk | Guerre | Armée | Brume | Ourk, Ourkos, Sire Ourquin, Colonel Ourkov, Amirale Ourk-7 |
| Sel | Foi | Vivres | Troc | Mère Sel, Sélènè la Pythie, Abbesse Salière, Monseigneur Salin, Révérende Sel |
| Brume | Science | Savoir | Ourk | Le vieux Brume, Brumos le Mesureur, Frère Brumaire, Docteur Brumel, BRUME |
| Troc | Commerce | Trésor | Sel | Troc, Trokos l'Armateur, Maître Troquet, Troc et Fils, TrocCorp |

### Une ère, révisée
Ouverture (jalon, nature de la crise) → deux saisons (carrefour : quel domaine visiter ; puis quatre cartes) → crise en trois scènes → fin d'ère : le Procès, le jalon, une découverte. Environ 15 décisions par ère, 75 par partie, de sept formes différentes.
