import { H01_SEAT_FRACTION } from './rules/H01-38-percent';
import { H02_SEAT_FRACTION } from './rules/H02-thirds';
import type { FolkComparison, SeatLayers } from './types';

/**
 * Folk-rule comparison (docs/REVAMP_PLAN.md): the seat lines of the 38 % rule (H01) and the rule
 * of thirds (H02), read off the seat heatmap along the seat's column and compared with the best
 * seat in that column. The rules stay unscored; this only says how they fare in this room.
 * Verdict bands (🟡): within 0.03 of the best "as good", within 0.10 "close", else "worse".
 */
export function folkComparison(
  layers: SeatLayers,
  length: number,
  seatX: number,
): FolkComparison[] {
  const { x0, y0, step, nx, ny, values, redFlag } = layers;
  const column = Math.min(nx - 1, Math.max(0, Math.round((seatX - x0) / step)));
  const cell = (row: number) => row * nx + column;
  const rowY = (row: number) => y0 + row * step;

  let best = { y: NaN, score: -Infinity };
  for (let row = 0; row < ny; row++) {
    const score = values.goals[cell(row)]!;
    if (!Number.isNaN(score) && !redFlag[cell(row)] && score > best.score) {
      best = { y: rowY(row), score };
    }
  }

  const lines = [
    { ruleId: 'H01' as const, seatY: H01_SEAT_FRACTION * length },
    { ruleId: 'H02' as const, seatY: H02_SEAT_FRACTION * length },
  ];
  return lines.map(({ ruleId, seatY }) => {
    const row = Math.min(ny - 1, Math.max(0, Math.round((seatY - y0) / step)));
    const score = values.goals[cell(row)]!;
    const gap = best.score - score;
    const verdict = Number.isNaN(score)
      ? 'notAllowed'
      : gap <= 0.03
        ? 'asGood'
        : gap <= 0.1
          ? 'close'
          : 'worse';
    return {
      ruleId,
      seatY,
      score,
      bestY: best.y,
      bestScore: best.score,
      verdict,
      redFlag: redFlag[cell(row)]!,
    };
  });
}
