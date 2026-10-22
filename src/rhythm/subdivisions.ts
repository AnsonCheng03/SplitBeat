import type { RhythmicFeel, Subdivision, TimeSignature } from '@/types/rhythm';

export const SUBDIVISION_LABELS: Record<Subdivision, string> = {
  quarter: 'Quarter (Crotchet)',
  eighth: 'Quaver (Eighth)',
  triplet: 'Triplet',
  sixteenth: 'Semiquaver (16th)',
  thirtySecond: 'Demisemiquaver (32nd)',
  sixtyFourth: 'Hemidemisemiquaver (64th)',
};

export const SUBDIVISION_COUNTS: Record<Subdivision, number> = {
  quarter: 1,
  eighth: 2,
  triplet: 3,
  sixteenth: 4,
  thirtySecond: 8,
  sixtyFourth: 16,
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

export function subdivisionIntervalMs(
  bpm: number,
  subdivision: Subdivision,
  timeSignature: TimeSignature = '4/4',
): number {
  return timeSignatureMetrics(bpm, timeSignature).quarterNoteDurationMs / SUBDIVISION_COUNTS[subdivision];
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
  const metrics = timeSignatureMetrics(bpm, timeSignature);
  const divisions = SUBDIVISION_COUNTS[subdivision];
  return (
    sessionStartTime +
    beatIndex * metrics.beatDurationMs +
    (subdivisionIndex * metrics.quarterNoteDurationMs) / divisions
  );
}
