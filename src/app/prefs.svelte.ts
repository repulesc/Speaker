/** Per-viewer conveniences kept in localStorage (never in the project): theme, start mode, welcome card. */

export type ThemePref = 'auto' | 'light' | 'dark';
export type Mode = 'quick' | 'detailed';

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return allowed.includes(value as T) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not remembered; still applies for this session.
  }
}

const THEMES = ['auto', 'light', 'dark'] as const;
const MODES = ['quick', 'detailed'] as const;

let theme = $state<ThemePref>(read('spa:theme', THEMES, 'auto'));
let mode = $state<Mode>(read('spa:mode', MODES, 'quick'));
let welcomed = $state(read('spa:welcomed', ['yes', 'no'], 'no') === 'yes');

function applyTheme(value: ThemePref): void {
  if (value === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = value;
}

export const prefs = {
  get theme() {
    return theme;
  },
  set theme(value: ThemePref) {
    theme = value;
    write('spa:theme', value);
    applyTheme(value);
  },
  get mode() {
    return mode;
  },
  set mode(value: Mode) {
    mode = value;
    write('spa:mode', value);
  },
  get welcomed() {
    return welcomed;
  },
  set welcomed(value: boolean) {
    welcomed = value;
    write('spa:welcomed', value ? 'yes' : 'no');
  },
  /** Applies the saved theme to the page. Call once at startup. */
  init(): void {
    applyTheme(theme);
  },
};
