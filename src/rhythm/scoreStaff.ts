import type { Hand } from '@/types/rhythm';
import type { ImportedRhythmScore, ScoreRhythmEvent, ScoreRhythmMeasure } from '@/types/importedScore';
import type { NoteNotationEvent } from '@/rhythm/noteNotation';

export type ScoreDisplayMode = 'focus' | 'staff';

export function scoreNotationEvents(events: readonly ScoreRhythmEvent[]): NoteNotationEvent[] {
  return events.filter((event) => !event.isRest).map((event) => ({
    startQuarter: event.startQuarter,
    durationQuarter: event.notationDurationQuarter ?? event.durationQuarter,
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
