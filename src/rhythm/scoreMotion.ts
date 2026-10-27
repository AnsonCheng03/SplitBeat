import type { ScoreDisplayMode } from '@/rhythm/scoreStaff';
import type { ScoreRhythmMeasure } from '@/types/importedScore';

const POSITION_EPSILON = 0.000001;

/** Return the progress through a bar's note onsets for discrete note-by-note scrolling. */
export function scoreNoteScrollProgress(measure: ScoreRhythmMeasure, quarterInMeasure: number): number {
  if (!Number.isFinite(quarterInMeasure)) return 0;

  const sortedOnsets =
    [...measure.leftEvents, ...measure.rightEvents]
      .map((event) => event.startQuarter)
      .filter(Number.isFinite)
      .sort((first, second) => first - second);
  const onsets = sortedOnsets.reduce<number[]>((unique, start) => {
    if (unique.length === 0 || Math.abs(start - unique[unique.length - 1]!) > POSITION_EPSILON) unique.push(start);
    return unique;
  }, []);
  if (onsets.length < 2) return 0;

  let currentOnsetIndex = 0;
  for (let index = 0; index < onsets.length; index += 1) {
    if (onsets[index]! <= quarterInMeasure + POSITION_EPSILON) currentOnsetIndex = index;
    else break;
  }

  return currentOnsetIndex / (onsets.length - 1);
}

/** Compute the score strip offset while bounding bar slides to one bar per update. */
export function scoreStripOffset(
  mode: ScoreDisplayMode,
  barWidth: number,
  sequence: number,
  noteProgress: number,
): number {
  if (!Number.isFinite(barWidth) || barWidth <= 0 || !Number.isFinite(sequence) || sequence < 0) return 0;
  if (mode === 'focus' || mode === 'fade' || sequence === 0 && mode === 'slide') return 0;
  if (mode === 'slide') return -barWidth;

  const clampedProgress = Math.max(0, Math.min(1, Number.isFinite(noteProgress) ? noteProgress : 0));
  return -barWidth * ((sequence > 0 ? 1 : 0) + clampedProgress);
}
