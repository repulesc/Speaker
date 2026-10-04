/// <reference lib="webworker" />
import { runTask, type AnalyzeRequest } from './tasks';

/** Runs the engine off the main thread (jobs in src/engine/tasks.ts). */
self.onmessage = (event: MessageEvent<AnalyzeRequest>) => self.postMessage(runTask(event.data));
