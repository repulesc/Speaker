import type { SeatLayers } from '../../engine/types';

/** Heat ramp, poorer → better: viridis (lightness-ordered, colour-blind safe). Same as the tokens. */
const STOPS = ['#440154', '#31688e', '#21908c', '#5dc863', '#fde725'].map((hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]);

/** Scores below this are rare; the ramp starts here so real differences show (brighter = better). */
const RAMP_FLOOR = 0.3;

/** Colour for a score from 0 (poor) to 1 (very good). */
export function heatColor(score: number): [number, number, number] {
  const t = (score - RAMP_FLOOR) / (1 - RAMP_FLOOR);
  const x = Math.min(1, Math.max(0, t)) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(x));
  const f = x - i;
  const a = STOPS[i]!;
  const b = STOPS[i + 1]!;
  return [a[0]! + (b[0]! - a[0]!) * f, a[1]! + (b[1]! - a[1]!) * f, a[2]! + (b[2]! - a[2]!) * f];
}

/**
 * Draws one layer as a smooth image: one pixel per cell, scaled up by the browser, so the map
 * shows soft zones instead of blocks. Cells the seat cannot occupy stay transparent; cells the
 * app red-flags itself are drawn dimmed with a hatch on top, so "bright" never means "advisable"
 * where the guidelines say no (docs/REVIEW_FINDINGS.md, M6).
 */
export function paintHeat(
  canvas: HTMLCanvasElement,
  layers: SeatLayers,
  values: readonly number[],
): void {
  const { nx, ny } = layers;
  canvas.width = nx;
  canvas.height = ny;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const image = ctx.createImageData(nx, ny);
  for (let i = 0; i < nx * ny; i++) {
    const v = values[i]!;
    if (Number.isNaN(v)) continue;
    const [r, g, b] = heatColor(v);
    const dim = layers.redFlag[i] ? 0.55 : 1;
    image.data.set([r * dim, g * dim, b * dim, 255], i * 4);
  }
  ctx.putImageData(image, 0, 0);
}
