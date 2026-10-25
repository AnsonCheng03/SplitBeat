import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COMPOSER_TUPLET_SYMBOLS,
  composeRhythmScore,
  NOTE_VALUE_SYMBOLS,
  noteValuesForSymbol,
} from '@/rhythm/scoreComposer';
import type { ComposerSymbolId } from '@/rhythm/scoreComposer';
import { createBarNoteNotationPlan, createSharedBarNoteAnchorInsets } from '@/rhythm/noteNotation';
import { scoreNotationEvents, scoreNotationEventsForSpan } from '@/rhythm/scoreStaff';
import { composerPreviewDimensions } from '@/rhythm/scoreLayout';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import { TIME_SIGNATURES } from '@/types/rhythm';

const composerSymbolIds: ComposerSymbolId[] = [
  ...NOTE_VALUE_SYMBOLS.map(({ id }) => id as ComposerSymbolId),
  ...COMPOSER_TUPLET_SYMBOLS.map(({ id }) => id),
];

function assertNotationFits(plan: ReturnType<typeof createBarNoteNotationPlan>, description: string) {
  const epsilon = 0.001;
  assert.ok(Number.isFinite(plan.width) && plan.width > 0, `${description}: notation width`);
  assert.ok(Number.isFinite(plan.height) && plan.height > 0, `${description}: notation height`);
  for (const [index, note] of plan.notes.entries()) {
    assert.ok(note.left >= -epsilon, `${description}: notehead starts inside the viewport`);
    assert.ok(note.left + note.headWidth <= plan.width + epsilon, `${description}: notehead ends inside the viewport`);
    assert.ok(note.headTop >= -epsilon, `${description}: notehead top is visible`);
    assert.ok(note.headTop + note.headHeight <= plan.height + epsilon, `${description}: notehead bottom is visible`);
    assert.ok(note.stemTop >= -epsilon, `${description}: stem top is visible`);
    assert.ok(note.stemTop + note.stemHeight <= plan.height + epsilon, `${description}: stem bottom is visible`);
    const previous = plan.notes[index - 1];
    if (previous) {
      const previousCenter = previous.left + previous.headWidth / 2;
      const currentCenter = note.left + note.headWidth / 2;
      assert.ok(currentCenter - previousCenter >= (previous.headWidth + note.headWidth) / 2 - epsilon, `${description}: adjacent noteheads do not overlap`);
    }
  }
  for (const beam of plan.beams) {
    assert.ok(beam.left >= -epsilon, `${description}: beam starts inside the viewport`);
    assert.ok(beam.left + beam.width <= plan.width + epsilon, `${description}: beam ends inside the viewport`);
    assert.ok(beam.top >= -epsilon && beam.top + beam.height <= plan.height + epsilon, `${description}: beam is visible vertically`);
  }
  for (const dot of plan.dots) {
    assert.ok(dot.left >= -epsilon, `${description}: dot starts inside the viewport`);
    assert.ok(dot.left + dot.size <= plan.width + epsilon, `${description}: dot ends inside the viewport`);
    assert.ok(dot.top >= -epsilon && dot.top + dot.size <= plan.height + epsilon, `${description}: dot is visible vertically`);
  }
  for (const label of plan.tupletLabels) {
    assert.ok(label.left >= -epsilon, `${description}: tuplet label starts inside the viewport`);
    assert.ok(label.left + label.width <= plan.width + epsilon, `${description}: tuplet label ends inside the viewport`);
    assert.ok(label.top >= -epsilon && label.top + label.fontSize <= plan.height + epsilon, `${description}: tuplet label is visible vertically`);
  }
}

test('composes mixed note lengths into successive bars without requiring one value per bar', () => {
  const result = composeRhythmScore({
    timeSignature: '4/4',
    trainingMode: 'two-hand',
    singleHand: 'left',
    left: [
      { durationQuarter: 0.75 },
      { durationQuarter: 0.25 },
      { durationQuarter: 0.125 },
      { durationQuarter: 0.125 },
      { durationQuarter: 4 },
    ],
    right: [{ durationQuarter: 1, isRest: true }, { durationQuarter: 4 }],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.score.measures.length, 2);
  assert.equal(result.score.totalQuarterNotes, 8);
  assert.deepEqual(result.score.measures[0]!.leftEvents.map(({ startQuarter }) => startQuarter), [0, 0.75, 1, 1.125, 1.25, 3.25]);
  assert.deepEqual(result.score.measures[1]!.leftEvents.map(({ startQuarter }) => startQuarter), [0, 1]);
  assert.deepEqual(result.score.measures[0]!.rightEvents.map(({ startQuarter, isRest }) => [startQuarter, isRest]), [[0, true], [1, undefined]]);
  assert.deepEqual(result.score.measures[1]!.rightEvents.map(({ startQuarter }) => startQuarter), [0]);
});

test('splits a note crossing the bar line into correctly tied written segments', () => {
  const result = composeRhythmScore({
    timeSignature: '2/4',
    trainingMode: 'single-hand',
    singleHand: 'right',
    left: [],
    right: [{ durationQuarter: 4 }],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  const firstSegment = result.score.measures[0]!.rightEvents[0]!;
  const continuation = result.score.measures[1]!.rightEvents[0]!;
  assert.equal(result.score.measures.length, 2);
  assert.equal(firstSegment.durationQuarter, 4);
  assert.equal(firstSegment.notationDurationQuarter, 2);
  assert.equal(firstSegment.tieToNext, true);
  assert.equal(continuation.startQuarter, 0);
  assert.equal(continuation.durationQuarter, 2);
  assert.equal(continuation.tieFromPrevious, true);
  assert.equal(continuation.isTieContinuation, true);
  assert.equal(continuation.isCrossBarTieContinuation, true);
  assert.equal(result.score.measures[0]!.leftEvents.length, 0);
});

test('decomposes awkward bar-line remainder into valid tied note values', () => {
  const result = composeRhythmScore({
    timeSignature: '4/4',
    trainingMode: 'single-hand',
    singleHand: 'left',
    left: [
      { durationQuarter: 3 },
      { durationQuarter: 0.25 },
      { durationQuarter: 2 },
    ],
    right: [],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  const firstBar = result.score.measures[0]!.leftEvents;
  const secondBar = result.score.measures[1]!.leftEvents;
  const tiedFirstBarSegments = firstBar.filter((event) => event.startQuarter >= 3.25);
  assert.deepEqual(tiedFirstBarSegments.map(({ notationDurationQuarter, tieToNext }) => [notationDurationQuarter, tieToNext]), [[0.75, true]]);
  assert.deepEqual(secondBar.map(({ startQuarter, notationDurationQuarter, tieFromPrevious, tieToNext }) => [startQuarter, notationDurationQuarter, tieFromPrevious, tieToNext]), [
    [0, 1, true, true],
    [1, 0.25, true, undefined],
  ]);
  assert.equal(secondBar[0]!.isCrossBarTieContinuation, true);
  assert.equal(secondBar[1]!.isCrossBarTieContinuation, true);
});

test('uses the meter pulse for tuplet icon groups, including compound time', () => {
  const triplet = noteValuesForSymbol('triplet', '6/8');
  assert.equal(triplet.length, 3);
  assert.deepEqual(triplet.map(({ durationQuarter, tupletNumber }) => [durationQuarter, tupletNumber]), [
    [pulseQuarterNotes('6/8') / 3, 3],
    [pulseQuarterNotes('6/8') / 3, 3],
    [pulseQuarterNotes('6/8') / 3, 3],
  ]);
  assert.equal(triplet.reduce((duration, item) => duration + item.durationQuarter, 0), pulseQuarterNotes('6/8'));
  assert.deepEqual(noteValuesForSymbol('triplet', '6/8', true), [{ durationQuarter: 1.5, isRest: true }]);
});

test('beams each composed bar in the selected simple or compound meter groups', () => {
  const simple = composeRhythmScore({
    timeSignature: '4/4',
    trainingMode: 'single-hand',
    singleHand: 'left',
    left: Array.from({ length: 8 }, () => ({ durationQuarter: 0.5 })),
    right: [],
  });
  assert.equal(simple.ok, true);
  if (!simple.ok) return;
  const simpleNotation = createBarNoteNotationPlan(scoreNotationEvents(simple.score.measures[0]!.leftEvents), {
    durationQuarter: simple.score.measures[0]!.durationQuarter,
    width: 400,
    beamGroupQuarterNotes: pulseQuarterNotes('4/4'),
  });
  assert.deepEqual(simpleNotation.beams.filter(({ level }) => level === 0).map(({ startIndex, endIndex }) => [startIndex, endIndex]), [[0, 1], [2, 3], [4, 5], [6, 7]]);

  const compound = composeRhythmScore({
    timeSignature: '6/8',
    trainingMode: 'single-hand',
    singleHand: 'left',
    left: Array.from({ length: 6 }, () => ({ durationQuarter: 0.5 })),
    right: [],
  });
  assert.equal(compound.ok, true);
  if (!compound.ok) return;
  const compoundNotation = createBarNoteNotationPlan(scoreNotationEvents(compound.score.measures[0]!.leftEvents), {
    durationQuarter: compound.score.measures[0]!.durationQuarter,
    width: 400,
    beamGroupQuarterNotes: pulseQuarterNotes('6/8'),
  });
  assert.deepEqual(compoundNotation.beams.filter(({ level }) => level === 0).map(({ startIndex, endIndex }) => [startIndex, endIndex]), [[0, 2], [3, 5]]);
});

test('mixed note combinations keep each beam group inside its 4/4 beat', () => {
  const result = composeRhythmScore({
    timeSignature: '4/4',
    trainingMode: 'single-hand',
    singleHand: 'left',
    left: [
      { durationQuarter: 0.75 }, { durationQuarter: 0.25 },
      { durationQuarter: 0.5 }, { durationQuarter: 0.5 },
      { durationQuarter: 0.5 }, { durationQuarter: 0.25 }, { durationQuarter: 0.25 },
      { durationQuarter: 1 },
    ],
    right: [],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  const measure = result.score.measures[0]!;
  assert.equal(measure.durationQuarter, 4);
  assert.deepEqual(measure.leftEvents.map(({ startQuarter, durationQuarter }) => [startQuarter, durationQuarter]), [
    [0, 0.75], [0.75, 0.25], [1, 0.5], [1.5, 0.5],
    [2, 0.5], [2.5, 0.25], [2.75, 0.25], [3, 1],
  ]);

  const notation = createBarNoteNotationPlan(scoreNotationEvents(measure.leftEvents), {
    durationQuarter: measure.durationQuarter,
    width: 360,
    beamGroupQuarterNotes: pulseQuarterNotes('4/4'),
  });
  const primaryBeamGroups = notation.beams
    .filter(({ kind, level }) => kind === 'beam' && level === 0)
    .map(({ startIndex, endIndex }) => [startIndex, endIndex]);

  assert.deepEqual(primaryBeamGroups, [[0, 1], [2, 3], [4, 6]]);
  for (const [startIndex, endIndex] of primaryBeamGroups) {
    const first = notation.events[startIndex];
    const last = notation.events[endIndex];
    assert.ok(first && last);
    assert.equal(Math.floor(first.startQuarter), Math.floor(last.startQuarter), 'a beam group must not cross a beat');
  }
});

test('composed bars match beat counts across simple, half-note, and compound meters', () => {
  const cases = [
    ['2/4', 2], ['3/4', 3], ['4/4', 4], ['5/4', 5], ['7/4', 7],
    ['2/2', 4], ['3/8', 1.5], ['6/8', 3], ['9/8', 4.5], ['12/8', 6],
  ] as const;

  for (const [timeSignature, expectedBarQuarterNotes] of cases) {
    const oneBar = composeRhythmScore({
      timeSignature,
      trainingMode: 'single-hand',
      singleHand: 'left',
      left: [{ durationQuarter: expectedBarQuarterNotes }],
      right: [],
    });
    assert.equal(oneBar.ok, true, `${timeSignature} should accept one complete bar`);
    if (!oneBar.ok) continue;
    assert.equal(oneBar.score.measures.length, 1, `${timeSignature} should end after one complete bar`);
    assert.equal(oneBar.score.measures[0]?.durationQuarter, expectedBarQuarterNotes, `${timeSignature} bar duration`);
    assert.equal(oneBar.score.totalQuarterNotes, expectedBarQuarterNotes, `${timeSignature} score duration`);

    const crossingBarline = composeRhythmScore({
      timeSignature,
      trainingMode: 'single-hand',
      singleHand: 'left',
      left: [{ durationQuarter: expectedBarQuarterNotes }, { durationQuarter: 0.25 }],
      right: [],
    });
    assert.equal(crossingBarline.ok, true, `${timeSignature} should start the next note on the next bar`);
    if (!crossingBarline.ok) continue;
    assert.deepEqual(
      crossingBarline.score.measures.map(({ startQuarter, durationQuarter }) => [startQuarter, durationQuarter]),
      [[0, expectedBarQuarterNotes], [expectedBarQuarterNotes, expectedBarQuarterNotes]],
      `${timeSignature} measure starts and lengths`,
    );
  }
});

test('creates an implicit second bar when only one hand continues and rejects rest-only scores', () => {
  const score = composeRhythmScore({
    timeSignature: '3/4',
    trainingMode: 'two-hand',
    singleHand: 'left',
    left: [{ durationQuarter: 3 }, { durationQuarter: 0.5 }],
    right: [],
  });
  assert.equal(score.ok, true);
  if (score.ok) {
    assert.equal(score.score.measures.length, 2);
    assert.equal(score.score.measures[1]!.leftEvents[0]!.startQuarter, 0);
    assert.equal(score.score.measures[1]!.rightEvents.length, 0);
  }

  assert.deepEqual(composeRhythmScore({
    timeSignature: '4/4',
    trainingMode: 'two-hand',
    singleHand: 'left',
    left: [{ durationQuarter: 4, isRest: true }],
    right: [],
  }), { ok: false, error: 'Add at least one note to the active hand or hands.' });
});

test('every pair of note, rest, and tuplet symbols stays writable and visible across supported meters', () => {
  const restStates = [false, true];
  const context = (meter: string, left: ComposerSymbolId, right: ComposerSymbolId, leftRest: boolean, rightRest: boolean) =>
    `${meter}: left ${left}${leftRest ? ' rest' : ''} + right ${right}${rightRest ? ' rest' : ''}`;

  for (const timeSignature of TIME_SIGNATURES) {
    for (const leftSymbol of composerSymbolIds) {
      for (const rightSymbol of composerSymbolIds) {
        for (const leftRest of restStates) {
          for (const rightRest of restStates) {
            if (leftRest && rightRest) continue;
            const description = context(timeSignature, leftSymbol, rightSymbol, leftRest, rightRest);
            const leftInput = noteValuesForSymbol(leftSymbol, timeSignature, leftRest);
            const rightInput = noteValuesForSymbol(rightSymbol, timeSignature, rightRest);
            const result = composeRhythmScore({
              timeSignature,
              trainingMode: 'two-hand',
              singleHand: 'left',
              left: leftInput,
              right: rightInput,
            });

            assert.equal(result.ok, true, `${description}: score should compose`);
            if (!result.ok) continue;

            const barLength = result.score.measures[0]?.durationQuarter ?? 0;
            assert.ok(barLength > 0, `${description}: score should include a bar`);
            assert.equal(result.score.totalQuarterNotes, result.score.measures.length * barLength, `${description}: total duration uses full bars`);

            for (const hand of ['left', 'right'] as const) {
              const expectedInput = hand === 'left' ? leftInput : rightInput;
              const expectedDuration = expectedInput.reduce((total, item) => total + item.durationQuarter, 0);
              const placedEvents = result.score.measures.flatMap((measure) =>
                measure[`${hand}Events`].map((event) => ({
                  ...event,
                  absoluteStart: measure.startQuarter + event.startQuarter,
                  writtenDuration: event.notationDurationQuarter ?? event.durationQuarter,
                })),
              );
              let cursor = 0;
              for (const event of placedEvents) {
                assert.ok(Math.abs(event.absoluteStart - cursor) < 0.00001, `${description}: ${hand} timeline has no gaps or overlaps`);
                assert.ok(event.writtenDuration > 0, `${description}: ${hand} event has positive written duration`);
                assert.ok(event.startQuarter >= -0.000001, `${description}: ${hand} event starts inside its bar`);
                assert.ok(event.startQuarter + event.writtenDuration <= barLength + 0.000001, `${description}: ${hand} event ends inside its bar`);
                cursor = event.absoluteStart + event.writtenDuration;
              }
              assert.ok(Math.abs(cursor - expectedDuration) < 0.00001, `${description}: ${hand} written duration matches selected symbols`);

              for (const measure of result.score.measures) {
                const preview = composerPreviewDimensions(measure);
                const notationByHand = {
                  left: scoreNotationEventsForSpan(measure.leftEvents, measure.durationQuarter),
                  right: scoreNotationEventsForSpan(measure.rightEvents, measure.durationQuarter),
                };
                const anchorInsets = createSharedBarNoteAnchorInsets(
                  [notationByHand.left, notationByHand.right],
                  { durationQuarter: measure.durationQuarter, width: preview.notationWidth, size: 'compact' },
                );
                const plan = createBarNoteNotationPlan(notationByHand[hand], {
                  durationQuarter: measure.durationQuarter,
                  width: preview.notationWidth,
                  size: 'compact',
                  beamGroupQuarterNotes: pulseQuarterNotes(timeSignature),
                  anchorInsets,
                });
                assertNotationFits(plan, `${description}: ${hand} bar ${measure.index + 1}`);
                for (const beam of plan.beams.filter((item) => item.kind === 'beam' && item.level === 0)) {
                  const first = plan.events[beam.startIndex];
                  const last = plan.events[beam.endIndex];
                  assert.ok(first && last, `${description}: beam indexes refer to notes`);
                  if (!first || !last) continue;
                  assert.equal(
                    Math.floor((first.startQuarter + 0.000001) / pulseQuarterNotes(timeSignature)),
                    Math.floor((last.startQuarter + 0.000001) / pulseQuarterNotes(timeSignature)),
                    `${description}: beam group stays inside the selected beat`,
                  );
                }
              }
            }
          }
        }
      }
    }
  }
});

test('dense 64th-note bars produce complete note geometry without clipped noteheads', () => {
  const result = composeRhythmScore({
    timeSignature: '4/4',
    trainingMode: 'single-hand',
    singleHand: 'left',
    left: Array.from({ length: 64 }, () => ({ durationQuarter: 1 / 16 })),
    right: [],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.score.measures.length, 1);
  const events = scoreNotationEvents(result.score.measures[0]!.leftEvents);
  const preview = composerPreviewDimensions(result.score.measures[0]!);
  const plan = createBarNoteNotationPlan(events, {
    durationQuarter: result.score.measures[0]!.durationQuarter,
    width: preview.notationWidth,
    size: 'compact',
    beamGroupQuarterNotes: pulseQuarterNotes('4/4'),
  });
  assert.equal(plan.notes.length, 64);
  assertNotationFits(plan, '64 sixteenth-note events in one compact bar');
});
