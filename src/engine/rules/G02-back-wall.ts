import { makeFinding, type RuleDef } from './rule';

/**
 * G02 · Don't sit with your head against the back wall (🟠; thresholds 🟡).
 * Sources: [TOOLE], [EVP] (⚠ verify explicit distances). Red flag < 0.3 m, caution < 0.6 m.
 */
export const G02: RuleDef = {
  id: 'G02',
  level: 'guideline',
  sources: ['TOOLE', 'EVP'],
  variants: ['redFlag', 'caution', 'ok'],
  evaluate(ctx, placement) {
    const d = ctx.room.L - placement.listener.y;
    const params = { distance: d };
    if (d < 0.3) return [makeFinding(G02, 'redFlag', 'red-flag', params)];
    if (d < 0.6) return [makeFinding(G02, 'caution', 'caution', params)];
    return [makeFinding(G02, 'ok', 'ok', params)];
  },
};
