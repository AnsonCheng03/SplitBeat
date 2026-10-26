/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getMixturePattern } from '@/rhythm/mixtures';
import { pulseQuarterNotes, timeSignatureMetrics } from '@/rhythm/subdivisions';
import { createPracticeScoreMeasure } from '@/rhythm/practiceScore';
import { createExerciseStepGenerator } from '@/rhythm/exerciseGenerator';
import { TIME_SIGNATURES } from '@/types/rhythm';

test('pads the shorter hand with a rest so both generated rhythms have the same duration', () => {
  const getStep = createExerciseStepGenerator({
    enabledSubdivisions: ['quarter'],
    changeIntervalBeats: 3,
    timeSignature: '3/4',
    patternPairs: [{
      leftSubdivision: 'quarter',
      rightSubdivision: 'quarter',
      leftMixture: 'mix1-n32-n32-r32',
    }],
    random: () => 0,
  });
  const step = getStep(0);

  assert.equal(step.leftMixture, 'mix1-n32-n32-r32');
  assert.equal(step.rightMixture, 'mix1-n64-r32');

  const leftPattern = getMixturePattern(step.leftMixture!);
  const rightPattern = getMixturePattern(step.rightMixture!);
  assert.equal(leftPattern.durationQuarter, 1.5);
  assert.equal(rightPattern.durationQuarter, 1.5);
  assert.deepEqual(rightPattern.atoms.map(({ kind, durationQuarter }) => [kind, durationQuarter]), [
    ['note', 1],
    ['rest', 0.5],
  ]);
});

test('the aligned rhythms fill the same three-quarter bar in score notation', () => {
  const getStep = createExerciseStepGenerator({
    enabledSubdivisions: ['quarter'],
    changeIntervalBeats: 3,
    timeSignature: '3/4',
    patternPairs: [{
      leftSubdivision: 'quarter',
      rightSubdivision: 'quarter',
      leftMixture: 'mix1-n32-n32-r32',
    }],
    random: () => 0,
  });
  const measure = createPracticeScoreMeasure({
    barIndex: 0,
    beatsPerBar: 3,
    pulseQuarterNotes: 1,
    changeIntervalBeats: 3,
    restBetweenChanges: false,
    getStep,
  });

  assert.equal(measure.leftEvents.reduce((total, event) => total + event.durationQuarter, 0), 3);
  assert.equal(measure.rightEvents.reduce((total, event) => total + event.durationQuarter, 0), 3);
  assert.deepEqual(measure.rightEvents.map(({ startQuarter, isRest }) => [startQuarter, isRest === true]), [
    [0, false],
    [1, true],
    [1.5, false],
    [2.5, true],
  ]);
});

test('rhythm pairs stay aligned across every supported time signature', () => {
  for (const timeSignature of TIME_SIGNATURES) {
    const metrics = timeSignatureMetrics(60, timeSignature);
    const pulse = pulseQuarterNotes(timeSignature);
    const barDurationQuarter = metrics.beatsPerBar * pulse;
    const expectedBarDurationQuarter = Number(timeSignature.split('/')[0]) * 4 / Number(timeSignature.split('/')[1]);
    const getStep = createExerciseStepGenerator({
      enabledSubdivisions: ['quarter'],
      changeIntervalBeats: metrics.beatsPerBar,
      timeSignature,
      patternPairs: [{
        leftSubdivision: 'quarter',
        rightSubdivision: 'quarter',
        leftMixture: 'mix1-n32-n32-r32',
      }],
      random: () => 0,
    });
    const step = getStep(0);

    assert.equal(barDurationQuarter, expectedBarDurationQuarter, `${timeSignature} bar length`);
    assert.equal(
      getMixturePattern(step.leftMixture!).durationQuarter,
      getMixturePattern(step.rightMixture!).durationQuarter,
      `${timeSignature} rhythm-symbol pattern length`,
    );

    const measure = createPracticeScoreMeasure({
      barIndex: 0,
      beatsPerBar: metrics.beatsPerBar,
      pulseQuarterNotes: pulse,
      changeIntervalBeats: metrics.beatsPerBar,
      restBetweenChanges: false,
      getStep,
    });
    assert.equal(measure.durationQuarter, expectedBarDurationQuarter, `${timeSignature} score measure`);
    for (const event of [...measure.leftEvents, ...measure.rightEvents]) {
      assert.ok(event.startQuarter + event.durationQuarter <= expectedBarDurationQuarter + 1e-8, `${timeSignature} event overflow`);
    }
  }
});

