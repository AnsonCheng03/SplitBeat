import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isNativeHardwareKeyEvent,
  keyboardHandForKey,
  synchronizeKeyboardTimestamp,
} from '@/rhythm/keyboardInput';

test('keyboard rows and number keys are split between the two hands', () => {
  for (const key of 'qwertasdfgzxcvb12345') assert.equal(keyboardHandForKey(key), 'left');
  for (const key of 'yuiophjklmn67890') assert.equal(keyboardHandForKey(key), 'right');
  assert.equal(keyboardHandForKey('A'), 'left');
  assert.equal(keyboardHandForKey('N'), 'right');
  assert.equal(keyboardHandForKey(' '), null);
  assert.equal(keyboardHandForKey('Enter'), null);
});

test('Android hardware key payloads require finite native timestamps', () => {
  assert.equal(isNativeHardwareKeyEvent({ key: 'a', eventTimeMs: 10, nativeTimeMs: 9 }), true);
  assert.equal(isNativeHardwareKeyEvent({ key: 'a', eventTimeMs: Number.NaN, nativeTimeMs: 9 }), false);
  assert.equal(isNativeHardwareKeyEvent(null), false);
});

test('native key times are mapped to the app clock using the lowest observed bridge offset', () => {
  const first = synchronizeKeyboardTimestamp(2_000, 2_010, 5_020, null);
  assert.deepEqual(first, { timestampMs: 5_010, clockOffsetMs: 3_010 });

  const delayedSample = synchronizeKeyboardTimestamp(2_100, 2_115, 5_135, first.clockOffsetMs);
  assert.deepEqual(delayedSample, { timestampMs: 5_110, clockOffsetMs: 3_010 });

  const fasterSample = synchronizeKeyboardTimestamp(2_200, 2_220, 5_225, delayedSample.clockOffsetMs);
  assert.deepEqual(fasterSample, { timestampMs: 5_205, clockOffsetMs: 3_005 });
});
