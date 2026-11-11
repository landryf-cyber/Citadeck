/**
 * Ce que chaque famille laisse paraître, en tête de ses cartes : son humeur (loyauté)
 * et ses souvenirs (les actes marquants des ères précédentes). C'est la voix des Lignées.
 */
import type { FamilyId } from '../core/types';

export const moods: Record<FamilyId, { hostile: string; cold: string; warm: string; devoted: string }> = {
  ourk: {
    hostile: '{F:ourk} ne vous regarde pas. Il regarde votre cou.',
    cold: '{F:ourk} vous salue du bout de la lance.',
    warm: '{F:ourk} vous tape dans le dos. Vous survivez.',
    devoted: '{F:ourk} vous appelle « chef ». Ourk n’appelle jamais personne « chef ».',
  },
  sel: {
    hostile: '{F:sel} vous bénit avec deux doigts. Pas les bons.',
    cold: '{F:sel} prie pour vous, à voix basse, avec une grimace.',
    warm: '{F:sel} a allumé une bougie pour vous. Une petite.',
    devoted: '{F:sel} assure que le ciel vous adore. Le ciel a dû le lui dire.',
  },
  brume: {
    hostile: '{F:brume} vous corrige avant même que vous ayez parlé.',
    cold: '{F:brume} soupire en vous voyant. Techniquement, c’est un bonjour.',
    warm: '{F:brume} vous a dédié une équation. Elle est fausse, par affection.',
    devoted: '{F:brume} vous trouve « presque intelligent ». C’est son plus beau compliment.',
  },
  troc: {
    hostile: '{F:troc} vous serre la main, puis compte ses bagues.',
    cold: '{F:troc} vous fait un prix. Pas un prix d’ami.',
    warm: '{F:troc} vous fait un prix d’ami. Presque un vrai.',
    devoted: '{F:troc} vous offre un cadeau. Sans l’étiquette du prix. C’est dire.',
  },
};

/** Souvenirs : si le souvenir existe et date d'une ère passée, la famille le rappelle. */
export const recalls: { family: FamilyId; mem: string; line: string }[] = [
  { family: 'ourk', mem: 'ourk_humilie', line: 'Il porte une dent de mammouth au cou. Ce n’est pas un hasard : {D:ourk_humilie}, vous avez dit {Q:ourk_humilie}' },
  { family: 'ourk', mem: 'ourk_mammouth', line: 'Le mammouth de l’ancêtre est peint sur son bouclier. Vous aussi, plus petit, derrière.' },
  { family: 'ourk', mem: 'ourk_puni', line: 'Les siens jeûnent encore un jour par an, en souvenir du louveteau. Ils vous regardent manger.' },
  { family: 'ourk', mem: 'ourk_triomphe', line: 'Dans sa famille, on raconte encore le triomphe d’Ourkos. Ils le racontent mieux chaque fois.' },
  { family: 'ourk', mem: 'ourk_duel', line: 'Il garde, dans une boîte, les deux dents de frère Brumaire.' },
  { family: 'ourk', mem: 'ourk_coregent', line: 'Un ancêtre a partagé votre trône. Il en reste un coussin, que la famille réclame.' },
  { family: 'ourk', mem: 'ourk_excuses', line: 'Vos excuses pour le mammouth sont encadrées dans le mess des officiers.' },
  { family: 'sel', mem: 'sel_bafouee', line: 'Sur son autel : un louveteau en bois, et votre portrait, à l’envers. Depuis {D:sel_bafouee}.' },
  { family: 'sel', mem: 'ourk_puni', line: '{H:sel} n’ont pas oublié que vous aviez pris leur parti, pour le louveteau. Ils vous le rappellent avec douceur.' },
  { family: 'sel', mem: 'sel_comete', line: 'La comète prédite par Sélènè est brodée sur sa robe. Elle facture la broderie.' },
  { family: 'sel', mem: 'sel_usure', line: 'Elle cite encore votre décret contre l’usure. {H:troc} aussi, mais pas dans le même ton.' },
  { family: 'sel', mem: 'troc_monnaie', line: '« Depuis que vous avez inventé l’argent, le ciel accepte les dons en espèces. » Elle le regrette moins qu’elle le dit.' },
  { family: 'brume', mem: 'brume_roue', line: 'Une roue est gravée au fronton de sa maison. La première. Il la montre aux visiteurs.' },
  { family: 'brume', mem: 'brume_spolie', line: '« L’ancêtre avait inventé la roue, et vous en avez fait un char. » Il le dit souvent. Il l’a écrit aussi.' },
  { family: 'brume', mem: 'brume_ronde', line: 'Un globe trône sur son bureau. Il le fait tourner quand vous parlez, pour vous rappeler qui avait raison.' },
  { family: 'brume', mem: 'ourk_duel', line: 'Il lui manque deux dents depuis un certain duel. Il siffle quand il vous parle.' },
  { family: 'brume', mem: 'brume_poudre', line: 'Il lui manque un sourcil, comme à tous les siens depuis frère Brumaire. C’est devenu une tradition.' },
  { family: 'troc', mem: 'troc_monnaie', line: 'Un coquillage pend à son cou. Le premier. Il ne le vend pas : il en demande trop.' },
  { family: 'troc', mem: 'troc_navires', line: 'Une maquette des trois navires de Trokos trône dans son bureau. Avec l’addition.' },
  { family: 'troc', mem: 'troc_dette', line: 'Il a encadré votre première reconnaissance de dette. « Pour l’émotion », dit-il.' },
  { family: 'troc', mem: 'sel_usure', line: 'Il prête désormais « à amitié », depuis votre décret contre l’usure. Le taux n’a pas bougé.' },
];
