import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeSwingFeel, recountSessionFeel } from '@/rhythm/swingFeel';
import type { ReplayExpectedEvent, ReplayTap, SessionResults } from '@/types/rhythm';

const pattern = {
  leftSubdivision: 'eighth' as const,
  rightSubdivision: 'quarter' as const,
  leftRest: false,
  rightRest: false,
};

function expectedEvent(
  id: string,
  hand: 'left' | 'right',
  barIndex: number,
  straightBeatInBar: number,
  swingBeatInBar: number,
): ReplayExpectedEvent {
  return {
    id,
    hand,
    barIndex,
    beatInBar: swingBeatInBar,
    straightBeatInBar,
    swingBeatInBar,
    durationQuarter: 0.5,
    isScoreEvent: false,
    matched: false,
    reached: true,
    expectedTimeMs: 0,
    isTransition: false,
    pattern,
  };
}

function tap(id: string, hand: 'left' | 'right', barIndex: number, timeMs: number): ReplayTap {
  return { id, hand, barIndex, timestampMs: timeMs, scoringTimestampMs: timeMs, pattern };
}

function emptyStats() {
  return {
    totalExpected: 0,
    totalHit: 0,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    averageAbsoluteErrorMs: 0,
    averageSignedErrorMs: 0,
  };
}

function sessionResults(events: ReplayExpectedEvent[], taps: ReplayTap[]): SessionResults {
  return {
    bpm: 60,
    timeSignature: '4/4',
    feel: 'swing',
    goodWindowMs: 100,
    graceNotesEnabled: false,
    restBetweenChanges: false,
    trainingMode: 'two-hand',
    singleHand: 'left',
    left: emptyStats(),
    right: emptyStats(),
    stable: { totalExpected: 0, totalHit: 0 },
    transition: { totalExpected: 0, totalHit: 0 },
    longestCorrectStreak: 0,
    challengeMode: false,
    combinations: [],
    durationSeconds: 8,
    missedEvents: [],
    replayExpectedEvents: events,
    replayTaps: taps,
  };
}

test('detects a consistent straight feel from binary offbeat taps', () => {
  const events = [
    expectedEvent('l1', 'left', 1, 0.5, 2 / 3),
    expectedEvent('r1', 'right', 1, 0.5, 2 / 3),
    expectedEvent('l2', 'left', 2, 0.5, 2 / 3),
    expectedEvent('r2', 'right', 2, 0.5, 2 / 3),
  ];
  const taps = [
    tap('tl1', 'left', 1, 500),
    tap('tr1', 'right', 1, 500),
    tap('tl2', 'left', 2, 4_500),
    tap('tr2', 'right', 2, 4_500),
  ];

  const analysis = analyzeSwingFeel(events, taps, 60, '4/4', 100);
  assert.equal(analysis.likelyStraight, true);
  assert.equal(analysis.evidenceCount, 4);
  assert.equal(analysis.straightWins, 4);
  assert.equal(analysis.swingWins, 0);
});

test('does not warn when there are too few observations or taps follow swing', () => {
  const events = [
    expectedEvent('l1', 'left', 1, 0.5, 2 / 3),
    expectedEvent('r1', 'right', 1, 0.5, 2 / 3),
  ];

  assert.equal(analyzeSwingFeel(events, [tap('t1', 'left', 1, 500)], 60, '4/4').likelyStraight, false);
  assert.equal(analyzeSwingFeel(
    events,
    [tap('tl', 'left', 1, 667), tap('tr', 'right', 1, 667)],
    60,
    '4/4',
  ).likelyStraight, false);
});

test('recounts the same taps as straight or swing without mutating the original session', () => {
  const original = sessionResults(
    [
      expectedEvent('downbeat', 'left', 1, 0, 0),
      expectedEvent('offbeat', 'left', 1, 0.5, 2 / 3),
    ],
    [tap('first', 'left', 1, 0), tap('second', 'left', 1, 500)],
  );

  const straight = recountSessionFeel(original, 'straight');
  const swing = recountSessionFeel(original, 'swing');

  assert.equal(straight.left.totalExpected, 2);
  assert.equal(straight.left.totalHit, 2);
  assert.equal(straight.left.miss, 0);
  assert.equal(straight.replayExpectedEvents?.[1]?.beatInBar, 0.5);
  assert.equal(swing.left.totalExpected, 3);
  assert.equal(swing.left.totalHit, 1);
  assert.equal(swing.left.miss, 2);
  assert.equal(swing.replayExpectedEvents?.[1]?.beatInBar, 2 / 3);
  assert.equal(original.feel, 'swing');
  assert.equal(original.left.totalExpected, 0);
});
