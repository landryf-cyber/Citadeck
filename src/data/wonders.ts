import type { WonderDef } from '../core/types';

/** Douze merveilles, un effet passif chacune. `era` = ère minimale d'obtention. */
export const wonders: WonderDef[] = [
  {
    id: 'w_pierres', name: 'Les Pierres levées', era: 1, keywords: ['Foi'],
    text: 'Des pierres dressées vers le ciel. Personne ne sait pourquoi. Tout le monde y croit : vos cartes de Foi sont plus fortes.',
    passive: { type: 'keywordBonus', keyword: 'Foi', bonus: 2 },
  },
  {
    id: 'w_pyramide', name: 'La Grande Pyramide', era: 1, keywords: ['Culture'],
    text: 'Une montagne de pierre, vide à l’intérieur. Elle rassure pendant les crises : leurs pertes sont réduites.',
    passive: { type: 'crisisShield', amount: 3 },
  },
  {
    id: 'w_phare', name: 'Le Phare', era: 1, keywords: ['Commerce'],
    text: 'Un feu sur la mer. Les navires viennent. Les gains de Trésor sont amplifiés.',
    passive: { type: 'amplify', gauge: 'treasure', factor: 1.25 },
  },
  {
    id: 'w_bibliotheque', name: 'La Grande Bibliothèque', era: 1, keywords: ['Science'],
    text: 'Tous les livres du monde, et un toit en bois. Les gains de Savoir sont amplifiés.',
    passive: { type: 'amplify', gauge: 'knowledge', factor: 1.25 },
  },
  {
    id: 'w_muraille', name: 'La Grande Muraille', era: 1, keywords: ['Guerre'],
    text: 'Un mur si long qu’on l’oublie en marchant. Les pertes d’Armée sont réduites.',
    passive: { type: 'dampen', gauge: 'army', factor: 0.6 },
  },
  {
    id: 'w_jardins', name: 'Les Jardins suspendus', era: 1, keywords: ['Nature'],
    text: 'Des jardins sur les toits, arrosés par des esclaves qu’on ne voit pas. Les pertes de Nourriture sont réduites.',
    passive: { type: 'dampen', gauge: 'food', factor: 0.6 },
  },
  {
    id: 'w_colisee', name: 'Le Colisée', era: 2, keywords: ['Culture', 'Guerre'],
    text: 'Du sang, du sable, des gradins. Quand l’Armée déborde, elle devient du Trésor au lieu de vous renverser.',
    passive: { type: 'overflow', from: 'army', to: 'treasure', threshold: 85 },
  },
  {
    id: 'w_cathedrale', name: 'La Cathédrale', era: 2, keywords: ['Foi'],
    text: 'Trois siècles de chantier. Quand le Trésor déborde, les aumônes le transforment en Nourriture.',
    passive: { type: 'overflow', from: 'treasure', to: 'food', threshold: 85 },
  },
  {
    id: 'w_universite', name: 'La Grande Université', era: 2, keywords: ['Science'],
    text: 'Des bancs, des maîtres, des tavernes. Vos cartes de Science sont plus fortes.',
    passive: { type: 'keywordBonus', keyword: 'Science', bonus: 2 },
  },
  {
    id: 'w_horloge', name: 'La Tour de l’Horloge', era: 3, keywords: ['Commerce', 'Science'],
    text: 'Elle sonne les heures. Tout le monde arrive à l’heure. Chaque ère commence avec un bonus de Savoir et de Trésor.',
    passive: { type: 'eraDrift', delta: { knowledge: 8, treasure: 8 } },
  },
  {
    id: 'w_barrage', name: 'Le Grand Barrage', era: 3, keywords: ['Nature'],
    text: 'Un fleuve en laisse. Une fois, quand la Nourriture tombe à zéro, le barrage sauve la récolte.',
    passive: { type: 'floor', gauge: 'food', value: 25, once: true },
  },
  {
    id: 'w_ascenseur', name: 'L’Ascenseur spatial', era: 4, keywords: ['Science', 'Culture'],
    text: 'Un câble jusqu’aux étoiles. Les crises font moins peur, vues d’en haut : leurs pertes sont fortement réduites.',
    passive: { type: 'crisisShield', amount: 5 },
  },
];
