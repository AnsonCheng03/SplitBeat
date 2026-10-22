export const SUBDIVISIONS = ['quarter', 'eighth', 'triplet', 'sixteenth'] as const;

export type Subdivision = (typeof SUBDIVISIONS)[number];
export type Hand = 'left' | 'right';
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
  durationSeconds: DurationOption;
  changeIntervalBeats: ChangeIntervalBeats;
  enabledSubdivisions: Subdivision[];
  soundEnabled: boolean;
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
  left: HandStats;
  right: HandStats;
  stable: AccuracyStats;
  transition: AccuracyStats;
  combinations: CombinationStats[];
  durationSeconds: number;
}

export interface SessionSnapshot {
  phase: 'countdown' | 'running' | 'finished';
  bpm: number;
  beatIndex: number;
  beatInBar: number;
  currentStep: ExerciseStep;
  beatsUntilChange: number;
  secondsRemaining: number | null;
  leftAccuracy: number;
  rightAccuracy: number;
  leftStats: HandStats;
  rightStats: HandStats;
  countdown: number | 'START' | null;
  results?: SessionResults;
}
