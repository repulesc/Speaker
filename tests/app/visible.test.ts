import { describe, expect, it } from 'vitest';
import { heldBack, visibleAdvice } from '../../src/app/findings/visible';
import type { Advice, Effort } from '../../src/engine/types';

const advice = (effort: Effort): Advice =>
  ({ ruleId: 'T', messageKey: `advice.T.${effort}`, effort }) as unknown as Advice;
const list = [advice('free'), advice('invest'), advice('cheap'), advice('invest')];

describe('visibleAdvice', () => {
  it('shows only free and cheap ideas until the user is ready to invest', () => {
    expect(visibleAdvice(list, undefined).map((a) => a.effort)).toEqual(['free', 'cheap']);
    expect(visibleAdvice(list, false).map((a) => a.effort)).toEqual(['free', 'cheap']);
    expect(heldBack(list, undefined)).toBe(2);
  });

  it('shows everything, in the same order, once ready', () => {
    expect(visibleAdvice(list, true)).toEqual(list);
    expect(heldBack(list, true)).toBe(0);
  });
});
