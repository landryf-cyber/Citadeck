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
  option est affiché ; ce qu'elle rapporte, et ce que les familles en penseront, est dans le texte. Les
  pastilles indiquent seulement quelles familles sont concernées, le sablier qu'il y aura une suite.
- **La cité, ce sont ses quartiers.** À zéro quartier, elle tombe. Quatre réserves se dépensent : Vivres,
  Armée, Savoir, Trésor.
- **Une ère** : un présage (la merveille à bâtir, la crise qui vient, ce qui en protège), deux saisons où l'on
  choisit sa route (une famille, la frontière ou l'inconnu), le chantier de la merveille, la crise, puis le bilan,
  la croissance, le procès de la famille la plus lésée et une découverte. Cinq ères.
- **Le grand dessein** : toucher les étoiles, soumettre la vallée ou être chantés pour toujours. Cinq
  merveilles à bâtir, pendant que la rivale bâtit les siennes. Chaque merveille attire aussi les crises.
- **Après la partie** : on grave les derniers mots de la civilisation. Ils lèguent quelque chose à la suivante,
  qui trouvera ses ruines sur la colline. La chronique garde toutes les civilisations ; certaines parties
  débloquent des origines, des merveilles, des découvertes et un mode plus dur.
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

- `cost` est affiché au joueur ; `gain`, `loy` (loyautés) et `quartiers` ne le sont pas : le texte doit les
  laisser deviner.
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

3. Lancer `npm test` (références, longueurs, gabarits non résolus, parties sans blocage), puis `npm run sim`
   pour vérifier que l'équilibre tient et `npm run sim -- --transcript lecteur 7` pour relire une partie.

## Organisation

```
src/core/     moteur pur et testable : état, ères, familles et souvenirs, procès, crises, méta-progression
src/data/     tout le contenu : familles, routes, rencontres, crises, découvertes, événements, desseins
src/scene/    la cité visible : Canvas 2D, lumière par ère, quartiers, familles, merveilles, rivale, ruines
src/ui/       interface (DOM/CSS), illustrations SVG génératives, sauvegarde, rejeu de la partie
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

- **Rendu** : DOM/CSS pour la carte et l'interface, Canvas 2D pour la scène en trois passes (fond en
  demi-résolution, cité redessinée à la demande, éléments vivants à chaque image). Tous les effets sont actifs
  au départ ; la qualité ne baisse d'elle-même que sous 30 images par seconde. `prefers-reduced-motion` est
  respecté (et réglable).
- **Aucun fichier d'image ni de son** : illustrations en SVG généré, décor dessiné par code, son en WebAudio.
  Seules deux polices (Cinzel, Source Sans 3, licence OFL) sont embarquées.
- **Déterminisme** : une graine et la liste des choix suffisent à rejouer une partie (c'est ainsi que la fin
  montre dix mille ans en quelques secondes).

## Déploiement

Le jeu est un site statique. Le workflow `.github/workflows/deploy.yml` teste, construit et publie sur GitHub
Pages à chaque push sur `main` (activer une fois *Settings → Pages → Source : GitHub Actions*).
`npm run single` produit aussi une version en un seul fichier HTML, publiable n'importe où.
