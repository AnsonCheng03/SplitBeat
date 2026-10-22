export const DEFAULT_GOOD_WINDOW_MS = 100;
export const MIN_GOOD_WINDOW_MS = 50;
export const MAX_GOOD_WINDOW_MS = 200;
export const TAP_OFFSET_LIMIT_MS = 200;
export const CALIBRATION_TAPS_PER_HAND = 8;

export function normalizeGoodWindowMs(value: number): number {
  const bounded = Math.max(MIN_GOOD_WINDOW_MS, Math.min(MAX_GOOD_WINDOW_MS, value));
  return Math.round(bounded / 5) * 5;
}

export function normalizeTapOffsetMs(value: number): number {
  const bounded = Math.max(-TAP_OFFSET_LIMIT_MS, Math.min(TAP_OFFSET_LIMIT_MS, value));
  return Math.round(bounded / 5) * 5;
}

export function calibrationOffsetFromErrors(errors: readonly number[]): number {
  if (errors.length === 0) return 0;
  const meanError = errors.reduce((total, error) => total + error, 0) / errors.length;
  return normalizeTapOffsetMs(meanError);
}
