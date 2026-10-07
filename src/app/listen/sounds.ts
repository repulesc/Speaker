/**
 * Test sounds for the ears (docs/ROADMAP_V10.md §7): signals, not measurements; nothing is
 * recorded. Quiet by design: pink noise around −20 dBFS, fades in and out, a bass sweep that
 * starts at 35 Hz (small woofers are spared the deepest notes), low-passed noise (tweeters are
 * spared hiss at level), one sound at a time, each one ends by itself.
 */
export type Sound = 'left' | 'right' | 'centre' | 'polarity' | 'sweep';

/** Where a sound is: for the polarity check, which half (A in phase, B one side inverted); for the sweep, the frequency. */
export type Progress = { phase: 'A' | 'B' } | { hz: number } | null;

const NOISE_LEVEL = 0.1;
const SWEEP_LEVEL = 0.12;
const FADE = 0.08;
export const SWEEP = { from: 35, to: 180, seconds: 16 } as const;

let audio: AudioContext | null = null;
let current: { stop: () => void } | null = null;

/** Pink noise (Paul Kellet's filter on white noise), one channel's worth. */
function pinkNoise(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.round(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

/** A gain that fades in at `start` and out at `end`. */
function envelope(ctx: AudioContext, level: number, start: number, end: number): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(level, start + FADE);
  g.gain.setValueAtTime(level, end - FADE);
  g.gain.linearRampToValueAtTime(0, end);
  return g;
}

/** Noise into the left (0), right (1) or both channels; `invertRight` flips the right one. */
function noise(
  ctx: AudioContext,
  out: AudioNode,
  start: number,
  seconds: number,
  left: boolean,
  right: boolean,
  invertRight = false,
) {
  const src = ctx.createBufferSource();
  src.buffer = pinkNoise(ctx, seconds);
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 4000;
  const env = envelope(ctx, NOISE_LEVEL, start, start + seconds);
  src.connect(lowpass).connect(env);
  const merger = ctx.createChannelMerger(2);
  if (left) env.connect(merger, 0, 0);
  if (right) {
    const flip = ctx.createGain();
    flip.gain.value = invertRight ? -1 : 1;
    env.connect(flip).connect(merger, 0, 1);
  }
  merger.connect(out);
  src.start(start);
  src.stop(start + seconds);
  return src;
}

/** Stops whatever is playing. */
export function stopSound(): void {
  current?.stop();
  current = null;
}

/**
 * Plays one sound and resolves when it ends (or is stopped). `progress` follows it: the half of
 * the polarity check, or the sweep's frequency, about ten times a second.
 */
export function playSound(sound: Sound, progress: (p: Progress) => void = () => {}): Promise<void> {
  stopSound();
  audio ??= new AudioContext();
  const ctx = audio;
  void ctx.resume();
  const out = ctx.createGain();
  out.connect(ctx.destination);
  const t = ctx.currentTime + 0.05;
  const sources: AudioScheduledSourceNode[] = [];
  let length: number;
  let half = 0;
  if (sound === 'left' || sound === 'right' || sound === 'centre') {
    length = 3;
    sources.push(noise(ctx, out, t, length, sound !== 'right', sound !== 'left'));
  } else if (sound === 'polarity') {
    half = 3;
    length = 2 * half + 0.6;
    sources.push(noise(ctx, out, t, half, true, true));
    sources.push(noise(ctx, out, t + half + 0.6, half, true, true, true));
  } else {
    length = SWEEP.seconds;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(SWEEP.from, t);
    osc.frequency.exponentialRampToValueAtTime(SWEEP.to, t + length);
    osc.connect(envelope(ctx, SWEEP_LEVEL, t, t + length)).connect(out);
    osc.start(t);
    osc.stop(t + length);
    sources.push(osc);
  }
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      const at = ctx.currentTime - t;
      if (sound === 'polarity') progress(at < half + 0.3 ? { phase: 'A' } : { phase: 'B' });
      else if (sound === 'sweep')
        progress({
          hz: SWEEP.from * (SWEEP.to / SWEEP.from) ** Math.min(1, Math.max(0, at / length)),
        });
      if (at >= length) finish();
    }, 100);
    const finish = () => {
      clearInterval(timer);
      for (const s of sources) {
        try {
          s.stop();
        } catch {
          // already stopped
        }
      }
      out.disconnect();
      if (current === handle) current = null;
      progress(null);
      resolve();
    };
    const handle = { stop: finish };
    current = handle;
  });
}
