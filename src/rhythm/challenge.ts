import type { ChallengeMissStreak, Hand, ReplayExpectedEvent, ReplayTap } from '@/types/rhythm';

export interface ChallengeOutcome {
  hand: Hand;
  matched: boolean;
  expectedTimeMs: number;
}

export interface ChallengeStreaks {
  left: number;
  right: number;
}

export interface ChallengeTrigger {
  hand: Hand;
  missStreak: number;
  reason: 'wrong-tap' | 'miss-streak';
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
 * Update per-hand miss streaks in expected-note order. A correct note resets
 * only that hand, so one hand's success cannot hide the other's misses.
 */
export function applyChallengeOutcomes(
  streaks: ChallengeStreaks,
  outcomes: readonly ChallengeOutcome[],
  threshold: ChallengeMissStreak,
): { streaks: ChallengeStreaks; trigger: ChallengeTrigger | null } {
  const next = { ...streaks };
  const ordered = [...outcomes].sort(
    (first, second) => first.expectedTimeMs - second.expectedTimeMs || first.hand.localeCompare(second.hand),
  );

  for (const outcome of ordered) {
    next[outcome.hand] = outcome.matched ? 0 : next[outcome.hand] + 1;
    if (!outcome.matched && next[outcome.hand] >= threshold) {
      return {
        streaks: next,
        trigger: { hand: outcome.hand, missStreak: next[outcome.hand], reason: 'miss-streak' },
      };
    }
  }

  return { streaks: next, trigger: null };
}

export function createWrongTapTrigger(hand: Hand): ChallengeTrigger {
  return { hand, missStreak: 1, reason: 'wrong-tap' };
}

export function challengeMessage(trigger: ChallengeTrigger, action: 'pause' | 'stop'): string {
  const outcome = action === 'pause' ? 'Paused' : 'Ended';
  if (trigger.reason === 'wrong-tap') {
    return `${outcome} after an off-beat tap on your ${trigger.hand} hand.`;
  }
  return `${outcome} after ${trigger.missStreak} ${trigger.hand}-hand notes in a row were missed.`;
}
