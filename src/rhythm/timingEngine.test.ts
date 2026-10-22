/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateExerciseSteps } from '@/rhythm/exerciseGenerator';
import { beatDurationMs, expectedEventTimeMs, subdivisionIntervalMs } from '@/rhythm/subdivisions';
import { matchTap } from '@/rhythm/tapMatcher';
import { getExerciseStartTime, RhythmTimingEngine } from '@/rhythm/timingEngine';
import type { ExerciseSettings } from '@/types/rhythm';

const settings: ExerciseSettings = {
  bpm: 60,
  durationSeconds: 30,
  changeIntervalBeats: 4,
  enabledSubdivisions: ['quarter', 'eighth'],
  soundEnabled: false,
  hapticsEnabled: false,
};

test('subdivision intervals follow the selected BPM', () => {
  assert.equal(beatDurationMs(60), 1_000);
  assert.equal(subdivisionIntervalMs(60, 'quarter'), 1_000);
  assert.equal(subdivisionIntervalMs(60, 'eighth'), 500);
  assert.equal(subdivisionIntervalMs(60, 'thirtySecond'), 125);
  assert.equal(subdivisionIntervalMs(60, 'sixtyFourth'), 62.5);
  assert.equal(subdivisionIntervalMs(60, 'sixteenth'), 250);
  assert.ok(Math.abs(subdivisionIntervalMs(60, 'triplet') - 333.3333333333) < 0.000001);
});

test('expected timestamps stay anchored to the session start across bars', () => {
  const start = 12_345.5;
  assert.equal(expectedEventTimeMs(start, 60, 0), start);
  assert.equal(expectedEventTimeMs(start, 60, 4), start + 4_000);
  assert.equal(expectedEventTimeMs(start, 60, 8), start + 8_000);
  assert.equal(expectedEventTimeMs(start, 60, 8, 1, 'eighth'), start + 8_500);
  assert.equal(expectedEventTimeMs(start, 60, 8, 7, 'thirtySecond'), start + 8_875);
  assert.equal(expectedEventTimeMs(start, 60, 8, 15, 'sixtyFourth'), start + 8_937.5);
});

test('the timing engine generates all 64th-note events from beat timestamps', () => {
  const start = 20_000;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, enabledSubdivisions: ['sixtyFourth'] },
    sessionStartTime: start,
    random: () => 0,
  });

  const snapshot = engine.advance(start + 1_040);
  assert.equal(snapshot.leftStats.totalExpected, 16);
  assert.equal(snapshot.rightStats.totalExpected, 16);
});

test('long-run timestamps use the origin formula instead of accumulating timer delays', () => {
  const start = 8_500.25;
  const beatIndex = 60_000;
  const beatMs = beatDurationMs(73);
  const expected = start + beatIndex * beatMs;
  const actual = expectedEventTimeMs(start, 73, beatIndex);
  assert.equal(actual, expected);
});

test('exercise changes occur at configured beat boundaries without immediate repeats', () => {
  const steps = generateExerciseSteps(
    { enabledSubdivisions: ['quarter', 'eighth'], changeIntervalBeats: 4, random: () => 0 },
    4,
  );
  assert.deepEqual(steps.map((step) => step.startBeat), [0, 4, 8, 12]);
  for (let index = 1; index < steps.length; index += 1) {
    assert.notDeepEqual(
      [steps[index].leftSubdivision, steps[index].rightSubdivision],
      [steps[index - 1].leftSubdivision, steps[index - 1].rightSubdivision],
    );
  }
});

test('tap matching grades exact, early, and late taps and rejects taps outside the window', () => {
  const exact = matchTap([{ id: 'e1', expectedTimeMs: 1_000, matched: false }], 1_000);
  const early = matchTap([{ id: 'e1', expectedTimeMs: 1_000, matched: false }], 980);
  const late = matchTap([{ id: 'e1', expectedTimeMs: 1_000, matched: false }], 1_045);
  const edge = matchTap([{ id: 'e1', expectedTimeMs: 1_000, matched: false }], 1_100);
  const missed = matchTap([{ id: 'e1', expectedTimeMs: 1_000, matched: false }], 1_101);
  assert.deepEqual(exact, { eventId: 'e1', timingErrorMs: 0, grade: 'perfect' });
  assert.equal(early?.timingErrorMs, -20);
  assert.equal(early?.grade, 'perfect');
  assert.equal(late?.timingErrorMs, 45);
  assert.equal(late?.grade, 'great');
  assert.equal(edge?.timingErrorMs, 100);
  assert.equal(edge?.grade, 'good');
  assert.equal(missed, null);
});

test('duplicate taps cannot consume an expected event twice', () => {
  const event = { id: 'e1', expectedTimeMs: 1_000, matched: false };
  const first = matchTap([event], 1_000);
  event.matched = true;
  const duplicate = matchTap([event], 1_001);
  assert.equal(first?.eventId, 'e1');
  assert.equal(duplicate, null);
});

test('left and right taps match independently at the same timestamp', () => {
  const left = matchTap([{ id: 'left-1', expectedTimeMs: 2_000, matched: false }], 2_001);
  const right = matchTap([{ id: 'right-1', expectedTimeMs: 2_000, matched: false }], 1_999);
  assert.equal(left?.eventId, 'left-1');
  assert.equal(right?.eventId, 'right-1');
  assert.equal(left?.timingErrorMs, 1);
  assert.equal(right?.timingErrorMs, -1);
});

test('session engine scores simultaneous hands and counts later missed notes', () => {
  const start = 10_000;
  const engine = new RhythmTimingEngine({ settings, sessionStartTime: start, random: () => 0 });
  engine.tap('left', start + 100);
  engine.tap('right', start);
  let snapshot = engine.advance(start + 101);
  assert.equal(snapshot.leftStats.totalHit, 1);
  assert.ok(Math.abs(snapshot.leftStats.averageSignedErrorMs - 100) < 0.001);
  assert.equal(snapshot.rightStats.totalHit, 1);
  snapshot = engine.advance(start + 1_101);
  assert.ok(snapshot.leftStats.totalExpected > snapshot.leftStats.totalHit);
  assert.ok(snapshot.rightStats.totalExpected > snapshot.rightStats.totalHit);
});

test('the first two beats after a pair change are scored as transition events', () => {
  const start = 50_000;
  const engine = new RhythmTimingEngine({ settings, sessionStartTime: start, random: () => 0 });
  const results = engine.getResults(start + 4_101);
  assert.ok(results.transition.totalExpected);
  assert.ok(results.stable.totalExpected);
});

test('count-in places the first exercise beat after three full beats and lead-in', () => {
  assert.equal(getExerciseStartTime(100, 120, 300), 100 + 300 + 1_500);
});
