import { describe, expect, it, vi } from 'vitest';
import type { KeyValueStore } from '../../src/app/state/persistence';
import { loadIndex, loadProject } from '../../src/app/state/persistence';
import { Workspace } from '../../src/app/state/workspace.svelte';
import {
  applyDefaultPlacement,
  createDefaultProject,
  defaultPlacement,
  FIRST_GUESS,
} from '../../src/app/state/defaults';
import { genericSpeaker, makeProject } from '../fixtures/projects';

class MemoryStore implements KeyValueStore {
  data = new Map<string, string>();
  full = false;
  getItem = (k: string) => this.data.get(k) ?? null;
  setItem = (k: string, v: string) => {
    if (this.full) throw new DOMException('quota', 'QuotaExceededError');
    this.data.set(k, v);
  };
  removeItem = (k: string) => void this.data.delete(k);
}

const options = { system: 'metric' as const };
const setWidth =
  (w: number) => (p: { room: { width: { value: number | null; certainty: string } } }) => {
    p.room.width = { value: w, certainty: 'measured' };
  };

describe('Workspace', () => {
  it('starts with a fresh project and no storage notice when storage works', () => {
    const ws = new Workspace(new MemoryStore(), options);
    expect(ws.project.name).toBe('');
    expect(ws.saveState).toBe('saved');
  });

  it('edits are undoable and redoable', () => {
    const ws = new Workspace(new MemoryStore(), options);
    ws.edit((p) => void (p.room.width = { value: 4, certainty: 'measured' }));
    ws.edit((p) => void (p.room.width = { value: 5, certainty: 'measured' }));
    expect(ws.canUndo).toBe(true);
    ws.undo();
    expect(ws.project.room.width.value).toBe(4);
    ws.undo();
    expect(ws.project.room.width.value).toBeNull();
    expect(ws.canUndo).toBe(false);
    expect(ws.canRedo).toBe(true);
    ws.redo();
    ws.redo();
    expect(ws.project.room.width.value).toBe(5);
    ws.undo();
    ws.edit((p) => void (p.room.height = { value: 2.5, certainty: 'estimated' }));
    expect(ws.canRedo).toBe(false);
  });

  it('a change that changes nothing leaves no undo step', () => {
    const ws = new Workspace(new MemoryStore(), options);
    ws.edit((p) => void (p.units = 'metric'));
    expect(ws.canUndo).toBe(false);
  });

  it('autosaves after a pause and reloads the same project next time', () => {
    vi.useFakeTimers();
    const store = new MemoryStore();
    const ws = new Workspace(store, options);
    ws.edit((p) => void (p.name = 'Living room'));
    expect(ws.saveState).toBe('unsaved');
    vi.advanceTimersByTime(500);
    expect(ws.saveState).toBe('saved');
    vi.useRealTimers();
    const again = new Workspace(store, options);
    expect(again.project.name).toBe('Living room');
    expect(again.project.id).toBe(ws.project.id);
  });

  it('works without storage and says so', () => {
    const ws = new Workspace(null, options);
    expect(ws.saveState).toBe('unavailable');
    ws.edit(setWidth(4));
    expect(ws.project.room.width.value).toBe(4);
  });

  it('reports a refused write instead of pretending it saved', () => {
    const store = new MemoryStore();
    const ws = new Workspace(store, options);
    store.full = true;
    ws.edit(setWidth(4));
    ws.flush();
    expect(ws.saveState).toBe('failed');
    store.full = false;
    ws.flush();
    expect(ws.saveState).toBe('saved');
  });

  it('manages rooms: new, switch, rename, start over', () => {
    const store = new MemoryStore();
    const ws = new Workspace(store, options);
    const first = ws.project.id;
    ws.rename('First');
    ws.newProject();
    const second = ws.project.id;
    expect(second).not.toBe(first);
    expect(ws.canUndo).toBe(false);
    expect(
      loadIndex(store)
        .map((e) => e.id)
        .sort(),
    ).toEqual([first, second].sort());

    expect(ws.switchTo(first)).toBe(true);
    expect(ws.project.name).toBe('First');

    // Start over: an empty room replaces the open one, which is deleted.
    ws.startOver();
    expect(ws.project.id).not.toBe(first);
    expect(ws.project.name).toBe('');
    expect(loadProject(store, first)).toBeNull();
    expect(ws.index).toHaveLength(2);
  });

  it('switching to a missing project reports failure and changes nothing', () => {
    const ws = new Workspace(new MemoryStore(), options);
    const id = ws.project.id;
    expect(ws.switchTo('missing')).toBe(false);
    expect(ws.project.id).toBe(id);
  });

  it('imports as a new project and never overwrites', () => {
    const ws = new Workspace(new MemoryStore(), options);
    const original = ws.project.id;
    const incoming = createDefaultProject({ name: 'Imported', system: 'imperial' });
    ws.importProject(incoming);
    expect(ws.project.name).toBe('Imported');
    expect(ws.project.id).not.toBe(incoming.id);
    expect(ws.index.map((e) => e.id)).toContain(original);
  });

  it('a stored project list with a repeated id shows each project once', () => {
    const store = new MemoryStore();
    const a = { id: 'a', name: 'A', updatedAt: '2026-01-01' };
    const b = { id: 'b', name: 'B', updatedAt: '2026-01-02' };
    store.setItem('spa:index', JSON.stringify([a, { ...a, name: 'A again' }, b]));
    expect(loadIndex(store).map((e) => e.name)).toEqual(['A', 'B']);
  });

  it('never opens a stored project that fails validation (here: two setups with one id)', () => {
    const store = new MemoryStore();
    const bad = makeProject();
    bad.variants.push({ ...bad.variants[0]!, name: 'Copy' });
    store.setItem(`spa:project:${bad.id}`, JSON.stringify(bad));
    store.setItem('spa:active', bad.id);
    expect(new Workspace(store, options).project.id).not.toBe(bad.id);
  });
});

describe('default placement', () => {
  it('follows the room size until the user places the speakers', () => {
    const ws = new Workspace(new MemoryStore(), options);
    ws.edit((p) => {
      p.room.width = { value: 4, certainty: 'measured' };
      p.room.length = { value: 5, certainty: 'measured' };
    });
    const v = () => ws.project.variants[0]!;
    const centre = () => (v().speakers.left.base.x + v().speakers.right.base.x) / 2;
    expect(centre()).toBeCloseTo(2.0, 6);
    ws.edit(setWidth(6));
    expect(centre()).toBeCloseTo(3.0, 6);
    expect(v().listener.ears.x).toBeCloseTo(3.0, 6);
    const left = v().speakers.left.base.x;
    // Once placed by the user, the speakers stay where they are.
    ws.edit(
      (p) =>
        void (p.variants[0]!.speakers.left = {
          ...p.variants[0]!.speakers.left,
          certainty: 'estimated',
        }),
    );
    ws.edit(setWidth(8));
    expect(v().speakers.left.base.x).toBeCloseTo(left, 6);
  });

  it('first guess: the seat at 38 % of the length, an equilateral triangle from the baffles', () => {
    const speaker = genericSpeaker();
    const depth = speaker.dimensions.d.value!;
    const p = defaultPlacement({ W: 4, L: 5 }, speaker);
    const spacing = p.right.base.x - p.left.base.x;
    const baffle = p.left.base.y + depth / 2;
    expect(p.ears.y).toBeCloseTo(0.38 * 5, 6);
    expect(Math.hypot(p.ears.x - p.left.base.x, p.ears.y - baffle)).toBeCloseTo(spacing, 6);
    expect(p.left.base.y - depth / 2).toBeCloseTo(FIRST_GUESS.rearGap, 6);
    expect(p.left.base.z + 0.2).toBeCloseTo(p.ears.z, 6);
  });

  it('first guess: the triangle wins when the room cannot hold both rules', () => {
    const speaker = genericSpeaker();
    const depth = speaker.dimensions.d.value!;
    const triangle = (W: number, L: number) => {
      const p = defaultPlacement({ W, L }, speaker);
      const spacing = p.right.base.x - p.left.base.x;
      const distance = Math.hypot(p.ears.x - p.left.base.x, p.ears.y - p.left.base.y - depth / 2);
      return { p, spacing, distance };
    };
    // Short room: the pair keeps its minimum width, the seat moves back from 38 %.
    const short = triangle(4, 3.5);
    expect(short.spacing).toBeCloseTo(FIRST_GUESS.minSpacing, 6);
    expect(short.distance).toBeCloseTo(short.spacing, 6);
    expect(short.p.ears.y).toBeGreaterThan(0.38 * 3.5);
    // Long, narrow room: the width limits the pair, the seat comes forward from 38 %.
    const narrow = triangle(2.6, 9);
    expect(narrow.spacing).toBeCloseTo(2.6 - 2 * FIRST_GUESS.sideClearance, 6);
    expect(narrow.distance).toBeCloseTo(narrow.spacing, 6);
    expect(narrow.p.ears.y).toBeLessThan(0.38 * 9);
    // Never against the back wall, never behind the speakers, whatever the size.
    for (const [W, L] of [
      [1.5, 1.5],
      [30, 30],
      [2, 8],
    ] as const) {
      const { p } = triangle(W, L);
      expect(p.ears.y).toBeLessThanOrEqual(
        Math.max(L - FIRST_GUESS.backClearance, p.left.base.y + depth / 2 + 0.3) + 1e-9,
      );
      expect(p.ears.y).toBeGreaterThan(p.left.base.y);
      expect(p.left.base.x).toBeGreaterThan(0);
      expect(p.right.base.x).toBeLessThan(W);
    }
  });

  it('does nothing while the room size is unknown', () => {
    const project = createDefaultProject({ name: 'x', system: 'metric' });
    const before = JSON.stringify(project);
    applyDefaultPlacement(project);
    expect(JSON.stringify(project)).toBe(before);
  });
});

describe('Workspace: coalesced edits', () => {
  it('quick edits with the same key share one undo step; other edits do not', () => {
    const ws = new Workspace(new MemoryStore(), options);
    const nudge = () =>
      ws.edit((p) => void (p.constraints.maxSpeakerDistanceFromWall.value! += 0.01), {
        coalesce: 'nudge',
      });
    nudge();
    nudge();
    nudge();
    ws.edit((p) => void (p.name = 'x'));
    ws.undo(); // the rename
    expect(ws.project.name).toBe('');
    ws.undo(); // all three nudges at once
    expect(ws.project.constraints.maxSpeakerDistanceFromWall.value).toBeCloseTo(1.5, 9);
    expect(ws.canUndo).toBe(false);
  });
});
