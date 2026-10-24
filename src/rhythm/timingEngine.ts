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
import { createPracticeScoreMeasure } from '@/rhythm/practiceScore';
import { expandMixturePattern } from '@/rhythm/mixtures';
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
  ReferenceRhythmEvent,
  RhythmPatternPair,
  SessionResults,
  SessionSnapshot,
  Subdivision,
  TapFeedback,
} from '@/types/rhythm';

interface ExpectedEvent {
  id: string;
  expectedTimeMs: number;
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
  readonly sessionStartTime: number;

  private readonly settings: ExerciseSettings;
  private readonly importedScore?: ImportedRhythmScore;
  private readonly timedScoreEvents: TimedScoreEvent[];
  private readonly timingWindows: TimingWindows;
  private readonly settleWindowMsByHand: Record<Hand, number>;
  private readonly sessionSettleWindowMs: number;
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

  constructor(options: TimingEngineOptions) {
    this.settings = options.settings;
    this.importedScore = options.importedScore;
    this.timedScoreEvents = options.importedScore
      ? options.importedScore.measures
          .flatMap((measure) => [
            ...measure.leftEvents.filter((event) => !event.isRest).map((event) => ({
              hand: 'left' as const,
              startQuarter: measure.startQuarter + event.startQuarter,
              durationQuarter: event.durationQuarter,
              ...(event.tupletNumber === undefined ? {} : { tupletNumber: event.tupletNumber }),
              ...(event.midiPitches ? { midiPitches: event.midiPitches } : {}),
            })),
            ...measure.rightEvents.filter((event) => !event.isRest).map((event) => ({
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
    const sessionDurationSeconds = getSessionDurationSeconds(options.settings, this.importedScore);
    this.endTime = sessionDurationSeconds === null
      ? null
      : options.sessionStartTime + sessionDurationSeconds * 1_000;
    this.getStep = createExerciseStepGenerator({
      enabledSubdivisions: options.settings.enabledSubdivisions,
      enabledMixtures: options.settings.enabledMixtures,
      changeIntervalBeats: options.settings.changeIntervalBeats,
      patternPairs: options.patternPairs,
      patternPairWeights: options.patternPairWeights,
      allowHandRests: options.settings.handRestsEnabled && options.settings.trainingMode === 'two-hand',
      random: options.random,
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

  takeChallengeOutcomes(): ChallengeOutcome[] {
    const outcomes = this.challengeOutcomes.splice(0);
    return outcomes.sort(
      (first, second) => first.expectedTimeMs - second.expectedTimeMs
        || first.hand.localeCompare(second.hand)
        || (first.kind === 'extra-tap' ? 1 : 0) - (second.kind === 'extra-tap' ? 1 : 0),
    );
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

  tapWithDetails(hand: Hand, actualTapTime: number): TapResult {
    this.completeResumeCountIn(actualTapTime);
    if (this.finished || this.pausedAt !== null) return { feedback: 'ignored' };
    if (this.settings.trainingMode === 'single-hand' && hand !== this.settings.singleHand) {
      return { feedback: 'ignored' };
    }

    const activeTapTime = this.toActiveTime(actualTapTime);
    if (this.endTime !== null && activeTapTime >= this.endTime) return { feedback: 'ignored' };

    const replayTap = this.recordReplayTap(hand, activeTapTime);

    const tapOffsetMs =
      hand === 'left' ? this.settings.leftTapOffsetMs : this.settings.rightTapOffsetMs;
    const calibratedTapTime = activeTapTime - tapOffsetMs;
    this.generateThrough(calibratedTapTime + this.timingWindows.goodMs);
    this.settleDueEvents(activeTapTime);
    if (this.isRestAt(calibratedTapTime)) {
      this.recordExtraTap(hand, calibratedTapTime);
      return { feedback: 'miss' };
    }

    const candidates = this.events[hand].filter(
      (event) =>
        !event.settled &&
        Math.abs(calibratedTapTime - event.expectedTimeMs) <= this.timingWindows.goodMs,
    );
    const match = matchTap(
      candidates.map((event) => ({
        id: event.id,
        expectedTimeMs: event.expectedTimeMs,
        matched: false,
      })),
      calibratedTapTime,
      this.timingWindows,
    );
    if (!match) {
      this.recordExtraTap(hand, calibratedTapTime);
      return { feedback: 'miss' };
    }

    const matchedEvent = candidates.find((event) => event.id === match.eventId);
    if (!matchedEvent) {
      this.recordExtraTap(hand, calibratedTapTime);
      return { feedback: 'miss' };
    }
    replayTap.matchedEventId = matchedEvent.id;
    replayTap.timingErrorMs = activeTapTime - matchedEvent.expectedTimeMs;
    if (matchedEvent.midiPitches) replayTap.midiPitches = [...matchedEvent.midiPitches];
    matchedEvent.settled = true;
    this.recordEvent(hand, matchedEvent, match.grade, match.timingErrorMs);
    return {
      feedback: 'hit',
      ...(matchedEvent.midiPitches ? { midiPitches: [...matchedEvent.midiPitches] } : {}),
    };
  }

  getResults(now: number): SessionResults {
    this.advance(now);
    this.finishPendingEvents(this.toActiveTime(now));
    this.finished = true;

    return {
      bpm: this.settings.bpm,
      timeSignature: this.settings.timeSignature,
      feel: this.settings.feel,
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
      durationSeconds: this.elapsedSessionSeconds(this.toActiveTime(now)),
      missedEvents: [...this.missedEvents].sort(
        (firstEvent, secondEvent) =>
          firstEvent.barIndex - secondEvent.barIndex ||
          firstEvent.beatInBar - secondEvent.beatInBar ||
          firstEvent.hand.localeCompare(secondEvent.hand),
      ),
      replayExpectedEvents: [...this.replayExpectedEvents].sort(
        (firstEvent, secondEvent) =>
          firstEvent.barIndex - secondEvent.barIndex ||
          firstEvent.beatInBar - secondEvent.beatInBar ||
          firstEvent.hand.localeCompare(secondEvent.hand),
      ),
      replayTaps: [...this.replayTaps].sort(
        (firstTap, secondTap) => firstTap.timestampMs - secondTap.timestampMs,
      ),
      ...(this.importedScore
        ? { source: 'score' as const, scoreTitle: this.importedScore.title }
        : {}),
    };
  }

  private generateThrough(time: number): void {
    const limitedTime = this.endTime === null ? time : Math.min(time, this.endTime);
    if (this.importedScore) {
      this.generateScoreEventsThrough(limitedTime);
      return;
    }
    while (true) {
      const step = this.getStep(this.nextStepToGenerate);
      const stepStartTime =
        this.sessionStartTime + step.startBeat * this.beatMs;
      const previousStep = this.nextStepToGenerate > 0
        ? this.getStep(this.nextStepToGenerate - 1)
        : null;
      const graceLeads = previousStep && this.settings.graceNotesEnabled
        && !this.settings.restBetweenChanges
        ? {
            left: this.graceLeadMs(previousStep, step, 'left'),
            right: this.graceLeadMs(previousStep, step, 'right'),
          }
        : null;
      const earliestEventTime = graceLeads
        ? stepStartTime - Math.max(graceLeads.left, graceLeads.right)
        : stepStartTime;
      if (earliestEventTime > limitedTime || (this.endTime !== null && stepStartTime >= this.endTime)) break;
      const stepEndTime = stepStartTime + step.durationBeats * this.beatMs;
      const hasFollowingStep = this.endTime === null || stepEndTime < this.endTime;
      const restBeatOffset =
        this.settings.restBetweenChanges && hasFollowingStep ? step.durationBeats - 1 : -1;

      for (const hand of ['left', 'right'] as const) {
        if (this.settings.trainingMode === 'single-hand' && hand !== this.settings.singleHand) continue;
        if (hand === 'left' ? step.leftRest : step.rightRest) continue;
        const mixtureId = hand === 'left' ? step.leftMixture : step.rightMixture;
        const subdivision = hand === 'left' ? step.leftSubdivision : step.rightSubdivision;
        if (mixtureId) {
          const pulseQuarter = pulseQuarterNotes(this.settings.timeSignature);
          const stepStartQuarter = step.startBeat * pulseQuarter;
          const stepEndQuarter = (step.startBeat + step.durationBeats) * pulseQuarter;
          const atoms = expandMixturePattern(mixtureId, stepStartQuarter, stepEndQuarter);
          for (let atomIndex = 0; atomIndex < atoms.length; atomIndex += 1) {
            const atom = atoms[atomIndex];
            if (!atom || atom.kind !== 'note') continue;
            const expectedTimeMs = this.sessionStartTime + atom.startQuarter * this.quarterNoteMs;
            if (expectedTimeMs >= stepEndTime || (this.endTime !== null && expectedTimeMs >= this.endTime)) continue;
            const beatOffset = Math.floor((expectedTimeMs - stepStartTime) / this.beatMs + 1e-9);
            if (beatOffset === restBeatOffset) continue;
            this.events[hand].push({
              id: `${hand}:${step.id}:mixture:${atomIndex}`,
              expectedTimeMs,
              step,
              beatIndex: Math.floor((expectedTimeMs - this.sessionStartTime) / this.beatMs + 1e-9),
              durationQuarter: atom.durationQuarter,
              isGraceNote: false,
              isScoreEvent: false,
              settled: false,
            });
          }
        } else if (isTupletSubdivision(subdivision)) {
          const notesPerBeat = tupletCount(subdivision);
          let tupletEventIndex = 0;
          for (let beatOffset = 0; beatOffset < step.durationBeats; beatOffset += 1) {
            if (beatOffset === restBeatOffset) continue;
            for (let noteIndex = 0; noteIndex < notesPerBeat; noteIndex += 1) {
              const expectedTimeMs =
                stepStartTime + beatOffset * this.beatMs + (noteIndex * this.beatMs) / notesPerBeat;
              if (expectedTimeMs >= stepEndTime) continue;
              if (this.endTime !== null && expectedTimeMs >= this.endTime) continue;
              this.events[hand].push({
                id: `${hand}:${step.id}:${tupletEventIndex}`,
                expectedTimeMs,
                step,
                beatIndex: Math.floor((expectedTimeMs - this.sessionStartTime) / this.beatMs + 1e-9),
                isGraceNote: false,
                isScoreEvent: false,
                settled: false,
              });
              tupletEventIndex += 1;
            }
          }
        } else {
          const divisions = SUBDIVISION_COUNTS[subdivision];
          for (let subdivisionIndex = 0; ; subdivisionIndex += 1) {
            const quarterIndex = Math.floor(subdivisionIndex / divisions);
            const noteIndex = subdivisionIndex % divisions;
            const expectedTimeMs =
              stepStartTime +
              quarterIndex * this.quarterNoteMs +
              subdivisionOffsetMs(this.quarterNoteMs, subdivision, noteIndex, this.settings.feel);
            if (expectedTimeMs >= stepEndTime) break;
            if (this.endTime !== null && expectedTimeMs >= this.endTime) continue;
            const beatOffset = Math.floor((expectedTimeMs - stepStartTime) / this.beatMs + 1e-9);
            if (beatOffset === restBeatOffset) continue;
            this.events[hand].push({
              id: `${hand}:${step.id}:${subdivisionIndex}`,
              expectedTimeMs,
              step,
              beatIndex: Math.floor((expectedTimeMs - this.sessionStartTime) / this.beatMs + 1e-9),
              isGraceNote: false,
              isScoreEvent: false,
              settled: false,
            });
          }
        }

        const graceLead = graceLeads?.[hand];
        if (graceLead && step.startBeat > 0) {
          const expectedTimeMs = stepStartTime - graceLead;
          if (this.endTime === null || expectedTimeMs < this.endTime) {
            this.events[hand].push({
              id: `${hand}:${step.id}:grace`,
              expectedTimeMs,
              step,
              beatIndex: step.startBeat,
              isGraceNote: true,
              isScoreEvent: false,
              settled: false,
            });
          }
        }
      }
      this.nextStepToGenerate += 1;
    }
  }

  private generateScoreEventsThrough(limitedTime: number): void {
    const score = this.importedScore;
    if (!score || score.totalQuarterNotes <= 0 || this.timedScoreEvents.length === 0) return;

    while (this.nextScoreEventToGenerate < this.timedScoreEvents.length) {
      const scoreEvent = this.timedScoreEvents[this.nextScoreEventToGenerate];
      const scoreQuarter = scoreEvent.startQuarter;
      const expectedTimeMs = this.sessionStartTime + scoreQuarter * this.quarterNoteMs;
      if (expectedTimeMs > limitedTime) break;
      this.nextScoreEventToGenerate += 1;
      if (this.settings.trainingMode === 'single-hand' && scoreEvent.hand !== this.settings.singleHand) continue;
      if (this.endTime !== null && expectedTimeMs >= this.endTime) continue;

      const measureIndex = score.measures.findIndex(
        (measure) =>
          scoreEvent.startQuarter >= measure.startQuarter &&
          scoreEvent.startQuarter < measure.startQuarter + measure.durationQuarter,
      );
      const measure = score.measures[Math.max(0, measureIndex)];
      const step: ExerciseStep = {
        id: `score-measure-${measureIndex}`,
        leftSubdivision: 'quarter',
        rightSubdivision: 'quarter',
        leftRest: false,
        rightRest: false,
        startBeat: Math.floor((measure?.startQuarter ?? 0) * this.quarterNoteMs / this.beatMs),
        durationBeats: measure
          ? Math.max(1, Math.round((measure.durationQuarter * this.quarterNoteMs) / this.beatMs))
          : this.beatsPerBar,
      };
      this.events[scoreEvent.hand].push({
        id: `score:${scoreEvent.hand}:${this.nextScoreEventToGenerate}`,
        expectedTimeMs,
        step,
        beatIndex: Math.floor((expectedTimeMs - this.sessionStartTime) / this.beatMs + 1e-9),
        isGraceNote: false,
        isScoreEvent: true,
        durationQuarter: scoreEvent.durationQuarter,
        ...(scoreEvent.tupletNumber === undefined ? {} : { tupletNumber: scoreEvent.tupletNumber }),
        ...(scoreEvent.midiPitches ? { midiPitches: scoreEvent.midiPitches } : {}),
        settled: false,
      });
    }
  }

  private graceLeadMs(previousStep: ExerciseStep, upcomingStep: ExerciseStep, hand: Hand): number {
    if ((hand === 'left' ? previousStep.leftMixture : previousStep.rightMixture) ||
      (hand === 'left' ? upcomingStep.leftMixture : upcomingStep.rightMixture)) return 0;
    const previousSubdivision = hand === 'left'
      ? previousStep.leftSubdivision
      : previousStep.rightSubdivision;
    const upcomingSubdivision = hand === 'left'
      ? upcomingStep.leftSubdivision
      : upcomingStep.rightSubdivision;
    if ((hand === 'left' ? previousStep.leftRest : previousStep.rightRest) ||
      (hand === 'left' ? upcomingStep.leftRest : upcomingStep.rightRest)) return 0;
    const previousDivisions = SUBDIVISION_COUNTS[previousSubdivision];
    const upcomingDivisions = SUBDIVISION_COUNTS[upcomingSubdivision];
    const previousDurationMs = previousStep.durationBeats * this.beatMs;
    let previousLastEventOffsetMs = 0;
    if (isTupletSubdivision(previousSubdivision)) {
      const previousIntervalMs = this.beatMs / tupletCount(previousSubdivision);
      previousLastEventOffsetMs = previousDurationMs - previousIntervalMs;
    } else {
      for (
        let quarterIndex = 0;
        quarterIndex * this.quarterNoteMs < previousDurationMs;
        quarterIndex += 1
      ) {
        for (let noteIndex = 0; noteIndex < previousDivisions; noteIndex += 1) {
          const eventOffsetMs =
            quarterIndex * this.quarterNoteMs +
            subdivisionOffsetMs(
              this.quarterNoteMs,
              previousSubdivision,
              noteIndex,
              this.settings.feel,
            );
          if (eventOffsetMs < previousDurationMs) {
            previousLastEventOffsetMs = eventOffsetMs;
          }
        }
      }
    }
    const gapAfterPreviousNoteMs = previousDurationMs - previousLastEventOffsetMs;
    const upcomingIntervalMs = isTupletSubdivision(upcomingSubdivision)
      ? this.beatMs / tupletCount(upcomingSubdivision)
      : this.quarterNoteMs / upcomingDivisions;
    return Math.min(
      this.quarterNoteMs / 4,
      gapAfterPreviousNoteMs / 2,
      upcomingIntervalMs / 2,
    );
  }

  private settleDueEvents(now: number): void {
    for (const hand of ['left', 'right'] as const) {
      const settleWindowMs = this.settleWindowMsByHand[hand];
      for (const event of this.events[hand]) {
        if (event.settled || event.expectedTimeMs + settleWindowMs >= now) continue;
        event.settled = true;
        this.recordEvent(hand, event, null, null);
      }
      this.events[hand] = this.events[hand].filter(
        (event) => !event.settled || event.expectedTimeMs + settleWindowMs >= now,
      );
    }
  }

  private finishPendingEvents(now = Number.POSITIVE_INFINITY): void {
    for (const hand of ['left', 'right'] as const) {
      for (const event of this.events[hand]) {
        if (!event.settled && event.expectedTimeMs <= now) {
          event.settled = true;
          this.recordEvent(hand, event, null, null);
        }
      }
      this.events[hand] = [];
    }
  }

  private recordReplayTap(hand: Hand, timestamp: number): ReplayTap {
    const timestampMs = Math.max(0, timestamp - this.sessionStartTime);
    const barDurationMs = this.beatsPerBar * this.beatMs;
    const tap: ReplayTap = {
      id: `tap-${this.nextReplayTapId}`,
      hand,
      barIndex: Math.floor(timestampMs / barDurationMs) + 1,
      timestampMs,
    };
    this.nextReplayTapId += 1;
    this.replayTaps.push(tap);
    return tap;
  }

  private recordEvent(
    hand: Hand,
    event: ExpectedEvent,
    grade: 'perfect' | 'great' | 'good' | null,
    errorMs: number | null,
  ): void {
    this.challengeOutcomes.push({
      hand,
      matched: grade !== null,
      expectedTimeMs: event.expectedTimeMs,
      kind: 'expected-note',
    });
    const beatPosition = (event.expectedTimeMs - this.sessionStartTime) / this.beatMs;
    const barOffset = Math.floor(beatPosition / this.beatsPerBar);
    const beatInBar = beatPosition - barOffset * this.beatsPerBar;
    const mixtureId = hand === 'left' ? event.step.leftMixture : event.step.rightMixture;
    const subdivision = event.isScoreEvent || mixtureId
      ? undefined
      : hand === 'left' ? event.step.leftSubdivision : event.step.rightSubdivision;
    const durationQuarter = event.durationQuarter ?? (
      subdivision && isTupletSubdivision(subdivision)
        ? this.quarterNoteMs / this.beatMs / tupletCount(subdivision)
        : subdivision
          ? 1 / SUBDIVISION_COUNTS[subdivision]
          : 1
    );
    const replayEvent: ReplayExpectedEvent = {
      id: event.id,
      hand,
      barIndex: barOffset + 1,
      beatInBar,
      ...(subdivision ? { subdivision } : {}),
      durationQuarter,
      ...(event.tupletNumber === undefined
        ? subdivision && isTupletSubdivision(subdivision) ? { tupletNumber: tupletCount(subdivision) } : {}
        : { tupletNumber: event.tupletNumber }),
      isScoreEvent: event.isScoreEvent,
      matched: grade !== null,
      expectedTimeMs: event.expectedTimeMs,
      ...(event.midiPitches ? { midiPitches: [...event.midiPitches] } : {}),
      ...(errorMs === null ? {} : { timingErrorMs: errorMs }),
    };
    this.replayExpectedEvents.push(replayEvent);

    const stats = this.hands[hand];
    stats.totalExpected += 1;
    if (grade) {
      stats.totalHit += 1;
      stats[grade] += 1;
      stats.absoluteErrorTotal += Math.abs(errorMs ?? 0);
      stats.signedErrorTotal += errorMs ?? 0;
    } else {
      stats.miss += 1;
      this.missedEvents.push({
        id: replayEvent.id,
        hand: replayEvent.hand,
        barIndex: replayEvent.barIndex,
        beatInBar: replayEvent.beatInBar,
        ...(event.isScoreEvent || mixtureId
          ? {
              ...(event.durationQuarter === undefined ? {} : { durationQuarter: event.durationQuarter }),
              ...(event.tupletNumber === undefined ? {} : { tupletNumber: event.tupletNumber }),
            }
          : { subdivision }),
        isScoreEvent: event.isScoreEvent,
      });
    }

    if (event.isScoreEvent) {
      this.stable.totalExpected += 1;
      if (grade) this.stable.totalHit += 1;
      return;
    }

    const combination = this.getCombinationStats(event.step);
    const combinationHand = combination[hand];
    combinationHand.totalExpected += 1;
    if (grade) combinationHand.totalHit += 1;

    const isTransition =
      event.isGraceNote ||
      (event.step.startBeat > 0 && event.beatIndex < event.step.startBeat + 2);
    const transitionStats = isTransition ? this.transition : this.stable;
    transitionStats.totalExpected += 1;
    if (grade) transitionStats.totalHit += 1;
  }

  private recordExtraTap(hand: Hand, tapTime: number): void {
    const handStats = this.hands[hand];
    handStats.totalExpected += 1;
    handStats.miss += 1;
    this.challengeOutcomes.push({ hand, matched: false, expectedTimeMs: tapTime, kind: 'extra-tap' });

    if (this.importedScore) {
      this.stable.totalExpected += 1;
      return;
    }

    const beatIndex = Math.floor((tapTime - this.sessionStartTime) / this.beatMs + 1e-9);
    const stepIndex = Math.max(0, Math.floor(beatIndex / this.settings.changeIntervalBeats));
    const step = this.getStep(stepIndex);
    this.getCombinationStats(step)[hand].totalExpected += 1;

    const isTransition = step.startBeat > 0
      && beatIndex >= step.startBeat
      && beatIndex < step.startBeat + 2;
    const accuracyStats = isTransition ? this.transition : this.stable;
    accuracyStats.totalExpected += 1;
  }

  private getCombinationStats(step: ExerciseStep): MutableCombinationStats {
    const key = `${step.leftRest ? 'rest' : step.leftMixture ?? step.leftSubdivision}:${step.rightRest ? 'rest' : step.rightMixture ?? step.rightSubdivision}`;
    let combination = this.combinations.get(key);
    if (!combination) {
      combination = {
        leftSubdivision: step.leftSubdivision,
        rightSubdivision: step.rightSubdivision,
        leftRest: step.leftRest,
        rightRest: step.rightRest,
        ...(step.leftMixture ? { leftMixture: step.leftMixture } : {}),
        ...(step.rightMixture ? { rightMixture: step.rightMixture } : {}),
        left: createMutableAccuracyStats(),
        right: createMutableAccuracyStats(),
      };
      this.combinations.set(key, combination);
    }
    return combination;
  }

  private readHandStats(hand: Hand): HandStats {
    const stats = this.hands[hand];
    return finalizeHandStats(
      stats.totalExpected,
      stats.totalHit,
      stats.perfect,
      stats.great,
      stats.good,
      stats.miss,
      stats.absoluteErrorTotal,
      stats.signedErrorTotal,
    );
  }

  private createSnapshot(now: number, wallNow: number): SessionSnapshot {
    const elapsed = now - this.sessionStartTime;
    const beatIndex = Math.max(0, Math.floor(elapsed / this.beatMs));
    const stepIndex = Math.floor(beatIndex / this.settings.changeIntervalBeats);
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
        this.settings.changeIntervalBeats - (beatIndex % this.settings.changeIntervalBeats),
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
        changeIntervalBeats: this.settings.changeIntervalBeats,
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
    const stepIndex = Math.floor(beatIndex / this.settings.changeIntervalBeats);
    const beatInStep = beatIndex - stepIndex * this.settings.changeIntervalBeats;
    if (beatInStep !== this.settings.changeIntervalBeats - 1) return false;

    const nextStepTime =
      this.sessionStartTime +
      (stepIndex + 1) * this.settings.changeIntervalBeats * this.beatMs;
    return this.endTime === null || nextStepTime < this.endTime;
  }

  private getNotationBarSteps(barStartBeat: number, barEndBeat: number): ExerciseStep[] {
    if (this.cachedNotationBarStartBeat === barStartBeat) return this.cachedNotationBarSteps;
    const firstStepIndex = Math.floor(barStartBeat / this.settings.changeIntervalBeats);
    const lastStepIndex = Math.floor(barEndBeat / this.settings.changeIntervalBeats);
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
      ...(this.importedScore
        ? { source: 'score' as const, scoreTitle: this.importedScore.title }
        : {}),
    };
  }

  private elapsedSessionSeconds(now: number): number {
    const end = Math.min(now, this.endTime ?? Number.POSITIVE_INFINITY);
    return Math.max(0, (end - this.sessionStartTime) / 1_000);
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
