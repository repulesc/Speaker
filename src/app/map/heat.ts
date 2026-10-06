import type { Grid, SeatLayers } from '../../engine/types';

export type Theme = 'light' | 'dark';

/**
 * Heat ramps, poorer → better: a warm, calm scale from soft sand to deep green (owner decision,
 * docs/ROADMAP_V7.md). Lightness changes steadily along the ramp (CIE L* 91 → 43 in light mode,
 * 23 → 89 in dark), so the order reads without colour vision too. Poor spots sit close to the
 * room's background and the best stand out: in light mode the best is the deepest colour, in dark
 * mode the brightest. The same stops are the `--heat-0…4` tokens in tokens.css (tested).
 */
export const RAMPS: Record<Theme, readonly string[]> = {
  light: ['#f0e4c6', '#dcdcb0', '#a9c89a', '#64a37f', '#22735a'],
  dark: ['#3b352a', '#4c5841', '#5f8763', '#82bb8a', '#bdeabf'],
};
const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];
const STOPS: Record<Theme, [number, number, number][]> = {
  light: RAMPS.light.map(rgb),
  dark: RAMPS.dark.map(rgb),
};

/**
 * "Not a spot" (no stereo pair or no seat fits there): the room's own floor tone with a fine
 * hatch, off the good-to-poor scale (docs/ROADMAP_V7.md). Tokens `--heat-none`, `--heat-none-line`.
 */
export const NOT_A_SPOT: Record<Theme, { fill: string; line: string }> = {
  light: { fill: '#f6f3ec', line: '#d8d1c3' },
  dark: { fill: '#1d211e', line: '#343b36' },
};

/** Scores below this are rare; the absolute scale starts here (stronger = better). */
const RAMP_FLOOR = 0.3;

/** Colour at a position on the ramp, 0 (poorest shown) to 1 (best shown). */
export function rampColor(t: number, theme: Theme = 'light'): [number, number, number] {
  const stops = STOPS[theme];
  const x = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const a = stops[i]!;
  const b = stops[i + 1]!;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/** Colour for a score from 0 (poor) to 1 (very good), on the absolute scale. */
export function heatColor(score: number, theme: Theme = 'light'): [number, number, number] {
  return rampColor((score - RAMP_FLOOR) / (1 - RAMP_FLOOR), theme);
}

// ── Colour range ─────────────────────────────────────────────────────────────

/**
 * The smallest score spread the colours are stretched over. A room where every seat is within a
 * few points of the others must not look dramatic: tiny differences stay soft colours.
 */
export const MIN_SPAN = 0.2;

export interface ColourRange {
  lo: number;
  hi: number;
}

/** The absolute scale: the same colour means the same score in every room. */
export const ABSOLUTE: ColourRange = { lo: RAMP_FLOOR, hi: 1 };

/**
 * This room's own range, from its worst to its best seats (2nd to 98th percentile, so one odd cell
 * does not set the scale), never narrower than MIN_SPAN. Brighter is still always better; the
 * legend names how good the best area really is (owner decision, docs/DESIGN_BRIEF_V4.md).
 */
export function roomRange(values: readonly number[]): ColourRange {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return ABSOLUTE;
  const at = (p: number) => sorted[Math.round(p * (sorted.length - 1))]!;
  let lo = at(0.02);
  let hi = at(0.98);
  if (hi - lo < MIN_SPAN) {
    const mid = (lo + hi) / 2;
    lo = mid - MIN_SPAN / 2;
    hi = mid + MIN_SPAN / 2;
  }
  return { lo, hi };
}

// ── Filling the gaps ─────────────────────────────────────────────────────────

/**
 * Cells without a score (in front of the speakers' line, on top of a speaker) take the value of the
 * nearest scored cell, and their distance to it, so the map can cover the whole room, hatching the filled
 * part instead of stopping at a hard line. The filled part is drawing, not data: it is
 * hatched as "advised against".
 */
export function fillGaps(
  nx: number,
  ny: number,
  values: readonly number[],
): { filled: Float32Array; dist: Float32Array } {
  const n = nx * ny;
  const filled = new Float32Array(n);
  const dist = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const v = values[k]!;
    filled[k] = Number.isFinite(v) ? v : NaN;
    dist[k] = Number.isFinite(v) ? 0 : Infinity;
  }
  // Two-pass chamfer distance transform, carrying the nearest value along.
  const relax = (k: number, i: number, j: number, cost: number) => {
    if (i < 0 || j < 0 || i >= nx || j >= ny) return;
    const m = j * nx + i;
    if (dist[m]! + cost < dist[k]!) {
      dist[k] = dist[m]! + cost;
      filled[k] = filled[m]!;
    }
  };
  const D = Math.SQRT2;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      relax(k, i - 1, j, 1);
      relax(k, i - 1, j - 1, D);
      relax(k, i, j - 1, 1);
      relax(k, i + 1, j - 1, D);
    }
  }
  for (let j = ny - 1; j >= 0; j--) {
    for (let i = nx - 1; i >= 0; i--) {
      const k = j * nx + i;
      relax(k, i + 1, j, 1);
      relax(k, i + 1, j + 1, D);
      relax(k, i, j + 1, 1);
      relax(k, i - 1, j + 1, D);
    }
  }
  return { filled, dist };
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
  /** 0..1: how visible the pixel is (soft edges instead of hard cuts). */
  alpha: Float32Array;
  /** 0..1: how much of the pixel lies in a marked area (e.g. "advised against"). */
  marked: Float32Array;
  /** 0..1: how much of the pixel lies where there is no spot at all (no score of its own). */
  inert: Float32Array;
}

/**
 * Upsamples a cell grid by `scale` with bicubic (Catmull-Rom) interpolation, so the map shows
 * smooth zones instead of blocks. Without `cellAlpha`, cells without data (NaN) are left out and
 * the edge fades over about one cell; with it, each cell's visibility is given (used after
 * fillGaps) and blended smoothly. Same data as before: only the drawing changes.
 */
export function smoothField(
  nx: number,
  ny: number,
  values: ArrayLike<number>,
  scale: number,
  mark?: readonly boolean[],
  cellAlpha?: ArrayLike<number>,
  cellInert?: readonly boolean[],
): SmoothField {
  const width = nx * scale;
  const height = ny * scale;
  const value = new Float32Array(width * height);
  const alpha = new Float32Array(width * height);
  const marked = new Float32Array(width * height);
  const inert = new Float32Array(width * height);
  const clampI = (i: number) => Math.min(nx - 1, Math.max(0, i));
  const clampJ = (j: number) => Math.min(ny - 1, Math.max(0, j));
  const at = (i: number, j: number) => values[clampJ(j) * nx + clampI(i)]!;
  const markAt = (i: number, j: number) => (mark?.[clampJ(j) * nx + clampI(i)] ? 1 : 0);
  const inertAt = (i: number, j: number) => (cellInert?.[clampJ(j) * nx + clampI(i)] ? 1 : 0);
  const alphaAt = (i: number, j: number) => cellAlpha![clampJ(j) * nx + clampI(i)]!;
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
      // Bilinear coverage (or given visibility) and marked share: soft edges.
      let cover = 0;
      let mk = 0;
      let none = 0;
      for (let b = 0; b < 2; b++) {
        for (let a = 0; a < 2; a++) {
          const w = (a ? tx : 1 - tx) * (b ? ty : 1 - ty);
          if (cellAlpha) cover += w * alphaAt(i0 + a, j0 + b);
          else if (!Number.isNaN(at(i0 + a, j0 + b))) cover += w;
          mk += w * markAt(i0 + a, j0 + b);
          none += w * inertAt(i0 + a, j0 + b);
        }
      }
      const k = py * width + px;
      value[k] = weight > 0.25 ? sum / weight : at(Math.round(gx), Math.round(gy));
      alpha[k] = Number.isNaN(value[k]!)
        ? 0
        : cellAlpha
          ? smoothstep(0, 1, cover)
          : smoothstep(0.25, 0.75, cover);
      marked[k] = mk;
      inert[k] = none;
    }
  }
  // Marked areas follow the cell grid in steps; blurring over about half a cell rounds them off.
  const radius = Math.max(1, Math.round(scale * 0.5));
  for (let pass = 0; pass < 2; pass++) {
    boxBlur(marked, width, height, radius);
    boxBlur(inert, width, height, radius);
  }
  return { width, height, value, alpha, marked, inert };
}

/** In-place separable box blur (running sums), clamped at the edges. */
function boxBlur(data: Float32Array, width: number, height: number, radius: number): void {
  const line = new Float32Array(Math.max(width, height));
  const pass = (count: number, length: number, index: (n: number, i: number) => number) => {
    for (let n = 0; n < count; n++) {
      for (let i = 0; i < length; i++) line[i] = data[index(n, i)]!;
      let sum = 0;
      for (let i = -radius; i <= radius; i++) sum += line[Math.min(length - 1, Math.max(0, i))]!;
      for (let i = 0; i < length; i++) {
        data[index(n, i)] = sum / (2 * radius + 1);
        sum += line[Math.min(length - 1, i + radius + 1)]! - line[Math.max(0, i - radius)]!;
      }
    }
  };
  pass(height, width, (y, x) => y * width + x);
  pass(width, height, (x, y) => y * width + x);
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// ── Painting ─────────────────────────────────────────────────────────────────

/**
 * How a field is drawn. Score maps use calm zones: four bands (poor, fair, good, best) with soft
 * edges, the owner's choice of three looks (docs/DESIGN_BRIEF_V4.md). The bass-note pattern is a
 * physical level, so it keeps a continuous gradient with faint contours.
 */
type HeatStyle = 'zones' | 'gradient';

/** Ramp positions (0..1) where a faint contour line is drawn in the gradient style. */
const CONTOURS = [0.25, 0.5, 0.75];
/** How much a contour pixel is lightened towards white: faint, so the zones stay calm. */
const CONTOUR_LIGHTEN = 0.22;
/** Half the contour line width, in canvas pixels. */
const CONTOUR_HALF_WIDTH = 0.9;
/** Zones style: number of bands and the width of the soft blend between two bands. */
const ZONES = 4;
const ZONE_EDGE = 0.18;
/** "Advised against": light diagonal hatch (period in CSS pixels, strength 0..1). */
const HATCH_PERIOD = 8;
const HATCH_STRENGTH = 0.14;
/** "Advised against": a fine light outline around the area, so it reads without hatching it hard. */
const OUTLINE_STRENGTH = 0.3;
/** 4 × 4 ordered dither: breaks up colour banding in smooth gradients. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((b) => b / 16 - 0.47);

/** Output pixels per grid cell: about one canvas pixel per screen pixel, within limits. */
export function renderScale(cellCssPx: number): number {
  return Math.max(2, Math.min(24, Math.round(cellCssPx * dpr())));
}

function dpr(): number {
  return typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
}

interface PaintOptions {
  style: HeatStyle;
  /** Maps a value to a ramp position 0..1. */
  toRamp: (v: number) => number;
  theme: Theme;
}

/** Paints a smooth field: colour by style, contours, hatched marked areas, dithered. */
function paint(canvas: HTMLCanvasElement, field: SmoothField, options: PaintOptions): void {
  const { width, height, value, alpha, marked, inert } = field;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const image = ctx.createImageData(width, height);
  const { style, toRamp, theme } = options;
  const noneFill = rgb(NOT_A_SPOT[theme].fill);
  const noneLine = rgb(NOT_A_SPOT[theme].line);
  // Hatch and outline lighten towards white on the light theme, darken towards black on the dark.
  const towards = theme === 'light' ? 255 : 0;
  const period = HATCH_PERIOD * dpr();
  const markAt = (x: number, y: number, fallback: number) =>
    x < 0 || y < 0 || x >= width || y >= height ? fallback : marked[y * width + x]!;
  const rampAt = (x: number, y: number, fallback: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return fallback;
    const v = value[y * width + x]!;
    return Number.isNaN(v) ? fallback : toRamp(v);
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const k = y * width + x;
      const a = alpha[k]!;
      if (a <= 0) continue;
      const t = toRamp(value[k]!);
      let shown = t;
      if (style === 'zones') {
        // Quantise into bands, blending softly across each band edge.
        const pos = Math.min(1, Math.max(0, t)) * ZONES;
        const band = Math.min(ZONES - 1, Math.floor(pos));
        const frac = pos - band;
        const up = band < ZONES - 1 ? smoothstep(1 - ZONE_EDGE, 1, frac) : 0;
        const down = band > 0 ? 1 - smoothstep(0, ZONE_EDGE, frac) : 0;
        const level = band + up * 0.5 - down * 0.5;
        shown = (level + 0.5) / ZONES;
      }
      let [r, g, b] = rampColor(shown, theme);
      if (style === 'gradient') {
        // Contours, anti-aliased: distance to the level in pixels, from the local slope.
        const gx = (rampAt(x + 1, y, t) - rampAt(x - 1, y, t)) / 2;
        const gy = (rampAt(x, y + 1, t) - rampAt(x, y - 1, t)) / 2;
        const slope = Math.hypot(gx, gy);
        if (slope > 1e-6) {
          let line = 0;
          for (const c of CONTOURS) {
            line = Math.max(line, 1 - Math.abs(t - c) / slope / CONTOUR_HALF_WIDTH);
          }
          const l = CONTOUR_LIGHTEN * Math.max(0, line);
          r += (towards - r) * l;
          g += (towards - g) * l;
          b += (towards - b) * l;
        }
      }
      const none = inert[k]!;
      const d = (((x + y) % period) + period) % period;
      const stripe = 1 - smoothstep(0.5 * dpr(), 1.3 * dpr(), Math.min(d, period - d));
      if (none > 0) {
        // The floor tone, with a fine hatch in a slightly deeper line colour.
        r += (noneFill[0] + (noneLine[0] - noneFill[0]) * stripe - r) * none;
        g += (noneFill[1] + (noneLine[1] - noneFill[1]) * stripe - g) * none;
        b += (noneFill[2] + (noneLine[2] - noneFill[2]) * stripe - b) * none;
      }
      const m = marked[k]! * (1 - none);
      // Outline where the marked share crosses one half, anti-aliased like the contours.
      const mx = (markAt(x + 1, y, m) - markAt(x - 1, y, m)) / 2;
      const my = (markAt(x, y + 1, m) - markAt(x, y - 1, m)) / 2;
      const mSlope = Math.hypot(mx, my);
      if (mSlope > 1e-4) {
        const edge = Math.max(0, 1 - Math.abs(m - 0.5) / mSlope / (0.75 * dpr()));
        const o = OUTLINE_STRENGTH * edge;
        r += (towards - r) * o;
        g += (towards - g) * o;
        b += (towards - b) * o;
      }
      if (m > 0.02) {
        // A fine diagonal hatch, anti-aliased, instead of darkening (owner: "a smudge").
        const h = HATCH_STRENGTH * m * stripe;
        r += (towards - r) * h;
        g += (towards - g) * h;
        b += (towards - b) * h;
      }
      const dither = BAYER[(x & 3) + (y & 3) * 4]!;
      image.data[k * 4] = r + dither;
      image.data[k * 4 + 1] = g + dither;
      image.data[k * 4 + 2] = b + dither;
      image.data[k * 4 + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(image, 0, 0);
}

/**
 * The map covers the whole room (owner decision, docs/ROADMAP_V5.md): every cell is visible.
 * Cells with no score of their own (no seat or no stereo pair fits there) are "not a spot": one
 * neutral tone, never a colour borrowed from their neighbours (docs/ROADMAP_V7.md). Scored spots
 * the app advises against are hatched. Cells with no data at all stay empty.
 */
function wholeRoom(
  dist: Float32Array,
  flagged: readonly boolean[] | undefined,
): { alpha: Float32Array; marks: boolean[]; inert: boolean[] } {
  const alpha = dist.map((d) => (Number.isFinite(d) ? 1 : 0));
  const marks = Array.from(dist, (_, k) => !!flagged?.[k]);
  const inert = Array.from(dist, (d) => Number.isFinite(d) && d > 0);
  return { alpha, marks, inert };
}

/** One seat layer: calm zones over its own colour range; "advised against" outlined and hatched. */
export function paintHeat(
  canvas: HTMLCanvasElement,
  layers: SeatLayers,
  values: readonly number[],
  scale = 8,
  range: ColourRange = roomRange(values),
  theme: Theme = 'light',
): void {
  const { filled, dist } = fillGaps(layers.nx, layers.ny, values);
  const { alpha, marks, inert } = wholeRoom(dist, layers.redFlag);
  const field = smoothField(layers.nx, layers.ny, filled, scale, marks, alpha, inert);
  paint(canvas, field, {
    style: 'zones',
    toRamp: (v) => (v - range.lo) / (range.hi - range.lo),
    theme,
  });
}

/** Pressure pattern of one bass note: loud is bright, −40 dB or quieter is the darkest. */
export function paintField(
  canvas: HTMLCanvasElement,
  grid: Grid,
  scale = 8,
  theme: Theme = 'light',
): void {
  const { filled, dist } = fillGaps(grid.nx, grid.ny, grid.values);
  const { alpha } = wholeRoom(dist, undefined);
  const field = smoothField(grid.nx, grid.ny, filled, scale, undefined, alpha);
  // A physical level, not a score: always the absolute −40…0 dB scale.
  paint(canvas, field, { style: 'gradient', toRamp: (db) => (db + 40) / 40, theme });
}

/**
 * Where the speakers would score best, with the seat staying where it is. The grid covers the left
 * half (the left speaker's position); the right speaker mirrors it about the seat, so the field is
 * mirrored to twice the width before drawing.
 */
export function paintSpeakerMap(
  canvas: HTMLCanvasElement,
  grid: Grid,
  scale = 8,
  range: ColourRange = roomRange(grid.values),
  theme: Theme = 'light',
): void {
  const { nx, ny, values } = grid;
  const mirrored: number[] = [];
  const marks: boolean[] = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      mirrored.push(values[j * nx + i]!);
      marks.push(grid.redFlag?.[j * nx + i] ?? false);
    }
    for (let i = nx - 1; i >= 0; i--) {
      mirrored.push(values[j * nx + i]!);
      marks.push(grid.redFlag?.[j * nx + i] ?? false);
    }
  }
  const { filled, dist } = fillGaps(nx * 2, ny, mirrored);
  const { alpha, marks: shaded, inert } = wholeRoom(dist, marks);
  const field = smoothField(nx * 2, ny, filled, scale, shaded, alpha, inert);
  paint(canvas, field, {
    style: 'zones',
    toRamp: (v) => (v - range.lo) / (range.hi - range.lo),
    theme,
  });
}
