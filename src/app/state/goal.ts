import type { Project } from '../../engine/types';

/**
 * What the user wants to work out (docs/DESIGN_BRIEF_V4.md, goal-first): where the speakers go
 * with the seat staying put (the default: most people have a fixed seat), where to sit with the
 * speakers staying put, or both. Stored as the two "fixed" constraints the engine already knows.
 */
export type Goal = 'speakers' | 'seat' | 'both';

export const GOALS: readonly Goal[] = ['speakers', 'seat', 'both'];

export function goalOf(project: Project): Goal {
  const { listenerFixed, speakersFixed } = project.constraints;
  return listenerFixed ? 'speakers' : speakersFixed ? 'seat' : 'both';
}

export function setGoal(project: Project, goal: Goal): void {
  project.constraints.listenerFixed = goal === 'speakers';
  project.constraints.speakersFixed = goal === 'seat';
}
