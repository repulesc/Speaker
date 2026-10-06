import { acousticCentre, type AnalysisContext } from '../context';
import { isValidPlacement } from '../scoring/search';
import type { EvidenceLevel, Finding, Placement } from '../types';

/**
 * The listening check (docs/ROADMAP_V8.md §4): what the listener hears, on two-sided scales, turned
 * into one change at a time to try. The ears are the judge; the rules only say what usually moves
 * the sound in the direction asked for, with how sure that is and where it comes from.
 */
export type Aspect = 'bass' | 'evenness' | 'centre' | 'width' | 'treble' | 'clarity';

/** The answers, aspect by aspect. "right" (just right) and missing answers ask for nothing. */
export interface ListeningAnswers {
  bass?: 'thin' | 'right' | 'boomy';
  evenness?: 'even' | 'uneven';
  centre?: 'vague' | 'focused' | 'left' | 'right';
  width?: 'narrow' | 'right' | 'wide';
  treble?: 'dull' | 'right' | 'bright';
  clarity?: 'clear' | 'some' | 'echoey';
}

export const ASPECT_ANSWERS: { [A in Aspect]: readonly NonNullable<ListeningAnswers[A]>[] } = {
  bass: ['thin', 'right', 'boomy'],
  evenness: ['even', 'uneven'],
  centre: ['vague', 'focused', 'left', 'right'],
  width: ['narrow', 'right', 'wide'],
  treble: ['dull', 'right', 'bright'],
  clarity: ['clear', 'some', 'echoey'],
};
export const ASPECTS = Object.keys(ASPECT_ANSWERS) as Aspect[];

/**
 * A change the app can make for you (and undo). Distances in metres: speakers further from the
 * front wall (+) or closer (−); the pair wider (+) or narrower (−); the seat further back (+) or
 * forward (−); the seat sideways to x; toe-in in degrees, more (+) or less (−).
 */
export type Change =
  | { kind: 'speakersOut'; by: number }
  | { kind: 'spacing'; by: number }
  | { kind: 'seat'; by: number }
  | { kind: 'seatCentre'; x: number }
  | { kind: 'toeIn'; by: number };

export interface Experiment {
  /** `L01.out`: i18n `listen.exp.L01.out` (and `.plain`). */
  id: string;
  ruleId: string;
  aspect: Aspect;
  level: EvidenceLevel;
  sources: readonly string[];
  /** Most likely to help first (🟡 ordering only). */
  priority: number;
  change?: Change;
  /** What the room model makes of the change, for moves only: the map's honest second opinion. */
  model?: 'better' | 'same' | 'worse';
  params: Record<string, number | string>;
}

/** What a rule needs to know about the setup, measured once. */
export interface Measures {
  /** Rear panel to the front wall (m), the nearer speaker. */
  clearance: number;
  /** The nearer speaker's cabinet to its side wall (m). */
  side: number;
  spacing: number;
  /** Seat to the back wall (m). */
  back: number;
  /** Seat to the left and right speaker (m). */
  dLeft: number;
  dRight: number;
  /** Angle between the two speakers seen from the seat (degrees). */
  angle: number;
  toeIn: number;
}

export function measure(ctx: AnalysisContext, p: Placement): Measures {
  const { left, right } = p.speakers;
  const s = ctx.speaker;
  const clearance = Math.min(left.base.y, right.base.y) - s.depth / 2;
  const side = Math.min(left.base.x - s.width / 2, ctx.room.W - right.base.x - s.width / 2);
  const a = acousticCentre(left, s);
  const b = acousticCentre(right, s);
  const l = p.listener;
  const dLeft = Math.hypot(a.x - l.x, a.y - l.y);
  const dRight = Math.hypot(b.x - l.x, b.y - l.y);
  const ua = { x: a.x - l.x, y: a.y - l.y };
  const ub = { x: b.x - l.x, y: b.y - l.y };
  const cos = (ua.x * ub.x + ua.y * ub.y) / (dLeft * dRight);
  return {
    clearance,
    side,
    spacing: right.base.x - left.base.x,
    back: ctx.room.L - l.y,
    dLeft,
    dRight,
    angle: (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI,
    toeIn: (left.toeInDeg + right.toeInDeg) / 2,
  };
}

/** The placement after a change (pure), or null when it would leave the room or break a limit. */
export function applyChange(ctx: AnalysisContext, p: Placement, change: Change): Placement | null {
  const c = ctx.project.constraints;
  const moved = structuredClone(p);
  const { left, right } = moved.speakers;
  switch (change.kind) {
    case 'speakersOut': {
      if (c.speakersFixed) return null;
      left.base.y += change.by;
      right.base.y += change.by;
      const clearance = Math.min(left.base.y, right.base.y) - ctx.speaker.depth / 2;
      const reach = c.maxSpeakerDistanceFromWall.value;
      if (clearance < 0.02 || (reach !== null && change.by > 0 && clearance > reach + 1e-9)) {
        return null;
      }
      break;
    }
    case 'spacing': {
      if (c.speakersFixed) return null;
      left.base.x -= change.by / 2;
      right.base.x += change.by / 2;
      if (right.base.x - left.base.x < ctx.speaker.width + 0.3) return null;
      break;
    }
    case 'seat': {
      if (c.listenerFixed) return null;
      moved.listener.y += change.by;
      const range = c.listenerYRange;
      if (range && (moved.listener.y < range[0] - 1e-9 || moved.listener.y > range[1] + 1e-9)) {
        return null;
      }
      break;
    }
    case 'seatCentre':
      if (c.listenerFixed) return null;
      moved.listener.x = change.x;
      break;
    case 'toeIn': {
      const next = left.toeInDeg + change.by;
      if (next < 0 || next > 35) return null;
      left.toeInDeg = next;
      right.toeInDeg = next;
      break;
    }
  }
  return isValidPlacement(ctx, moved) ? moved : null;
}

/** Whether the setup produced a caution or red flag from this rule. */
export const flagged = (findings: readonly Finding[], ruleId: string) =>
  findings.some(
    (f) => f.ruleId === ruleId && (f.severity === 'caution' || f.severity === 'red-flag'),
  );

/** What a rule proposes; the index adds which rule and aspect it came from. */
export type Suggestion = Omit<Experiment, 'ruleId' | 'aspect'>;

export interface ListeningRule {
  id: string;
  aspect: Aspect;
  /** Candidate experiments; the index drops the ones whose change does not fit the room. */
  suggest(
    ctx: AnalysisContext,
    p: Placement,
    m: Measures,
    answers: ListeningAnswers,
    findings: readonly Finding[],
  ): Suggestion[];
}
