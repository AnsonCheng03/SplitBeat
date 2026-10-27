import assert from 'node:assert/strict';
import test from 'node:test';
import { remainingPracticeLoadingFeedbackMs } from './exercise/practiceLaunchFeedback';

test('practice loading feedback stays visible for the minimum duration', () => {
  assert.equal(remainingPracticeLoadingFeedbackMs(1000, 1100), 250);
  assert.equal(remainingPracticeLoadingFeedbackMs(1000, 1349), 1);
  assert.equal(remainingPracticeLoadingFeedbackMs(1000, 1350), 0);
  assert.equal(remainingPracticeLoadingFeedbackMs(1000, 1600), 0);
});

test('practice loading feedback tolerates a clock value before its start', () => {
  assert.equal(remainingPracticeLoadingFeedbackMs(1000, 900), 350);
});
