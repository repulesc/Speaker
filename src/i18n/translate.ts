import { en } from './en';
import { hu } from './hu';
import type { Locale, Messages } from './types';

export const MESSAGES: Record<Locale, Messages> = { en, hu };
export const LOCALES: readonly Locale[] = ['en', 'hu'];

/** Looks up a dotted key and fills `{name}` placeholders. Missing keys return the key itself. */
export function translate(
  locale: Locale,
  key: string,
  params: Record<string, string | number> = {},
): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      MESSAGES[locale],
    );
  if (typeof value !== 'string') return key;
  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** All dotted keys of a message tree. */
export function messageKeys(tree: object, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : messageKeys(v as object, `${prefix}${k}.`),
  );
}

export function detectLocale(languages: readonly string[]): Locale {
  return languages.some((l) => l.toLowerCase().startsWith('hu')) ? 'hu' : 'en';
}
