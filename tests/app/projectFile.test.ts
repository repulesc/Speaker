import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../../src/app/state/defaults';
import { SIZE_LIMITS } from '../../src/app/state/limits';
import {
  exportFileName,
  parseProjectJson,
  readProject,
  serializeProject,
} from '../../src/app/state/projectFile';
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

  it('fully filled projects (Room R and the busy room) round-trip', () => {
    for (const p of [makeProject(), busyRoom()]) {
      const result = parseProjectJson(serializeProject(p));
      expect(result.ok && result.project).toEqual(p);
    }
  });

  it('can leave the notes out', () => {
    const p = { ...fresh(), notes: [{ id: 'n', createdAt: 'x', variantId: 'v', symptoms: [] }] };
    const out = JSON.parse(serializeProject(p, { includeNotes: false }));
    expect(out.notes).toEqual([]);
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

  it('rejects oversized lists (hostile files cannot make the engine crawl)', () => {
    const p = makeProject();
    const patch = {
      id: 'p',
      boundary: 'left',
      u: 0,
      v: 0,
      width: 1,
      height: 1,
      preset: 'glass',
    } as const;
    p.surfaces.patches = Array.from({ length: SIZE_LIMITS.patches + 1 }, () => patch);
    expect(readProject(JSON.parse(JSON.stringify(p)))).toMatchObject({
      ok: false,
      reason: 'invalid',
    });
  });

  describe('rejects well-formed files that would break the app (R0 audit C3, H5)', () => {
    const object = {
      id: 'o',
      kind: 'table',
      position: { x: 1, y: 3, z: 0 },
      size: { x: 1, y: 0.6, z: 0.75 },
      hard: true,
    } as const;
    const patch = { id: 'p', boundary: 'left', u: 0, v: 0, width: 1, height: 1 } as const;
    const note = { id: 'n', createdAt: 'x', variantId: 'v1', symptoms: [] };
    const cases: [string, (p: Project) => void][] = [
      ['two setups with one id', (p) => p.variants.push({ ...p.variants[0]!, name: 'Copy' })],
      ['two objects with one id', (p) => (p.variants[0]!.objects = [object, { ...object }])],
      [
        'two surface patches with one id',
        (p) =>
          (p.surfaces.patches = [
            { ...patch, preset: 'glass' },
            { ...patch, preset: 'curtain-heavy' },
          ]),
      ],
      ['two notes with one id', (p) => (p.notes = [note, { ...note }])],
      ['no setups at all', (p) => (p.variants = [])],
      [
        'a surface map without the floor',
        (p) => delete (p.surfaces.base as Partial<Record<string, string>>).floor,
      ],
      [
        'a certainty map without the ceiling',
        (p) => delete (p.surfaces.baseCertainty as Partial<Record<string, string>>).ceiling,
      ],
      [
        'custom absorption with two bands instead of six',
        (p) =>
          p.surfaces.patches.push({
            ...patch,
            preset: 'custom',
            customAbsorption: [
              0.5, 0.5,
            ] as unknown as Project['surfaces']['patches'][0]['customAbsorption'],
          }),
      ],
      [
        'an absorption range with one value',
        (p) =>
          p.variants[0]!.objects.push({
            ...object,
            absorptionRange: [5] as unknown as [number, number],
          }),
      ],
      [
        'an absorption range from high to low',
        (p) => p.variants[0]!.objects.push({ ...object, absorptionRange: [3, 1] }),
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

  it('file names are safe', () => {
    expect(exportFileName({ ...fresh(), name: 'Living room: v2/final' })).toBe(
      'Living room- v2-final.speaker.json',
    );
    expect(exportFileName({ ...fresh(), name: '   ' })).toBe('project.speaker.json');
  });
});
