import { SPEAKER_TYPES } from '../../engine/presets/speakerTypes';
import { DEFAULTS } from '../../engine/presets/defaults';
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

/**
 * The generic type the speaker still matches: by size and drivers, and by the port when that is
 * what tells two types apart. Changing only the port keeps the type (survey, docs/ROADMAP_V5.md).
 */
export function speakerTypeOf(speaker: SpeakerProfile) {
  const sameBox = SPEAKER_TYPES.filter(
    (t) =>
      Math.abs((speaker.dimensions.w.value ?? -1) - t.w) < 1e-6 &&
      Math.abs((speaker.dimensions.h.value ?? -1) - t.h) < 1e-6 &&
      Math.abs((speaker.dimensions.d.value ?? -1) - t.d) < 1e-6 &&
      speaker.driverLayout.value === t.driverLayout,
  );
  return (
    sameBox.find(
      (t) =>
        speaker.enclosure.value === t.enclosure && speaker.portLocation.value === t.portLocation,
    ) ??
    sameBox[0] ??
    null
  );
}

// ── Port and dispersion, the two quick speaker questions ──────────────────

export type PortChoice = 'sealed' | 'front' | 'rear';
export const PORT_CHOICES: readonly PortChoice[] = ['sealed', 'front', 'rear'];

export function portChoice(speaker: SpeakerProfile): PortChoice | null {
  if (speaker.enclosure.value === 'sealed') return 'sealed';
  const at = speaker.portLocation.value;
  return at === 'front' || at === 'rear' ? at : null;
}

export function setPort(project: Project, choice: PortChoice): void {
  const s = project.speaker;
  s.enclosure = { value: choice === 'sealed' ? 'sealed' : 'ported', certainty: 'estimated' };
  s.portLocation = { value: choice === 'sealed' ? 'none' : choice, certainty: 'estimated' };
}

/**
 * How widely the speaker spreads sound, as a factor on the type's estimated directivity factor Q
 * (🟡): narrow doubles it (+3 dB directivity index), wide halves it (−3 dB). Q only enters the
 * critical-distance advice (P10), never the map or the score.
 */
export type Dispersion = 'narrow' | 'typical' | 'wide';
export const DISPERSIONS: readonly Dispersion[] = ['narrow', 'typical', 'wide'];
const DISPERSION_FACTOR: Record<Dispersion, number> = { narrow: 2, typical: 1, wide: 0.5 };

function typicalQ(speaker: SpeakerProfile): number {
  return speakerTypeOf(speaker)?.qMid ?? DEFAULTS.qMid;
}

export function dispersionOf(speaker: SpeakerProfile): Dispersion {
  const ratio = (speaker.directivity.qMid.value ?? typicalQ(speaker)) / typicalQ(speaker);
  return ratio > 1.4 ? 'narrow' : ratio < 0.7 ? 'wide' : 'typical';
}

export function setDispersion(project: Project, value: Dispersion): void {
  const q = typicalQ(project.speaker) * DISPERSION_FACTOR[value];
  project.speaker.directivity.qMid = { value: Math.max(1, q), certainty: 'estimated' };
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
