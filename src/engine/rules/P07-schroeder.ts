import { ASSUMPTION, makeFinding, type RuleDef } from './rule';

/**
 * P07 · Schroeder frequency (🔴 physics). Sources: [SCH96], [KUT], [TOOLE].
 * f_s ≈ 2000 · sqrt(T60 / V). A gradual transition, not a hard line.
 */
export function schroederFrequency(t60: number, volume: number): number {
  return 2000 * Math.sqrt(t60 / volume);
}

export const P07: RuleDef = {
  id: 'P07',
  level: 'physics',
  sources: ['SCH96', 'KUT', 'TOOLE'],
  variants: ['transition'],
  evaluate(ctx) {
    return [
      makeFinding(
        P07,
        'transition',
        'info',
        { frequency: ctx.schroeder.value, low: ctx.schroeder.low, high: ctx.schroeder.high },
        { assumptions: [ASSUMPTION.diffuseField] },
      ),
    ];
  },
};
