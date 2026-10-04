import type { Messages } from './types';

/** Hungarian messages, informal register (tegezés). Native review pending (OPEN_QUESTIONS Q5). */
export const hu: Messages = {
  app: {
    title: 'Speaker Placement Advisor',
    tagline: 'Találd meg a hangfalak és a hallgatási pont jó helyét, a teremakusztika alapján.',
    status: 'Fejlesztés alatt: az akusztikai motor kész, a képernyők következnek.',
  },
  language: {
    label: 'Nyelv',
    en: 'English',
    hu: 'Magyar',
  },
  units: {
    error: {
      invalid: 'Ezt a hosszt nem értjük. Próbáld így: 3,5 m, 350 cm vagy 11′ 6″.',
      notPositive: 'A hossznak nullánál nagyobbnak kell lennie.',
      ambiguousFeetInches: 'Így gondoltad: {feet}′ {inches}″?',
    },
  },
};
