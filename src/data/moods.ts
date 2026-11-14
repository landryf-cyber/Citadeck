/**
 * Ce que chaque famille laisse paraître, en tête de ses cartes : son humeur (loyauté)
 * et ses souvenirs (les actes marquants des ères précédentes). C'est la voix des Lignées.
 */
import type { FamilyId } from '../core/types';

export const moods: Record<FamilyId, { hostile: string[]; cold: string[]; warm: string[]; devoted: string[] }> = {
  ourk: {
    hostile: [
      '{F:ourk} ne vous regarde pas. Il regarde votre cou.',
      '{F:ourk} aiguise quelque chose pendant que vous parlez. Il ne dit pas quoi.',
      '{F:ourk} vous salue en vous appelant par votre nom. Il ne l’avait jamais fait. C’est pire.',
    ],
    cold: [
      '{F:ourk} vous salue du bout de la lance.',
      '{F:ourk} parle de vous à la troisième personne. D’habitude, il réserve ça à lui-même.',
      '{F:ourk} croise les bras. Ses bras sont plus larges que votre porte.',
    ],
    warm: [
      '{F:ourk} vous tape dans le dos. Vous survivez.',
      '{F:ourk} vous a gardé la meilleure part du rôti. Il en a mangé la moitié, par loyauté.',
      '{F:ourk} sourit. Il lui manque des dents, mais pas l’enthousiasme.',
    ],
    devoted: [
      '{F:ourk} vous appelle « chef ». Ourk n’appelle jamais personne « chef ».',
      '{F:ourk} a fait graver votre nom sur son bouclier. À côté du sien, presque aussi gros.',
      '{F:ourk} se jetterait dans le feu pour vous. Il l’a déjà fait, pour voir.',
    ],
  },
  sel: {
    hostile: [
      '{F:sel} vous bénit avec deux doigts. Pas les bons.',
      '{F:sel} a prévu votre avenir. Elle le garde pour elle, et elle sourit.',
      '{F:sel} prie pour votre âme, très fort, devant tout le monde.',
    ],
    cold: [
      '{F:sel} prie pour vous, à voix basse, avec une grimace.',
      '{F:sel} vous tend la main. Pour la quête, pas pour vous saluer.',
      '{F:sel} soupire que le ciel est déçu. Elle a l’air de l’avoir aidé.',
    ],
    warm: [
      '{F:sel} a allumé une bougie pour vous. Une petite.',
      '{F:sel} vous prédit une longue vie. Elle facture la prédiction, mais à moitié prix.',
      '{F:sel} glisse votre nom dans ses prières, entre la pluie et les impôts.',
    ],
    devoted: [
      '{F:sel} assure que le ciel vous adore. Le ciel a dû le lui dire.',
      '{F:sel} a fait sculpter votre profil sur l’autel. Du bon côté.',
      '{F:sel} jure que vous serez canonisé. Elle a déjà commandé le vitrail.',
    ],
  },
  brume: {
    hostile: [
      '{F:brume} vous corrige avant même que vous ayez parlé.',
      '{F:brume} prend des notes pendant que vous parlez. Beaucoup de notes. Avec des schémas.',
      '{F:brume} a calculé la date de votre chute. {Il:brume} refuse de vous la donner, par politesse.',
    ],
    cold: [
      '{F:brume} soupire en vous voyant. Chez lui, c’est un bonjour.',
      '{F:brume} vous explique la chose lentement, comme à un enfant pas très doué.',
      '{F:brume} lève les yeux de ses calculs, puis y retourne.',
    ],
    warm: [
      '{F:brume} vous a dédié une équation. Elle est fausse, par affection.',
      '{F:brume} vous laisse toucher son instrument. Une seconde. Avec des gants.',
      '{F:brume} admet que vous avez eu raison une fois. {Il:brume} a noté la date.',
    ],
    devoted: [
      '{F:brume} vous trouve « presque intelligent ». C’est son plus beau compliment.',
      '{F:brume} a donné votre nom à une étoile. Petite, mais elle brille.',
      '{F:brume} vous consulte avant ses expériences. {Il:brume} ne vous écoute pas, mais {il:brume} vous consulte.',
    ],
  },
  troc: {
    hostile: [
      '{F:troc} vous serre la main, puis compte ses bagues.',
      '{F:troc} vous présente une facture. Pour le temps qu’il passe à vous détester.',
      '{F:troc} parle affaires avec {rival}, assez fort pour que vous entendiez.',
    ],
    cold: [
      '{F:troc} vous fait un prix. Pas un prix d’ami.',
      '{F:troc} vous salue d’un « cher client ». Il dit ça aux gens qu’il n’aime pas.',
      '{F:troc} pèse vos paroles. Littéralement : il a une balance.',
    ],
    warm: [
      '{F:troc} vous serre la main sans compter ses bagues. Presque sans.',
      '{F:troc} vous offre un verre. L’addition arrivera plus tard, mais elle est petite.',
      '{F:troc} vous appelle « associé ». Il rit. Vous ne savez pas s’il plaisante.',
    ],
    devoted: [
      '{F:troc} vous offre un cadeau. Sans l’étiquette du prix. C’est dire.',
      '{F:troc} a frappé une pièce à votre effigie. Il en garde une dans sa poche, pas pour la dépenser.',
      '{F:troc} vous fait crédit. Sans intérêts. Ses comptables en pleurent encore.',
    ],
  },
};

/** Souvenirs : si le souvenir existe et date d'une ère passée, la famille le rappelle. */
export const recalls: { family: FamilyId; mem: string; line: string; tone?: 'neg' | 'pos' }[] = [
  { family: 'ourk', mem: 'ourk_humilie', line: 'Il porte une dent de mammouth au cou. Ce n’est pas un hasard : en {D:ourk_humilie}, vous avez dit {Q:ourk_humilie}', tone: 'neg' },
  { family: 'ourk', mem: 'ourk_mammouth', line: 'Le mammouth de l’ancêtre est peint sur son bouclier. Vous aussi, plus petit, derrière.', tone: 'pos' },
  { family: 'ourk', mem: 'ourk_puni', line: 'Les siens jeûnent encore un jour par an, en souvenir du louveteau. Ils vous regardent manger.', tone: 'neg' },
  { family: 'ourk', mem: 'ourk_triomphe', line: 'Dans sa famille, on raconte encore le triomphe d’Ourkos. Ils le racontent mieux chaque fois.', tone: 'pos' },
  { family: 'ourk', mem: 'ourk_duel', line: 'Il garde, dans une boîte, les deux dents de frère Brumaire.', tone: 'pos' },
  { family: 'ourk', mem: 'ourk_coregent', line: 'Un ancêtre a partagé votre trône. Il en reste un coussin, que la famille réclame.', tone: 'pos' },
  { family: 'ourk', mem: 'ourk_excuses', line: 'Vos excuses pour le mammouth sont encadrées dans le mess des officiers.', tone: 'pos' },
  { family: 'sel', mem: 'sel_bafouee', line: 'Sur son autel : un louveteau en bois, et votre portrait, à l’envers. Depuis {D:sel_bafouee}.', tone: 'neg' },
  { family: 'sel', mem: 'ourk_puni', line: '{H:sel} n’ont pas oublié que vous aviez pris leur parti, pour le louveteau. Ils vous le rappellent avec douceur.', tone: 'pos' },
  { family: 'sel', mem: 'sel_comete', line: 'La comète prédite par Sélènè est brodée sur sa robe. Elle facture la broderie.', tone: 'pos' },
  { family: 'sel', mem: 'sel_usure', line: 'Elle cite encore votre décret contre l’usure. {H:troc} aussi, mais pas dans le même ton.', tone: 'pos' },
  { family: 'sel', mem: 'troc_monnaie', line: '« Depuis que vous avez inventé l’argent, le ciel accepte les dons en espèces. » Elle le regrette moins qu’elle le dit.' },
  { family: 'brume', mem: 'brume_roue', line: 'Une roue est gravée au fronton de sa maison. La première. {Il:brume} la montre aux visiteurs.', tone: 'pos' },
  { family: 'brume', mem: 'brume_spolie', line: '« L’ancêtre avait inventé la roue, et vous en avez fait un char. » {Il:brume} le dit souvent. {Il:brume} l’a écrit aussi.', tone: 'neg' },
  { family: 'brume', mem: 'brume_ronde', line: 'Un globe trône sur son bureau. {Il:brume} le fait tourner quand vous parlez, pour vous rappeler qui avait raison.', tone: 'pos' },
  { family: 'brume', mem: 'ourk_duel', line: 'Depuis un certain duel, la famille siffle en vous parlant : il manque deux dents à l’ancêtre, et à tous les portraits.', tone: 'neg' },
  { family: 'brume', mem: 'brume_poudre', line: 'Il manque un sourcil à tous les siens depuis frère Brumaire. C’est devenu une tradition, et une coiffure.' },
  { family: 'troc', mem: 'troc_monnaie', line: 'Un coquillage pend à son cou. Le premier. Il ne le vend pas : il en demande trop.', tone: 'pos' },
  { family: 'troc', mem: 'troc_navires', line: 'Une maquette des trois navires de Trokos trône dans son bureau. Avec l’addition.', tone: 'pos' },
  { family: 'troc', mem: 'troc_dette', line: 'Il a encadré votre première reconnaissance de dette. « Pour l’émotion », dit-il.' },
  { family: 'troc', mem: 'sel_usure', line: 'Il prête désormais « à amitié », depuis votre décret contre l’usure. Le taux n’a pas bougé.', tone: 'neg' },
];
