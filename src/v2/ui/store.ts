/** Sauvegardes locales : partie en cours, méta-progression, réglages, conseils déjà vus. */
import { SAVE_VERSION } from '../core/engine';
import { loadMeta, newMeta } from '../core/meta';
import type { GameState, MetaState } from '../core/types';

const K = { game: 'citadeck.v2.game', meta: 'citadeck.v2.meta', settings: 'citadeck.v2.settings' };

export interface Settings {
  sound: boolean;
  volume: number;
  quality: 'auto' | 'high' | 'low';
  /** null = suivre prefers-reduced-motion */
  reducedMotion: boolean | null;
  /** conseils de première partie déjà montrés */
  hints: string[];
}

const DEFAULTS: Settings = { sound: true, volume: 0.7, quality: 'auto', reducedMotion: null, hints: [] };

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read<T>(key: string): T | null {
  try {
    const raw = storage()?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, v: unknown): void {
  try {
    if (v === null) storage()?.removeItem(key);
    else storage()?.setItem(key, JSON.stringify(v));
  } catch {
    /* stockage plein ou indisponible : on joue sans sauvegarde */
  }
}

export const store = {
  settings(): Settings {
    return { ...DEFAULTS, ...(read<Partial<Settings>>(K.settings) ?? {}) };
  },
  saveSettings(s: Settings): void {
    write(K.settings, s);
  },
  game(): GameState | null {
    const s = read<GameState>(K.game);
    return s && s.version === SAVE_VERSION && s.phase !== 'fin' ? s : null;
  },
  saveGame(s: GameState | null): void {
    write(K.game, s);
  },
  meta(): MetaState {
    return loadMeta(read(K.meta)) ?? newMeta();
  },
  saveMeta(m: MetaState): void {
    write(K.meta, m);
  },
  resetAll(): void {
    write(K.game, null);
    write(K.meta, null);
    write(K.settings, null);
  },
};
