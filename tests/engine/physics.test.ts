import { describe, expect, it } from 'vitest';
import { buildContext, type AnalysisContext } from '../../src/engine/context';
import { speedOfSound } from '../../src/engine/rules/P01-speed-of-sound';
import { modeFrequency, roomModes } from '../../src/engine/rules/P02-room-modes';
import { modeShape } from '../../src/engine/rules/P03-mode-shape';
import { boundaryNullHz } from '../../src/engine/rules/P04-boundary-interference';
import { boundaryGainCategory } from '../../src/engine/rules/P05-boundary-gain';
import { reflectionPoint } from '../../src/engine/rules/P06-reflections';
import { schroederFrequency } from '../../src/engine/rules/P07-schroeder';
import { eyring, sabine } from '../../src/engine/rules/P08-reverberation';
import { criticalDistance } from '../../src/engine/rules/P10-critical-distance';
import { coincidentAxialModes, ituRatioPass } from '../../src/engine/rules/P11-room-proportions';
import { distance } from '../../src/engine/math/geometry';
import { makeProject } from '../fixtures/projects';

// Room R (RULE_CATALOGUE conventions): W 4.0, L 5.0, H 2.5, c = 343.
const roomR = { W: 4, L: 5, H: 2.5, V: 50, S: 85 };
const c = 343;

describe('P01 speed of sound', () => {
  it.each([
    [20, 343.2],
    [0, 331.3],
    [25, 346.1],
  ])('%d °C → %d m/s', (t, expected) => {
    expect(speedOfSound(t)).toBeCloseTo(expected, 1);
  });

  it('defaults to 343.0 m/s when temperature is unknown', () => {
    expect(buildContext(makeProject())!.c).toBe(343);
  });
});

describe('P02 room modes (Room R)', () => {
  it.each([
    [[0, 1, 0], 34.3],
    [[1, 0, 0], 42.875],
    [[1, 1, 0], 54.91],
    [[0, 2, 0], 68.6],
    [[0, 0, 1], 68.6],
    [[0, 1, 1], 76.7],
    [[2, 0, 0], 85.75],
    [[1, 1, 1], 87.87],
    [[0, 3, 0], 102.9],
  ] as const)('mode %j = %d Hz', (n, f) => {
    expect(modeFrequency(n, roomR, c)).toBeCloseTo(f, 1);
  });

  it('lists modes sorted, with types', () => {
    const modes = roomModes(roomR, c, 120);
    expect(modes[0]).toMatchObject({ n: [0, 1, 0], type: 'axial' });
    expect(modes.map((m) => m.f)).toEqual([...modes.map((m) => m.f)].sort((a, b) => a - b));
    expect(modes.find((m) => m.n.join() === '1,1,0')!.type).toBe('tangential');
    expect(modes.find((m) => m.n.join() === '1,1,1')!.type).toBe('oblique');
    expect(modes.every((m) => m.f <= 120)).toBe(true);
  });
});

describe('P03 mode shape', () => {
  it('listener at L/2 gets nothing from the first length mode', () => {
    expect(modeShape([0, 1, 0], { x: 1, y: 2.5, z: 1 }, roomR)).toBeCloseTo(0, 12);
  });
  it('listener at L/4 gets nothing from the second length mode', () => {
    expect(modeShape([0, 2, 0], { x: 1, y: 1.25, z: 1 }, roomR)).toBeCloseTo(0, 12);
  });
  it('corners are antinodes of every mode', () => {
    for (const m of roomModes(roomR, c, 150)) {
      expect(Math.abs(modeShape(m.n, { x: 0, y: 0, z: 0 }, roomR))).toBeCloseTo(1, 12);
    }
  });
});

describe('P04 boundary interference', () => {
  it.each([
    [0.5, 171.5],
    [1.0, 85.75],
    [0.3, 285.83],
  ])('d = %d m → %d Hz', (d, f) => {
    expect(boundaryNullHz(d, c)).toBeCloseTo(f, 1);
  });
});

describe('P05 boundary gain', () => {
  it('worked example: front 0.15, side 0.4, floor 0.8 → high', () => {
    expect(boundaryGainCategory(0.15, 0.4, 0.8)).toBe('high');
  });
  it('far from all boundaries → low', () => {
    expect(boundaryGainCategory(1.2, 1.2, 1.0)).toBe('low');
  });
});

describe('P06 first reflections', () => {
  it('worked example: left wall reflection point, delay and level', () => {
    const speaker = { x: 1.2, y: 1.0, z: 1 };
    const listener = { x: 2.0, y: 3.5, z: 1 };
    const point = reflectionPoint(speaker, listener, { axis: 'x', at: 0 });
    expect(point.x).toBeCloseTo(0, 12);
    expect(point.y).toBeCloseTo(1.9375, 4);
    const direct = distance(speaker, listener);
    const reflected = distance(speaker, point) + distance(point, listener);
    expect(direct).toBeCloseTo(2.625, 3);
    expect(reflected).toBeCloseTo(4.061, 3);
    expect(((reflected - direct) / c) * 1000).toBeCloseTo(4.19, 2);
    expect(20 * Math.log10(direct / reflected)).toBeCloseTo(-3.8, 1);
  });
});

describe('P07 Schroeder frequency', () => {
  it('V = 50, T60 = 0.4 → 178.9 Hz', () => {
    expect(schroederFrequency(0.4, 50)).toBeCloseTo(178.9, 1);
  });
});

describe('P08 reverberation', () => {
  it('Room R with ᾱ = 0.25: Sabine 0.379 s, Eyring 0.329 s', () => {
    expect(sabine(50, 85 * 0.25)).toBeCloseTo(0.379, 3);
    expect(eyring(50, 85, 0.25)).toBeCloseTo(0.329, 3);
  });

  it('uses Eyring when the room is absorbent', () => {
    const ctx = buildContext(
      makeProject({
        surfaces: { floor: 'carpet-underlay', left: 'curtain-heavy', right: 'curtain-heavy' },
      }),
    )!;
    expect(ctx.t60.method).toBe('eyring');
  });

  it('more furnishing → shorter reverberation; range brackets the nominal value', () => {
    const ctx = buildContext(makeProject())!;
    expect(ctx.t60.low).toBeLessThanOrEqual(ctx.t60.mid);
    expect(ctx.t60.high).toBeGreaterThanOrEqual(ctx.t60.mid);
  });
});

describe('P10 critical distance', () => {
  it.each([
    [2, 0.9],
    [4, 1.27],
  ])('Q = %d → %d m', (q, rc) => {
    expect(criticalDistance(q, 50, 0.4)).toBeCloseTo(rc, 2);
  });
});

describe('P11 room proportions', () => {
  it('Room R passes the ITU ratio criterion', () => {
    expect(ituRatioPass(roomR)).toBe(true);
  });
  it('a cube fails it', () => {
    expect(ituRatioPass({ W: 4, L: 4, H: 4, V: 64, S: 96 })).toBe(false);
  });
  it('Room R has the 68.6 Hz coincidence', () => {
    const pairs = coincidentAxialModes(roomModes(roomR, c, 200), 180);
    expect(pairs.some(([a, b]) => Math.abs(a.f - 68.6) < 0.01 && Math.abs(b.f - 68.6) < 0.01)).toBe(
      true,
    );
  });
});

export type { AnalysisContext };
