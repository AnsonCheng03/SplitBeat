/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateExerciseSteps } from '@/rhythm/exerciseGenerator';
import {
  beatDurationMs,
  expectedEventTimeMs,
  subdivisionIntervalQuarterNotes,
  pulseQuarterNotes,
  subdivisionOffsetMs,
  subdivisionIntervalMs,
  timeSignatureMetrics,
} from '@/rhythm/subdivisions';
import { matchTap } from '@/rhythm/tapMatcher';
import { getExerciseStartTime, RhythmTimingEngine } from '@/rhythm/timingEngine';
import type { ExerciseSettings } from '@/types/rhythm';
import type { ImportedRhythmScore } from '@/types/importedScore';

const settings: ExerciseSettings = {
  bpm: 60,
  timeSignature: '4/4',
  durationSeconds: 30,
  changeIntervalBeats: 4,
  restBetweenChanges: false,
  enabledSubdivisions: ['quarter', 'eighth'],
  feel: 'straight',
  graceNotesEnabled: false,
  trainingMode: 'two-hand',
  singleHand: 'left',
  soundEnabled: false,
  metronomeSound: 'wood',
  leftHandSound: 'soft',
  rightHandSound: 'beep',
  leftFlashSource: 'tap',
  rightFlashSource: 'tap',
  referenceRhythmEnabled: false,
  leftTapOffsetMs: 0,
  rightTapOffsetMs: 0,
  goodWindowMs: 100,
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
  assert.equal(subdivisionIntervalMs(60, 'duplet', '6/8'), 500);
  assert.ok(Math.abs(subdivisionIntervalMs(60, 'triplet', '2/2') - 1_000 / 3) < 0.000001);
  assert.ok(Math.abs(subdivisionIntervalMs(60, 'sextuplet', '4/4') - 1_000 / 6) < 0.000001);
  assert.equal(subdivisionIntervalQuarterNotes('duplet', '6/8'), 0.75);
  assert.equal(expectedEventTimeMs(5_000, 60, 1, 1, 'duplet', '6/8'), 6_500);
});

test('reference playback events use the same mixed left and right pattern timestamps', () => {
  const start = 12_000;
  const engine = new RhythmTimingEngine({
    settings,
    sessionStartTime: start,
    patternPairs: [{ leftSubdivision: 'quarter', rightSubdivision: 'eighth' }],
  });

  const events = engine.getReferenceEventsThrough(start + 2_500);
  assert.deepEqual(
    events.map(({ hand, expectedTimeMs }) => [hand, expectedTimeMs]),
    [
      ['left', start],
      ['left', start + 1_000],
      ['left', start + 2_000],
      ['right', start],
      ['right', start + 500],
      ['right', start + 1_000],
      ['right', start + 1_500],
      ['right', start + 2_000],
      ['right', start + 2_500],
    ],
  );
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
  assert.equal(pulseQuarterNotes('6/8'), 1.5);
  assert.equal(pulseQuarterNotes('3/8'), 0.5);
  assert.equal(pulseQuarterNotes('2/2'), 2);
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

test('single-hand mode scores only the selected hand and ignores the other side', () => {
  const start = 35_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...settings,
      trainingMode: 'single-hand',
      singleHand: 'right',
      changeIntervalBeats: 2,
      enabledSubdivisions: ['quarter', 'eighth'],
    },
    sessionStartTime: start,
    random: () => 0,
  });

  assert.equal(engine.tap('left', start), 'ignored');
  assert.equal(engine.tap('right', start), 'hit');
  const results = engine.getResults(start + 150);
  assert.equal(results.right.totalExpected, 1);
  assert.equal(results.right.totalHit, 1);
  assert.equal(results.left.totalExpected, 0);
  assert.equal(results.trainingMode, 'single-hand');
  assert.equal(results.singleHand, 'right');
});

test('a guided lesson only generates its authored hand patterns', () => {
  const steps = generateExerciseSteps({
    enabledSubdivisions: ['quarter', 'eighth', 'triplet'],
    changeIntervalBeats: 4,
    patternPairs: [
      { leftSubdivision: 'quarter', rightSubdivision: 'triplet' },
      { leftSubdivision: 'triplet', rightSubdivision: 'quarter' },
    ],
    random: () => 0.99,
  }, 6);

  assert.deepEqual(steps.map(({ leftSubdivision, rightSubdivision }) => [leftSubdivision, rightSubdivision]), [
    ['triplet', 'quarter'],
    ['quarter', 'triplet'],
    ['triplet', 'quarter'],
    ['quarter', 'triplet'],
    ['triplet', 'quarter'],
    ['quarter', 'triplet'],
  ]);
  assert.deepEqual(steps.map(({ startBeat }) => startBeat), [0, 4, 8, 12, 16, 20]);
});

test('rest before a change silences the last beat while the metronome beat stays aligned', () => {
  const start = 36_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...settings,
      changeIntervalBeats: 2,
      restBetweenChanges: true,
      enabledSubdivisions: ['quarter'],
    },
    sessionStartTime: start,
    random: () => 0,
  });

  const duringRest = engine.advance(start + 1_000);
  assert.equal(duringRest.isRest, true);
  assert.equal(duringRest.leftStats.totalExpected, 1);
  assert.equal(engine.tap('left', start + 1_000), 'miss');

  const onChange = engine.advance(start + 2_000);
  assert.equal(onChange.isRest, false);
  assert.equal(onChange.currentStep.startBeat, 2);
});

test('out-of-window taps return miss feedback without consuming an event', () => {
  const start = 37_000;
  const engine = new RhythmTimingEngine({ settings, sessionStartTime: start, random: () => 0 });
  assert.equal(engine.tap('left', start + 250), 'miss');
  assert.equal(engine.tap('left', start + 1_000), 'hit');
});

test('tuplets use equal note spacing across the selected time-signature beat', () => {
  const start = 26_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...settings,
      timeSignature: '6/8',
      enabledSubdivisions: ['duplet'],
      changeIntervalBeats: 2,
    },
    sessionStartTime: start,
    random: () => 0,
  });

  engine.tap('left', start + 500);
  const results = engine.getResults(start + 700);
  assert.equal(results.left.totalExpected, 2);
  assert.equal(results.left.totalHit, 1);
  assert.equal(results.left.averageSignedErrorMs, 0);
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

  const startOfPattern = engine.advance(start + 100);
  assert.equal(startOfPattern.nextStep?.startBeat, 4);
  assert.equal(startOfPattern.beatsUntilChange, 4);

  const beforeSwitch = engine.advance(start + 2_500);
  assert.equal(beforeSwitch.currentStep.startBeat, 0);
  assert.equal(beforeSwitch.nextStep?.startBeat, 4);
  assert.equal(beforeSwitch.beatsUntilChange, 2);
  assert.equal(beforeSwitch.secondsUntilChange, 1.5);

  const finalBeat = engine.advance(start + 3_500);
  assert.equal(finalBeat.currentStep.startBeat, 0);
  assert.equal(finalBeat.nextStep?.startBeat, 4);
  assert.equal(finalBeat.beatsUntilChange, 1);

  const atSwitch = engine.advance(start + 4_000);
  assert.equal(atSwitch.currentStep.startBeat, 4);
  assert.equal(atSwitch.nextStep?.startBeat, 8);
  assert.equal(atSwitch.beatsUntilChange, 4);
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

test('per-hand calibration offsets correct early and late tap timing independently', () => {
  const start = 12_000;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, leftTapOffsetMs: 35, rightTapOffsetMs: -20 },
    sessionStartTime: start,
    random: () => 0,
  });
  engine.tap('left', start + 35);
  engine.tap('right', start - 20);

  const snapshot = engine.advance(start + 1);
  assert.equal(snapshot.leftStats.perfect, 1);
  assert.equal(snapshot.rightStats.perfect, 1);
  assert.equal(snapshot.leftStats.averageSignedErrorMs, 0);
  assert.equal(snapshot.rightStats.averageSignedErrorMs, 0);
});

test('late tap calibration keeps each hand eligible through its adjusted hit window', () => {
  const start = 13_000;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, leftTapOffsetMs: 80 },
    sessionStartTime: start,
    random: () => 0,
  });
  engine.advance(start + 150);
  engine.tap('left', start + 150);

  const snapshot = engine.advance(start + 181);
  assert.equal(snapshot.leftStats.good, 1);
  assert.equal(snapshot.leftStats.averageSignedErrorMs, 70);
});

test('the selected timing range controls which taps count as hits', () => {
  const start = 14_000;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, goodWindowMs: 200 },
    sessionStartTime: start,
    random: () => 0,
  });
  engine.tap('left', start + 150);

  const snapshot = engine.advance(start + 201);
  assert.equal(snapshot.leftStats.good, 1);
  assert.equal(snapshot.leftStats.averageSignedErrorMs, 150);

  const strictEngine = new RhythmTimingEngine({
    settings: { ...settings, goodWindowMs: 50 },
    sessionStartTime: start + 500,
    random: () => 0,
  });
  strictEngine.tap('left', start + 575);
  const strictSnapshot = strictEngine.advance(start + 651);
  assert.equal(strictSnapshot.leftStats.totalHit, 0);
  assert.equal(strictSnapshot.leftStats.miss, 1);
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

test('score events use MusicXML quarter-note positions, loop, and score independently per hand', () => {
  const start = 50_000;
  const importedScore: ImportedRhythmScore = {
    formatVersion: 1,
    title: 'Etude',
    timeSignature: '4/4',
    trackCount: 2,
    bpm: 60,
    totalQuarterNotes: 4,
    warnings: [],
    measures: [
      {
        index: 0,
        startQuarter: 0,
        durationQuarter: 4,
        leftEvents: [
          { startQuarter: 0, durationQuarter: 1 },
          { startQuarter: 2, durationQuarter: 1 },
        ],
        rightEvents: [
          { startQuarter: 0, durationQuarter: 0.5 },
          { startQuarter: 0.5, durationQuarter: 0.5 },
          { startQuarter: 1, durationQuarter: 0.5 },
          { startQuarter: 1.5, durationQuarter: 0.5 },
          { startQuarter: 2, durationQuarter: 0.5 },
          { startQuarter: 2.5, durationQuarter: 0.5 },
          { startQuarter: 3, durationQuarter: 0.5 },
          { startQuarter: 3.5, durationQuarter: 0.5 },
        ],
      },
    ],
  };
  const engine = new RhythmTimingEngine({ settings, sessionStartTime: start, importedScore });

  const preview = engine.advance(start + 100);
  assert.equal(preview.scoreTitle, 'Etude');
  assert.equal(preview.scoreMeasureNumber, 1);
  assert.equal(preview.scorePreviousMeasure, importedScore.measures[0]);
  assert.equal(preview.scoreMeasureSequence, 0);
  assert.equal(preview.scoreNextMeasure, importedScore.measures[0]);
  assert.equal(preview.scoreMeasure?.rightEvents.length, 8);

  engine.tap('left', start);
  engine.tap('right', start);
  engine.tap('right', start + 500);
  engine.tap('left', start + 4_000);
  const results = engine.getResults(start + 4_100);

  assert.equal(results.source, 'score');
  assert.equal(results.scoreTitle, 'Etude');
  assert.equal(results.left.totalExpected, 3);
  assert.equal(results.left.totalHit, 2);
  assert.equal(results.right.totalExpected, 9);
  assert.equal(results.right.totalHit, 2);
  assert.equal(results.stable.totalHit, 4);
  assert.equal(results.transition.totalExpected, 0);
  assert.deepEqual(results.combinations, []);
});

test('score view advances its measure sequence only at bar boundaries and repeats in order', () => {
  const start = 52_000;
  const importedScore: ImportedRhythmScore = {
    formatVersion: 1,
    title: 'Two-bar loop',
    timeSignature: '4/4',
    trackCount: 2,
    bpm: 60,
    totalQuarterNotes: 8,
    warnings: [],
    measures: [
      {
        index: 0,
        startQuarter: 0,
        durationQuarter: 4,
        leftEvents: [{ startQuarter: 0, durationQuarter: 1 }],
        rightEvents: [{ startQuarter: 0, durationQuarter: 1 }],
      },
      {
        index: 1,
        startQuarter: 4,
        durationQuarter: 4,
        leftEvents: [{ startQuarter: 0, durationQuarter: 1 }],
        rightEvents: [{ startQuarter: 0, durationQuarter: 1 }],
      },
    ],
  };
  const engine = new RhythmTimingEngine({
    settings: { ...settings, bpm: 60 },
    sessionStartTime: start,
    importedScore,
  });

  const whileFirstBarPlays = engine.advance(start + 3_999);
  assert.equal(whileFirstBarPlays.scoreMeasure?.index, 0);
  assert.equal(whileFirstBarPlays.scoreMeasureSequence, 0);
  assert.equal(whileFirstBarPlays.scorePreviousMeasure?.index, 1);
  assert.equal(whileFirstBarPlays.scoreNextMeasure?.index, 1);

  const atSecondBar = engine.advance(start + 4_000);
  assert.equal(atSecondBar.scoreMeasure?.index, 1);
  assert.equal(atSecondBar.scoreMeasureSequence, 1);
  assert.equal(atSecondBar.scorePreviousMeasure?.index, 0);
  assert.equal(atSecondBar.scoreNextMeasure?.index, 0);

  const onRepeat = engine.advance(start + 8_000);
  assert.equal(onRepeat.scoreMeasure?.index, 0);
  assert.equal(onRepeat.scoreMeasureSequence, 2);
});

test('score taps return imported pitch while visual replay records expected note positions', () => {
  const start = 66_000;
  const importedScore: ImportedRhythmScore = {
    formatVersion: 1,
    title: 'Pitch check',
    timeSignature: '2/4',
    trackCount: 2,
    bpm: 60,
    totalQuarterNotes: 2,
    warnings: [],
    measures: [{
      index: 0,
      startQuarter: 0,
      durationQuarter: 2,
      leftEvents: [
        { startQuarter: 0, durationQuarter: 1, midiPitches: [60] },
        { startQuarter: 1, durationQuarter: 1, midiPitches: [64] },
      ],
      rightEvents: [{ startQuarter: 0, durationQuarter: 2, midiPitches: [48] }],
    }],
  };
  const engine = new RhythmTimingEngine({
    settings: { ...settings, timeSignature: '2/4' },
    sessionStartTime: start,
    importedScore,
  });

  assert.deepEqual(engine.tapWithDetails('left', start), {
    feedback: 'hit',
    midiPitches: [60],
  });
  const results = engine.getResults(start + 1_250);

  assert.deepEqual(results.missedEvents.map(({ hand, barIndex, beatInBar }) => ({
    hand,
    barIndex,
    beatInBar,
  })), [
    { hand: 'right', barIndex: 1, beatInBar: 0 },
    { hand: 'left', barIndex: 1, beatInBar: 1 },
  ]);
  assert.deepEqual(results.replayExpectedEvents?.map(({ hand, beatInBar, matched, durationQuarter }) => ({
    hand,
    beatInBar,
    matched,
    durationQuarter,
  })), [
    { hand: 'left', beatInBar: 0, matched: true, durationQuarter: 1 },
    { hand: 'right', beatInBar: 0, matched: false, durationQuarter: 2 },
    { hand: 'left', beatInBar: 1, matched: false, durationQuarter: 1 },
  ]);
  assert.deepEqual(results.replayTaps?.map(({ hand, timestampMs, timingErrorMs }) => ({
    hand,
    timestampMs,
    timingErrorMs,
  })), [{ hand: 'left', timestampMs: 0, timingErrorMs: 0 }]);
});

test('visual replay preserves actual tap positions including unmatched extra taps', () => {
  const start = 70_000;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, enabledSubdivisions: ['quarter'] },
    sessionStartTime: start,
    random: () => 0,
  });

  engine.tapWithDetails('left', start + 80);
  engine.tapWithDetails('left', start + 250);
  engine.tapWithDetails('right', start + 1_100);
  const results = engine.getResults(start + 1_500);

  assert.deepEqual(results.replayTaps?.map(({ hand, timestampMs, matchedEventId, timingErrorMs }) => ({
    hand,
    timestampMs,
    matchedEventId,
    timingErrorMs,
  })), [
    { hand: 'left', timestampMs: 80, matchedEventId: 'left:step-0:0', timingErrorMs: 80 },
    { hand: 'left', timestampMs: 250, matchedEventId: undefined, timingErrorMs: undefined },
    { hand: 'right', timestampMs: 1_100, matchedEventId: 'right:step-0:1', timingErrorMs: 100 },
  ]);
  assert.deepEqual(results.replayExpectedEvents?.map(({ hand, beatInBar, matched }) => ({
    hand,
    beatInBar,
    matched,
  })), [
    { hand: 'left', beatInBar: 0, matched: true },
    { hand: 'right', beatInBar: 0, matched: false },
    { hand: 'left', beatInBar: 1, matched: false },
    { hand: 'right', beatInBar: 1, matched: true },
  ]);
});

test('visual replay assigns compound-meter taps to the correct measure', () => {
  const start = 75_000;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, timeSignature: '6/8', enabledSubdivisions: ['quarter'] },
    sessionStartTime: start,
    random: () => 0,
  });

  engine.tapWithDetails('left', start + 2_000);
  const results = engine.getResults(start + 2_100);

  assert.deepEqual(results.replayTaps?.map(({ barIndex, timestampMs }) => ({ barIndex, timestampMs })), [
    { barIndex: 2, timestampMs: 2_000 },
  ]);
  assert.deepEqual(results.replayExpectedEvents
    ?.filter((event) => event.matched)
    .map(({ barIndex, beatInBar }) => ({ barIndex, beatInBar })), [
    { barIndex: 2, beatInBar: 0 },
  ]);
});
