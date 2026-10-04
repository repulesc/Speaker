import type { Grid, SeatLayers } from '../../engine/types';

/** Heat ramp, poorer → better: viridis (lightness-ordered, colour-blind safe). Same as the tokens. */
const STOPS = ['#440154', '#31688e', '#21908c', '#5dc863', '#fde725'].map((hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]);

/** Scores below this are rare; the ramp starts here so real differences show (brighter = better). */
const RAMP_FLOOR = 0.3;
/**
 * Where on the viridis ramp "poor" starts (0 = the darkest purple). Lifted so that poor seats read
 * as a calm blue-violet rather than near-black in dark mode (docs/DESIGN_BRIEF_V3.md, item 3).
 */
const RAMP_START = 0.12;

/** Colour for a score from 0 (poor) to 1 (very good). */
export function heatColor(score: number): [number, number, number] {
  const t = Math.min(1, Math.max(0, (score - RAMP_FLOOR) / (1 - RAMP_FLOOR)));
  const x = (RAMP_START + (1 - RAMP_START) * t) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(x));
  const f = x - i;
  const a = STOPS[i]!;
  const b = STOPS[i + 1]!;
  return [a[0]! + (b[0]! - a[0]!) * f, a[1]! + (b[1]! - a[1]!) * f, a[2]! + (b[2]! - a[2]!) * f];
}

// ── Smooth rendering ─────────────────────────────────────────────────────────

/** Catmull-Rom weights for the four neighbours of a sample at fraction t (0..1). */
function cubicWeights(t: number): [number, number, number, number] {
  const t2 = t * t;
  const t3 = t2 * t;
  return [
    0.5 * (-t3 + 2 * t2 - t),
    0.5 * (3 * t3 - 5 * t2 + 2),
    0.5 * (-3 * t3 + 4 * t2 + t),
    0.5 * (t3 - t2),
  ];
}

export interface SmoothField {
  width: number;
  height: number;
  /** Interpolated value per output pixel (NaN outside the data). */
  value: Float32Array;
  /** 0..1: how much of the pixel lies inside the data (soft edges instead of hard cuts). */
  alpha: Float32Array;
  /** 0..1: how much of the pixel lies in a marked area (e.g. "advised against"). */
  marked: Float32Array;
}

/**
 * Upsamples a cell grid by `scale` with bicubic (Catmull-Rom) interpolation, so the map shows
 * smooth zones instead of blocks. Cells without data (NaN) are left out of the interpolation, and
 * the edge of the data fades over about one cell. Same data as before: only the drawing changes
 * (docs/DESIGN_BRIEF_V3.md, item 3).
 */
export function smoothField(
  nx: number,
  ny: number,
  values: readonly number[],
  scale: number,
  mark?: readonly boolean[],
): SmoothField {
  const width = nx * scale;
  const height = ny * scale;
  const value = new Float32Array(width * height);
  const alpha = new Float32Array(width * height);
  const marked = new Float32Array(width * height);
  const at = (i: number, j: number) => {
    const ci = Math.min(nx - 1, Math.max(0, i));
    const cj = Math.min(ny - 1, Math.max(0, j));
    return values[cj * nx + ci]!;
  };
  const markAt = (i: number, j: number) => {
    const ci = Math.min(nx - 1, Math.max(0, i));
    const cj = Math.min(ny - 1, Math.max(0, j));
    return mark?.[cj * nx + ci] ? 1 : 0;
  };
  for (let py = 0; py < height; py++) {
    const gy = (py + 0.5) / scale - 0.5;
    const j0 = Math.floor(gy);
    const ty = gy - j0;
    const wy = cubicWeights(ty);
    for (let px = 0; px < width; px++) {
      const gx = (px + 0.5) / scale - 0.5;
      const i0 = Math.floor(gx);
      const tx = gx - i0;
      const wx = cubicWeights(tx);
      // Bicubic over the valid neighbours, weights renormalised.
      let sum = 0;
      let weight = 0;
      for (let b = 0; b < 4; b++) {
        for (let a = 0; a < 4; a++) {
          const v = at(i0 - 1 + a, j0 - 1 + b);
          if (Number.isNaN(v)) continue;
          const w = wx[a]! * wy[b]!;
          sum += v * w;
          weight += w;
        }
      }
      // Bilinear coverage of valid cells and of marked cells: soft edges.
      let cover = 0;
      let mk = 0;
      for (let b = 0; b < 2; b++) {
        for (let a = 0; a < 2; a++) {
          const w = (a ? tx : 1 - tx) * (b ? ty : 1 - ty);
          if (!Number.isNaN(at(i0 + a, j0 + b))) cover += w;
          mk += w * markAt(i0 + a, j0 + b);
        }
      }
      const k = py * width + px;
      if (weight > 0.25) {
        value[k] = sum / weight;
      } else {
        // Too few valid neighbours for a cubic: take the nearest valid cell, if any.
        const near = at(Math.round(gx), Math.round(gy));
        value[k] = near;
      }
      alpha[k] = Number.isNaN(value[k]!) ? 0 : smoothstep(0.25, 0.75, cover);
      marked[k] = mk;
    }
  }
  return { width, height, value, alpha, marked };
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Score levels where a faint contour line is drawn (the ramp's visible steps). */
const CONTOURS = [0.55, 0.7, 0.85];
/** Brightness of an area the app advises against: dimmed, not hidden (owner feedback after R5). */
const DIMMED = 0.5;

/** Output pixels per grid cell: about one canvas pixel per screen pixel, within limits. */
export function renderScale(cellCssPx: number): number {
  const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
  return Math.max(2, Math.min(16, Math.round(cellCssPx * dpr)));
}

/** Paints a smooth field with a colour function, contours and the marked (dimmed) areas. */
function paint(
  canvas: HTMLCanvasElement,
  field: SmoothField,
  colour: (v: number) => [number, number, number],
  contours: readonly number[],
): void {
  const { width, height, value, alpha, marked } = field;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const image = ctx.createImageData(width, height);
  const level = (v: number) => {
    let n = 0;
    for (const c of contours) if (v >= c) n++;
    return n;
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const k = y * width + x;
      const a = alpha[k]!;
      if (a <= 0) continue;
      const v = value[k]!;
      let [r, g, b] = colour(v);
      const dim = 1 - (1 - DIMMED) * marked[k]!;
      r *= dim;
      g *= dim;
      b *= dim;
      // A contour where the level changes towards the right or below: a soft light line.
      const right = x + 1 < width ? value[k + 1]! : v;
      const below = y + 1 < height ? value[k + width]! : v;
      if (
        contours.length &&
        ((!Number.isNaN(right) && level(right) !== level(v)) ||
          (!Number.isNaN(below) && level(below) !== level(v)))
      ) {
        r += (255 - r) * 0.35;
        g += (255 - g) * 0.35;
        b += (255 - b) * 0.35;
      }
      image.data.set([r, g, b, Math.round(a * 255)], k * 4);
    }
  }
  ctx.putImageData(image, 0, 0);
}

/** One seat layer, smooth, with contours; areas the app advises against are dimmed. */
export function paintHeat(
  canvas: HTMLCanvasElement,
  layers: SeatLayers,
  values: readonly number[],
  scale = 8,
): void {
  const field = smoothField(layers.nx, layers.ny, values, scale, layers.redFlag);
  paint(canvas, field, heatColor, CONTOURS);
}

/** Pressure pattern of one bass note: loud is bright, −40 dB or quieter is the darkest. */
export function paintField(canvas: HTMLCanvasElement, grid: Grid, scale = 8): void {
  const field = smoothField(grid.nx, grid.ny, grid.values, scale);
  // Map −40…0 dB onto the same ramp as the scores, so "brighter" always reads the same way.
  paint(canvas, field, (db) => heatColor(RAMP_FLOOR + (1 - RAMP_FLOOR) * ((db + 40) / 40)), []);
}

/**
 * Where the speakers would score best, with the seat staying where it is. The grid covers the left
 * half (the left speaker's position); the right speaker mirrors it about the seat, so the field is
 * mirrored to twice the width before drawing.
 */
export function paintSpeakerMap(canvas: HTMLCanvasElement, grid: Grid, scale = 8): void {
  const { nx, ny, values } = grid;
  const mirrored: number[] = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) mirrored.push(values[j * nx + i]!);
    for (let i = nx - 1; i >= 0; i--) mirrored.push(values[j * nx + i]!);
  }
  paint(canvas, smoothField(nx * 2, ny, mirrored, scale), heatColor, CONTOURS);
}
