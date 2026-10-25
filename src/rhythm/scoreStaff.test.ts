import assert from 'node:assert/strict';
import test from 'node:test';
import { centerScoreBeatEvents, findNextScoreEvent, scoreBeatEvents, scoreHandPresence, scoreNotationEvents, scoreNotationEventsForSpan, scoreTrainingMode } from '@/rhythm/scoreStaff';
import type { ImportedRhythmScore, ScoreRhythmMeasure } from '@/types/importedScore';

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

test('focus view exposes a cross-bar tie continuation so the screen can show its rest', () => {
  const tiedContinuation: ScoreRhythmMeasure = {
    index: 1,
    startQuarter: 4,
    durationQuarter: 4,
    leftEvents: [],
    rightEvents: [{
      startQuarter: 0,
      durationQuarter: 1,
      isTieContinuation: true,
      isCrossBarTieContinuation: true,
      tieFromPrevious: true,
    }],
  };

  assert.equal(
    findNextScoreEvent(tiedContinuation, undefined, 'right', 0)?.isCrossBarTieContinuation,
    true,
  );
});

test('one-note view gathers the full rhythm for the current beat and compound pulse', () => {
  const mixedBeat: ScoreRhythmMeasure = {
    ...firstBar,
    leftEvents: [
      { startQuarter: 1.125, durationQuarter: 0.125 },
      { startQuarter: 1.25, durationQuarter: 0.25 },
      { startQuarter: 1.5, durationQuarter: 0.5 },
    ],
  };
  assert.deepEqual(scoreBeatEvents(mixedBeat, undefined, 1.4, 1, 'left').map((event) => event.startQuarter), [0.125, 0.25, 0.5]);
  assert.deepEqual(scoreBeatEvents(firstBar, nextBar, 1.6, 1.5, 'right').map((event) => event.startQuarter), [1]);
});

test('one-note view carries a compound pulse across a bar line', () => {
  const shortBar = { ...firstBar, durationQuarter: 2.5, rightEvents: [{ startQuarter: 2.25, durationQuarter: 0.25 }] };
  const followingBar = { ...nextBar, durationQuarter: 2.5, rightEvents: [{ startQuarter: 0.25, durationQuarter: 0.5 }] };

  assert.deepEqual(
    scoreBeatEvents(shortBar, followingBar, 2.1, 1.5, 'right').map((event) => event.startQuarter),
    [0.75, 1.25],
  );
});

test('single-hand score focus centers note onsets without changing their spacing', () => {
  const singleNote = centerScoreBeatEvents([{ startQuarter: 0, durationQuarter: 0.5 }], 1);
  assert.equal(singleNote[0]?.startQuarter, 0.5);

  const mixedRhythm = centerScoreBeatEvents([
    { startQuarter: 0.125, durationQuarter: 0.125 },
    { startQuarter: 0.375, durationQuarter: 0.125 },
    { startQuarter: 0.625, durationQuarter: 0.25 },
  ], 1);
  assert.deepEqual(mixedRhythm.map((event) => event.startQuarter), [0.25, 0.5, 0.75]);
  assert.deepEqual(
    mixedRhythm.slice(1).map((event, index) => event.startQuarter - mixedRhythm[index]!.startQuarter),
    [0.25, 0.25],
  );
});

test('centering leaves empty beats and invalid durations unchanged', () => {
  assert.deepEqual(centerScoreBeatEvents([], 1), []);
  const events = [{ startQuarter: 0.25, durationQuarter: 0.25 }];
  assert.deepEqual(centerScoreBeatEvents(events, 0), events);
});

test('score hand presence ignores empty and continuation-only lanes', () => {
  const singleActiveHandScore: ImportedRhythmScore = {
    formatVersion: 1,
    title: 'Single active hand',
    timeSignature: '4/4',
    trackCount: 2,
    bpm: null,
    measures: [{
      ...firstBar,
      leftEvents: [{ startQuarter: 0, durationQuarter: 1, isTieContinuation: true }],
      rightEvents: [{ startQuarter: 0, durationQuarter: 1 }],
    }],
    totalQuarterNotes: 4,
    warnings: [],
  };

  assert.deepEqual(scoreHandPresence(singleActiveHandScore), { left: false, right: true });
  assert.deepEqual(scoreTrainingMode(singleActiveHandScore, 'left'), { trainingMode: 'single-hand', singleHand: 'right' });
  assert.deepEqual(scoreTrainingMode({ ...singleActiveHandScore, trackCount: 1 }, 'left'), { trainingMode: 'single-hand', singleHand: 'left' });
  assert.deepEqual(scoreTrainingMode({ ...singleActiveHandScore, measures: [{ ...firstBar }] }, 'left'), { trainingMode: 'two-hand' });
});

test('staff notation uses each tied segment duration instead of overflowing the bar', () => {
  const notationEvents = scoreNotationEvents([
    { startQuarter: 3, durationQuarter: 2, notationDurationQuarter: 1, tieToNext: true },
  ]);

  assert.deepEqual(notationEvents, [
    { startQuarter: 3, durationQuarter: 1, tieToNext: true },
  ]);
});

test('staff notation preserves explicit rests for library engraving', () => {
  assert.deepEqual(scoreNotationEvents([
    { startQuarter: 0, durationQuarter: 1, isRest: true },
    { startQuarter: 1, durationQuarter: 1 },
    { startQuarter: 2, durationQuarter: 1, isCrossBarTieContinuation: true, tieFromPrevious: true },
  ]), [
    { startQuarter: 0, durationQuarter: 1, isRest: true },
    { startQuarter: 1, durationQuarter: 1 },
    { startQuarter: 2, durationQuarter: 1, isRest: true, tieFromPrevious: true },
  ]);
});

test('score spans with no events render a centered rest glyph using a supported duration', () => {
  assert.deepEqual(scoreNotationEventsForSpan([], 1.5), [
    { startQuarter: 0.75, durationQuarter: 1.5, isRest: true },
  ]);
  assert.deepEqual(scoreNotationEventsForSpan([], 3), [
    { startQuarter: 1.5, durationQuarter: 3, isRest: true },
  ]);
  assert.deepEqual(scoreNotationEventsForSpan([], 5), [
    { startQuarter: 2.5, durationQuarter: 4, isRest: true },
  ]);
  assert.deepEqual(scoreNotationEventsForSpan([{ startQuarter: 0, durationQuarter: 1 }], 4), [
    { startQuarter: 0, durationQuarter: 1 },
  ]);
});
