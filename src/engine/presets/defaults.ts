/**
 * Values used when an input is unknown. Each default lowers confidence (docs/SCORING.md §6).
 */
export const DEFAULTS = {
  /** P01: engine default when temperature is unknown. */
  speedOfSound: 343.0,
  /** P08: typical domestic listening room, with range. */
  t60Mid: 0.4,
  t60Range: [0.3, 0.6] as [number, number],
  /** Speaker cabinet when unknown: a small two-way bookshelf speaker. */
  speakerWidth: 0.2,
  speakerHeight: 0.3,
  speakerDepth: 0.25,
  acousticAxisHeight: 0.2,
  wooferCentreHeight: 0.1,
  lowFrequencyMinus6dB: 50,
  omniBelowHz: 300,
  qMid: 2,
  earHeight: 1.1,
  /** How far speakers may come into the room when the user does not say. */
  maxSpeakerDistanceFromWall: 1.5,
  /** G07 default minimum rear-panel clearance for rear-ported speakers. */
  rearPortMinClearance: 0.2,
} as const;
