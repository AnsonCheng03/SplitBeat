import assert from 'node:assert/strict';
import test from 'node:test';
import { getResumeStartNotes } from './resumeStart';
import type { ExerciseStep } from '@/types/rhythm';

const step: ExerciseStep = {
  id: 'step-1',
  leftSubdivision: 'quarter',
  rightSubdivision: 'eighth',
  leftRest: false,
  rightRest: false,
  startBeat: 0,
  durationBeats: 4,
};

test('resume cue names the active pattern for both hands', () => {
  assert.deepEqual(getResumeStartNotes({ step, singleHand: false, focusedHand: 'left' }), [
    { hand: 'left', label: 'Quarter (Crotchet)' },
    { hand: 'right', label: 'Quaver (Eighth)' },
  ]);
});

test('resume cue respects a single-hand focus and mixture or rest patterns', () => {
  const mixedStep = {
    ...step,
    leftMixture: 'dottedQuaverSemiquaver' as const,
    rightRest: true,
  };

  assert.deepEqual(getResumeStartNotes({ step: mixedStep, singleHand: true, focusedHand: 'left' }), [
    { hand: 'left', label: 'Dotted quaver + semiquaver' },
  ]);
  assert.deepEqual(getResumeStartNotes({ step: mixedStep, singleHand: false, focusedHand: 'left' }), [
    { hand: 'left', label: 'Dotted quaver + semiquaver' },
    { hand: 'right', label: 'Rest' },
  ]);
});

test('score resume cue describes the current written rhythm, including tuplets and cross-bar ties', () => {
  assert.deepEqual(getResumeStartNotes({
    step,
    singleHand: false,
    focusedHand: 'left',
    scoreEvents: {
      left: { startQuarter: 0, durationQuarter: 1 / 3, tupletNumber: 3 },
      right: { startQuarter: 0, durationQuarter: 0.5, isCrossBarTieContinuation: true },
    },
  }), [
    { hand: 'left', label: 'Triplet (3)' },
    { hand: 'right', label: 'Rest' },
  ]);
});
