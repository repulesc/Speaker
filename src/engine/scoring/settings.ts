import type { ComponentId, GoalId, Goals } from '../types';
import { DEFAULT_WEIGHTS } from './thresholds';

export type ReflectionMode = 'off' | 'treat' | 'keep';

export interface ScoringSettings {
  weights: Record<ComponentId, number>;
  angleTarget: number;
  /** Multiplies the corner penalty in C7 (1 = full penalty). */
  cornerPenaltyFactor: number;
  reflectionMode: ReflectionMode;
  /** Both "wide stage" and "precise imaging" requested: the UI explains the compromise. */
  goalConflict: boolean;
}

/** Goal intensity: 0 don't care, 0.5 nice to have, 1 important. */
function intensity(goals: Goals, id: GoalId): number {
  return (goals.weights[id] ?? 0) / 2;
}

/**
 * Goals adjust relative weights and targets within bounds (docs/SCORING.md §3). They never change
 * a component's value, the physics, or the hard constraints.
 */
export function scoringSettings(goals: Goals): ScoringSettings {
  const wide = intensity(goals, 'wide-stage');
  const precise = intensity(goals, 'precise-imaging');
  const flat = intensity(goals, 'flat-response');
  const deep = intensity(goals, 'deep-bass');

  const w: Record<ComponentId, number> = { ...DEFAULT_WEIGHTS };
  w.C4 *= 1 + 0.3 * precise;
  // "Flat response" emphasises the bass components by de-emphasising the guidelines.
  for (const id of ['C3', 'C4', 'C5', 'C6', 'C7'] as const) w[id] /= 1 + 0.2 * flat;

  const goalConflict = wide > 0 && precise > 0;
  const reflectionMode: ReflectionMode = goalConflict
    ? 'off'
    : precise > 0
      ? 'treat'
      : wide > 0
        ? 'keep'
        : 'off';
  if (reflectionMode !== 'off') w.C8 = 0.1 * Math.max(wide, precise);

  const total = Object.values(w).reduce((a, b) => a + b, 0);
  for (const id of Object.keys(w) as ComponentId[]) w[id] /= total;

  return {
    weights: w,
    angleTarget: 60 + 2 * wide - 2 * precise,
    cornerPenaltyFactor: 1 - 0.3 * deep,
    reflectionMode,
    goalConflict,
  };
}
