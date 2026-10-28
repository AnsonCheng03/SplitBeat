import type { ScoreDisplayMode } from '@/rhythm/scoreStaff';
import type { ScoreRhythmMeasure } from '@/types/importedScore';

const POSITION_EPSILON = 0.000001;
const MAX_VISIBLE_SCORE_BARS = 3;

/** Return the fixed score slots after the two beat-triggered fade handoffs. */
export function scoreFadeVisibleSequences(
  sequence: number,
  count: number,
  beatInBar: number,
  beatsPerBar: number,
): number[] {
  if (![sequence, count, beatInBar, beatsPerBar].every(Number.isFinite)) return [];

  const firstSequence = Math.max(0, Math.floor(sequence));
  const safeCount = Math.max(0, Math.floor(count));
  const safeBeat = Math.max(0, Math.floor(beatInBar));
  const safeBeatCount = Math.max(0, Math.floor(beatsPerBar));
  if (firstSequence >= safeCount) return [];

  const visibleSequences = Array.from(
    { length: Math.min(MAX_VISIBLE_SCORE_BARS, safeCount - firstSequence) },
    (_, offset) => firstSequence + offset,
  );

  if (safeBeatCount >= 3 && safeBeat >= 2 && visibleSequences.length > 1) {
    visibleSequences[0] = firstSequence + 1;
  }
  if (safeBeatCount >= 4 && safeBeat >= 3 && visibleSequences.length > 2) {
    visibleSequences[1] = firstSequence + 2;
  }

  return visibleSequences;
}

/** Return the bar that should crossfade out of a fixed slot on this beat. */
export function scoreFadeOutgoingSequence(
  slotIndex: number,
  sequence: number,
  count: number,
  beatInBar: number,
  beatsPerBar: number,
): number | undefined {
  if (![slotIndex, sequence, count, beatInBar, beatsPerBar].every(Number.isFinite)) return undefined;

  const slot = Math.floor(slotIndex);
  const currentSequence = Math.max(0, Math.floor(sequence));
  const safeCount = Math.max(0, Math.floor(count));
  const beat = Math.floor(beatInBar);
  const beatCount = Math.floor(beatsPerBar);

  if (slot === 0 && beatCount >= 3 && beat === 2 && currentSequence + 1 < safeCount) {
    return currentSequence;
  }
  if (slot === 1 && beatCount >= 4 && beat === 3 && currentSequence + 2 < safeCount) {
    return currentSequence + 1;
  }
  return undefined;
}

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
