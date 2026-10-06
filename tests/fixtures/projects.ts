import type {
  BoundaryId,
  Known,
  Project,
  SpeakerProfile,
  SurfacePresetId,
} from '../../src/engine/types';

export const measured = <T>(value: T): Known<T> => ({ value, certainty: 'measured' });
export const estimated = <T>(value: T): Known<T> => ({ value, certainty: 'estimated' });
export const unknown = <T>(): Known<T> => ({ value: null, certainty: 'unknown' });

const BOUNDARIES: BoundaryId[] = ['front', 'back', 'left', 'right', 'floor', 'ceiling'];

export function genericSpeaker(overrides: Partial<SpeakerProfile> = {}): SpeakerProfile {
  return {
    id: 'generic',
    brand: '',
    model: '',
    dimensions: { w: estimated(0.2), h: estimated(0.3), d: estimated(0.25) },
    enclosure: estimated('ported'),
    portLocation: estimated('rear'),
    driverLayout: estimated('two-way'),
    acousticAxisHeight: estimated(0.2),
    wooferCentreHeight: estimated(0.1),
    lowFrequencyMinus6dB: estimated(50),
    directivity: { omniBelowHz: estimated(300), qMid: estimated(2) },
    dsp: {},
    manufacturerNotes: [],
    provenance: { sources: [], verified: false },
    ...overrides,
  };
}

interface ProjectOptions {
  W?: number;
  L?: number;
  H?: number;
  /** Rear-panel clearance of the speakers. */
  clearance?: number;
  halfSpacing?: number;
  listenerY?: number;
  earZ?: number;
  standZ?: number;
  surfaces?: Partial<Record<BoundaryId, SurfacePresetId>>;
  speaker?: SpeakerProfile;
}

/** A complete, valid project. Defaults: Room R (W 4.0, L 5.0, H 2.5), symmetric 60° setup. */
export function makeProject(o: ProjectOptions = {}): Project {
  const W = o.W ?? 4.0;
  const L = o.L ?? 5.0;
  const H = o.H ?? 2.5;
  const speaker = o.speaker ?? genericSpeaker();
  const depth = speaker.dimensions.d.value ?? 0.25;
  const clearance = o.clearance ?? 0.5;
  const half = o.halfSpacing ?? 1.0;
  const standZ = o.standZ ?? 0.7;
  const y = clearance + depth / 2;
  const base: Record<BoundaryId, SurfacePresetId> = {
    front: 'plaster-brick',
    back: 'plaster-brick',
    left: 'plaster-brick',
    right: 'plaster-brick',
    floor: 'wood-floor',
    ceiling: 'plaster-brick',
    ...o.surfaces,
  };
  return {
    schemaVersion: 1,
    id: 'test',
    name: 'Test',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    units: 'metric',
    room: {
      width: measured(W),
      length: measured(L),
      height: measured(H),
      temperatureC: unknown(),
      outOfModel: [],
    },
    surfaces: {
      base,
      baseCertainty: Object.fromEntries(BOUNDARIES.map((b) => [b, 'estimated'])) as Record<
        BoundaryId,
        'estimated'
      >,
    },
    speaker,
    constraints: {
      speakerWall: 'front',
      maxSpeakerDistanceFromWall: estimated(1.5),
      listenerFixed: false,
      speakersFixed: false,
      keepSymmetric: true,
    },
    goals: { weights: {} },
    variants: [
      {
        id: 'v1',
        name: 'Current',
        speakers: {
          left: { base: { x: W / 2 - half, y, z: standZ }, toeInDeg: 0 },
          right: { base: { x: W / 2 + half, y, z: standZ }, toeInDeg: 0 },
        },
        listener: {
          ears: { x: W / 2, y: o.listenerY ?? 3.2, z: o.earZ ?? 1.1 },
          certainty: 'estimated',
        },
        busyness: estimated('some'),
      },
    ],
    activeVariantId: 'v1',
  };
}
