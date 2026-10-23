import type { ChallengeMissStreak, Hand } from '@/types/rhythm';

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
