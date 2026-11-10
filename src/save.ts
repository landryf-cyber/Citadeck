import type { GameState } from './core/types';
import { SAVE_VERSION } from './core/engine';

const SAVE_KEY = 'citadeck.save';
const SETTINGS_KEY = 'citadeck.settings';

export interface Settings {
  sound: boolean;
  volume: number;
  quality: 'auto' | 'high' | 'low';
  /** null = suivre prefers-reduced-motion */
  reducedMotion: boolean | null;
  tutorialDone: boolean;
}

const DEFAULTS: Settings = { sound: true, volume: 0.7, quality: 'auto', reducedMotion: null, tutorialDone: false };

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSettings(): Settings {
  try {
    const raw = storage()?.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    /* réglages corrompus : on repart des valeurs par défaut */
  }
  return { ...DEFAULTS };
}

export function saveSettings(s: Settings): void {
  try {
    storage()?.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* stockage indisponible */
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = storage()?.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    if (s.version !== SAVE_VERSION || s.phase === 'end') return null;
    return s;
  } catch {
    return null;
  }
}

export function saveGame(s: GameState): void {
  try {
    storage()?.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* stockage indisponible */
  }
}

export function clearGame(): void {
  try {
    storage()?.removeItem(SAVE_KEY);
  } catch {
    /* stockage indisponible */
  }
}
