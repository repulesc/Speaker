import { buildContext, currentPlacement } from '../../engine/context';
import {
  applyChange,
  type Aspect,
  type Experiment,
  type ListeningAnswers,
} from '../../engine/listening';
import type { ListeningState, ListeningTry, Project } from '../../engine/types';
import { activeVariant } from '../plan/placement';
import { newId, nowIso } from '../state/ids';
import { SIZE_LIMITS } from '../state/limits';

/**
 * The listening check in the project (docs/ROADMAP_V8.md §4, V9 §5): the answers, and the changes
 * tried with how they sounded. Every edit goes through the workspace, so
 * Undo works as everywhere else; "Put it back" restores the exact positions from before a try.
 */
function state(project: Project): ListeningState {
  project.listening ??= { answers: {}, at: nowIso(), tries: [] };
  return project.listening;
}

function touch(s: ListeningState) {
  s.at = nowIso();
}

/** One answer; the same answer again (or undefined) clears it. */
export function setAnswer<A extends Aspect>(
  project: Project,
  aspect: A,
  value: ListeningAnswers[A] | undefined,
): void {
  const s = state(project);
  if (value === undefined || s.answers[aspect] === value) delete s.answers[aspect];
  else s.answers[aspect] = value;
  touch(s);
}

/**
 * Tries an experiment: a move is made for you (and remembered, to put it back); anything else is
 * just noted as tried. Returns false when the move no longer fits (the setup changed since).
 */
export function tryExperiment(project: Project, experiment: Experiment): boolean {
  const s = state(project);
  const variant = activeVariant(project);
  const entry: ListeningTry = { id: newId(), experiment: experiment.id, at: nowIso() };
  const by = Number(experiment.params.by);
  if (Number.isFinite(by) && by > 0) entry.by = by;
  if (experiment.change?.kind === 'toeIn') entry.degrees = true;
  if (experiment.change) {
    const ctx = buildContext(project);
    if (!ctx) return false;
    const moved = applyChange(ctx, currentPlacement(ctx), experiment.change);
    if (!moved) return false;
    entry.before = JSON.parse(
      JSON.stringify({ speakers: variant.speakers, listener: variant.listener.ears }),
    ) as NonNullable<ListeningTry['before']>;
    for (const side of ['left', 'right'] as const) {
      variant.speakers[side].base = { ...moved.speakers[side].base };
      variant.speakers[side].toeInDeg = moved.speakers[side].toeInDeg;
    }
    variant.listener.ears = { ...moved.listener };
  }
  s.tries.push(entry);
  if (s.tries.length > SIZE_LIMITS.tries) s.tries.shift();
  return true;
}

export function setTryResult(project: Project, id: string, result: ListeningTry['result']): void {
  const t = project.listening?.tries.find((x) => x.id === id);
  if (!t) return;
  if (result === undefined) delete t.result;
  else t.result = result;
}

/** Puts the speakers and the seat back where they were before this try. */
export function putBack(project: Project, id: string): void {
  const t = project.listening?.tries.find((x) => x.id === id);
  if (!t?.before) return;
  const variant = activeVariant(project);
  variant.speakers = JSON.parse(JSON.stringify(t.before.speakers)) as typeof variant.speakers;
  variant.listener.ears = { ...t.before.listener };
  delete t.before;
}

/** The latest try still waiting for "how was it?". */
export function pendingTry(project: Project): ListeningTry | null {
  const last = project.listening?.tries.at(-1);
  return last && !last.result ? last : null;
}
