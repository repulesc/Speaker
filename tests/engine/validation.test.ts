import { describe, expect, it } from 'vitest';
import { buildContext, currentPlacement } from '../../src/engine/context';
import { RULES } from '../../src/engine/rules';
import { roomModes } from '../../src/engine/rules/P02-room-modes';
import { frontWallNullAtSeat } from '../../src/engine/rules/P04-boundary-interference';
import { eyring, sabine } from '../../src/engine/rules/P08-reverberation';
import type { Project } from '../../src/engine/types';
import { makeProject, measured } from '../fixtures/projects';

/**
 * Validation (docs/REVAMP_PLAN.md, Foolproofing 4): checks against results derived independently
 * of the engine's own formulas, and a regression table of setups that must always be flagged.
 */

describe('against independent physics', () => {
  it('mode count matches the asymptotic formula for a rigid box (Kuttruff), within 10 %', () => {
    // N(f) = 4πV/3 (f/c)³ + πS/4 (f/c)² + Lₑ/8 (f/c), Lₑ = 4(W + L + H) [KUT].
    const c = 343;
    for (const [W, L, H] of [
      [4, 5, 2.5],
      [3.6, 4.4, 2.7],
      [6, 8, 3],
    ] as const) {
      const V = W * L * H;
      const S = 2 * (W * L + W * H + L * H);
      for (const f of [250, 400]) {
        const k = f / c;
        const expected =
          ((4 * Math.PI * V) / 3) * k ** 3 +
          ((Math.PI * S) / 4) * k ** 2 +
          ((4 * (W + L + H)) / 8) * k;
        const counted = roomModes({ W, L, H, V, S }, c, f).length;
        expect(Math.abs(counted - expected) / expected, `${W}×${L}×${H} m at ${f} Hz`).toBeLessThan(
          0.1,
        );
      }
    }
  });

  it('the front-wall null is where two paths cancel, found by brute force', () => {
    // Direct sound plus the wall's mirror image, summed as complex pressures (1/r spreading).
    const woofer = { x: 1.2, y: 0.55, z: 0.8 };
    const c = 343;
    for (const seat of [
      { x: 1.2, y: 3, z: 0.8 },
      { x: 2, y: 2.2, z: 1.1 },
      { x: 2.5, y: 1.4, z: 1.2 },
    ]) {
      const r1 = Math.hypot(seat.x - woofer.x, seat.y - woofer.y, seat.z - woofer.z);
      const r2 = Math.hypot(seat.x - woofer.x, seat.y + woofer.y, seat.z - woofer.z);
      let quietest = { f: 0, level: Infinity };
      for (let f = 40; f <= 600; f += 0.1) {
        const k = (2 * Math.PI * f) / c;
        const level = Math.hypot(
          Math.cos(k * r1) / r1 + Math.cos(k * r2) / r2,
          Math.sin(k * r1) / r1 + Math.sin(k * r2) / r2,
        );
        if (level < quietest.level) quietest = { f, level };
        if (quietest.level < level && f > quietest.f + 50) break; // past the first null
      }
      expect(frontWallNullAtSeat(woofer, seat, c)).toBeCloseTo(quietest.f, 0);
    }
  });

  it('Eyring never exceeds Sabine, and the two agree in a nearly bare room', () => {
    const V = 50;
    const S = 85;
    for (const alpha of [0.02, 0.1, 0.25, 0.5]) {
      expect(eyring(V, S, alpha)).toBeLessThanOrEqual(sabine(V, S * alpha));
    }
    // −ln(1 − α) ≈ α + α²/2, so Eyring/Sabine ≈ 1 − α/2 for small α.
    expect(eyring(V, S, 0.01) / sabine(V, S * 0.01)).toBeCloseTo(1 - 0.01 / 2, 4);
  });
});

/** Setups that must always produce the named red flag or caution. */
const BAD_SETUPS: [string, string, (p: Project) => void][] = [
  ['seat at the room midpoint', 'finding.G01.redFlag', (p) => (seat(p).y = 2.5)],
  ['head against the back wall', 'finding.G02.redFlag', (p) => (seat(p).y = 4.85)],
  [
    'one speaker far nearer its side wall',
    'finding.G03.redFlag',
    (p) => (p.variants[0]!.speakers.right.base.x = 3.6),
  ],
  [
    'speakers far apart for a close seat',
    'finding.G04.redFlag',
    (p) => {
      p.variants[0]!.speakers.left.base.x = 0.3;
      p.variants[0]!.speakers.right.base.x = 3.7;
      seat(p).y = 1.6;
    },
  ],
  ['seat well off-centre', 'finding.G05.redFlag', (p) => (seat(p).x = 2.6)],
  [
    'speaker tucked into a corner',
    'finding.G06.redFlag',
    (p) => {
      p.variants[0]!.speakers.left.base = { x: 0.12, y: 0.13, z: 0.7 };
      p.variants[0]!.speakers.right.base = { x: 3.88, y: 0.13, z: 0.7 };
    },
  ],
  ['rear port against the wall', 'finding.G07.tooClose', (p) => moveBack(p, 0.13)],
  [
    'speakers on the floor',
    'finding.G08.redFlag',
    (p) => {
      p.variants[0]!.speakers.left.base.z = 0;
      p.variants[0]!.speakers.right.base.z = 0;
      seat(p).y = 2.2;
    },
  ],
];

function seat(p: Project) {
  return p.variants[0]!.listener.ears;
}

function moveBack(p: Project, y: number) {
  p.variants[0]!.speakers.left.base.y = y;
  p.variants[0]!.speakers.right.base.y = y;
}

function findingKeys(p: Project): string[] {
  const ctx = buildContext(p)!;
  const placement = currentPlacement(ctx);
  return RULES.flatMap((rule) => rule.evaluate(ctx, placement)).map((f) => f.messageKey);
}

describe('known bad setups are always flagged', () => {
  it.each(BAD_SETUPS)('%s → %s', (_, key, spoil) => {
    const p = makeProject({ listenerY: 3.2 });
    p.room.temperatureC = measured(20);
    spoil(p);
    expect(findingKeys(p)).toContain(key);
  });

  it('and a sound setup gets none of those flags', () => {
    const keys = findingKeys(makeProject({ listenerY: 3.2 }));
    for (const [, key] of BAD_SETUPS) expect(keys).not.toContain(key);
  });
});
