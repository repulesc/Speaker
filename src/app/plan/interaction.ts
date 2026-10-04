import type { Project } from '../../engine/types';

/** Arrow-key movement: 1 cm per press, 10 cm with Shift. Returns null for other keys. */
export function arrowDelta(
  event: Pick<KeyboardEvent, 'key' | 'shiftKey'>,
): { dx: number; dy: number } | null {
  const step = event.shiftKey ? 0.1 : 0.01;
  switch (event.key) {
    case 'ArrowLeft':
      return { dx: -step, dy: 0 };
    case 'ArrowRight':
      return { dx: step, dy: 0 };
    case 'ArrowUp':
      return { dx: 0, dy: -step };
    case 'ArrowDown':
      return { dx: 0, dy: step };
    default:
      return null;
  }
}

let dragCounter = 0;

interface DragOptions {
  /** The item's position (in the same world units as `toWorld`) when the drag starts. */
  origin: { x: number; y: number };
  /** Unique per item; each drag gets its own undo step. */
  key: string;
  toWorld: (clientX: number, clientY: number) => { x: number; y: number };
  /** Called with the item's new origin for every pointer move. */
  move: (x: number, y: number) => void;
  edit: (change: (project: Project) => void, coalesce: string) => void;
}

/**
 * Drags an item with the pointer (mouse, touch or pen). The item keeps the offset at which it was
 * grabbed, so it does not jump to the pointer. The whole drag is one undo step.
 */
export function startDrag(event: PointerEvent, options: DragOptions): void {
  if (event.button !== 0 && event.pointerType === 'mouse') return;
  event.preventDefault();
  const start = options.toWorld(event.clientX, event.clientY);
  const dx = options.origin.x - start.x;
  const dy = options.origin.y - start.y;
  const gesture = `${options.key}-drag-${++dragCounter}`;

  const onMove = (e: PointerEvent) => {
    const w = options.toWorld(e.clientX, e.clientY);
    options.edit(() => options.move(w.x + dx, w.y + dy), gesture);
  };
  const stop = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', stop);
    window.removeEventListener('pointercancel', stop);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', stop);
  window.addEventListener('pointercancel', stop);
}
