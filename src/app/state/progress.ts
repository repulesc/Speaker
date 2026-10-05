import type { Project } from '../../engine/types';
import { activeVariant } from '../plan/placement';
import type { SectionId } from '../session.svelte';

/**
 * What the user has told us so far, section by section, for the markers in the sidebar:
 * "set" (done), "partial" or "todo". Nothing here is required beyond the room's size; the markers
 * only show what the answer rests on, and what would sharpen it.
 */
export type Status = 'done' | 'partial' | 'todo';

const BOUNDARIES = ['front', 'back', 'left', 'right', 'floor', 'ceiling'] as const;

export function setupProgress(project: Project): Record<SectionId, Status> {
  const variant = activeVariant(project);
  const { width, length, height } = project.room;
  const sizes = [width, length, height].filter((d) => d.value !== null).length;
  const certain = BOUNDARIES.filter((b) => project.surfaces.baseCertainty[b] !== 'unknown').length;
  const placed = variant.speakers.left.certainty !== 'unknown';
  return {
    room: sizes === 3 ? 'done' : sizes > 0 ? 'partial' : 'todo',
    surfaces: certain === BOUNDARIES.length ? 'done' : certain > 0 ? 'partial' : 'todo',
    furnishing:
      (variant.busyness && variant.busyness.certainty !== 'unknown') || variant.objects.length > 0
        ? 'done'
        : 'todo',
    speakers: placed ? 'done' : 'todo',
    goals: Object.values(project.goals.weights).some((w) => w) ? 'done' : 'todo',
  };
}

/** How many of the five sections are set, for "3 of 5 set". */
export function countDone(progress: Record<SectionId, Status>): number {
  return Object.values(progress).filter((s) => s === 'done').length;
}
