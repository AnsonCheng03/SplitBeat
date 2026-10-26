Warning: truncated output (original token count: 12968)
Total output lines: 1273

import { createExerciseStepGenerator } from '@/rhythm/exerciseGenerator';
import {
  isTupletSubdivision,
  roundSessionDurationToBar,
  pulseQuarterNotes,
  SUBDIVISION_COUNTS,
  subdivisionOffsetMs,
  timeSignatureMetrics,
  tupletCount,
} from '@/rhythm/subdivisions';
import { accuracyPercent, emptyHandStats, finalizeHandStats } from '@/rhythm/scoring';
import { longestCorrectNoteStreak } from '@/rhythm/challenge';
import { analyzeSwingFeel } from '@/rhythm/swingFeel';
import { createPracticeScoreMeasure } from '@/rhythm/practiceScore';
import { alignedPatternChangeIntervalBeats } from '@/rhythm/patternChange';
import { expandMixturePattern } from '@/rhythm/mixtures';
import { barPositionForBeat } from '@/rhythm/barPosition';
import type { ChallengeOutcome } from '@/rhythm/challenge';
import { matchTap, timingWindowsForGoodWindow } from '@/rhythm/tapMatcher';
import type { TimingWindows } from '@/rhythm/tapMatcher';
import type { ImportedRhythmScore, ScoreRhythmMeasure } from '@/types/importedScore';
import type {
  AccuracyStats,
  ExerciseSettings,
  ExerciseStep,
  Hand,
  HandStats,
  MissedEvent,
  ReplayExpectedEvent,
  ReplayTap,
  ReplayPattern,
  ReferenceRhythmEvent,
  RhythmPatternPair,
  SessionResults,
  SessionSettingChange,
  SessionSnapshot,
  Subdivision,
  TapFeedback,
  TapInputSource,
} from '@/types/rhythm';

interface ExpectedEvent {
  id: string;
  expectedTimeMs: number;
  straightExpectedTimeMs?: number;
  swingExpectedTimeMs?: number;
  step: ExerciseStep;
  beatIndex: number;
  isGraceNote: boolean;
  isScoreEvent: boolean;
  midiPitches?: number[];
  durationQuarter?: number;
  tupletNumber?: number;
  settled: boolean;
}

interface TimedScoreEvent {
  hand: Hand;
  startQuarter: number;
  durationQuarter: number;
  tupletNumber?: number;
  midiPitches?: number[];
}

export interface TapResult {
  feedback: TapFeedback;
  midiPitches?: number[];
}

interface MutableHandStats {
  totalExpected: number;
  totalHit: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  absoluteErrorTotal: number;
  signedErrorTotal: number;
}

interface MutableAccuracyStats {
  totalExpected: number;
  totalHit: number;
}

interface MutableCombinationStats {
  leftSubdivision: Subdivision;
  rightSubdivision: Subdivision;
  leftRest: boolean;
  rightRest: boolean;
  leftMixture?: ExerciseStep['leftMixture'];
  rightMixture?: ExerciseStep['rightMixture'];
  left: MutableAccuracyStats;
  right: MutableAccuracyStats;
}

interface TimingEngineOptions {
  settings: ExerciseSettings;
  sessionStartTime: number;
  importedScore?: ImportedRhythmScore;
  patternPairs?: readonly RhythmPatternPair[];
  patternPairWeights?: readonly number[];
  random?: () => number;
}

const COUNT_IN_BEATS = 3;

export function getSessionDurationSeconds(
  settings: Pick<ExerciseSettings, 'bpm' | 'timeSignature' | 'durationSeconds'>,
  importedScore?: Pick<ImportedRhythmScore, 'timeSignature' | 'totalQuarterNotes'>,
): number | null {
  if (importedScore) {
    const quarterNoteDurationMs = timeSignatureMetrics(settings.bpm, importedScore.timeSignature).quarterNoteDurationMs;
    return (importedScore.totalQuarterNotes * quarterNoteDurationMs) / 1_000;
  }
  if (settings.durationSeconds === 'endless') return null;
  return roundSessionDurationToBar(settings.durationSeconds, settings.bpm, settings.timeSignature);
}

function createMutableHandStats(): MutableHandStats {
  const empty = emptyHandStats();
  return {
    totalExpected: empty.totalExpected,
    totalHit: empty.totalHit,
    perfect: empty.perfect,
    great: empty.great,
    good: empty.good,
    miss: empty.miss,
    absoluteErrorTotal: 0,
    signedErrorTotal: 0,
  };
}

function createMutableAccuracyStats(): MutableAccuracyStats {
  return { totalExpected: 0, totalHit: 0 };
}

function toAccuracyStats(stats: MutableAccuracyStats): AccuracyStats {
  return { totalExpected: stats.totalExpected, totalHit: stats.totalHit };
}

export class RhythmTimingEngine {
  readonly beatMs: number;
  readonly quarterNoteMs: number;
  readonly beatsPerBar: number;
  readonly patternChangeIntervalBeats: number;
  readonly sessionStartTime: number;

  private settings: ExerciseSettings;
  private readonly importedScore?: ImportedRhythmScore;
  private readonly timedScoreEvents: TimedScoreEvent[];
  private timingWindows: TimingWindows;
  private settleWindowMsByHand: Record<Hand, number>;
  private sessionSettleWindowMs: number;
  private readonly endTime: number | null;
  private readonly getStep: (stepIndex: number) => ExerciseStep;
  private readonly events: Record<Hand, ExpectedEvent[]> = { left: [], right: [] };
  private readonly hands: Record<Hand, MutableHandStats> = {
    left: createMutableHandStats(),
    right: createMutableHandStats(),
  };
  private readonly combinations = new Map<string, MutableCombinationStats>();
  private readonly practiceScoreMeasures = new Map<number, ScoreRhythmMeasure>();
  private readonly missedEvents: MissedEvent[] = [];
  private readonly replayExpectedEvents: ReplayExpectedEvent[] = [];
  private readonly replayTaps: ReplayTap[] = [];
  private readonly initialSettings: ExerciseSettings;
  private readonly settingChanges: SessionSettingChange[] = [];
  private readonly stable = createMutableAccuracyStats();
  private readonly transition = createMutableAccuracyStats();
  private nextStepToGenerate = 0;
  private nextScoreEventToGenerate = 0;
  private cachedNotationBarStartBeat = -1;
  private cachedNotationBarSteps: ExerciseStep[] = [];
  private nextReplayTapId = 0;
  private finished = false;
  private pausedAt: number | null = null;
  private resumeAt: number | null = null;
  private pausedDurationMs = 0;
  private readonly challengeOutcomes: ChallengeOutcome[] = [];
  private readonly completedChallengeBars: number[] = [];
  private nextChallengeBarIndex = 1;

  constructor(options: TimingEngineOptions) {
    this.settings = options.settings;
    this.initialSettings = {
      ...options.settings,
      enabledSubdivisions: [...options.settings.enabledSubdivisions],
      enabledMixtures: [...options.settings.enabledMixtures],
      mixtureNoteValues: [...(options.settings.mixtureNoteValues ?? [])],
    };
    this.importedScore = options.importedScore;
    this.timedScoreEvents = options.importedScore
      ? options.importedScore.measures
          .flatMap((measure) => [
            ...measure.leftEvents.filter((event) => !event.isRest && !event.isTieContinuation).map((event) => ({
              hand: 'left' as const,
              startQuarter: measure.startQuarter + event.startQuarter,
              durationQuarter: event.durationQuarter,
              ...(event.tupletNumber === undefined ? {} : { tupletNumber: event.tupletNumber }),
              ...(event.midiPitches ? { midiPitches: event.midiPitches } : {}),
            })),
            ...measure.rightEvents.filter((event) => !event.isRest && !event.isTieContinuation).map((event) => ({
              hand: 'right' as const,
              startQuarter: measure.startQuarter + event.startQuarter,
              durationQuarter: event.durationQuarter,
              ...(event.tupletNumber === undefined ? {} : { tupletNumber: event.tupletNumber }),
              ...(event.midiPitches ? { midiPitches: event.midiPitches } : {}),
            })),
          ])
          .sort((firstEvent, secondEvent) => firstEvent.startQuarter - secondEvent.startQuarter)
      : [];
    this.timingWindows = timingWindowsForGoodWindow(options.settings.goodWindowMs);
    this.settleWindowMsByHand = {
      left: this.timingWindows.goodMs + Math.max(0, options.settings.leftTapOffsetMs),
      right: this.timingWindows.goodMs + Math.max(0, options.settings.rightTapOffsetMs),
    };
    this.sessionSettleWindowMs = Math.max(
      this.settleWindowMsByHand.left,
      this.settleWindowMsByHand.right,
    );
    this.sessionStartTime = options.sessionStartTime;
    const metrics = timeSignatureMetrics(options.settings.bpm, options.settings.timeSignature);
    this.beatMs = metrics.beatDurationMs;
    this.quarterNoteMs = metrics.quarterNoteDurationMs;
    this.beatsPerBar = metrics.beatsPerBar;
    this.patternChangeIntervalBeats = alignedPatternChangeIntervalBeats(
      options.settings.changeIntervalBeats,
      metrics.beatsPerBar,
    );
    const sessionDurationSeconds = getSessionDurationSeconds(options.settings, this.importedScore);
    this.endTime = sessionDurationSeconds === null
      ? null
      : options.sessionStartTime + sessionDurationSeconds * 1_000;
    this.getStep = createExerciseStepGenerator({
      enabledSubdivisions: options.settings.enabledSubdivisions,
      enabledMixtures: options.settings.enabledMixtures,
      mixtureNoteValues: options.settings.mixtureNoteValues,
      mixtureRestsEnabled: options.settings.mixtureRestsEnabled,
      barDurationQuarterNotes: metrics.beatsPerBar * pulseQuarterNotes(options.settings.timeSignature),
      changeIntervalBeats: this.patternChangeIntervalBeats,
      timeSignature: options.settings.timeSignature,
      patternPairs: options.patternPairs,
      patternPairWeights: options.patternPairWeights,
      allowHandRests: options.settings.handRestsEnabled && options.settings.trainingMode === 'two-hand',
      random: options.random,
    });
  }

  updateTimingCalibration(
    patch: Partial<Pick<ExerciseSettings, 'leftTapOffsetMs' | 'rightTapOffsetMs' | 'goodWindowMs'>>,
  ): void {
    this.settings = { ...this.settings, ...patch };
    this.timingWindows = timingWindowsForGoodWindow(this.settings.goodWindowMs);
    this.settleWindowMsByHand = {
      left: this.timingWindows.goodMs + Math.max(0, this.settings.leftTapOffsetMs),
      right: this.timingWindows.goodMs + Math.max(0, this.settings.rightTapOffsetMs),
    };
    this.sessionSettleWindowMs = Math.max(
      this.settleWindowMsByHand.left,
      this.settleWindowMsByHand.right,
    );
  }

  recordSettingsChange(now: number, changes: Partial<ExerciseSettings>): void {
    this.settingChanges.push({
      elapsedMs: Math.max(0, this.toActiveTime(now) - this.sessionStartTime),
      changes: { ...changes },
    });
  }

  advance(now: number): SessionSnapshot {
    this.completeResumeCountIn(now);
    const activeNow = this.toActiveTime(now);
    if (!this.finished) {
      this.generateThrough(activeNow + this.timingWindows.goodMs);
      this.settleDueEvents(activeNow);
      if (this.endTime !== null && activeNow >= this.endTime + this.sessionSettleWindowMs) {
        this.finishPendingEvents();
        this.finished = true;
      }
    }
    this.completeChallengeBarsThrough(activeNow);

    return this.createSnapshot(activeNow, now);
  }

  pause(now: number): void {
    if (this.finished || this.pausedAt !== null) return;
    this.advance(now);
    if (!this.finished) this.pausedAt = now;
  }

  resume(now: number): void {
    if (this.finished || this.pausedAt === null) return;
    this.pausedDurationMs += Math.max(0, now - this.pausedAt);
    this.pausedAt = null;
    this.resumeAt = null;
  }

  isPaused(): boolean {
    return this.pausedAt !== null;
  }

  beginResumeCountIn(now: number, durationMs: number): void {
    if (this.finished || this.pausedAt === null || this.resumeAt !== null) return;
    this.resumeAt = now + Math.max(0, durationMs);
  }

  cancelResumeCountIn(now: number): void {
    if (this.resumeAt === null) return;
    if (now >= this.resumeAt) {
      this.completeResumeCountIn(now);
      return;
    }
    this.resumeAt = null;
  }

  takeChallengeOutcomes(): ChallengeOutcome[] {
    const outcomes = this.challengeOutcomes.splice(0);
    return outcomes.sort(
      (first, second) => first.expectedTimeMs - second.expectedTimeMs
        || first.hand.localeCompare(second.hand)
        || (first.kind === 'extra-tap' ? 1 : 0) - (second.kind === 'extra-tap' ? 1 : 0),
    );
  }

  takeCompletedChallengeBars(): number[] {
    return this.completedChallengeBars.splice(0);
  }

  getReferenceEventsThrough(timeMs: number): readonly ReferenceRhythmEvent[] {
    this.generateThrough(timeMs);
    return (['left', 'right'] as const).flatMap((hand) =>
      this.events[hand]
        .filter((event) => event.expectedTimeMs <= timeMs)
        .map((event) => ({
          id: event.id,
          hand,
          expectedTimeMs: event.expectedTimeMs,
          ...(event.midiPitches ? { midiPitches: event.midiPitches } : {}),
        })),
    );
  }

  tap(hand: Hand, actualTapTime: number): TapFeedback {
    return this.tapWithDetails(hand, actualTapTime).feedback;
  }

  tapWithDetails(hand: Hand, actualTapTime: number, inputSource: TapInputSource = 'touch'): TapResult {
    this.completeResumeCountIn(actualTapTime);
    if (this.finished || this.pausedAt !== null) return { feedback: 'ignored' };
    if (this.settings.trainingMode === 'single-hand' && hand !== this.settings.singleHand) {
      return { feedback: 'ignored' };
    }

    const activeTapTime = this.toActiveTime(actualTapTi…6468 tokens truncated…ts.good,
      stats.miss,
      stats.absoluteErrorTotal,
      stats.signedErrorTotal,
    );
  }

  private createSnapshot(now: number, wallNow: number): SessionSnapshot {
    const elapsed = now - this.sessionStartTime;
    const beatIndex = Math.max(0, Math.floor(elapsed / this.beatMs));
    const stepIndex = Math.floor(beatIndex / this.patternChangeIntervalBeats);
    const currentStep = this.getStep(stepIndex);
    const barStartBeat = Math.floor(beatIndex / this.beatsPerBar) * this.beatsPerBar;
    const barEndBeat = barStartBeat + this.beatsPerBar;
    const barSteps = this.getNotationBarSteps(barStartBeat, barEndBeat);
    const countdownStartTime = this.sessionStartTime - COUNT_IN_BEATS * this.beatMs;
    const countInBeat = Math.floor(Math.max(0, now - countdownStartTime) / this.beatMs);
    const countdownValue = Math.max(1, COUNT_IN_BEATS - countInBeat);
    const overallLeft = this.readHandStats('left');
    const overallRight = this.readHandStats('right');
    const resumeCountIn = this.resumeAt !== null && wallNow < this.resumeAt;
    const phase = this.finished
      ? 'finished'
      : resumeCountIn || now < this.sessionStartTime
        ? 'countdown'
        : 'running';
    const scorePosition = this.currentScorePosition(now);
    const practiceScorePosition = !this.importedScore && this.settings.practiceDisplayMode === 'score'
      ? this.currentPracticeScorePosition(beatIndex)
      : undefined;
    const shouldAnalyzeSwingFeel = this.settings.feel === 'swing' && !this.importedScore && (
      beatIndex < this.beatsPerBar * 3 ||
      this.finished ||
      (this.pausedAt !== null && this.resumeAt === null)
    );
    const swingFeelMismatch = shouldAnalyzeSwingFeel
      ? analyzeSwingFeel(
          this.replayExpectedEvents,
          this.replayTaps,
          this.settings.bpm,
          this.settings.timeSignature,
          this.settings.goodWindowMs,
        )
      : undefined;
    const remaining = this.endTime === null
      ? null
      : Math.max(0, (this.endTime - Math.max(now, this.sessionStartTime)) / 1_000);
    const nextStepTime =
      this.sessionStartTime + (currentStep.startBeat + currentStep.durationBeats) * this.beatMs;
    const hasNextStep =
      phase === 'running' && (this.endTime === null || nextStepTime < this.endTime);
    const nextStep = hasNextStep ? this.getStep(stepIndex + 1) : null;

    return {
      phase,
      bpm: this.settings.bpm,
      timeSignature: this.settings.timeSignature,
      beatsPerBar: this.beatsPerBar,
      beatIndex,
      beatInBar: beatIndex % this.beatsPerBar,
      isRest: !this.importedScore && this.isRestAt(now),
      currentStep,
      barStartBeat,
      barSteps,
      nextStep,
      beatsUntilChange:
        this.patternChangeIntervalBeats - (beatIndex % this.patternChangeIntervalBeats),
      secondsUntilChange: nextStep ? Math.max(0, (nextStepTime - now) / 1_000) : null,
      secondsRemaining: remaining,
      leftAccuracy: accuracyPercent(overallLeft),
      rightAccuracy: accuracyPercent(overallRight),
      leftStats: overallLeft,
      rightStats: overallRight,
      countdown:
        phase === 'countdown'
          ? resumeCountIn
            ? Math.max(1, Math.min(this.beatsPerBar, Math.ceil((this.resumeAt! - wallNow) / this.beatMs)))
            : countdownValue
          : now < this.sessionStartTime + 180
            ? 'START'
            : null,
      ...(resumeCountIn ? { resumeCountIn: true } : {}),
      ...(swingFeelMismatch?.likelyStraight
        ? {
            swingFeelMismatch: {
              likelyStraight: true,
              evidenceCount: swingFeelMismatch.evidenceCount,
              latestBarIndex: swingFeelMismatch.latestBarIndex,
            },
          }
        : {}),
      results: this.finished ? this.getResultsWithoutAdvance(now) : undefined,
      ...(scorePosition
        ? {
            scoreMeasure: scorePosition.measure,
            scorePreviousMeasure: scorePosition.previousMeasure,
            scoreNextMeasure: scorePosition.nextMeasure,
            scoreUpcomingMeasures: scorePosition.upcomingMeasures,
            scoreMeasureSequence: scorePosition.sequence,
            scoreMeasureNumber: scorePosition.measure.index + 1,
            scoreMeasureCount: this.importedScore?.measures.length,
            scoreQuarterInMeasure: scorePosition.quarterInMeasure,
            scoreTitle: this.importedScore?.title,
          }
        : {}),
      ...(practiceScorePosition
        ? {
            practiceScoreMeasure: practiceScorePosition.measure,
            practiceScorePreviousMeasure: practiceScorePosition.previousMeasure,
            practiceScoreNextMeasure: practiceScorePosition.nextMeasure,
            practiceScoreUpcomingMeasures: practiceScorePosition.upcomingMeasures,
            practiceScoreSequence: practiceScorePosition.sequence,
            practiceScoreCount: practiceScorePosition.count,
          }
        : {}),
    };
  }

  private completeResumeCountIn(now: number): void {
    if (this.resumeAt === null || this.pausedAt === null || now < this.resumeAt) return;
    this.pausedDurationMs += Math.max(0, this.resumeAt - this.pausedAt);
    this.pausedAt = null;
    this.resumeAt = null;
  }

  private currentPracticeScorePosition(beatIndex: number) {
    const sessionEndBeat = this.endTime === null
      ? undefined
      : Math.max(0, (this.endTime - this.sessionStartTime) / this.beatMs);
    const totalBars = sessionEndBeat === undefined
      ? undefined
      : Math.max(1, Math.ceil(sessionEndBeat / this.beatsPerBar));
    const sequence = Math.min(
      Math.floor(beatIndex / this.beatsPerBar),
      totalBars === undefined ? Number.POSITIVE_INFINITY : totalBars - 1,
    );
    const count = totalBars ?? sequence + 8;
    const upcomingCount = Math.max(1, Math.min(8, count - sequence));
    const makeMeasure = (barIndex: number) => {
      const cached = this.practiceScoreMeasures.get(barIndex);
      if (cached) return cached;
      const created = createPracticeScoreMeasure({
        barIndex,
        beatsPerBar: this.beatsPerBar,
        pulseQuarterNotes: pulseQuarterNotes(this.settings.timeSignature),
        changeIntervalBeats: this.patternChangeIntervalBeats,
        restBetweenChanges: this.settings.restBetweenChanges,
        sessionEndBeat,
        getStep: this.getStep,
      });
      this.practiceScoreMeasures.set(barIndex, created);
      if (this.practiceScoreMeasures.size > 24) {
        const oldestBarIndex = this.practiceScoreMeasures.keys().next().value;
        if (oldestBarIndex !== undefined) this.practiceScoreMeasures.delete(oldestBarIndex);
      }
      return created;
    };
    const upcomingMeasures = Array.from(
      { length: upcomingCount },
      (_, offset) => makeMeasure(sequence + offset),
    );
    const measure = upcomingMeasures[0];
    if (!measure) return undefined;

    return {
      measure,
      previousMeasure: sequence > 0 ? makeMeasure(sequence - 1) : undefined,
      nextMeasure: upcomingMeasures[1] ?? measure,
      upcomingMeasures,
      sequence,
      count,
    };
  }

  private currentScorePosition(now: number) {
    const score = this.importedScore;
    if (!score || score.totalQuarterNotes <= 0 || score.measures.length === 0) return undefined;
    const elapsedQuarterNotes = Math.max(0, (now - this.sessionStartTime) / this.quarterNoteMs);
    const scoreQuarter = Math.min(elapsedQuarterNotes, score.totalQuarterNotes);
    const measureIndex = score.measures.findIndex(
        (measure) =>
          scoreQuarter >= measure.startQuarter &&
          scoreQuarter < measure.startQuarter + measure.durationQuarter,
      );
    const index = measureIndex < 0 ? score.measures.length - 1 : measureIndex;
    const measure = score.measures[index];
    if (!measure) return undefined;

    return {
      measure,
      previousMeasure: index > 0 ? score.measures[index - 1] : undefined,
      nextMeasure: index + 1 < score.measures.length ? score.measures[index + 1] : undefined,
      upcomingMeasures: score.measures.slice(index, index + 8),
      sequence: index,
      quarterInMeasure: Math.min(measure.durationQuarter, Math.max(0, scoreQuarter - measure.startQuarter)),
    };
  }

  private isRestAt(timestamp: number): boolean {
    if (this.importedScore || !this.settings.restBetweenChanges) return false;
    const elapsedBeats = (timestamp - this.sessionStartTime) / this.beatMs;
    if (elapsedBeats < 0) return false;

    const beatIndex = Math.floor(elapsedBeats + 1e-9);
    const stepIndex = Math.floor(beatIndex / this.patternChangeIntervalBeats);
    const beatInStep = beatIndex - stepIndex * this.patternChangeIntervalBeats;
    if (beatInStep !== this.patternChangeIntervalBeats - 1) return false;

    const nextStepTime =
      this.sessionStartTime +
      (stepIndex + 1) * this.patternChangeIntervalBeats * this.beatMs;
    return this.endTime === null || nextStepTime < this.endTime;
  }

  private getNotationBarSteps(barStartBeat: number, barEndBeat: number): ExerciseStep[] {
    if (this.cachedNotationBarStartBeat === barStartBeat) return this.cachedNotationBarSteps;
    const firstStepIndex = Math.floor(barStartBeat / this.patternChangeIntervalBeats);
    const lastStepIndex = Math.floor(barEndBeat / this.patternChangeIntervalBeats);
    this.cachedNotationBarStartBeat = barStartBeat;
    this.cachedNotationBarSteps = Array.from(
      { length: lastStepIndex - firstStepIndex + 1 },
      (_, offset) => this.getStep(firstStepIndex + offset),
    ).filter((step) => {
      const startsBeforeExerciseEnd =
        this.endTime === null || this.sessionStartTime + step.startBeat * this.beatMs < this.endTime;
      return startsBeforeExerciseEnd && step.startBeat <= barEndBeat;
    });
    return this.cachedNotationBarSteps;
  }

  private getResultsWithoutAdvance(now: number): SessionResults {
    return {
      bpm: this.settings.bpm,
      timeSignature: this.settings.timeSignature,
      feel: this.settings.feel,
      goodWindowMs: this.settings.goodWindowMs,
      graceNotesEnabled: this.settings.graceNotesEnabled && !this.settings.restBetweenChanges,
      restBetweenChanges: this.settings.restBetweenChanges,
      trainingMode: this.settings.trainingMode,
      singleHand: this.settings.singleHand,
      left: this.readHandStats('left'),
      right: this.readHandStats('right'),
      stable: toAccuracyStats(this.stable),
      transition: toAccuracyStats(this.transition),
      longestCorrectStreak: longestCorrectNoteStreak(
        this.replayExpectedEvents,
        this.replayTaps,
        this.sessionStartTime,
      ),
      challengeMode: this.settings.challengeAction !== 'off' && !this.importedScore,
      combinations: Array.from(this.combinations.values(), (combination) => ({
        leftSubdivision: combination.leftSubdivision,
        rightSubdivision: combination.rightSubdivision,
        leftRest: combination.leftRest,
        rightRest: combination.rightRest,
        ...(combination.leftMixture ? { leftMixture: combination.leftMixture } : {}),
        ...(combination.rightMixture ? { rightMixture: combination.rightMixture } : {}),
        left: toAccuracyStats(combination.left),
        right: toAccuracyStats(combination.right),
      })),
      durationSeconds: this.elapsedSessionSeconds(now),
      missedEvents: [...this.missedEvents],
      replayExpectedEvents: [...this.replayExpectedEvents],
      replayTaps: [...this.replayTaps].sort(
        (firstTap, secondTap) => firstTap.timestampMs - secondTap.timestampMs,
      ),
      initialSettings: this.initialSettings,
      settingChanges: [...this.settingChanges],
      ...(this.importedScore
        ? { source: 'score' as const, scoreTitle: this.importedScore.title }
        : {}),
    };
  }

  private elapsedSessionSeconds(now: number): number {
    const end = Math.min(now, this.endTime ?? Number.POSITIVE_INFINITY);
    return Math.max(0, (end - this.sessionStartTime) / 1_000);
  }

  private completeChallengeBarsThrough(activeNow: number): void {
    const barDurationMs = this.beatsPerBar * this.beatMs;
    const elapsedPastSettleWindow = activeNow - this.sessionStartTime - this.sessionSettleWindowMs;
    const completedBarCount = Math.floor(elapsedPastSettleWindow / barDurationMs + 1e-9);
    while (this.nextChallengeBarIndex <= completedBarCount) {
      this.completedChallengeBars.push(this.nextChallengeBarIndex);
      this.nextChallengeBarIndex += 1;
    }
  }

  private toActiveTime(now: number): number {
    const inProgressPause = this.pausedAt === null ? 0 : Math.max(0, now - this.pausedAt);
    return now - this.pausedDurationMs - inProgressPause;
  }
}

export function getExerciseStartTime(
  monotonicNow: number,
  bpm: number,
  leadInMs = 300,
  timeSignature: ExerciseSettings['timeSignature'] = '4/4',
): number {
  return (
    monotonicNow +
    leadInMs +
    COUNT_IN_BEATS * timeSignatureMetrics(bpm, timeSignature).beatDurationMs
  );
}
