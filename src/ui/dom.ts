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
    .replace(/ ([?!;])/g, '\u202f$1')
    .replace(/ :/g, '\u00a0:')
    .replace(/« /g, '«\u00a0')
    .replace(/ »/g, '\u00a0»');
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export const ICONS = {
  left: '<svg viewBox="0 0 9 15"><path d="M7.5 1.5 L1.5 7.5 L7.5 13.5"/></svg>',
  right: '<svg viewBox="0 0 9 15"><path d="M1.5 1.5 L7.5 7.5 L1.5 13.5"/></svg>',
  deck: '<svg viewBox="0 0 24 24"><rect x="6.5" y="3" width="12" height="16" rx="1.6" transform="rotate(8 12 11)"/><rect x="4.5" y="5" width="12" height="16" rx="1.6" transform="rotate(-6 10 13)" fill="rgba(8,7,12,.8)"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  up1: '<svg viewBox="0 0 16 15"><path d="M3 10 L8 5 L13 10"/></svg>',
  up2: '<svg viewBox="0 0 16 15"><path d="M3 8 L8 3 L13 8"/><path d="M3 13 L8 8 L13 13"/></svg>',
  down1: '<svg viewBox="0 0 16 15"><path d="M3 5 L8 10 L13 5"/></svg>',
  down2: '<svg viewBox="0 0 16 15"><path d="M3 2 L8 7 L13 2"/><path d="M3 7 L8 12 L13 7"/></svg>',
};
