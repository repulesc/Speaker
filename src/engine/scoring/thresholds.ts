/**
 * Calibration constants for the score components (docs/SCORING.md §2). These are 🟡 choices:
 * change them only together with SCORING.md and the golden tests.
 */
export const THRESHOLDS = {
  /** C1: σ of the smoothed bass curve (dB). ≤ best → 1, ≥ worst → 0. */
  bassSigmaBest: 2,
  bassSigmaWorst: 10,
  /** C2: deepest dip below the median (dB). ≤ best → 1, ≥ worst → 0. */
  dipBest: 6,
  dipWorst: 18,
  /** C3: front-wall null above the Schroeder frequency. */
  frontNullGoodHz: 300,
  frontNullBadHz: 250,
  frontNullBadScore: 0.3,
  /** C4: stereo angle. Within ±okSpan of the target scores ≥ okScore; 0 at the red-flag limits. */
  angleOkSpan: 10,
  angleOkScore: 0.8,
  angleMin: 35,
  angleMax: 90,
  /** C4/G05: path-length difference (m). */
  distanceDiffOk: 0.02,
  distanceDiffBad: 0.1,
  /** C5: side-distance difference (m) and score when surface classes differ. */
  sideDiffOk: 0.1,
  sideDiffBad: 0.3,
  surfaceMismatchScore: 0.6,
  /** C6: listener distance to the back wall (m). */
  backWallBad: 0.3,
  backWallGood: 1.0,
  /** C7: corner and port scores. */
  nearCornerScore: 0.5,
  cornerScore: 0,
  portTooCloseScore: 0.4,
  /** C8: score for a reflection the goal would rather not have. */
  reflectionMismatchScore: 0.5,
  absorbedForWidthScore: 0.7,
  /** Search constraints. Closer than this is not a listening seat at all (desk near-field). */
  minListeningDistance: 0.6,
  /**
   * Preferred minimum distance from each speaker for ordinary room listening (🟡 heuristic, owner
   * feedback after R5: spots 1–1.2 m away read as a desk setup). ITU-R BS.1116 puts reference
   * listeners about 2–4 m away; 1.5 m is a lower bound that small rooms can still meet.
   */
  roomListeningDistance: 1.5,
  /** The seat map scores every cell at least this far from a speaker. */
  minScoredDistance: 0.3,
  /** Listener at least this far in front of the speaker baffles (m). */
  minListenerAhead: 0.5,
  candidateSeparation: 0.2,
  goodZoneMargin: 0.05,
  /**
   * The speaker zone's cost is mentioned when the best without it scores at least this much more
   * (score points, 0..1). Same size as the listen-log tie (SCORE_TIE): smaller is noise.
   */
  zoneCostWorthMentioning: 0.05,
} as const;

export const DEFAULT_WEIGHTS = {
  C1: 0.35,
  C2: 0.1,
  C3: 0.1,
  C4: 0.15,
  C5: 0.1,
  C6: 0.1,
  C7: 0.1,
  C8: 0,
} as const;
