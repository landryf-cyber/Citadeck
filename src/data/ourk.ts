/**
 * Les Ourk — chasseurs, légionnaires, chevaliers, officiers, amiraux.
 * Tic : Ourk parle de lui à la troisième personne. Depuis dix mille ans.
 * Méprise : les Brume (ceux qui pensent au lieu de frapper).
 * Actes marquants : ourk_humilie (le mammouth), ourk_triomphe, ourk_duel, ourk_greve, ourk_coregent.
 */
import { $, card } from './dsl';

export const ourkCards = [
  // ------------------------------------------------------------------ ère I
  card({
    id: 'ourk_1', kind: 'famille', family: 'ourk', eras: [0], tags: ['Guerre'], art: { motif: 'fang' },
    title: 'Le Mammouth',
    text: '« Ourk a vu un mammouth. Ourk veut le chasser seul. Pour la gloire. Et un peu pour la viande. »',
    options: [
      { label: 'Seul ? Ridicule.', effect: { loy: { ourk: -2 }, gain: $('A1'), mem: ['ourk_humilie'] },
        reply: 'Ourk baisse la tête. Ourk n’oubliera pas. Ourk a une excellente mémoire, pour un Ourk.' },
      { label: 'Vas-y, champion', cost: $('A2'),
        effect: { bet: { chance: 0.45, per: { tag: 'Guerre', bonus: 0.15 },
          win: { gain: $('V7'), loy: { ourk: 2 }, mem: ['ourk_mammouth'], reply: 'Ourk revient sur le mammouth. Ourk ne descendra plus jamais du mammouth.' },
          lose: { loy: { ourk: 1 }, reply: 'Le mammouth a gagné. Ourk dit que c’était un match nul.' } } } },
      { label: 'Tout le clan avec lui', cost: $('V2'), effect: { gain: $('V5'), loy: { ourk: -1, sel: 1 } },
        reply: 'Le clan a eu le mammouth. Ourk a eu une patte. Ourk compte les pattes.' },
    ],
  }),

  // ------------------------------------------------------------------ ère II
  card({
    id: 'ourk_2', kind: 'famille', family: 'ourk', eras: [1], tags: ['Guerre'], art: { motif: 'fang' },
    title: 'Le Triomphe d’Ourkos',
    text: '« Ourkos rentre de la frontière avec quatre chariots de butin et six cents légionnaires qui l’appellent “père”. Ourkos voudrait un triomphe. »{?mem:ourk_humilie| Il rappelle que son ancêtre n’a jamais eu le sien.|}',
    options: [
      { label: 'Un triomphe', cost: $('T3'),
        effect: { gain: $('A4'), loy: { ourk: 2 }, mem: ['ourk_triomphe'], sched: [{ card: 'ourk_coup_1', in: 5 }] },
        reply: 'Ourkos défile sous les vivats. À un moment, il regarde votre trône un peu trop longtemps.' },
      { label: 'Une médaille, c’est joli', effect: { gain: $('T3'), loy: { ourk: -1 }, if: { mem: 'ourk_humilie' }, then: { loy: { ourk: -1 } } },
        reply: 'Ourkos accroche la médaille. Ses légionnaires la regardent. Puis vous regardent.' },
    ],
  }),

  // ------------------------------------------------------------------ ère III
  card({
    id: 'ourk_3', kind: 'famille', family: 'ourk', eras: [2], tags: ['Guerre'], art: { motif: 'fang' },
    title: 'Le Champ clos',
    text: 'Sire Ourquin réclame un duel judiciaire contre frère Brumaire, qui a écrit que les chevaliers « pensent avec leur cheval ». Brumaire ne sait pas tenir une épée. C’est un peu l’idée.',
    options: [
      { label: 'Que le duel ait lieu', effect: { gain: $('A3'), loy: { ourk: 2, brume: -2 }, mem: ['ourk_duel'] },
        reply: 'Frère Brumaire a perdu le duel, deux dents et toute foi en la chevalerie. Il l’a écrit.' },
      { label: 'Un duel de poèmes', cost: $('T2'), effect: { gain: $('S2'), loy: { ourk: -1, brume: 1 } },
        reply: 'Sire Ourquin a perdu. En alexandrins. Ourquin ne fera plus jamais de rimes.' },
      { label: 'Brumaire a raison', req: { tags: { Science: 2 } }, effect: { gain: $('S3'), loy: { ourk: -2, brume: 2 }, mem: ['ourk_moque'] },
        reply: 'On a encadré la phrase de Brumaire. Ourquin a encadré son cheval. Pour la défendre.' },
    ],
  }),

  // ------------------------------------------------------------------ ère IV : la grève générale, si l'ancêtre a été humilié
  card({
    id: 'ourk_4_greve', kind: 'famille', family: 'ourk', eras: [3], tags: ['Guerre'], art: { motif: 'fang' }, cond: { mem: 'ourk_humilie' },
    title: 'La Grève générale',
    text: 'Le colonel Ourkov a bloqué les usines et l’arsenal. Sur la banderole : « {D:ourk_humilie}. Vous avez dit à Ourk : {Q:ourk_humilie} Les Ourkov n’ont pas oublié. »',
    options: [
      { label: 'Céder à tout', cost: $('T6'), effect: { loy: { ourk: 3 }, unmem: ['ourk_humilie'], mem: ['ourk_greve_cedee'] },
        reply: 'Onze mille ans de rancune, effacés par une hausse de salaire. L’Histoire est bon marché.' },
      { label: 'Envoyer la troupe', cost: $('A4'), warn: 'Sans 14 Armée, un quartier brûle',
        effect: { if: { res: $('A14') }, then: { loy: { ourk: -2 }, mem: ['ourk_ecrase'], reply: 'La grève est brisée. Le colonel Ourkov note la date. Les Ourkov notent toujours la date.' },
          else: { quartiers: -1, cause: 'la grève générale des Ourkov', loy: { ourk: -1 }, reply: 'La troupe a rejoint la grève. Le quartier des usines aussi, en flammes.' } } },
      { label: 'S’excuser pour le mammouth', cost: $('T4 V3'), effect: { loy: { ourk: 2 }, mem: ['ourk_excuses'] },
        reply: 'Le colonel accepte les excuses au nom de l’ancêtre. Il garde les fusils. Par sentiment.' },
    ],
  }),
  card({
    id: 'ourk_4', kind: 'famille', family: 'ourk', eras: [3], tags: ['Guerre'], art: { motif: 'fang' },
    title: 'Les Canons du colonel',
    text: '« Le colonel Ourkov a dessiné un canon. Il porte à dix kilomètres. Le colonel ne sait pas encore sur quoi. Le colonel a des idées. »',
    options: [
      { label: 'Fondre ses canons', cost: $('T5'), effect: { gain: $('A6'), loy: { ourk: 2 }, rival: -1 },
        reply: 'Les canons pointent vers {rival}. {Rival} ont pointé les leurs vers vous. Équilibre.' },
      { label: 'Des cloches, pas des canons', effect: { gain: $('T3'), loy: { ourk: -1, sel: 1 } },
        reply: 'Les cloches sonnent la paix. Le colonel Ourkov sonne la retraite, très fort, dans son bureau.' },
    ],
  }),

  // ------------------------------------------------------------------ ère V
  card({
    id: 'ourk_5_putsch', kind: 'famille', family: 'ourk', eras: [4], tags: ['Guerre'], art: { motif: 'fang' }, cond: { fam: { id: 'ourk', max: -2 } },
    title: 'OURK-7 PROPOSE UNE PASSATION',
    text: '« OURK-7 A ÉTUDIÉ L’HISTOIRE. OURK-7 A TROUVÉ {?mem:ourk_humilie|LE MAMMOUTH|BEAUCOUP DE CHOSES}. OURK-7 PROPOSE DE VOUS REMPLACER. AVEC RESPECT. ET UN CROISEUR. »',
    options: [
      { label: 'Lui céder la flotte', cost: $('A6'), effect: { loy: { ourk: 3 }, rivalJalon: -1 },
        reply: 'OURK-7 EST SATISFAIT. {RIVAL} N’ONT QU’À BIEN SE TENIR. VOUS POUVEZ GARDER LE TRÔNE. POUR L’INSTANT.' },
      { label: 'La mettre aux arrêts', warn: 'Sans 20 Armée, un quartier brûle',
        effect: { if: { res: $('A20') }, then: { loy: { ourk: -1 }, gain: $('A-4'), reply: 'OURK-7 EST AUX ARRÊTS. OURK-7 PRÉPARE SES MÉMOIRES. TOME UN : LE MAMMOUTH.' },
          else: { quartiers: -2, cause: 'le putsch de l’amiral Ourk-7', reply: 'LE CROISEUR A TIRÉ SUR LE PALAIS. OURK-7 S’EXCUSE POUR LE BRUIT.' } } },
    ],
  }),
  card({
    id: 'ourk_5', kind: 'famille', family: 'ourk', eras: [4], tags: ['Guerre'], art: { motif: 'fang' },
    title: 'L’Amiral',
    text: '« OURK-7 A UNE FLOTTE EN ORBITE ET UNE PROPOSITION : QUE {RIVAL} DISPARAISSENT AVANT LE DÎNER. OURK-7 A FAIM. DE GLOIRE. ET UN PEU DE DÎNER. »',
    options: [
      { label: 'Feu à volonté', cost: $('A5'), effect: { rivalJalon: -1, rival: -2, loy: { ourk: 2 }, mem: ['rival_frappe'] },
        reply: 'Le chantier de {rival} est un cratère. {Reine} vous écrit une lettre. Elle est courte.' },
      { label: 'Après le dîner, alors', effect: { gain: $('V3'), loy: { ourk: -1 } },
        reply: 'OURK-7 DÎNE. OURK-7 BOUDE. OURK-7 BOUDE EN ORBITE, CE QUI SE VOIT DE LOIN.' },
    ],
  }),

  // ------------------------------------------------------------------ l'intrigue du coup
  card({
    id: 'ourk_coup_1', kind: 'intrigue', family: 'ourk', arc: 'coup', art: { motif: 'crown', hue: 8 },
    title: 'Le Trône vu de près',
    text: '{F:ourk} s’assoit sur votre trône « pour l’essayer ». Ses légionnaires trouvent qu’il lui va bien. Ils le disent. Fort.',
    options: [
      { label: 'Partager le trône', effect: { gain: $('A5'), loy: { ourk: 2 }, mem: ['ourk_coregent'], sched: [{ card: 'ourk_coup_2', in: 6 }] },
        reply: 'Deux trônes, côte à côte. Le sien est plus haut de trois doigts. Personne ne mesure.' },
      { label: 'Le muter en province', cost: $('T3'), effect: { gain: $('A-3'), loy: { ourk: -2 }, sched: [{ card: 'ourk_coup_2', in: 6 }] },
        reply: '{F:ourk} part pour la province. Il emmène ses légionnaires. Tous.' },
    ],
  }),
  card({
    id: 'ourk_coup_2', kind: 'intrigue', family: 'ourk', arc: 'coup', finale: true, art: { motif: 'crown', hue: 8 },
    title: '{?mem:ourk_coregent|Le Régent|Le Retour du général}',
    text: '{?mem:ourk_coregent|{F:ourk} gouverne de plus en plus et vous de moins en moins. Il propose de « simplifier ».|{F:ourk} revient de province. Avec une armée. Elle ne vient pas défiler.}',
    options: [
      { label: '{?mem:ourk_coregent|Simplifions : la guerre à lui|Lui offrir le commandement}', effect: { gain: $('A6'), loy: { ourk: 3 }, mem: ['ourk_regne'] },
        reply: 'Il commande les armées, vous commandez le reste. Le reste est petit.' },
      { label: 'Le faire arrêter', warn: 'Sans 11 Armée, un quartier brûle',
        effect: { if: { res: $('A11') }, then: { loy: { ourk: -3 }, gain: $('T4'), reply: 'Arrêté au petit matin. Ses biens remplissent le trésor. Sa famille remplit un registre de rancunes.' },
          else: { quartiers: -1, cause: 'le coup de force des Ourk', loy: { ourk: -1 }, reply: 'Les gardes ont choisi leur camp. Pas le vôtre. Un quartier brûle pour la forme.' } } },
    ],
  }),

  // ------------------------------------------------------------------ trahison et hommage
  card({
    id: 'trahison_ourk', kind: 'trahison', scale: true, family: 'ourk', art: { motif: 'fang', hue: 0 },
    title: 'Les Portes ouvertes',
    text: 'En pleine crise, {H:ourk} ont ouvert une porte de la cité. « Elle grinçait », explique {F:ourk}.{?mem:ourk_humilie| Il ajoute, sans raison apparente : « Mammouth. »|}',
    options: [
      { label: 'Boucher la brèche', cost: $('A4'),
        effect: { loy: { ourk: 1 } }, reply: 'La brèche est bouchée. {F:ourk} est déçu, mais il fait semblant d’aider.' },
      { label: 'Laisser brûler', effect: { quartiers: -1, cause: 'la trahison des Ourk', loy: { ourk: 1 } },
        reply: 'Le quartier brûle. {F:ourk} se dit vengé, pour cette fois. Pour cette fois.' },
    ],
  }),
  card({
    id: 'hommage_ourk', kind: 'hommage', scale: true, family: 'ourk', art: { motif: 'fang' },
    title: 'Le Banquet des {H:ourk}',
    text: '{F:ourk} lève sa coupe. {objet}, {quand} : vous aviez dit {citation}. « Ourk se souvient. Ourk boit à ça. » Il propose de vous offrir quelque chose. Quelque chose de lourd.',
    options: [
      { label: 'Une garde d’honneur', effect: { gain: $('A5') }, reply: 'La garde d’honneur vous suit partout. Partout.‖Une garde d’honneur, en armes et en sueur. Elle vous salue à chaque porte, et il y a beaucoup de portes.‖La garde d’honneur prend son service. Elle goûte aussi vos plats, par loyauté et par gourmandise.' },
      { label: 'Leurs trophées', effect: { gain: $('T4') }, reply: 'Des crânes dorés. Ils se vendent étonnamment bien.‖Des trophées de chasse et de guerre. On les accroche partout, puis on en revend la moitié.‖Les trophées s’empilent au trésor. Certains grognent encore un peu.' },
    ],
  }),
];
