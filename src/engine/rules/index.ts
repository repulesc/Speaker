import { G01 } from './G01-room-midpoint';
import { G02 } from './G02-back-wall';
import { G03 } from './G03-symmetry';
import { G04 } from './G04-stereo-angle';
import { G05 } from './G05-equal-distance';
import { G06 } from './G06-corners';
import { G07 } from './G07-port-clearance';
import { G08 } from './G08-ear-height';
import { G09 } from './G09-first-reflections';
import { G10 } from './G10-objects';
import { G11 } from './G11-in-front';
import { H01 } from './H01-38-percent';
import { H02 } from './H02-thirds';
import { H04 } from './H04-near-or-far';
import { H05 } from './H05-toe-in';
import { H06 } from './H06-treble-trim';
import { P02 } from './P02-room-modes';
import { P04 } from './P04-boundary-interference';
import { P05 } from './P05-boundary-gain';
import { P06 } from './P06-reflections';
import { P07 } from './P07-schroeder';
import { P08 } from './P08-reverberation';
import { P09 } from './P09-bass-response';
import { P10 } from './P10-critical-distance';
import { P11 } from './P11-room-proportions';
import type { RuleDef } from './rule';

/**
 * Every rule that produces findings. P01 and P03 are pure helpers used by others.
 * H03 (Cardas) is not implemented: its numbers are unverified (docs/OPEN_QUESTIONS.md).
 */
export const RULES: readonly RuleDef[] = [
  P02,
  P04,
  P05,
  P06,
  P07,
  P08,
  P09,
  P10,
  P11,
  G01,
  G02,
  G03,
  G04,
  G05,
  G06,
  G07,
  G08,
  G09,
  G10,
  G11,
  H01,
  H02,
  H04,
  H05,
  H06,
];

/** Every i18n key the engine can emit for findings. Used for translation completeness checks. */
export function findingMessageKeys(): string[] {
  return RULES.flatMap((r) => r.variants.map((v) => `finding.${r.id}.${v}`));
}
