import assert from 'node:assert/strict';
import test from 'node:test';
import { scoreBarWidth } from '@/rhythm/scoreLayout';

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
