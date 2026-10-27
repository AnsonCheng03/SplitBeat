import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shouldSuggestTimingCalibration } from '@/features/results/resultPresentation';
import type { HandStats, ReplayTap } from '@/types/rhythm';

const handStats = (patch: Partial<HandStats> = {}): HandStats => ({
  totalExpected: 0,
  totalHit: 0,
  perfect: 0,
  great: 0,
  good: 0,
  miss: 0,
  averageAbsoluteErrorMs: 0,
  averageSignedErrorMs: 0,
  ...patch,
});

const taps = (count: number): ReplayTap[] => Array.from({ length: count }, (_, index) => ({
  id: `tap-${index}`,
  hand: 'left',
  barIndex: 1,
  timestampMs: index * 500,
}));

test('calibration prompt is suggested for substantial low accuracy with enough practice data', () => {
  assert.equal(shouldSuggestTimingCalibration({
    trainingMode: 'two-hand',
    singleHand: 'left',
    left: handStats({ totalExpected: 119, totalHit: 1 }),
    right: handStats({ totalExpected: 93, totalHit: 3 }),
    replayTaps: taps(12),
  }), true);
});

test('calibration prompt is suggested for a clear timing bias even when accuracy is otherwise good', () => {
  assert.equal(shouldSuggestTimingCalibration({
    trainingMode: 'single-hand',
    singleHand: 'left',
    left: handStats({ totalExpected: 20, totalHit: 18, averageSignedErrorMs: 55 }),
    right: handStats(),
    replayTaps: taps(18),
  }), true);
});

test('calibration prompt is hidden for short sessions and balanced results', () => {
  assert.equal(shouldSuggestTimingCalibration({
    trainingMode: 'two-hand',
    singleHand: 'left',
    left: handStats({ totalExpected: 10, totalHit: 2 }),
    right: handStats(),
    replayTaps: taps(8),
  }), false);
  assert.equal(shouldSuggestTimingCalibration({
    trainingMode: 'two-hand',
    singleHand: 'left',
    left: handStats({ totalExpected: 12, totalHit: 10, averageSignedErrorMs: 12 }),
    right: handStats({ totalExpected: 12, totalHit: 10, averageSignedErrorMs: -10 }),
    replayTaps: taps(20),
  }), false);
});
