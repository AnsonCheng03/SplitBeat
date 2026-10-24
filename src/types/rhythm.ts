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
export const MIXTURE_PATTERN_IDS = [
  'dottedQuaverSemiquaver',
  'semiquaverTwoDemisemiquavers',
  'semiquaverDemisemiquaverRestDemisemiquaver',
] as const;
export type MixturePatternId = (typeof MIXTURE_PATTERN_IDS)[number];
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
export type PracticeDisplayMode = 'rhythm' | 'score';
export type TapFeedback = 'hit' | 'miss' | 'ignored';
export type SoundPreset = 'wood' | 'beep' | 'bell' | 'soft';
export type FlashSource = 'tap' | 'beat';
export type RhythmicFeel = 'straight' | 'swing';
export type DurationOption = 30 | 60 | 120 | 'endless';
export type ChangeIntervalBeats = 1 | 2 | 4 | 8;
export type ChallengeAction = 'off' | 'pause' | 'stop';
export type ChallengeMissStreak = 1 | 2 | 3 | 5;

export interface ExerciseStep {
  id: string;
  leftSubdivision: Subdivision;
  rightSubdivision: Subdivision;
  leftRest: boolean;
  rightRest: boolean;
  leftMixture?: MixturePatternId;
  rightMixture?: MixturePatternId;
  startBeat: number;
  durationBeats: number;
}

export interface ReferenceRhythmEvent {
  id: string;
  hand: Hand;
  expectedTimeMs: number;
  midiPitches?: readonly number[];
}

export interface RhythmPatternPair {
  leftSubdivision: Subdivision;
  rightSubdivision: Subdivision;
  leftRest?: boolean;
  rightRest?: boolean;
  leftMixture?: MixturePatternId;
  rightMixture?: MixturePatternId;
}

export interface ExerciseSettings {
  bpm: number;
  timeSignature: TimeSignature;
  durationSeconds: DurationOption;
  changeIntervalBeats: ChangeIntervalBeats;
  restBetweenChanges: boolean;
  handRestsEnabled: boolean;
  enabledSubdivisions: Subdivision[];
  enabledMixtures: MixturePatternId[];
  feel: RhythmicFeel;
  graceNotesEnabled: boolean;
  trainingMode: TrainingMode;
  practiceDisplayMode: PracticeDisplayMode;
  singleHand: Hand;
  soundEnabled: boolean;
  backgroundMusicEnabled: boolean;
  sessionCuesEnabled: boolean;
  metronomeSound: SoundPreset;
  leftHandSound: SoundPreset;
  rightHandSound: SoundPreset;
  leftFlashSource: FlashSource;
  rightFlashSource: FlashSource;
  tapResultFlashEnabled: boolean;
  referenceRhythmEnabled: boolean;
  challengeAction: ChallengeAction;
  challengeMissStreak: ChallengeMissStreak;
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
  leftRest: boolean;
  rightRest: boolean;
  leftMixture?: MixturePatternId;
  rightMixture?: MixturePatternId;
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
  isScoreEvent: boolean;
}

export interface ReplayExpectedEvent extends MissedEvent {
  /** Expected timestamp in the monotonic session clock, used to calculate clean streaks. */
  expectedTimeMs: number;
  /** Duration used to draw the expected rhythm in the replay timeline. */
  durationQuarter: number;
  matched: boolean;
  /** Calibrated error used for scoring; negative is early and positive is late. */
  timingErrorMs?: number;
  /** Hidden score pitches, retained only for this session's replay. */
  midiPitches?: number[];
}

export interface ReplayTap {
  id: string;
  hand: Hand;
  barIndex: number;
  /** Actual click timestamp relative to session start, in milliseconds. */
  timestampMs: number;
  /** Event accepted by scoring, when this click matched an expected note. */
  matchedEventId?: string;
  /** Raw click error against its matched note, before calibration correction. */
  timingErrorMs?: number;
  /** Score pitches played by this tap, when it matched an imported score note. */
  midiPitches?: number[];
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
  /** Longest run of correct expected notes without a miss or off-beat tap. */
  longestCorrectStreak: number;
  /** True when this was a pattern challenge session eligible for Game Center. */
  challengeMode: boolean;
  combinations: CombinationStats[];
  durationSeconds: number;
  missedEvents: MissedEvent[];
  /** In-memory replay data; deliberately omitted from saved session history. */
  replayExpectedEvents?: ReplayExpectedEvent[];
  replayTaps?: ReplayTap[];
  source?: 'score';
  scoreTitle?: string;
}

export interface SessionSnapshot {
  phase: 'countdown' | 'running' | 'paused' | 'finished';
  resumeCountIn?: boolean;
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
  challengeMessage?: string;
  results?: SessionResults;
  scoreMeasure?: ScoreRhythmMeasure;
  scorePreviousMeasure?: ScoreRhythmMeasure;
  scoreNextMeasure?: ScoreRhythmMeasure;
  /** Current and following measures used to fill the visible rhythm strip. */
  scoreUpcomingMeasures?: ScoreRhythmMeasure[];
  /** Zero-based score bar index, used to advance the score view only at bar lines. */
  scoreMeasureSequence?: number;
  scoreMeasureNumber?: number;
  scoreMeasureCount?: number;
  /** Current fractional quarter-note position inside the displayed score measure. */
  scoreQuarterInMeasure?: number;
  scoreTitle?: string;
  /** Generated, unpitched notation bars for normal practice score display. */
  practiceScoreMeasure?: ScoreRhythmMeasure;
  practiceScorePreviousMeasure?: ScoreRhythmMeasure;
  practiceScoreNextMeasure?: ScoreRhythmMeasure;
  practiceScoreUpcomingMeasures?: ScoreRhythmMeasure[];
  practiceScoreSequence?: number;
  practiceScoreCount?: number;
}
