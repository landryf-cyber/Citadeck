/**
 * Les Troc — troqueurs, armateurs, banquiers, industriels, actionnaires.
 * Tic : « Pour vous, prix d'ami. »
 * Méprise : les Sel (ceux qui donnent gratuitement ce qui se vend).
 * Actes marquants : troc_monnaie, troc_navires, troc_dette, troc_enfants, troc_nom.
 */
import { $, card } from './dsl';

export const trocCards = [
  card({
    id: 'troc_1', kind: 'famille', family: 'troc', eras: [0], tags: ['Commerce'], art: { motif: 'coin' },
    title: 'Les Coquillages',
    text: 'Troc propose d’échanger les choses contre des coquillages. Les coquillages contre les choses. « Pour vous, prix d’ami : deux coquillages le coquillage. »',
    options: [
      { label: 'Adopter le coquillage', effect: { gain: $('T5'), loy: { troc: 2, sel: -1 }, mem: ['troc_monnaie'] },
        reply: 'Tout s’achète. Mère Sel découvre qu’on peut payer les dieux. Elle demande des coquillages.' },
      { label: 'Le troc suffit', effect: { gain: $('V3'), loy: { troc: -2 } },
        reply: 'On échange une chèvre contre une chèvre. Troc trouve ça d’une tristesse infinie.' },
    ],
  }),
  card({
    id: 'troc_2', kind: 'famille', family: 'troc', eras: [1], tags: ['Commerce'], art: { motif: 'ship' },
    title: 'Les Navires',
    text: 'Trokos l’armateur veut envoyer trois navires au bout du monde. Il manque l’argent, les marins et la certitude que le monde a un bout.',
    options: [
      { label: 'Financer l’expédition', cost: $('T4'), effect: { bet: { chance: 0.5, per: { tag: 'Commerce', bonus: 0.15 },
        win: { gain: $('T10'), loy: { troc: 2 }, mem: ['troc_navires'], reply: 'Les navires reviennent, lourds d’épices. Trokos parle déjà de dix navires.' },
        lose: { loy: { troc: 1 }, reply: 'Les navires ne reviennent pas. Trokos dit que le monde a bien un bout.' } } } },
      { label: 'Un seul navire, petit', cost: $('T1'), effect: { gain: $('T3'), loy: { troc: -1 } },
        reply: 'Le petit navire revient avec un petit chargement. Trokos le décharge en soupirant.' },
      { label: 'Le monde s’arrête au port', effect: { gain: $('V2'), loy: { troc: -1, sel: 1 } },
        reply: '{F:sel} approuve : le bout du monde, c’est le bord du quai. Trokos regarde la mer en mâchant sa barbe.' },
    ],
  }),
  card({
    id: 'troc_3', kind: 'famille', family: 'troc', eras: [2], tags: ['Commerce'], art: { motif: 'scales' },
    title: 'La Banque',
    text: 'Maître Troquet ouvre une banque. Il propose de vous prêter votre propre argent, avec intérêts. « Prix d’ami. Les intérêts aussi sont amicaux. »',
    options: [
      { label: 'Emprunter', effect: { gain: $('T9'), loy: { troc: 1 }, mem: ['troc_dette'], sched: [{ card: 'troc_dette_2', in: 7 }] },
        reply: 'L’argent coule à flots. Une lettre arrivera. Elle a déjà été écrite.' },
      { label: 'Nationaliser la banque', req: { res: $('A6') }, effect: { gain: $('T6'), loy: { troc: -3 } },
        reply: 'La banque est à vous. Les clients sont partis avec les coffres. Il reste les murs, très solides.' },
      { label: 'Merci, non', effect: { loy: { troc: -1 }, gain: $('V2') }, reply: 'Maître Troquet range son sourire. Il en a d’autres.' },
    ],
  }),
  card({
    id: 'troc_4', kind: 'famille', family: 'troc', eras: [3], tags: ['Commerce'], art: { motif: 'gear' },
    title: 'Les Petits Doigts',
    text: 'Troc et Fils emploie des enfants dans ses filatures. « Ils sont très bien payés, en bonbons. Et ils ont de petits doigts, c’est un avantage concurrentiel. »',
    options: [
      { label: 'Laisser faire', effect: { gain: $('T8'), loy: { troc: 2, sel: -2 }, mem: ['troc_enfants'] },
        reply: 'Le tissu coule à flots. Dans les filatures, on n’entend plus que les métiers. Personne ne compte les enfants qui toussent. Personne ne vous le reprochera tout de suite.' },
      { label: 'Interdire', cost: $('T3'), effect: { gain: $('S3'), loy: { troc: -2, sel: 1, brume: 1 } },
        reply: 'Les enfants vont à l’école, certains pour la première fois. Troc et Fils grogne, puis embauche des adultes. Le tissu coûte plus cher. Ce n’est pas cher payé.' },
    ],
  }),
  card({
    id: 'troc_5', kind: 'famille', family: 'troc', eras: [4], tags: ['Commerce'], art: { motif: 'coin' },
    title: 'Le Nom déposé',
    text: 'TrocCorp propose de racheter le nom « {cite} ». Vous pourriez continuer à l’utiliser, sous licence. Le contrat fait neuf mille pages. La première dit « prix d’ami ».',
    options: [
      { label: 'Vendre le nom', effect: { gain: $('T12'), loy: { troc: 2 }, mem: ['troc_nom'] },
        reply: 'Vous gouvernez désormais {cite}™. Chaque discours est suivi d’une publicité.' },
      { label: 'Exproprier TrocCorp', cost: $('A5'), effect: { gain: $('T6'), loy: { troc: -3 } },
        reply: 'TrocCorp est à vous. Elle était endettée jusqu’à l’orbite. Les dettes étaient comprises dans le prix.' },
    ],
  }),
  card({
    id: 'troc_dette_2', kind: 'intrigue', family: 'troc', arc: 'dette', finale: true, art: { motif: 'scales' },
    title: 'La Lettre de la banque',
    text: 'La lettre est arrivée. Les intérêts sont plus gros que le prêt. {F:troc} vous la tend lui-même, avec une rose. « Prix d’ami. »',
    options: [
      { label: 'Rembourser', cost: $('T8'), effect: { loy: { troc: 2 } }, reply: 'Remboursé. {F:troc} vous propose aussitôt un nouveau prêt. Plus amical.' },
      { label: 'Faire défaut', effect: { loy: { troc: -3 }, rival: -1, if: { fam: { id: 'troc', max: -1 } }, then: { quartiers: -1, cause: 'la dette envers les Troc' } },
        reply: 'Vous ne payez pas. {F:troc} vend votre dette à {rival}. {Rival} adorent les dettes.' },
    ],
  }),
  card({
    id: 'trahison_troc', kind: 'trahison', scale: true, family: 'troc', art: { motif: 'coin', hue: 0 },
    title: 'La Caisse',
    text: 'En pleine crise, {H:troc} sont partis avec la caisse. {F:troc} a laissé un mot : « Nous reviendrons. Avec une facture. »',
    options: [
      { label: 'Les rattraper', cost: $('A4'), effect: { gain: $('T3'), loy: { troc: 1 } }, reply: 'Rattrapés à la frontière. Ils prétendent qu’ils allaient investir.' },
      { label: 'Laisser filer', effect: { gain: $('T-6'), quartiers: -1, cause: 'la fuite des Troc avec la caisse', loy: { troc: 1 } },
        reply: 'La caisse est partie. Le quartier des marchands a fermé boutique. Définitivement.' },
    ],
  }),
  card({
    id: 'hommage_troc', kind: 'hommage', scale: true, family: 'troc', art: { motif: 'coin' },
    title: 'Le Dividende',
    text: '{F:troc} vous verse un dividende. {objet}, {quand} : vous aviez dit {citation}. « Nous n’oublions pas nos amis. Un excellent placement, rétrospectivement. »',
    options: [
      { label: 'En espèces', effect: { gain: $('T7') }, reply: 'En espèces. {F:troc} a gardé la commission.' },
      { label: 'En vivres', effect: { gain: $('V6') }, reply: 'En vivres. Avec la date de péremption de {F:troc}.' },
    ],
  }),
];
