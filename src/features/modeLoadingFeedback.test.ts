import assert from 'node:assert/strict';
import test from 'node:test';
import { remainingModeLoadingFeedbackMs } from './modeLoadingFeedback';

test('mode loading feedback stays visible for its minimum duration', () => {
  assert.equal(remainingModeLoadingFeedbackMs(1000, 1100), 250);
  assert.equal(remainingModeLoadingFeedbackMs(1000, 1349), 1);
  assert.equal(remainingModeLoadingFeedbackMs(1000, 1350), 0);
  assert.equal(remainingModeLoadingFeedbackMs(1000, 1600), 0);
});

test('activity selection keeps loading visible long enough to register', () => {
  assert.equal(remainingModeLoadingFeedbackMs(1000, 1100, 800), 700);
  assert.equal(remainingModeLoadingFeedbackMs(1000, 1799, 800), 1);
  assert.equal(remainingModeLoadingFeedbackMs(1000, 1800, 800), 0);
});

test('mode loading feedback tolerates a clock value before its start', () => {
  assert.equal(remainingModeLoadingFeedbackMs(1000, 900), 350);
});
