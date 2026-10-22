import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  calibrationOffsetFromErrors,
  normalizeGoodWindowMs,
  normalizeTapOffsetMs,
} from '@/rhythm/timingCalibration';
import { timingWindowsForGoodWindow } from '@/rhythm/tapMatcher';

test('timing window and hand offset controls clamp and snap to five milliseconds', () => {
  assert.equal(normalizeGoodWindowMs(103), 105);
  assert.equal(normalizeGoodWindowMs(10), 50);
  assert.equal(normalizeGoodWindowMs(500), 200);
  assert.equal(normalizeTapOffsetMs(-17), -15);
  assert.equal(normalizeTapOffsetMs(-500), -200);
  assert.equal(normalizeTapOffsetMs(500), 200);
});

test('calibration derives a signed correction from measured tap errors', () => {
  assert.equal(calibrationOffsetFromErrors([12, 18, 24, 26]), 20);
  assert.equal(calibrationOffsetFromErrors([-12, -18, -24, -26]), -20);
  assert.equal(calibrationOffsetFromErrors([250, 260]), 200);
  assert.equal(calibrationOffsetFromErrors([]), 0);
});

test('adjustable hit windows keep perfect and great proportions tied to the selected range', () => {
  assert.deepEqual(timingWindowsForGoodWindow(100), {
    perfectMs: 30,
    greatMs: 60,
    goodMs: 100,
  });
  assert.deepEqual(timingWindowsForGoodWindow(200), {
    perfectMs: 60,
    greatMs: 120,
    goodMs: 200,
  });
});
