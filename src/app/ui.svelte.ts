import type { BoundaryId, LayerId, Placement, Vec3 } from '../engine/types';
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
/** A seat layer, or 'speakers': where the speakers would score best, the seat staying put. */
let layer = $state<LayerId | 'speakers'>('goals');
/** The bass note shown by the room-mode explorer (Hz), or null when it is off. */
let modeFrequency = $state<number | null>(null);
/** The other setup drawn over the bass chart (Compare), or null. */
let compareId = $state<string | null>(null);
/** Index of the best-spot candidate being previewed on the map, or null for the current setup. */
let candidate = $state<number | null>(null);
/** The side view is hidden until asked for (docs/REVAMP_PLAN.md). */
let sideOpen = $state(false);
/** Colours stretched over this room's own range (default) or the same scale for every room. */
let heatScale = $state<'room' | 'absolute'>('room');
/** For a moment after "Apply": the speakers and seat glide, and the old spots are outlined. */
let glide = $state(false);
let before = $state<{ speakers: Placement['speakers']; listener: Vec3 } | null>(null);
let beforeTimer: ReturnType<typeof setTimeout> | undefined;
/** The first-run survey is open (a new project without a room). */
let survey = $state(false);
/** The room fades in once, right after the survey (the "reveal"). */
let reveal = $state(false);
/**
 * The panel's three steps (docs/ROADMAP_V8.md §2), named after what you do: describe the room and
 * the speakers, see where they go, and judge the result by ear.
 */
export type PanelStep = 'setup' | 'place' | 'listen';
let tab = $state<PanelStep>('place');
/** The group of the Set up page to scroll to when it opens (a section id), or null. */
let roomTarget = $state<string | null>(null);
const SECTION_IDS = ['room', 'surfaces', 'furnishing', 'speakers', 'goals'];
/** The Speakers page's "More details" stays open once opened, for this visit. */
let speakerDetails = $state(false);

export const ui = {
  get step() {
    return step;
  },
  /**
   * Where to go. Since V8 everything is one of three steps: the sections are groups of Set up, the
   * reasons and the bass are part of Place, the tips and the notes part of Listen. Callers keep
   * naming the place they want; this works out which step shows it.
   */
  set step(value: StepId) {
    step = 'results';
    if (SECTION_IDS.includes(value)) {
      tab = 'setup';
      roomTarget = value;
      candidate = null;
      return;
    }
    roomTarget = null;
    if (value === 'treat' || value === 'listen') {
      tab = 'listen';
      candidate = null;
      return;
    }
    tab = 'place';
  },
  get tab() {
    return tab;
  },
  set tab(value: PanelStep) {
    tab = value;
    roomTarget = null;
    // A preview belongs to Place; leaving it ends the preview.
    if (value !== 'place') candidate = null;
  },
  /** Whether Set up is showing (kept for the callers that think of it as "the room sheet"). */
  get roomOpen() {
    return tab === 'setup';
  },
  set roomOpen(value: boolean) {
    this.tab = value ? 'setup' : 'place';
  },
  /** Opens Set up at one group ("ready" is the treatment box). */
  openRoom(target: string | null = null) {
    tab = 'setup';
    roomTarget = target;
    candidate = null;
  },
  get roomTarget() {
    return roomTarget;
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
  set layer(value: LayerId | 'speakers') {
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
  get glide() {
    return glide;
  },
  get before() {
    return before;
  },
  /** Marks a placement change: glide to the new spots and show the old ones for a moment. */
  showChange(old: { speakers: Placement['speakers']; listener: Vec3 }) {
    clearTimeout(beforeTimer);
    before = old;
    glide = true;
    setTimeout(() => (glide = false), 700);
    beforeTimer = setTimeout(() => (before = null), 3600);
  },
  get survey() {
    return survey;
  },
  set survey(value: boolean) {
    survey = value;
  },
  get reveal() {
    return reveal;
  },
  set reveal(value: boolean) {
    reveal = value;
  },
  get heatScale() {
    return heatScale;
  },
  set heatScale(value: 'room' | 'absolute') {
    heatScale = value;
  },
  get speakerDetails() {
    return speakerDetails;
  },
  set speakerDetails(value: boolean) {
    speakerDetails = value;
  },
  /** Which drawing is visible when only one fits (tablet, phone). */
  get view() {
    return view;
  },
  set view(value: 'top' | 'side') {
    view = value;
  },
};
