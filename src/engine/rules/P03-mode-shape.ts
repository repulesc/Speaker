import type { RoomGeometry } from '../context';
import type { Vec3 } from '../types';

/**
 * P03 · Mode shape (🔴 physics). Sources: [KUT], [EVP], [TOOLE].
 * ψ = cos(nx·π·x/W) · cos(ny·π·y/L) · cos(nz·π·z/H). |ψ| = 1 at walls and corners, 0 at a node.
 * Used by G01 (midpoint null) and the bass model (P09); P03 emits no findings of its own.
 */
export function modeShape(
  n: readonly [number, number, number],
  p: Vec3,
  room: RoomGeometry,
): number {
  return (
    Math.cos((n[0] * Math.PI * p.x) / room.W) *
    Math.cos((n[1] * Math.PI * p.y) / room.L) *
    Math.cos((n[2] * Math.PI * p.z) / room.H)
  );
}
