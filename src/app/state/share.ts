import type { Project } from '../../engine/types';
import { SIZE_LIMITS } from './limits';
import { readProject, type ReadResult } from './projectFile';

/**
 * Share links keep the whole project in the URL fragment: `#p=<base64url(deflate-raw(JSON))>`.
 * The fragment is never sent to a server. Listening notes are left out unless asked for.
 */
const PREFIX = '#p=';

async function pump(input: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const writer = stream.writable.getWriter();
  void writer.write(input as BufferSource);
  void writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(text.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

/** The fragment (including `#p=`) for a project. */
export async function encodeShare(project: Project) {
  const bytes = await pump(
    new TextEncoder().encode(JSON.stringify(project)),
    new CompressionStream('deflate-raw'),
  );
  return PREFIX + toBase64Url(bytes);
}

export function hasShare(hash: string): boolean {
  return hash.startsWith(PREFIX);
}

export async function decodeShare(hash: string): Promise<ReadResult> {
  if (!hasShare(hash)) return { ok: false, reason: 'notAProject' };
  const payload = hash.slice(PREFIX.length);
  if (payload.length > SIZE_LIMITS.shareChars) return { ok: false, reason: 'tooBig' };
  try {
    const compressed = fromBase64Url(payload);
    // Decompression is size-checked as it streams, so a "zip bomb" link cannot exhaust memory.
    const text = await inflateLimited(compressed, SIZE_LIMITS.fileBytes);
    return readProject(JSON.parse(text));
  } catch (error) {
    return error instanceof TooBig
      ? { ok: false, reason: 'tooBig' }
      : { ok: false, reason: 'notJson' };
  }
}

class TooBig extends Error {}

async function inflateLimited(bytes: Uint8Array, maxBytes: number): Promise<string> {
  const stream = new DecompressionStream('deflate-raw');
  const writer = stream.writable.getWriter();
  void writer.write(bytes as BufferSource).catch(() => {});
  void writer.close().catch(() => {});
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new TooBig();
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder().decode(all);
}
