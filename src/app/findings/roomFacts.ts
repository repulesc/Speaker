import { roomCharacter } from '../../engine/rules/P08-reverberation';
import type { AnalysisOk } from '../../engine/types';
import { i18n } from '../../i18n/locale.svelte';
import { formatFrequency } from '../../units/format';

/**
 * The "what we found" line (owner decision, docs/ROADMAP_V7.md): the room's character in everyday
 * words, computed from the room, never a verdict. Liveliness comes from the reverberation estimate
 * (P08, the same bands as the room-character advice); the deepest resonance (P02) is named as a
 * musical note, which an enthusiast can hum.
 */

/** The nearest equal-tempered note (A4 = 440 Hz): its index in the octave (C = 0) and octave. */
export function nearestNote(f: number): { index: number; octave: number } {
  const midi = Math.round(69 + 12 * Math.log2(f / 440));
  return { index: ((midi % 12) + 12) % 12, octave: Math.floor(midi / 12) - 1 };
}

export function roomFound(ok: AnalysisOk, numbers: boolean): string {
  const character = roomCharacter(ok.t60.mid);
  const lines = [i18n.t(`found.${character}`)];
  const lowest = ok.modes.reduce<number | null>(
    (m, mode) => (m === null || mode.f < m ? mode.f : m),
    null,
  );
  if (lowest !== null) {
    const { index, octave } = nearestNote(lowest);
    const letter = i18n.t('found.letters').split(',')[index]!;
    const pitch = i18n.t(octave <= 1 ? 'found.veryLow' : 'found.low');
    lines.push(i18n.t('found.note', { pitch, letter }));
    if (numbers) {
      const seconds = new Intl.NumberFormat(i18n.locale, { maximumFractionDigits: 1 }).format(
        ok.t60.mid,
      );
      lines.push(
        i18n.t('found.numbers', {
          t60: seconds,
          note: `${letter}${octave}`,
          f: formatFrequency(lowest, i18n.locale, true),
        }),
      );
    }
  }
  return lines.join(' ');
}
