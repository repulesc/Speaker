/** Public API of the acoustics engine. The engine has no UI, i18n or storage dependencies. */
export { analyze, sortFindings } from './analyze';
export { confidenceStep } from './confidence';
export { hypotheses, type HypothesisResult } from './subjective';
export { findingMessageKeys, RULES } from './rules';
export { SPEAKER_TYPES, type SpeakerTypePreset } from './presets/speakerTypes';
export { SURFACE_PRESETS } from './presets/surfaces';
export { ENGINE_VERSION } from './version';
export type * from './types';
