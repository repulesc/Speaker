import { describe, expect, it } from 'vitest';
import {
  addPatch,
  boundaryExtent,
  movePatch,
  removePatch,
  resizePatch,
  setBaseSurface,
} from '../../src/app/plan/patches';
import { buildContext } from '../../src/engine/context';
import { createDefaultProject } from '../../src/app/state/defaults';
import { makeProject } from '../fixtures/projects';

// Room R: W 4.0, L 5.0, H 2.5
describe('boundaries', () => {
  it('sizes follow the engine coordinates', () => {
    const p = makeProject();
    expect(boundaryExtent(p, 'front')).toEqual({ span: 4, extent: 2.5 });
    expect(boundaryExtent(p, 'left')).toEqual({ span: 5, extent: 2.5 });
    expect(boundaryExtent(p, 'floor')).toEqual({ span: 4, extent: 5 });
  });
  it('unknown room size gives nothing', () => {
    expect(boundaryExtent(createDefaultProject({ name: '', system: 'metric' }), 'left')).toBeNull();
  });
});

describe('patches', () => {
  it('quick-add puts a typical patch inside the boundary', () => {
    const p = makeProject();
    const id = addPatch(p, 'right', 'window')!;
    const patch = p.surfaces.patches.find((x) => x.id === id)!;
    expect(patch).toMatchObject({
      boundary: 'right',
      preset: 'glass',
      width: 1.2,
      height: 1.2,
      v: 0.9,
    });
    expect(patch.u).toBeCloseTo((5 - 1.2) / 2, 1);
    expect(patch.u + patch.width).toBeLessThanOrEqual(5);
  });

  it('big defaults shrink to fit small boundaries', () => {
    const p = makeProject({ W: 1.6, L: 2, H: 1.9 });
    const id = addPatch(p, 'front', 'shelf')!;
    const patch = p.surfaces.patches.find((x) => x.id === id)!;
    expect(patch.width).toBeLessThanOrEqual(1.6);
    expect(patch.v + patch.height).toBeLessThanOrEqual(1.9 + 1e-9);
  });

  it('moves with snapping, or exactly when typed, and stays inside', () => {
    const p = makeProject();
    const id = addPatch(p, 'front', 'painting')!;
    movePatch(p, id, { u: 1.237, v: 1.31 });
    expect(p.surfaces.patches[0]).toMatchObject({ u: 1.25, v: 1.3 });
    movePatch(p, id, { u: 1.237 }, { grid: false });
    expect(p.surfaces.patches[0]!.u).toBe(1.237);
    movePatch(p, id, { u: 99, v: -4 });
    expect(p.surfaces.patches[0]!.u).toBeCloseTo(4 - 0.9, 6);
    expect(p.surfaces.patches[0]!.v).toBe(0);
  });

  it('resizing keeps the patch inside the boundary', () => {
    const p = makeProject();
    const id = addPatch(p, 'front', 'painting')!;
    movePatch(p, id, { u: 3, v: 1.5 });
    resizePatch(p, id, { width: 3, height: 3 });
    const patch = p.surfaces.patches[0]!;
    expect(patch.width).toBe(3);
    expect(patch.height).toBe(2.5);
    expect(patch.u + patch.width).toBeLessThanOrEqual(4 + 1e-9);
    expect(patch.v).toBe(0);
  });

  it('removing a patch removes only that patch', () => {
    const p = makeProject();
    const a = addPatch(p, 'left', 'window')!;
    addPatch(p, 'left', 'curtain');
    removePatch(p, a);
    expect(p.surfaces.patches).toHaveLength(1);
    expect(p.surfaces.patches[0]!.preset).toBe('curtain-heavy');
  });

  it('a patch changes the reverberation estimate (the engine sees it)', () => {
    const p = makeProject();
    const before = buildContext(p)!.t60.mid;
    addPatch(p, 'left', 'curtain');
    const after = buildContext(p)!.t60.mid;
    expect(after).toBeLessThan(before);
  });
});

describe('base surfaces', () => {
  it('a choice counts as the user\'s own; "don\'t know" returns to the typical default', () => {
    const p = makeProject();
    setBaseSurface(p, 'floor', 'carpet-heavy');
    expect(p.surfaces.base.floor).toBe('carpet-heavy');
    expect(p.surfaces.baseCertainty.floor).toBe('estimated');
    setBaseSurface(p, 'floor', null);
    expect(p.surfaces.base.floor).toBe('wood-floor');
    expect(p.surfaces.baseCertainty.floor).toBe('unknown');
  });
});
