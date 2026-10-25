import assert from 'node:assert/strict';
import test from 'node:test';
import { composerPreviewDimensions, scoreBarWidth } from '@/rhythm/scoreLayout';

test('short scores use the full viewport and longer scores show up to three complete bars', () => {
  assert.equal(scoreBarWidth(900, 1), 900);
  assert.equal(scoreBarWidth(900, 2), 450);
  assert.equal(scoreBarWidth(900, 3), 300);
  assert.equal(scoreBarWidth(900, 12), 300);
});

test('score bar sizing never forces a partial bar beyond a narrow viewport', () => {
  assert.equal(scoreBarWidth(420, 3), 140);
  assert.equal(scoreBarWidth(420, 10), 140);
  assert.equal(scoreBarWidth(0, 2), 0);
  assert.equal(scoreBarWidth(Number.NaN, 2), 0);
});

test('composer preview expands dense bars while keeping ordinary bars at their baseline width', () => {
  const ordinaryBar = composerPreviewDimensions({
    index: 0,
    startQuarter: 0,
    durationQuarter: 4,
    leftEvents: [{ startQuarter: 0, durationQuarter: 1 }],
    rightEvents: [{ startQuarter: 0, durationQuarter: 0.5 }],
  });
  assert.deepEqual(ordinaryBar, { notationWidth: 154, cardWidth: 258 });

  const denseBar = composerPreviewDimensions({
    index: 0,
    startQuarter: 0,
    durationQuarter: 4,
    leftEvents: Array.from({ length: 64 }, (_, index) => ({ startQuarter: index / 16, durationQuarter: 1 / 16 })),
    rightEvents: [],
  });
  assert.deepEqual(denseBar, { notationWidth: 448, cardWidth: 552 });
});
