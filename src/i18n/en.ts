/** English messages: the source of truth for message keys (docs/I18N_AND_UNITS.md §2). */
export const en = {
  app: {
    title: 'Speaker Placement Advisor',
    tagline: 'Find good positions for your speakers and your seat, based on room acoustics.',
    status: 'Under construction: the acoustics engine is ready, the screens come next.',
  },
  language: {
    label: 'Language',
    en: 'English',
    hu: 'Magyar',
  },
  units: {
    error: {
      invalid: 'Not a length we understand. Try 3.5 m, 350 cm or 11′ 6″.',
      notPositive: 'The length must be greater than zero.',
      ambiguousFeetInches: 'Did you mean {feet}′ {inches}″?',
    },
  },
} as const;
