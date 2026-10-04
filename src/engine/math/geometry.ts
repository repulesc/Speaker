import type { Vec3 } from '../types';

export const toRad = (deg: number): number => (deg * Math.PI) / 180;
export const toDeg = (rad: number): number => (rad * 180) / Math.PI;

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear map of `value` from [x0, x1] to [y0, y1], clamped to the output range. */
export function ramp(value: number, x0: number, x1: number, y0: number, y1: number): number {
  const t = clamp((value - x0) / (x1 - x0), 0, 1);
  return y0 + t * (y1 - y0);
}

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function mean(values: readonly number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function stdDev(values: readonly number[]): number {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

export interface Box {
  min: Vec3;
  max: Vec3;
}

/** True when the segment a→b passes through the box (slab method). Touching counts. */
export function segmentIntersectsBox(a: Vec3, b: Vec3, box: Box): boolean {
  let t0 = 0;
  let t1 = 1;
  for (const axis of ['x', 'y', 'z'] as const) {
    const d = b[axis] - a[axis];
    if (Math.abs(d) < 1e-12) {
      if (a[axis] < box.min[axis] || a[axis] > box.max[axis]) return false;
      continue;
    }
    let tNear = (box.min[axis] - a[axis]) / d;
    let tFar = (box.max[axis] - a[axis]) / d;
    if (tNear > tFar) [tNear, tFar] = [tFar, tNear];
    t0 = Math.max(t0, tNear);
    t1 = Math.min(t1, tFar);
    if (t0 > t1) return false;
  }
  return true;
}

export function pointInBox2D(p: { x: number; y: number }, box: Box, margin = 0): boolean {
  return (
    p.x >= box.min.x - margin &&
    p.x <= box.max.x + margin &&
    p.y >= box.min.y - margin &&
    p.y <= box.max.y + margin
  );
}

export function boxesOverlap2D(a: Box, b: Box): boolean {
  return a.min.x < b.max.x && a.max.x > b.min.x && a.min.y < b.max.y && a.max.y > b.min.y;
}

/** Distance in the floor plan from a point to a box (0 when inside). */
export function distanceToBox2D(p: { x: number; y: number }, box: Box): number {
  const dx = Math.max(box.min.x - p.x, 0, p.x - box.max.x);
  const dy = Math.max(box.min.y - p.y, 0, p.y - box.max.y);
  return Math.hypot(dx, dy);
}
