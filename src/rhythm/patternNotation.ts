import {
  isTupletSubdivision,
  pulseQuarterNotes,
  subdivisionOffsetMs,
  SUBDIVISION_COUNTS,
  timeSignatureMetrics,
  tupletCount,
} from '@/rhythm/subdivisions';
import type { NoteNotationEvent } from '@/rhythm/noteNotation';
import type { ExerciseStep, Hand, RhythmicFeel, Subdivision, TimeSignature } from '@/types/rhythm';

export function createSubdivisionBarEvents(
  subdivision: Subdivision,
  timeSignature: TimeSignature,
  feel: RhythmicFeel,
): NoteNotationEvent[] {
  const beatsPerBar = timeSignatureMetrics(60, timeSignature).beatsPerBar;
  const pulse = pulseQuarterNotes(timeSignature);
  const barDurationQuarter = beatsPerBar * pulse;

  if (isTupletSubdivision(subdivision)) {
    const count = tupletCount(subdivision);
    return Array.from({ length: beatsPerBar * count }, (_, index) => {
      const beat = Math.floor(index / count);
      const noteIndex = index % count;
      return {
        startQuarter: beat * pulse + (noteIndex * pulse) / count,
        durationQuarter: pulse / count,
        tupletNumber: count,
      };
    });
  }

  const divisions = SUBDIVISION_COUNTS[subdivision];
  const durationQuarter = 1 / divisions;
  const events: NoteNotationEvent[] = [];
  for (let quarterStart = 0; quarterStart < barDurationQuarter - 1e-9; quarterStart += 1) {
    for (let noteIndex = 0; noteIndex < divisions; noteIndex += 1) {
      const startQuarter = quarterStart + subdivisionOffsetMs(1, subdivision, noteIndex, feel);
      if (startQuarter >= barDurationQuarter - 1e-9) continue;
      events.push({ startQuarter, durationQuarter });
    }
  }
  return events;
}

export function durationOfSubdivisionBar(timeSignature: TimeSignature): number {
  return timeSignatureMetrics(60, timeSignature).beatsPerBar * pulseQuarterNotes(timeSignature);
}

export function createExerciseBarEvents({
  steps,
  hand,
  barStartBeat,
  timeSignature,
  feel,
  restBetweenChanges,
}: {
  steps: readonly ExerciseStep[];
  hand: Hand;
  barStartBeat: number;
  timeSignature: TimeSignature;
  feel: RhythmicFeel;
  restBetweenChanges: boolean;
}): NoteNotationEvent[] {
  const metrics = timeSignatureMetrics(60, timeSignature);
  const pulse = pulseQuarterNotes(timeSignature);
  const barDurationQuarter = metrics.beatsPerBar * pulse;
  const barEndBeat = barStartBeat + metrics.beatsPerBar;
  const events: NoteNotationEvent[] = [];

  for (const step of steps) {
    const stepEndBeat = step.startBeat + step.durationBeats;
    if (stepEndBeat <= barStartBeat || step.startBeat >= barEndBeat) continue;
    const followingStepExists = steps.some((candidate) => candidate.startBeat === stepEndBeat);
    const restBeatOffset = restBetweenChanges && followingStepExists ? step.durationBeats - 1 : -1;
    const subdivision = hand === 'left' ? step.leftSubdivision : step.rightSubdivision;
    const stepStartQuarter = (step.startBeat - barStartBeat) * pulse;
    const stepEndQuarter = stepStartQuarter + step.durationBeats * pulse;

    if (isTupletSubdivision(subdivision)) {
      const count = tupletCount(subdivision);
      for (let beatOffset = 0; beatOffset < step.durationBeats; beatOffset += 1) {
        if (beatOffset === restBeatOffset) continue;
        const absoluteBeat = step.startBeat + beatOffset;
        if (absoluteBeat < barStartBeat || absoluteBeat >= barEndBeat) continue;
        for (let noteIndex = 0; noteIndex < count; noteIndex += 1) {
          events.push({
            startQuarter: (absoluteBeat - barStartBeat) * pulse + (noteIndex * pulse) / count,
            durationQuarter: pulse / count,
            tupletNumber: count,
          });
        }
      }
      continue;
    }

    const divisions = SUBDIVISION_COUNTS[subdivision];
    const durationQuarter = 1 / divisions;
    for (let quarterOffset = 0; ; quarterOffset += 1) {
      const quarterStart = stepStartQuarter + quarterOffset;
      if (quarterStart >= stepEndQuarter || quarterStart >= barDurationQuarter) break;
      for (let noteIndex = 0; noteIndex < divisions; noteIndex += 1) {
        const startQuarter = quarterStart + subdivisionOffsetMs(1, subdivision, noteIndex, feel);
        if (startQuarter < -1e-9 || startQuarter >= barDurationQuarter - 1e-9) continue;
        const elapsedBeats = (startQuarter - stepStartQuarter) / pulse;
        const beatOffset = Math.floor(elapsedBeats + 1e-9);
        if (beatOffset === restBeatOffset || startQuarter >= stepEndQuarter - 1e-9) continue;
        events.push({ startQuarter, durationQuarter });
      }
    }
  }

  return events.sort((first, second) => first.startQuarter - second.startQuarter);
}
