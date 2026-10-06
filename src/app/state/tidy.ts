import { DEFAULTS } from '../../engine/presets/defaults';
import { speakerValues, type SpeakerChoices } from '../../engine/presets/speakerKinds';
import type { BoundaryId, OutOfModelFeature, Project } from '../../engine/types';
import { DEFAULT_BASE, MATERIALS, type Part } from './surfaces';

const PART_OF: Record<BoundaryId, Part> = {
  front: 'walls',
  back: 'walls',
  left: 'walls',
  right: 'walls',
  floor: 'floor',
  ceiling: 'ceiling',
};

/** The old room-shape answers, folded into the two V9 asks. */
const SHAPE: Record<OutOfModelFeature, OutOfModelFeature> = {
  'open-doorway': 'open-plan-connection',
  'open-plan-connection': 'open-plan-connection',
  alcove: 'open-plan-connection',
  'slanted-ceiling': 'non-rectangular',
  'non-rectangular': 'non-rectangular',
};

/**
 * Brings a project from an older version in line with what V9 asks (docs/ROADMAP_V9.md §1), so
 * no answer the user can no longer see keeps changing the result: furniture, wall patches, notes,
 * other setups, a temperature, the seat range and the reach limit go; a material the user can no
 * longer pick goes back to the default. Runs on every project read (storage, link or file).
 * Mutates and returns the project.
 */
export function tidy(project: Project): Project {
  const legacy = project as unknown as Record<string, unknown>;
  delete legacy.notes;

  const active =
    project.variants.find((v) => v.id === project.activeVariantId) ?? project.variants[0]!;
  project.variants = [active];
  project.activeVariantId = active.id;
  const variant = active as unknown as Record<string, unknown>;
  delete variant.objects;
  delete variant.previous;

  const room = project.room as unknown as Record<string, unknown>;
  delete room.construction;
  project.room.temperatureC = { value: null, certainty: 'unknown' };
  project.room.outOfModel = [...new Set(project.room.outOfModel.map((f) => SHAPE[f]))];

  const surfaces = project.surfaces as unknown as Record<string, unknown>;
  delete surfaces.patches;
  for (const b of Object.keys(project.surfaces.base) as BoundaryId[]) {
    const allowed = MATERIALS[PART_OF[b]] as readonly string[];
    if (!allowed.includes(project.surfaces.base[b])) {
      project.surfaces.base[b] = DEFAULT_BASE[b];
      project.surfaces.baseCertainty[b] = 'unknown';
    }
  }

  const c = project.constraints;
  delete c.listenerYRange;
  c.maxSpeakerDistanceFromWall = {
    value: DEFAULTS.maxSpeakerDistanceFromWall,
    certainty: 'estimated',
  };

  const choices = project.speaker.choices as Record<string, unknown> | undefined;
  if (choices && ('spread' in choices || 'madeFor' in choices)) {
    delete choices.madeFor;
    if ('spread' in choices) {
      delete choices.spread;
      const typical = speakerValues(choices as SpeakerChoices).qMid;
      project.speaker.directivity.qMid = { value: typical, certainty: 'estimated' };
    }
  }

  const listening = project.listening as unknown as Record<string, unknown> | undefined;
  if (listening) {
    delete listening.note;
    delete listening.overall;
    delete listening.setupKey;
  }
  return project;
}
