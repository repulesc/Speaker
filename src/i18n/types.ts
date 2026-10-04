import type { en } from './en';

/** Same shape as the English messages, any string values. A missing key is a compile error. */
type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> };

export type Messages = DeepStrings<typeof en>;
export type Locale = 'en' | 'hu';
