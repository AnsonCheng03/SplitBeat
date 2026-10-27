import assert from 'node:assert/strict';
import test from 'node:test';
import { createTimestampBuildNumber } from './testflight-build-number.mjs';

test('formats UTC date and time as a compact TestFlight build number', () => {
  const date = new Date('2026-10-27T12:34:56.789Z');

  assert.equal(createTimestampBuildNumber(date), '20261027123456');
});

test('converts other timezone offsets to UTC before formatting', () => {
  const date = new Date('2026-10-27T20:34:56+08:00');

  assert.equal(createTimestampBuildNumber(date), '20261027123456');
});

test('rejects an invalid date', () => {
  assert.throws(() => createTimestampBuildNumber(new Date(Number.NaN)), TypeError);
});
