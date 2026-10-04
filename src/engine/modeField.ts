import { buildContext, currentPlacement, wooferCentre } from './context';
import { roomModes } from './rules/P02-room-modes';
import { modeShape } from './rules/P03-mode-shape';
import { heatmapStep } from './scoring/heatmaps';
import { steps } from './scoring/search';
import type { ModeField, Project } from './types';

/** Below this the pattern is "silent": no need to draw differences of 60 dB. */
const FLOOR_DB = -40;

/**
 * Room-mode explorer (🔴 physics, P02/P03/P09): how loud one bass note is everywhere on the floor
 * at ear height, with the speakers where they are. The same modal sum as P09, at one frequency;
 * modes up to twice the note (or 40 Hz above it) carry the pattern. Relative levels only.
 */
export function modeField(project: Project, frequency: number): ModeField | null {
  const ctx = buildContext(project);
  if (!ctx) return null;
  const { room, c } = ctx;
  const { speakers, listener } = currentPlacement(ctx);
  const sources = [
    wooferCentre(speakers.left, ctx.speaker),
    wooferCentre(speakers.right, ctx.speaker),
  ];
  const listed = roomModes(room, c, Math.max(2 * frequency, frequency + 40));
  const modes = [{ f: 0, n: [0, 0, 0] as [number, number, number] }, ...listed];
  const omega = 2 * Math.PI * frequency;
  const delta = 6.91 / ctx.t60.bass;
  // Per mode: source coupling × 1 / (K·(ω_n² − ω² + 2jδω_n)), as in P09.
  const terms = modes.map(({ f, n }) => {
    const omegaN = 2 * Math.PI * f;
    const K = room.V / n.reduce((product, i) => product * (i === 0 ? 1 : 2), 1);
    const re = omegaN * omegaN - omega * omega;
    const im = 2 * delta * omegaN;
    const mag2 = K * (re * re + im * im);
    const coupling = sources.reduce((sum, s) => sum + modeShape(n, s, room), 0);
    return { n, re: (coupling * re) / mag2, im: (-coupling * im) / mag2 };
  });

  const step = heatmapStep(ctx);
  const xs = steps(step / 2, room.W - step / 2, step);
  const ys = steps(step / 2, room.L - step / 2, step);
  const levels = ys.flatMap((y) =>
    xs.map((x) => {
      let re = 0;
      let im = 0;
      for (const t of terms) {
        const shape = modeShape(t.n, { x, y, z: listener.z }, room);
        re += t.re * shape;
        im += t.im * shape;
      }
      return 20 * Math.log10(Math.max(Math.hypot(re, im), 1e-30));
    }),
  );
  const loudest = Math.max(...levels);
  return {
    frequency,
    grid: {
      x0: xs[0]!,
      y0: ys[0]!,
      step,
      nx: xs.length,
      ny: ys.length,
      values: levels.map((v) => Math.max(v - loudest, FLOOR_DB)),
    },
    nearbyModes: listed.filter((m) => Math.abs(m.f - frequency) <= 0.05 * frequency),
  };
}
