import type { Bass } from './entry.ts';

/**
 * The bass figure as the engine needs it: the −6 dB point (f6) that P09's roll-off model uses
 * (docs/SPEAKER_DATA.md). Makers print −3, −6 or −10 dB figures; each is moved to −6 dB along the
 * same Butterworth high-pass P09 draws (2nd order sealed, 4th order otherwise), so the conversion
 * adds no model of its own. For order n the response is |H|² = x^2n / (1 + x^2n); the point at
 * L dB has x^2n = r / (1 − r) with r = 10^(−L/10), so f6 = f_L · ((1/3) / (r / (1 − r)))^(1/2n).
 * 🔴 within that model; how well a maker's figure fits it is not known (marked as such).
 * A figure with no stated level is taken as −6 dB, and `assumed` says so.
 */
export function f6From(bass: Bass, sealed: boolean): { f6: number; assumed: boolean } {
  if (bass.db === null || bass.db === 6) return { f6: bass.hz, assumed: bass.db === null };
  const n = sealed ? 2 : 4;
  const r = 10 ** (-bass.db / 10);
  const atLevel = r / (1 - r);
  return { f6: bass.hz * (1 / 3 / atLevel) ** (1 / (2 * n)), assumed: false };
}
