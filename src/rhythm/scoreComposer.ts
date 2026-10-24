import type { ImportedRhythmScore, ScoreRhythmEvent, ScoreRhythmMeasure } from '@/types/importedScore';
import type { Hand, TimeSignature, TrainingMode, TupletSubdivision } from '@/types/rhythm';
import { TUPLET_SUBDIVISIONS } from '@/types/rhythm';
import { pulseQuarterNotes, SUBDIVISION_LABELS, timeSignatureMetrics, tupletCount } from '@/rhythm/subdivisions';

const SCORE_MEASURE_LIMIT = 2_000;
const EPSILON = 0.000001;

export interface NoteValueSymbol {
  id: string;
  label: string;
  durationQuarter: number;
}

export const NOTE_VALUE_SYMBOLS: readonly NoteValueSymbol[] = [
  { id: 'whole', label: 'Whole', durationQuarter: 4 },
  { id: 'dottedHalf', label: 'Dotted half', durationQuarter: 3 },
  { id: 'half', label: 'Half', durationQuarter: 2 },
  { id: 'dottedQuarter', label: 'Dotted quarter', durationQuarter: 1.5 },
  { id: 'quarter', label: 'Quarter', durationQuarter: 1 },
  { id: 'dottedEighth', label: 'Dotted eighth', durationQuarter: 0.75 },
  { id: 'eighth', label: 'Eighth', durationQuarter: 0.5 },
  { id: 'dottedSixteenth', label: 'Dotted sixteenth', durationQuarter: 0.375 },
  { id: 'sixteenth', label: 'Sixteenth', durationQuarter: 0.25 },
  { id: 'dottedThirtySecond', label: 'Dotted 32nd', durationQuarter: 0.1875 },
  { id: 'thirtySecond', label: '32nd', durationQuarter: 0.125 },
  { id: 'sixtyFourth', label: '64th', durationQuarter: 0.0625 },
];

const WRITTEN_NOTE_DURATIONS = NOTE_VALUE_SYMBOLS
  .map(({ durationQuarter }) => durationQuarter)
  .sort((first, second) => second - first);

export interface ComposerTupletSymbol {
  id: TupletSubdivision;
  label: string;
}

export const COMPOSER_TUPLET_SYMBOLS: readonly ComposerTupletSymbol[] = TUPLET_SUBDIVISIONS.map((id) => ({
  id,
  label: SUBDIVISION_LABELS[id],
}));

export type ComposerSymbolId = NoteValueSymbol['id'] | TupletSubdivision;

export interface ComposedNoteValue {
  /** Written note/rest length in quarter notes. */
  durationQuarter: number;
  isRest?: boolean;
  tupletNumber?: number;
}

/** Expand a selected note icon into the events it contributes to the hand's timeline. */
export function noteValuesForSymbol(
  symbolId: ComposerSymbolId,
  timeSignature: TimeSignature,
  asRest = false,
): ComposedNoteValue[] {
  const noteValue = NOTE_VALUE_SYMBOLS.find((symbol) => symbol.id === symbolId);
  if (noteValue) return [{ durationQuarter: noteValue.durationQuarter, ...(asRest ? { isRest: true } : {}) }];

  const tuplet = TUPLET_SUBDIVISIONS.find((subdivision) => subdivision === symbolId);
  if (!tuplet) return [];
  const count = tupletCount(tuplet);
  const groupDuration = pulseQuarterNotes(timeSignature);
  if (asRest) return [{ durationQuarter: groupDuration, isRest: true }];
  return Array.from({ length: count }, () => ({
    durationQuarter: groupDuration / count,
    tupletNumber: count,
  }));
}

export interface ComposeRhythmScoreOptions {
  title?: string;
  timeSignature: TimeSignature;
  trainingMode: TrainingMode;
  singleHand: Hand;
  left: readonly ComposedNoteValue[];
  right: readonly ComposedNoteValue[];
}

export type ComposeRhythmScoreResult =
  | { ok: true; score: ImportedRhythmScore }
  | { ok: false; error: string };

interface PlacedHandEvents {
  eventsByMeasure: ScoreRhythmEvent[][];
  totalQuarterNotes: number;
  hasPlayedNote: boolean;
}

/** Place a hand's symbols in sequence, creating a new bar whenever its duration fills the current one. */
function placeHandEvents(
  items: readonly ComposedNoteValue[],
  barLength: number,
  measureCount: number,
): PlacedHandEvents {
  const eventsByMeasure = Array.from({ length: measureCount }, () => [] as ScoreRhythmEvent[]);
  let cursor = 0;
  let hasPlayedNote = false;

  for (const item of items) {
    if (!Number.isFinite(item.durationQuarter) || item.durationQuarter <= 0) {
      throw new RangeError('Every note and rest must have a positive duration.');
    }
    if (item.tupletNumber !== undefined && (!Number.isInteger(item.tupletNumber) || item.tupletNumber < 2 || item.tupletNumber > 16)) {
      throw new RangeError('Tuplet groups must contain between 2 and 16 notes.');
    }
    if (!item.isRest) hasPlayedNote = true;

    const itemStart = cursor;
    let remaining = item.durationQuarter;
    let isInitialSegment = true;

    while (remaining > EPSILON) {
      const measureIndex = Math.floor((cursor + EPSILON) / barLength);
      if (measureIndex >= measureCount) {
        throw new RangeError(`Your notes are longer than ${SCORE_MEASURE_LIMIT} bars.`);
      }
      const measureStart = measureIndex * barLength;
      const startQuarter = Math.max(0, cursor - measureStart);
      const segmentDuration = Math.min(remaining, barLength - startQuarter);
      if (segmentDuration <= EPSILON) break;
      const continues = remaining > segmentDuration + EPSILON;

      const writtenSegments = item.tupletNumber === undefined
        ? decomposeWrittenDuration(segmentDuration)
        : [segmentDuration];
      if (!writtenSegments) {
        throw new RangeError('This length cannot be written with the available note values.');
      }

      let writtenOffset = 0;
      for (let segmentIndex = 0; segmentIndex < writtenSegments.length; segmentIndex += 1) {
        const writtenDuration = writtenSegments[segmentIndex]!;
        const isLastWrittenSegment = segmentIndex === writtenSegments.length - 1;
        const isInitialEvent = isInitialSegment && segmentIndex === 0;
        const continuesAfterSegment = !isLastWrittenSegment || continues;
        eventsByMeasure[measureIndex]!.push({
          startQuarter: startQuarter + writtenOffset,
          durationQuarter: isInitialEvent ? item.durationQuarter : writtenDuration,
          ...(!isInitialEvent || continuesAfterSegment ? { notationDurationQuarter: writtenDuration } : {}),
          ...(item.isRest ? { isRest: true } : {}),
          ...(item.tupletNumber === undefined ? {} : { tupletNumber: item.tupletNumber }),
          ...(!item.isRest && continuesAfterSegment ? { tieToNext: true } : {}),
          ...(!item.isRest && !isInitialEvent ? {
            tieFromPrevious: true,
            isTieContinuation: true,
            ...(measureIndex > Math.floor((itemStart + EPSILON) / barLength)
              ? { isCrossBarTieContinuation: true }
              : {}),
          } : {}),
        });
        writtenOffset += writtenDuration;
        isInitialSegment = false;
      }

      cursor += segmentDuration;
      remaining -= segmentDuration;
      isInitialSegment = false;
    }

    // Avoid harmless floating point noise at bar boundaries and keep the next note on the next bar.
    if (Math.abs(cursor / barLength - Math.round(cursor / barLength)) < EPSILON) {
      cursor = Math.round(cursor / barLength) * barLength;
    }
    if (cursor < itemStart) throw new RangeError('The note sequence could not be placed.');
  }

  return { eventsByMeasure, totalQuarterNotes: cursor, hasPlayedNote };
}

function decomposeWrittenDuration(durationQuarter: number): number[] | null {
  let remaining = durationQuarter;
  const segments: number[] = [];
  for (const noteDuration of WRITTEN_NOTE_DURATIONS) {
    while (remaining >= noteDuration - EPSILON) {
      segments.push(noteDuration);
      remaining -= noteDuration;
      if (remaining < EPSILON) return segments;
    }
  }
  return remaining < EPSILON ? segments : null;
}

/** Create a pitch-free score from note icons; each hand advances independently across measures. */
export function composeRhythmScore(options: ComposeRhythmScoreOptions): ComposeRhythmScoreResult {
  const leftActive = options.trainingMode === 'two-hand' || options.singleHand === 'left';
  const rightActive = options.trainingMode === 'two-hand' || options.singleHand === 'right';
  const meter = timeSignatureMetrics(60, options.timeSignature);
  const barLength = meter.beatsPerBar * pulseQuarterNotes(options.timeSignature);
  const leftInput = leftActive ? options.left : [];
  const rightInput = rightActive ? options.right : [];

  try {
    const leftDuration = leftInput.reduce((total, item) => total + item.durationQuarter, 0);
    const rightDuration = rightInput.reduce((total, item) => total + item.durationQuarter, 0);
    const longestHand = Math.max(leftDuration, rightDuration);
    if (longestHand <= EPSILON) {
      return { ok: false, error: 'Add at least one note to the active hand or hands.' };
    }

    const measureCount = Math.max(1, Math.ceil(longestHand / barLength - EPSILON));
    if (measureCount > SCORE_MEASURE_LIMIT) {
      return { ok: false, error: `Your notes are longer than ${SCORE_MEASURE_LIMIT} bars.` };
    }

    const left = placeHandEvents(leftInput, barLength, measureCount);
    const right = placeHandEvents(rightInput, barLength, measureCount);
    if (!left.hasPlayedNote && !right.hasPlayedNote) {
      return { ok: false, error: 'Add at least one note to the active hand or hands.' };
    }

    const measures: ScoreRhythmMeasure[] = Array.from({ length: measureCount }, (_, index) => ({
      index,
      startQuarter: index * barLength,
      durationQuarter: barLength,
      leftEvents: left.eventsByMeasure[index]!,
      rightEvents: right.eventsByMeasure[index]!,
    }));

    return {
      ok: true,
      score: {
        formatVersion: 1,
        title: options.title?.trim() || 'Composed rhythm',
        timeSignature: options.timeSignature,
        trackCount: options.trainingMode === 'two-hand' ? 2 : 1,
        bpm: null,
        measures,
        totalQuarterNotes: measureCount * barLength,
        warnings: [],
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Check the note sequence and try again.' };
  }
}
