import type { RoomGeometry } from '../context';
import type { Finding, Mode } from '../types';
import { makeFinding, type RuleDef } from './rule';

/**
 * P11 · Room proportion quality, information only (🔴 physics checks). Sources: [BON81], [BOLT46], [ITU1116].
 * The room is given, so these never affect scoring; they explain why some rooms are harder.
 */

/** Axial modes below `maxHz` within 5 % of each other. */
export function coincidentAxialModes(modes: readonly Mode[], maxHz: number): [Mode, Mode][] {
  const axial = modes.filter((m) => m.type === 'axial' && m.f <= maxHz);
  const pairs: [Mode, Mode][] = [];
  for (let i = 0; i < axial.length; i++) {
    for (let j = i + 1; j < axial.length; j++) {
      const a = axial[i]!;
      const b = axial[j]!;
      if (Math.abs(a.f - b.f) / Math.max(a.f, b.f) <= 0.05) pairs.push([a, b]);
    }
  }
  return pairs;
}

const THIRD_OCTAVE_CENTRES = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250];

/**
 * Bonello: the number of modes per 1/3-octave band should not decrease with frequency.
 * Returns the centre of the first band where it does, or null.
 */
export function bonelloViolation(modes: readonly Mode[], maxHz: number): number | null {
  const counts = THIRD_OCTAVE_CENTRES.filter((fc) => fc <= maxHz).map((fc) => {
    const lo = fc * 2 ** (-1 / 6);
    const hi = fc * 2 ** (1 / 6);
    return { fc, count: modes.filter((m) => m.f >= lo && m.f < hi).length };
  });
  const first = counts.findIndex((c) => c.count > 0);
  if (first < 0) return null;
  for (let i = first + 1; i < counts.length; i++) {
    if (counts[i]!.count < counts[i - 1]!.count) return counts[i]!.fc;
  }
  return null;
}

/** ITU-R BS.1116 ratio criterion: 1.1·(W/H) ≤ L/H ≤ 4.5·(W/H) − 4, L/H < 3, W/H < 3. */
export function ituRatioPass(room: RoomGeometry): boolean {
  const w = room.W / room.H;
  const l = room.L / room.H;
  return 1.1 * w <= l && l <= 4.5 * w - 4 && l < 3 && w < 3;
}

export const P11: RuleDef = {
  id: 'P11',
  level: 'physics',
  sources: ['BON81', 'BOLT46', 'ITU1116'],
  variants: ['coincident', 'bonello', 'ituPass', 'ituFail'],
  evaluate(ctx) {
    const findings: Finding[] = [];
    for (const [a, b] of coincidentAxialModes(ctx.modes, ctx.schroeder.value).slice(0, 3)) {
      findings.push(
        makeFinding(P11, 'coincident', 'caution', { frequencyA: a.f, frequencyB: b.f }),
      );
    }
    const band = bonelloViolation(ctx.modes, ctx.schroeder.value);
    if (band !== null) findings.push(makeFinding(P11, 'bonello', 'info', { band }));
    findings.push(
      ituRatioPass(ctx.room)
        ? makeFinding(P11, 'ituPass', 'info')
        : makeFinding(P11, 'ituFail', 'info'),
    );
    return findings;
  },
};
