import type { ScoreRhythmMeasure } from '@/types/importedScore';

const MAX_VISIBLE_SCORE_BARS = 3;
const COMPOSER_PREVIEW_MIN_NOTATION_WIDTH = 154;
const COMPOSER_PREVIEW_CARD_CHROME = 104;
const MIN_NOTE_SPACING = 7;

/** Sizes a score bar to the available viewport, showing up to three bars without clipping a partial bar. */
export function scoreBarWidth(viewportWidth: number, measureCount: number): number {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return 0;

  const safeMeasureCount = Number.isFinite(measureCount)
    ? Math.max(1, Math.floor(measureCount))
    : 1;
  const visibleBarCount = Math.min(MAX_VISIBLE_SCORE_BARS, safeMeasureCount);

  return viewportWidth / visibleBarCount;
}

/** Expand composed-score previews for short note values so adjacent noteheads stay distinct. */
export function composerPreviewDimensions(measure: ScoreRhythmMeasure): { notationWidth: number; cardWidth: number } {
  const barLength = Number.isFinite(measure.durationQuarter) && measure.durationQuarter > 0
    ? measure.durationQuarter
    : 0;
  let shortestDuration = Number.POSITIVE_INFINITY;
  for (const event of [...measure.leftEvents, ...measure.rightEvents]) {
    const duration = event.notationDurationQuarter ?? event.durationQuarter;
    if (Number.isFinite(duration) && duration > 0) shortestDuration = Math.min(shortestDuration, duration);
  }
  if (!Number.isFinite(shortestDuration)) shortestDuration = barLength || 1;
  const notationWidth = Math.max(
    COMPOSER_PREVIEW_MIN_NOTATION_WIDTH,
    barLength > 0 ? barLength * MIN_NOTE_SPACING / shortestDuration : COMPOSER_PREVIEW_MIN_NOTATION_WIDTH,
  );

  return {
    notationWidth,
    cardWidth: notationWidth + COMPOSER_PREVIEW_CARD_CHROME,
  };
}
