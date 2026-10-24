import { TUPLET_SUBDIVISIONS } from '@/types/rhythm';
import type { RhythmicFeel, Subdivision, TimeSignature, TupletSubdivision } from '@/types/rhythm';

export const SUBDIVISION_LABELS: Record<Subdivision, string> = {
  quarter: 'Quarter (Crotchet)',
  eighth: 'Quaver (Eighth)',
  duplet: 'Duplet (2)',
  triplet: 'Triplet (3)',
  quadruplet: 'Quadruplet (4)',
  quintuplet: 'Quintuplet (5)',
  sextuplet: 'Sextuplet (6)',
  septuplet: 'Septuplet (7)',
  octuplet: 'Octuplet (8)',
  nonuplet: 'Nonuplet (9)',
  sixteenth: 'Semiquaver (16th)',
  thirtySecond: 'Demisemiquaver (32nd)',
  sixtyFourth: 'Hemidemisemiquaver (64th)',
};

export const SUBDIVISION_COUNTS: Record<Subdivision, number> = {
  quarter: 1,
  eighth: 2,
  duplet: 2,
  triplet: 3,
  quadruplet: 4,
  quintuplet: 5,
  sextuplet: 6,
  septuplet: 7,
  octuplet: 8,
  nonuplet: 9,
  sixteenth: 4,
  thirtySecond: 8,
  sixtyFourth: 16,
};

export function patternLabel(subdivision: Subdivision, rest = false): string {
  return rest ? 'Rest' : SUBDIVISION_LABELS[subdivision];
}

export const TUPLET_COUNTS: Record<TupletSubdivision, number> = {
  duplet: 2,
  triplet: 3,
  quadruplet: 4,
  quintuplet: 5,
  sextuplet: 6,
  septuplet: 7,
  octuplet: 8,
  nonuplet: 9,
};

interface TimeSignatureDefinition {
  numerator: number;
  denominator: 2 | 4 | 8;
  beatsPerBar: number;
  pulseQuarterNotes: number;
  compound: boolean;
}

const TIME_SIGNATURE_DEFINITIONS: Record<TimeSignature, TimeSignatureDefinition> = {
  '2/4': { numerator: 2, denominator: 4, beatsPerBar: 2, pulseQuarterNotes: 1, compound: false },
  '3/4': { numerator: 3, denominator: 4, beatsPerBar: 3, pulseQuarterNotes: 1, compound: false },
  '4/4': { numerator: 4, denominator: 4, beatsPerBar: 4, pulseQuarterNotes: 1, compound: false },
  '5/4': { numerator: 5, denominator: 4, beatsPerBar: 5, pulseQuarterNotes: 1, compound: false },
  '7/4': { numerator: 7, denominator: 4, beatsPerBar: 7, pulseQuarterNotes: 1, compound: false },
  '2/2': { numerator: 2, denominator: 2, beatsPerBar: 2, pulseQuarterNotes: 2, compound: false },
  '3/8': { numerator: 3, denominator: 8, beatsPerBar: 3, pulseQuarterNotes: 0.5, compound: false },
  '6/8': { numerator: 6, denominator: 8, beatsPerBar: 2, pulseQuarterNotes: 1.5, compound: true },
  '9/8': { numerator: 9, denominator: 8, beatsPerBar: 3, pulseQuarterNotes: 1.5, compound: true },
  '12/8': { numerator: 12, denominator: 8, beatsPerBar: 4, pulseQuarterNotes: 1.5, compound: true },
};

export interface TimeSignatureMetrics {
  numerator: number;
  denominator: 2 | 4 | 8;
  beatsPerBar: number;
  compound: boolean;
  beatDurationMs: number;
  quarterNoteDurationMs: number;
}

export function beatDurationMs(bpm: number): number {
  return 60_000 / bpm;
}

export function isTupletSubdivision(subdivision: Subdivision): subdivision is TupletSubdivision {
  return TUPLET_SUBDIVISIONS.includes(subdivision as TupletSubdivision);
}

export function tupletCount(subdivision: TupletSubdivision): number {
  return TUPLET_COUNTS[subdivision];
}

export function pulseQuarterNotes(timeSignature: TimeSignature): number {
  return TIME_SIGNATURE_DEFINITIONS[timeSignature].pulseQuarterNotes;
}

export function timeSignatureMetrics(
  bpm: number,
  timeSignature: TimeSignature = '4/4',
): TimeSignatureMetrics {
  const definition = TIME_SIGNATURE_DEFINITIONS[timeSignature];
  const metricBeatDuration = beatDurationMs(bpm);
  return {
    numerator: definition.numerator,
    denominator: definition.denominator,
    beatsPerBar: definition.beatsPerBar,
    compound: definition.compound,
    beatDurationMs: metricBeatDuration,
    quarterNoteDurationMs: metricBeatDuration / definition.pulseQuarterNotes,
  };
}

export function roundSessionDurationToBar(
  durationSeconds: number,
  bpm: number,
  timeSignature: TimeSignature,
): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;

  const metrics = timeSignatureMetrics(bpm, timeSignature);
  const barDurationSeconds = (metrics.beatsPerBar * metrics.beatDurationMs) / 1_000;
  const bars = Math.ceil(durationSeconds / barDurationSeconds - 1e-10);
  return bars * barDurationSeconds;
}

export function subdivisionIntervalMs(
  bpm: number,
  subdivision: Subdivision,
  timeSignature: TimeSignature = '4/4',
): number {
  const metrics = timeSignatureMetrics(bpm, timeSignature);
  return isTupletSubdivision(subdivision)
    ? metrics.beatDurationMs / tupletCount(subdivision)
    : metrics.quarterNoteDurationMs / SUBDIVISION_COUNTS[subdivision];
}

export function subdivisionIntervalQuarterNotes(
  subdivision: Subdivision,
  timeSignature: TimeSignature = '4/4',
): number {
  return isTupletSubdivision(subdivision)
    ? pulseQuarterNotes(timeSignature) / tupletCount(subdivision)
    : 1 / SUBDIVISION_COUNTS[subdivision];
}

export function subdivisionOffsetMs(
  quarterNoteDurationMs: number,
  subdivision: Subdivision,
  subdivisionIndex: number,
  feel: RhythmicFeel = 'straight',
): number {
  const divisions = SUBDIVISION_COUNTS[subdivision];
  const position = subdivisionIndex / divisions;
  if (feel !== 'swing' || divisions === 1 || divisions === 3) {
    return position * quarterNoteDurationMs;
  }

  const swungPosition =
    position <= 0.5
      ? position * (4 / 3)
      : 2 / 3 + (position - 0.5) * (2 / 3);
  return swungPosition * quarterNoteDurationMs;
}

export function expectedEventTimeMs(
  sessionStartTime: number,
  bpm: number,
  beatIndex: number,
  subdivisionIndex = 0,
  subdivision: Subdivision = 'quarter',
  timeSignature: TimeSignature = '4/4',
): number {
  if (isTupletSubdivision(subdivision)) {
    const metrics = timeSignatureMetrics(bpm, timeSignature);
    return (
      sessionStartTime +
      beatIndex * metrics.beatDurationMs +
      subdivisionIndex * metrics.beatDurationMs / tupletCount(subdivision)
    );
  }
  const metrics = timeSignatureMetrics(bpm, timeSignature);
  const divisions = SUBDIVISION_COUNTS[subdivision];
  return (
    sessionStartTime +
    beatIndex * metrics.beatDurationMs +
    (subdivisionIndex * metrics.quarterNoteDurationMs) / divisions
  );
}
