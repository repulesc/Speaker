import type { Project } from '../../engine/types';
import { SIZE_LIMITS } from './limits';
import { projectSchema } from './schema';
import { isRecord } from './validate';

/** Current persisted schema. Each older version needs a migration to the next (see MIGRATIONS). */
export const CURRENT_SCHEMA = 1;

/** MIGRATIONS[n] converts a version-n document to version n + 1. Empty until schema 2 exists. */
const MIGRATIONS: Record<number, (doc: Record<string, unknown>) => Record<string, unknown>> = {};

export type ReadFailure =
  | { ok: false; reason: 'notJson' | 'tooBig' | 'notAProject' | 'newerVersion' }
  | { ok: false; reason: 'invalid'; detail: string };

export type ReadResult = { ok: true; project: Project } | ReadFailure;

export function migrate(doc: Record<string, unknown>): Record<string, unknown> | 'newer' {
  let current = doc;
  let version = current.schemaVersion;
  if (typeof version !== 'number') return current;
  if (version > CURRENT_SCHEMA) return 'newer';
  while (version < CURRENT_SCHEMA) {
    const step = MIGRATIONS[version];
    if (!step) return current;
    current = { ...step(current), schemaVersion: version + 1 };
    version += 1;
  }
  return current;
}

/** Validates an already-parsed document (from a file, a share link or storage). */
export function readProject(raw: unknown): ReadResult {
  if (!isRecord(raw) || typeof raw.schemaVersion !== 'number')
    return { ok: false, reason: 'notAProject' };
  const doc = migrate(raw);
  if (doc === 'newer') return { ok: false, reason: 'newerVersion' };
  const error = projectSchema(doc, 'project');
  if (error) return { ok: false, reason: 'invalid', detail: error };
  const project = doc as unknown as Project;
  if (!project.variants.some((v) => v.id === project.activeVariantId)) {
    return {
      ok: false,
      reason: 'invalid',
      detail: 'project.activeVariantId: not one of the variants',
    };
  }
  if (project.variants.length === 0) {
    return {
      ok: false,
      reason: 'invalid',
      detail: 'project.variants: at least one setup is required',
    };
  }
  return { ok: true, project };
}

export function parseProjectJson(text: string): ReadResult {
  if (text.length > SIZE_LIMITS.fileBytes) return { ok: false, reason: 'tooBig' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'notJson' };
  }
  return readProject(raw);
}

export function serializeProject(
  project: Project,
  options: { includeNotes?: boolean } = {},
): string {
  const out = options.includeNotes === false ? { ...project, notes: [] } : project;
  return JSON.stringify(out, null, 2);
}

/** `<name>.speaker.json`, with characters that file systems dislike replaced. */
export function exportFileName(project: Project, untitled = 'project'): string {
  // eslint-disable-next-line no-control-regex -- control characters are stripped on purpose
  const base = (project.name.trim() || untitled).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-');
  return `${base}.speaker.json`;
}
