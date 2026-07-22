/**
 * Validates whether a label print is allowed.
 * Rules:
 *   - progress must not exceed target (anti-fraud: cannot print more than planned)
 *   - printing can only happen if the job is in an active status
 */
export const isPrintAllowed = (progress: number, target: number, status: string): boolean => {
  if (!['active', 'in-progress'].includes(status)) return false;
  return progress < target;
};

/**
 * Returns the new progress count after a print action.
 * Clamps to target to prevent going over (belt-and-suspenders guard).
 */
export const getUpdatedProgress = (currentProgress: number, printedQty: number, target: number): number =>
  Math.min(currentProgress + printedQty, target);
