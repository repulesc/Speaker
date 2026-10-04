import { describe, expect, it } from 'vitest';
import { buildContext } from '../../src/engine/context';
import { modeShape } from '../../src/engine/rules/P03-mode-shape';
import {
  buildBassModel,
  logFrequencies,
  modeShapes,
  responseDb,
  smoothDb,
  sourceCoupling,
  speakerHighPass,
} from '../../src/engine/rules/P09-bass-response';
import { roomModes } from '../../src/engine/rules/P02-room-modes';
import { makeProject } from '../fixtures/projects';

const ctx = buildContext(makeProject())!;
const model = buildBassModel(ctx, 20, 200);
const a = { x: 1.1, y: 0.8, z: 0.8 };
const b = { x: 2.3, y: 3.4, z: 1.1 };

function response(source: typeof a, receiver: typeof a) {
  return responseDb(model, sourceCoupling(model, [source], ctx), receiver, ctx);
}

describe('P09 bass model', () => {
  it('per-axis cosine tables equal modeShape()', () => {
    const shapes = modeShapes(model, b, ctx);
    model.modes.forEach((n, m) => expect(shapes[m]).toBeCloseTo(modeShape(n, b, ctx.room), 12));
  });

  it('reciprocity: swapping source and receiver gives the same response', () => {
    const ab = response(a, b);
    const ba = response(b, a);
    ab.forEach((v, k) => expect(v).toBeCloseTo(ba[k]!, 9));
  });

  it('a receiver on a nodal plane gets nothing from that mode', () => {
    const atMidLength = { ...b, y: ctx.room.L / 2 };
    const shapes = modeShapes(model, atMidLength, ctx);
    const index = model.modes.findIndex((n) => n.join() === '0,1,0');
    expect(shapes[index]).toBeCloseTo(0, 12);
  });

  it('scaling all dimensions by k scales mode frequencies by 1/k', () => {
    const room = ctx.room;
    const k = 1.7;
    const scaled = {
      W: room.W * k,
      L: room.L * k,
      H: room.H * k,
      V: room.V * k ** 3,
      S: room.S * k ** 2,
    };
    const original = roomModes(room, 343, 150);
    const bigger = roomModes(scaled, 343, 150 / k);
    expect(bigger.length).toBe(original.length);
    bigger.forEach((m, i) => expect(m.f).toBeCloseTo(original[i]!.f / k, 9));
  });

  it('the speaker high-pass is exactly −6 dB at f6, for both orders', () => {
    for (const sealed of [true, false]) {
      expect(20 * Math.log10(speakerHighPass(50, 50, sealed))).toBeCloseTo(-6.02, 2);
      expect(speakerHighPass(500, 50, sealed)).toBeGreaterThan(0.99);
    }
  });

  it('log frequencies are 24 per octave', () => {
    const f = logFrequencies(20, 40);
    expect(f.length).toBe(25);
    expect(f[24]).toBeCloseTo(40, 9);
  });

  it('smoothing leaves a flat curve flat and averages power', () => {
    expect(Array.from(smoothDb(new Float64Array(20).fill(3)))).toEqual(
      new Array(20).fill(3).map(() => expect.closeTo(3, 9)),
    );
    const spike = new Float64Array(9).fill(0);
    spike[4] = 10;
    const smoothed = smoothDb(spike, 6, 24); // ±2 points
    expect(smoothed[4]).toBeCloseTo(10 * Math.log10((10 + 4) / 5), 9);
  });
});
