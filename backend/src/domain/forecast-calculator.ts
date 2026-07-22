/**
 * Derives daily requirement from monthly forecast and working days.
 */
export const forecastToDailyRequirement = (monthlyVolume: number, workingDays = 20): number =>
  workingDays > 0 ? Math.ceil(monthlyVolume / workingDays) : 0;

/**
 * Builds a monthly_forecasts map from an array of { month: 'YYYY-MM', volume }.
 * Result is keyed by YYYY-MM for direct storage in the JSONB column.
 */
export const buildMonthlyForecastMap = (entries: { month: string; volume: number }[]): Record<string, number> =>
  entries.reduce<Record<string, number>>((acc, { month, volume }) => {
    acc[month] = volume;
    return acc;
  }, {});
