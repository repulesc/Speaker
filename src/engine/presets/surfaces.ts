import type {
  BandValues,
  ConstructionType,
  SurfaceClass,
  SurfacePresetId,
  Surfaces,
} from '../types';

export interface SurfacePreset {
  absorption: BandValues;
  class: SurfaceClass;
  dataConfidence: 'medium' | 'low';
  source: string;
}

/**
 * Absorption coefficients per octave band (125 Hz – 4 kHz).
 * Source: RULE_CATALOGUE Appendix A — typical published values ([EVP]),
 * still to be checked row by row against the cited table (OPEN_QUESTIONS C).
 */
export const SURFACE_PRESETS: Record<Exclude<SurfacePresetId, 'custom'>, SurfacePreset> = {
  'plaster-concrete': {
    absorption: [0.01, 0.01, 0.02, 0.02, 0.02, 0.03],
    class: 'reflective',
    dataConfidence: 'medium',
    source: 'EVP',
  },
  // R5 (REVIEW_FINDINGS M3): this row used to carry plaster-on-lath values (0.14 at 125 Hz).
  // Plaster smooth on brick or tile, as tabulated; matches "rendered brickwork" (0.01, 0.02, 0.02,
  // 0.03, 0.03, 0.04) in the pyroomacoustics materials database.
  'plaster-brick': {
    absorption: [0.013, 0.015, 0.02, 0.03, 0.04, 0.05],
    class: 'reflective',
    dataConfidence: 'medium',
    source: 'EVP',
  },
  // Rough plaster on wooden (or reed) lath, as in older houses: the thin layer flexes and takes
  // up some bass (panel absorption).
  'plaster-lath': {
    absorption: [0.14, 0.1, 0.06, 0.05, 0.04, 0.03],
    class: 'reflective',
    dataConfidence: 'medium',
    source: 'EVP',
  },
  'gypsum-stud': {
    absorption: [0.29, 0.1, 0.05, 0.04, 0.07, 0.09],
    class: 'reflective',
    dataConfidence: 'medium',
    source: 'EVP',
  },
  glass: {
    absorption: [0.35, 0.25, 0.18, 0.12, 0.07, 0.04],
    class: 'reflective',
    dataConfidence: 'medium',
    source: 'EVP',
  },
  'wood-floor': {
    absorption: [0.15, 0.11, 0.1, 0.07, 0.06, 0.07],
    class: 'reflective',
    dataConfidence: 'medium',
    source: 'EVP',
  },
  'carpet-heavy': {
    absorption: [0.02, 0.06, 0.14, 0.37, 0.6, 0.65],
    class: 'absorptive',
    dataConfidence: 'medium',
    source: 'EVP',
  },
  'carpet-underlay': {
    absorption: [0.08, 0.24, 0.57, 0.69, 0.71, 0.73],
    class: 'absorptive',
    dataConfidence: 'medium',
    source: 'EVP',
  },
  'curtain-heavy': {
    absorption: [0.14, 0.35, 0.55, 0.72, 0.7, 0.65],
    class: 'absorptive',
    dataConfidence: 'medium',
    source: 'EVP',
  },
  'shelf-diffusive': {
    absorption: [0.15, 0.2, 0.25, 0.3, 0.35, 0.35],
    class: 'diffusive',
    dataConfidence: 'low',
    source: 'estimate',
  },
  // Canvas on a wall: plaster value plus a small high-frequency increase (low confidence).
  'canvas-art': {
    absorption: [0.013, 0.015, 0.07, 0.08, 0.09, 0.1],
    class: 'reflective',
    dataConfidence: 'low',
    source: 'estimate',
  },
};

export function surfaceAbsorption(preset: SurfacePresetId, custom?: BandValues): BandValues {
  if (preset === 'custom') return custom ?? SURFACE_PRESETS['plaster-brick'].absorption;
  return SURFACE_PRESETS[preset].absorption;
}

export function surfaceClass(preset: SurfacePresetId, custom?: BandValues): SurfaceClass {
  if (preset !== 'custom') return SURFACE_PRESETS[preset].class;
  const mid = custom ? (custom[2] + custom[3]) / 2 : 0;
  return mid >= 0.3 ? 'absorptive' : 'reflective';
}

export function surfaceDataConfidence(preset: SurfacePresetId): 'medium' | 'low' {
  return preset === 'custom' ? 'medium' : SURFACE_PRESETS[preset].dataConfidence;
}

const WALLS = ['front', 'back', 'left', 'right'] as const;
const LIGHTWEIGHT: readonly SurfacePresetId[] = ['gypsum-stud', 'plaster-lath'];
const SOLID: readonly SurfacePresetId[] = ['plaster-concrete', 'plaster-brick'];

/**
 * Solid or lightweight walls, read from the wall material the user chose (V9: no longer asked as a
 * separate question). Lightweight walls let bass through, so the bass predictions are less sure.
 * Unknown until the walls are described; otherwise what most of them are.
 */
export function constructionOf(surfaces: Surfaces): ConstructionType {
  const walls = WALLS.filter((w) => surfaces.baseCertainty[w] !== 'unknown');
  if (walls.length === 0) return 'unknown';
  const count = (kinds: readonly SurfacePresetId[]) =>
    walls.filter((w) => kinds.includes(surfaces.base[w])).length;
  if (count(LIGHTWEIGHT) > walls.length / 2) return 'lightweight';
  if (count(SOLID) > walls.length / 2) return 'solid';
  return 'unknown';
}
