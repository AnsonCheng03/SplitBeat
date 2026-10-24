import assert from 'node:assert/strict';
import test from 'node:test';
import { findNextScoreEvent } from '@/rhythm/scoreStaff';
import type { ScoreRhythmMeasure } from '@/types/importedScore';

const firstBar: ScoreRhythmMeasure = {
  index: 0,
  startQuarter: 0,
  durationQuarter: 4,
  leftEvents: [
    { startQuarter: 0, durationQuarter: 1 },
    { startQuarter: 1.5, durationQuarter: 0.5, midiPitches: [64] },
    { startQuarter: 2, durationQuarter: 1 },
    { startQuarter: 3.5, durationQuarter: 0.5 },
  ],
  rightEvents: [
    { startQuarter: 0.5, durationQuarter: 0.5 },
    { startQuarter: 2.5, durationQuarter: 0.5, tupletNumber: 3 },
  ],
};

const nextBar: ScoreRhythmMeasure = {
  index: 1,
  startQuarter: 4,
  durationQuarter: 4,
  leftEvents: [{ startQuarter: 0.25, durationQuarter: 0.5 }],
  rightEvents: [{ startQuarter: 1, durationQuarter: 1 }],
};

test('focus view finds each hand event and rolls forward across bars', () => {
  assert.equal(findNextScoreEvent(firstBar, nextBar, 'left', 1.6)?.startQuarter, 1.5);
  assert.equal(findNextScoreEvent(firstBar, nextBar, 'right', 3)?.startQuarter, 1);
  assert.equal(findNextScoreEvent(firstBar, nextBar, 'left', 4)?.startQuarter, 0.25);
});
