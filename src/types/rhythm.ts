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
export type LegacyMixturePatternId = (typeof MIXTURE_PATTERN_IDS)[number];
export type MixturePatternId = LegacyMixturePatternId | `mix1-${string}`;
export const MIXTURE_NOTE_VALUES = [
  'whole',
  'dottedHalf',
  'half',
  'dottedQuarter',
  'quarter',
  'dottedEighth',
  'eighth',
  'dottedSixteenth',
  'sixteenth',
  'dottedThirtySecond',
  'thirtySecond',
  'sixtyFourth',
] as const;
export type MixtureNoteValue = (typeof MIXTURE_NOTE_VALUES)[number];
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

export const SESSION_END_BAR_OPTIONS = [1, 2, 4, 8, 16, 32] as const;

export type TimeSignature = (typeof TIME_SIGNATURES)[number];
export type Hand = 'left' | 'right';
export type TrainingMode = 'two-hand' | 'single-hand';
export type PracticeDisplayMode = 'rhythm' | 'score';
export const SCORE_MOTION_MODES = ['slide', 'fade', 'slide-per-note'] as const;
export type ScoreMotionMode = (typeof SCORE_MOTION_MODES)[number];
export type TapFeedback = 'hit' | 'miss' | 'ignored';
export type TapInputSource = 'touch' | 'keyboard';
export type SoundPreset = 'wood' | 'beep' | 'bell' | 'soft';
export type FlashSource = 'tap' | 'beat';
export type RhythmicFeel = 'straight' | 'swing';
export type DurationOption = 30 | 60 | 120 | 'endless';
export type SessionEndMode = 'time' | 'bars';
export type SessionEndBarCount = (typeof SESSION_END_BAR_OPTIONS)[number];
export type ChangeIntervalBeats = 1 | 2 | 4 | 8;
export type ChallengeAction = 'off' | 'pause' | 'stop';
export type ChallengeTriggerMode = 'notes' | 'bars';
export type ChallengeMissStreak = 1 | 2 | 3 | 5;
export type ChallengeWrongBarStreak = 1 | 2 | 3 | 5;

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
  /** Selects whether a generated practice session ends by elapsed time or after a bar count. */
  sessionEndMode?: SessionEndMode;
  sessionEndBars?: SessionEndBarCount;
  changeIntervalBeats: ChangeIntervalBeats;
  restBetweenChanges: boolean;
  handRestsEnabled: boolean;
  enabledSubdivisions: Subdivision[];
  enabledMixtures: MixturePatternId[];
  /** Note values the automatic mixture generator can combine. */
  mixtureNoteValues?: MixtureNoteValue[];
  /** Whether generated mixtures may contain rests. */
  mixtureRestsEnabled?: boolean;
  feel: RhythmicFeel;
  graceNotesEnabled: boolean;
  trainingMode: TrainingMode;
  practiceDisplayMode: PracticeDisplayMode;
  /** How score bars advance during score practice. */
  scoreMotionMode?: ScoreMotionMode;
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
  challengeTriggerMode: ChallengeTriggerMode;
  challengeMissStreak: ChallengeMissStreak;
  challengeWrongBarStreak: ChallengeWrongBarStreak;
  leftTapOffsetMs: number;
  rightTapOffsetMs: number;
  /** Apply saved hand offsets when judging taps. */
  autoCalibrationEnabled: boolean;
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
  /** Note position within the bar when counted straight, retained for session-only rescoring. */
  straightBeatInBar?: number;
  /** Note position within the bar when counted with swing, retained for session-only rescoring. */
  swingBeatInBar?: number;
  /** Whether the event falls in the first two beats after a pattern change. */
  isTransition?: boolean;
  /** Pattern active when this event was expected. */
  pattern?: ReplayPattern;
  /** Duration used to draw the expected rhythm in the replay timeline. */
  durationQuarter: number;
  matched: boolean;
  /** False for notes later in a bar that was stopped before they were reached. */
  reached?: boolean;
  /** Calibrated error used for scoring; negative is early and positive is late. */
  timingErrorMs?: number;
  /** Hidden score pitches, retained only for this session's replay. */
  midiPitches?: number[];
}

export interface ReplayTap {
  id: string;
  hand: Hand;
  /** Physical or hardware keyboard input that produced this tap. */
  inputSource?: TapInputSource;
  barIndex: number;
  /** Actual click timestamp relative to session start, in milliseconds. */
  timestampMs: number;
  /** Timestamp after the user's calibration offset, relative to the active session start. */
  scoringTimestampMs?: number;
  /** Pattern active when this tap occurred, used when rescoring extra taps. */
  pattern?: ReplayPattern;
  /** Whether this tap fell in the first two beats after a pattern change. */
  isTransition?: boolean;
  /** Event accepted by scoring, when this click matched an expected note. */
  matchedEventId?: string;
  /** Raw click error against its matched note, before calibration correction. */
  timingErrorMs?: number;
  /** Score pitches played by this tap, when it matched an imported score note. */
  midiPitches?: number[];
}

export interface ReplayPattern {
  leftSubdivision: Subdivision;
  rightSubdivision: Subdivision;
  leftRest: boolean;
  rightRest: boolean;
  leftMixture?: MixturePatternId;
  rightMixture?: MixturePatternId;
}

export interface SessionResults {
  bpm: number;
  timeSignature: TimeSignature;
  feel: RhythmicFeel;
  /** Timing window used during this run, needed to recalculate the recorded taps. */
  goodWindowMs?: number;
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
  /** In-memory replay data; session history stores a compact copy for replay. */
  replayExpectedEvents?: ReplayExpectedEvent[];
  replayTaps?: ReplayTap[];
  /** Settings captured when the exercise began, for diagnostics and replay context. */
  initialSettings?: ExerciseSettings;
  /** Live settings changed during the exercise, ordered by elapsed session time. */
  settingChanges?: SessionSettingChange[];
  source?: 'score';
  scoreTitle?: string;
}

export interface SessionSettingChange {
  elapsedMs: number;
  changes: Partial<ExerciseSettings>;
}

export interface SessionSnapshot {
  phase: 'countdown' | 'running' | 'paused' | 'finished';
  resumeCountIn?: boolean;
  bpm: number;
  timeSignature: TimeSignature;
  beatsPerBar: number;
  beatIndex: number;
  beatInBar: number;
  counterBeatsPerBar: number;
  counterBeatInBar: number;
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
  swingFeelMismatch?: {
    likelyStraight: boolean;
    evidenceCount: number;
    latestBarIndex: number;
  };
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
  /** Fractional quarter-note position in the generated score bar. */
  practiceScoreQuarterInMeasure?: number;
}
