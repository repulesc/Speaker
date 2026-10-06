import { describe, expect, it } from 'vitest';
import { acousticCentre, buildContext, currentPlacement } from '../../src/engine/context';
import { G12 } from '../../src/engine/rules/G12-desk-reflection';
import type { Project } from '../../src/engine/types';
import { makeProject } from '../fixtures/projects';

/** A desk setup: speakers on the desk top (0.75 m), the seat `d` metres in front of them. */
function atDesk(seatAhead: number, earZ = 1.15): Project {
  const p = makeProject({ W: 3.5, L: 4, H: 2.5, clearance: 0.1, halfSpacing: 0.35, standZ: 0.75 });
  p.speaker.choices = { placedOn: 'desk' };
  p.constraints.listeningDistance = 'near';
  p.variants[0]!.listener.area = 'desk';
  const y = p.variants[0]!.speakers.left.base.y;
  p.variants[0]!.listener.ears = { x: 1.75, y: y + seatAhead, z: earZ };
  return p;
}

const run = (p: Project) => {
  const ctx = buildContext(p)!;
  return { ctx, findings: G12.evaluate(ctx, currentPlacement(ctx)) };
};

describe('G12 · the reflection off the desk top', () => {
  it('gives the delay and the first dip from the image source below the desk top', () => {
    const { ctx, findings } = run(atDesk(0.9));
    expect(findings).toHaveLength(1);
    const f = findings[0]!;
    expect(f.messageKey).toBe('finding.G12.onDesk');
    expect(f.severity).toBe('caution');
    // Independent check: tweeter and ears above the desk top, horizontal distance between them.
    const t = acousticCentre(ctx.variant.speakers.left, ctx.speaker);
    const ears = ctx.variant.listener.ears;
    const hs = t.z - 0.75;
    const he = ears.z - 0.75;
    const d = Math.hypot(t.x - ears.x, t.y - ears.y);
    const delta = Math.hypot(d, hs + he) - Math.hypot(d, he - hs);
    expect(Number(f.params.frequency)).toBeCloseTo(ctx.c / (2 * delta), 6);
    expect(Number(f.params.delayMs)).toBeCloseTo((delta / ctx.c) * 1000, 6);
    // A typical desk puts the first dip in the midrange, around a kilohertz.
    expect(Number(f.params.frequency)).toBeGreaterThan(500);
    expect(Number(f.params.frequency)).toBeLessThan(3000);
  });

  it('says the desk adds little when the reflection lands off the desk top', () => {
    // Seated far back: the reflection point falls behind the desk's back edge.
    expect(run(atDesk(2.4, 0.95)).findings.map((f) => f.messageKey)).toEqual(['finding.G12.clear']);
  });

  it('says nothing when you do not listen at a desk', () => {
    const p = atDesk(0.9);
    p.constraints.listeningDistance = 'room';
    delete p.variants[0]!.listener.area;
    expect(run(p).findings).toEqual([]);
  });
});
