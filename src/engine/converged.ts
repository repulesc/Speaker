import type { PlacementIdea, Project, SetupVariant } from './types';

/**
 * The converged state (docs/ROADMAP_V11.md): after "Apply" the setup stands where a suggestion put
 * it, and no new suggestion is computed from there (the search used to start again from the new
 * spot and offer ever smaller moves). It ends by itself the moment anything it depends on changes:
 * a speaker or the seat is moved, or the room or the speaker is edited.
 */

/** What a layout depends on besides where things stand: the room and the speaker. */
export function settingKey(project: Project): string {
  const { room, speaker } = project;
  const v = <T>(k: { value: T | null }) => k.value;
  return JSON.stringify([
    v(room.width),
    v(room.length),
    v(room.height),
    v(speaker.dimensions.w),
    v(speaker.dimensions.h),
    v(speaker.dimensions.d),
    v(speaker.enclosure),
    v(speaker.portLocation),
    v(speaker.lowFrequencyMinus6dB),
    v(speaker.acousticAxisHeight),
    project.speaker.minWallDistance?.value ?? null,
    project.constraints.listenerFixed,
    project.constraints.speakersFixed,
    project.constraints.speakerZone ?? null,
  ]);
}

/** The applied layout of a setup, to record when "Apply" is pressed. */
export function appliedOf(
  project: Project,
  variant: SetupVariant,
  idea: PlacementIdea,
): NonNullable<SetupVariant['applied']> {
  return {
    left: { ...variant.speakers.left.base },
    right: { ...variant.speakers.right.base },
    seat: { ...variant.listener.ears },
    idea,
    key: settingKey(project),
  };
}

const SAME = 0.01; // metres: a typed or dragged change of a centimetre ends the converged state

const near = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.abs(a.x - b.x) <= SAME && Math.abs(a.y - b.y) <= SAME;

/** True while the open setup stands exactly where the last applied suggestion put it. */
export function isConverged(project: Project): boolean {
  const variant = project.variants.find((v) => v.id === project.activeVariantId);
  const applied = variant?.applied;
  if (!variant || !applied) return false;
  return (
    applied.key === settingKey(project) &&
    near(applied.left, variant.speakers.left.base) &&
    near(applied.right, variant.speakers.right.base) &&
    near(applied.seat, variant.listener.ears)
  );
}
