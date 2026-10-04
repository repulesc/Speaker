import { wooferCentre, type AnalysisContext } from '../context';
import type { Placement, Vec3 } from '../types';
import { ASSUMPTION, makeFinding, type RuleDef } from './rule';

/**
 * P09 · Low-frequency response at the listening position (🔴 physics model). Sources: [KUT], [EVP].
 *
 * Modal sum (Green's function of a rigid rectangular room), for a source with constant volume
 * acceleration (i.e. a speaker that is flat in free field):
 *
 *   p(ω) ∝ Σ_n ψ_n(source) · ψ_n(listener) / ( K_n · (ω_n² − ω² + 2j·δ·ω_n) )
 *
 * K_n = V / (ε_x·ε_y·ε_z), ε = 1 for a zero index and 2 otherwise; δ = 6.91 / T60 (125 Hz band).
 * The 0 Hz term (n = 0,0,0) is included: it gives the pressure gain below the first mode.
 * Both speakers are summed coherently. Only the shape matters; absolute level is meaningless.
 */

export interface BassModel {
  freqs: Float64Array;
  /** Mode indices, including the 0 Hz term first. */
  modes: [number, number, number][];
  /** The same indices, flat [nx, ny, nz, nx, …], for the hot loops. */
  modeIndex: Int32Array;
  /** Precomputed 1 / (K_n · D_n(ω)), flat [mode · freqs.length + freq]: real and imaginary parts. */
  re: Float64Array;
  im: Float64Array;
  /** Speaker high-pass magnitude (linear) per frequency. */
  speakerGain: Float64Array;
  /** Largest index per axis, for the cosine tables. */
  maxIndex: [number, number, number];
}

/** Log-spaced frequencies, `perOctave` points per octave, both ends included. */
export const PER_OCTAVE = 24;

export function logFrequencies(fMin: number, fMax: number, perOctave = PER_OCTAVE): Float64Array {
  const count = Math.floor(Math.log2(fMax / fMin) * perOctave) + 1;
  return Float64Array.from({ length: count }, (_, i) => fMin * 2 ** (i / perOctave));
}

/**
 * Speaker low-frequency roll-off as a Butterworth high-pass with exactly −6 dB at f6:
 * 2nd order for sealed boxes, 4th order otherwise (ported / passive radiator / unknown).
 */
export function speakerHighPass(f: number, f6: number, sealed: boolean): number {
  const order = sealed ? 2 : 4;
  // |H|² = x^(2n) / (1 + x^(2n)); solve |H| = 0.5 at f6 → x^(2n) = 1/3.
  const fc = f6 / (1 / 3) ** (1 / (2 * order));
  const x2n = (f / fc) ** (2 * order);
  return Math.sqrt(x2n / (1 + x2n));
}

/**
 * The modal sum converges slowly (conditionally) for point sources: in Phase 1 tests, raising the
 * truncation from 1.5× to 4× the top frequency moved raw curves by up to ≈ 1.5 dB, without settling
 * monotonically. Smoothing and the robustness runs absorb most of this; it is a documented model
 * limit (docs/OPEN_QUESTIONS.md, D).
 */
export const MODE_TRUNCATION_FACTOR = 1.5;

export function buildBassModel(
  ctx: AnalysisContext,
  fMin = 20,
  fMax = ctx.bassMaxHz,
  truncation = MODE_TRUNCATION_FACTOR,
): BassModel {
  const freqs = logFrequencies(fMin, fMax);
  const { room, c } = ctx;
  const delta = 6.91 / ctx.t60.bass;
  const modeLimit = truncation * fMax;
  const modes: [number, number, number][] = [
    [0, 0, 0],
    ...ctx.modes.filter((m) => m.f <= modeLimit).map((m) => m.n),
  ];
  const F = freqs.length;
  const re = new Float64Array(modes.length * F);
  const im = new Float64Array(modes.length * F);
  modes.forEach((n, m) => {
    const eps = n.reduce((product, i) => product * (i === 0 ? 1 : 2), 1);
    const K = room.V / eps;
    const omegaN =
      Math.PI * c * Math.sqrt((n[0] / room.W) ** 2 + (n[1] / room.L) ** 2 + (n[2] / room.H) ** 2);
    for (let k = 0; k < F; k++) {
      const omega = 2 * Math.PI * freqs[k]!;
      const dRe = omegaN * omegaN - omega * omega;
      const dIm = 2 * delta * omegaN;
      const mag2 = dRe * dRe + dIm * dIm;
      // 1 / (K·(dRe + j·dIm)) = (dRe − j·dIm) / (K·|D|²)
      re[m * F + k] = dRe / (K * mag2);
      im[m * F + k] = -dIm / (K * mag2);
    }
  });
  const sealed = ctx.speaker.enclosure === 'sealed';
  const speakerGain = Float64Array.from(freqs, (f) => speakerHighPass(f, ctx.speaker.f6, sealed));
  const maxIndex = [0, 1, 2].map((a) => Math.max(...modes.map((n) => n[a]!))) as [
    number,
    number,
    number,
  ];
  return { freqs, modes, modeIndex: Int32Array.from(modes.flat()), re, im, speakerGain, maxIndex };
}

/**
 * Mode shapes (P03) of every model mode at one point, via per-axis cosine tables:
 * ψ_n = cx[nx]·cy[ny]·cz[nz]. Same values as modeShape(), far fewer cosines.
 */
export function modeShapes(model: BassModel, p: Vec3, ctx: AnalysisContext): Float64Array {
  const { W, L, H } = ctx.room;
  const cx = cosineTable(model.maxIndex[0], p.x, W);
  const cy = cosineTable(model.maxIndex[1], p.y, L);
  const cz = cosineTable(model.maxIndex[2], p.z, H);
  const idx = model.modeIndex;
  const shapes = new Float64Array(model.modes.length);
  for (let m = 0; m < shapes.length; m++) {
    shapes[m] = cx[idx[3 * m]!]! * cy[idx[3 * m + 1]!]! * cz[idx[3 * m + 2]!]!;
  }
  return shapes;
}

function cosineTable(maxIndex: number, coord: number, dim: number): Float64Array {
  const table = new Float64Array(maxIndex + 1);
  for (let n = 0; n <= maxIndex; n++) table[n] = Math.cos((n * Math.PI * coord) / dim);
  return table;
}

/** Per-mode coupling of a set of sources: Σ ψ_n(source). Reused across many listener positions. */
export function sourceCoupling(
  model: BassModel,
  sources: readonly Vec3[],
  ctx: AnalysisContext,
): Float64Array {
  const coupling = new Float64Array(model.modes.length);
  for (const s of sources) {
    const shapes = modeShapes(model, s, ctx);
    for (let m = 0; m < shapes.length; m++) coupling[m]! += shapes[m]!;
  }
  return coupling;
}

/** Relative SPL (dB, un-normalised) at the receiver for the given source coupling. */
export function responseDb(
  model: BassModel,
  coupling: Float64Array,
  receiver: Vec3,
  ctx: AnalysisContext,
): Float64Array {
  const F = model.freqs.length;
  const shapes = modeShapes(model, receiver, ctx);
  const re = new Float64Array(F);
  const im = new Float64Array(F);
  for (let m = 0; m < shapes.length; m++) {
    const w = coupling[m]! * shapes[m]!;
    // Symmetric setups cancel whole mode families exactly; cos(π/2) is ~1e-17 in floating point.
    if (Math.abs(w) < 1e-9) continue;
    const base = m * F;
    for (let k = 0; k < F; k++) {
      re[k]! += w * model.re[base + k]!;
      im[k]! += w * model.im[base + k]!;
    }
  }
  const out = new Float64Array(F);
  for (let k = 0; k < F; k++) {
    const magnitude = Math.hypot(re[k]!, im[k]!) * model.speakerGain[k]!;
    out[k] = 20 * Math.log10(Math.max(magnitude, 1e-30));
  }
  return out;
}

/**
 * Fractional-octave smoothing by power averaging over ±1/(2·fraction) octave. Assumes the
 * frequencies are log-spaced at `perOctave` points per octave (as from logFrequencies), so the
 * window is a fixed number of points; the window is truncated at the ends.
 */
export function smoothDb(db: Float64Array, fraction = 6, perOctave = PER_OCTAVE): Float64Array {
  const half = Math.round(perOctave / (2 * fraction));
  const n = db.length;
  const power = new Float64Array(n);
  for (let k = 0; k < n; k++) power[k] = 10 ** (db[k]! / 10);
  const out = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    const lo = Math.max(0, k - half);
    const hi = Math.min(n - 1, k + half);
    let sum = 0;
    for (let j = lo; j <= hi; j++) sum += power[j]!;
    out[k] = 10 * Math.log10(sum / (hi - lo + 1));
  }
  return out;
}

export function speakerSources(placement: Placement, ctx: AnalysisContext): Vec3[] {
  return [
    wooferCentre(placement.speakers.left, ctx.speaker),
    wooferCentre(placement.speakers.right, ctx.speaker),
  ];
}

export interface Extreme {
  frequency: number;
  db: number;
}

/** Largest peak and deepest dip (relative to the median) of a smoothed curve within [fLo, fHi]. */
export function extremes(
  freqs: Float64Array,
  db: Float64Array,
  median: number,
  fLo: number,
  fHi: number,
) {
  let peak: Extreme = { frequency: NaN, db: -Infinity };
  let dip: Extreme = { frequency: NaN, db: Infinity };
  freqs.forEach((f, k) => {
    if (f < fLo || f > fHi) return;
    const v = db[k]! - median;
    if (v > peak.db) peak = { frequency: f, db: v };
    if (v < dip.db) dip = { frequency: f, db: v };
  });
  return { peak, dip };
}

/**
 * Upper limit of the scored bass band (🟡 calibration). Below it, position matters most and the
 * modal model converges well; the front-wall dip above it is scored by C3 instead.
 */
export const BASS_SCORING_MAX_HZ = 200;

/** Frequency range used for scoring and findings: from max(lowLimit, f6) up to ≈ Schroeder (≤ 200 Hz). */
export function bassRange(ctx: AnalysisContext, lowLimit = 30): [number, number] {
  const fLo = Math.max(lowLimit, ctx.speaker.f6);
  const fHi = Math.min(Math.max(ctx.schroeder.value, 2 * fLo), BASS_SCORING_MAX_HZ, ctx.bassMaxHz);
  return [fLo, fHi];
}

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export interface BassCurve {
  freqs: Float64Array;
  /** 1/6-octave smoothed, normalised so the median over the scoring range is 0 dB. */
  db: Float64Array;
  range: [number, number];
}

export function bassCurve(
  ctx: AnalysisContext,
  placement: Placement,
  model = buildBassModel(ctx),
): BassCurve {
  const coupling = sourceCoupling(model, speakerSources(placement, ctx), ctx);
  const smoothed = smoothDb(responseDb(model, coupling, placement.listener, ctx));
  const range = bassRange(ctx);
  const inRange = Array.from(smoothed).filter((_, k) => {
    const f = model.freqs[k]!;
    return f >= range[0] && f <= range[1];
  });
  const median = medianOf(inRange);
  return { freqs: model.freqs, db: smoothed.map((v) => v - median), range };
}

/** Peaks or dips larger than this (dB re median) are reported. Calibration choice (🟡), = C2. */
const REPORT_DB = 6;

export const P09: RuleDef = {
  id: 'P09',
  level: 'physics',
  sources: ['KUT', 'EVP'],
  variants: ['peak', 'dip', 'smooth'],
  evaluate(ctx, placement) {
    const curve = bassCurve(ctx, placement);
    const { peak, dip } = extremes(curve.freqs, curve.db, 0, curve.range[0], curve.range[1]);
    const assumptions = [
      ASSUMPTION.rigidRectangular,
      ASSUMPTION.pointSource,
      ASSUMPTION.uniformDamping,
    ];
    const findings = [];
    if (peak.db > REPORT_DB) {
      findings.push(
        makeFinding(
          P09,
          'peak',
          'caution',
          { frequency: peak.frequency, db: peak.db },
          { assumptions },
        ),
      );
    }
    if (dip.db < -REPORT_DB) {
      findings.push(
        makeFinding(
          P09,
          'dip',
          'caution',
          { frequency: dip.frequency, db: dip.db },
          { assumptions },
        ),
      );
    }
    if (findings.length === 0) findings.push(makeFinding(P09, 'smooth', 'ok', {}, { assumptions }));
    return findings;
  },
};
