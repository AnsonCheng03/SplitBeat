import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  appendSessionRecord,
  createSessionRecord,
  parseSessionHistory,
} from '@/store/sessionHistory';
import type { SessionResults } from '@/types/rhythm';

const results: SessionResults = {
  bpm: 80,
  timeSignature: '4/4',
  feel: 'straight',
  graceNotesEnabled: false,
  restBetweenChanges: false,
  trainingMode: 'two-hand',
  singleHand: 'left',
  left: {
    totalExpected: 10,
    totalHit: 9,
    perfect: 8,
    great: 1,
    good: 0,
    miss: 1,
    averageAbsoluteErrorMs: 10,
    averageSignedErrorMs: 5,
  },
  right: {
    totalExpected: 10,
    totalHit: 8,
    perfect: 7,
    great: 1,
    good: 0,
    miss: 2,
    averageAbsoluteErrorMs: 15,
    averageSignedErrorMs: -8,
  },
  stable: { totalExpected: 20, totalHit: 17 },
  transition: { totalExpected: 0, totalHit: 0 },
  combinations: [],
  durationSeconds: 30,
  missedEvents: [{
    id: 'missed-score-note',
    hand: 'left',
    barIndex: 1,
    beatInBar: 0,
    midiPitches: [60],
    isScoreEvent: true,
  }],
};

test('session history stores summary results without missed-note replay data', () => {
  const record = createSessionRecord('session-1', 1234, results);

  assert.equal(record.overallAccuracy, 85);
  assert.equal(record.leftAccuracy, 90);
  assert.equal(record.rightAccuracy, 80);
  assert.equal('missedEvents' in record, false);
  assert.equal('midiPitches' in record, false);
});

test('session history parsing tolerates corrupt entries and newest-first append deduplicates', () => {
  const record = createSessionRecord('session-1', 1234, results);
  const parsed = parseSessionHistory(JSON.stringify([record, null, { id: 'bad' }]));

  assert.deepEqual(parsed, [record]);
  assert.deepEqual(appendSessionRecord(parsed, { ...record, completedAt: 5678 }), [
    { ...record, completedAt: 5678 },
  ]);
  assert.deepEqual(parseSessionHistory('{bad json'), []);
});
