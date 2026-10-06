import type { Project } from '../../src/engine/types';
import { estimated, genericSpeaker, makeProject, measured } from './projects';

/**
 * Synthetic "busy room" modelled on the owner's description (TEST_PLAN §7): very busy, thick
 * carpet. (V9 removed the furniture and wall patches it used to place; "very busy" carries them.) The dimensions and
 * positions are plausible placeholders, not real measurements. The speaker values come from the
 * KEF LSX II LT data gathered in Phase 0 (unverified; test fixture only).
 */
export function busyRoom(): Project {
  const speaker = genericSpeaker({
    id: 'fixture-kef-lsx-ii-lt',
    brand: 'KEF',
    model: 'LSX II LT',
    dimensions: { w: estimated(0.155), h: estimated(0.24), d: estimated(0.18) },
    enclosure: estimated('ported'),
    portLocation: estimated('rear'),
    driverLayout: estimated('coaxial'),
    acousticAxisHeight: estimated(0.15),
    wooferCentreHeight: estimated(0.15),
    lowFrequencyMinus6dB: estimated(49),
    dsp: {
      treble: { minDb: -3, maxDb: 3, stepDb: 0.5 },
      bass: { minDb: -6, maxDb: 6, stepDb: 0.5 },
      placementModes: ['stand', 'desk'],
      wallDistanceSetting: true,
      roomCharacterSetting: true,
      subOut: true,
    },
  });
  const project = makeProject({
    W: 3.6,
    L: 4.4,
    H: 2.7,
    clearance: 0.35,
    halfSpacing: 0.9,
    listenerY: 3.0,
    standZ: 0.85,
    speaker,
    surfaces: { floor: 'carpet-heavy' },
  });
  const variant = project.variants[0]!;
  variant.busyness = measured('very-busy');
  project.goals.weights = { 'wide-stage': 2, 'precise-imaging': 2, 'flat-response': 2 };
  return project;
}
