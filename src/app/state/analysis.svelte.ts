import type { Analysis, Project } from '../../engine/types';
import type { AnalyzeRequest, AnalyzeResponse } from '../../engine/worker';

const DEBOUNCE_MS = 150;

/**
 * Runs the engine in a Web Worker, 150 ms after the last edit. The previous result stays visible
 * while a new one is computed, so nothing flashes blank (docs/UI_SPEC.md §8). A failed run clears
 * it: an old result next to an error would describe a project that no longer exists.
 */
export class AnalysisRunner {
  result = $state<Analysis | null>(null);
  busy = $state(false);
  error = $state<string | null>(null);

  #worker: Worker | null = null;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #latest = 0;

  /** Schedules an analysis of this project snapshot (a plain object, not a reactive proxy). */
  run(project: Project): void {
    clearTimeout(this.#timer);
    this.busy = true;
    this.#timer = setTimeout(() => this.#start(project), DEBOUNCE_MS);
  }

  #start(project: Project): void {
    const id = ++this.#latest;
    const request: AnalyzeRequest = { id, project };
    try {
      this.#worker ??= this.#createWorker();
      this.#worker.postMessage(request);
    } catch (error) {
      this.#fail(id, error);
    }
  }

  #createWorker(): Worker {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a static asset URL, not reactive state
    const worker = new Worker(new URL('../../engine/worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<AnalyzeResponse>) => {
      const response = event.data;
      if (response.id !== this.#latest) return; // a newer run is already on its way
      this.busy = false;
      if ('error' in response) {
        this.error = response.error;
        this.result = null;
      } else {
        this.error = null;
        this.result = response.analysis;
      }
    };
    worker.onerror = () => this.#fail(this.#latest, new Error('worker failed'));
    return worker;
  }

  #fail(id: number, error: unknown): void {
    if (id !== this.#latest) return;
    this.busy = false;
    this.error = error instanceof Error ? error.message : String(error);
    this.result = null;
  }

  dispose(): void {
    clearTimeout(this.#timer);
    this.#worker?.terminate();
    this.#worker = null;
  }
}
