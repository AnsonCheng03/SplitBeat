export const MIN_MODE_LOADING_FEEDBACK_MS = 350;
export const MIN_ACTIVITY_LOADING_FEEDBACK_MS = 800;

export function waitForModeLoadingFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export function remainingModeLoadingFeedbackMs(
  startedAtMs: number,
  nowMs: number,
  minimumVisibleMs = MIN_MODE_LOADING_FEEDBACK_MS,
): number {
  const elapsedMs = Math.max(0, nowMs - startedAtMs);
  return Math.max(0, minimumVisibleMs - elapsedMs);
}

export async function keepModeLoadingVisible(
  startedAtMs: number,
  minimumVisibleMs = MIN_MODE_LOADING_FEEDBACK_MS,
): Promise<void> {
  const remainingMs = remainingModeLoadingFeedbackMs(startedAtMs, Date.now(), minimumVisibleMs);
  if (remainingMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, remainingMs));
}
