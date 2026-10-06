import { acousticCentre, type AnalysisContext } from '../context';
import { distance } from '../math/geometry';
import { surfaceClass } from '../presets/surfaces';
import type { BoundaryId, SurfaceClass, SurfacePresetId, Vec3 } from '../types';
import { ASSUMPTION, makeFinding, type RuleDef } from './rule';

/**
 * P06 · First-reflection points by the mirror-image method (🔴 physics).
 * Sources: [KUT], [EVP], [TOOLE]. Specular reflection only; scattering surfaces are flagged.
 */

export interface Reflection {
  speaker: 'left' | 'right';
  boundary: BoundaryId;
  point: Vec3;
  delayMs: number;
  /** Geometric level relative to the direct sound (inverse square only). */
  levelDb: number;
  surface: SurfacePresetId;
  surfaceClass: SurfaceClass;
}

type Plane = { axis: 'x' | 'y' | 'z'; at: number };

function boundaryPlane(boundary: BoundaryId, ctx: AnalysisContext): Plane {
  const { W, L, H } = ctx.room;
  switch (boundary) {
    case 'left':
      return { axis: 'x', at: 0 };
    case 'right':
      return { axis: 'x', at: W };
    case 'front':
      return { axis: 'y', at: 0 };
    case 'back':
      return { axis: 'y', at: L };
    case 'floor':
      return { axis: 'z', at: 0 };
    case 'ceiling':
      return { axis: 'z', at: H };
  }
}

/** Mirror `source` in the plane and intersect the image→receiver line with the plane. */
export function reflectionPoint(source: Vec3, receiver: Vec3, plane: Plane): Vec3 {
  const image = { ...source, [plane.axis]: 2 * plane.at - source[plane.axis] };
  const t = (plane.at - image[plane.axis]) / (receiver[plane.axis] - image[plane.axis]);
  return {
    x: image.x + t * (receiver.x - image.x),
    y: image.y + t * (receiver.y - image.y),
    z: image.z + t * (receiver.z - image.z),
  };
}

/** The material of a boundary (V9: one material per wall, floor and ceiling). */
export function surfaceAt(boundary: BoundaryId, ctx: AnalysisContext) {
  const preset = ctx.project.surfaces.base[boundary];
  return { preset, class: surfaceClass(preset) };
}

const BOUNDARIES: readonly BoundaryId[] = ['left', 'right', 'front', 'back', 'floor', 'ceiling'];

export function firstReflections(
  ctx: AnalysisContext,
  speakers: { left: { base: Vec3; toeInDeg: number }; right: { base: Vec3; toeInDeg: number } },
  ears: Vec3,
): Reflection[] {
  const result: Reflection[] = [];
  for (const side of ['left', 'right'] as const) {
    const source = acousticCentre(speakers[side], ctx.speaker);
    const direct = distance(source, ears);
    for (const boundary of BOUNDARIES) {
      const plane = boundaryPlane(boundary, ctx);
      const point = reflectionPoint(source, ears, plane);
      const reflected = distance(source, point) + distance(point, ears);
      const surface = surfaceAt(boundary, ctx);
      result.push({
        speaker: side,
        boundary,
        point,
        delayMs: ((reflected - direct) / ctx.c) * 1000,
        levelDb: 20 * Math.log10(direct / reflected),
        surface: surface.preset,
        surfaceClass: surface.class,
      });
    }
  }
  return result;
}

/** True for the side-wall reflection nearest to its speaker (left → left wall, right → right). */
export function isNearSide(r: Reflection): boolean {
  return r.speaker === r.boundary;
}

export const P06: RuleDef = {
  id: 'P06',
  level: 'physics',
  concern: 'reflections',
  scope: 'placement',
  sources: ['KUT', 'EVP', 'TOOLE'],
  variants: ['sideWall', 'floor', 'ceiling', 'scattering'],
  evaluate(ctx, placement) {
    const reflections = firstReflections(ctx, placement.speakers, placement.listener);
    return reflections
      .filter((r) => isNearSide(r) || r.boundary === 'floor' || r.boundary === 'ceiling')
      .map((r) => {
        const variant =
          r.surfaceClass === 'diffusive'
            ? 'scattering'
            : r.boundary === 'floor' || r.boundary === 'ceiling'
              ? r.boundary
              : 'sideWall';
        return makeFinding(
          P06,
          variant,
          'info',
          {
            speaker: r.speaker,
            boundary: r.boundary,
            delayMs: r.delayMs,
            levelDb: r.levelDb,
            surface: r.surface,
            surfaceClass: r.surfaceClass,
          },
          { assumptions: [ASSUMPTION.specular], location: r.point },
        );
      });
  },
};
