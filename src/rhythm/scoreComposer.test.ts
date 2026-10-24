import assert from 'node:assert/strict';
import test from 'node:test';
import { composeRhythmScore, noteValuesForSymbol } from '@/rhythm/scoreComposer';
import { createBarNoteNotationPlan } from '@/rhythm/noteNotation';
import { scoreNotationEvents } from '@/rhythm/scoreStaff';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';

test('composes mixed note lengths into successive bars without requiring one value per bar', () => {
  const result = composeRhythmScore({
    timeSignature: '4/4',
    trainingMode: 'two-hand',
    singleHand: 'left',
    left: [
      { durationQuarter: 0.75 },
      { durationQuarter: 0.25 },
      { durationQuarter: 0.125 },
      { durationQuarter: 0.125 },
      { durationQuarter: 4 },
    ],
    right: [{ durationQuarter: 1, isRest: true }, { durationQuarter: 4 }],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.score.measures.length, 2);
  assert.equal(result.score.totalQuarterNotes, 8);
  assert.deepEqual(result.score.measures[0]!.leftEvents.map(({ startQuarter }) => startQuarter), [0, 0.75, 1, 1.125, 1.25, 3.25]);
  assert.deepEqual(result.score.measures[1]!.leftEvents.map(({ startQuarter }) => startQuarter), [0, 1]);
  assert.deepEqual(result.score.measures[0]!.rightEvents.map(({ startQuarter, isRest }) => [startQuarter, isRest]), [[0, true], [1, undefined]]);
  assert.deepEqual(result.score.measures[1]!.rightEvents.map(({ startQuarter }) => startQuarter), [0]);
});

test('splits a note crossing the bar line into correctly tied written segments', () => {
  const result = composeRhythmScore({
    timeSignature: '2/4',
    trainingMode: 'single-hand',
    singleHand: 'right',
    left: [],
    right: [{ durationQuarter: 4 }],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  const firstSegment = result.score.measures[0]!.rightEvents[0]!;
  const continuation = result.score.measures[1]!.rightEvents[0]!;
  assert.equal(result.score.measures.length, 2);
  assert.equal(firstSegment.durationQuarter, 4);
  assert.equal(firstSegment.notationDurationQuarter, 2);
  assert.equal(firstSegment.tieToNext, true);
  assert.equal(continuation.startQuarter, 0);
  assert.equal(continuation.durationQuarter, 2);
  assert.equal(continuation.tieFromPrevious, true);
  assert.equal(continuation.isTieContinuation, true);
  assert.equal(continuation.isCrossBarTieContinuation, true);
  assert.equal(result.score.measures[0]!.leftEvents.length, 0);
});

test('decomposes awkward bar-line remainder into valid tied note values', () => {
  const result = composeRhythmScore({
    timeSignature: '4/4',
    trainingMode: 'single-hand',
    singleHand: 'left',
    left: [
      { durationQuarter: 3 },
      { durationQuarter: 0.25 },
      { durationQuarter: 2 },
    ],
    right: [],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  const firstBar = result.score.measures[0]!.leftEvents;
  const secondBar = result.score.measures[1]!.leftEvents;
  const tiedFirstBarSegments = firstBar.filter((event) => event.startQuarter >= 3.25);
  assert.deepEqual(tiedFirstBarSegments.map(({ notationDurationQuarter, tieToNext }) => [notationDurationQuarter, tieToNext]), [[0.75, true]]);
  assert.deepEqual(secondBar.map(({ startQuarter, notationDurationQuarter, tieFromPrevious, tieToNext }) => [startQuarter, notationDurationQuarter, tieFromPrevious, tieToNext]), [
    [0, 1, true, true],
    [1, 0.25, true, undefined],
  ]);
  assert.equal(secondBar[0]!.isCrossBarTieContinuation, true);
  assert.equal(secondBar[1]!.isCrossBarTieContinuation, true);
});

test('uses the meter pulse for tuplet icon groups, including compound time', () => {
  const triplet = noteValuesForSymbol('triplet', '6/8');
  assert.equal(triplet.length, 3);
  assert.deepEqual(triplet.map(({ durationQuarter, tupletNumber }) => [durationQuarter, tupletNumber]), [
    [pulseQuarterNotes('6/8') / 3, 3],
    [pulseQuarterNotes('6/8') / 3, 3],
    [pulseQuarterNotes('6/8') / 3, 3],
  ]);
  assert.equal(triplet.reduce((duration, item) => duration + item.durationQuarter, 0), pulseQuarterNotes('6/8'));
  assert.deepEqual(noteValuesForSymbol('triplet', '6/8', true), [{ durationQuarter: 1.5, isRest: true }]);
});

test('beams each composed bar in the selected simple or compound meter groups', () => {
  const simple = composeRhythmScore({
    timeSignature: '4/4',
    trainingMode: 'single-hand',
    singleHand: 'left',
    left: Array.from({ length: 8 }, () => ({ durationQuarter: 0.5 })),
    right: [],
  });
  assert.equal(simple.ok, true);
  if (!simple.ok) return;
  const simpleNotation = createBarNoteNotationPlan(scoreNotationEvents(simple.score.measures[0]!.leftEvents), {
    durationQuarter: simple.score.measures[0]!.durationQuarter,
    width: 400,
    beamGroupQuarterNotes: pulseQuarterNotes('4/4'),
  });
  assert.deepEqual(simpleNotation.beams.filter(({ level }) => level === 0).map(({ startIndex, endIndex }) => [startIndex, endIndex]), [[0, 1], [2, 3], [4, 5], [6, 7]]);

  const compound = composeRhythmScore({
    timeSignature: '6/8',
    trainingMode: 'single-hand',
    singleHand: 'left',
    left: Array.from({ length: 6 }, () => ({ durationQuarter: 0.5 })),
    right: [],
  });
  assert.equal(compound.ok, true);
  if (!compound.ok) return;
  const compoundNotation = createBarNoteNotationPlan(scoreNotationEvents(compound.score.measures[0]!.leftEvents), {
    durationQuarter: compound.score.measures[0]!.durationQuarter,
    width: 400,
    beamGroupQuarterNotes: pulseQuarterNotes('6/8'),
  });
  assert.deepEqual(compoundNotation.beams.filter(({ level }) => level === 0).map(({ startIndex, endIndex }) => [startIndex, endIndex]), [[0, 2], [3, 5]]);
});

test('creates an implicit second bar when only one hand continues and rejects rest-only scores', () => {
  const score = composeRhythmScore({
    timeSignature: '3/4',
    trainingMode: 'two-hand',
    singleHand: 'left',
    left: [{ durationQuarter: 3 }, { durationQuarter: 0.5 }],
    right: [],
  });
  assert.equal(score.ok, true);
  if (score.ok) {
    assert.equal(score.score.measures.length, 2);
    assert.equal(score.score.measures[1]!.leftEvents[0]!.startQuarter, 0);
    assert.equal(score.score.measures[1]!.rightEvents.length, 0);
  }

  assert.deepEqual(composeRhythmScore({
    timeSignature: '4/4',
    trainingMode: 'two-hand',
    singleHand: 'left',
    left: [{ durationQuarter: 4, isRest: true }],
    right: [],
  }), { ok: false, error: 'Add at least one note to the active hand or hands.' });
});
