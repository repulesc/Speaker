import type { explainSpeakerSpot } from '../../engine/explain';
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
/** On the speaker map: the pair that would stand at the point, scored the way Apply scores it. */
let spot = $state<ReturnType<typeof explainSpeakerSpot>>(null);
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
  get spot() {
    return spot;
  },
  /** Follows the pointer unless a spot is pinned. */
  hover(x: number, y: number) {
    if (!pinned) point = { x, y };
  },
  leave() {
    if (!pinned) {
      point = null;
      explanation = null;
      spot = null;
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
    spot = null;
  },
  /**
   * Asks the engine about the current point: on the seat map, a seat there with the speakers given
   * (default: as they are); on the speaker map, the speaker pair there with the seat as it is.
   */
  refresh(project: Project, speakers?: Placement['speakers'], speakerMap = false) {
    clearTimeout(timer);
    if (!point) return;
    // A plain copy: reactive proxies cannot be sent to the worker.
    const at = { x: point.x, y: point.y };
    const mine = ++ticket;
    timer = setTimeout(async () => {
      if (speakerMap) {
        const response = await analysis.ask(project, { kind: 'speakerSpot', at });
        if (mine !== ticket) return; // a newer question is on its way
        spot = response && 'speakerSpot' in response ? response.speakerSpot : null;
        explanation = null;
        return;
      }
      const response = await analysis.ask(project, { kind: 'explain', seat: at, speakers });
      if (mine !== ticket) return;
      explanation = response && 'explanation' in response ? response.explanation : null;
      spot = null;
    }, DELAY_MS);
  },
};
