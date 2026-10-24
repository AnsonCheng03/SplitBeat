/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createExerciseStepGenerator } from '@/rhythm/exerciseGenerator';
import {
  expandMixturePattern,
  generateMixturePattern,
  getMixturePattern,
  isMixturePatternId,
  legacyMixturesIncludeRests,
  mixtureNoteValuesFromLegacyIds,
  mixtureNoteOptionsForBar,
} from '@/rhythm/mixtures';
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
  challengeTriggerMode: 'notes',
  challengeMissStreak: 3,
  challengeWrongBarStreak: 2,
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

test('the mixture generator combines selected values and never exceeds the current bar', () => {
  const mixture = generateMixturePattern(
    ['dottedEighth', 'sixteenth', 'thirtySecond'],
    4,
    false,
    () => 0.35,
  );

  assert.ok(mixture);
  assert.ok(mixture.durationQuarter <= 4);
  assert.ok(mixture.atoms.length >= 2);
  assert.ok(mixture.atoms.every((atom) => atom.kind === 'note'));
  assert.ok(new Set(mixture.atoms.map(({ noteValue }) => noteValue)).size >= 2);
  assert.ok(isMixturePatternId(mixture.id));
  assert.deepEqual(getMixturePattern(mixture.id), mixture);
  assert.ok(mixture.atoms.reduce((total, atom) => total + atom.durationQuarter, 0) <= 4);
});

test('generated mixtures support rests and discard note values that cannot fit a bar', () => {
  const withRest = generateMixturePattern(['half'], 4, true, () => 0);
  assert.ok(withRest);
  assert.ok(withRest.durationQuarter <= 4);
  assert.ok(withRest.atoms.some((atom) => atom.kind === 'rest'));
  assert.ok(withRest.atoms.some((atom) => atom.kind === 'note'));

  assert.equal(generateMixturePattern(['whole', 'dottedHalf'], 4), null);
  assert.equal(generateMixturePattern(['half', 'dottedHalf', 'quarter'], 1.5), null);
});

test('legacy mixture presets migrate to their selectable note values', () => {
  assert.deepEqual(mixtureNoteValuesFromLegacyIds([
    'dottedQuaverSemiquaver',
    'semiquaverTwoDemisemiquavers',
  ]), ['dottedEighth', 'sixteenth', 'thirtySecond']);
  assert.equal(legacyMixturesIncludeRests(['semiquaverDemisemiquaverRestDemisemiquaver']), true);
});

test('mixture note selection only offers values no longer than the selected bar', () => {
  assert.ok(mixtureNoteOptionsForBar(1.5).every((option) => option.durationQuarter <= 1.5));
  assert.ok(mixtureNoteOptionsForBar(1.5).some((option) => option.value === 'dottedQuarter'));
  assert.ok(mixtureNoteOptionsForBar(1.5).every((option) => option.value !== 'half'));
  assert.deepEqual(mixtureNoteOptionsForBar(0), []);
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

test('random exercise generation uses user-selected note values to make bounded mixture bars', () => {
  let seed = 13;
  const random = () => {
    seed = (seed * 48_271) % 2_147_483_647;
    return seed / 2_147_483_647;
  };
  const getStep = createExerciseStepGenerator({
    enabledSubdivisions: [],
    mixtureNoteValues: ['dottedEighth', 'sixteenth', 'thirtySecond'],
    barDurationQuarterNotes: 4,
    changeIntervalBeats: 4,
    random,
  });
  const steps = Array.from({ length: 5 }, (_, index) => getStep(index));

  assert.ok(steps.every((step) => step.leftMixture && step.rightMixture));
  for (const step of steps) {
    for (const mixtureId of [step.leftMixture, step.rightMixture]) {
      assert.ok(mixtureId);
      assert.ok(getMixturePattern(mixtureId).durationQuarter <= 4);
    }
  }
  for (let index = 1; index < steps.length; index += 1) {
    const previous = steps[index - 1];
    const current = steps[index];
    assert.ok(previous && current);
    assert.notDeepEqual([previous.leftMixture, previous.rightMixture], [current.leftMixture, current.rightMixture]);
  }
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
    ?.filter(({ hand, reached }) => hand === 'left' && reached !== false)
    .map(({ expectedTimeMs }) => expectedTimeMs - start);
  assert.deepEqual(leftEvents, [0, 750]);
  assert.ok(results.missedEvents.every((event) => event.durationQuarter !== undefined));
});

test('the timing engine generates note mixtures within compound-meter bar length', () => {
  const start = 62_000;
  const engine = new RhythmTimingEngine({
    settings: {
      ...baseSettings,
      timeSignature: '6/8',
      durationSeconds: 'endless',
      enabledSubdivisions: [],
      mixtureNoteValues: ['eighth', 'sixteenth'],
    },
    sessionStartTime: start,
    random: () => 0,
  });

  const snapshot = engine.advance(start + 50);
  assert.ok(snapshot.currentStep.leftMixture);
  assert.ok(snapshot.currentStep.rightMixture);
  assert.ok(getMixturePattern(snapshot.currentStep.leftMixture).durationQuarter <= 3);
  assert.ok(getMixturePattern(snapshot.currentStep.rightMixture).durationQuarter <= 3);
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
    ?.filter(({ hand, reached }) => hand === 'left' && reached !== false)
    .map(({ expectedTimeMs }) => expectedTimeMs - start);
  assert.deepEqual(expectedOnsets, [0, 375, 500, 875]);
});
