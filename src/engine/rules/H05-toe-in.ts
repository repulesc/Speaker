import { makeFinding, type RuleDef } from './rule';

/**
 * H05 · Toe-in (🟡). Source: [TOOLE]. No numeric recommendation without measured directivity
 * data (none in v1 profiles), so the app offers a listening experiment instead.
 */
export const H05: RuleDef = {
  id: 'H05',
  level: 'heuristic',
  sources: ['TOOLE'],
  variants: ['experiment'],
  evaluate(_ctx, placement) {
    return [
      makeFinding(H05, 'experiment', 'info', {
        toeInLeft: placement.speakers.left.toeInDeg,
        toeInRight: placement.speakers.right.toeInDeg,
      }),
    ];
  },
};
