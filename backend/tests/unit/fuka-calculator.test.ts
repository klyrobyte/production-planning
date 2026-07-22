import { describe, it, expect } from 'vitest';
import { calculateFukaWorkload, calculateMonthlyVolume, calculateDailyBoxes } from '../../src/domain/fuka-calculator';

describe('fuka-calculator', () => {
  it('calculates FUKA workload correctly', () => {
    // (100 / 2) * 60 / 3600 = 0.833... hours
    expect(calculateFukaWorkload(100, 2, 60)).toBeCloseTo(0.833, 2);
  });

  it('returns 0 if cavity is 0', () => {
    expect(calculateFukaWorkload(100, 0, 60)).toBe(0);
  });

  it('returns 0 if cycleTime is 0', () => {
    expect(calculateFukaWorkload(100, 1, 0)).toBe(0);
  });

  it('calculates monthly volume with default 20 working days', () => {
    expect(calculateMonthlyVolume(50)).toBe(1000);
  });

  it('calculates monthly volume with custom working days', () => {
    expect(calculateMonthlyVolume(50, 22)).toBe(1100);
  });

  it('calculates daily boxes using spec', () => {
    expect(calculateDailyBoxes(100, 24)).toBe(5); // ceil(100/24) = 5
  });

  it('falls back to spec=24 when spec is 0', () => {
    expect(calculateDailyBoxes(100, 0)).toBe(5); // ceil(100/24)
  });
});
