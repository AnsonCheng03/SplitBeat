/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createExerciseStepGenerator } from '@/rhythm/exerciseGenerator';
import { expandMixturePattern } from '@/rhythm/mixtures';
import { createPracticeScoreMeasure } from '@/rhythm/practiceScore';
import { RhythmTimingEngine } from '@/rhythm/timingEngine';
import type { ExerciseSettings, MixturePatternId } from '@/types/rhythm';

const baseSettings: ExerciseSettings = {
  bpm: 60,
  timeSignature: '4/4',
  durationSeconds: 30,
  changeIntervalBeats: 4,
  restBetweenChanges: false,
  handRestsEnabled: false,
  enabledSubdivisions: [],
  enabledMixtures: [],
  feel: 'straight',
  graceNotesEnabled: false,
  trainingMode: 'two-hand',
  practiceDisplayMode: 'score',
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
  challengeMissStreak: 3,
  leftTapOffsetMs: 0,
  rightTapOffsetMs: 0,
  goodWindowMs: 100,
  hapticsEnabled: false,
};

test('mixture catalog defines a dotted quaver followed by a semiquaver across one quarter', () => {
  const events = expandMixturePattern('dottedQuaverSemiquaver', 0, 1);
  assert.deepEqual(events.map(({ kind, startQuarter, durationQuarter }) => ({ kind, startQuarter, durationQuarter })), [
    { kind: 'note', startQuarter: 0, durationQuarter: 0.75 },
    { kind: 'note', startQuarter: 0.75, durationQuarter: 0.25 },
  ]);
});

test('short mixed patterns repeat to fill the 4/4 beat and preserve an in-beat rest', () => {
  const events = expandMixturePattern('semiquaverDemisemiquaverRestDemisemiquaver', 0, 1);
  assert.deepEqual(events.map(({ kind, startQuarter }) => [kind, startQuarter]), [
    ['note', 0],
    ['rest', 0.25],
    ['note', 0.375],
    ['note', 0.5],
    ['rest', 0.75],
    ['note', 0.875],
  ]);
});

test('mixture choices can be assigned independently to both hands and do not repeat the exact pair immediately', () => {
  const mixtureIds: MixturePatternId[] = [
    'dottedQuaverSemiquaver',
    'semiquaverTwoDemisemiquavers',
    'semiquaverDemisemiquaverRestDemisemiquaver',
  ];
  const getStep = createExerciseStepGenerator({
    enabledSubdivisions: [],
    enabledMixtures: mixtureIds,
    changeIntervalBeats: 4,
    random: () => 0,
  });
  const first = getStep(0);
  const second = getStep(1);
  assert.equal(first.leftMixture, 'dottedQuaverSemiquaver');
  assert.equal(first.rightMixture, 'dottedQuaverSemiquaver');
  assert.notDeepEqual(
    [first.leftSubdivision, first.rightSubdivision, first.leftMixture, first.rightMixture],
    [second.leftSubdivision, second.rightSubdivision, second.leftMixture, second.rightMixture],
  );
});

test('mixture score notation prints note values and rests at their musical positions', () => {
  const measure = createPracticeScoreMeasure({
    barIndex: 0,
    beatsPerBar: 4,
    pulseQuarterNotes: 1,
    changeIntervalBeats: 4,
    restBetweenChanges: false,
    getStep: () => ({
      id: 'mixed',
      leftSubdivision: 'quarter',
      rightSubdivision: 'quarter',
      leftMixture: 'semiquaverDemisemiquaverRestDemisemiquaver',
      leftRest: false,
      rightRest: true,
      startBeat: 0,
      durationBeats: 4,
    }),
  });

  assert.deepEqual(measure.leftEvents.slice(0, 3).map(({ startQuarter, durationQuarter, isRest }) => [
    startQuarter,
    durationQuarter,
    isRest === true,
  ]), [
    [0, 0.25, false],
    [0.25, 0.125, true],
    [0.375, 0.125, false],
  ]);
  assert.equal(measure.rightEvents.length, 0);
});

test('the timing engine scores mixture note onsets at their written quarter-note offsets', () => {
  const start = 50_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...baseSettings,
      enabledMixtures: ['dottedQuaverSemiquaver'],
    },
    sessionStartTime: start,
    random: () => 0,
  });

  const results = engine.getResults(start + 900);
  const leftEvents = results.replayExpectedEvents
    ?.filter(({ hand }) => hand === 'left')
    .map(({ expectedTimeMs }) => expectedTimeMs - start);
  assert.deepEqual(leftEvents, [0, 750]);
  assert.ok(results.missedEvents.every((event) => event.durationQuarter !== undefined));
});

test('a written mixture rest has no expected tap and an early tap into it remains wrong', () => {
  const start = 80_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...baseSettings,
      enabledMixtures: ['semiquaverDemisemiquaverRestDemisemiquaver'],
      trainingMode: 'single-hand',
      singleHand: 'left',
    },
    sessionStartTime: start,
    random: () => 0,
  });

  assert.equal(engine.tap('left', start + 250), 'miss');
  const results = engine.getResults(start + 900);
  const expectedOnsets = results.replayExpectedEvents
    ?.filter(({ hand }) => hand === 'left')
    .map(({ expectedTimeMs }) => expectedTimeMs - start);
  assert.deepEqual(expectedOnsets, [0, 375, 500, 875]);
});
