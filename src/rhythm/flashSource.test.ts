import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeFlashSource, shouldFlashOnTap } from './flashSource';

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

test('misses still flash red for either source', () => {
  assert.equal(shouldFlashOnTap('tap', 'miss'), true);
  assert.equal(shouldFlashOnTap('beat', 'miss'), true);
});

test('ignored taps do not trigger a flash', () => {
  assert.equal(shouldFlashOnTap('tap', 'ignored'), false);
  assert.equal(shouldFlashOnTap('beat', 'ignored'), false);
});
