import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../../src/app/state/defaults';
import { SIZE_LIMITS } from '../../src/app/state/limits';
import {
  exportFileName,
  parseProjectJson,
  readProject,
  serializeProject,
} from '../../src/app/state/projectFile';
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

  it('file names are safe', () => {
    expect(exportFileName({ ...fresh(), name: 'Living room: v2/final' })).toBe(
      'Living room- v2-final.speaker.json',
    );
    expect(exportFileName({ ...fresh(), name: '   ' })).toBe('project.speaker.json');
  });
});
