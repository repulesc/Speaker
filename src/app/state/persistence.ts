import type { Project } from '../../engine/types';
import { SIZE_LIMITS } from './limits';
import { parseProjectJson, serializeProject } from './projectFile';

/** The slice of the Web Storage API we use, so tests can pass a fake. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface IndexEntry {
  id: string;
  name: string;
  updatedAt: string;
}

const INDEX_KEY = 'spa:index';
const ACTIVE_KEY = 'spa:active';
const projectKey = (id: string) => `spa:project:${id}`;

/** localStorage if it works (it can throw or be full in private windows or with blocked data). */
export function browserStorage(): KeyValueStore | null {
  try {
    const probe = '__spa_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

export function loadIndex(store: KeyValueStore): IndexEntry[] {
  try {
    const raw: unknown = JSON.parse(store.getItem(INDEX_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (e): e is IndexEntry =>
          typeof e?.id === 'string' &&
          typeof e.name === 'string' &&
          typeof e.updatedAt === 'string',
      )
      .slice(0, SIZE_LIMITS.projects);
  } catch {
    return [];
  }
}

function writeIndex(store: KeyValueStore, index: IndexEntry[]) {
  store.setItem(INDEX_KEY, JSON.stringify(index));
}

/** Returns false when the browser refuses the write (quota, blocked storage). */
export function saveProject(store: KeyValueStore, project: Project): boolean {
  try {
    store.setItem(projectKey(project.id), serializeProject(project));
    const rest = loadIndex(store).filter((e) => e.id !== project.id);
    writeIndex(store, [
      { id: project.id, name: project.name, updatedAt: project.updatedAt },
      ...rest,
    ]);
    return true;
  } catch {
    return false;
  }
}

export function loadProject(store: KeyValueStore, id: string): Project | null {
  try {
    const text = store.getItem(projectKey(id));
    if (text === null) return null;
    const result = parseProjectJson(text);
    return result.ok ? result.project : null;
  } catch {
    return null;
  }
}

export function deleteProject(store: KeyValueStore, id: string): void {
  try {
    store.removeItem(projectKey(id));
    writeIndex(
      store,
      loadIndex(store).filter((e) => e.id !== id),
    );
  } catch {
    // Nothing more to do: the entry stays until storage works again.
  }
}

export function loadActiveId(store: KeyValueStore): string | null {
  try {
    return store.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveId(store: KeyValueStore, id: string): void {
  try {
    store.setItem(ACTIVE_KEY, id);
  } catch {
    // Not remembered; the newest project opens next time.
  }
}
