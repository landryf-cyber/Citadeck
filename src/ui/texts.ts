import type { EndingId, GaugeId, Keyword } from '../core/types';

export const DEFEAT: Record<GaugeId, Record<'low' | 'high', { title: string; text: string }>> = {
  food: {
    low: { title: 'Famine', text: 'Les greniers sont vides. Le peuple a mangé les semences, puis les lois, puis vous.' },
    high: { title: 'Abondance', text: 'Ventres pleins, greniers pleins. Plus personne ne travaille, ne garde, ne pense. La cité s’est endormie. Elle ne s’est pas réveillée.' },
  },
  army: {
    low: { title: 'Invasion', text: 'Plus personne sur les remparts. Les voisins sont entrés sans frapper. Ils ont trouvé ça joli.' },
    high: { title: 'Coup d’État', text: 'L’armée était si forte qu’elle s’est demandé à quoi vous serviez. Elle n’a pas trouvé.' },
  },
  knowledge: {
    low: { title: 'Obscurité', text: 'Plus personne ne sait lire les lois, ni pourquoi il y en avait. On vous a oublié avec le reste.' },
    high: { title: 'Technocratie', text: 'Les savants ont démontré, schémas à l’appui, que vous étiez inutile. La démonstration était élégante.' },
  },
  treasure: {
    low: { title: 'Banqueroute', text: 'Les coffres sont vides. Les créanciers ont emporté le trône. C’était du chêne.' },
    high: { title: 'Ploutocratie', text: 'Tant d’or que tout s’achète. Votre trône aussi. Il est parti aux enchères, à un prix décevant.' },
  },
};

export const ENDINGS: Record<EndingId, { over: string; title: string; text: string }> = {
  science: {
    over: 'Victoire scientifique',
    title: 'L’Envol',
    text: 'Votre civilisation a quitté son berceau. Elle emporte ses livres, ses doutes et une mauvaise habitude : poser des questions. Les étoiles n’ont qu’à bien se tenir.',
  },
  military: {
    over: 'Victoire militaire',
    title: 'L’Empire',
    text: 'Il n’y a plus de voisins. Il n’y a plus de frontières. Il y a vous, partout, et un grand silence. Vos généraux cherchent déjà une autre planète.',
  },
  culture: {
    over: 'Victoire culturelle',
    title: 'L’Âge d’or',
    text: 'On chante vos chansons dans des langues que vous ne parlez pas. Personne n’a été conquis. Tout le monde a été convaincu. C’est pire, disent vos voisins. Ils fredonnent.',
  },
};

export const ARCHETYPE: Record<Keyword, string> = {
  Foi: 'Théocratie',
  Guerre: 'Cité guerrière',
  Commerce: 'République marchande',
  Science: 'Cité savante',
  Culture: 'Cité des arts',
  Nature: 'Cité-jardin',
};

export function relationWord(r: number): string {
  if (r <= -45) return 'en guerre ouverte';
  if (r <= -20) return 'hostile';
  if (r < 20) return 'méfiante';
  if (r < 45) return 'cordiale';
  return 'alliée';
}

export const KIND_TAG: Record<string, string> = {
  consequence: 'Conséquence',
  crisis: 'Crise',
  tutorial: 'Premiers pas',
};
