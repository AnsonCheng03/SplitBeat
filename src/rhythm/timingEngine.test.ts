/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateExerciseSteps } from '@/rhythm/exerciseGenerator';
import {
  beatDurationMs,
  expectedEventTimeMs,
  subdivisionOffsetMs,
  subdivisionIntervalMs,
  timeSignatureMetrics,
} from '@/rhythm/subdivisions';
import { matchTap } from '@/rhythm/tapMatcher';
import { getExerciseStartTime, RhythmTimingEngine } from '@/rhythm/timingEngine';
import type { ExerciseSettings } from '@/types/rhythm';

const settings: ExerciseSettings = {
  bpm: 60,
  timeSignature: '4/4',
  durationSeconds: 30,
  changeIntervalBeats: 4,
  enabledSubdivisions: ['quarter', 'eighth'],
  feel: 'straight',
  graceNotesEnabled: false,
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

test('swing stretches binary offbeats while triplets remain even', () => {
  assert.equal(subdivisionOffsetMs(1_000, 'eighth', 0, 'swing'), 0);
  assert.equal(subdivisionOffsetMs(1_000, 'eighth', 1, 'straight'), 500);
  assert.ok(Math.abs(subdivisionOffsetMs(1_000, 'eighth', 1, 'swing') - 666.6666667) < 0.001);
  const swungSixteenths = [0, 1, 2, 3].map((index) =>
    subdivisionOffsetMs(1_000, 'sixteenth', index, 'swing'),
  );
  const expectedSwingOffsets = [0, 1_000 / 3, 2_000 / 3, 5_000 / 6];
  assert.ok(swungSixteenths.every((offset, index) => Math.abs(offset - expectedSwingOffsets[index]) < 0.001));
  assert.ok(Math.abs(subdivisionOffsetMs(1_000, 'triplet', 1, 'swing') - 1_000 / 3) < 0.001);
});

test('time signatures describe the right pulse, bar length, and quarter-note duration', () => {
  assert.deepEqual(timeSignatureMetrics(60, '4/4'), {
    numerator: 4,
    denominator: 4,
    beatsPerBar: 4,
    compound: false,
    beatDurationMs: 1_000,
    quarterNoteDurationMs: 1_000,
  });
  assert.deepEqual(timeSignatureMetrics(60, '6/8'), {
    numerator: 6,
    denominator: 8,
    beatsPerBar: 2,
    compound: true,
    beatDurationMs: 1_000,
    quarterNoteDurationMs: 1_000 / 1.5,
  });
  assert.equal(timeSignatureMetrics(60, '9/8').beatsPerBar, 3);
  assert.equal(timeSignatureMetrics(60, '12/8').beatsPerBar, 4);
  assert.equal(timeSignatureMetrics(60, '3/8').quarterNoteDurationMs, 2_000);
  assert.equal(timeSignatureMetrics(60, '2/2').quarterNoteDurationMs, 500);
});

test('compound meter note subdivisions use quarter-note durations inside dotted-quarter pulses', () => {
  assert.ok(Math.abs(subdivisionIntervalMs(60, 'eighth', '6/8') - 1_000 / 3) < 0.000001);
  assert.equal(expectedEventTimeMs(5_000, 60, 1, 0, 'eighth', '6/8'), 6_000);
  assert.ok(
    Math.abs(expectedEventTimeMs(5_000, 60, 1, 1, 'eighth', '6/8') - (6_000 + 1_000 / 3)) <
      0.000001,
  );
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

test('the timing engine matches a swung offbeat at its warped timestamp', () => {
  const start = 30_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...settings,
      feel: 'swing',
      changeIntervalBeats: 2,
    },
    sessionStartTime: start,
    random: () => 0,
  });
  const swungOffbeat = start + 2_000 + (2_000 / 3);

  engine.tap('right', swungOffbeat);
  const snapshot = engine.advance(swungOffbeat + 101);

  assert.equal(snapshot.rightStats.totalHit, 1);
  assert.equal(snapshot.rightStats.averageSignedErrorMs, 0);
});

test('grace pickups are generated before a switch and count as transition hits once', () => {
  const start = 40_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...settings,
      enabledSubdivisions: ['quarter'],
      changeIntervalBeats: 2,
      graceNotesEnabled: true,
    },
    sessionStartTime: start,
    random: () => 0,
  });
  const graceTime = start + 1_750;

  engine.tap('left', graceTime);
  engine.tap('left', graceTime);
  const results = engine.getResults(graceTime + 101);

  assert.equal(results.left.totalHit, 1);
  assert.equal(results.transition.totalHit, 1);
  assert.equal(results.graceNotesEnabled, true);
});

test('grace pickups stay disabled by default and do not appear before the first pattern', () => {
  const start = 45_000;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, enabledSubdivisions: ['quarter'], changeIntervalBeats: 2 },
    sessionStartTime: start,
    random: () => 0,
  });

  engine.advance(start + 1_100);
  assert.equal(engine.advance(start + 1_851).leftStats.totalExpected, 2);
  assert.equal(engine.advance(start + 1_851).leftStats.totalHit, 0);
});

test('compound meter counts dotted-quarter beats while notes follow quarter-note spacing', () => {
  const start = 20_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...settings,
      timeSignature: '6/8',
      enabledSubdivisions: ['quarter'],
      changeIntervalBeats: 2,
    },
    sessionStartTime: start,
    random: () => 0,
  });

  const firstPulse = engine.advance(start + 800);
  assert.equal(firstPulse.leftStats.totalExpected, 2);
  assert.equal(firstPulse.beatsPerBar, 2);
  assert.equal(firstPulse.beatInBar, 0);
  assert.equal(firstPulse.nextStep?.startBeat, 2);
  assert.equal(firstPulse.secondsUntilChange, 1.2);

  const secondPulse = engine.advance(start + 1_000);
  assert.equal(secondPulse.beatIndex, 1);
  assert.equal(secondPulse.beatInBar, 1);

  const preview = engine.advance(start + 1_500);
  assert.equal(preview.currentStep.startBeat, 0);
  assert.equal(preview.secondsUntilChange, 0.5);

  const nextBar = engine.advance(start + 2_000);
  assert.equal(nextBar.beatIndex, 2);
  assert.equal(nextBar.beatInBar, 0);
  assert.equal(nextBar.currentStep.startBeat, 2);
});

test('simple eighth-note meters keep quarter-note events two pulses apart', () => {
  const start = 25_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...settings,
      timeSignature: '3/8',
      enabledSubdivisions: ['quarter'],
    },
    sessionStartTime: start,
    random: () => 0,
  });

  const firstNote = engine.advance(start + 1_100);
  assert.equal(firstNote.leftStats.totalExpected, 1);
  assert.equal(firstNote.beatsPerBar, 3);
  const secondNote = engine.advance(start + 2_101);
  assert.equal(secondNote.leftStats.totalExpected, 2);
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

test('next pattern preview counts down to the exact beat boundary', () => {
  const start = 30_000;
  const engine = new RhythmTimingEngine({ settings, sessionStartTime: start, random: () => 0 });

  const beforeSwitch = engine.advance(start + 2_500);
  assert.equal(beforeSwitch.currentStep.startBeat, 0);
  assert.equal(beforeSwitch.nextStep?.startBeat, 4);
  assert.equal(beforeSwitch.beatsUntilChange, 2);
  assert.equal(beforeSwitch.secondsUntilChange, 1.5);

  const atSwitch = engine.advance(start + 4_000);
  assert.equal(atSwitch.currentStep.startBeat, 4);
  assert.equal(atSwitch.nextStep?.startBeat, 8);
  assert.equal(atSwitch.secondsUntilChange, 4);
});

test('next pattern is hidden during count-in and when the session ends before another switch', () => {
  const start = 40_000;
  const countdownEngine = new RhythmTimingEngine({ settings, sessionStartTime: start, random: () => 0 });
  const countdown = countdownEngine.advance(start - 1);
  assert.equal(countdown.nextStep, null);
  assert.equal(countdown.secondsUntilChange, null);

  const shortSession = new RhythmTimingEngine({
    settings: { ...settings, durationSeconds: 30, changeIntervalBeats: 8 },
    sessionStartTime: start,
    random: () => 0,
  });
  const lastPattern = shortSession.advance(start + 29_000);
  assert.equal(lastPattern.nextStep, null);
  assert.equal(lastPattern.secondsUntilChange, null);
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
  assert.equal(getExerciseStartTime(100, 60, 300, '6/8'), 100 + 300 + 3_000);
});
