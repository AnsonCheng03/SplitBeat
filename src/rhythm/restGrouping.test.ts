import assert from 'node:assert/strict';
import test from 'node:test';
import { groupAdjacentRestsWithinBeat } from '@/rhythm/restGrouping';
import { createBarNoteNotationPlan, createNoteNotationPlan } from '@/rhythm/noteNotation';

test('two eighth rests in one quarter-note beat become one quarter rest', () => {
  const plan = createNoteNotationPlan('eighth', 'full', '4/4', undefined, true);

  assert.deepEqual(plan.events.map(({ startQuarter, durationQuarter, isRest }) => [
    startQuarter,
    durationQuarter,
    isRest,
  ]), [[0, 1, true]]);
  assert.equal(plan.beams.length, 0);
});

test('a grouped rest is placed at the center of its written duration', () => {
  const plan = createBarNoteNotationPlan([
    { startQuarter: 0, durationQuarter: 0.5, isRest: true },
    { startQuarter: 0.5, durationQuarter: 0.5, isRest: true },
  ], { durationQuarter: 1, width: 200 });

  assert.equal(plan.notes.length, 1);
  assert.ok(Math.abs(plan.notes[0]!.left + plan.notes[0]!.headWidth / 2 - plan.width / 2) < 1);
});

test('rests on opposite sides of a beat boundary remain separate', () => {
  const grouped = groupAdjacentRestsWithinBeat([
    { startQuarter: 0.5, durationQuarter: 0.5, isRest: true },
    { startQuarter: 1, durationQuarter: 0.5, isRest: true },
  ], 1);

  assert.deepEqual(grouped.map(({ startQuarter, durationQuarter }) => [startQuarter, durationQuarter]), [
    [0.5, 0.5],
    [1, 0.5],
  ]);
});

test('rest grouping follows the meter beat even when beams span a longer pattern', () => {
  const plan = createBarNoteNotationPlan([
    { startQuarter: 0, durationQuarter: 0.5, isRest: true },
    { startQuarter: 0.5, durationQuarter: 0.5, isRest: true },
    { startQuarter: 1, durationQuarter: 0.5, isRest: true },
    { startQuarter: 1.5, durationQuarter: 0.5, isRest: true },
  ], {
    durationQuarter: 2,
    width: 200,
    beamGroupQuarterNotes: 2,
    restGroupQuarterNotes: 1,
  });

  assert.deepEqual(plan.events.map(({ startQuarter, durationQuarter }) => [startQuarter, durationQuarter]), [
    [0, 1],
    [1, 1],
  ]);
});

test('a note breaks an otherwise adjacent rest run', () => {
  const grouped = groupAdjacentRestsWithinBeat([
    { startQuarter: 0, durationQuarter: 0.25, isRest: true },
    { startQuarter: 0.25, durationQuarter: 0.25 },
    { startQuarter: 0.5, durationQuarter: 0.5, isRest: true },
  ], 1);

  assert.deepEqual(grouped.map(({ startQuarter, durationQuarter, isRest }) => [
    startQuarter,
    durationQuarter,
    isRest,
  ]), [
    [0, 0.25, true],
    [0.25, 0.25, undefined],
    [0.5, 0.5, true],
  ]);
});

test('three eighth rests inside a dotted-quarter compound beat become one dotted-quarter rest', () => {
  const grouped = groupAdjacentRestsWithinBeat([
    { startQuarter: 0, durationQuarter: 0.5, isRest: true },
    { startQuarter: 0.5, durationQuarter: 0.5, isRest: true },
    { startQuarter: 1, durationQuarter: 0.5, isRest: true },
  ], 1.5);

  assert.deepEqual(grouped, [{ startQuarter: 0, durationQuarter: 1.5, isRest: true }]);
});

test('rest groups retain nonstandard durations and never extend through a beat boundary', () => {
  const grouped = groupAdjacentRestsWithinBeat([
    { startQuarter: 0, durationQuarter: 0.375, isRest: true },
    { startQuarter: 0.375, durationQuarter: 0.125, isRest: true },
    { startQuarter: 0.875, durationQuarter: 0.25, isRest: true },
    { startQuarter: 1.125, durationQuarter: 0.125, isRest: true },
  ], 1);

  assert.deepEqual(grouped.map(({ startQuarter, durationQuarter }) => [startQuarter, durationQuarter]), [
    [0, 0.5],
    [0.875, 0.25],
    [1.125, 0.125],
  ]);
});
