import type { ScoreRhythmMeasure } from '@/types/importedScore';

export const SUBDIVISIONS = [
  'quarter',
  'eighth',
  'triplet',
  'sixteenth',
  'thirtySecond',
  'sixtyFourth',
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
  enabledSubdivisions: Subdivision[];
  feel: RhythmicFeel;
  graceNotesEnabled: boolean;
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

export interface SessionResults {
  bpm: number;
  timeSignature: TimeSignature;
  feel: RhythmicFeel;
  graceNotesEnabled: boolean;
  left: HandStats;
  right: HandStats;
  stable: AccuracyStats;
  transition: AccuracyStats;
  combinations: CombinationStats[];
  durationSeconds: number;
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
  currentStep: ExerciseStep;
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
  scoreMeasureNumber?: number;
  scoreMeasureCount?: number;
  scoreTitle?: string;
}
