import {
  baseHeight,
  placedOnOf,
  typicalQ,
  type SpeakerChoices,
  type Spread,
} from '../../engine/presets/speakerKinds';
import type { Project, SpeakerProfile } from '../../engine/types';
import { activeVariant, roomSize } from '../plan/placement';
import { speakerFromChoices } from './defaults';
import { newId } from './ids';
import { SIZE_LIMITS } from './limits';
import { speakerSchema } from './schema';
import { isRecord } from './validate';

/**
 * Answers one speaker question (undefined = "Not sure") and fills the speaker with the typical
 * values for all answers so far (docs/ROADMAP_V7.md, Phase 2). Brand, model, identity, controls
 * and the maker's wall distance stay; every filled value is an estimate. Where the speakers stand
 * (floor, stand, desk) sets the base height of both speakers in every setup; their position on the
 * floor is not touched.
 */
export function setSpeakerChoice<K extends keyof SpeakerChoices>(
  project: Project,
  key: K,
  value: SpeakerChoices[K] | undefined,
): void {
  const old = project.speaker;
  const choices: SpeakerChoices = { ...old.choices };
  if (value === undefined) delete choices[key];
  else choices[key] = value;
  const { id, brand, model, dsp, minWallDistance, designedForCorner, manufacturerNotes } = old;
  project.speaker = {
    ...speakerFromChoices(choices),
    id,
    brand,
    model,
    dsp,
    ...(minWallDistance ? { minWallDistance } : {}),
    ...(designedForCorner ? { designedForCorner } : {}),
    manufacturerNotes,
  };
  if (Object.keys(choices).length === 0) delete project.speaker.choices;
  // The base height follows the place (and the tweeter height) once the kind or place is known.
  if (choices.kind || choices.placedOn) {
    const z = baseHeight(placedOnOf(choices), project.speaker.acousticAxisHeight.value!);
    for (const v of project.variants) {
      v.speakers.left.base.z = z;
      v.speakers.right.base.z = z;
    }
  }
}

/** How widely the speaker spreads sound: the answer, else read from the directivity factor. */
export function dispersionOf(speaker: SpeakerProfile): Spread {
  if (speaker.choices?.spread) return speaker.choices.spread;
  const typical = typicalQ(speaker.choices ?? {});
  const ratio = (speaker.directivity.qMid.value ?? typical) / typical;
  return ratio > 1.4 ? 'narrow' : ratio < 0.7 ? 'wide' : 'typical';
}

// ── Can the seat move? ────────────────────────────────────────────────────

export type SeatMode = 'fixed' | 'range' | 'free';

export function seatMode(project: Project): SeatMode {
  const { listenerFixed, listenerYRange } = project.constraints;
  return listenerFixed ? 'fixed' : listenerYRange ? 'range' : 'free';
}

/** "Forward and back within…" starts as ±0.5 m around the current seat, kept inside the room. */
export function setSeatMode(project: Project, mode: SeatMode): void {
  const c = project.constraints;
  c.listenerFixed = mode === 'fixed';
  if (mode !== 'range') {
    delete c.listenerYRange;
    return;
  }
  if (c.listenerYRange) return;
  const L = roomSize(project)?.L ?? 5;
  const y = activeVariant(project).listener.ears.y;
  c.listenerYRange = [Math.max(0.5, y - 0.5), Math.min(L - 0.3, y + 0.5)];
}

export function setSeatRange(project: Project, from: number, to: number): void {
  const L = roomSize(project)?.L ?? 5;
  const lo = Math.max(0.5, Math.min(from, to));
  const hi = Math.min(L - 0.3, Math.max(from, to));
  project.constraints.listenerYRange = [lo, Math.max(lo, hi)];
}

// ── Speaker profile files ─────────────────────────────────────────────────

const PROFILE_KIND = 'speaker-profile';

export function serializeSpeaker(speaker: SpeakerProfile): string {
  return JSON.stringify({ kind: PROFILE_KIND, schemaVersion: 1, speaker }, null, 2);
}

export function speakerFileName(speaker: SpeakerProfile): string {
  const name = `${speaker.brand} ${speaker.model}`.trim() || 'speaker';
  // eslint-disable-next-line no-control-regex -- control characters are stripped on purpose
  return `${name.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-')}.speaker-profile.json`;
}

export type SpeakerReadResult =
  | { ok: true; speaker: SpeakerProfile }
  | {
      ok: false;
      reason: 'notJson' | 'tooBig' | 'notAProfile' | 'newerVersion' | 'invalid';
      detail?: string;
    };

export function parseSpeakerJson(text: string): SpeakerReadResult {
  if (text.length > SIZE_LIMITS.fileBytes) return { ok: false, reason: 'tooBig' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'notJson' };
  }
  if (!isRecord(raw) || raw.kind !== PROFILE_KIND || typeof raw.schemaVersion !== 'number') {
    return { ok: false, reason: 'notAProfile' };
  }
  if (raw.schemaVersion > 1) return { ok: false, reason: 'newerVersion' };
  const error = speakerSchema(raw.speaker, 'speaker');
  if (error) return { ok: false, reason: 'invalid', detail: error };
  // A loaded profile is a new profile: it never shares an identity with the file's author.
  return { ok: true, speaker: { ...(raw.speaker as SpeakerProfile), id: newId() } };
}
