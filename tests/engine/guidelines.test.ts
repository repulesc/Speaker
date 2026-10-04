import { describe, expect, it } from 'vitest';
import { buildContext, currentPlacement } from '../../src/engine/context';
import { G01 } from '../../src/engine/rules/G01-room-midpoint';
import { G02 } from '../../src/engine/rules/G02-back-wall';
import { G03 } from '../../src/engine/rules/G03-symmetry';
import { G04, stereoAngleDeg } from '../../src/engine/rules/G04-stereo-angle';
import { G05 } from '../../src/engine/rules/G05-equal-distance';
import { G06 } from '../../src/engine/rules/G06-corners';
import { G07 } from '../../src/engine/rules/G07-port-clearance';
import { G08 } from '../../src/engine/rules/G08-ear-height';
import { G10 } from '../../src/engine/rules/G10-objects';
import { H01 } from '../../src/engine/rules/H01-38-percent';
import { H04, frontWallZone } from '../../src/engine/rules/H04-near-or-far';
import { H06 } from '../../src/engine/rules/H06-treble-trim';
import type { RuleDef } from '../../src/engine/rules/rule';
import type { Project } from '../../src/engine/types';
import { genericSpeaker, makeProject } from '../fixtures/projects';

function severities(rule: RuleDef, project: Project) {
  const ctx = buildContext(project)!;
  return rule.evaluate(ctx, currentPlacement(ctx)).map((f) => f.severity);
}

function moveListener(project: Project, y: number, z?: number): Project {
  const ears = project.variants[0]!.listener.ears;
  ears.y = y;
  if (z !== undefined) ears.z = z;
  return project;
}

describe('G01 room midpoint', () => {
  it.each([
    [2.5, 'red-flag'],
    [2.3, 'red-flag'],
    [2.8, 'caution'],
    [3.1, 'ok'],
  ])('listener y = %d → %s', (y, severity) => {
    expect(severities(G01, moveListener(makeProject(), y))[0]).toBe(severity);
  });

  it('threshold edges: exactly 5 % is caution, exactly 10 % is ok', () => {
    expect(severities(G01, moveListener(makeProject(), 2.75))[0]).toBe('caution');
    expect(severities(G01, moveListener(makeProject(), 3.0))[0]).toBe('ok');
  });

  it('notes the width node for a centred listener', () => {
    const ctx = buildContext(makeProject())!;
    expect(G01.evaluate(ctx, currentPlacement(ctx)).map((f) => f.messageKey)).toContain(
      'finding.G01.widthNode',
    );
  });
});

describe('G02 back wall', () => {
  it.each([
    [4.8, 'red-flag'],
    [4.5, 'caution'],
    [4.0, 'ok'],
  ])('listener y = %d → %s', (y, severity) => {
    expect(severities(G02, moveListener(makeProject(), y))[0]).toBe(severity);
  });
});

describe('G03 symmetry', () => {
  it('side distances 0.9 vs 1.3 m → red flag', () => {
    const p = makeProject();
    p.variants[0]!.speakers.left.base.x = 0.9;
    p.variants[0]!.speakers.right.base.x = 4 - 1.3;
    expect(severities(G03, p)[0]).toBe('red-flag');
  });

  it('different surface classes at the mirrored reflection points → caution', () => {
    const p = makeProject({ surfaces: { left: 'curtain-heavy' } });
    expect(severities(G03, p)).toEqual(['ok', 'caution']);
  });
});

describe('G04 stereo angle', () => {
  it('worked example: 60°', () => {
    expect(
      stereoAngleDeg({ x: 1, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 2, y: 2.732, z: 0 }),
    ).toBeCloseTo(60, 1);
  });
  // Acoustic centres at x = 1 and 3, y = 0.75 (rear clearance 0.5 + cabinet depth 0.25).
  it.each([
    [2.48, 'ok'], // 60°
    [3.5, 'caution'], // 40°
    [1.7, 'red-flag'], // 93°
  ])('listener y = %d → %s', (y, severity) => {
    expect(
      severities(G04, moveListener(makeProject({ clearance: 0.5, halfSpacing: 1.0 }), y))[0],
    ).toBe(severity);
  });
});

describe('G05 equal distances', () => {
  it('0.07 m difference → caution; symmetric → ok; 0.2 m → red flag', () => {
    expect(severities(G05, makeProject())[0]).toBe('ok');
    const p = makeProject();
    p.variants[0]!.listener.ears.x = 2.1;
    expect(severities(G05, p)[0]).toBe('caution');
    p.variants[0]!.listener.ears.x = 2.35;
    expect(severities(G05, p)[0]).toBe('red-flag');
  });
});

describe('G06 corners', () => {
  it('speaker tucked into the corner → red flag', () => {
    // Shallow cabinet: woofer centre 0.17 m from the front wall, 0.15 m from the side wall.
    const speaker = genericSpeaker({
      dimensions: {
        w: { value: 0.2, certainty: 'measured' },
        h: { value: 0.3, certainty: 'measured' },
        d: { value: 0.15, certainty: 'measured' },
      },
    });
    expect(severities(G06, makeProject({ clearance: 0.02, halfSpacing: 1.85, speaker }))[0]).toBe(
      'red-flag',
    );
  });
  it('designed-for-corner speakers are exempt', () => {
    const speaker = genericSpeaker({ designedForCorner: true });
    expect(severities(G06, makeProject({ clearance: 0.02, halfSpacing: 1.85, speaker }))).toEqual(
      [],
    );
  });
});

describe('G07 port clearance', () => {
  it('rear port 0.1 m from the wall → caution (default 0.2 m minimum)', () => {
    expect(severities(G07, makeProject({ clearance: 0.1 }))[0]).toBe('caution');
  });
  it('manufacturer minimum overrides the default', () => {
    const speaker = genericSpeaker({ minWallDistance: { value: 0.05, certainty: 'measured' } });
    expect(severities(G07, makeProject({ clearance: 0.1, speaker }))[0]).toBe('ok');
  });
  it('sealed speakers get no port finding', () => {
    const speaker = genericSpeaker({
      enclosure: { value: 'sealed', certainty: 'measured' },
      portLocation: { value: 'none', certainty: 'measured' },
    });
    expect(severities(G07, makeProject({ clearance: 0.1, speaker }))).toEqual([]);
  });
});

describe('G08 ear height', () => {
  it('axis 0.9 m, ears 1.1 m, 2.5 m away → ok (4.6°)', () => {
    const p = makeProject({ standZ: 0.7, earZ: 1.1, listenerY: 0.625 + 0.125 + 2.5 });
    const ctx = buildContext(p)!;
    const [f] = G08.evaluate(ctx, currentPlacement(ctx));
    expect(f!.severity).toBe('ok');
  });
  it('ears far above the axis → red flag', () => {
    expect(severities(G08, makeProject({ standZ: 0, earZ: 1.6, listenerY: 1.5 }))[0]).toBe(
      'red-flag',
    );
  });
});

describe('G10 objects', () => {
  it('an object between speaker and listener → red flag', () => {
    const p = makeProject();
    p.variants[0]!.objects = [
      {
        id: 'cab',
        kind: 'cabinet',
        position: { x: 0.8, y: 1.6, z: 0 },
        size: { x: 0.6, y: 0.4, z: 1.5 },
        hard: true,
      },
    ];
    expect(severities(G10, p)).toContain('red-flag');
  });
  it('another speaker right next to a main speaker → caution', () => {
    const p = makeProject();
    p.variants[0]!.objects = [
      {
        id: 's',
        kind: 'other-speaker',
        position: { x: 0.5, y: 0.4, z: 0 },
        size: { x: 0.2, y: 0.3, z: 0.9 },
        hard: true,
      },
    ];
    expect(
      G10.evaluate(buildContext(p)!, currentPlacement(buildContext(p)!)).map((f) => f.messageKey),
    ).toContain('finding.G10.passiveSpeaker');
  });
});

describe('heuristics', () => {
  it('H01 overlay at 0.38·L (Room R → 1.90 m)', () => {
    const ctx = buildContext(makeProject())!;
    expect(H01.evaluate(ctx, currentPlacement(ctx))[0]!.overlayY).toEqual([1.9]);
  });
  it('H04 zones', () => {
    expect(frontWallZone(400)).toBe('near');
    expect(frontWallZone(150)).toBe('middle');
    expect(frontWallZone(60)).toBe('far');
    const ctx = buildContext(makeProject({ clearance: 0.5 }))!;
    expect(H04.evaluate(ctx, currentPlacement(ctx))[0]!.messageKey).toBe('finding.H04.middle');
  });
  it('H06 only for speakers with a treble control; dead room → lift', () => {
    const dead = makeProject({
      surfaces: {
        floor: 'carpet-underlay',
        left: 'curtain-heavy',
        right: 'curtain-heavy',
        back: 'curtain-heavy',
      },
    });
    const ctx = buildContext(dead)!;
    expect(H06.evaluate(ctx, currentPlacement(ctx))).toEqual([]);
    dead.speaker.dsp.treble = { minDb: -3, maxDb: 3, stepDb: 0.5 };
    const ctx2 = buildContext(dead)!;
    expect(H06.evaluate(ctx2, currentPlacement(ctx2))[0]!.messageKey).toBe('finding.H06.lift');
  });
});
