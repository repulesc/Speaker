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
let layer = $state<LayerId | 'speakers'>('overall');
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
/** The side panel is hidden on a wide screen, so the room fills the window. */
let panelHidden = $state(false);
/** The first-run survey is open (a new project without a room). */
let survey = $state(false);
/** The room fades in once, right after the survey (the "reveal"). */
let reveal = $state(false);
/** The result panel's tab (docs/ROADMAP_V5.md, V6): the answer, the reasons, the tips. */
export type ResultTab = 'result' | 'why' | 'tips';
let tab = $state<ResultTab>('result');
/** The "Your room" sheet: every setting on one page, opened from the header. */
let roomOpen = $state(false);
/** The group of the sheet to scroll to when it opens (a section id), or null. */
let roomTarget = $state<string | null>(null);
const SECTION_IDS = ['room', 'surfaces', 'furnishing', 'speakers', 'goals'];
/** The Speakers page's "More details" stays open once opened, for this visit. */
let speakerDetails = $state(false);

export const ui = {
  get step() {
    return step;
  },
  /**
   * Where to go. Since V6 the sections are groups of the one "Your room" sheet, and Why, Bass and
   * the tips are tabs of the result panel; only Listening notes is still a page of its own. Callers
   * keep naming the place they want; this works out how to show it.
   */
  set step(value: StepId) {
    if (SECTION_IDS.includes(value)) {
      roomOpen = true;
      roomTarget = value;
      step = 'results';
      candidate = null;
      return;
    }
    roomOpen = false;
    if (value === 'why' || value === 'bass' || value === 'treat') {
      tab = value === 'treat' ? 'tips' : 'why';
      step = 'results';
      return;
    }
    step = value;
    // A preview belongs to the result; leaving it ends the preview.
    if (value !== 'results') candidate = null;
  },
  get tab() {
    return tab;
  },
  set tab(value: ResultTab) {
    tab = value;
  },
  get roomOpen() {
    return roomOpen;
  },
  /** Opens or closes the "Your room" sheet (closing returns to the result). */
  set roomOpen(value: boolean) {
    roomOpen = value;
    if (!value) roomTarget = null;
    else candidate = null;
  },
  /** Opens the sheet at one group ("ready" is the treatment box). */
  openRoom(target: string | null = null) {
    roomOpen = true;
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
  get panelHidden() {
    return panelHidden;
  },
  set panelHidden(value: boolean) {
    panelHidden = value;
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
