import { describe, expect, it } from 'vitest';
import reference from '../fixtures/reference.json';
import { buildContext } from '../../src/engine/context';
import { modeFrequency, roomModes } from '../../src/engine/rules/P02-room-modes';
import { boundaryNullHz } from '../../src/engine/rules/P04-boundary-interference';
import { reflectionPoint } from '../../src/engine/rules/P06-reflections';
import { schroederFrequency } from '../../src/engine/rules/P07-schroeder';
import { reverberation } from '../../src/engine/rules/P08-reverberation';
import {
  buildBassModel,
  responseDb,
  sourceCoupling,
} from '../../src/engine/rules/P09-bass-response';
import { distance } from '../../src/engine/math/geometry';
import { makeProject } from '../fixtures/projects';

/**
 * Cross-check against the independent Python implementation (tools/reference/reference.py).
 * Tolerances from TEST_PLAN §4: frequencies ±0.01 Hz, bass curve ±0.5 dB after normalisation.
 */
const room = { W: 4, L: 5, H: 2.5, V: 50, S: 85 };
const vec = (v: number[]) => ({ x: v[0]!, y: v[1]!, z: v[2]! });

describe('engine vs independent reference', () => {
  it('room modes', () => {
    const engine = roomModes(room, 343, 120);
    expect(engine.length).toBe(reference.modes.length);
    for (const m of reference.modes) {
      expect(modeFrequency(m.n as [number, number, number], room, 343)).toBeCloseTo(m.f, 2);
    }
  });

  it('boundary interference', () => {
    for (const s of reference.sbir) expect(boundaryNullHz(s.d, 343)).toBeCloseTo(s.f, 2);
  });

  it('first reflection', () => {
    const r = reference.reflection;
    const point = reflectionPoint(vec(r.source), vec(r.receiver), { axis: 'x', at: 0 });
    expect(point.y).toBeCloseTo(r.point[1]!, 6);
    const direct = distance(vec(r.source), vec(r.receiver));
    const reflected = distance(vec(r.source), point) + distance(point, vec(r.receiver));
    expect(((reflected - direct) / 343) * 1000).toBeCloseTo(r.delayMs, 6);
  });

  it('Schroeder frequency', () => {
    const s = reference.schroeder;
    expect(schroederFrequency(s.t60, s.V)).toBeCloseTo(s.f, 6);
  });

  it('Sabine reverberation per band (Room R, default surfaces, 5 m² of furnishing)', () => {
    // The furnishing is given directly (3–7 m², nominal 5), as in the reference, so this checks
    // the formula and the surface data, not the busy-ness calibration.
    const t60 = reverberation(room, makeProject().surfaces, [3, 7]);
    expect(t60.method).toBe('sabine');
    t60.bands.forEach((t, i) => expect(t).toBeCloseTo(reference.sabine[i]!, 6));
  });

  it('modal bass response shape (normalised to the 30–180 Hz median)', () => {
    const base = buildContext(makeProject())!;
    const ctx = { ...base, t60: { ...base.t60, bass: reference.bass.t60 } };
    const model = buildBassModel(ctx, 20, reference.bass.fMax);
    expect(model.freqs.length).toBe(reference.bass.freqs.length);
    const engine = responseDb(
      model,
      sourceCoupling(model, reference.bass.sources.map(vec), ctx),
      vec(reference.bass.receiver),
      ctx,
    );
    const normalise = (db: ArrayLike<number>) => {
      const band = Array.from(db).filter(
        (_, k) => reference.bass.freqs[k]! >= 30 && reference.bass.freqs[k]! <= 180,
      );
      const sorted = [...band].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)]!;
      return Array.from(db, (v) => v - median);
    };
    const a = normalise(engine);
    const b = normalise(reference.bass.db);
    a.forEach((v, k) => expect(Math.abs(v - b[k]!)).toBeLessThan(0.5));
  });
});
