import { analyze } from './analyze';
import { explainPoint } from './explain';
import { modeField } from './modeField';
import type { Analysis, ModeField, Placement, PointExplanation, Project } from './types';

/**
 * Engine jobs for the worker (src/engine/worker.ts). Message in: { id, project, task? }; without a task it is a
 * full analysis. Message out: { id, analysis | explanation | modeField } or { id, error }.
 */
export type WorkerTask =
  | { kind: 'analyze' }
  | {
      kind: 'explain';
      seat: { x: number; y: number; z?: number };
      speakers?: Placement['speakers'];
    }
  | { kind: 'modeField'; frequency: number };

export interface AnalyzeRequest {
  id: number;
  project: Project;
  task?: WorkerTask;
}

export type AnalyzeResponse =
  | { id: number; analysis: Analysis }
  | { id: number; explanation: PointExplanation | null }
  | { id: number; modeField: ModeField | null }
  | { id: number; error: string };

export function runTask({ id, project, task }: AnalyzeRequest): AnalyzeResponse {
  try {
    if (task?.kind === 'explain') {
      return { id, explanation: explainPoint(project, task.seat, task.speakers) };
    }
    if (task?.kind === 'modeField') return { id, modeField: modeField(project, task.frequency) };
    return { id, analysis: analyze(project) };
  } catch (error) {
    return { id, error: error instanceof Error ? error.message : String(error) };
  }
}
