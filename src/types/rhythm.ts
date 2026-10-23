import type { ScoreRhythmMeasure } from '@/types/importedScore';

export const TUPLET_SUBDIVISIONS = [
  'duplet',
  'triplet',
  'quadruplet',
  'quintuplet',
  'sextuplet',
  'septuplet',
  'octuplet',
  'nonuplet',
] as const;

export type TupletSubdivision = (typeof TUPLET_SUBDIVISIONS)[number];

export const SUBDIVISIONS = [
  'quarter',
  'eighth',
  'sixteenth',
  'thirtySecond',
  'sixtyFourth',
  ...TUPLET_SUBDIVISIONS,
] as const;

export type Subdivision = (typeof SUBDIVISIONS)[number];
export const TIME_SIGNATURES = [
  '2/4',
  '3/4',
  '4/4',
  '5/4',
  '7/4',
  '2/2',
  '3/8',
  '6/8',
  '9/8',
  '12/8',
] as const;

export type TimeSignature = (typeof TIME_SIGNATURES)[number];
export type Hand = 'left' | 'right';
export type TrainingMode = 'two-hand' | 'single-hand';
export type TapFeedback = 'hit' | 'miss' | 'ignored';
export type SoundPreset = 'wood' | 'beep' | 'bell' | 'soft';
export type RhythmicFeel = 'straight' | 'swing';
export type DurationOption = 30 | 60 | 120 | 'endless';
export type ChangeIntervalBeats = 1 | 2 | 4 | 8;

export interface ExerciseStep {
  id: string;
  leftSubdivision: Subdivision;
  rightSubdivision: Subdivision;
  startBeat: number;
  durationBeats: number;
}

export interface ExerciseSettings {
  bpm: number;
  timeSignature: TimeSignature;
  durationSeconds: DurationOption;
  changeIntervalBeats: ChangeIntervalBeats;
  restBetweenChanges: boolean;
  enabledSubdivisions: Subdivision[];
  feel: RhythmicFeel;
  graceNotesEnabled: boolean;
  trainingMode: TrainingMode;
  singleHand: Hand;
  soundEnabled: boolean;
  metronomeSound: SoundPreset;
  leftHandSound: SoundPreset;
  rightHandSound: SoundPreset;
  leftTapOffsetMs: number;
  rightTapOffsetMs: number;
  goodWindowMs: number;
  hapticsEnabled: boolean;
}

export interface HandStats {
  totalExpected: number;
  totalHit: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  averageAbsoluteErrorMs: number;
  averageSignedErrorMs: number;
}

export interface AccuracyStats {
  totalExpected: number;
  totalHit: number;
}

export interface CombinationStats {
  leftSubdivision: Subdivision;
  rightSubdivision: Subdivision;
  left: AccuracyStats;
  right: AccuracyStats;
}

export interface MissedEvent {
  id: string;
  hand: Hand;
  /** One-based bar number in the played session. */
  barIndex: number;
  /** Zero-based metronome-beat position inside the bar. */
  beatInBar: number;
  /** Omitted for score notes, whose printed value can be mixed within a bar. */
  subdivision?: Subdivision;
  durationQuarter?: number;
  tupletNumber?: number;
  /** Kept only in the active result session to replay imported score pitches. */
  midiPitches?: number[];
  isScoreEvent: boolean;
}

export interface SessionResults {
  bpm: number;
  timeSignature: TimeSignature;
  feel: RhythmicFeel;
  graceNotesEnabled: boolean;
  restBetweenChanges: boolean;
  trainingMode: TrainingMode;
  singleHand: Hand;
  left: HandStats;
  right: HandStats;
  stable: AccuracyStats;
  transition: AccuracyStats;
  combinations: CombinationStats[];
  durationSeconds: number;
  missedEvents: MissedEvent[];
  source?: 'score';
  scoreTitle?: string;
}

export interface SessionSnapshot {
  phase: 'countdown' | 'running' | 'finished';
  bpm: number;
  timeSignature: TimeSignature;
  beatsPerBar: number;
  beatIndex: number;
  beatInBar: number;
  isRest: boolean;
  currentStep: ExerciseStep;
  barStartBeat: number;
  barSteps: ExerciseStep[];
  nextStep: ExerciseStep | null;
  beatsUntilChange: number;
  secondsUntilChange: number | null;
  secondsRemaining: number | null;
  leftAccuracy: number;
  rightAccuracy: number;
  leftStats: HandStats;
  rightStats: HandStats;
  countdown: number | 'START' | null;
  results?: SessionResults;
  scoreMeasure?: ScoreRhythmMeasure;
  scorePreviousMeasure?: ScoreRhythmMeasure;
  scoreNextMeasure?: ScoreRhythmMeasure;
  /** Monotonic bar number across score repeats, used to advance the score view at bar lines. */
  scoreMeasureSequence?: number;
  scoreMeasureNumber?: number;
  scoreMeasureCount?: number;
  scoreTitle?: string;
}
