import type { Hand } from '@/types/rhythm';
import type { ImportedRhythmScore, ScoreRhythmEvent, ScoreRhythmMeasure } from '@/types/importedScore';
import type { NoteNotationEvent } from '@/rhythm/noteNotation';

export type ScoreDisplayMode = 'focus' | 'staff';

export function scoreHandPresence(score: ImportedRhythmScore): Record<Hand, boolean> {
  return {
    left: score.measures.some((measure) => measure.leftEvents.some((event) => !event.isRest && !event.isTieContinuation)),
    right: score.measures.some((measure) => measure.rightEvents.some((event) => !event.isRest && !event.isTieContinuation)),
  };
}

export function scoreTrainingMode(
  score: ImportedRhythmScore,
  preferredHand: Hand,
): { trainingMode: 'single-hand'; singleHand: Hand } | { trainingMode: 'two-hand' } {
  if (score.trackCount === 1) return { trainingMode: 'single-hand', singleHand: preferredHand };

  const hands = scoreHandPresence(score);
  if (hands.left && !hands.right) return { trainingMode: 'single-hand', singleHand: 'left' };
  if (hands.right && !hands.left) return { trainingMode: 'single-hand', singleHand: 'right' };
  return { trainingMode: 'two-hand' };
}

export function scoreBeatEvents(
  measure: ScoreRhythmMeasure,
  nextMeasure: ScoreRhythmMeasure | undefined,
  quarterInMeasure: number,
  beatDurationQuarter: number,
  hand: Hand,
): ScoreRhythmEvent[] {
  if (!Number.isFinite(quarterInMeasure) || !Number.isFinite(beatDurationQuarter) || beatDurationQuarter <= 0) return [];

  const beatStart = Math.floor((Math.max(0, quarterInMeasure) + 0.000001) / beatDurationQuarter) * beatDurationQuarter;
  const beatEnd = beatStart + beatDurationQuarter;
  const measures = [measure, ...(nextMeasure && beatEnd > measure.durationQuarter + 0.000001 ? [nextMeasure] : [])];

  return measures.flatMap((sourceMeasure, measureIndex) => {
    const measureOffset = measureIndex === 0 ? 0 : measure.durationQuarter;
    return (hand === 'left' ? sourceMeasure.leftEvents : sourceMeasure.rightEvents)
      .filter((event) => {
        const eventStart = measureOffset + event.startQuarter;
        return eventStart >= beatStart - 0.000001 && eventStart < beatEnd - 0.000001;
      })
      .map((event) => ({ ...event, startQuarter: measureOffset + event.startQuarter - beatStart }));
  }).sort((first, second) => first.startQuarter - second.startQuarter);
}

export function scoreNotationEvents(events: readonly ScoreRhythmEvent[]): NoteNotationEvent[] {
  return events.map((event) => ({
    startQuarter: event.startQuarter,
    durationQuarter: event.notationDurationQuarter ?? event.durationQuarter,
    ...(event.isRest ? { isRest: true } : {}),
    ...(event.tupletNumber === undefined ? {} : { tupletNumber: event.tupletNumber }),
    ...(event.tieToNext ? { tieToNext: true } : {}),
    ...(event.tieFromPrevious ? { tieFromPrevious: true } : {}),
  }));
}

export function scoreFromMeasure(
  score: ImportedRhythmScore,
  startMeasureIndex: number,
): ImportedRhythmScore {
  const firstMeasure = score.measures[startMeasureIndex];
  if (!firstMeasure) throw new RangeError('Choose a bar that exists in this score.');

  return {
    ...score,
    measures: score.measures.slice(startMeasureIndex).map((measure) => ({
      ...measure,
      startQuarter: measure.startQuarter - firstMeasure.startQuarter,
    })),
    totalQuarterNotes: Math.max(0, score.totalQuarterNotes - firstMeasure.startQuarter),
  };
}

export function findNextScoreEvent(
  measure: ScoreRhythmMeasure,
  nextMeasure: ScoreRhythmMeasure | undefined,
  hand: Hand,
  quarterInMeasure: number,
): ScoreRhythmEvent | undefined {
  const events = (current: ScoreRhythmMeasure) =>
    [...(hand === 'left' ? current.leftEvents : current.rightEvents)].sort((left, right) => left.startQuarter - right.startQuarter);
  const currentEvents = events(measure);
  const activeEvent = currentEvents.find((event) =>
    event.startQuarter <= quarterInMeasure + 0.000001 &&
    event.startQuarter + event.durationQuarter > quarterInMeasure + 0.000001,
  );
  const upcomingEvent = currentEvents.find((event) => event.startQuarter >= quarterInMeasure - 0.000001);

  return activeEvent ?? upcomingEvent ?? (nextMeasure ? events(nextMeasure)[0] : undefined);
}
