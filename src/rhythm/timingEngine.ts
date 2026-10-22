import { createExerciseStepGenerator } from '@/rhythm/exerciseGenerator';
import {
  SUBDIVISION_COUNTS,
  timeSignatureMetrics,
} from '@/rhythm/subdivisions';
import { accuracyPercent, emptyHandStats, finalizeHandStats } from '@/rhythm/scoring';
import { matchTap, TIMING_WINDOWS } from '@/rhythm/tapMatcher';
import type {
  AccuracyStats,
  ExerciseSettings,
  ExerciseStep,
  Hand,
  HandStats,
  SessionResults,
  SessionSnapshot,
  Subdivision,
} from '@/types/rhythm';

interface ExpectedEvent {
  id: string;
  expectedTimeMs: number;
  step: ExerciseStep;
  beatIndex: number;
  settled: boolean;
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
  private finished = false;

  constructor(options: TimingEngineOptions) {
    this.settings = options.settings;
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
      this.generateThrough(now + TIMING_WINDOWS.goodMs);
      this.settleDueEvents(now);
      if (this.endTime !== null && now >= this.endTime + TIMING_WINDOWS.goodMs) {
        this.finishPendingEvents();
        this.finished = true;
      }
    }

    return this.createSnapshot(now);
  }

  tap(hand: Hand, actualTapTime: number): void {
    if (this.finished) return;

    this.generateThrough(actualTapTime + TIMING_WINDOWS.goodMs);
    this.settleDueEvents(actualTapTime);

    const candidates = this.events[hand].filter(
      (event) =>
        !event.settled &&
        Math.abs(actualTapTime - event.expectedTimeMs) <= TIMING_WINDOWS.goodMs,
    );
    const match = matchTap(
      candidates.map((event) => ({
        id: event.id,
        expectedTimeMs: event.expectedTimeMs,
        matched: false,
      })),
      actualTapTime,
    );
    if (!match) return;

    const matchedEvent = candidates.find((event) => event.id === match.eventId);
    if (!matchedEvent) return;
    matchedEvent.settled = true;
    this.recordEvent(hand, matchedEvent, match.grade, match.timingErrorMs);
  }

  getResults(now: number): SessionResults {
    this.advance(now);
    this.finishPendingEvents(now);
    this.finished = true;

    return {
      bpm: this.settings.bpm,
      timeSignature: this.settings.timeSignature,
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
    };
  }

  private generateThrough(time: number): void {
    const limitedTime = this.endTime === null ? time : Math.min(time, this.endTime);
    while (true) {
      const step = this.getStep(this.nextStepToGenerate);
      const stepStartTime =
        this.sessionStartTime + step.startBeat * this.beatMs;
      if (stepStartTime > limitedTime || (this.endTime !== null && stepStartTime >= this.endTime)) break;
      const stepEndTime = stepStartTime + step.durationBeats * this.beatMs;

      for (const hand of ['left', 'right'] as const) {
        const subdivision = hand === 'left' ? step.leftSubdivision : step.rightSubdivision;
        const divisions = SUBDIVISION_COUNTS[subdivision];
        const intervalMs = this.quarterNoteMs / divisions;
        for (let subdivisionIndex = 0; ; subdivisionIndex += 1) {
          const expectedTimeMs = stepStartTime + subdivisionIndex * intervalMs;
          if (expectedTimeMs >= stepEndTime) break;
          if (this.endTime !== null && expectedTimeMs >= this.endTime) continue;
          this.events[hand].push({
            id: `${hand}:${step.id}:${subdivisionIndex}`,
            expectedTimeMs,
            step,
            beatIndex: Math.floor((expectedTimeMs - this.sessionStartTime) / this.beatMs + 1e-9),
            settled: false,
          });
        }
      }
      this.nextStepToGenerate += 1;
    }
  }

  private settleDueEvents(now: number): void {
    for (const hand of ['left', 'right'] as const) {
      for (const event of this.events[hand]) {
        if (event.settled || event.expectedTimeMs + TIMING_WINDOWS.goodMs >= now) continue;
        event.settled = true;
        this.recordEvent(hand, event, null, null);
      }
      this.events[hand] = this.events[hand].filter(
        (event) => !event.settled || event.expectedTimeMs + TIMING_WINDOWS.goodMs >= now,
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
      event.step.startBeat > 0 && event.beatIndex < event.step.startBeat + 2;
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
    const countdownStartTime = this.sessionStartTime - COUNT_IN_BEATS * this.beatMs;
    const countInBeat = Math.floor(Math.max(0, now - countdownStartTime) / this.beatMs);
    const countdownValue = Math.max(1, COUNT_IN_BEATS - countInBeat);
    const overallLeft = this.readHandStats('left');
    const overallRight = this.readHandStats('right');
    const phase = this.finished ? 'finished' : now < this.sessionStartTime ? 'countdown' : 'running';
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
      currentStep,
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
    };
  }

  private getResultsWithoutAdvance(now: number): SessionResults {
    return {
      bpm: this.settings.bpm,
      timeSignature: this.settings.timeSignature,
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
