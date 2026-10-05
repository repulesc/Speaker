import type { ListeningNote, Project } from '../../engine/types';
import { activeVariant } from '../plan/placement';
import { newId, nowIso } from '../state/ids';
import { SIZE_LIMITS } from '../state/limits';
import { setupKey } from './notes';

/**
 * "Live with it" (owner decision, docs/ROADMAP_V7.md): after Apply, three optional faces, kept as
 * listening notes on this device only: this position, the one before, and the speakers overall.
 * Comparing the two positions with the app's scores is a gentle sentence, never a verdict: the
 * listener's ears decide (🟣 subjective).
 */
export type About = NonNullable<ListeningNote['about']>;
export const ABOUT: readonly About[] = ['position', 'before', 'speakers'];
/** Three faces: not really, fine, love it. */
export const FACES = [1, 3, 5] as const;
export type Face = (typeof FACES)[number];

/** Called inside the Apply edit, before the speakers move: remembers what was there. */
export function rememberBefore(project: Project, score: number): void {
  const variant = activeVariant(project);
  variant.previous = {
    key: setupKey(variant),
    score: Math.min(1, Math.max(0, score)),
    at: nowIso(),
  };
}

/** The card shows while the setup stands where Apply put it and the listener has not hidden it. */
export function liveWithItShown(project: Project): boolean {
  const variant = activeVariant(project);
  return (
    !!variant.previous && !variant.previous.hidden && setupKey(variant) !== variant.previous.key
  );
}

function keyFor(project: Project, about: About): string | undefined {
  const variant = activeVariant(project);
  if (about === 'position') return setupKey(variant);
  if (about === 'before') return variant.previous?.key;
  return undefined;
}

const matches = (n: ListeningNote, variantId: string, about: About, key: string | undefined) =>
  n.about === about && (about === 'speakers' || (n.variantId === variantId && n.setupKey === key));

export function faceOf(project: Project, about: About): Face | undefined {
  const variant = activeVariant(project);
  const key = keyFor(project, about);
  const note = project.notes.filter((n) => matches(n, variant.id, about, key)).at(-1);
  return note?.rating as Face | undefined;
}

/** One face per question: a new tap replaces the old one; tapping the same face clears it. */
export function setFace(project: Project, about: About, face: Face): void {
  const variant = activeVariant(project);
  const key = keyFor(project, about);
  const same = faceOf(project, about) === face;
  project.notes = project.notes.filter((n) => !matches(n, variant.id, about, key));
  if (same) return;
  project.notes.push({
    id: newId(),
    createdAt: nowIso(),
    variantId: variant.id,
    symptoms: [],
    rating: face,
    about,
    ...(key ? { setupKey: key } : {}),
  });
  if (project.notes.length > SIZE_LIMITS.notes) project.notes.shift();
}

export function hideLiveWithIt(project: Project): void {
  const previous = activeVariant(project).previous;
  if (previous) previous.hidden = true;
}

/**
 * Your faces for the two positions next to the app's scores: 'agree' when you prefer the one the
 * app scores higher, 'disagree' when you prefer the other, 'same' when you like both alike.
 * Null until both are rated. Scores within 0.02 count as equal (the robust score's own noise).
 */
export function comparison(
  project: Project,
  scoreNow: number,
): 'agree' | 'disagree' | 'same' | null {
  const now = faceOf(project, 'position');
  const before = faceOf(project, 'before');
  const previous = activeVariant(project).previous;
  if (!now || !before || !previous) return null;
  if (now === before) return 'same';
  const appPrefersNow = scoreNow - previous.score > 0.02;
  const appPrefersBefore = previous.score - scoreNow > 0.02;
  if (!appPrefersNow && !appPrefersBefore) return 'disagree';
  return now > before === appPrefersNow ? 'agree' : 'disagree';
}
