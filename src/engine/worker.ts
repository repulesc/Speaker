/// <reference lib="webworker" />
import { analyze } from './analyze';
import type { Analysis, Project } from './types';

/** Runs analyze() off the main thread. Message in: { id, project }. Message out: { id, analysis } or { id, error }. */
export interface AnalyzeRequest {
  id: number;
  project: Project;
}

export type AnalyzeResponse = { id: number; analysis: Analysis } | { id: number; error: string };

self.onmessage = (event: MessageEvent<AnalyzeRequest>) => {
  const { id, project } = event.data;
  let response: AnalyzeResponse;
  try {
    response = { id, analysis: analyze(project) };
  } catch (error) {
    response = { id, error: error instanceof Error ? error.message : String(error) };
  }
  self.postMessage(response);
};
