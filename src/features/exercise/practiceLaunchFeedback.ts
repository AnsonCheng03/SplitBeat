export const MIN_PRACTICE_LOADING_FEEDBACK_MS = 350;

export function remainingPracticeLoadingFeedbackMs(startedAtMs: number, nowMs: number): number {
  const elapsedMs = Math.max(0, nowMs - startedAtMs);
  return Math.max(0, MIN_PRACTICE_LOADING_FEEDBACK_MS - elapsedMs);
}
