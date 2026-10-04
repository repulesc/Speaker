import { buildContext, currentPlacement } from './context';
import { seatLayers } from './scoring/heatmaps';
import { makeScorer } from './scoring/search';
import type { Placement, Project, SeatLayers } from './types';

/**
 * The seat layers for any speaker setup (default: where they are now), for previewing a candidate
 * on the map. Null until the room size is known.
 */
export function seatLayersFor(
  project: Project,
  speakers?: Placement['speakers'],
): SeatLayers | null {
  const ctx = buildContext(project);
  if (!ctx) return null;
  const current = currentPlacement(ctx);
  return seatLayers(makeScorer(ctx), speakers ?? current.speakers, current.listener.z);
}
