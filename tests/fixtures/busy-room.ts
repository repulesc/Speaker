import type { Project } from '../../src/engine/types';
import { estimated, genericSpeaker, makeProject, measured } from './projects';

/**
 * Synthetic "busy room" modelled on the owner's description (TEST_PLAN §7). The dimensions and
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
    surfaces: { left: 'shelf-diffusive', floor: 'carpet-heavy' },
  });
  const variant = project.variants[0]!;
  variant.busyness = measured('very-busy');
  variant.objects = [
    {
      id: 'bed',
      kind: 'bed',
      position: { x: 2.0, y: 2.6, z: 0 },
      size: { x: 1.6, y: 1.8, z: 0.5 },
      hard: false,
    },
    {
      id: 'table',
      kind: 'table',
      position: { x: 0.4, y: 2.0, z: 0 },
      size: { x: 0.8, y: 0.6, z: 0.75 },
      hard: true,
    },
    {
      id: 'spk',
      kind: 'other-speaker',
      position: { x: 0.2, y: 0.05, z: 0 },
      size: { x: 0.25, y: 0.3, z: 0.9 },
      hard: true,
    },
    {
      id: 'radiator',
      kind: 'radiator',
      position: { x: 3.5, y: 3.6, z: 0.1 },
      size: { x: 0.1, y: 0.8, z: 0.6 },
      hard: true,
    },
  ];
  project.surfaces.patches = [
    { id: 'window', boundary: 'right', u: 3.5, v: 0.9, width: 0.9, height: 1.4, preset: 'glass' },
    {
      id: 'canvas1',
      boundary: 'front',
      u: 0.6,
      v: 1.0,
      width: 1.0,
      height: 1.0,
      preset: 'canvas-art',
    },
    {
      id: 'canvas2',
      boundary: 'front',
      u: 2.0,
      v: 1.0,
      width: 1.0,
      height: 1.0,
      preset: 'canvas-art',
    },
  ];
  project.goals.weights = { 'wide-stage': 2, 'precise-imaging': 2, 'flat-response': 2 };
  return project;
}
