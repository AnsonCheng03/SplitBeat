import assert from 'node:assert/strict';
import test from 'node:test';
import {
  scoreFadeOutgoingSequence,
  scoreFadeVisibleSequences,
  scoreNoteScrollProgress,
  scoreStripOffset,
} from '@/rhythm/scoreMotion';
import type { ScoreRhythmMeasure } from '@/types/importedScore';

const measure: ScoreRhythmMeasure = {
  index: 0,
  startQuarter: 0,
  durationQuarter: 4,
  leftEvents: [
    { startQuarter: 0, durationQuarter: 1 },
    { startQuarter: 2, durationQuarter: 1 },
  ],
  rightEvents: [
    { startQuarter: 0, durationQuarter: 0.5 },
    { startQuarter: 1, durationQuarter: 0.5, isRest: true },
    { startQuarter: 3, durationQuarter: 1 },
  ],
};

test('slide advances by at most one bar even after the sequence skips several bars', () => {
  for (const sequence of [1, 2, 7, 1_000]) {
    assert.equal(scoreStripOffset('slide', 240, sequence, 0), -240, `sequence ${sequence}`);
  }
  assert.equal(scoreStripOffset('slide', 240, 0, 0), 0);
});

test('fade keeps the score strip at a fixed horizontal position', () => {
  assert.equal(scoreStripOffset('fade', 240, 0, 0), 0);
  assert.equal(scoreStripOffset('fade', 240, 20, 0.8), 0);
});

test('fade advances the first and second fixed score slots on beats three and four', () => {
  assert.deepEqual(scoreFadeVisibleSequences(2, 6, 0, 4), [2, 3, 4]);
  assert.deepEqual(scoreFadeVisibleSequences(2, 6, 1, 4), [2, 3, 4]);
  assert.deepEqual(scoreFadeVisibleSequences(2, 6, 2, 4), [3, 3, 4]);
  assert.deepEqual(scoreFadeVisibleSequences(2, 6, 3, 4), [3, 4, 4]);
  assert.deepEqual(scoreFadeVisibleSequences(3, 6, 0, 4), [3, 4, 5]);
  assert.equal(scoreFadeOutgoingSequence(0, 2, 6, 2, 4), 2);
  assert.equal(scoreFadeOutgoingSequence(1, 2, 6, 3, 4), 3);
  assert.equal(scoreFadeOutgoingSequence(0, 2, 6, 3, 4), undefined);
  assert.equal(scoreFadeOutgoingSequence(1, 2, 6, 2, 4), undefined);
});

test('fade waits for the third beat in shorter meters and does not advance past the score', () => {
  assert.deepEqual(scoreFadeVisibleSequences(1, 5, 1, 3), [1, 2, 3]);
  assert.deepEqual(scoreFadeVisibleSequences(1, 5, 2, 3), [2, 2, 3]);
  assert.deepEqual(scoreFadeVisibleSequences(4, 5, 3, 4), [4]);
});

test('slide per note groups simultaneous hands and advances at each rest or note onset', () => {
  assert.equal(scoreNoteScrollProgress(measure, 0), 0);
  assert.equal(scoreNoteScrollProgress(measure, 0.999), 0);
  assert.equal(scoreNoteScrollProgress(measure, 1), 1 / 3);
  assert.equal(scoreNoteScrollProgress(measure, 2), 2 / 3);
  assert.equal(scoreNoteScrollProgress(measure, 3), 1);
  assert.equal(scoreStripOffset('slide-per-note', 240, 0, 1 / 3), -80);
  assert.equal(scoreStripOffset('slide-per-note', 240, 4, 1 / 3), -320);
});
