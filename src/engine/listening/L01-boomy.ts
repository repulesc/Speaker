import type { ListeningRule, Suggestion } from './check';

/**
 * L01 · The bass is boomy. A wall close behind a speaker (or beside it, or a corner) raises the
 * bass it radiates: boundary gain ([ALL74], [KUT]), 🔴. A seat close to the back wall sits where
 * every length resonance is loudest (P03, G02), 🔴. The maker's own remedies come next: the wall
 * switch, a port plug, the bass control ([manufacturer]); a control the user ticked is named
 * directly and comes first (V10). Furniture under the speakers can boom along with them
 * (structure-borne vibration of a hollow panel: a desk, a light stand, a suspended wooden floor);
 * how much varies too widely to promise, so it is 🟡 practice. Distances are typical first steps.
 */
export const L01: ListeningRule = {
  id: 'L01',
  aspect: 'bass',
  suggest(ctx, _p, m, answers) {
    if (answers.bass !== 'boomy') return [];
    const s = ctx.speaker;
    const { controls, placedOn, woodFloor } = m.setting;
    const out: Suggestion[] = [];
    if (m.clearance < 0.6) {
      out.push({
        id: 'L01.out',
        level: 'physics',
        sources: ['ALL74', 'KUT'],
        priority: 0.9,
        change: { kind: 'speakersOut', by: 0.2 },
        params: { by: 0.2 },
      });
    }
    if (m.back < 1) {
      out.push({
        id: 'L01.seatForward',
        level: 'physics',
        sources: ['KUT'],
        priority: 0.8,
        change: { kind: 'seat', by: -0.2 },
        params: { by: 0.2 },
      });
    }
    if (m.side < 0.4) {
      out.push({
        id: 'L01.inward',
        level: 'physics',
        sources: ['ALL74'],
        priority: 0.6,
        change: { kind: 'spacing', by: -0.2 },
        params: { by: 0.1 },
      });
    }
    if (controls.wall) {
      out.push({
        id: 'L01.wallSwitch',
        level: 'guideline',
        sources: ['manufacturer'],
        priority: 0.7,
        params: {},
      });
    }
    if (s.enclosure === 'ported' && (s.portLocation === 'rear' || s.portLocation === 'front')) {
      out.push({
        id: 'L01.plug',
        level: 'heuristic',
        sources: ['manufacturer'],
        priority: 0.45,
        params: {},
      });
    }
    out.push(
      controls.bass
        ? {
            id: 'L01.controlKnown',
            level: 'guideline',
            sources: ['manufacturer'],
            priority: 0.55,
            params: {},
          }
        : {
            id: 'L01.control',
            level: 'guideline',
            sources: ['manufacturer'],
            priority: 0.35,
            params: {},
          },
    );
    const base =
      placedOn === 'desk'
        ? 'L01.onDesk'
        : placedOn === 'stand'
          ? 'L01.onStand'
          : woodFloor
            ? 'L01.onFloor'
            : null;
    if (base) {
      out.push({ id: base, level: 'heuristic', sources: ['practice'], priority: 0.4, params: {} });
    }
    return out;
  },
};
