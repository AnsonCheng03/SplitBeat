import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addTapTempoSample, TAP_TEMPO_WINDOW_MS } from '@/rhythm/tapTempo';

test('tap tempo averages the taps in the trailing five seconds and rounds to an integer', () => {
  let sample = addTapTempoSample([], 0);
  assert.equal(sample.bpm, null);
  sample = addTapTempoSample(sample.tapTimes, 480);
  assert.equal(sample.bpm, 125);
  sample = addTapTempoSample(sample.tapTimes, 970);
  assert.equal(sample.bpm, 124);
  sample = addTapTempoSample(sample.tapTimes, 1_500);
  assert.equal(sample.bpm, 120);
});

test('tap tempo drops old taps after five seconds and starts a new average', () => {
  const first = addTapTempoSample([0, 500, 1_000], TAP_TEMPO_WINDOW_MS + 2_000);
  assert.deepEqual(first.tapTimes, [TAP_TEMPO_WINDOW_MS + 2_000]);
  assert.equal(first.bpm, null);

  const second = addTapTempoSample(first.tapTimes, TAP_TEMPO_WINDOW_MS + 2_500);
  assert.equal(second.bpm, 120);
});

test('tap tempo ignores intervals outside the supported 40 to 200 BPM range', () => {
  const tooFast = addTapTempoSample([0], 250);
  assert.equal(tooFast.bpm, null);
  const fastest = addTapTempoSample([0], 300);
  assert.equal(fastest.bpm, 200);
  const slowest = addTapTempoSample([0], 1_500);
  assert.equal(slowest.bpm, 40);
  const tooSlow = addTapTempoSample([0], 1_600);
  assert.equal(tooSlow.bpm, null);
});
