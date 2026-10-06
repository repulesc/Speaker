import { baseHeight, placedOnOf, type SpeakerChoices } from '../../engine/presets/speakerKinds';
import type { Project } from '../../engine/types';
import { speakerFromChoices } from './defaults';

/**
 * Answers one speaker question (undefined = "Not sure") and fills the speaker with the typical
 * values for all answers so far (docs/ROADMAP_V7.md, Phase 2). Brand, model, identity, controls
 * and the maker's wall distance stay; every filled value is an estimate. Where the speakers stand
 * (floor, stand, desk) sets the base height of both speakers in every setup; their position on the
 * floor is not touched.
 */
export function setSpeakerChoice<K extends keyof SpeakerChoices>(
  project: Project,
  key: K,
  value: SpeakerChoices[K] | undefined,
): void {
  const old = project.speaker;
  const choices: SpeakerChoices = { ...old.choices };
  if (value === undefined) delete choices[key];
  else choices[key] = value;
  const { id, brand, model, dsp, minWallDistance, designedForCorner, manufacturerNotes } = old;
  project.speaker = {
    ...speakerFromChoices(choices),
    id,
    brand,
    model,
    dsp,
    ...(minWallDistance ? { minWallDistance } : {}),
    ...(designedForCorner ? { designedForCorner } : {}),
    manufacturerNotes,
  };
  if (Object.keys(choices).length === 0) delete project.speaker.choices;
  // The base height follows the place (and the tweeter height) once the kind or place is known.
  if (choices.kind || choices.placedOn) {
    const z = baseHeight(placedOnOf(choices), project.speaker.acousticAxisHeight.value!);
    for (const v of project.variants) {
      v.speakers.left.base.z = z;
      v.speakers.right.base.z = z;
    }
  }
}
