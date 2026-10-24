import { finalizeHandStats } from '@/rhythm/scoring';
import { longestCorrectNoteStreak } from '@/rhythm/challenge';
import { gradeTimingError, timingWindowsForGoodWindow } from '@/rhythm/tapMatcher';
import { timeSignatureMetrics } from '@/rhythm/subdivisions';
import type {
  AccuracyStats,
  Hand,
  HandStats,
  ReplayExpectedEvent,
  ReplayPattern,
  ReplayTap,
  RhythmicFeel,
  SessionResults,
} from '@/types/rhythm';

export interface SwingFeelAnalysis {
  likelyStraight: boolean;
  evidenceCount: number;
  straightWins: number;
  swingWins: number;
  latestBarIndex: number;
}

interface TimedEvent {
  event: ReplayExpectedEvent;
  straightTimeMs: number;
  swingTimeMs: number;
}

interface MutableStats {
  totalExpected: number;
  totalHit: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  absoluteErrorTotal: number;
  signedErrorTotal: number;
}

interface MutableAccuracy {
  totalExpected: number;
  totalHit: number;
}

interface MutableCombination {
  pattern: ReplayPattern;
  left: MutableAccuracy;
  right: MutableAccuracy;
}

const MIN_FEEL_EVIDENCE = 3;
const FEEL_WIN_MARGIN_MS = 18;

function positionTimeMs(barIndex: number, beatInBar: number, beatsPerBar: number, beatMs: number) {
  return ((barIndex - 1) * beatsPerBar + beatInBar) * beatMs;
}

function timedEventsForFeelAnalysis(
  events: readonly ReplayExpectedEvent[],
  beatsPerBar: number,
  beatMs: number,
  maxBarIndex = Number.POSITIVE_INFINITY,
): TimedEvent[] {
  return events
    .filter((event) => event.reached !== false && event.barIndex <= maxBarIndex)
    .map((event) => ({
      event,
      straightTimeMs: positionTimeMs(
        event.barIndex,
        event.straightBeatInBar ?? event.beatInBar,
        beatsPerBar,
        beatMs,
      ),
      swingTimeMs: positionTimeMs(
        event.barIndex,
        event.swingBeatInBar ?? event.beatInBar,
        beatsPerBar,
        beatMs,
      ),
    }))
    .sort((first, second) => first.swingTimeMs - second.swingTimeMs || first.event.hand.localeCompare(second.event.hand));
}

/**
 * Detects a consistent straight feel in a session whose expected rhythm used
 * swing. Notes that have the same timing under both feels provide no evidence.
 */
export function analyzeSwingFeel(
  events: readonly ReplayExpectedEvent[],
  taps: readonly ReplayTap[],
  bpm: number,
  timeSignature: SessionResults['timeSignature'],
  goodWindowMs = 100,
  maxBarIndex = Number.POSITIVE_INFINITY,
): SwingFeelAnalysis {
  const metrics = timeSignatureMetrics(bpm, timeSignature);
  const beatMs = metrics.beatDurationMs;
  const timedEvents = timedEventsForFeelAnalysis(events, metrics.beatsPerBar, beatMs, maxBarIndex)
    .filter(({ straightTimeMs, swingTimeMs }) => Math.abs(straightTimeMs - swingTimeMs) >= FEEL_WIN_MARGIN_MS);
  const usedTapIds = new Set<string>();
  const tapsByLaneAndBar = new Map<string, ReplayTap[]>();
  for (const tap of taps) {
    const key = `${tap.hand}:${tap.barIndex}`;
    const group = tapsByLaneAndBar.get(key) ?? [];
    group.push(tap);
    tapsByLaneAndBar.set(key, group);
  }
  let straightWins = 0;
  let swingWins = 0;
  let latestBarIndex = 0;

  for (const { event, straightTimeMs, swingTimeMs } of timedEvents) {
    const deltaMs = Math.abs(straightTimeMs - swingTimeMs);
    const allowedDistanceMs = goodWindowMs + deltaMs + FEEL_WIN_MARGIN_MS;
    let nearest: {
      tap: ReplayTap;
      straightErrorMs: number;
      swingErrorMs: number;
      closestErrorMs: number;
    } | undefined;
    for (const tap of tapsByLaneAndBar.get(`${event.hand}:${event.barIndex}`) ?? []) {
      if (usedTapIds.has(tap.id)) continue;
      const timeMs = tap.scoringTimestampMs ?? tap.timestampMs;
      const straightErrorMs = Math.abs(timeMs - straightTimeMs);
      const swingErrorMs = Math.abs(timeMs - swingTimeMs);
      const closestErrorMs = Math.min(straightErrorMs, swingErrorMs);
      if (
        closestErrorMs <= allowedDistanceMs &&
        (!nearest || closestErrorMs < nearest.closestErrorMs)
      ) {
        nearest = { tap, straightErrorMs, swingErrorMs, closestErrorMs };
      }
    }
    if (!nearest) continue;

    usedTapIds.add(nearest.tap.id);
    if (nearest.straightErrorMs + FEEL_WIN_MARGIN_MS < nearest.swingErrorMs) {
      straightWins += 1;
      latestBarIndex = Math.max(latestBarIndex, event.barIndex);
    } else if (nearest.swingErrorMs + FEEL_WIN_MARGIN_MS < nearest.straightErrorMs) {
      swingWins += 1;
      latestBarIndex = Math.max(latestBarIndex, event.barIndex);
    }
  }

  const evidenceCount = straightWins + swingWins;
  return {
    likelyStraight: evidenceCount >= MIN_FEEL_EVIDENCE && straightWins / evidenceCount >= 0.75,
    evidenceCount,
    straightWins,
    swingWins,
    latestBarIndex,
  };
}

function createMutableStats(): MutableStats {
  return {
    totalExpected: 0,
    totalHit: 0,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    absoluteErrorTotal: 0,
    signedErrorTotal: 0,
  };
}

function toHandStats(stats: MutableStats): HandStats {
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

function patternKey(pattern: ReplayPattern): string {
  return `${pattern.leftRest ? 'rest' : pattern.leftMixture ?? pattern.leftSubdivision}:${pattern.rightRest ? 'rest' : pattern.rightMixture ?? pattern.rightSubdivision}`;
}

function ensureCombination(
  combinations: Map<string, MutableCombination>,
  pattern: ReplayPattern | undefined,
): MutableCombination | undefined {
  if (!pattern) return undefined;
  const key = patternKey(pattern);
  let combination = combinations.get(key);
  if (!combination) {
    combination = {
      pattern,
      left: { totalExpected: 0, totalHit: 0 },
      right: { totalExpected: 0, totalHit: 0 },
    };
    combinations.set(key, combination);
  }
  return combination;
}

function targetBeatInBar(event: ReplayExpectedEvent, feel: RhythmicFeel): number {
  if (feel === 'straight') return event.straightBeatInBar ?? event.beatInBar;
  return event.swingBeatInBar ?? event.beatInBar;
}

/** Recounts a generated practice session from its captured taps under either feel. */
export function recountSessionFeel(results: SessionResults, feel: RhythmicFeel): SessionResults {
  if (results.source === 'score' || !results.replayExpectedEvents || !results.replayTaps) {
    return { ...results, feel };
  }

  const metrics = timeSignatureMetrics(results.bpm, results.timeSignature);
  const beatMs = metrics.beatDurationMs;
  const goodWindowMs = results.goodWindowMs ?? 100;
  const windows = timingWindowsForGoodWindow(goodWindowMs);
  const expectedEvents = results.replayExpectedEvents.map((event) => ({
    ...event,
    beatInBar: targetBeatInBar(event, feel),
    expectedRelativeMs: positionTimeMs(event.barIndex, targetBeatInBar(event, feel), metrics.beatsPerBar, beatMs),
    matchedEventId: undefined as string | undefined,
    timingErrorMs: undefined as number | undefined,
  }));
  const countableEvents = expectedEvents.filter((event) => event.reached !== false);
  const eventsByHand: Record<Hand, typeof countableEvents> = {
    left: countableEvents.filter((event) => event.hand === 'left').sort((a, b) => a.expectedRelativeMs - b.expectedRelativeMs),
    right: countableEvents.filter((event) => event.hand === 'right').sort((a, b) => a.expectedRelativeMs - b.expectedRelativeMs),
  };
  const tapsByHand: Record<Hand, ReplayTap[]> = {
    left: results.replayTaps.filter((tap) => tap.hand === 'left').sort((a, b) => (a.scoringTimestampMs ?? a.timestampMs) - (b.scoringTimestampMs ?? b.timestampMs)),
    right: results.replayTaps.filter((tap) => tap.hand === 'right').sort((a, b) => (a.scoringTimestampMs ?? a.timestampMs) - (b.scoringTimestampMs ?? b.timestampMs)),
  };
  const matchedTapIds = new Set<string>();
  const tapMatches = new Map<string, { eventId: string; errorMs: number; grade: 'perfect' | 'great' | 'good' }>();

  for (const hand of ['left', 'right'] as const) {
    const handEvents = eventsByHand[hand];
    for (const tap of tapsByHand[hand]) {
      const tapTimeMs = tap.scoringTimestampMs ?? tap.timestampMs;
      let low = 0;
      let high = handEvents.length;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        const event = handEvents[middle];
        if (event && event.expectedRelativeMs < tapTimeMs - goodWindowMs) low = middle + 1;
        else high = middle;
      }
      let nearest: { event: (typeof handEvents)[number]; errorMs: number } | undefined;
      for (let index = low; index < handEvents.length; index += 1) {
        const event = handEvents[index];
        if (!event || event.expectedRelativeMs > tapTimeMs + goodWindowMs) break;
        if (event.matchedEventId) continue;
        const errorMs = tapTimeMs - event.expectedRelativeMs;
        if (!nearest || Math.abs(errorMs) < Math.abs(nearest.errorMs)) nearest = { event, errorMs };
      }
      if (!nearest) continue;
      const grade = gradeTimingError(nearest.errorMs, windows);
      if (!grade) continue;
      nearest.event.matchedEventId = tap.id;
      nearest.event.timingErrorMs = nearest.errorMs;
      matchedTapIds.add(tap.id);
      tapMatches.set(tap.id, { eventId: nearest.event.id, errorMs: nearest.errorMs, grade });
    }
  }

  const handStats: Record<Hand, MutableStats> = { left: createMutableStats(), right: createMutableStats() };
  const stable: MutableAccuracy = { totalExpected: 0, totalHit: 0 };
  const transition: MutableAccuracy = { totalExpected: 0, totalHit: 0 };
  const combinations = new Map<string, MutableCombination>();
  const missedEvents = [] as SessionResults['missedEvents'];

  for (const event of countableEvents) {
    const stats = handStats[event.hand];
    stats.totalExpected += 1;
    const match = event.matchedEventId ? tapMatches.get(event.matchedEventId) : undefined;
    if (match) {
      stats.totalHit += 1;
      stats[match.grade] += 1;
      stats.absoluteErrorTotal += Math.abs(match.errorMs);
      stats.signedErrorTotal += match.errorMs;
    } else {
      stats.miss += 1;
      missedEvents.push({
        id: event.id,
        hand: event.hand,
        barIndex: event.barIndex,
        beatInBar: event.beatInBar,
        ...(event.subdivision ? { subdivision: event.subdivision } : {}),
        ...(event.durationQuarter === undefined ? {} : { durationQuarter: event.durationQuarter }),
        ...(event.tupletNumber === undefined ? {} : { tupletNumber: event.tupletNumber }),
        isScoreEvent: event.isScoreEvent,
      });
    }

    const switchStats = event.isTransition ? transition : stable;
    switchStats.totalExpected += 1;
    if (match) switchStats.totalHit += 1;
    const combination = ensureCombination(combinations, event.pattern);
    if (combination) {
      combination[event.hand].totalExpected += 1;
      if (match) combination[event.hand].totalHit += 1;
    }
  }

  const rescoredTaps = results.replayTaps.map((tap) => {
    const match = tapMatches.get(tap.id);
    return {
      ...tap,
      ...(match
        ? { matchedEventId: match.eventId, timingErrorMs: match.errorMs }
        : { matchedEventId: undefined, timingErrorMs: undefined }),
    };
  });

  for (const tap of rescoredTaps) {
    if (matchedTapIds.has(tap.id)) continue;
    const stats = handStats[tap.hand];
    stats.totalExpected += 1;
    stats.miss += 1;
    const switchStats = tap.isTransition ? transition : stable;
    switchStats.totalExpected += 1;
    const combination = ensureCombination(combinations, tap.pattern);
    if (combination) combination[tap.hand].totalExpected += 1;
  }

  const replayExpectedEvents = expectedEvents.map((event) => ({
    ...event,
    matched: Boolean(event.matchedEventId),
  }));
  const updatedCombinations = combinations.size > 0
    ? Array.from(combinations.values(), ({ pattern, left, right }) => ({
        ...pattern,
        left,
        right,
      }))
    : results.combinations;
  const activeReplayEvents = replayExpectedEvents.filter((event) => event.reached !== false);
  const streakEvents = activeReplayEvents.map((event) => ({
    ...event,
    expectedTimeMs: positionTimeMs(event.barIndex, event.beatInBar, metrics.beatsPerBar, beatMs),
  }));
  const streakTaps = rescoredTaps.map((tap) => ({
    ...tap,
    timestampMs: tap.scoringTimestampMs ?? tap.timestampMs,
  }));

  return {
    ...results,
    feel,
    left: toHandStats(handStats.left),
    right: toHandStats(handStats.right),
    stable: stable as AccuracyStats,
    transition: transition as AccuracyStats,
    combinations: updatedCombinations,
    missedEvents: missedEvents.sort((first, second) => first.barIndex - second.barIndex || first.beatInBar - second.beatInBar),
    replayExpectedEvents,
    replayTaps: rescoredTaps,
    longestCorrectStreak: longestCorrectNoteStreak(streakEvents, streakTaps, 0),
  };
}

export function analyzeSessionSwingFeel(results: SessionResults, maxBarIndex = Number.POSITIVE_INFINITY): SwingFeelAnalysis {
  return analyzeSwingFeel(
    results.replayExpectedEvents ?? [],
    results.replayTaps ?? [],
    results.bpm,
    results.timeSignature,
    results.goodWindowMs,
    maxBarIndex,
  );
}
