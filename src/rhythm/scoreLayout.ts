const MAX_VISIBLE_SCORE_BARS = 3;

/** Sizes a score bar to the available viewport, showing up to three bars without clipping a partial bar. */
export function scoreBarWidth(viewportWidth: number, measureCount: number): number {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return 0;

  const safeMeasureCount = Number.isFinite(measureCount)
    ? Math.max(1, Math.floor(measureCount))
    : 1;
  const visibleBarCount = Math.min(MAX_VISIBLE_SCORE_BARS, safeMeasureCount);

  return viewportWidth / visibleBarCount;
}
