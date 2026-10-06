import { roomCharacter } from '../../engine/rules/P08-reverberation';
import type { AnalysisOk } from '../../engine/types';
import { i18n } from '../../i18n/locale.svelte';
import { formatFrequency } from '../../units/format';

/**
 * The "what we found" line (owner decision, docs/ROADMAP_V7.md): the room's character in everyday
 * words, computed from the room, never a verdict. Liveliness comes from the reverberation estimate
 * (P08, the same bands as the room-character advice); the lowest resonance (P02) is given in hertz
 * (V9: note names read as a gimmick, docs/ROADMAP_V9.md).
 */
export function roomFound(ok: AnalysisOk, numbers: boolean): string {
  const character = roomCharacter(ok.t60.mid);
  const lines = [i18n.t(`found.${character}`)];
  const lowest = ok.modes.reduce<number | null>(
    (m, mode) => (m === null || mode.f < m ? mode.f : m),
    null,
  );
  if (lowest !== null) {
    lines.push(i18n.t('found.lowest', { f: formatFrequency(lowest, i18n.locale, true) }));
  }
  if (numbers) {
    const seconds = new Intl.NumberFormat(i18n.locale, { maximumFractionDigits: 1 }).format(
      ok.t60.mid,
    );
    lines.push(i18n.t('found.numbers', { t60: seconds }));
  }
  return lines.join(' ');
}
