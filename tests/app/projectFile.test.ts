import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../../src/app/state/defaults';
import { SIZE_LIMITS } from '../../src/app/state/limits';
import { parseProjectJson, readProject, serializeProject } from '../../src/app/state/projectFile';
import type { Project } from '../../src/engine/types';
import { busyRoom } from '../fixtures/busy-room';
import { makeProject } from '../fixtures/projects';

const fresh = () =>
  createDefaultProject({ name: 'Test', system: 'metric', now: '2026-01-01T00:00:00.000Z' });

describe('project files', () => {
  it('a new project round-trips (all values unknown)', () => {
    const p = fresh();
    const result = parseProjectJson(serializeProject(p));
    expect(result.ok && result.project).toEqual(p);
  });

  it('a project from an older version is tidied: no hidden furniture, patches, notes or setups', () => {
    const old = makeProject() as unknown as Record<string, unknown> & Project;
    const legacy = old as unknown as {
      variants: Record<string, unknown>[];
      surfaces: Record<string, unknown>;
      room: Record<string, unknown>;
      notes: unknown[];
    };
    legacy.variants[0]!.objects = [{ id: 'o', kind: 'sofa' }];
    legacy.variants.push({ ...legacy.variants[0]!, id: 'v2' });
    legacy.surfaces.patches = [{ id: 'p', boundary: 'left', preset: 'glass' }];
    legacy.room.construction = 'lightweight';
    legacy.notes = [{ id: 'n' }];
    old.surfaces.base.left = 'curtain-heavy';
    old.room.temperatureC = { value: 26, certainty: 'measured' };
    old.room.outOfModel = ['alcove', 'slanted-ceiling'];
    old.constraints.listenerYRange = [1, 3];
    const result = readProject(JSON.parse(JSON.stringify(old)));
    if (!result.ok) throw new Error('expected the old project to read');
    const p = result.project as unknown as Record<string, unknown> & Project;
    expect(p.variants).toHaveLength(1);
    expect('objects' in p.variants[0]!).toBe(false);
    expect('patches' in p.surfaces).toBe(false);
    expect('construction' in p.room).toBe(false);
    expect('notes' in p).toBe(false);
    expect(p.surfaces.base.left).toBe('plaster-brick');
    expect(p.surfaces.baseCertainty.left).toBe('unknown');
    expect(p.room.temperatureC.value).toBeNull();
    expect(p.room.outOfModel.sort()).toEqual(['non-rectangular', 'open-plan-connection']);
    expect(p.constraints.listenerYRange).toBeUndefined();
  });

  it('fully filled projects (Room R and the busy room) round-trip', () => {
    for (const p of [makeProject(), busyRoom()]) {
      const result = parseProjectJson(serializeProject(p));
      expect(result.ok && result.project).toEqual(p);
    }
  });

  it.each([
    ['not JSON', '{nope', 'notJson'],
    ['not a project', '{"hello": 1}', 'notAProject'],
    ['an array', '[]', 'notAProject'],
    ['a newer version', '{"schemaVersion": 99}', 'newerVersion'],
  ])('rejects %s', (_, text, reason) => {
    expect(parseProjectJson(text)).toMatchObject({ ok: false, reason });
  });

  it('rejects files over the size limit', () => {
    expect(parseProjectJson(' '.repeat(SIZE_LIMITS.fileBytes + 1))).toMatchObject({
      ok: false,
      reason: 'tooBig',
    });
  });

  it('rejects out-of-range room sizes, with the path to the bad value', () => {
    const p = makeProject();
    p.room.width = { value: 500, certainty: 'measured' };
    const result = readProject(JSON.parse(JSON.stringify(p)));
    expect(result).toMatchObject({ ok: false, reason: 'invalid' });
    expect(result.ok ? '' : (result as { detail: string }).detail).toContain(
      'project.room.width.value',
    );
  });

  it('rejects a value that is null although the certainty says it is known', () => {
    const p = makeProject();
    p.room.height = { value: null, certainty: 'measured' };
    expect(readProject(JSON.parse(JSON.stringify(p)))).toMatchObject({
      ok: false,
      reason: 'invalid',
    });
  });

  it('rejects unknown surface presets and an active variant that does not exist', () => {
    const bad = makeProject() as unknown as {
      surfaces: { base: Record<string, string> };
      activeVariantId: string;
    };
    bad.surfaces.base.front = 'gold-plated';
    expect(readProject(JSON.parse(JSON.stringify(bad)))).toMatchObject({
      ok: false,
      reason: 'invalid',
    });
    const orphan = makeProject();
    orphan.activeVariantId = 'nope';
    expect(readProject(JSON.parse(JSON.stringify(orphan)))).toMatchObject({
      ok: false,
      reason: 'invalid',
    });
  });

  describe('rejects well-formed files that would break the app (R0 audit C3, H5)', () => {
    const cases: [string, (p: Project) => void][] = [
      ['two setups with one id', (p) => p.variants.push({ ...p.variants[0]!, name: 'Copy' })],
      ['no setups at all', (p) => (p.variants = [])],
      [
        'a surface map without the floor',
        (p) => delete (p.surfaces.base as Partial<Record<string, string>>).floor,
      ],
      [
        'a certainty map without the ceiling',
        (p) => delete (p.surfaces.baseCertainty as Partial<Record<string, string>>).ceiling,
      ],
      ['a seat range from far to near', (p) => (p.constraints.listenerYRange = [4, 1])],
      [
        'an empty seat range',
        (p) => (p.constraints.listenerYRange = [] as unknown as [number, number]),
      ],
    ];
    it.each(cases)('%s', (_, mutate) => {
      const p = makeProject();
      mutate(p);
      expect(readProject(JSON.parse(JSON.stringify(p)))).toMatchObject({
        ok: false,
        reason: 'invalid',
      });
    });
  });
});
