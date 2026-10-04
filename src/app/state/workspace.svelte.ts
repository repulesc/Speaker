import type { Project, SetupVariant } from '../../engine/types';
import { applyDefaultPlacement, createDefaultProject } from './defaults';
import { newId, nowIso } from './ids';
import { SIZE_LIMITS } from './limits';
import {
  deleteProject,
  loadActiveId,
  loadIndex,
  loadProject,
  saveActiveId,
  saveProject,
  type IndexEntry,
  type KeyValueStore,
} from './persistence';

/** 'unavailable' = the browser blocks storage; 'failed' = a write was refused (e.g. quota). */
export type SaveState = 'saved' | 'unsaved' | 'unavailable' | 'failed';

const HISTORY_LIMIT = 100;
const AUTOSAVE_DELAY_MS = 400;
/** Edits with the same coalesce key within this window (e.g. arrow-key nudges) share one undo step. */
const COALESCE_WINDOW_MS = 900;

export interface WorkspaceOptions {
  system: 'metric' | 'imperial';
}

/**
 * The open project plus everything around it: undo and redo, autosave, and the list of saved
 * projects. All edits go through `edit()` so they are undoable and saved.
 */
export class Workspace {
  project = $state<Project>() as Project;
  index = $state<IndexEntry[]>([]);
  saveState = $state<SaveState>('saved');

  #undo: string[] = [];
  #redo: string[] = [];
  #historyVersion = $state(0);
  #lastCoalesce: { key: string; at: number } | null = null;
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly storage: KeyValueStore | null,
    private readonly options: WorkspaceOptions,
  ) {
    this.index = storage ? loadIndex(storage) : [];
    const activeId = storage ? loadActiveId(storage) : null;
    const saved = storage && activeId ? loadProject(storage, activeId) : null;
    this.project = saved ?? this.#fresh();
    if (!storage) this.saveState = 'unavailable';
  }

  get canUndo(): boolean {
    void this.#historyVersion;
    return this.#undo.length > 0;
  }

  get canRedo(): boolean {
    void this.#historyVersion;
    return this.#redo.length > 0;
  }

  #fresh(): Project {
    return createDefaultProject({ name: '', system: this.options.system });
  }

  #snapshot(): string {
    return JSON.stringify($state.snapshot(this.project));
  }

  /**
   * Applies a change as one undoable step and schedules a save. No-op changes leave no trace.
   * Edits that share a `coalesce` key in quick succession are merged into a single undo step.
   */
  edit(change: (project: Project) => void, options: { coalesce?: string } = {}): void {
    const before = this.#snapshot();
    change(this.project);
    applyDefaultPlacement(this.project);
    if (this.#snapshot() === before) return;

    const now = Date.now();
    const key = options.coalesce;
    const continuing =
      key !== undefined &&
      this.#lastCoalesce?.key === key &&
      now - this.#lastCoalesce.at < COALESCE_WINDOW_MS &&
      this.#undo.length > 0;
    this.#lastCoalesce = key !== undefined ? { key, at: now } : null;

    if (!continuing) {
      this.#undo.push(before);
      if (this.#undo.length > HISTORY_LIMIT) this.#undo.shift();
    }
    this.#redo = [];
    this.#historyVersion++;
    this.#changed();
  }

  undo(): void {
    const previous = this.#undo.pop();
    if (previous === undefined) return;
    this.#redo.push(this.#snapshot());
    this.#restore(previous);
  }

  redo(): void {
    const next = this.#redo.pop();
    if (next === undefined) return;
    this.#undo.push(this.#snapshot());
    this.#restore(next);
  }

  #restore(snapshot: string): void {
    const restored = JSON.parse(snapshot) as Project;
    // Which setup is shown is navigation, not an edit: undo keeps the current tab when it still exists.
    const keep = this.project.activeVariantId;
    restored.activeVariantId = restored.variants.some((v) => v.id === keep)
      ? keep
      : restored.variants[0]!.id;
    this.project = restored;
    this.#lastCoalesce = null;
    this.#historyVersion++;
    this.#changed();
  }

  #changed(): void {
    this.project.updatedAt = nowIso();
    if (this.storage) {
      this.saveState = 'unsaved';
      clearTimeout(this.#timer);
      this.#timer = setTimeout(() => this.flush(), AUTOSAVE_DELAY_MS);
    }
  }

  /** Writes the project now (also called when the page is hidden or closed). */
  flush(): void {
    clearTimeout(this.#timer);
    if (!this.storage) return;
    const ok = saveProject(this.storage, $state.snapshot(this.project) as Project);
    if (ok) saveActiveId(this.storage, this.project.id);
    this.saveState = ok ? 'saved' : 'failed';
    this.index = loadIndex(this.storage);
  }

  #open(project: Project): void {
    this.flush();
    this.project = project;
    this.#undo = [];
    this.#redo = [];
    this.#historyVersion++;
    this.#changed();
    this.flush();
  }

  newProject(): void {
    this.#open(this.#fresh());
  }

  /** Switches to a saved project. Returns false if it cannot be read. */
  switchTo(id: string): boolean {
    if (!this.storage || id === this.project.id) return true;
    const project = loadProject(this.storage, id);
    if (!project) return false;
    this.#open(project);
    return true;
  }

  /** Copies the open project under a new id and name, and opens the copy. */
  duplicate(name: string): void {
    const copy = JSON.parse(this.#snapshot()) as Project;
    this.#open({ ...copy, id: newId(), name, createdAt: nowIso() });
  }

  /** Opens an imported or shared project as a new project (never overwrites an existing one). */
  importProject(project: Project): void {
    if (this.index.length >= SIZE_LIMITS.projects) return;
    this.#open({ ...project, id: newId() });
  }

  /** An empty name makes the project untitled again. */
  rename(name: string): void {
    const trimmed = name.trim().slice(0, SIZE_LIMITS.name);
    this.edit((p) => void (p.name = trimmed));
  }

  /** Deletes a saved project; if it is the open one, the next saved project (or a new one) opens. */
  remove(id: string): void {
    if (this.storage) deleteProject(this.storage, id);
    this.index = this.storage ? loadIndex(this.storage) : [];
    if (id !== this.project.id) return;
    const next = this.index[0];
    const project = next && this.storage ? loadProject(this.storage, next.id) : null;
    this.project = project ?? this.#fresh();
    this.#undo = [];
    this.#redo = [];
    this.#historyVersion++;
    this.#changed();
    this.flush();
  }

  // ── Setup variants ("Current", "Bed moved", …) ──────────────────────────

  /** Copies the active setup under a new name and shows the copy. */
  addVariant(name: string): void {
    this.edit((p) => {
      const source = p.variants.find((v) => v.id === p.activeVariantId) ?? p.variants[0]!;
      const copy = JSON.parse(JSON.stringify(source)) as SetupVariant;
      copy.id = newId();
      copy.name = name;
      if (p.variants.length < SIZE_LIMITS.variants) {
        p.variants.push(copy);
        p.activeVariantId = copy.id;
      }
    });
  }

  /** Shows another setup. Not an undo step; it is saved with the project. */
  switchVariant(id: string): void {
    if (id === this.project.activeVariantId || !this.project.variants.some((v) => v.id === id))
      return;
    this.project.activeVariantId = id;
    this.#lastCoalesce = null;
    this.#changed();
  }

  renameVariant(id: string, name: string): void {
    const trimmed = name.trim().slice(0, SIZE_LIMITS.name);
    if (!trimmed) return;
    this.edit((p) => {
      const variant = p.variants.find((v) => v.id === id);
      if (variant) variant.name = trimmed;
    });
  }

  /** Removes a setup (the last one cannot be removed). */
  deleteVariant(id: string): void {
    if (this.project.variants.length <= 1) return;
    this.edit((p) => {
      p.variants = p.variants.filter((v) => v.id !== id);
      if (p.activeVariantId === id) p.activeVariantId = p.variants[0]!.id;
    });
  }
}
