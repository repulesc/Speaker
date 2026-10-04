import type { ListeningNote, Project, SymptomId } from '../../engine/types';
import { newId, nowIso } from '../state/ids';
import { SIZE_LIMITS } from '../state/limits';

export const SYMPTOMS: readonly SymptomId[] = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07'];

/** "How long have you listened to this setup?" as hours (docs/UI_SPEC.md §7). */
export const DURATIONS = { short: 0.5, hours: 3, days: 48 } as const;
export type Duration = keyof typeof DURATIONS;

export interface NoteDraft {
  variantId: string;
  rating?: ListeningNote['rating'];
  symptoms: SymptomId[];
  listenedHours?: number;
  text?: string;
}

/** Adds a note to the project; the oldest goes when the limit is reached. */
export function addNote(project: Project, draft: NoteDraft): void {
  const text = draft.text?.trim();
  project.notes.push({
    id: newId(),
    createdAt: nowIso(),
    variantId: draft.variantId,
    symptoms: draft.symptoms,
    ...(draft.rating ? { rating: draft.rating } : {}),
    ...(draft.listenedHours !== undefined ? { listenedHours: draft.listenedHours } : {}),
    ...(text ? { text: text.slice(0, SIZE_LIMITS.text) } : {}),
  });
  if (project.notes.length > SIZE_LIMITS.notes) project.notes.shift();
}

export function removeNote(project: Project, id: string): void {
  project.notes = project.notes.filter((n) => n.id !== id);
}

/** The ratings given to each setup, by setup id. */
export function ratingsBySetup(notes: ListeningNote[]): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (const n of notes) {
    if (n.rating) map.set(n.variantId, [...(map.get(n.variantId) ?? []), n.rating]);
  }
  return map;
}
