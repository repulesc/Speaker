import type { RoomGeometry } from '../context';
import { DEFAULTS } from '../presets/defaults';
import { surfaceAbsorption } from '../presets/surfaces';
import type { BandValues, BoundaryId, Surfaces } from '../types';
import { ASSUMPTION, makeFinding, type RuleDef } from './rule';

/**
 * P08 · Reverberation time estimate (🔴 physics model, rough). Sources: [SAB], [EYR30], [KUT], [EVP].
 * Sabine: T60 = 0.161·V/A. Eyring: T60 = 0.161·V / (−S·ln(1 − ᾱ)). Eyring is used when ᾱ > 0.2.
 */

export interface ReverbResult {
  bands: BandValues;
  /** Average of the 500 Hz and 1 kHz bands. */
  mid: number;
  /** Range of the mid value from input uncertainty. */
  low: number;
  high: number;
  method: 'sabine' | 'eyring';
  /** 125 Hz band: drives modal damping in P09. */
  bass: number;
  /** Average of the 2 kHz and 4 kHz bands: drives H06. */
  treble: number;
}

export function sabine(volume: number, absorptionArea: number): number {
  return (0.161 * volume) / absorptionArea;
}

export function eyring(volume: number, surface: number, meanAlpha: number): number {
  return (0.161 * volume) / (-surface * Math.log(1 - meanAlpha));
}

/**
 * Furniture absorbs less at low frequencies than its mid-band value. Assumed factors per band
 * (calibration choice, 🟡): ×0.5 at 125 Hz, ×0.8 at 250 Hz, ×1 above.
 */
const OBJECT_BAND_FACTOR: BandValues = [0.5, 0.8, 1, 1, 1, 1];

function boundaryArea(b: BoundaryId, room: RoomGeometry): number {
  if (b === 'front' || b === 'back') return room.W * room.H;
  if (b === 'left' || b === 'right') return room.L * room.H;
  return room.W * room.L;
}

/** Total surface absorption area per band (m² sabins), patches replacing the base material. */
export function surfaceAbsorptionArea(room: RoomGeometry, surfaces: Surfaces): BandValues {
  const area = [0, 0, 0, 0, 0, 0];
  const add = (alphas: BandValues, m2: number) => alphas.forEach((a, i) => (area[i]! += a * m2));
  for (const b of Object.keys(surfaces.base) as BoundaryId[]) {
    const patches = surfaces.patches.filter((p) => p.boundary === b);
    const patchArea = patches.reduce((sum, p) => sum + p.width * p.height, 0);
    add(surfaceAbsorption(surfaces.base[b]), Math.max(0, boundaryArea(b, room) - patchArea));
    for (const p of patches)
      add(surfaceAbsorption(p.preset, p.customAbsorption), p.width * p.height);
  }
  return area as BandValues;
}

/** No real room absorbs less than this on average (bare concrete ≈ 0.01–0.02); keeps T60 finite. */
const MIN_MEAN_ALPHA = 0.01;

function t60Bands(room: RoomGeometry, surfaceArea: BandValues, furnishing: number) {
  const totals = surfaceArea.map((a, i) =>
    Math.max(a + furnishing * OBJECT_BAND_FACTOR[i]!, MIN_MEAN_ALPHA * room.S),
  );
  const midAlpha = (totals[2]! + totals[3]!) / 2 / room.S;
  const method: ReverbResult['method'] = midAlpha > 0.2 ? 'eyring' : 'sabine';
  const bands = totals.map((a) =>
    method === 'eyring' ? eyring(room.V, room.S, Math.min(a / room.S, 0.99)) : sabine(room.V, a),
  ) as BandValues;
  return { bands, method };
}

export function reverberation(
  room: RoomGeometry,
  surfaces: Surfaces,
  furnishing: [number, number],
  scale = 1,
): ReverbResult {
  const area = surfaceAbsorptionArea(room, surfaces);
  const nominal = t60Bands(room, area, (furnishing[0] + furnishing[1]) / 2);
  const live = t60Bands(room, area, furnishing[0]);
  const dead = t60Bands(room, area, furnishing[1]);
  const midOf = (b: BandValues) => ((b[2] + b[3]) / 2) * scale;

  let low = midOf(dead.bands);
  let high = midOf(live.bands);
  // Every surface left at its default: widen to the typical domestic range.
  if (Object.values(surfaces.baseCertainty).every((c) => c === 'unknown')) {
    low = Math.min(low, DEFAULTS.t60Range[0]);
    high = Math.max(high, DEFAULTS.t60Range[1]);
  }
  const bands = nominal.bands.map((t) => t * scale) as BandValues;
  return {
    bands,
    mid: midOf(nominal.bands),
    low,
    high,
    method: nominal.method,
    bass: bands[0],
    treble: (bands[4] + bands[5]) / 2,
  };
}

export type RoomCharacter = 'dead' | 'balanced' | 'live';

/** Character bands (🟡 calibration): dead below 0.3 s, live above 0.6 s (mid T60). */
export function roomCharacter(t60Mid: number): RoomCharacter {
  if (t60Mid < 0.3) return 'dead';
  if (t60Mid > 0.6) return 'live';
  return 'balanced';
}

export const P08: RuleDef = {
  id: 'P08',
  level: 'physics',
  sources: ['SAB', 'EYR30', 'KUT', 'EVP'],
  variants: ['dead', 'balanced', 'live'],
  evaluate(ctx) {
    const { t60 } = ctx;
    return [
      makeFinding(
        P08,
        roomCharacter(t60.mid),
        'info',
        { t60: t60.mid, low: t60.low, high: t60.high, method: t60.method },
        { assumptions: [ASSUMPTION.diffuseField] },
      ),
    ];
  },
};
