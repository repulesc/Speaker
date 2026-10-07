import {
  KIND_PRESETS,
  driverHeights,
  type DriverChoice,
  type SpeakerChoices,
} from '../../engine/presets/speakerKinds';
import { f6From } from '../../engine/speakers/bass';
import { factsOf, type SpeakerEntry } from '../../engine/speakers/entry';
import type { Known, PortLocation, Project, SpeakerProfile } from '../../engine/types';
import { newId } from './ids';
import { setBaseHeight } from './speaker';
import { speakerFromChoices } from './defaults';

const measured = <T>(value: T): Known<T> => ({ value, certainty: 'measured' });
const estimated = <T>(value: T): Known<T> => ({ value, certainty: 'estimated' });
const mm = (v: number) => Math.round(v) / 1000;

/** The kind presets' tone-control ranges, as the "It has" checkboxes set them. */
const TREBLE = { minDb: -3, maxDb: 3, stepDb: 0.5 };
const BASS = { minDb: -6, maxDb: 6, stepDb: 0.5 };

/**
 * A speaker from the list (docs/SPEAKER_DATA.md) as the project keeps it: a copy of the values,
 * not a live link. What the maker states is 'measured'; a port seen only on the maker's photos is
 * 'estimated' (a person confirmed it, no text says it); what the list does not hold is estimated
 * the way the speaker questions do (🟡): the tweeter and woofer heights from the cabinet height
 * and layout, the bass limit from the kind and the midrange directivity from the kind. A bass
 * figure is moved to −6 dB along P09's own roll-off (bass.ts); one with no stated level is
 * 'estimated'.
 */
export function speakerFromEntry(e: SpeakerEntry, placedOn?: SpeakerChoices['placedOn']) {
  const { w, h, d } = e.sizeMm.value;
  const preset = KIND_PRESETS[e.kind];
  const layout = e.drivers.value;
  const drivers: DriverChoice = layout === 'coaxial' || layout === 'three-way' ? layout : 'two-way';
  const heights = driverHeights(e.kind, drivers, mm(h));
  const sealed = e.enclosure.value === 'sealed';
  const bass = e.bass && f6From(e.bass.value, sealed);
  const port: Known<PortLocation> = e.port
    ? e.port.via === 'photo-confirmed'
      ? estimated(e.port.value)
      : measured(e.port.value)
    : sealed
      ? measured('none')
      : { value: null, certainty: 'unknown' };
  const newest = factsOf(e)
    .map((f) => f.retrieved)
    .sort()
    .at(-1)!;
  const choices: SpeakerChoices = { kind: e.kind, ...(placedOn ? { placedOn } : {}) };
  const speaker: SpeakerProfile = {
    id: newId(),
    brand: e.brand,
    model: e.model,
    dimensions: { w: measured(mm(w)), h: measured(mm(h)), d: measured(mm(d)) },
    enclosure: measured(e.enclosure.value),
    portLocation: port,
    driverLayout: measured(layout),
    acousticAxisHeight: e.tweeterMm
      ? measured(mm(e.tweeterMm.value))
      : estimated(Math.round(heights.axis * 1000) / 1000),
    wooferCentreHeight: estimated(Math.round(heights.woofer * 1000) / 1000),
    lowFrequencyMinus6dB: bass
      ? { value: Math.round(bass.f6), certainty: bass.assumed ? 'estimated' : 'measured' }
      : estimated(preset.sizes.medium.f6),
    directivity: { omniBelowHz: estimated(preset.omniBelowHz), qMid: estimated(preset.qMid) },
    dsp: {
      ...(e.controls?.value.treble ? { treble: { ...TREBLE } } : {}),
      ...(e.controls?.value.bass ? { bass: { ...BASS } } : {}),
      ...(e.positionSetting?.value ? { wallDistanceSetting: true } : {}),
    },
    ...(e.minWallMm ? { minWallDistance: measured(mm(e.minWallMm.value)) } : {}),
    ...(e.designedForCorner?.value ? { designedForCorner: true } : {}),
    choices,
    listed: {
      id: e.id,
      url: e.sizeMm.url,
      retrieved: newest,
      ...(e.port?.via === 'photo-confirmed' ? { photoPort: true } : {}),
      ...(bass ? {} : { bassFromKind: true }),
      ...(e.special ? { special: e.special } : {}),
    },
    manufacturerNotes: [],
    provenance: {
      sources: [...new Set(factsOf(e).map((f) => f.url))].map((url) => ({
        kind: 'manufacturer' as const,
        title: `${e.brand} ${e.model}`,
        url,
        retrieved: newest,
      })),
      verified: false,
    },
  };
  return speaker;
}

/** Picks a speaker from the list; where they stand is kept, and the base height follows. */
export function pickSpeaker(project: Project, entry: SpeakerEntry): void {
  project.speaker = speakerFromEntry(entry, project.speaker.choices?.placedOn);
  setBaseHeight(project);
}

/**
 * "Not listed? Describe it instead": back to the questions, from the kind of the speaker that was
 * picked (if any) and where it stands. The typed details go with the listed speaker.
 */
export function describeSpeaker(project: Project): void {
  if (!project.speaker.listed) return;
  const { kind, placedOn } = project.speaker.choices ?? {};
  project.speaker = speakerFromChoices({
    ...(kind ? { kind } : {}),
    ...(placedOn ? { placedOn } : {}),
  });
  setBaseHeight(project);
}

/** A value of a listed speaker was changed by hand: the card says so. */
export function markEdited(speaker: SpeakerProfile): void {
  if (speaker.listed) speaker.listed.edited = true;
}
