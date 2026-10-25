/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { barPositionForBeat } from '@/rhythm/barPosition';

test('bar positions snap accumulated floating-point drift to the next bar', () => {
  assert.deepEqual(barPositionForBeat(2.9999999999920526, 3), {
    barOffset: 1,
    beatInBar: 0,
  });
  assert.deepEqual(barPositionForBeat(2.5, 3), {
    barOffset: 0,
    beatInBar: 2.5,
  });
  assert.deepEqual(barPositionForBeat(3, 4), {
    barOffset: 0,
    beatInBar: 3,
  });
});
