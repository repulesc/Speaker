import { describe, expect, it } from 'vitest';
import { seatFurniture } from '../../src/app/plan/seatFurniture';

const ears = { x: 2, y: 3, z: 1.1 };

describe('seat furniture', () => {
  it('a bed is a real bed: 1.6 m wide, 2 m long, reaching towards the speakers', () => {
    const bed = seatFurniture('bed', ears);
    expect(bed.width).toBeCloseTo(1.6, 9);
    expect(bed.depth).toBeCloseTo(2.0, 9);
    expect(bed.x).toBeCloseTo(1.2, 9);
    // The headboard is just behind the head; the foot end is nearer the speakers.
    expect(bed.y + bed.depth).toBeCloseTo(3.3, 9);
  });

  it('a sofa and a chair have their backrest just behind the ears', () => {
    const sofa = seatFurniture('sofa', ears);
    expect(sofa.width).toBeCloseTo(2.0, 9);
    expect(sofa.y + sofa.depth).toBeCloseTo(3.25, 9);
    expect(seatFurniture('chair', ears).width).toBeCloseTo(0.8, 9);
  });

  it('a desk stands in front of the listener', () => {
    const desk = seatFurniture('desk', ears);
    expect(desk.y + desk.depth).toBeLessThan(ears.y);
  });
});
