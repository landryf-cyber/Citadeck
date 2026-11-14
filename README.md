# Citadeck

*Les familles se souviennent de tout.*

Un jeu de cartes jouable dans le navigateur, sur mobile et sur ordinateur. On guide une cité de l'âge de pierre
à l'ère spatiale, une décision à la fois. Quatre familles y vivent — les guerriers Ourk, les prêtresses Sel,
les savants Brume, les marchands Troc — et elles n'oublient rien : humiliez un chasseur à l'âge de pierre,
et ses descendants mènent la grève générale dix mille ans plus tard, en vous citant mot pour mot.

## Jouer

```bash
npm install
```

```bash
npm run dev
```

Puis ouvrir l'adresse affichée (par défaut http://localhost:5173).

- **Une carte = un dilemme.** On choisit une option (toucher, cliquer, ou touches 1 à 4). Le **coût** d'une
  option est affiché, ainsi que ce qu'elle consomme si elle tient un seuil, et ce qu'elle rapporte en
  fourchette (« +3–5 Trésor ») : large au début, plus fine avec la Science et les merveilles, exacte en fin de
  partie, ou tout de suite contre un peu de Savoir (« Voir les chiffres exacts »). Les souvenirs et les suites
  sont dans le texte. Les pastilles disent de combien chaque famille y gagne (▲) ou y perd (▼), « ? » si cela dépend de
  l'issue ; le sablier annonce une suite. Un crédit annonce son prix et son échéance ; le compte à rebours
  s'affiche sous le Trésor, et l'écran « Votre civilisation » liste les dettes et promesses.
- **La cité, ce sont ses quartiers.** À zéro quartier, elle tombe. Quatre réserves se dépensent : Vivres,
  Armée, Savoir, Trésor.
- **Une ère** : un présage (une phrase, l'objectif, la menace, la rivale), des saisons où l'on choisit sa route
  (une famille, la frontière ou l'inconnu), le chantier de la merveille, la crise, puis le bilan, la croissance,
  le procès de la famille la plus lésée et une découverte. Cinq ères, **chacune avec sa forme**, comme les actes
  d'un jeu :
  - I **L'Errance** : trois saisons courtes ; la tribu chasse (+2 Vivres par saison) mais ne porte pas tout ;
    la crise tombe d'un bloc.
  - II **La Contagion** : chaque saison s'ouvre sur une colonie à fonder (en soldats et en Trésor ; une colonie se
    nourrit elle-même) ; la crise se répand, une carte par saison.
  - III **Le Conseil** : un vote ouvre chaque saison ; la famille la moins fidèle trahit dès qu'elle vous en veut ;
    la paix civile vaut un quartier.
  - IV **La Course** : quatre saisons éclair ; la rivale avance à chaque saison et finit sa merveille à la
    troisième ; le chantier ouvre aux deuxième et troisième saisons ; bâtir avant elle, ou subir une crise éclair
    plus dure.
  - V **Le Jugement** : une seule saison, plus aucun revenu ; vos actes sont jugés au sortir de la saison, avant
    le dernier chantier et la dernière crise.
- **Les crises mordent** : aucune sortie gratuite qui rapporte ; sacrifier une famille coûte ce qu'elle apportait ;
  une merveille ou une découverte peut racheter un quartier perdu, un peu plus cher à chaque fois.
- **Le grand dessein** : toucher les étoiles, soumettre la vallée ou être chantés pour toujours. Cinq
  merveilles à bâtir, pendant que la rivale bâtit les siennes. Chaque merveille attire aussi les crises.
- **Après la partie** : on grave les derniers mots de la civilisation. Ils lèguent quelque chose à la suivante,
  qui trouvera ses ruines sur la colline. La chronique garde toutes les civilisations ; certaines parties
  débloquent des origines (Gens du Fleuve, Héritiers, avec leurs règles et leurs cartes), des merveilles, des
  découvertes et un mode plus dur. La première partie ne demande qu'un choix : le dessein (un conseil est
  présélectionné) ; l'origine arrive à la partie suivante.
- La partie est sauvegardée à chaque décision.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | vérification des types puis build statique dans `dist/` |
| `npm run preview` | sert le build de production |
| `npm test` | tests du moteur, du contenu et de la méta-progression |
| `npm run sim -- 200` | 200 parties par profil de bot : survie, stratégies viables, lecture nécessaire… |
| `npm run sim -- --transcript lecteur 7` | transcription lisible d'une partie dans `shots/transcripts/` |
| `npm run campaign -- 10` | dix parties reliées par la méta (chronique, testaments, ruines, déblocages) |
| `npm run sweep -- '[{"crisisK":1.2}]' 60` | balayage de réglages d'équilibrage |
| `npm run shots` | captures de chaque écran, mobile et bureau, dans `shots/` |
| `npm run perf -- 2` | images par seconde sur un profil mobile (CPU ralenti ×2) |
| `npm run dominance` | cherche les options dominées dans des états de jeu réels (le test l'exige à zéro) |
| `npm run repeats` | répliques relues dans une partie et d'une partie à l'autre |
| `npm run structure` | similarité de structure entre les ères et entre les parties |
| `npm run blind` | énoncé du test à l'aveugle : dix ères décrites par leur seule mécanique |
| `npx tsx scripts/verify.ts` | rejoue dans l'interface quatre situations délicates (révolte annoncée, palissade, disette, nom de la cité) |
| `npx tsx scripts/eras.ts` | captures des cinq formes d'ère |
| `npx tsx scripts/illus.ts tout` | planche de toutes les illustrations de cartes |
| `npm run single` | le jeu en un seul fichier HTML, dans `dist-single/` |
| `npx tsx scripts/play.ts new <dossier>` | jouer en mode texte, une décision par commande (voir l’en-tête du script) |

Les scripts de capture utilisent le Chromium de `/opt/pw-browsers/chromium`.

## Ajouter une carte

Les cartes sont des données, dans `src/data/`. Aucune logique à toucher.

1. Choisir le fichier : `ourk.ts`, `sel.ts`, `brume.ts`, `troc.ts` (cartes de famille, une par ère et plus),
   `events.ts` (événements d'ère et cartes de la rivale), `encounters.ts` (rencontres des routes),
   `crises.ts`, `discoveries.ts`.
2. Ajouter une entrée :

```ts
card({
  id: 'troc_moulin', kind: 'famille', family: 'troc', eras: [2], tags: ['Commerce'], art: { motif: 'gear' },
  title: 'Le Moulin',
  text: '{F:troc} veut le monopole du moulin. « Prix d’ami : le pain à deux pièces, l’amitié en sus. »',
  options: [
    { label: 'Accorder le monopole', effect: { gain: $('T5'), loy: { troc: 1, sel: -1 }, mem: ['moulin_troc'] },
      reply: 'Le pain est cher. {F:troc} est gras.' },
    { label: 'Un moulin par quartier', cost: $('T3'), effect: { gain: $('V4'), loy: { troc: -1 },
      sched: [{ card: 'troc_moulin_2', in: 6 }] }, reply: 'Trois moulins, trois meuniers fâchés.' },
  ],
}),
```

- `cost` est affiché au joueur ; de `gain`, une fourchette (pas le montant exact) ; de `loy`
  (loyautés), l'effet exact (▲ ▼, avec le contrecoup sur la famille rivale) : le texte dit le reste. Une option
  payante sans suite cachée est automatiquement rendue au moins aussi rentable que l'option gratuite de la carte.
- `mem` crée un souvenir : la décision exacte et sa date sont gardées. Plus tard, une carte peut la citer avec
  `{Q:moulin_troc}` (la phrase entre guillemets) et `{D:moulin_troc}` (sa date), ou n'apparaître que si le
  souvenir existe (`cond: { mem: 'moulin_troc' }`).
- `sched` programme une suite (le joueur voit un sablier). `if / then / else` rend un effet conditionnel
  (réserves, loyauté, souvenir, mot-clé). `bet` fait un pari dont la chance est affichée. `warn` affiche un
  seuil (« Sans 5 Armée, un quartier brûle »).
- Gabarits : `{F:troc}` le chef de famille de l'ère, `{H:troc}` la famille, `{rival}`, `{reine}`, `{cite}`,
  `{date}`, et des clauses `{?mem:x|si oui|sinon}`, `{?loy:ourk>=2|…|…}` (voir `src/core/text.ts`).
- `$('V2 A-3 S1 T4')` écrit un paquet de ressources (Vivres, Armée, Savoir, Trésor).
- `scale: true` fait grandir coûts et gains avec les ères.
- Texte et réplique peuvent avoir des variantes séparées par `‖` (« A‖B‖C ») : le jeu prend la suivante à chaque
  retour, et deux parties de suite ne lisent pas les mêmes.
- L'illustration se choisit seule (genre de la carte, famille, route, crise) ; pour un événement, c'est
  `art.motif` qui décide de la scène (voir `MOTIF_SCENE` dans `src/ui/illus.ts`).

3. Lancer `npm test` (références, longueurs, gabarits non résolus, parties sans blocage), puis `npm run sim`
   pour vérifier que l'équilibre tient et `npm run sim -- --transcript lecteur 7` pour relire une partie.

## Organisation

```
src/core/     moteur pur et testable : état, ères, familles et souvenirs, procès, crises, méta-progression
src/data/     tout le contenu : familles, routes, rencontres, crises, découvertes, événements, desseins
src/scene/    la cité visible : Canvas 2D, lumière par ère, quartiers, familles, merveilles, rivale, ruines
src/ui/       interface (DOM/CSS), illustrations SVG dessinées par le code (illus.ts, portrait.ts), sauvegarde, rejeu
src/sim/      bots, mesures, transcriptions, campagnes, balayages
src/proto/    les prototypes de boucle comparés avant la V2
scripts/      captures, mesure de performance, version en un seul fichier
```

## Documents

- `DESIGN-V2.md` : le diagnostic de la première version, les douze concepts explorés, le choix, le jeu retenu,
  la voix des personnages.
- `EXPERIENCES.md` : le journal des expériences (hypothèse, changement, test, résultat, décision).
- `DECISIONS.md` : les décisions prises et leurs raisons. `PROGRESS.md` : l'avancement.

## Choix techniques

- **Rendu** : DOM/CSS pour la carte et l'interface, Canvas 2D pour la scène en trois calques superposés que le
  compositeur assemble (fond en demi-résolution, cité redessinée à la demande, éléments vivants à chaque image
  sur une toile plus légère, car tout y est flou) ; la parallaxe déplace les calques sans les repeindre, et les
  voiles de crise et de danger sont des calques dont seule l'opacité change. Tous les effets sont actifs au
  départ ; la qualité ne baisse d'elle-même que sous 30 images par seconde (mesuré : 30 à 39 i/s dans les cinq
  ères, tous effets, CPU ralenti ×2 et sans GPU). `prefers-reduced-motion` est respecté (et réglable).
- **Aucun fichier d'image ni de son** : chaque carte a une scène SVG dessinée par le code (portraits en
  situation, lieux, crises, événements, découvertes), décor dessiné par code, son en WebAudio.
  Seules deux polices (Cinzel, Source Sans 3, licence OFL) sont embarquées.
- **Déterminisme** : une graine et la liste des choix suffisent à rejouer une partie (c'est ainsi que la fin
  montre dix mille ans en quelques secondes).

## Déploiement

Le jeu est un site statique. Le workflow `.github/workflows/deploy.yml` teste, construit et publie sur GitHub
Pages à chaque push sur `main` (activer une fois *Settings → Pages → Source : GitHub Actions*).
`npm run single` produit aussi une version en un seul fichier HTML, publiable n'importe où.
