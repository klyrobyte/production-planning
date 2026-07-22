import { describe, it, expect } from 'vitest';
import { forecastToDailyRequirement, buildMonthlyForecastMap } from '../../src/domain/forecast-calculator';

describe('forecast-calculator', () => {
  it('converts monthly volume to daily requirement', () => {
    expect(forecastToDailyRequirement(1000, 20)).toBe(50);
  });

  it('uses default 20 working days', () => {
    expect(forecastToDailyRequirement(1000)).toBe(50);
  });

  it('returns 0 if working days is 0', () => {
    expect(forecastToDailyRequirement(1000, 0)).toBe(0);
  });

  it('builds monthly forecast map correctly', () => {
    const result = buildMonthlyForecastMap([
      { month: '2025-01', volume: 1000 },
      { month: '2025-02', volume: 1200 },
    ]);
    expect(result).toEqual({ '2025-01': 1000, '2025-02': 1200 });
  });

  it('returns empty object for empty input', () => {
    expect(buildMonthlyForecastMap([])).toEqual({});
  });
});
