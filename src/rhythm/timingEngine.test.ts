/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateExerciseSteps } from '@/rhythm/exerciseGenerator';
import {
  beatDurationMs,
  expectedEventTimeMs,
  roundSessionDurationToBar,
  subdivisionIntervalQuarterNotes,
  pulseQuarterNotes,
  subdivisionOffsetMs,
  subdivisionIntervalMs,
  timeSignatureMetrics,
} from '@/rhythm/subdivisions';
import { matchTap } from '@/rhythm/tapMatcher';
import { getExerciseStartTime, getSessionDurationSeconds, RhythmTimingEngine } from '@/rhythm/timingEngine';
import { findNextScoreEvent, scoreFromMeasure } from '@/rhythm/scoreStaff';
import { TIME_SIGNATURES } from '@/types/rhythm';
import type { ExerciseSettings } from '@/types/rhythm';
import type { ImportedRhythmScore } from '@/types/importedScore';

const settings: ExerciseSettings = {
  bpm: 60,
  timeSignature: '4/4',
  durationSeconds: 30,
  changeIntervalBeats: 4,
  restBetweenChanges: false,
  handRestsEnabled: false,
  enabledSubdivisions: ['quarter', 'eighth'],
  enabledMixtures: [],
  feel: 'straight',
  graceNotesEnabled: false,
  trainingMode: 'two-hand',
  practiceDisplayMode: 'rhythm',
  singleHand: 'left',
  soundEnabled: false,
  backgroundMusicEnabled: false,
  sessionCuesEnabled: true,
  metronomeSound: 'wood',
  leftHandSound: 'soft',
  rightHandSound: 'beep',
  leftFlashSource: 'tap',
  rightFlashSource: 'tap',
  tapResultFlashEnabled: true,
  referenceRhythmEnabled: false,
  challengeAction: 'off',
  challengeTriggerMode: 'notes',
  challengeMissStreak: 3,
  challengeWrongBarStreak: 2,
  leftTapOffsetMs: 0,
  rightTapOffsetMs: 0,
  autoCalibrationEnabled: true,
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

test('timed session lengths round up to the next bar in the selected meter', () => {
  assert.ok(Math.abs(roundSessionDurationToBar(60, 70, '4/4') - (72 * 60) / 70) < 0.000001);
  assert.equal(roundSessionDurationToBar(60, 80, '4/4'), 60);
  assert.equal(roundSessionDurationToBar(5, 60, '3/4'), 6);
  assert.equal(roundSessionDurationToBar(3, 60, '6/8'), 4);
  assert.equal(roundSessionDurationToBar(0, 60, '4/4'), 0);
});

test('score session duration comes from its score while play duration follows settings', () => {
  assert.equal(getSessionDurationSeconds(settings), 32);
  assert.equal(getSessionDurationSeconds({ ...settings, durationSeconds: 'endless' }), null);
  assert.equal(
    getSessionDurationSeconds(
      { ...settings, durationSeconds: 30 },
      { timeSignature: '4/4', totalQuarterNotes: 8 },
    ),
    8,
  );
  assert.equal(
    getSessionDurationSeconds(
      { ...settings, bpm: 120, durationSeconds: 'endless' },
      { timeSignature: '6/8', totalQuarterNotes: 6 },
    ),
    2,
  );
});

test('one-note score display does not wrap after the final note', () => {
  const finalMeasure = {
    index: 0,
    startQuarter: 0,
    durationQuarter: 4,
    leftEvents: [{ startQuarter: 0, durationQuarter: 1 }],
    rightEvents: [{ startQuarter: 2, durationQuarter: 1 }],
  };

  assert.equal(findNextScoreEvent(finalMeasure, undefined, 'left', 0)?.startQuarter, 0);
  assert.equal(findNextScoreEvent(finalMeasure, undefined, 'left', 1), undefined);
  assert.equal(findNextScoreEvent(finalMeasure, undefined, 'right', 1)?.startQuarter, 2);
});

test('score rewind starts at the chosen bar and keeps original bar numbering', () => {
  const score: ImportedRhythmScore = {
    formatVersion: 1,
    title: 'Three bars',
    timeSignature: '4/4',
    trackCount: 2,
    bpm: 80,
    totalQuarterNotes: 12,
    warnings: [],
    measures: [0, 1, 2].map((index) => ({
      index,
      startQuarter: index * 4,
      durationQuarter: 4,
      leftEvents: [{ startQuarter: 0, durationQuarter: 1 }],
      rightEvents: [],
    })),
  };

  const rewound = scoreFromMeasure(score, 1);
  assert.equal(rewound.measures.length, 2);
  assert.equal(rewound.measures[0].index, 1);
  assert.equal(rewound.measures[0].startQuarter, 0);
  assert.equal(rewound.measures[1].startQuarter, 4);
  assert.equal(rewound.totalQuarterNotes, 8);
  assert.throws(() => scoreFromMeasure(score, 3), RangeError);
});

test('quarter and eighth patterns fill the same four-beat interval', () => {
  const start = 12_000;
  const engine = new RhythmTimingEngine({
    settings,
    sessionStartTime: start,
    patternPairs: [{ leftSubdivision: 'quarter', rightSubdivision: 'eighth' }],
  });

  const events = engine.getReferenceEventsThrough(start + 3_999);
  assert.deepEqual(events.filter(({ hand }) => hand === 'left').map(({ expectedTimeMs }) => expectedTimeMs), [
    start,
    start + 1_000,
    start + 2_000,
    start + 3_000,
  ]);
  assert.deepEqual(events.filter(({ hand }) => hand === 'right').map(({ expectedTimeMs }) => expectedTimeMs), [
    start,
    start + 500,
    start + 1_000,
    start + 1_500,
    start + 2_000,
    start + 2_500,
    start + 3_000,
    start + 3_500,
  ]);
});

test('independent hand rests leave one lane silent while the other keeps its expected beats', () => {
  const start = 18_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...settings,
      handRestsEnabled: true,
    },
    sessionStartTime: start,
    random: () => 0,
  });

  const step = engine.advance(start + 1).currentStep;
  assert.equal(step.leftRest, true);
  assert.equal(step.rightRest, false);
  assert.deepEqual(
    engine.getReferenceEventsThrough(start + 10).map(({ hand, expectedTimeMs }) => [hand, expectedTimeMs]),
    [['right', start]],
  );
  assert.equal(engine.tap('left', start), 'miss');
  assert.equal(engine.tap('right', start), 'hit');

  const results = engine.getResults(start + 200);
  assert.equal(results.left.totalExpected, 1);
  assert.equal(results.left.totalHit, 0);
  assert.equal(results.left.miss, 1);
  assert.equal(results.right.totalExpected, 1);
  assert.equal(results.right.totalHit, 1);
  assert.deepEqual(results.combinations[0]?.left, { totalExpected: 1, totalHit: 0 });
  assert.equal(results.combinations[0].leftRest, true);
  assert.equal(results.combinations[0].rightRest, false);
});

test('extra taps reduce hand, stable, and combination accuracy', () => {
  const start = 36_500;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, changeIntervalBeats: 2, enabledSubdivisions: ['quarter'] },
    sessionStartTime: start,
    random: () => 0,
  });

  assert.equal(engine.tap('left', start), 'hit');
  assert.equal(engine.tap('left', start + 500), 'miss');
  const results = engine.getResults(start + 600);

  assert.deepEqual(results.left, {
    totalExpected: 2,
    totalHit: 1,
    perfect: 1,
    great: 0,
    good: 0,
    miss: 1,
    averageAbsoluteErrorMs: 0,
    averageSignedErrorMs: 0,
  });
  assert.equal(results.combinations[0]?.left.totalExpected, 2);
  assert.equal(results.combinations[0]?.left.totalHit, 1);
  assert.equal(results.stable.totalExpected, 3);
  assert.equal(results.stable.totalHit, 1);
  assert.equal(results.replayTaps?.filter((tap) => !tap.matchedEventId).length, 1);
  assert.deepEqual(
    engine.takeChallengeOutcomes().filter((outcome) => outcome.kind === 'extra-tap'),
    [{ hand: 'left', matched: false, expectedTimeMs: start + 500, kind: 'extra-tap', barIndex: 1 }],
  );
});

test('challenge bars complete only after the bar and note timing window settle', () => {
  const start = 95_000;
  const engine = new RhythmTimingEngine({ settings, sessionStartTime: start, random: () => 0 });

  engine.advance(start + 4_099);
  assert.deepEqual(engine.takeCompletedChallengeBars(), []);
  engine.advance(start + 4_101);
  assert.deepEqual(engine.takeCompletedChallengeBars(), [1]);
  engine.advance(start + 5_000);
  assert.deepEqual(engine.takeCompletedChallengeBars(), []);
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

test('replay data retains straight and swung positions for each generated binary note', () => {
  const engine = new RhythmTimingEngine({
    settings: { ...settings, durationSeconds: 'endless', enabledSubdivisions: ['eighth'], feel: 'swing' },
    sessionStartTime: 0,
    random: () => 0,
  });

  const results = engine.getResults(800);
  const offbeat = results.replayExpectedEvents?.find(
    (event) => event.hand === 'left' && event.barIndex === 1 && Math.abs(event.beatInBar - 2 / 3) < 0.001,
  );

  assert.ok(offbeat);
  assert.ok(Math.abs((offbeat.straightBeatInBar ?? 0) - 0.5) < 0.001);
  assert.ok(Math.abs((offbeat.swingBeatInBar ?? 0) - 2 / 3) < 0.001);
});

test('straight eighth-note tapping is flagged during the first three swing bars', () => {
  const engine = new RhythmTimingEngine({
    settings: { ...settings, durationSeconds: 'endless', enabledSubdivisions: ['eighth'], feel: 'swing' },
    sessionStartTime: 0,
    random: () => 0,
  });

  for (let timestampMs = 0; timestampMs <= 2_500; timestampMs += 500) {
    engine.tap('left', timestampMs);
    engine.tap('right', timestampMs);
  }

  const snapshot = engine.advance(3_000);
  assert.equal(snapshot.swingFeelMismatch?.likelyStraight, true);
  assert.ok((snapshot.swingFeelMismatch?.latestBarIndex ?? 4) <= 3);
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

test('weighted lesson patterns follow their authored subdivision chances', () => {
  const patterns = [
    { leftSubdivision: 'quarter' as const, rightSubdivision: 'quarter' as const },
    { leftSubdivision: 'eighth' as const, rightSubdivision: 'eighth' as const },
  ];
  const heavierQuarter = generateExerciseSteps({
    enabledSubdivisions: ['quarter', 'eighth'],
    changeIntervalBeats: 4,
    patternPairs: patterns,
    patternPairWeights: [90, 10],
    random: () => 0.5,
  }, 1);
  const lighterQuarter = generateExerciseSteps({
    enabledSubdivisions: ['quarter', 'eighth'],
    changeIntervalBeats: 4,
    patternPairs: patterns,
    patternPairWeights: [90, 10],
    random: () => 0.95,
  }, 1);

  assert.deepEqual([heavierQuarter[0].leftSubdivision, heavierQuarter[0].rightSubdivision], ['quarter', 'quarter']);
  assert.deepEqual([lighterQuarter[0].leftSubdivision, lighterQuarter[0].rightSubdivision], ['eighth', 'eighth']);
});

test('rest before a change silences the last beat while the metronome beat stays aligned', () => {
  const start = 36_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...settings,
      practiceDisplayMode: 'score',
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
      practiceDisplayMode: 'score',
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
      practiceDisplayMode: 'score',
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

test('3/8 rhythm patterns change on the final written beat of every measure', () => {
  const start = 35_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...settings,
      bpm: 60,
      timeSignature: '3/8',
      changeIntervalBeats: 4,
      enabledSubdivisions: ['quarter', 'eighth'],
    },
    sessionStartTime: start,
    random: () => 0,
  });

  const firstBar = engine.advance(start + 100);
  assert.equal(firstBar.beatsPerBar, 3);
  assert.equal(firstBar.nextStep?.startBeat, 3);
  assert.equal(firstBar.beatsUntilChange, 3);

  const beforeBarLine = engine.advance(start + 2_999);
  assert.equal(beforeBarLine.currentStep.startBeat, 0);
  assert.equal(beforeBarLine.beatInBar, 2);

  const atBarLine = engine.advance(start + 3_000);
  assert.equal(atBarLine.currentStep.startBeat, 3);
  assert.equal(atBarLine.beatInBar, 0);
  assert.equal(atBarLine.nextStep?.startBeat, 6);
});

test('3/4 bar position and next-pattern countdown remain distinct and accurate', () => {
  const start = 36_000;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, timeSignature: '3/4', changeIntervalBeats: 4 },
    sessionStartTime: start,
    random: () => 0,
  });
  const beatDurationMs = timeSignatureMetrics(60, '3/4').beatDurationMs;

  const thirdBeat = engine.advance(start + (2 * beatDurationMs) + 1);

  assert.equal(thirdBeat.beatsPerBar, 3);
  assert.equal(thirdBeat.beatInBar, 2);
  assert.equal(thirdBeat.beatsUntilChange, 1);
});

test('every supported meter reports each beat position and pattern countdown across two bars', () => {
  const start = 72_000;
  const bpm = 60;
  const meters = [
    { timeSignature: '2/4', beatsPerBar: 2 },
    { timeSignature: '3/4', beatsPerBar: 3 },
    { timeSignature: '4/4', beatsPerBar: 4 },
    { timeSignature: '5/4', beatsPerBar: 5 },
    { timeSignature: '7/4', beatsPerBar: 7 },
    { timeSignature: '2/2', beatsPerBar: 2 },
    { timeSignature: '3/8', beatsPerBar: 3 },
    { timeSignature: '6/8', beatsPerBar: 2 },
    { timeSignature: '9/8', beatsPerBar: 3 },
    { timeSignature: '12/8', beatsPerBar: 4 },
  ] as const;

  assert.deepEqual(meters.map(({ timeSignature }) => timeSignature), TIME_SIGNATURES);

  for (const { timeSignature, beatsPerBar: expectedBeatsPerBar } of meters) {
    const engine = new RhythmTimingEngine({
      settings: { ...settings, bpm, timeSignature, durationSeconds: 'endless' },
      sessionStartTime: start,
      random: () => 0,
    });
    const { beatsPerBar, beatDurationMs } = timeSignatureMetrics(bpm, timeSignature);
    assert.equal(beatsPerBar, expectedBeatsPerBar, `${timeSignature} beats per bar`);

    for (let beatIndex = 0; beatIndex < beatsPerBar * 2; beatIndex += 1) {
      const snapshot = engine.advance(start + (beatIndex * beatDurationMs) + 1);
      const expectedBeatInBar: number = beatIndex % expectedBeatsPerBar;
      const writtenBeatsPerBar = Number(timeSignature.split('/')[0]);
      const beatsUntilChange = writtenBeatsPerBar - snapshot.counterBeatInBar;

      assert.equal(snapshot.phase, 'running', `${timeSignature} beat ${beatIndex + 1} should be active`);
      assert.equal(snapshot.beatInBar, expectedBeatInBar, `${timeSignature} beat ${beatIndex + 1} position`);
      assert.equal(snapshot.beatsPerBar, beatsPerBar, `${timeSignature} beats per bar`);
      assert.equal(
        snapshot.beatsUntilChange,
        beatsUntilChange,
        `${timeSignature} beat ${beatIndex + 1} change countdown`,
      );
    }
  }
});

test('4/4 counter reaches beat four in every bar before resetting to beat one', () => {
  const start = 78_000;
  const bpm = 60;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, bpm, timeSignature: '4/4', durationSeconds: 'endless' },
    sessionStartTime: start,
    random: () => 0,
  });
  const { beatDurationMs } = timeSignatureMetrics(bpm, '4/4');

  for (let beatIndex = 0; beatIndex < 8; beatIndex += 1) {
    const snapshot = engine.advance(start + beatIndex * beatDurationMs + 1);
    const expectedBeatInBar = beatIndex % 4;

    assert.equal(snapshot.counterBeatsPerBar, 4, `beat ${beatIndex + 1} has four displayed positions`);
    assert.equal(snapshot.counterBeatInBar, expectedBeatInBar, `beat ${beatIndex + 1} is displayed in order`);
    assert.equal(snapshot.beatsUntilChange, 4 - expectedBeatInBar, `beat ${beatIndex + 1} counts down to the bar line`);
  }
});

test('live beat counter follows the written time-signature numerator in every meter', () => {
  const start = 84_000;
  const bpm = 60;

  for (const timeSignature of TIME_SIGNATURES) {
    const [numeratorText] = timeSignature.split('/');
    const writtenBeatsPerBar = Number(numeratorText);
    const engine = new RhythmTimingEngine({
      settings: { ...settings, bpm, timeSignature, durationSeconds: 'endless' },
      sessionStartTime: start,
      random: () => 0,
    });
    const { beatsPerBar, beatDurationMs } = timeSignatureMetrics(bpm, timeSignature);

    for (let bar = 0; bar < 3; bar += 1) {
      for (let writtenBeat = 0; writtenBeat < writtenBeatsPerBar; writtenBeat += 1) {
        const pulsePosition = bar * beatsPerBar + ((writtenBeat + 0.25) * beatsPerBar) / writtenBeatsPerBar;
        const snapshot = engine.advance(start + pulsePosition * beatDurationMs);

        assert.equal(snapshot.counterBeatInBar, writtenBeat, `${timeSignature} bar ${bar + 1}, written beat ${writtenBeat + 1}`);
        assert.equal(snapshot.counterBeatsPerBar, writtenBeatsPerBar, `${timeSignature} bar ${bar + 1} counter length`);
      }

      const nextBar = engine.advance(start + (bar + 1) * beatsPerBar * beatDurationMs + 1);
      assert.equal(nextBar.counterBeatInBar, 0, `${timeSignature} bar ${bar + 1} counter resets at the bar line`);
      assert.equal(nextBar.counterBeatsPerBar, writtenBeatsPerBar, `${timeSignature} bar ${bar + 2} counter length`);
    }
  }
});

test('rhythm notation changes exactly at every written measure line in all supported meters', () => {
  const start = 91_000;
  const bpm = 60;

  for (const timeSignature of TIME_SIGNATURES) {
    const engine = new RhythmTimingEngine({
      settings: { ...settings, bpm, timeSignature, durationSeconds: 'endless', changeIntervalBeats: 8 },
      sessionStartTime: start,
      random: () => 0,
    });
    const { beatsPerBar, beatDurationMs } = timeSignatureMetrics(bpm, timeSignature);
    const numerator = Number(timeSignature.split('/')[0]);
    const barDurationMs = beatsPerBar * beatDurationMs;

    const lastWrittenBeat = engine.advance(start + barDurationMs - 1);
    const nextMeasure = engine.advance(start + barDurationMs + 1);

    assert.equal(lastWrittenBeat.currentStep.startBeat, 0, `${timeSignature} before bar line`);
    assert.equal(lastWrittenBeat.counterBeatsPerBar, numerator, `${timeSignature} written count`);
    assert.equal(lastWrittenBeat.beatsUntilChange, 1, `${timeSignature} last beat countdown`);
    assert.equal(nextMeasure.currentStep.startBeat, beatsPerBar, `${timeSignature} changes at bar line`);
    assert.equal(nextMeasure.counterBeatInBar, 0, `${timeSignature} counter resets with the pattern`);
    assert.equal(nextMeasure.beatsUntilChange, numerator, `${timeSignature} starts a fresh written count`);
  }
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

test('optional independent rests alternate with an active rhythm and never silence both hands', () => {
  const steps = generateExerciseSteps(
    {
      enabledSubdivisions: ['quarter', 'eighth'],
      changeIntervalBeats: 4,
      allowHandRests: true,
      random: () => 0.1,
    },
    6,
  );

  assert.ok(steps.some((step) => step.leftRest || step.rightRest));
  assert.ok(steps.every((step) => !(step.leftRest && step.rightRest)));
  for (let index = 1; index < steps.length; index += 1) {
    assert.notDeepEqual(
      [steps[index].leftSubdivision, steps[index].rightSubdivision, steps[index].leftRest, steps[index].rightRest],
      [steps[index - 1].leftSubdivision, steps[index - 1].rightSubdivision, steps[index - 1].leftRest, steps[index - 1].rightRest],
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

test('timing calibration can be updated during an active session', () => {
  const start = 13_500;
  const engine = new RhythmTimingEngine({ settings, sessionStartTime: start, random: () => 0 });
  engine.updateTimingCalibration({ leftTapOffsetMs: 60, goodWindowMs: 120 });

  assert.equal(engine.tap('left', start + 150), 'hit');
  const snapshot = engine.advance(start + 251);
  assert.equal(snapshot.leftStats.totalHit, 1);
  assert.equal(snapshot.leftStats.averageSignedErrorMs, 90);
});

test('automatic calibration applies saved offsets to scoring and can be switched off', () => {
  const start = 13_700;
  const calibratedEngine = new RhythmTimingEngine({
    settings: { ...settings, leftTapOffsetMs: 100, autoCalibrationEnabled: true },
    sessionStartTime: start,
    random: () => 0,
  });
  assert.equal(calibratedEngine.tap('left', start + 150), 'hit');

  const rawEngine = new RhythmTimingEngine({
    settings: { ...settings, leftTapOffsetMs: 100, autoCalibrationEnabled: false },
    sessionStartTime: start,
    random: () => 0,
  });
  assert.equal(rawEngine.tap('left', start + 150), 'miss');

  rawEngine.updateTimingCalibration({ autoCalibrationEnabled: true });
  assert.equal(rawEngine.tap('left', start + 1_000), 'hit');
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
  assert.equal(strictSnapshot.leftStats.miss, 2);
  assert.equal(strictSnapshot.leftStats.totalExpected, 2);
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

test('challenge results expose the longest combined clean streak', () => {
  const start = 11_000;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, challengeAction: 'stop' },
    sessionStartTime: start,
    patternPairs: [{ leftSubdivision: 'quarter', rightSubdivision: 'quarter' }],
  });
  engine.tap('left', start);
  engine.tap('right', start);
  engine.tap('left', start + 1_000);
  engine.tap('right', start + 1_000);

  const results = engine.getResults(start + 1_101);
  assert.equal(results.challengeMode, true);
  assert.equal(results.longestCorrectStreak, 4);
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

test('timed sessions finish the last full bar instead of cutting notes off mid-bar', () => {
  const start = 54_000;
  const completedDurationMs = roundSessionDurationToBar(30, 70, '4/4') * 1_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...settings,
      bpm: 70,
      durationSeconds: 30,
      enabledSubdivisions: ['quarter'],
      trainingMode: 'single-hand',
      singleHand: 'left',
    },
    sessionStartTime: start,
    random: () => 0,
  });

  assert.equal(engine.advance(start - 1_000).secondsRemaining, completedDurationMs / 1_000);
  assert.equal(engine.advance(start + 30_000).phase, 'running');
  assert.equal(engine.advance(start + completedDurationMs - 1).phase, 'running');

  const completed = engine.advance(start + completedDurationMs + 101);
  assert.equal(completed.phase, 'finished');
  assert.equal(completed.results?.left.totalExpected, 36);
  assert.ok(Math.abs((completed.results?.durationSeconds ?? 0) - completedDurationMs / 1_000) < 0.000001);
  const lastExpectedEvent = completed.results?.replayExpectedEvents?.slice(-1)[0];
  assert.equal(lastExpectedEvent?.barIndex, 9);
  assert.ok(Math.abs((lastExpectedEvent?.beatInBar ?? 0) - 3) < 0.000001);
});

test('score events use MusicXML quarter-note positions and play once through independently per hand', () => {
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
  assert.equal(preview.scorePreviousMeasure, undefined);
  assert.equal(preview.scoreMeasureSequence, 0);
  assert.equal(preview.scoreNextMeasure, undefined);
  assert.equal(preview.scoreMeasure?.rightEvents.length, 8);
  assert.deepEqual(preview.scoreUpcomingMeasures?.map((measure) => measure.index), [0]);

  engine.tap('left', start);
  engine.tap('right', start);
  engine.tap('right', start + 500);
  assert.equal(engine.tap('left', start + 4_000), 'ignored');
  const results = engine.getResults(start + 4_100);

  assert.equal(results.source, 'score');
  assert.equal(results.scoreTitle, 'Etude');
  assert.equal(results.left.totalExpected, 2);
  assert.equal(results.left.totalHit, 1);
  assert.equal(results.right.totalExpected, 8);
  assert.equal(results.right.totalHit, 2);
  assert.equal(results.stable.totalHit, 3);
  assert.equal(results.transition.totalExpected, 0);
  assert.deepEqual(results.combinations, []);
});

test('score view advances at bar boundaries and ends on the final bar', () => {
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
  assert.equal(whileFirstBarPlays.scorePreviousMeasure, undefined);
  assert.equal(whileFirstBarPlays.scoreNextMeasure?.index, 1);
  assert.deepEqual(whileFirstBarPlays.scoreUpcomingMeasures?.map((measure) => measure.index), [0, 1]);

  const atSecondBar = engine.advance(start + 4_000);
  assert.equal(atSecondBar.scoreMeasure?.index, 1);
  assert.equal(atSecondBar.scoreMeasureSequence, 1);
  assert.equal(atSecondBar.scorePreviousMeasure?.index, 0);
  assert.equal(atSecondBar.scoreNextMeasure, undefined);
  assert.deepEqual(atSecondBar.scoreUpcomingMeasures?.map((measure) => measure.index), [1]);

  const afterScoreEnd = engine.advance(start + 8_101);
  assert.equal(afterScoreEnd.phase, 'finished');
  assert.equal(afterScoreEnd.scoreMeasure?.index, 1);
  assert.equal(afterScoreEnd.scoreMeasureSequence, 1);
  assert.equal(afterScoreEnd.scoreNextMeasure, undefined);
  assert.equal(afterScoreEnd.scoreUpcomingMeasures?.length, 1);
  assert.equal(afterScoreEnd.secondsRemaining, 0);
  assert.equal(afterScoreEnd.results?.durationSeconds, 8);
});

test('normal practice score notation is preloaded and advances at bar boundaries', () => {
  const start = 47_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...settings,
      bpm: 60,
      durationSeconds: 30,
      practiceDisplayMode: 'score',
      enabledSubdivisions: ['quarter', 'eighth'],
    },
    sessionStartTime: start,
    random: () => 0,
  });

  const beforeStart = engine.advance(start - 1_000);
  assert.equal(beforeStart.practiceScoreMeasure?.index, 0);
  assert.equal(beforeStart.practiceScoreSequence, 0);
  assert.equal(beforeStart.practiceScoreCount, 8);
  assert.deepEqual(beforeStart.practiceScoreUpcomingMeasures?.map((measure) => measure.index), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.ok((beforeStart.practiceScoreMeasure?.leftEvents.length ?? 0) > 0);
  assert.equal(beforeStart.practiceScoreQuarterInMeasure, 0);

  const withinBar = engine.advance(start + 1_500);
  assert.equal(withinBar.practiceScoreQuarterInMeasure, 1.5);

  const beforeBarLine = engine.advance(start + 3_999);
  assert.equal(beforeBarLine.practiceScoreMeasure?.index, 0);
  assert.equal(beforeBarLine.practiceScoreSequence, 0);
  assert.ok(Math.abs((beforeBarLine.practiceScoreQuarterInMeasure ?? 0) - 3.999) < 0.000001);

  const onBarLine = engine.advance(start + 4_000);
  assert.equal(onBarLine.practiceScoreMeasure?.index, 1);
  assert.equal(onBarLine.practiceScorePreviousMeasure?.index, 0);
  assert.equal(onBarLine.practiceScoreSequence, 1);
  assert.equal(onBarLine.practiceScoreQuarterInMeasure, 0);
});

test('score bars advance after the configured number of metronome beats', () => {
  const cases = [
    { timeSignature: '4/4' as const, beatsPerBar: 4, barQuarterNotes: 4 },
    { timeSignature: '6/8' as const, beatsPerBar: 2, barQuarterNotes: 3 },
  ];

  for (const { timeSignature, beatsPerBar, barQuarterNotes } of cases) {
    const start = 51_000;
    const engine = new RhythmTimingEngine({
      settings: { ...settings, timeSignature, practiceDisplayMode: 'score' },
      sessionStartTime: start,
      random: () => 0,
    });
    const barDurationMs = beatsPerBar * beatDurationMs(60);

    assert.equal(engine.advance(start + barDurationMs - 1).practiceScoreMeasure?.index, 0, `${timeSignature} remains in bar 1 before its final beat ends`);
    const nextBar = engine.advance(start + barDurationMs);
    assert.equal(nextBar.practiceScoreMeasure?.durationQuarter, barQuarterNotes, `${timeSignature} stores the full bar length`);
    assert.equal(nextBar.practiceScoreMeasure?.index, 1, `${timeSignature} advances on the bar line`);
  }
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
  assert.deepEqual(results.replayExpectedEvents?.map(({ hand, beatInBar, matched, durationQuarter, midiPitches }) => ({
    hand,
    beatInBar,
    matched,
    durationQuarter,
    ...(midiPitches ? { midiPitches } : {}),
  })), [
    { hand: 'left', beatInBar: 0, matched: true, durationQuarter: 1, midiPitches: [60] },
    { hand: 'right', beatInBar: 0, matched: false, durationQuarter: 2, midiPitches: [48] },
    { hand: 'left', beatInBar: 1, matched: false, durationQuarter: 1, midiPitches: [64] },
  ]);
  assert.deepEqual(results.replayTaps?.map(({ hand, timestampMs, timingErrorMs, midiPitches }) => ({
    hand,
    timestampMs,
    timingErrorMs,
    ...(midiPitches ? { midiPitches } : {}),
  })), [{ hand: 'left', timestampMs: 0, timingErrorMs: 0, midiPitches: [60] }]);
});

test('tied score continuations render in score data but do not create another expected tap', () => {
  const start = 68_000;
  const importedScore: ImportedRhythmScore = {
    formatVersion: 1,
    title: 'Tied bar line',
    timeSignature: '4/4',
    trackCount: 1,
    bpm: 60,
    totalQuarterNotes: 8,
    warnings: [],
    measures: [
      {
        index: 0,
        startQuarter: 0,
        durationQuarter: 4,
        leftEvents: [],
        rightEvents: [{
          startQuarter: 3,
          durationQuarter: 2,
          notationDurationQuarter: 1,
          midiPitches: [60],
          tieToNext: true,
        }],
      },
      {
        index: 1,
        startQuarter: 4,
        durationQuarter: 4,
        leftEvents: [],
        rightEvents: [
          {
            startQuarter: 0,
            durationQuarter: 1,
            notationDurationQuarter: 1,
            midiPitches: [60],
            tieFromPrevious: true,
            isTieContinuation: true,
            isCrossBarTieContinuation: true,
          },
          { startQuarter: 1, durationQuarter: 1, midiPitches: [62] },
        ],
      },
    ],
  };
  const engine = new RhythmTimingEngine({ settings, sessionStartTime: start, importedScore });
  const results = engine.getResults(start + 9_000);

  assert.deepEqual(results.replayExpectedEvents?.map(({ midiPitches }) => midiPitches), [[60], [62]]);
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
  assert.deepEqual(results.replayExpectedEvents
    ?.filter((event) => event.reached !== false)
    .map(({ hand, beatInBar, matched }) => ({
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

test('early stop fills the current replay bar without scoring notes not reached yet', () => {
  const start = 72_000;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, enabledSubdivisions: ['quarter'] },
    sessionStartTime: start,
    random: () => 0,
  });

  const results = engine.getResults(start + 200);

  for (const hand of ['left', 'right'] as const) {
    assert.deepEqual(
      results.replayExpectedEvents
        ?.filter((event) => event.hand === hand && event.barIndex === 1)
        .map(({ beatInBar, matched, reached }) => ({ beatInBar, matched, reached })),
      [
        { beatInBar: 0, matched: false, reached: true },
        { beatInBar: 1, matched: false, reached: false },
        { beatInBar: 2, matched: false, reached: false },
        { beatInBar: 3, matched: false, reached: false },
      ],
    );
  }
  assert.equal(results.left.totalExpected, 1);
  assert.equal(results.right.totalExpected, 1);
  assert.equal(results.missedEvents.length, 2);
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

test('pausing freezes the rhythm clock and excludes the pause from session duration', () => {
  const start = 90_000;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, enabledSubdivisions: ['quarter'], trainingMode: 'single-hand', singleHand: 'left' },
    sessionStartTime: start,
    random: () => 0,
  });

  assert.equal(engine.tap('left', start), 'hit');
  engine.pause(start + 500);
  assert.equal(engine.advance(start + 8_500).beatIndex, 0);
  assert.equal(engine.tap('left', start + 8_500), 'ignored');

  engine.resume(start + 10_500);
  assert.equal(engine.advance(start + 11_000).beatIndex, 1);
  assert.equal(engine.tap('left', start + 11_000), 'hit');

  const results = engine.getResults(start + 11_100);
  assert.equal(results.left.totalHit, 2);
  assert.ok(Math.abs(results.durationSeconds - 1.1) < 0.001);
  assert.deepEqual(engine.takeChallengeOutcomes().map(({ hand, matched }) => [hand, matched]), [
    ['left', true],
    ['left', true],
  ]);
});

test('continuing resumes after a half-bar count-in and preserves the paused beat', () => {
  const start = 91_000;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, enabledSubdivisions: ['quarter'], trainingMode: 'single-hand', singleHand: 'left' },
    sessionStartTime: start,
    random: () => 0,
  });

  assert.equal(engine.tap('left', start), 'hit');
  engine.pause(start + 500);
  engine.beginResumeCountIn(start + 8_500, 2_080);

  const countIn = engine.advance(start + 10_000);
  assert.equal(countIn.phase, 'countdown');
  assert.equal(countIn.resumeCountIn, true);
  assert.equal(engine.tap('left', start + 10_000), 'ignored');

  const resumed = engine.advance(start + 10_580);
  assert.equal(resumed.phase, 'running');
  assert.equal(resumed.resumeCountIn, undefined);
  assert.equal(resumed.beatIndex, 0);
  assert.equal(engine.tap('left', start + 11_080), 'hit');
});

test('canceling a resume count-in keeps the exercise paused for backgrounding', () => {
  const start = 92_000;
  const engine = new RhythmTimingEngine({
    settings: { ...settings, enabledSubdivisions: ['quarter'], trainingMode: 'single-hand', singleHand: 'left' },
    sessionStartTime: start,
    random: () => 0,
  });

  assert.equal(engine.tap('left', start), 'hit');
  engine.pause(start + 500);
  engine.beginResumeCountIn(start + 8_500, 2_080);
  engine.cancelResumeCountIn(start + 9_000);

  assert.equal(engine.isPaused(), true);
  assert.equal(engine.advance(start + 10_000).resumeCountIn, undefined);
  assert.equal(engine.tap('left', start + 10_000), 'ignored');

  engine.beginResumeCountIn(start + 12_000, 1_040);
  const resumed = engine.advance(start + 13_040);
  assert.equal(resumed.resumeCountIn, undefined);
  assert.equal(resumed.beatIndex, 0);
  assert.equal(engine.isPaused(), false);
});

test('typed score rests remain visible notation but do not create expected taps', () => {
  const score: ImportedRhythmScore = {
    formatVersion: 1,
    title: 'A bar with rests',
    timeSignature: '4/4',
    trackCount: 1,
    bpm: 60,
    totalQuarterNotes: 4,
    warnings: [],
    measures: [{
      index: 0,
      startQuarter: 0,
      durationQuarter: 4,
      leftEvents: [
        { startQuarter: 0, durationQuarter: 1 },
        { startQuarter: 1, durationQuarter: 1, isRest: true },
        { startQuarter: 2, durationQuarter: 1 },
        { startQuarter: 3, durationQuarter: 1, isRest: true },
      ],
      rightEvents: [],
    }],
  };
  const engine = new RhythmTimingEngine({ settings, sessionStartTime: 0, importedScore: score });
  const results = engine.advance(5_000).results;

  assert.equal(results?.left.totalExpected, 2);
  assert.equal(results?.left.miss, 2);
  assert.equal(results?.replayExpectedEvents?.length, 2);
});
