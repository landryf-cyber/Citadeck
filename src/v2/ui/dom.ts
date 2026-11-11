/** Petits outils DOM, typographie française et icônes. */
import { RES, type Bag, type Res } from '../core/types';

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/** Échappe le HTML et pose les espaces insécables de la typographie française. */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/ ([?!;:])/g, ' $1')
    .replace(/« /g, '« ')
    .replace(/ »/g, ' »')
    .replace(/\s?−\s?(\d)/g, ' −$1');
}

/** Met en valeur les citations entre guillemets (ce dont les familles se souviennent). */
export function rich(s: string): string {
  return esc(s).replace(/« ([^»]{1,140}?) »/g, '<q>« $1 »</q>');
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export const RES_ICON: Record<Res, string> = {
  vivres: '<svg viewBox="0 0 24 24"><path d="M12 21V8"/><path d="M12 9c-3-1-4.5-3.5-4.5-6 3 .5 4.5 3 4.5 6zM12 13c-3-1-5-3.2-5-5.8 3.2.6 5 2.8 5 5.8zM12 13c3-1 5-3.2 5-5.8-3.2.6-5 2.8-5 5.8zM12 17c-3-1-5-3.2-5-5.8 3.2.6 5 2.8 5 5.8zM12 17c3-1 5-3.2 5-5.8-3.2.6-5 2.8-5 5.8z"/></svg>',
  armee: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 5-3.2 8.2-7 10-3.8-1.8-7-5-7-10V6z"/><path d="M12 3v18M5.5 10h13"/></svg>',
  savoir: '<svg viewBox="0 0 24 24"><path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/></svg>',
  tresor: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><rect x="9.5" y="9.5" width="5" height="5"/></svg>',
};

export const ICON = {
  house: '<svg viewBox="0 0 24 24"><path d="M4 20V10l8-6 8 6v10z"/><path d="M10 20v-5h4v5"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  hourglass: '<svg viewBox="0 0 24 24"><path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/></svg>',
  warn: '<svg viewBox="0 0 24 24"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.2v.3"/></svg>',
  dice: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 5c3-1.5 5.5-1.5 8 0v15c-2.5-1.5-5-1.5-8 0zM20 5c-3-1.5-5.5-1.5-8 0v15c2.5-1.5 5-1.5 8 0z"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};

/** Coût ou gain en pastilles « icône + nombre ». */
export function bagChips(b: Bag, sign = '', cls = ''): string {
  return RES.filter((r) => b[r])
    .map((r) => `<span class="chip ${cls} r-${r}">${RES_ICON[r]}<b>${sign}${b[r]}</b></span>`)
    .join('');
}
