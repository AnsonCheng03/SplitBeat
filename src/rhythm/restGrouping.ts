import type { NoteNotationEvent } from '@/rhythm/noteNotation';

const EPSILON = 0.000001;

const WRITTEN_REST_DURATIONS = [
  4,
  3,
  2,
  1.5,
  1,
  0.75,
  0.5,
  0.375,
  0.25,
  0.1875,
  0.125,
  0.09375,
  0.0625,
];

function hasWrittenRestValue(durationQuarter: number): boolean {
  return WRITTEN_REST_DURATIONS.some((writtenDuration) =>
    Math.abs(writtenDuration - durationQuarter) < EPSILON,
  );
}

function belongsToSameBeat(startQuarter: number, groupStartQuarter: number, beatDurationQuarter: number): boolean {
  return Math.floor((startQuarter + EPSILON) / beatDurationQuarter)
    === Math.floor((groupStartQuarter + EPSILON) / beatDurationQuarter);
}

function endsWithinBeat(event: NoteNotationEvent, beatDurationQuarter: number): boolean {
  const beatIndex = Math.floor((event.startQuarter + EPSILON) / beatDurationQuarter);
  const beatEndQuarter = (beatIndex + 1) * beatDurationQuarter;
  return event.startQuarter + event.durationQuarter <= beatEndQuarter + EPSILON;
}

function canJoinRestRun(event: NoteNotationEvent): boolean {
  return event.isRest === true && !event.tieToNext && !event.tieFromPrevious;
}

function restRunDuration(events: readonly NoteNotationEvent[]): number {
  const first = events[0];
  const last = events.at(-1);
  if (!first || !last) return 0;
  return last.startQuarter + last.durationQuarter - first.startQuarter;
}

function isRestRunContiguous(events: readonly NoteNotationEvent[]): boolean {
  return events.slice(1).every((event, index) => {
    const previous = events[index];
    return previous !== undefined
      && Math.abs(previous.startQuarter + previous.durationQuarter - event.startQuarter) < EPSILON;
  });
}

/** Combines adjacent rests into one written value, but never across a beat boundary. */
export function groupAdjacentRestsWithinBeat(
  orderedEvents: readonly NoteNotationEvent[],
  beatDurationQuarter: number,
): NoteNotationEvent[] {
  if (!Number.isFinite(beatDurationQuarter) || beatDurationQuarter <= 0) {
    throw new RangeError('Rest groups must have a positive beat duration.');
  }

  const groupedEvents: NoteNotationEvent[] = [];
  let eventIndex = 0;

  while (eventIndex < orderedEvents.length) {
    const first = orderedEvents[eventIndex];
    if (!first || !canJoinRestRun(first) || !endsWithinBeat(first, beatDurationQuarter)) {
      if (first) groupedEvents.push(first);
      eventIndex += 1;
      continue;
    }

    const restRun = [first];
    let nextIndex = eventIndex + 1;
    while (nextIndex < orderedEvents.length) {
      const previous = restRun.at(-1);
      const next = orderedEvents[nextIndex];
      if (!previous || !next || !canJoinRestRun(next)) break;
      if (!belongsToSameBeat(next.startQuarter, first.startQuarter, beatDurationQuarter)) break;
      if (!endsWithinBeat(next, beatDurationQuarter)) break;
      if (Math.abs(previous.startQuarter + previous.durationQuarter - next.startQuarter) >= EPSILON) break;
      restRun.push(next);
      nextIndex += 1;
    }

    const combinedDuration = restRunDuration(restRun);
    if (restRun.length > 1 && isRestRunContiguous(restRun) && hasWrittenRestValue(combinedDuration)) {
      groupedEvents.push({
        startQuarter: first.startQuarter,
        durationQuarter: combinedDuration,
        isRest: true,
      });
      eventIndex = nextIndex;
      continue;
    }

    groupedEvents.push(...restRun);
    eventIndex += restRun.length;
  }

  return groupedEvents;
}
