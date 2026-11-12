/**
 * Portraits des chefs de famille : un buste en traits lumineux, dans le même langage que les
 * illustrations (aplats sombres, contours clairs). La coiffe et les attributs changent à chaque ère
 * (Ourk passe de la fourrure au casque spatial, Brume finit en écran), le visage suit l'humeur :
 * sourcils froncés et bouche amère chez les hostiles, sourire chez les dévoués.
 * Tout est dessiné dans un repère 100×100 centré sur (50, 50), puis mis à l'échelle du médaillon.
 */

export type PortraitFam = 'ourk' | 'sel' | 'brume' | 'troc' | 'rival';

interface Pal {
  /** contour clair */
  st: string;
  /** peau */
  skin: string;
  /** étoffe, coiffe sombre */
  dark: string;
  /** accent vif */
  acc: string;
  /** blanc cassé (voiles, barbes de vieillard) */
  pale: string;
  /** trait discret */
  dim: string;
  /** teinte moyenne (chapeaux, étoffes vives) */
  mid: string;
}

const P = (d: string, fill: string, st: string, w = 1.6, extra = ''): string =>
  `<path d="${d}" fill="${fill}" stroke="${st}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
const L = (d: string, st: string, w = 1.8): string => P(d, 'none', st, w);
const C = (x: number, y: number, r: number, fill: string, st = 'none', w = 1.4): string =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${st}" stroke-width="${w}"/>`;

/** Yeux, sourcils, nez, bouche selon l'humeur (−3 à +3). */
function face(m: number, p: Pal, o: { eyes?: boolean; brows?: boolean; nose?: boolean; mouthY?: number } = {}): string {
  let s = '';
  if (o.brows !== false) {
    if (m <= -1) s += L('M38.5 39.2 L46 42', p.st, 2) + L('M61.5 39.2 L54 42', p.st, 2);
    else if (m >= 2) s += L('M38.5 40.5 Q42 36.6 46 39.4', p.st, 1.8) + L('M61.5 40.5 Q58 36.6 54 39.4', p.st, 1.8);
    else s += L('M38.8 40.6 L46 40', p.st, 1.8) + L('M61.2 40.6 L54 40', p.st, 1.8);
  }
  if (o.eyes !== false) {
    if (m <= -2) s += L('M40.4 45.2 L45.6 46.2', p.st, 2) + L('M59.6 45.2 L54.4 46.2', p.st, 2);
    else s += C(43, 45.6, 1.9, p.st) + C(57, 45.6, 1.9, p.st);
  }
  if (o.nose !== false) s += L('M50 46.8 L48.4 52.2 L51.2 52.6', p.dim, 1.4);
  const y = o.mouthY ?? 56.5;
  const c = m >= 2 ? 4.4 : m >= 1 ? 2.4 : m <= -2 ? -3.4 : m <= -1 ? -2 : 0.4;
  const e = c < 0 ? -c * 0.35 : 0;
  s += L(`M44.4 ${y + e} Q50 ${y + c} 55.6 ${y + e}`, p.st, 1.9);
  return s;
}

const SHOULDERS = 'M6 104 Q10 74 36 69 L64 69 Q90 74 94 104 Z';
const NECK = 'M43 60 L43 71 L57 71 L57 60 Z';
const HEAD = 'M31.5 45 Q31.5 25.5 50 25.5 Q68.5 25.5 68.5 45 Q68.5 63.5 50 65.5 Q31.5 63.5 31.5 45 Z';

function bust(p: Pal, cloth = p.dark): string {
  // une ombre sous le menton et un reflet sur la joue : le visage prend du volume
  return P(SHOULDERS, cloth, p.st, 1.6) + P(NECK, p.skin, p.st, 1.4) + P(HEAD, p.skin, p.st, 1.7)
    + `<path d="M36 56 Q50 68 64 56 Q60 64.5 50 65.3 Q40 64.5 36 56 Z" fill="#000" opacity=".22"/>`
    + `<ellipse cx="41.5" cy="36" rx="6" ry="4" fill="#fff" opacity=".07" transform="rotate(-25 41.5 36)"/>`;
}

// ------------------------------------------------------------------------------- Ourk : la guerre

function ourk(era: number, m: number, p: Pal): string {
  let s = '';
  if (era === 0) {
    // fourrure, crinière, os dans les cheveux, barbe hirsute
    s += P(SHOULDERS, p.dark, p.st) + L('M14 86 L20 80 L25 87 L31 79 L37 86 M63 86 L69 79 L75 87 L80 80 L86 86', p.dim, 1.4);
    s += P(NECK, p.skin, p.st, 1.4) + P(HEAD, p.skin, p.st, 1.7);
    s += P('M30 47 L27.5 35 L33.5 37 L33 27 L39.5 31 L42.5 21.5 L48 28.5 L53.5 21 L57 29 L63.5 24.5 L64.5 33.5 L71 32 L69.5 47 Q66 36 50 33.5 Q34 36 30 47 Z', p.dark, p.st, 1.5);
    s += L('M56 24 L64 31', p.pale, 2.4) + C(55.4, 23.4, 1.6, p.pale) + C(64.6, 31.6, 1.6, p.pale);
    s += P('M32.5 50 Q33 68 50 72 Q67 68 67.5 50 L64 57 L60 54 L56 60.5 L50 58.5 L44 60.5 L40 54 L36 57 Z', p.dark, p.st, 1.4);
    s += face(m, p);
  } else if (era === 1) {
    // hoplite : casque corinthien à cimier
    s += bust(p) + L('M30 76 Q50 82 70 76', p.dim, 1.4);
    s += P('M50 6 Q66 8 70 25 Q60 15 50 16 Q40 15 30 25 Q34 8 50 6 Z', p.acc, p.st, 1.4);
    s += P('M30 49 Q28 22 50 21 Q72 22 70 49 L64.5 50 L64.5 38.5 Q50 35.5 35.5 38.5 L35.5 50 Z', p.dark, p.st, 1.6);
    s += P('M37 54 Q38 64 50 66 Q62 64 63 54 Q57 59.5 50 59.5 Q43 59.5 37 54 Z', p.dark, p.st, 1.2);
    s += face(m, p);
  } else if (era === 2) {
    // chevalier : heaume à visière relevée, panache
    s += bust(p) + L('M18 88 L82 88 M22 80 L78 80', p.dim, 1.2);
    s += P('M60 21 Q76 6 82 20 Q72 14 66 26 Z', p.acc, p.st, 1.3);
    s += P('M30 52 L30 36 Q31 20 50 19.5 Q69 20 70 36 L70 52 L65 52 L65 40.5 L35 40.5 L35 52 Z', p.dark, p.st, 1.6);
    s += L('M30 33.5 L70 33.5 M50 19.5 L50 33.5', p.dim, 1.3);
    s += face(m, p);
    s += L('M42.5 53.2 Q46 51 50 53 Q54 51 57.5 53.2', p.st, 1.7);
  } else if (era === 3) {
    // colonel : képi, moustache en guidon, épaulettes
    s += bust(p) + P('M12 84 L28 78 L30 86 L14 92 Z', p.acc, p.st, 1.2) + P('M88 84 L72 78 L70 86 L86 92 Z', p.acc, p.st, 1.2);
    s += L('M44 72 L50 82 L56 72', p.st, 1.3) + C(50, 87, 1.6, p.acc) + C(50, 95, 1.6, p.acc);
    s += P('M35.5 33 L37 17 Q50 14 63 17 L64.5 33 Z', p.dark, p.st, 1.5);
    s += P('M31 35 Q50 41 69 35 L66 32 Q50 36 34 32 Z', p.dark, p.st, 1.3) + C(50, 23.5, 2.6, p.acc, p.st, 1);
    s += face(m, p);
    s += P('M50 52.6 Q44 50 39 52 Q33.5 53.5 31.5 49 Q34 56.5 41 55.4 Q46.5 54.5 50 54.4 Q53.5 54.5 59 55.4 Q66 56.5 68.5 49 Q66.5 53.5 61 52 Q56 50 50 52.6 Z', p.dark, p.st, 1.2);
  } else {
    // amiral Ourk-7 : casque à bulle, visière, antenne
    s += bust(p) + P('M24 82 L32 76 L34 84 Z', p.acc, p.st, 1) + C(70, 82, 2.6, p.acc, p.st, 1);
    s += `<circle cx="50" cy="44" r="27" fill="${p.acc}" fill-opacity=".08" stroke="${p.dim}" stroke-width="1.6"/>`;
    s += L('M64 20 L71 7', p.st, 1.6) + C(71.6, 6, 2.2, p.acc);
    s += face(m, p, { eyes: false, brows: false });
    s += P('M33.5 40 L66.5 40 Q67.5 47 66 50 L34 50 Q32.5 47 33.5 40 Z', p.dark, p.st, 1.5);
    const glow = m <= -2 ? '#ff5a3c' : m >= 2 ? '#ffe08a' : p.acc;
    s += `<rect x="${m <= -1 ? 38 : 40}" y="43.3" width="${m <= -1 ? 24 : 20}" height="${m <= -2 ? 2 : 3.4}" rx="1.4" fill="${glow}"/>`;
  }
  return s;
}

// ------------------------------------------------------------------------------- Sel : la foi

function sel(era: number, m: number, p: Pal): string {
  let s = '';
  if (era === 0) {
    // Mère Sel : châle, cheveux gris, points peints au front, rides
    s += bust(p, p.dark);
    s += P('M28 66 Q24 24 50 21 Q76 24 72 66 L66 66 Q67 32 50 31 Q33 32 34 66 Z', p.pale, p.st, 1.5);
    s += P('M20 78 Q26 64 34 62 L36 70 Q50 76 64 70 L66 62 Q74 64 80 78 Q66 86 50 86 Q34 86 20 78 Z', p.dark, p.st, 1.4);
    s += C(44, 35.5, 1.4, p.acc) + C(50, 34.5, 1.4, p.acc) + C(56, 35.5, 1.4, p.acc);
    s += L('M36 50 L39 51 M64 50 L61 51 M45 60.5 Q50 62 55 60.5', p.dim, 1.2);
    s += face(m, p);
  } else if (era === 1) {
    // la Pythie : voile, laurier, fumée
    s += bust(p, p.pale) + L('M28 72 Q46 86 58 104', p.dim, 1.3);
    s += P('M29 70 Q25 26 50 23 Q75 26 71 70 L66 70 Q67 34 50 33 Q33 34 34 70 Z', p.dark, p.st, 1.5);
    for (let i = 0; i < 6; i++) {
      const a = 3.6 + i * 0.44;
      const x = 50 + Math.cos(a) * 19;
      const y = 39 + Math.sin(a) * 12;
      s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2" ry="4.4" transform="rotate(${((a * 57.3) + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${p.acc}" stroke="${p.st}" stroke-width=".8"/>`;
    }
    s += L('M80 96 Q74 86 80 78 Q86 70 80 62 Q76 56 80 50', p.dim, 1.4);
    s += face(m, p);
  } else if (era === 2) {
    // l'abbesse : guimpe et voile, croix pectorale
    s += bust(p, p.dark);
    s += P('M27 74 Q24 22 50 20 Q76 22 73 74 L64 74 L64 34 Q50 30 36 34 L36 74 Z', p.dark, p.st, 1.5);
    s += P('M35.5 34 Q50 29 64.5 34 L64.5 37 Q50 33 35.5 37 Z', p.pale, p.st, 1.1);
    s += P('M35 53 Q36 68 50 70 Q64 68 65 53 L65 72 Q50 78 35 72 Z', p.pale, p.st, 1.3);
    s += L('M50 80 L50 94 M44.5 85 L55.5 85', p.acc, 2.4);
    s += face(m, p);
  } else if (era === 3) {
    // la prieure : cornette à grandes ailes, col blanc
    s += bust(p, p.dark) + P('M38 69 L50 79 L62 69 L57 68 L50 74 L43 68 Z', p.pale, p.st, 1.1);
    s += P('M50 27 Q32 15 12 25 Q26 27 30 38 Q31 31 50 30.5 Q69 31 70 38 Q74 27 88 25 Q68 15 50 27 Z', p.pale, p.st, 1.4);
    s += P('M33 37 Q50 29 67 37 L67 43 Q50 36 33 43 Z', p.pale, p.st, 1.1);
    s += face(m, p);
  } else {
    // la révérende : auréole, chignon, haut col
    s += bust(p, p.dark) + P('M35 69 L37 60 L43 66 L50 64 L57 66 L63 60 L65 69 Z', p.pale, p.st, 1.1);
    s += `<ellipse cx="50" cy="16" rx="17" ry="4.6" fill="none" stroke="${p.acc}" stroke-width="2.6"/>`;
    s += C(50, 24, 6, p.dark, p.st, 1.4);
    s += P('M31.5 47 Q30 28 50 28 Q70 28 68.5 47 Q64 34 50 34 Q36 34 31.5 47 Z', p.dark, p.st, 1.4);
    s += face(m, p);
  }
  return s;
}

// ------------------------------------------------------------------------------- Brume : le savoir

function brume(era: number, m: number, p: Pal): string {
  let s = '';
  if (era === 0) {
    // le vieux Brume : crâne nu, spirale au front, barbe de fleuve
    s += bust(p, p.dark);
    s += L('M50 31.5 m-4 0 a4 4 0 1 1 4 4 a2 2 0 1 1 -2 -2', p.acc, 1.4);
    s += P('M33 50 Q34 76 50 92 Q66 76 67 50 Q60 59.5 50 59.5 Q40 59.5 33 50 Z', p.pale, p.st, 1.4);
    s += P('M31.5 44 Q27 40 28 34 Q33 38 33 42 Z M68.5 44 Q73 40 72 34 Q67 38 67 42 Z', p.pale, p.st, 1.1);
    s += face(m, p, { mouthY: 57 });
    s += L('M38 39 L46 41 M62 39 L54 41', p.pale, 2.6);
  } else if (era === 1) {
    // Brumos le Mesureur : front dégarni, barbe carrée, toge, compas
    s += bust(p, p.pale) + L('M20 76 Q46 84 66 104', p.dim, 1.4);
    s += P('M31.5 46 Q29 36 33 33 Q34 39 35 41 Z M68.5 46 Q71 36 67 33 Q66 39 65 41 Z', p.dark, p.st, 1.1);
    s += P('M35 54 L36 66 Q50 72 64 66 L65 54 Q58 60 50 60 Q42 60 35 54 Z', p.dark, p.st, 1.3);
    s += L('M76 68 L84 96 M76 68 L70 96 M73 82 L81 82', p.acc, 1.8) + C(76, 67, 1.8, p.acc);
    s += face(m, p);
  } else if (era === 2) {
    // frère Brumaire : capuche de moine, pince-nez
    s += bust(p, p.dark);
    s += P('M26 76 Q22 22 50 18 Q78 22 74 76 L64 72 Q68 34 50 32 Q32 34 36 72 Z', p.dark, p.st, 1.5);
    s += face(m, p);
    s += C(43, 45.6, 4.2, 'none', p.acc, 1.3) + C(57, 45.6, 4.2, 'none', p.acc, 1.3) + L('M47.2 45 Q50 43.5 52.8 45', p.acc, 1.2);
  } else if (era === 3) {
    // le docteur Brumel : cheveux en pétard, lunettes rondes, blouse, nœud papillon
    s += bust(p, p.pale) + L('M42 69 L36 104 M58 69 L64 104', p.dim, 1.4);
    s += P('M44 73 L50 76 L44 79 Z M56 73 L50 76 L56 79 Z', p.acc, p.st, 1);
    s += P('M32 42 L22 36 L29 33 L21 25 L31 27 L30 18 L38 24 L43 15 L47 23 L55 15 L57 23 L65 16 L65 25 L74 22 L70 30 L79 31 L71 36 L78 42 L68 42 Q66 31 50 31 Q34 31 32 42 Z', p.pale, p.st, 1.4);
    s += face(m, p);
    s += C(43, 45.6, 5, 'none', p.st, 1.5) + C(57, 45.6, 5, 'none', p.st, 1.5) + L('M48 45 L52 45 M38 45 L32 43.5 M62 45 L68 43.5', p.st, 1.4);
  } else {
    // BRUME : un écran, un œil, des câbles
    s += P(SHOULDERS, p.dark, p.st, 1.6) + L('M38 72 Q34 88 26 104 M50 72 L50 104 M62 72 Q66 88 74 104', p.dim, 1.6);
    s += P('M30 26 L70 26 Q74 26 74 30 L74 64 Q74 68 70 68 L30 68 Q26 68 26 64 L26 30 Q26 26 30 26 Z', p.skin, p.st, 1.8);
    for (let y = 31; y < 66; y += 4) s += L(`M29 ${y} L71 ${y}`, p.dim, 0.5);
    const glow = m <= -2 ? '#ff5a3c' : m >= 2 ? '#ffe08a' : p.acc;
    const open = m <= -2 ? 3.4 : m <= -1 ? 6 : 9;
    s += `<ellipse cx="50" cy="45" rx="13" ry="${open}" fill="${p.dark}" stroke="${glow}" stroke-width="1.8"/>`;
    s += C(50, 45, Math.min(open - 0.6, 5), glow) + C(50, 45, Math.min(open - 0.6, 2), p.dark);
    s += L(m >= 1 ? 'M41 59 Q50 63 59 59' : m <= -1 ? 'M41 61 Q50 57 59 61' : 'M41 60 L59 60', glow, 1.6);
  }
  return s;
}

// ------------------------------------------------------------------------------- Troc : le commerce

function troc(era: number, m: number, p: Pal): string {
  let s = '';
  // le sourire en coin des marchands : un côté de la bouche remonte toujours un peu
  const grin = (y = 56.5) => (m >= 0 ? L(`M54 ${y - 0.6} Q57 ${y - 1.8} 58.4 ${y - 3.4}`, p.st, 1.6) : '');
  if (era === 0) {
    // Troc : collier de coquillages, mèches, sourcil levé
    s += bust(p, p.dark);
    for (let i = 0; i < 7; i++) { const a = 0.55 + i * 0.34; s += C(+(50 + Math.cos(a) * 15).toFixed(1), +(61 + Math.sin(a) * 14).toFixed(1), 2.1, p.pale, p.st, 0.8); }
    s += P('M31.5 44 Q30 26 50 25 Q70 26 68.5 44 Q66 33 58 31 L55 35 L52 30 L47 34 L44 30 Q34 32 31.5 44 Z', p.dark, p.st, 1.4);
    s += face(m, p) + grin();
    s += L('M54 38 Q58 35 62 38', p.st, 1.6);
  } else if (era === 1) {
    // Trokos l'armateur : bonnet de marin, anneau d'oreille
    s += bust(p, p.dark) + L('M14 88 L86 88 M18 80 L82 80', p.dim, 1);
    s += P('M31 39 Q34 14 54 13 Q66 14 66 22 Q70 28 69 39 Z', p.dark, p.st, 1.5);
    s += P('M30 40 L70 40 L70 34 L30 34 Z', p.acc, p.st, 1.2);
    s += C(31.5, 53, 2.6, 'none', p.acc, 1.4);
    s += face(m, p) + grin();
  } else if (era === 2) {
    // maître Troquet : chaperon à cornette, barbiche, bourse
    s += bust(p, p.dark) + P('M60 82 Q58 90 64 94 Q72 94 72 86 Q70 80 66 80 Z', p.acc, p.st, 1.2) + L('M62 80 L68 80', p.st, 1.2);
    s += P('M28 38 Q26 22 46 18 Q66 15 72 30 Q74 38 68 40 Q50 34 32 40 Z', p.mid, p.st, 1.5);
    s += P('M70 30 Q84 34 86 52 Q80 42 72 38 Z', p.mid, p.st, 1.2);
    s += P('M46 62 L50 72 L54 62 Z', p.dark, p.st, 1.1);
    s += face(m, p) + grin();
  } else if (era === 3) {
    // Troc et Fils : haut-de-forme, monocle, favoris
    s += bust(p, p.dark) + P('M40 69 L50 82 L60 69 Z', p.pale, p.st, 1) + L('M47 74 L53 74 L50 78 Z', p.acc, 1.4);
    s += P('M37 31 L38.5 6 L61.5 6 L63 31 Z', p.dark, p.st, 1.5) + L('M38 25 L62 25', p.acc, 2.2);
    s += P('M28 33 Q50 27 72 33 Q50 35 28 33 Z', p.dark, p.st, 1.4);
    s += P('M31.5 42 L31.5 58 Q35 60 37 56 L36 44 Z M68.5 42 L68.5 58 Q65 60 63 56 L64 44 Z', p.dark, p.st, 1.1);
    s += face(m, p) + grin();
    s += C(57, 45.6, 5, 'none', p.acc, 1.5) + L('M62 46 Q66 56 64 66', p.acc, 1);
  } else {
    // TrocCorp : coiffure gominée, lunettes noires, cravate, oreillette
    s += bust(p, p.dark) + P('M40 69 L50 80 L60 69 Z', p.pale, p.st, 1) + P('M48 72 L52 72 L54 92 L50 96 L46 92 Z', p.acc, p.st, 1.1);
    s += P('M31.5 42 Q30 25 50 24 Q70 25 68.5 42 Q64 30 44 31 Q38 33 31.5 42 Z', p.dark, p.st, 1.4);
    s += face(m, p, { eyes: false });
    s += P('M35.5 42.5 L47 42.5 Q47 49.5 41 49.5 Q35.5 49.5 35.5 42.5 Z M53 42.5 L64.5 42.5 Q64.5 49.5 59 49.5 Q53 49.5 53 42.5 Z', p.dark, p.st, 1.4) + L('M47 43.5 L53 43.5', p.st, 1.3);
    s += C(31, 50, 1.8, p.acc) + grin();
    if (m >= 1) s += L('M60 41 L62 37 M61 39 L64 39', p.pale, 1);
  }
  return s;
}

// ------------------------------------------------------------------------------- la reine rivale

function rival(era: number, m: number, p: Pal): string {
  let s = bust(p, p.dark);
  s += P('M31 66 Q26 40 34 30 Q50 22 66 30 Q74 40 69 66 L64 66 Q66 40 50 36 Q34 40 36 66 Z', p.dark, p.st, 1.4);
  const tall = era >= 3 ? 16 : 12;
  s += P(`M34 34 L35 ${30 - tall} L42 ${30 - tall * 0.45} L50 ${28 - tall} L58 ${30 - tall * 0.45} L65 ${30 - tall} L66 34 Q50 30 34 34 Z`, p.acc, p.st, 1.3);
  s += C(50, 29 - tall * 0.2, 1.8, p.pale);
  s += face(m, p);
  return s;
}

/** Le portrait, découpé dans le disque du médaillon (cx, cy, r). */
export function portrait(fam: PortraitFam, era: number, mood: number, hue: number, cx: number, cy: number, r: number, id: string): string {
  const h = hue;
  const p: Pal = {
    st: `hsl(${h} 85% 84%)`,
    skin: `hsl(${h} 30% 30%)`,
    dark: `hsl(${h} 45% 13%)`,
    acc: `hsl(${h} 90% 64%)`,
    pale: `hsl(${h} 35% 80%)`,
    dim: `hsla(${h}, 70%, 80%, .45)`,
    mid: `hsl(${h} 50% 33%)`,
  };
  const e = Math.max(0, Math.min(4, era));
  const body = fam === 'ourk' ? ourk(e, mood, p) : fam === 'sel' ? sel(e, mood, p) : fam === 'brume' ? brume(e, mood, p) : fam === 'troc' ? troc(e, mood, p) : rival(e, mood, p);
  const k = r / 46;
  return `<clipPath id="${id}c"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
    `<g clip-path="url(#${id}c)"><g transform="translate(${(cx - 50 * k).toFixed(2)} ${(cy - 50 * k).toFixed(2)}) scale(${k.toFixed(3)})">${body}</g></g>`;
}
