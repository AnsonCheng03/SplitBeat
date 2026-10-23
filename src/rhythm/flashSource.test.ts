import assert from 'node:assert/strict';
import test from 'node:test';
import { getTapResultFlash, normalizeFlashSource, shouldFlashOnTap } from './flashSource';

test('flash preferences restore valid sources and default legacy values to tap', () => {
  assert.equal(normalizeFlashSource('beat'), 'beat');
  assert.equal(normalizeFlashSource('tap'), 'tap');
  assert.equal(normalizeFlashSource(undefined), 'tap');
  assert.equal(normalizeFlashSource('unknown', 'beat'), 'beat');
});

test('tap flash source lights the hand zone for a matched tap', () => {
  assert.equal(shouldFlashOnTap('tap', 'hit'), true);
});

test('beat flash source suppresses the matched-tap flash', () => {
  assert.equal(shouldFlashOnTap('beat', 'hit'), false);
});

test('miss colors are controlled by the result-color option, not the flash source', () => {
  assert.equal(shouldFlashOnTap('tap', 'miss'), false);
  assert.equal(shouldFlashOnTap('beat', 'miss'), false);
  assert.equal(getTapResultFlash(true, 'miss'), 'incorrect');
  assert.equal(getTapResultFlash(false, 'miss'), null);
});

test('ignored taps do not trigger a flash', () => {
  assert.equal(shouldFlashOnTap('tap', 'ignored'), false);
  assert.equal(shouldFlashOnTap('beat', 'ignored'), false);
});

test('optional tap result colors distinguish correct, missed, and ignored taps', () => {
  assert.equal(getTapResultFlash(true, 'hit'), 'correct');
  assert.equal(getTapResultFlash(true, 'miss'), 'incorrect');
  assert.equal(getTapResultFlash(true, 'ignored'), null);
  assert.equal(getTapResultFlash(false, 'hit'), null);
  assert.equal(getTapResultFlash(false, 'miss'), null);
});
