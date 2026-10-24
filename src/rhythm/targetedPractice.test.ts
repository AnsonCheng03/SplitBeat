/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  combinationAccuracy,
  createTypedBarScore,
  filterCombinationProgress,
  parseCombinationProgress,
  parseTypedBar,
  recordCombinationProgress,
} from '@/rhythm/targetedPractice';
import type { CombinationStats } from '@/types/rhythm';

function combination(overrides: Partial<CombinationStats> = {}): CombinationStats {
  return {
    leftSubdivision: 'quarter',
    rightSubdivision: 'eighth',
    leftRest: false,
    rightRest: false,
    left: { totalExpected: 10, totalHit: 7 },
    right: { totalExpected: 20, totalHit: 18 },
    ...overrides,
  };
}

test('combination accuracy accumulates both hands and keeps mixtures distinct', () => {
  const initial = recordCombinationProgress([], [combination()], '4/4', 1_000);
  const updated = recordCombinationProgress(
    initial,
    [combination({ leftMixture: 'dottedQuaverSemiquaver', rightSubdivision: 'quarter' })],
    '4/4',
    2_000,
  );

  assert.equal(updated.length, 2);
  assert.equal(combinationAccuracy(updated.find((item) => item.leftMixture)!), 25 / 30 * 100);
  assert.equal(updated.find((item) => item.leftMixture)?.leftMixture, 'dottedQuaverSemiquaver');
  assert.equal(updated.find((item) => item.id.includes('eighth'))?.sessions, 1);
});

test('repeated combinations use cumulative expected and correct counts', () => {
  const oneSession = recordCombinationProgress([], [combination()], '4/4', 1_000);
  const twoSessions = recordCombinationProgress(oneSession, [combination()], '4/4', 2_000);
  assert.equal(twoSessions.length, 1);
  assert.equal(twoSessions[0].leftExpected, 20);
  assert.equal(twoSessions[0].leftHit, 14);
  assert.equal(twoSessions[0].rightExpected, 40);
  assert.equal(twoSessions[0].rightHit, 36);
  assert.equal(twoSessions[0].sessions, 2);
});

test('combination filters search labels and isolate weak, mixture, and rest pairs', () => {
  const records = recordCombinationProgress([], [
    combination(),
    combination({ leftMixture: 'dottedQuaverSemiquaver', left: { totalExpected: 10, totalHit: 3 } }),
    combination({ leftRest: true, left: { totalExpected: 10, totalHit: 9 } }),
  ], '4/4', 1_000);

  assert.equal(filterCombinationProgress(records, 'weak').length, 1);
  assert.equal(filterCombinationProgress(records, 'mixtures').length, 1);
  assert.equal(filterCombinationProgress(records, 'rests').length, 1);
  assert.equal(filterCombinationProgress(records, 'all', 'Dotted quaver').length, 1);
  assert.equal(filterCombinationProgress(records, 'all', '6/8').length, 0);
});

test('combination progress storage ignores malformed entries and JSON', () => {
  assert.deepEqual(parseCombinationProgress('{broken'), []);
  assert.deepEqual(parseCombinationProgress(JSON.stringify([{ id: 'bad' }])), []);
});

test('typed bar accepts mixed note values and rests when they fill 4/4', () => {
  const parsed = parseTypedBar('dq 16 e r16 16 de e', '4/4');
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(parsed.bar.events.map((event) => event.durationQuarter), [1.5, 0.25, 0.5, 0.25, 0.25, 0.75, 0.5]);
  assert.equal(parsed.bar.events[3].isRest, true);
  assert.equal(parsed.bar.durationQuarter, 4);
});

test('typed bar length follows simple and compound meters', () => {
  const compound = parseTypedBar('q q q', '6/8');
  const oddMeter = parseTypedBar('q e', '3/8');
  assert.equal(compound.ok, true);
  assert.equal(oddMeter.ok, true);
  assert.equal(parseTypedBar('q q', '6/8').ok, false);
});

test('typed bar explains invalid, incomplete, and overfull bars', () => {
  const errorMessage = (input: string) => {
    const result = parseTypedBar(input, '4/4');
    if (result.ok) throw new Error(`Expected “${input}” to be invalid.`);
    return result.error;
  };
  assert.match(errorMessage('q mystery'), /not a note value/);
  assert.match(errorMessage('q q'), /Fill the full/);
  assert.match(errorMessage('w q'), /longer than one/);
  assert.equal(parseTypedBar('r-w', '4/4').ok, true);
  const silentScore = createTypedBarScore('r-w', 'r-w', '4/4', 'two-hand', 'left');
  assert.equal(silentScore.ok, false);
});

test('typed two-hand bars allow one hand to rest for a complete bar', () => {
  const score = createTypedBarScore('r-w', 'q q q q', '4/4', 'two-hand', 'left');
  assert.equal(score.ok, true);
  if (!score.ok) return;
  assert.equal(score.score.measures[0].leftEvents.every((event) => event.isRest), true);
  assert.equal(score.score.measures[0].rightEvents.length, 4);
});

test('typed score includes both hands or only the selected hand', () => {
  const twoHand = createTypedBarScore('q q q q', 'e e e e e e e e', '4/4', 'two-hand', 'left');
  const singleHand = createTypedBarScore('', 'e e e e e e e e', '4/4', 'single-hand', 'right');

  assert.equal(twoHand.ok, true);
  assert.equal(singleHand.ok, true);
  if (!twoHand.ok || !singleHand.ok) return;
  assert.equal(twoHand.score.trackCount, 2);
  assert.equal(twoHand.score.measures[0].leftEvents.length, 4);
  assert.equal(twoHand.score.measures[0].rightEvents.length, 8);
  assert.equal(singleHand.score.trackCount, 1);
  assert.equal(singleHand.score.measures[0].leftEvents.length, 0);
  assert.equal(singleHand.score.measures[0].rightEvents.length, 8);
});
