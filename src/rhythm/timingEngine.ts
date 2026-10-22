import { createExerciseStepGenerator } from '@/rhythm/exerciseGenerator';
import {
  isTupletSubdivision,
  SUBDIVISION_COUNTS,
  subdivisionOffsetMs,
  timeSignatureMetrics,
  tupletCount,
} from '@/rhythm/subdivisions';
import { accuracyPercent, emptyHandStats, finalizeHandStats } from '@/rhythm/scoring';
import { matchTap, timingWindowsForGoodWindow } from '@/rhythm/tapMatcher';
import type { TimingWindows } from '@/rhythm/tapMatcher';
import type { ImportedRhythmScore } from '@/types/importedScore';
import type {
  AccuracyStats,
  ExerciseSettings,
  ExerciseStep,
  Hand,
  HandStats,
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
  settled: boolean;
}

interface TimedScoreEvent {
  hand: Hand;
  startQuarter: number;
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
  left: MutableAccuracyStats;
  right: MutableAccuracyStats;
}

interface TimingEngineOptions {
  settings: ExerciseSettings;
  sessionStartTime: number;
  importedScore?: ImportedRhythmScore;
  random?: () => number;
}

const COUNT_IN_BEATS = 3;

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
  private readonly stable = createMutableAccuracyStats();
  private readonly transition = createMutableAccuracyStats();
  private nextStepToGenerate = 0;
  private nextScoreEventToGenerate = 0;
  private cachedNotationBarStartBeat = -1;
  private cachedNotationBarSteps: ExerciseStep[] = [];
  private finished = false;

  constructor(options: TimingEngineOptions) {
    this.settings = options.settings;
    this.importedScore = options.importedScore;
    this.timedScoreEvents = options.importedScore
      ? options.importedScore.measures
          .flatMap((measure) => [
            ...measure.leftEvents.map((event) => ({
              hand: 'left' as const,
              startQuarter: measure.startQuarter + event.startQuarter,
            })),
            ...measure.rightEvents.map((event) => ({
              hand: 'right' as const,
              startQuarter: measure.startQuarter + event.startQuarter,
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
    this.endTime =
      options.settings.durationSeconds === 'endless'
        ? null
        : options.sessionStartTime + options.settings.durationSeconds * 1_000;
    this.getStep = createExerciseStepGenerator({
      enabledSubdivisions: options.settings.enabledSubdivisions,
      changeIntervalBeats: options.settings.changeIntervalBeats,
      random: options.random,
    });
  }

  advance(now: number): SessionSnapshot {
    if (!this.finished) {
      this.generateThrough(now + this.timingWindows.goodMs);
      this.settleDueEvents(now);
      if (this.endTime !== null && now >= this.endTime + this.sessionSettleWindowMs) {
        this.finishPendingEvents();
        this.finished = true;
      }
    }

    return this.createSnapshot(now);
  }

  tap(hand: Hand, actualTapTime: number): TapFeedback {
    if (this.finished) return 'ignored';
    if (this.settings.trainingMode === 'single-hand' && hand !== this.settings.singleHand) {
      return 'ignored';
    }

    const tapOffsetMs =
      hand === 'left' ? this.settings.leftTapOffsetMs : this.settings.rightTapOffsetMs;
    const calibratedTapTime = actualTapTime - tapOffsetMs;
    this.generateThrough(calibratedTapTime + this.timingWindows.goodMs);
    this.settleDueEvents(actualTapTime);
    if (this.isRestAt(calibratedTapTime)) return 'miss';

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
    if (!match) return 'miss';

    const matchedEvent = candidates.find((event) => event.id === match.eventId);
    if (!matchedEvent) return 'miss';
    matchedEvent.settled = true;
    this.recordEvent(hand, matchedEvent, match.grade, match.timingErrorMs);
    return 'hit';
  }

  getResults(now: number): SessionResults {
    this.advance(now);
    this.finishPendingEvents(now);
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
      combinations: Array.from(this.combinations.values(), (combination) => ({
        leftSubdivision: combination.leftSubdivision,
        rightSubdivision: combination.rightSubdivision,
        left: toAccuracyStats(combination.left),
        right: toAccuracyStats(combination.right),
      })),
      durationSeconds: Math.max(0, (now - this.sessionStartTime) / 1_000),
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
        const subdivision = hand === 'left' ? step.leftSubdivision : step.rightSubdivision;
        if (isTupletSubdivision(subdivision)) {
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
          continue;
        }

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

    while (true) {
      const scoreEventIndex = this.nextScoreEventToGenerate % this.timedScoreEvents.length;
      const repeatIndex = Math.floor(this.nextScoreEventToGenerate / this.timedScoreEvents.length);
      const scoreEvent = this.timedScoreEvents[scoreEventIndex];
      const scoreQuarter = repeatIndex * score.totalQuarterNotes + scoreEvent.startQuarter;
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
        settled: false,
      });
    }
  }

  private graceLeadMs(previousStep: ExerciseStep, upcomingStep: ExerciseStep, hand: Hand): number {
    const previousSubdivision = hand === 'left'
      ? previousStep.leftSubdivision
      : previousStep.rightSubdivision;
    const upcomingSubdivision = hand === 'left'
      ? upcomingStep.leftSubdivision
      : upcomingStep.rightSubdivision;
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

  private recordEvent(
    hand: Hand,
    event: ExpectedEvent,
    grade: 'perfect' | 'great' | 'good' | null,
    errorMs: number | null,
  ): void {
    const stats = this.hands[hand];
    stats.totalExpected += 1;
    if (grade) {
      stats.totalHit += 1;
      stats[grade] += 1;
      stats.absoluteErrorTotal += Math.abs(errorMs ?? 0);
      stats.signedErrorTotal += errorMs ?? 0;
    } else {
      stats.miss += 1;
    }

    if (event.isScoreEvent) {
      this.stable.totalExpected += 1;
      if (grade) this.stable.totalHit += 1;
      return;
    }

    const key = `${event.step.leftSubdivision}:${event.step.rightSubdivision}`;
    let combination = this.combinations.get(key);
    if (!combination) {
      combination = {
        leftSubdivision: event.step.leftSubdivision,
        rightSubdivision: event.step.rightSubdivision,
        left: createMutableAccuracyStats(),
        right: createMutableAccuracyStats(),
      };
      this.combinations.set(key, combination);
    }
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

  private createSnapshot(now: number): SessionSnapshot {
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
    const phase = this.finished ? 'finished' : now < this.sessionStartTime ? 'countdown' : 'running';
    const scoreMeasure = this.currentScoreMeasure(now);
    const remaining = this.endTime === null ? null : Math.max(0, (this.endTime - now) / 1_000);
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
          ? countdownValue
          : now < this.sessionStartTime + 180
            ? 'START'
            : null,
      results: this.finished ? this.getResultsWithoutAdvance(now) : undefined,
      ...(scoreMeasure
        ? {
            scoreMeasure,
            scoreMeasureNumber: scoreMeasure.index + 1,
            scoreMeasureCount: this.importedScore?.measures.length,
            scoreTitle: this.importedScore?.title,
          }
        : {}),
    };
  }

  private currentScoreMeasure(now: number) {
    const score = this.importedScore;
    if (!score || score.totalQuarterNotes <= 0 || score.measures.length === 0) return undefined;
    const elapsedQuarterNotes = Math.max(0, (now - this.sessionStartTime) / this.quarterNoteMs);
    const scoreQuarter = elapsedQuarterNotes % score.totalQuarterNotes;
    return (
      score.measures.find(
        (measure) =>
          scoreQuarter >= measure.startQuarter &&
          scoreQuarter < measure.startQuarter + measure.durationQuarter,
      ) ?? score.measures[0]
    );
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
      combinations: Array.from(this.combinations.values(), (combination) => ({
        leftSubdivision: combination.leftSubdivision,
        rightSubdivision: combination.rightSubdivision,
        left: toAccuracyStats(combination.left),
        right: toAccuracyStats(combination.right),
      })),
      durationSeconds: Math.max(0, (now - this.sessionStartTime) / 1_000),
      ...(this.importedScore
        ? { source: 'score' as const, scoreTitle: this.importedScore.title }
        : {}),
    };
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
