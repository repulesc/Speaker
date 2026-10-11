import type { Project } from '../../engine/types';
import { SIZE_LIMITS } from './limits';
import { encodeShare } from './share';
import type { Workspace } from './workspace.svelte';

/**
 * The address bar is the room (docs/ROADMAP_V11.md): the project is kept in the URL fragment, in
 * the same `#p=` form a share link uses, so a bookmark or a copied address reopens exactly this
 * setup. The fragment follows the room once it settles, never while a pointer is down (a drag),
 * with `replaceState`; only "Apply" and "Start over" add a history step (`pushState`), so Back
 * undoes them and nothing else. A room too big for a link stays out of the address (the device
 * keeps its last room anyway).
 */
export class UrlState {
  /** The fragment we wrote last: a hash change that equals it is our own doing. */
  last = '';
  #queue: Promise<void> = Promise.resolve();
  #pointerDown = false;
  #pending = false;
  #stepping = false;

  constructor(private readonly workspace: Workspace) {
    workspace.afterFlush = () => this.settled();
    if (typeof window === 'undefined') return;
    window.addEventListener('pointerdown', () => (this.#pointerDown = true), true);
    const up = () => {
      this.#pointerDown = false;
      if (this.#pending) this.settled();
    };
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', up, true);
  }

  /** The room has been saved: show it in the address, unless a drag is still going on. */
  settled(): void {
    if (this.#stepping) return; // `step` writes the address itself, in order
    if (this.#pointerDown) {
      this.#pending = true;
      return;
    }
    this.#pending = false;
    void this.write('replace');
  }

  /** Writes the room into the address now (the room as it is at this moment). */
  write(mode: 'replace' | 'push'): Promise<void> {
    const project = $state.snapshot(this.workspace.project) as Project;
    this.#queue = this.#queue.then(async () => {
      try {
        const hash = await encodeShare(project);
        if (hash.length - 3 > SIZE_LIMITS.shareChars) return;
        const url = location.pathname + location.search + hash;
        if (mode === 'push' && hash !== location.hash) history.pushState(null, '', url);
        else history.replaceState(null, '', url);
        this.last = hash;
      } catch {
        // The address keeps its last good value.
      }
    });
    return this.#queue;
  }

  /**
   * A change that gets its own Back step: the address first records the room as it was, then the
   * change is made, then a new history entry records the room as it is.
   */
  step(change: () => void): void {
    void this.write('replace');
    this.#stepping = true;
    try {
      change();
      this.workspace.flush();
    } finally {
      this.#stepping = false;
    }
    void this.write('push');
  }
}
