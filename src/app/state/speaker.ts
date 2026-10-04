import { SPEAKER_TYPES } from '../../engine/presets/speakerTypes';
import type { Project, SpeakerProfile } from '../../engine/types';
import { activeVariant, roomSize } from '../plan/placement';
import { speakerFromType } from './defaults';
import { newId } from './ids';
import { SIZE_LIMITS } from './limits';
import { speakerSchema } from './schema';
import { isRecord } from './validate';

/** Fills the speaker from a generic type. Brand, model and identity stay; every value becomes an estimate. */
export function applySpeakerType(project: Project, typeId: string): void {
  const type = SPEAKER_TYPES.find((t) => t.id === typeId);
  if (!type) return;
  const { id, brand, model } = project.speaker;
  project.speaker = { ...speakerFromType(type), id, brand, model };
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
