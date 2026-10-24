/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPracticeScoreMeasure } from '@/rhythm/practiceScore';
import type { ExerciseStep } from '@/types/rhythm';

const steps: ExerciseStep[] = [
  {
    id: 'step-0',
    leftSubdivision: 'quarter',
    rightSubdivision: 'eighth',
    leftRest: false,
    rightRest: false,
    startBeat: 0,
    durationBeats: 2,
  },
  {
    id: 'step-1',
    leftSubdivision: 'triplet',
    rightSubdivision: 'quarter',
    leftRest: false,
    rightRest: true,
    startBeat: 2,
    durationBeats: 2,
  },
];

test('normal score notation joins mixed subdivisions in one bar at their real positions', () => {
  const measure = createPracticeScoreMeasure({
    barIndex: 0,
    beatsPerBar: 4,
    pulseQuarterNotes: 1,
    changeIntervalBeats: 2,
    restBetweenChanges: false,
    getStep: (index) => steps[index] ?? steps[1]!,
  });

  assert.equal(measure.durationQuarter, 4);
  assert.deepEqual(
    measure.leftEvents.map((event) => Number(event.startQuarter.toFixed(6))),
    [0, 1, 2, 2 + 1 / 3, 2 + 2 / 3, 3, 3 + 1 / 3, 3 + 2 / 3].map((value) => Number(value.toFixed(6))),
  );
  assert.deepEqual(measure.rightEvents.map((event) => event.startQuarter), [0, 0.5, 1, 1.5]);
  assert.deepEqual(measure.leftEvents.slice(2).map((event) => event.tupletNumber), [3, 3, 3, 3, 3, 3]);
});

test('normal score notation reflects compound meter tuplets and the configured change rest', () => {
  const measure = createPracticeScoreMeasure({
    barIndex: 0,
    beatsPerBar: 2,
    pulseQuarterNotes: 1.5,
    changeIntervalBeats: 2,
    restBetweenChanges: true,
    getStep: () => ({
      id: 'compound-triplets',
      leftSubdivision: 'triplet',
      rightSubdivision: 'eighth',
      leftRest: false,
      rightRest: false,
      startBeat: 0,
      durationBeats: 2,
    }),
  });

  assert.equal(measure.durationQuarter, 3);
  assert.deepEqual(measure.leftEvents.map((event) => event.startQuarter), [0, 0.5, 1]);
  assert.deepEqual(measure.rightEvents.map((event) => event.startQuarter), [0, 0.5, 1]);
  assert.ok(measure.leftEvents.every((event) => event.tupletNumber === 3));
});

test('a generated score measure clips notes at the end of a finite session', () => {
  const measure = createPracticeScoreMeasure({
    barIndex: 1,
    beatsPerBar: 4,
    pulseQuarterNotes: 1,
    changeIntervalBeats: 4,
    restBetweenChanges: false,
    sessionEndBeat: 6,
    getStep: () => ({
      id: 'eighths',
      leftSubdivision: 'eighth',
      rightSubdivision: 'quarter',
      leftRest: false,
      rightRest: false,
      startBeat: 4,
      durationBeats: 4,
    }),
  });

  assert.deepEqual(measure.leftEvents.map((event) => event.startQuarter), [0, 0.5, 1, 1.5]);
  assert.deepEqual(measure.rightEvents.map((event) => event.startQuarter), [0, 1]);
});
