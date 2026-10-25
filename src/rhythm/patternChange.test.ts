import assert from 'node:assert/strict';
import test from 'node:test';
import { alignedPatternChangeIntervalBeats } from './patternChange';

test('pattern changes keep bar alignment when the requested interval drifts through the meter', () => {
  assert.equal(alignedPatternChangeIntervalBeats(4, 3), 6);
  assert.equal(alignedPatternChangeIntervalBeats(2, 3), 3);
  assert.equal(alignedPatternChangeIntervalBeats(8, 3), 9);
  assert.equal(alignedPatternChangeIntervalBeats(4, 5), 5);
});

test('pattern changes preserve intervals that divide or contain whole bars', () => {
  assert.equal(alignedPatternChangeIntervalBeats(1, 3), 1);
  assert.equal(alignedPatternChangeIntervalBeats(2, 4), 2);
  assert.equal(alignedPatternChangeIntervalBeats(4, 4), 4);
  assert.equal(alignedPatternChangeIntervalBeats(8, 4), 8);
});

test('invalid pattern intervals are returned unchanged for caller validation', () => {
  assert.equal(alignedPatternChangeIntervalBeats(0, 3), 0);
  assert.equal(alignedPatternChangeIntervalBeats(4, 0), 4);
});
