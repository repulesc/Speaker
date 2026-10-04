import { detectLocale, translate } from './translate';
import type { Locale } from './types';

const STORAGE_KEY = 'spa:locale';

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'hu') return saved;
  } catch {
    // Storage blocked: fall back to the browser language.
  }
  return detectLocale(navigator.languages ?? [navigator.language]);
}

let current = $state<Locale>(initialLocale());

/** Reactive locale and translation function for components. */
export const i18n = {
  get locale(): Locale {
    return current;
  },
  set locale(value: Locale) {
    current = value;
    document.documentElement.lang = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Not remembered; still switches for this session.
    }
  },
  t(key: string, params?: Record<string, string | number>): string {
    return translate(current, key, params);
  },
};
