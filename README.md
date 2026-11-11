# Citadeck

*Le deck est la cité.*

Un roguelite de cartes jouable dans le navigateur, sur mobile et sur ordinateur. On guide une civilisation
de l'âge de pierre à l'ère spatiale, une décision à la fois. Chaque carte est un dilemme que l'on tranche
en la glissant à gauche ou à droite. Les cartes que l'on ajoute au deck entre deux ères sont les dilemmes
que l'on affrontera plus tard : construire son deck, c'est choisir ses futurs problèmes.

## Jouer

```bash
npm install
```

```bash
npm run dev
```

Puis ouvrir l'adresse affichée (par défaut http://localhost:5173).

- **Tactile** : glisser la carte. **Souris** : glisser, ou cliquer une option. **Clavier** : flèche gauche ou
  droite pour pencher la carte et voir l'aperçu, la même flèche une seconde fois pour trancher.
- Quatre jauges : Nourriture, Armée, Savoir, Trésor. À 0 ou à 100, la partie s'arrête.
- Une ère = le deck parcouru une fois, puis une crise. Cinq ères, trois fins.
- La partie est sauvegardée à chaque décision. La graine affichée à la fin permet de rejouer la même partie.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | vérification des types puis build statique dans `dist/` |
| `npm run preview` | sert le build de production |
| `npm test` | tests du moteur, du contenu et de l'équilibrage |
| `npm run sim` | simulation : des milliers de parties, vérification des cibles d'équilibrage |
| `npm run autotune` | rééquilibre les options trop souvent choisies, écrit `src/data/adjust.ts` |
| `npm run shots` | captures de chaque écran, mobile et desktop, dans `shots/` |
| `npm run play` | parties complètes jouées par l'interface, journal tour par tour |
| `npm run perf` | images par seconde sur un profil mobile |

Options utiles : `npm run sim -- --games 500 --cards`, `npm run shots -- --dist era2`,
`npm run play -- --until-all --log`, `npm run perf -- 4`.

### Chromium pour les scripts

Les scripts utilisent Playwright. S'il ne trouve pas son navigateur, ils essaient dans l'ordre la variable
`PW_CHROMIUM`, `/opt/pw-browsers/chromium`, puis un `chromium` ou `google-chrome` du système. Dans
l'environnement où le jeu a été développé, le téléchargement de Playwright ne correspondait pas à la version
installée : c'est le Chromium déjà présent dans `/opt/pw-browsers` qui a servi.

## Ajouter une carte

Les cartes sont des données, dans `src/data/`. Aucune logique à toucher.

1. Choisir le fichier : `era0.ts` à `era4.ts` (cartes propres à une ère), `rewards.ts` (cartes proposées
   entre deux ères, qui restent dans le deck), `consequences.ts`, `rival.ts`, `crises.ts`.
2. Ajouter une entrée :

```ts
card({
  id: 'e2_moulin', title: 'Le Moulin', kind: 'era', era: 2, kw: ['Commerce'],
  text: 'Le meunier veut un monopole. Il a déjà la seule roue.',
  //                     D(nourriture, armée, savoir, trésor)
  left: opt('Accorder', { delta: D(6, 0, 0, 8), scale: [{ keyword: 'Commerce', delta: D(0, 0, 0, 2) }] }, 'Le pain est cher. Le meunier, gras.'),
  right: opt('Refuser', { delta: D(-5, 4, 3, 0), add: [{ card: 'q_bandits', delay: 6 }] }, 'Trois moulins. Trois meuniers fâchés.'),
  art: { motif: 'gear' },
}),
```

- `scale` : bonus par autre carte du deck portant ce mot-clé (les synergies).
- `add` : carte ajoutée plus tard (`delay` en tours) : les conséquences à retardement.
- `when / then / else` : effet conditionnel (jauge, mot-clé, drapeau, relation avec la rivale).
- `variants` : habillage différent selon l'ère (voir `starters.ts`).
- `art.motif` : l'un des vingt motifs de `src/ui/art.ts`.

3. Lancer `npm test` (références, longueurs, coût des deux côtés), puis `npm run sim -- --cards` pour voir si
   une option domine, et `npm run autotune` pour la rééquilibrer.

Les crises et leurs cartes sont dans `crises.ts`, les merveilles dans `wonders.ts`, les ères (enjeux, vent)
dans `eras.ts`.

## Organisation

```
src/core/     moteur pur et testable : jauges, deck, ères, crises, merveilles, rivale, fins, RNG à graine
src/data/     tout le contenu, plus les tables d'équilibrage (tuning.ts, adjust.ts)
src/scene/    la civilisation visible : Canvas 2D, lumière par ère, silhouettes, particules
src/ui/       carte (DOM/CSS), jauges, écrans, illustrations SVG génératives
src/audio/    ambiance et retours sonores synthétisés en WebAudio
src/sim/      bots, simulation, cibles, équilibreur
scripts/      captures, parties automatiques, mesure de performance
```

## Choix principaux

- **Rendu** : la carte est en DOM/CSS (texte net, transformations fluides), la scène en Canvas 2D en trois
  passes (fond en demi-résolution, cité redessinée à la demande, éléments vivants à chaque image). La qualité
  baisse d'elle-même si les images ralentissent, et `prefers-reduced-motion` est respecté.
- **Aucun fichier d'image ni de son** : illustrations en SVG généré, décor dessiné par code, son en WebAudio.
  Seules les deux polices (Cinzel, Source Sans 3, licence OFL) sont embarquées.
- **Le deck** : six cartes de départ qui changent d'habit à chaque ère, les cartes choisies entre les ères,
  et sept cartes tirées du pool de l'ère en cours.
- **La tension** : les enjeux montent d'ère en ère, et chaque ère pousse une jauge à chaque décision
  (le « vent de l'ère »). La zone de danger commence à 30 et 70.
- **L'équilibrage est outillé** : `npm run sim` vérifie les cibles, `npm run autotune` corrige les options
  dominantes. Les valeurs écrites dans les cartes sont corrigées par `tuning.ts` puis `adjust.ts`.

Le détail des décisions et de leurs raisons est dans `DECISIONS.md`, l'avancement dans `PROGRESS.md`.

## Déploiement

Le jeu est un site statique. Le workflow `.github/workflows/deploy.yml` teste, construit avec la bonne base
d'URL et publie sur GitHub Pages à chaque push sur `main`. Il faut activer Pages une fois :
*Settings → Pages → Build and deployment → Source : GitHub Actions*.
L'adresse sera `https://<compte>.github.io/<dépôt>/`.
