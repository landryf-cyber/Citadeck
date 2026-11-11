import type { EraDef } from '../core/types';

/**
 * Les cinq ères. `stakes` : les enjeux montent. `wind` : chaque ère pousse une jauge,
 * à chaque décision — c'est ce qui empêche de s'installer au milieu.
 */
export const eras: EraDef[] = [
  {
    index: 0, name: 'Âge de pierre', subtitle: 'Un feu, des huttes, et déjà des problèmes.', packSize: 7,
    stakes: 1.4, crisisStakes: 1.15, wind: { food: -1 }, windText: 'La faim rôde : la Nourriture s’érode à chaque décision.',
  },
  {
    index: 1, name: 'Antiquité', subtitle: 'Le soleil, la poussière, et des gens qui écrivent.', packSize: 7,
    stakes: 1.6, crisisStakes: 1.15, wind: { army: 1 }, windText: 'Les légions grossissent : l’Armée enfle à chaque décision.',
  },
  {
    index: 2, name: 'Moyen Âge', subtitle: 'Des bougies, des cloches, et des certitudes.', packSize: 7,
    stakes: 1.65, crisisStakes: 1.0, wind: { knowledge: -3 }, windText: 'On oublie : le Savoir s’érode à chaque décision.',
  },
  {
    index: 3, name: 'Ère industrielle', subtitle: 'De la fumée. Beaucoup de fumée.', packSize: 7,
    stakes: 1.9, crisisStakes: 1.15, wind: { treasure: 1 }, windText: 'L’argent appelle l’argent : le Trésor enfle à chaque décision.',
  },
  {
    index: 4, name: 'Ère spatiale', subtitle: 'Le ciel n’est plus une limite. Le reste, si.', packSize: 7,
    stakes: 2.05, crisisStakes: 1.15, wind: { knowledge: 3 }, windText: 'Le progrès s’emballe : le Savoir enfle à chaque décision.',
  },
];
