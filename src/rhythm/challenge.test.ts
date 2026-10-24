/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyChallengeOutcomes, createChallengeStreaks, createWrongTapTrigger, longestCorrectNoteStreak } from '@/rhythm/challenge';

test('challenge tracks consecutive misses separately for each hand', () => {
  const first = applyChallengeOutcomes(createChallengeStreaks(), [
    { hand: 'left', matched: false, expectedTimeMs: 0 },
    { hand: 'right', matched: true, expectedTimeMs: 0 },
    { hand: 'left', matched: false, expectedTimeMs: 1_000 },
  ], 2);

  assert.deepEqual(first.streaks, { left: 2, right: 0 });
  assert.deepEqual(first.trigger, { hand: 'left', missStreak: 2, reason: 'miss-streak' });
});

test('a correct note resets only its own hand streak', () => {
  const current = { left: 2, right: 1 };
  const result = applyChallengeOutcomes(current, [
    { hand: 'right', matched: true, expectedTimeMs: 2_000 },
    { hand: 'left', matched: true, expectedTimeMs: 2_000 },
    { hand: 'left', matched: false, expectedTimeMs: 3_000 },
  ], 3);

  assert.deepEqual(result.streaks, { left: 1, right: 0 });
  assert.equal(result.trigger, null);
});

test('challenge applies outcomes in expected-time order', () => {
  const result = applyChallengeOutcomes(createChallengeStreaks(), [
    { hand: 'left', matched: true, expectedTimeMs: 1_000 },
    { hand: 'left', matched: false, expectedTimeMs: 0 },
  ], 2);

  assert.deepEqual(result.streaks, { left: 0, right: 0 });
  assert.equal(result.trigger, null);
});

test('any-error mode can trigger immediately on an off-beat tap', () => {
  assert.deepEqual(createWrongTapTrigger('right'), {
    hand: 'right',
    missStreak: 1,
    reason: 'wrong-tap',
  });
});

test('longest clean streak spans hands and resets at a missed or extra note', () => {
  const sessionStartTime = 5_000;
  const expectedEvents = [
    { hand: 'left' as const, expectedTimeMs: 5_000, matched: true },
    { hand: 'right' as const, expectedTimeMs: 5_000, matched: true },
    { hand: 'right' as const, expectedTimeMs: 5_500, matched: true },
    { hand: 'left' as const, expectedTimeMs: 6_000, matched: false },
    { hand: 'right' as const, expectedTimeMs: 6_000, matched: true },
    { hand: 'right' as const, expectedTimeMs: 6_500, matched: true },
    { hand: 'right' as const, expectedTimeMs: 7_000, matched: true },
  ];

  assert.equal(longestCorrectNoteStreak(expectedEvents, [], sessionStartTime), 3);
  assert.equal(
    longestCorrectNoteStreak(
      [
        { hand: 'left' as const, expectedTimeMs: 5_000, matched: true },
        { hand: 'right' as const, expectedTimeMs: 5_500, matched: true },
        { hand: 'right' as const, expectedTimeMs: 6_000, matched: true },
      ],
      [{ timestampMs: 750 }],
      sessionStartTime,
    ),
    2,
  );
});
