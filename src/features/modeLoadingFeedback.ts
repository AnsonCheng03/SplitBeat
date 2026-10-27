export const MIN_MODE_LOADING_FEEDBACK_MS = 350;

export function waitForModeLoadingFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export function remainingModeLoadingFeedbackMs(startedAtMs: number, nowMs: number): number {
  const elapsedMs = Math.max(0, nowMs - startedAtMs);
  return Math.max(0, MIN_MODE_LOADING_FEEDBACK_MS - elapsedMs);
}

export async function keepModeLoadingVisible(startedAtMs: number): Promise<void> {
  const remainingMs = remainingModeLoadingFeedbackMs(startedAtMs, Date.now());
  if (remainingMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, remainingMs));
}
