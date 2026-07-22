/**
 * Calculates the FUKA workload in hours for a given part.
 * Formula: (dailyRequirement / cavity) * cycleTimeSeconds / 3600
 */
export const calculateFukaWorkload = (dailyRequirement: number, cavity: number, cycleTimeSeconds: number): number => {
  if (cavity <= 0 || cycleTimeSeconds <= 0) return 0;
  return (dailyRequirement / cavity) * cycleTimeSeconds / 3600;
};

/**
 * Calculates the monthly volume from a daily requirement.
 * Assumes 20 working days per month.
 */
export const calculateMonthlyVolume = (dailyRequirement: number, workingDays = 20): number =>
  dailyRequirement * workingDays;

/**
 * Calculates how many Kanban boxes are needed per day.
 * spec = pcs per box (fallback to 24 if 0 or undefined)
 */
export const calculateDailyBoxes = (dailyRequirement: number, spec: number): number => {
  const effectiveSpec = spec > 0 ? spec : 24; // fallback per business rule
  return Math.ceil(dailyRequirement / effectiveSpec);
};
