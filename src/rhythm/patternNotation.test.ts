/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createExerciseBarEvents, createSubdivisionBarEvents, durationOfSubdivisionBar } from '@/rhythm/patternNotation';
import type { ExerciseStep } from '@/types/rhythm';

test('piano staff bars follow each meter and subdivision', () => {
  assert.equal(durationOfSubdivisionBar('4/4'), 4);
  assert.equal(createSubdivisionBarEvents('quarter', '4/4', 'straight').length, 4);
  assert.equal(createSubdivisionBarEvents('eighth', '4/4', 'straight').length, 8);
  assert.equal(createSubdivisionBarEvents('sixteenth', '4/4', 'straight').length, 16);
  assert.equal(createSubdivisionBarEvents('triplet', '4/4', 'straight').length, 12);
});

test('piano staff tuplets divide compound beats evenly and keep their group labels', () => {
  assert.equal(durationOfSubdivisionBar('6/8'), 3);
  const duplets = createSubdivisionBarEvents('duplet', '6/8', 'straight');
  const sextuplets = createSubdivisionBarEvents('sextuplet', '6/8', 'straight');
  assert.equal(duplets.length, 4);
  assert.equal(sextuplets.length, 12);
  assert.deepEqual(duplets.map((event) => event.startQuarter), [0, 0.75, 1.5, 2.25]);
  assert.ok(sextuplets.every((event) => event.tupletNumber === 6));
});

test('piano staff event positions reflect swing', () => {
  const straight = createSubdivisionBarEvents('eighth', '4/4', 'straight');
  const swing = createSubdivisionBarEvents('eighth', '4/4', 'swing');
  assert.equal(straight[1]?.startQuarter, 0.5);
  assert.ok(Math.abs((swing[1]?.startQuarter ?? 0) - 2 / 3) < 0.000001);
});

test('piano staff keeps mixed pattern changes in place and shows the rest before each switch', () => {
  const steps: ExerciseStep[] = [
    { id: 'step-0', leftSubdivision: 'quarter', rightSubdivision: 'eighth', startBeat: 0, durationBeats: 2 },
    { id: 'step-1', leftSubdivision: 'eighth', rightSubdivision: 'triplet', startBeat: 2, durationBeats: 2 },
    { id: 'step-2', leftSubdivision: 'quarter', rightSubdivision: 'quarter', startBeat: 4, durationBeats: 2 },
  ];

  const left = createExerciseBarEvents({
    steps,
    hand: 'left',
    barStartBeat: 0,
    timeSignature: '4/4',
    feel: 'straight',
    restBetweenChanges: true,
  });
  const right = createExerciseBarEvents({
    steps,
    hand: 'right',
    barStartBeat: 0,
    timeSignature: '4/4',
    feel: 'straight',
    restBetweenChanges: true,
  });

  assert.deepEqual(left.map((event) => event.startQuarter), [0, 2, 2.5]);
  assert.deepEqual(right.map((event) => event.startQuarter), [0, 0.5, 2, 2 + 1 / 3, 2 + 2 / 3]);
});
