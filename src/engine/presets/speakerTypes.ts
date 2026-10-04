import type { DriverLayout, EnclosureType, PortLocation } from '../types';

/**
 * Generic speaker types used to prefill the speaker form. All values are typical
 * estimates, never model data; the form marks every prefilled field as 'estimated'.
 */
export interface SpeakerTypePreset {
  id: string;
  w: number;
  h: number;
  d: number;
  enclosure: EnclosureType;
  portLocation: PortLocation;
  driverLayout: DriverLayout;
  acousticAxisHeight: number;
  wooferCentreHeight: number;
  lowFrequencyMinus6dB: number;
  omniBelowHz: number;
  qMid: number;
}

export const SPEAKER_TYPES: readonly SpeakerTypePreset[] = [
  {
    id: 'small-bookshelf-rear-port',
    w: 0.17,
    h: 0.28,
    d: 0.22,
    enclosure: 'ported',
    portLocation: 'rear',
    driverLayout: 'two-way',
    acousticAxisHeight: 0.21,
    wooferCentreHeight: 0.11,
    lowFrequencyMinus6dB: 50,
    omniBelowHz: 300,
    qMid: 2,
  },
  {
    id: 'coaxial-active-monitor',
    w: 0.16,
    h: 0.24,
    d: 0.18,
    enclosure: 'ported',
    portLocation: 'rear',
    driverLayout: 'coaxial',
    acousticAxisHeight: 0.15,
    wooferCentreHeight: 0.15,
    lowFrequencyMinus6dB: 50,
    omniBelowHz: 300,
    qMid: 2,
  },
  {
    id: 'sealed-bookshelf',
    w: 0.2,
    h: 0.32,
    d: 0.25,
    enclosure: 'sealed',
    portLocation: 'none',
    driverLayout: 'two-way',
    acousticAxisHeight: 0.24,
    wooferCentreHeight: 0.12,
    lowFrequencyMinus6dB: 55,
    omniBelowHz: 300,
    qMid: 2,
  },
  {
    id: 'floorstander-front-port',
    w: 0.2,
    h: 1.0,
    d: 0.3,
    enclosure: 'ported',
    portLocation: 'front',
    driverLayout: 'three-way',
    acousticAxisHeight: 0.9,
    wooferCentreHeight: 0.4,
    lowFrequencyMinus6dB: 35,
    omniBelowHz: 250,
    qMid: 3,
  },
  {
    id: 'floorstander-rear-port',
    w: 0.2,
    h: 1.0,
    d: 0.3,
    enclosure: 'ported',
    portLocation: 'rear',
    driverLayout: 'three-way',
    acousticAxisHeight: 0.9,
    wooferCentreHeight: 0.4,
    lowFrequencyMinus6dB: 35,
    omniBelowHz: 250,
    qMid: 3,
  },
];
