import type { BoundaryId, LayerId } from '../engine/types';
import type { StepId } from './session.svelte';

/** What the user is currently looking at or has selected. Not saved with the project. */
export type Selection =
  | { kind: 'none' }
  | { kind: 'speaker'; side: 'left' | 'right' }
  | { kind: 'seat' }
  | { kind: 'object'; id: string };

let step = $state<StepId>('room');
let selection = $state<Selection>({ kind: 'none' });
let boundary = $state<BoundaryId>('left');
let view = $state<'top' | 'side'>('top');
let layer = $state<LayerId>('overall');
/** The bass note shown by the room-mode explorer (Hz), or null when it is off. */
let modeFrequency = $state<number | null>(null);
/** The other setup drawn over the bass chart (Compare), or null. */
let compareId = $state<string | null>(null);
/** Index of the best-spot candidate being previewed on the map, or null for the current setup. */
let candidate = $state<number | null>(null);
/** The side view is hidden until asked for (docs/REVAMP_PLAN.md). */
let sideOpen = $state(false);

export const ui = {
  get step() {
    return step;
  },
  set step(value: StepId) {
    step = value;
    // A preview belongs to the home page and a comparison to the Why page; leaving ends them.
    if (value !== 'results') candidate = null;
    if (value !== 'why') compareId = null;
  },
  get selection() {
    return selection;
  },
  select(value: Selection) {
    selection = value;
  },
  /** The wall, floor or ceiling shown in the Surfaces step. */
  get boundary() {
    return boundary;
  },
  set boundary(value: BoundaryId) {
    boundary = value;
  },
  get layer() {
    return layer;
  },
  set layer(value: LayerId) {
    layer = value;
  },
  get modeFrequency() {
    return modeFrequency;
  },
  set modeFrequency(value: number | null) {
    modeFrequency = value;
  },
  get compareId() {
    return compareId;
  },
  set compareId(value: string | null) {
    compareId = value;
  },
  get candidate() {
    return candidate;
  },
  set candidate(value: number | null) {
    candidate = value;
  },
  get sideOpen() {
    return sideOpen;
  },
  set sideOpen(value: boolean) {
    sideOpen = value;
  },
  /** Which drawing is visible when only one fits (tablet, phone). */
  get view() {
    return view;
  },
  set view(value: 'top' | 'side') {
    view = value;
  },
};
