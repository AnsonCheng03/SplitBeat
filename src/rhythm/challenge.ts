import type {
  ChallengeMissStreak,
  ChallengeWrongBarStreak,
  Hand,
  ReplayExpectedEvent,
  ReplayTap,
} from '@/types/rhythm';

export interface ChallengeOutcome {
  hand: Hand;
  matched: boolean;
  expectedTimeMs: number;
  kind?: 'expected-note' | 'extra-tap';
  barIndex?: number;
}

export interface ChallengeStreaks {
  left: number;
  right: number;
}

export interface ChallengeTrigger {
  hand?: Hand;
  missStreak?: number;
  wrongBarStreak?: number;
  reason: 'wrong-tap' | 'miss-streak' | 'wrong-bars';
}

interface StreakTimelineEntry {
  timeMs: number;
  kind: 'expected-note' | 'wrong-tap';
  matched?: boolean;
  hand?: Hand;
}

/**
 * Counts the longest correct run across both active hands. Expected notes are
 * counted once in musical time; stray taps reset the run at their actual time.
 */
export function longestCorrectNoteStreak(
  expectedEvents: readonly Pick<ReplayExpectedEvent, 'expectedTimeMs' | 'matched' | 'hand'>[],
  taps: readonly Pick<ReplayTap, 'timestampMs' | 'matchedEventId'>[],
  sessionStartTime: number,
): number {
  const timeline: StreakTimelineEntry[] = [];
  expectedEvents.forEach((event) => {
    timeline.push({
      timeMs: event.expectedTimeMs - sessionStartTime,
      kind: 'expected-note',
      matched: event.matched,
      hand: event.hand,
    });
  });
  taps.forEach((tap) => {
    if (!tap.matchedEventId) timeline.push({ timeMs: tap.timestampMs, kind: 'wrong-tap' });
  });
  timeline.sort(
    (first, second) => first.timeMs - second.timeMs ||
      (first.kind === second.kind ? (first.hand ?? '').localeCompare(second.hand ?? '') : first.kind === 'wrong-tap' ? -1 : 1),
  );

  let currentStreak = 0;
  let longestStreak = 0;
  for (const entry of timeline) {
    if (entry.kind === 'wrong-tap' || !entry.matched) {
      currentStreak = 0;
      continue;
    }
    currentStreak += 1;
    longestStreak = Math.max(longestStreak, currentStreak);
  }
  return longestStreak;
}

export function createChallengeStreaks(): ChallengeStreaks {
  return { left: 0, right: 0 };
}

/**
 * Update per-hand error streaks in timestamp order. A correct note resets
 * only that hand, while an extra tap adds an error to that hand's streak.
 */
export function applyChallengeOutcomes(
  streaks: ChallengeStreaks,
  outcomes: readonly ChallengeOutcome[],
  threshold: ChallengeMissStreak,
): { streaks: ChallengeStreaks; trigger: ChallengeTrigger | null } {
  const next = { ...streaks };
  const ordered = [...outcomes].sort(
    (first, second) => first.expectedTimeMs - second.expectedTimeMs
      || first.hand.localeCompare(second.hand)
      || (first.kind === 'extra-tap' ? 1 : 0) - (second.kind === 'extra-tap' ? 1 : 0),
  );

  for (const outcome of ordered) {
    next[outcome.hand] = outcome.matched ? 0 : next[outcome.hand] + 1;
    if (!outcome.matched && next[outcome.hand] >= threshold) {
      return {
        streaks: next,
        trigger: {
          hand: outcome.hand,
          missStreak: next[outcome.hand],
          reason: outcome.kind === 'extra-tap' && next[outcome.hand] === 1 ? 'wrong-tap' : 'miss-streak',
        },
      };
    }
  }

  return { streaks: next, trigger: null };
}

/**
 * Tracks bars with at least one mistake. A bar is evaluated only after the
 * timing engine confirms that its note windows have fully settled.
 */
export function applyChallengeBarOutcomes(
  consecutiveWrongBars: number,
  wrongBarIndexes: ReadonlySet<number>,
  outcomes: readonly ChallengeOutcome[],
  completedBarIndexes: readonly number[],
  threshold: ChallengeWrongBarStreak,
): {
  consecutiveWrongBars: number;
  wrongBarIndexes: Set<number>;
  trigger: ChallengeTrigger | null;
} {
  const wrongBars = new Set(wrongBarIndexes);
  for (const outcome of outcomes) {
    if (!outcome.matched && outcome.barIndex !== undefined) wrongBars.add(outcome.barIndex);
  }

  let streak = consecutiveWrongBars;
  const orderedCompletedBars = [...completedBarIndexes].sort((first, second) => first - second);
  for (const barIndex of orderedCompletedBars) {
    const isWrong = wrongBars.delete(barIndex);
    streak = isWrong ? streak + 1 : 0;
    if (streak >= threshold) {
      return {
        consecutiveWrongBars: streak,
        wrongBarIndexes: wrongBars,
        trigger: { wrongBarStreak: streak, reason: 'wrong-bars' },
      };
    }
  }

  return { consecutiveWrongBars: streak, wrongBarIndexes: wrongBars, trigger: null };
}

export function createWrongTapTrigger(hand: Hand): ChallengeTrigger {
  return { hand, missStreak: 1, reason: 'wrong-tap' };
}

export function challengeMessage(trigger: ChallengeTrigger, action: 'pause' | 'stop'): string {
  const outcome = action === 'pause' ? 'Paused' : 'Ended';
  if (trigger.reason === 'wrong-bars') {
    return `${outcome} after ${trigger.wrongBarStreak} consecutive bars with mistakes.`;
  }
  if (trigger.reason === 'wrong-tap') {
    return `${outcome} after an off-beat tap on your ${trigger.hand ?? 'active'} hand.`;
  }
  return `${outcome} after ${trigger.missStreak} consecutive mistakes on your ${trigger.hand ?? 'active'} hand.`;
}
