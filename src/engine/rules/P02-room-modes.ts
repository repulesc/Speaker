import type { RoomGeometry } from '../context';
import type { Mode } from '../types';
import { ASSUMPTION, makeFinding, type RuleDef } from './rule';

/**
 * P02 · Room modes, rectangular room (🔴 physics). Sources: [KUT], [EVP], [TOOLE].
 * f(nx, ny, nz) = (c/2) · sqrt((nx/W)² + (ny/L)² + (nz/H)²); nx ↔ width, ny ↔ length, nz ↔ height.
 */
export function modeFrequency(n: readonly [number, number, number], room: RoomGeometry, c: number) {
  const [nx, ny, nz] = n;
  return (c / 2) * Math.sqrt((nx / room.W) ** 2 + (ny / room.L) ** 2 + (nz / room.H) ** 2);
}

export function modeType(n: readonly [number, number, number]): Mode['type'] {
  const nonZero = n.filter((i) => i > 0).length;
  return nonZero === 1 ? 'axial' : nonZero === 2 ? 'tangential' : 'oblique';
}

/** All modes up to `maxHz` (the 0 Hz term excluded), sorted by frequency. */
export function roomModes(room: RoomGeometry, c: number, maxHz: number): Mode[] {
  const maxIndex = (dim: number) => Math.floor((2 * maxHz * dim) / c);
  const modes: Mode[] = [];
  for (let nx = 0; nx <= maxIndex(room.W); nx++) {
    for (let ny = 0; ny <= maxIndex(room.L); ny++) {
      for (let nz = 0; nz <= maxIndex(room.H); nz++) {
        if (nx + ny + nz === 0) continue;
        const n: [number, number, number] = [nx, ny, nz];
        const f = modeFrequency(n, room, c);
        if (f <= maxHz) modes.push({ f, n, type: modeType(n) });
      }
    }
  }
  return modes.sort((a, b) => a.f - b.f);
}

export const P02: RuleDef = {
  id: 'P02',
  level: 'physics',
  sources: ['KUT', 'EVP', 'TOOLE'],
  variants: ['lowestModes'],
  evaluate(ctx) {
    const { room, c } = ctx;
    return [
      makeFinding(
        P02,
        'lowestModes',
        'info',
        {
          length: modeFrequency([0, 1, 0], room, c),
          width: modeFrequency([1, 0, 0], room, c),
          height: modeFrequency([0, 0, 1], room, c),
        },
        { assumptions: [ASSUMPTION.rigidRectangular] },
      ),
    ];
  },
};
