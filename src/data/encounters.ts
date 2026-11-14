/** Rencontres des routes : une par saison, selon le domaine choisi au carrefour. */
import { $, card } from './dsl';

export const encounterCards = [
  // ------------------------------------------------------------------ chez les Ourk
  card({
    id: 'r_ourk_recrue', kind: 'rencontre', scale: true, family: 'ourk', art: { motif: 'shield', hue: 8 },
    title: 'La Recrue',
    text: 'Un jeune cousin de {F:ourk} veut entrer dans la garde. Il a tout : la force, la fougue, et une haine sincère pour {H:brume}, qui l’ont recalé à l’école.',
    options: [
      { label: 'Engagé', cost: $('V2'), effect: { gain: $('A4'), loy: { ourk: 1, brume: -1 } }, reply: 'Il garde la porte de {H:brume}. Il la garde très, très près.' },
      { label: 'Qu’il repasse l’école', effect: { gain: $('S2'), loy: { ourk: -1, brume: 1 } }, reply: 'Il repasse l’école. Il la repasse en tenue de combat.' },
    ],
  }),
  card({
    id: 'r_ourk_defile', kind: 'rencontre', scale: true, family: 'ourk', art: { motif: 'crown', hue: 8 },
    title: 'Le Défilé',
    text: '{F:ourk} veut un défilé. « Le peuple doit voir sa force. » Le peuple a vu. Le peuple voudrait surtout voir le dîner.',
    options: [
      { label: 'Un défilé', cost: $('T3'), effect: { gain: $('A3'), loy: { ourk: 2 }, rival: -1 }, reply: '{Rival} ont envoyé des observateurs. Ils ont pris beaucoup de notes, et un peu peur.' },
      { label: 'Un banquet', cost: $('V3'), effect: { loy: { ourk: 1, sel: 1 } }, reply: 'Le banquet a dégénéré en défilé. Ourk a défilé sur la table.' },
      { label: 'Ni l’un ni l’autre', effect: { gain: $('T2'), loy: { ourk: -1 } }, reply: '{F:ourk} défile tout seul, dans sa cour. Les voisins applaudissent par prudence.' },
    ],
  }),
  card({
    id: 'r_ourk_trophee', kind: 'rencontre', scale: true, family: 'ourk', art: { motif: 'skull', hue: 8 },
    title: 'Le Trophée',
    text: '{H:ourk} ont ramené un trophée de chez {rival} : une statue de {reine}. Ils voudraient la mettre sur la place. À l’envers.',
    options: [
      { label: 'À l’envers', effect: { gain: $('A2 T2'), loy: { ourk: 1 }, rival: -1 }, reply: 'La statue trône à l’envers. {Reine} vous écrit. {Elle} souligne trois fois le mot « inacceptable ».' },
      { label: 'La rendre', cost: $('A1'), effect: { rival: 2, loy: { ourk: -1 } }, reply: '{Reine} vous remercie. {Elle} remarque qu’il manque le nez.' },
    ],
  }),

  // ------------------------------------------------------------------ chez les Sel
  card({
    id: 'r_sel_miracle', kind: 'rencontre', scale: true, family: 'sel', art: { motif: 'sun', hue: 44 },
    title: 'Le Miracle',
    text: '{F:sel} annonce un miracle pour demain : les greniers vont se remplir. « Le ciel me l’a dit. Il faudrait juste avancer un peu de grain. Le ciel ne fait pas crédit. »',
    options: [
      { label: 'Avancer le grain', cost: $('V3'),
        effect: { bet: { chance: 0.55, per: { tag: 'Foi', bonus: 0.15 },
          win: { gain: $('V8'), loy: { sel: 2 }, reply: 'Les greniers débordent. Personne ne sait d’où vient le grain. Surtout pas les voisins, qui en ont moins.' },
          lose: { loy: { sel: 1 }, reply: 'Pas de miracle. {F:sel} explique que le ciel était occupé. Il garde le grain, pour le prochain.' } } } },
      { label: 'Pas de miracle à crédit', effect: { gain: $('T2'), loy: { sel: -1 } }, reply: '{F:sel} vous regarde comme on regarde quelqu’un qui sera puni. Plus tard. Par quelqu’un d’autre.' },
    ],
  }),
  card({
    id: 'r_sel_relique', kind: 'rencontre', eras: [1, 2, 3, 4], scale: true, family: 'sel', art: { motif: 'hand', hue: 44 },
    title: 'La Relique',
    text: '{H:sel} ont trouvé la relique d’un saint : un os. {F:troc} propose de l’acheter, de la découper et de vendre les morceaux.',
    options: [
      { label: 'Un sanctuaire', cost: $('T3'), effect: { gain: $('V4'), loy: { sel: 2, troc: -1 } }, reply: 'Des pèlerins viennent de loin pour voir l’os. C’est un os de chèvre. Personne n’a vérifié.' },
      { label: 'Vendre à Troc', effect: { gain: $('T6'), loy: { sel: -2, troc: 2 } }, reply: '{F:troc} vend des morceaux de saint dans tout le pays. Le saint avait, en tout, quarante tibias.' },
    ],
  }),
  card({
    id: 'r_sel_jeune', kind: 'rencontre', scale: true, family: 'sel', art: { motif: 'eye', hue: 44 },
    title: 'Le Jeûne',
    text: '{F:sel} prescrit un grand jeûne pour apaiser le ciel. « Le ciel aime voir les gens maigres. Il est un peu bizarre, le ciel. »',
    options: [
      { label: 'Jeûnons', effect: { gain: $('V5'), loy: { sel: 2, ourk: -1 } }, reply: 'Tout le monde jeûne. {F:ourk} jeûne entre les repas.' },
      { label: 'Fête à la place', cost: $('V3'), effect: { loy: { sel: -1, ourk: 1, troc: 1 } }, reply: 'Une fête. Le ciel, dit-on, était furieux. Il a quand même mangé un peu.' },
    ],
  }),

  // ------------------------------------------------------------------ chez les Brume
  card({
    id: 'r_brume_eleve', kind: 'rencontre', scale: true, family: 'brume', art: { motif: 'scroll', hue: 205 },
    title: 'L’Élève',
    text: 'L’élève de {F:brume} a eu une idée meilleure que celle de son maître. {F:brume} demande qu’on l’exile. « Pour son bien, évidemment. »',
    options: [
      { label: 'Garder l’élève', effect: { gain: $('S5'), loy: { brume: -1 } }, reply: 'L’élève invente une chose formidable. {F:brume} explique qu’il l’avait inventée avant, mais en mieux.' },
      { label: 'Exiler l’élève', effect: { gain: $('S1'), loy: { brume: 2 }, rival: -1 }, reply: 'L’élève part chez {rival}. Il y invente une chose formidable. Pour eux.' },
    ],
  }),
  card({
    id: 'r_brume_erreur', kind: 'rencontre', eras: [2, 3, 4], scale: true, family: 'brume', art: { motif: 'spiral', hue: 205 },
    title: 'L’Erreur de calcul',
    text: '{F:brume} a trouvé une erreur dans les calculs de l’ancêtre. La Terre ne tourne pas dans le bon sens. « Il faudrait tout recalculer. Ça coûte. »',
    options: [
      { label: 'Tout recalculer', cost: $('T3'), effect: { gain: $('S6'), loy: { brume: 2 } }, reply: 'Tout est recalculé. La Terre tourne dans le bon sens. Elle ne s’est aperçue de rien.' },
      { label: 'Elle tourne, c’est bien', effect: { gain: $('V2'), loy: { brume: -1 } }, reply: '{F:brume} soupire si fort que la Terre ralentit. Un peu. Il a mesuré.' },
    ],
  }),
  card({
    id: 'r_brume_machine', kind: 'rencontre', eras: [1, 2, 3, 4], scale: true, family: 'brume', art: { motif: 'gear', hue: 205 },
    title: 'La Machine',
    text: '{F:brume} a construit une machine qui fait le travail de dix {T:ourk}. Elle fait aussi le bruit de dix {T:ourk}.',
    options: [
      { label: 'Construire les machines', cost: $('S3'), effect: { gain: $('T5'), loy: { brume: 1, ourk: -1 } }, reply: 'Les machines travaillent. {H:ourk} cherchent du travail. Ils ont trouvé : surveiller les machines.' },
      { label: 'Une seule, pour voir', effect: { gain: $('S2 V1') }, reply: 'La machine fonctionne. Elle fonctionne même la nuit, ce qui inquiète les voisins.' },
    ],
  }),

  // ------------------------------------------------------------------ chez les Troc
  card({
    id: 'r_troc_marche', kind: 'rencontre', scale: true, family: 'troc', art: { motif: 'coin', hue: 150 },
    title: 'Le Marché',
    text: '{F:troc} vous fait visiter le marché. Tout est à vendre. « Même ça. Surtout ça. Et ça aussi, mais c’est plus cher. »',
    options: [
      { label: 'Acheter des vivres', cost: $('T3'), effect: { gain: $('V5') }, reply: 'Des vivres de première qualité. Les étiquettes disent « première qualité ». C’est déjà ça.' },
      { label: 'Acheter des armes', cost: $('T3'), effect: { gain: $('A4') }, reply: 'Des armes neuves. {F:troc} a vendu les mêmes à {rival}, pour être juste.' },
      { label: 'Vendre les réserves', effect: { gain: $('T5 V-3'), loy: { troc: 1 } }, reply: 'Vendu. {F:troc} revendra vos réserves à vos voisins, qui vous les revendront cet hiver.' },
    ],
  }),
  card({
    id: 'r_troc_contrat', kind: 'rencontre', scale: true, family: 'troc', art: { motif: 'scroll', hue: 150 },
    title: 'Le Contrat',
    text: '{F:troc} propose un contrat d’exclusivité : tout votre commerce passera par sa maison. En échange, une avance. « C’est sans risque. Pour moi. »',
    options: [
      { label: 'Signer', effect: { gain: $('T7'), loy: { troc: 2, sel: -1 }, mem: ['troc_exclusif'] }, reply: 'Signé. Vos marchands travaillent désormais pour {F:troc}. Ils ont reçu un badge.' },
      { label: 'Négocier', cost: $('S2'), effect: { gain: $('T4'), loy: { troc: 1 } }, reply: 'Vous avez négocié. {F:troc} est impressionné. Il a quand même gagné.' },
      { label: 'Refuser', effect: { loy: { troc: -1 }, gain: $('V2') }, reply: '{F:troc} vous serre la main. Il compte ses doigts après.' },
    ],
  }),
  card({
    id: 'r_troc_faillite', kind: 'rencontre', scale: true, family: 'troc', art: { motif: 'scales', hue: 150 },
    title: 'La Faillite',
    text: 'Une maison rivale de {H:troc} fait faillite. {F:troc} propose de racheter ses dettes et ses clients. « Les clients sont fournis avec les dettes. »',
    options: [
      { label: 'Racheter pour lui', cost: $('T4'), effect: { gain: $('T7'), loy: { troc: 2 } }, reply: '{H:troc} doublent de taille. Ils vous remercient en vous facturant le remerciement.' },
      { label: 'Laisser couler', effect: { gain: $('V3'), loy: { troc: -1, sel: 1 } }, reply: 'La maison coule. {F:sel} parle de justice divine. {F:troc} parle de gâchis.' },
    ],
  }),

  // ------------------------------------------------------------------ la frontière
  card({
    id: 'r_front_raid', kind: 'rencontre', scale: true, art: { motif: 'flame', hue: 0 },
    title: 'Le Raid',
    text: 'Des pillards de {rival} brûlent les fermes de la frontière. Ils prétendent être des marchands. Ils ont des torches pour s’éclairer.',
    options: [
      { label: 'Les repousser', warn: 'Sans {s:5} Armée, un quartier brûle',
        effect: { if: { res: $('A5') }, then: { gain: $('A-2 T5'), rival: -1, reply: 'Repoussés. Ils ont laissé leurs torches. Et leurs marchandises, finalement.' },
          else: { quartiers: -1, cause: 'un raid à la frontière', rival: -1, reply: 'Ils étaient plus nombreux que vos soldats. Les fermes, puis le quartier, ont brûlé.' } } },
      { label: 'Payer une rançon', cost: $('T4'), effect: { rival: 1 }, reply: 'Ils repartent avec l’or. Ils promettent de revenir, ce qui est gentil.' },
    ],
  }),
  card({
    id: 'r_front_marchands', kind: 'rencontre', scale: true, art: { motif: 'road', hue: 30 },
    title: 'La Caravane',
    text: 'Une caravane de {rival} veut traverser vos terres. Elle paiera. Elle transporte des épices, de l’or, et un homme qui prend beaucoup de notes.',
    options: [
      { label: 'Laisser passer', effect: { gain: $('T5'), rival: 1, mem: ['espion_rival'] }, reply: 'L’or est là. L’homme aux notes aussi, quelque part dans vos archives.' },
      { label: 'Fouiller la caravane', cost: $('A2'), effect: { gain: $('T3 S3'), rival: -1 }, reply: 'Dans les notes : un plan de votre cité, annoté. « Faible ici. » Charmant.' },
    ],
  }),
  card({
    id: 'r_front_deserteur', kind: 'rencontre', eras: [1, 2, 3, 4], scale: true, art: { motif: 'hand', hue: 0 },
    title: 'Le Déserteur',
    text: 'Un officier de {rival} déserte. Il connaît tous les secrets de {reine}. Il demande l’asile, un château, et qu’on l’appelle « Excellence ».',
    options: [
      { label: 'Excellence, bienvenue', cost: $('T3'), req: { rivalJalons: 1 }, reqLabel: 'La rivale doit avoir une merveille à saboter', effect: { gain: $('A3 S3'), rival: -1, rivalJalon: -1 }, reply: 'Grâce à lui, un chantier de {rival} s’effondre mystérieusement. Excellence sourit.' },
      { label: 'Le rendre à {reine}', effect: { rival: 2 }, reply: '{Reine} vous remercie par une lettre parfumée. On n’entendra plus parler de l’officier.' },
    ],
  }),

  // ------------------------------------------------------------------ l'inconnu
  card({
    id: 'r_inc_voyageur', kind: 'rencontre', scale: true, art: { motif: 'star', hue: 280 },
    title: 'Le Voyageur',
    text: 'Un voyageur affirme venir du futur. Il connaît la fin de votre civilisation. Il accepte de la dire, pour un repas chaud.',
    options: [
      { label: 'Un repas chaud', cost: $('V2'), effect: { gain: $('S5'), mem: ['voyageur'] }, reply: '« Ça finit par {?dessein:etoiles|une fusée|{?dessein:empire|une signature|une chanson}}. Ou par un incendie. C’est flou. » Il reprend du dessert.' },
      { label: 'Le chasser', effect: { gain: $('A1') }, reply: 'Il part en disant qu’il vous reverra « à la fin ». Il a l’air triste pour vous.' },
    ],
  }),
  card({
    id: 'r_inc_puits', kind: 'rencontre', scale: true, art: { motif: 'moon', hue: 280 },
    title: 'Le Puits aux souhaits',
    text: 'Un puits exauce les souhaits, mais toujours un peu de travers. Vos familles ont chacune un souhait. Un seul passera.',
    form: 'qui',
    qui: { count: 3, option: (f) => ({
      label: `Le souhait de {F:${f}}`,
      effect: { loy: { [f]: 2 }, gain: f === 'ourk' ? $('A5') : f === 'sel' ? $('V5') : f === 'brume' ? $('S5') : $('T5') },
      reply: f === 'ourk' ? '{F:ourk} voulait être invincible. Il est devenu invisible. Il frappe les gens dans le dos, sans le faire exprès.'
        : f === 'sel' ? '{F:sel} voulait des fidèles. Elle a eu des chats. Beaucoup. Fidèles.'
        : f === 'brume' ? '{F:brume} voulait tout savoir. Il sait tout. Il ne dort plus.'
        : '{F:troc} voulait de l’or. Tout ce qu’il touche devient de l’or. Il a très faim.',
    }) },
    options: [],
  }),
  card({
    id: 'r_inc_comete', kind: 'rencontre', scale: true, art: { motif: 'comet', hue: 280 },
    title: 'La Pierre tombée',
    text: 'Une pierre est tombée du ciel. Elle est chaude, elle bourdonne et elle a l’air de vouloir quelque chose.',
    options: [
      { label: 'L’étudier', cost: $('S2'), effect: { bet: { chance: 0.5, per: { tag: 'Science', bonus: 0.1 },
        win: { gain: $('S8'), reply: 'La pierre contenait un métal inconnu. {F:brume} lui donne son nom. Le métal n’a rien demandé.' },
        lose: { gain: $('S-2'), reply: 'La pierre a explosé. {F:brume} a gardé un morceau. Le morceau bourdonne toujours.' } } } },
      { label: 'L’adorer', effect: { gain: $('V3'), loy: { sel: 1 } }, reply: 'La pierre a son temple. Elle bourdonne pendant les prières. C’est bon signe, dit {F:sel}.' },
      { label: 'La vendre', effect: { gain: $('T5'), loy: { troc: 1 } }, reply: 'Vendue à {rival}. Elle a explosé chez eux. Ils n’ont pas demandé de remboursement. Pas encore.' },
    ],
  }),
];
