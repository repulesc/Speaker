import type { Placement, PointExplanation, Project } from '../../engine/types';
import { analysis } from '../session.svelte';

/**
 * The probe (docs/REVAMP_PLAN.md): point at the map and see why a seat there is good or poor.
 * Hover on a mouse, tap on a touch screen; a click pins it. The explanation comes from the engine
 * (explainPoint, in the worker) and is refreshed whenever the project or the point changes.
 */
let point = $state<{ x: number; y: number } | null>(null);
let pinned = $state(false);
let explanation = $state<PointExplanation | null>(null);
let ticket = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

const DELAY_MS = 60;

export const probe = {
  get point() {
    return point;
  },
  get pinned() {
    return pinned;
  },
  get explanation() {
    return explanation;
  },
  /** Follows the pointer unless a spot is pinned. */
  hover(x: number, y: number) {
    if (!pinned) point = { x, y };
  },
  leave() {
    if (!pinned) {
      point = null;
      explanation = null;
    }
  },
  pin(x: number, y: number) {
    point = { x, y };
    pinned = true;
  },
  clear() {
    point = null;
    pinned = false;
    explanation = null;
  },
  /** Asks the engine about the current point, for the speakers given (default: as they are). */
  refresh(project: Project, speakers?: Placement['speakers']) {
    clearTimeout(timer);
    if (!point) return;
    // A plain copy: reactive proxies cannot be sent to the worker.
    const at = { x: point.x, y: point.y };
    const mine = ++ticket;
    timer = setTimeout(async () => {
      const response = await analysis.ask(project, { kind: 'explain', seat: at, speakers });
      if (mine !== ticket) return; // a newer question is on its way
      explanation = response && 'explanation' in response ? response.explanation : null;
    }, DELAY_MS);
  },
};
