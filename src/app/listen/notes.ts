import type { ListeningNote, Project, SetupVariant, SymptomId } from '../../engine/types';
import { newId, nowIso } from '../state/ids';
import { SIZE_LIMITS } from '../state/limits';

export const SYMPTOMS: readonly SymptomId[] = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07'];

/** "How long have you listened to this setup?" as hours (docs/UI_SPEC.md §7). */
export const DURATIONS = { short: 0.5, hours: 3, days: 48 } as const;
export type Duration = keyof typeof DURATIONS;

export interface NoteDraft {
  variantId: string;
  setupKey: string;
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
    setupKey: draft.setupKey,
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

/**
 * A short fingerprint of what the ears heard: speaker and seat positions, toe-in and the objects,
 * to the centimetre. A rating only describes the setup as it stood (R3 review F2): once anything
 * moves, older ratings no longer count towards the comparison with the app.
 */
export function setupKey(variant: SetupVariant): string {
  const cm = (v: number) => Math.round(v * 100);
  const point = (p: { x: number; y: number; z: number }) => [cm(p.x), cm(p.y), cm(p.z)];
  const parts = [
    ...(['left', 'right'] as const).map((side) => [
      ...point(variant.speakers[side].base),
      Math.round(variant.speakers[side].toeInDeg),
    ]),
    point(variant.listener.ears),
    ...variant.objects.map((o) => [
      o.kind,
      ...point(o.position),
      ...point(o.size),
      o.material ?? '',
    ]),
    variant.busyness?.value ?? '',
  ];
  // FNV-1a: short, stable, and good enough to tell arrangements apart.
  let hash = 0x811c9dc5;
  for (const ch of JSON.stringify(parts)) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** The ratings given to each setup as it stands now, by setup id. */
export function ratingsBySetup(
  notes: ListeningNote[],
  variants: SetupVariant[],
): Map<string, number[]> {
  const current = new Map(variants.map((v) => [v.id, setupKey(v)]));
  const map = new Map<string, number[]>();
  for (const n of notes) {
    // A face for the speakers overall says nothing about where they stand.
    if (n.rating && n.about !== 'speakers' && n.setupKey === current.get(n.variantId)) {
      map.set(n.variantId, [...(map.get(n.variantId) ?? []), n.rating]);
    }
  }
  return map;
}
