import { analyze } from './analyze';
import { explainPoint, explainSpeakerSpot } from './explain';
import { seatLayersFor } from './layers';
import { modeField } from './modeField';
import { setupScore, type SetupScore } from './setupScore';
import type {
  Analysis,
  ModeField,
  Placement,
  PointExplanation,
  Project,
  SeatLayers,
} from './types';

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
  | { kind: 'speakerSpot'; at: { x: number; y: number } }
  | { kind: 'modeField'; frequency: number }
  | { kind: 'setupScore' }
  | { kind: 'layers'; speakers?: Placement['speakers'] };

export interface AnalyzeRequest {
  id: number;
  project: Project;
  task?: WorkerTask;
}

export type AnalyzeResponse =
  | { id: number; analysis: Analysis }
  | { id: number; explanation: PointExplanation | null }
  | { id: number; modeField: ModeField | null }
  | { id: number; layers: SeatLayers | null }
  | { id: number; setupScore: SetupScore | null }
  | { id: number; speakerSpot: ReturnType<typeof explainSpeakerSpot> }
  | { id: number; error: string };

export function runTask({ id, project, task }: AnalyzeRequest): AnalyzeResponse {
  try {
    if (task?.kind === 'explain') {
      return { id, explanation: explainPoint(project, task.seat, task.speakers) };
    }
    if (task?.kind === 'speakerSpot')
      return { id, speakerSpot: explainSpeakerSpot(project, task.at) };
    if (task?.kind === 'modeField') return { id, modeField: modeField(project, task.frequency) };
    if (task?.kind === 'setupScore') return { id, setupScore: setupScore(project) };
    if (task?.kind === 'layers') return { id, layers: seatLayersFor(project, task.speakers) };
    return { id, analysis: analyze(project) };
  } catch (error) {
    return { id, error: error instanceof Error ? error.message : String(error) };
  }
}
