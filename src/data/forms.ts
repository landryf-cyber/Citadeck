/**
 * Chaque ère a sa forme, comme les actes d'un jeu : sa règle, son rythme, son objectif, et la façon dont la menace arrive.
 *   I   L'Errance   : trois saisons courtes ; les surplus de vivres pourrissent ; la crise tombe d'un bloc.
 *   II  La Contagion : deux saisons ; une colonie à fonder à chaque saison ; la crise se répand, une carte par saison.
 *   III Le Conseil  : deux saisons ouvertes par un vote ; garder ses familles ; l'ennemi est à l'intérieur.
 *   IV  La Course   : quatre saisons éclair ; la rivale avance à chaque saison ; bâtir avant elle.
 *   V   Le Jugement : une seule saison, plus aucun revenu ; vos actes sont jugés avant la crise.
 */
import type { EraForm } from '../core/types';
import { $, card } from './dsl';

export const forms: EraForm[] = [
  {
    id: 'errance', name: 'L’Errance', rhythm: 'trois saisons courtes', seasons: 3, cards: 2,
    rule: 'La tribu chasse et cueille : +2 Vivres à chaque saison, mais on ne porte pas plus que la cité ne mange, plus deux ; le reste pourrit.',
    short: 'Chasse et cueillette : +2 Vivres par saison ; au départ de chaque saison, on n’en porte pas plus de {cap}.',
    objective: 'Bâtir la merveille, et arriver au bilan le ventre plein.',
    threat: 'La crise tombe d’un bloc, à la fin de l’ère.',
    mission: 'Bâtir {j} avant que tombe {cn}.',
    when: 'd’un bloc, en fin d’ère',
  },
  {
    id: 'contagion', name: 'La Contagion', rhythm: 'deux saisons', seasons: 2, cards: 3,
    rule: 'Chaque saison s’ouvre sur une colonie à fonder : un quartier de plus, qui se nourrit lui-même, contre un peu de soldats et de Trésor.',
    short: 'Une colonie à fonder à chaque saison ; la crise se répand d’une saison à l’autre.',
    objective: 'Bâtir la merveille, et grandir plus vite que le mal.',
    threat: 'La crise se répand : une carte à la fin de chaque saison, la dernière avant le bilan.',
    mission: 'Bâtir {j} pendant que {cn} se répand.',
    when: 'une carte à la fin de chaque saison',
    goal: 'et fonder des colonies',
  },
  {
    id: 'conseil', name: 'Le Conseil', rhythm: 'deux saisons, chacune ouverte par un vote', seasons: 2, cards: 3,
    rule: 'Chaque saison s’ouvre sur le Conseil : vous soutenez une famille, sa rivale le prend mal.',
    short: 'Chaque saison s’ouvre sur un vote du Conseil : une famille gagne, sa rivale perd.',
    objective: 'Bâtir la merveille sans perdre vos familles : si aucune n’est fâchée au bilan, la paix civile vaut un quartier.',
    threat: 'L’ennemi est à l’intérieur : la famille la moins fidèle trahit pendant la crise dès qu’elle vous en veut.',
    mission: 'Bâtir {j} sans perdre vos familles.',
    when: 'en fin d’ère ; la famille la moins fidèle trahira si elle vous en veut',
    goal: 'et aucune famille fâchée au bilan (+1 quartier)',
  },
  {
    id: 'course', name: 'La Course', rhythm: 'quatre saisons éclair', seasons: 4, cards: 2,
    rule: 'La rivale avance d’une étape par saison et finit sa merveille à la troisième ; le chantier ouvre à la fin des deuxième et troisième saisons.',
    short: 'La rivale finit sa merveille à la troisième saison ; le chantier ouvre aux deuxième et troisième.',
    objective: 'Bâtir la merveille avant la rivale : si vous gagnez, elle n’achève pas la sienne cette ère.',
    threat: 'Une crise éclair, en deux cartes ; si la rivale finit la première, elle frappe un quart plus fort.',
    mission: 'Bâtir {j} avant {rival}.',
    when: 'éclair, deux cartes en fin d’ère, un quart plus forte si la rivale gagne la course',
    goal: 'avant la fin de la troisième saison',
  },
  {
    id: 'jugement', name: 'Le Jugement', rhythm: 'une seule saison, plus longue', seasons: 1, cards: 4,
    rule: 'Plus aucun revenu : vos réserves sont tout ce qui reste ; l’histoire s’arrête après la crise, sans dernier repas.',
    short: 'Plus aucun revenu ; vos actes seront jugés avant la crise.',
    objective: 'Bâtir la dernière merveille avec ce que vous avez amassé.',
    threat: 'Avant la crise, vos actes sont jugés : la famille la plus lésée vous fait un procès, ou la plus fidèle vous rend hommage.',
    mission: 'Bâtir {j}, puis répondre de vos actes.',
    when: 'après le jugement de vos actes',
    goal: 'avec vos seules réserves',
  },
];

export const formCards = [
  card({
    id: 'colonie', kind: 'regle', scale: true, eras: [], art: { motif: 'house', hue: 40 }, title: 'Une colonie',
    text: 'Au-delà de la colline : une source, des oliviers, et personne. {F:ourk} y voit un fort, {F:troc} un comptoir, {F:sel} un sanctuaire. Les colons, eux, voient surtout la source.‖Une vallée voisine attend, vide, fertile, un peu trop belle pour être honnête. Des familles sont prêtes à partir, avec des provisions et des gardes.‖Sur l’autre rive, une île, un port naturel et des chèvres sauvages. Les chèvres n’ont rien demandé ; les colons, si.‖Des bergers reviennent des hauts plateaux : de l’herbe à perte de vue, pas un voisin, et un vent qui rend fou. Ils veulent y retourner, avec leurs cousins.‖Un marais asséché, au sud, sent encore un peu le marais. {F:brume} jure qu’on peut y bâtir ; {F:sel} jure qu’on n’y bâtira rien de bon. Des familles attendent votre avis, bagages faits.‖La rivière forme une boucle, là-bas, avec un gué et une colline au milieu. Un endroit parfait pour une ville ; on se demande pourquoi personne n’y est. On ira voir.',
    options: [
      { label: 'Fonder la colonie (+1 quartier)', cost: $('A2 T2'), effect: { quartiers: 1 },
        reply: 'Les colons partent avec des sacs, des chèvres et un plan approximatif. Une semaine plus tard, un message : tout va bien, sauf les chèvres.‖Une colonie naît sur l’autre rive. Elle copie vos lois, vos fêtes et vos querelles, et en invente quelques-unes à elle.‖La colonie a ses murs, son puits et son premier procès, pour une histoire de chèvre. Elle est déjà des vôtres.‖Les colons plantent un drapeau, puis des choux. Les choux poussent mieux que le drapeau ne flotte.‖La nouvelle colonie vous envoie ses premières nouvelles : un nom, une récolte, et une plainte contre la colonie voisine, qui n’existe pas encore.' },
      { label: 'Un comptoir (+1 quartier)', cost: $('T5'), req: { fam: { id: 'troc', min: -1 } }, reqLabel: '{H:troc} pas encore hostiles', effect: { quartiers: 1, loy: { troc: 1, sel: -1 } },
        reply: '{F:troc} finance l’expédition, contre le monopole des sandales. La colonie prospère ; les sandales aussi.‖Le comptoir ouvre avant les maisons. Les colons dorment dans les entrepôts, entre deux ballots, et paient un loyer.‖{F:troc} baptise la colonie de son propre nom. {F:sel} refuse d’y bénir quoi que ce soit.' },
      { label: 'Pas cette saison', effect: {},
        reply: 'Les colons défont leurs sacs. La source attendra ; elle a l’habitude.‖On reste chez soi. La vallée voisine reste vide, et belle, et à prendre.‖Les chèvres de l’île gardent leur île. Elles ont l’air soulagées.‖Les colons attendront la saison prochaine. Ils en profitent pour refaire leurs bagages, en mieux.‖Pas de colonie cette fois. La terre promise reste promise, ce qui, après tout, est son état naturel.' },
    ],
  }),
  card({
    id: 'conseil', kind: 'conseil', eras: [], art: { motif: 'ring', hue: 280 }, title: 'Le Conseil',
    text: 'Le Conseil s’ouvre. Chaque famille plaide sa cause, longtemps, et toutes en même temps. Il faudra en soutenir une ; les autres s’en souviendront.‖Nouvelle session du Conseil. Les bancs sont pleins, les esprits aussi. On attend que vous preniez parti : ne pas choisir n’est pas prévu au règlement.‖Le Conseil siège dans un brouhaha de pétitions. Une famille repartira contente ; sa rivale repartira avec une liste.‖Le Conseil se réunit dans la grande salle, qui est trop petite. Les familles se disputent d’abord les places, ensuite les crédits. Il faudra trancher.‖Séance du Conseil. Un greffier lit l’ordre du jour : un seul point, « Qui aura votre faveur ». Les familles ont apporté des pétitions, des cadeaux, et des menaces polies.‖Le Conseil s’ouvre sur une minute de silence, qui dure quarante secondes. Puis chacun réclame tout, tout de suite. Vous ne pouvez contenter qu’une famille.',
    // une option par famille ; le moteur ne garde que les familles présentes (et ne froisse pas une rivale partie)
    options: [
      { label: 'Soutenir {H:ourk}', effect: { gain: $('A3'), loy: { ourk: 1, brume: -1 } }, reply: '{F:ourk} obtient ses murailles. {Il:ourk} remercie le Conseil d’un coup de poing sur la table ; la table ne s’en remet pas.‖Le Conseil vote les crédits militaires. {F:ourk} applaudit avec ses gantelets ; on n’entend plus rien pendant une heure.' },
      { label: 'Soutenir {H:sel}', effect: { gain: $('V3'), loy: { sel: 1, troc: -1 } }, reply: '{F:sel} obtient sa nouvelle cathédrale. {Il:sel} bénit le Conseil, puis la salle, puis, par excès de zèle, la buvette.‖Le Conseil vote la dîme. {F:sel} promet de prier pour chacun des votants, nommément, et longuement.' },
      { label: 'Soutenir {H:brume}', effect: { gain: $('S3'), loy: { brume: 1, ourk: -1 } }, reply: '{F:brume} obtient son université. {Il:brume} remercie le Conseil par un discours de trois heures, avec des schémas.‖Le Conseil finance les savants. {F:brume} distribue des lunettes aux conseillers, « pour qu’ils voient enfin clair ».' },
      { label: 'Soutenir {H:troc}', effect: { gain: $('T3'), loy: { troc: 1, sel: -1 } }, reply: '{F:troc} obtient son port franc. {Il:troc} remercie le Conseil et lui adresse la facture du banquet.‖Le Conseil baisse les taxes. {F:troc} compte ce que cela lui rapporte, puis recompte, pour le plaisir.' },
    ],
  }),
];
