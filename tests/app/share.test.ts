import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../../src/app/state/defaults';
import { SIZE_LIMITS } from '../../src/app/state/limits';
import { decodeShare, encodeShare, hasShare } from '../../src/app/state/share';
import { busyRoom } from '../fixtures/busy-room';

describe('share links', () => {
  it('round-trips a full project through the URL fragment', async () => {
    const project = busyRoom();
    const hash = await encodeShare(project);
    expect(hash.startsWith('#p=')).toBe(true);
    expect(hash).toMatch(/^#p=[A-Za-z0-9_-]+$/);
    const result = await decodeShare(hash);
    expect(result.ok && result.project).toEqual(project);
  });

  it('is compact enough for a URL', async () => {
    expect((await encodeShare(busyRoom())).length).toBeLessThan(5000);
  });

  it('leaves listening notes out unless asked', async () => {
    const project = {
      ...busyRoom(),
      notes: [
        { id: 'n', createdAt: 'x', variantId: 'v1', symptoms: ['S01' as const], text: 'private' },
      ],
    };
    const without = await decodeShare(await encodeShare(project));
    expect(without.ok && without.project.notes).toEqual([]);
    const withNotes = await decodeShare(await encodeShare(project, { includeNotes: true }));
    expect(withNotes.ok && withNotes.project.notes).toHaveLength(1);
  });

  it('detects share fragments', () => {
    expect(hasShare('#p=abc')).toBe(true);
    expect(hasShare('#other')).toBe(false);
  });

  it('rejects garbage without throwing', async () => {
    for (const hash of ['#p=', '#p=!!!', '#p=AAAA', '#nothing']) {
      expect((await decodeShare(hash)).ok).toBe(false);
    }
  });

  it('rejects over-long links and decompression bombs', async () => {
    expect(await decodeShare('#p=' + 'A'.repeat(SIZE_LIMITS.shareChars + 1))).toMatchObject({
      ok: false,
      reason: 'tooBig',
    });
    // A few KB that inflate to several MB.
    const bomb = new Uint8Array(
      await new Response(
        new Blob([new Uint8Array(5_000_000)])
          .stream()
          .pipeThrough(new CompressionStream('deflate-raw')),
      ).arrayBuffer(),
    );
    let binary = '';
    for (const b of bomb) binary += String.fromCharCode(b);
    const hash = '#p=' + btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(hash.length).toBeLessThan(SIZE_LIMITS.shareChars);
    expect(await decodeShare(hash)).toMatchObject({ ok: false, reason: 'tooBig' });
  });

  it('a decoded project still has to pass validation', async () => {
    const project = createDefaultProject({ name: 'x', system: 'metric' });
    (project as unknown as { units: string }).units = 'cubits';
    expect(await decodeShare(await encodeShare(project))).toMatchObject({
      ok: false,
      reason: 'invalid',
    });
  });
});
