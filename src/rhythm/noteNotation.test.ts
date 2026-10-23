/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBarNoteNotationPlan, createNoteNotationPlan } from '@/rhythm/noteNotation';

test('note builder creates joined noteheads and stems at each supported subdivision', () => {
  const cases = [
    ['quarter', 1],
    ['eighth', 2],
    ['duplet', 2],
    ['triplet', 3],
    ['quadruplet', 4],
    ['quintuplet', 5],
    ['sextuplet', 6],
    ['septuplet', 7],
    ['octuplet', 8],
    ['nonuplet', 9],
    ['sixteenth', 4],
    ['thirtySecond', 8],
    ['sixtyFourth', 16],
  ] as const;

  for (const [subdivision, expectedCount] of cases) {
    const plan = createNoteNotationPlan(subdivision);
    assert.equal(plan.notes.length, expectedCount, subdivision);
    const slotWidth = plan.width / expectedCount;

    for (const [index, note] of plan.notes.entries()) {
      assert.equal(note.left, index * slotWidth + (slotWidth - note.headWidth) / 2, `${subdivision} note spacing`);
      assert.ok(note.headWidth > note.headHeight, `${subdivision} notehead should be oval`);
      assert.ok(note.stemTop < note.headTop, `${subdivision} stem should extend above the notehead`);
      assert.ok(note.stemLeft < note.headWidth, `${subdivision} stem should join the notehead`);
      assert.ok(note.stemLeft + note.stemWidth > 0, `${subdivision} stem should overlap the notehead`);
    }
  }
});

test('bar note builder beams adjacent notes according to each note duration', () => {
  const plan = createBarNoteNotationPlan(
    [
      { startQuarter: 0, durationQuarter: 0.125 },
      { startQuarter: 0.125, durationQuarter: 0.125 },
      { startQuarter: 0.25, durationQuarter: 0.25 },
      { startQuarter: 0.5, durationQuarter: 0.5 },
    ],
    { durationQuarter: 1, width: 400, beamGroupQuarterNotes: 1 },
  );

  assert.equal(plan.notes.length, 4);
  assert.equal(plan.durationQuarter, 1);
  assert.deepEqual(plan.events.map((event) => event.startQuarter), [0, 0.125, 0.25, 0.5]);
  assert.deepEqual(
    [0, 1, 2].map((level) => plan.beams.filter((beam) => beam.kind === 'beam' && beam.level === level).length),
    [1, 1, 1],
  );
  assert.equal(plan.beams.filter((beam) => beam.kind === 'flag').length, 0);
  assert.ok(plan.notes[0]!.left < plan.notes[1]!.left);

  const triplet = createBarNoteNotationPlan(
    Array.from({ length: 3 }, (_, index) => ({
      startQuarter: index / 3,
      durationQuarter: 1 / 3,
      tupletNumber: 3,
    })),
    { durationQuarter: 1, width: 240, beamGroupQuarterNotes: 1 },
  );
  assert.equal(triplet.beams.filter((beam) => beam.kind === 'beam').length, 1);
  assert.equal(triplet.tupletLabels[0]?.text, '3');
});

test('engraving plans preserve sorted mixed note values and tuplet metadata', () => {
  const plan = createBarNoteNotationPlan(
    [
      { startQuarter: 1.5, durationQuarter: 0.5 },
      { startQuarter: 0, durationQuarter: 0.25 },
      { startQuarter: 0.25, durationQuarter: 0.25, tupletNumber: 3 },
    ],
    { durationQuarter: 2, width: 280, beamGroupQuarterNotes: 1 },
  );

  assert.equal(plan.durationQuarter, 2);
  assert.deepEqual(plan.events.map(({ startQuarter, durationQuarter }) => [startQuarter, durationQuarter]), [
    [0, 0.25],
    [0.25, 0.25],
    [1.5, 0.5],
  ]);
  assert.equal(plan.events[1]?.tupletNumber, 3);
});

test('bar note builder labels imported duplet, sextuplet, and mixed tuplet groups', () => {
  const plan = createBarNoteNotationPlan(
    [
      ...Array.from({ length: 2 }, (_, index) => ({
        startQuarter: index * 0.75,
        durationQuarter: 0.75,
        tupletNumber: 2,
      })),
      ...Array.from({ length: 6 }, (_, index) => ({
        startQuarter: 1.5 + index / 6,
        durationQuarter: 1 / 6,
        tupletNumber: 6,
      })),
    ],
    { durationQuarter: 2.5, width: 400, beamGroupQuarterNotes: 1.5 },
  );

  assert.deepEqual(plan.tupletLabels.map((label) => label.text), ['2', '6']);
  assert.ok(plan.tupletLabels.every((label) => label.width > 0));
  assert.ok(plan.height > 44, 'tuplet labels get room above the beams');
});

test('bar note builder flags isolated short notes and splits beams at beat groups', () => {
  const isolated = createBarNoteNotationPlan(
    [
      { startQuarter: 0, durationQuarter: 0.5 },
      { startQuarter: 0.5, durationQuarter: 1 },
      { startQuarter: 1.5, durationQuarter: 0.25 },
    ],
    { durationQuarter: 2, width: 300, beamGroupQuarterNotes: 1 },
  );
  assert.equal(isolated.beams.filter((beam) => beam.kind === 'flag').length, 3);

  const compoundBeatGroups = createBarNoteNotationPlan(
    Array.from({ length: 6 }, (_, index) => ({ startQuarter: index / 2, durationQuarter: 0.5 })),
    { durationQuarter: 3, width: 360, beamGroupQuarterNotes: 1.5 },
  );
  assert.equal(compoundBeatGroups.beams.filter((beam) => beam.kind === 'beam' && beam.level === 0).length, 2);
});

test('bar note builder rejects invalid measure and note timing', () => {
  assert.throws(
    () => createBarNoteNotationPlan([], { durationQuarter: 0, width: 200 }),
    /positive duration/,
  );
  assert.throws(
    () => createBarNoteNotationPlan([{ startQuarter: 1, durationQuarter: 0.5 }], { durationQuarter: 1, width: 200 }),
    /start inside the bar/,
  );
  assert.throws(
    () => createBarNoteNotationPlan([{ startQuarter: 0, durationQuarter: 0, beamCount: 1 }], { durationQuarter: 1, width: 200 }),
    /positive duration/,
  );
});

test('note builder groups beams into the expected number of levels', () => {
  const cases = [
    ['quarter', 0],
    ['eighth', 1],
    ['triplet', 1],
    ['sixteenth', 2],
    ['thirtySecond', 7],
    ['sixtyFourth', 15],
  ] as const;

  for (const [subdivision, expectedBeamCount] of cases) {
    assert.equal(createNoteNotationPlan(subdivision).beams.length, expectedBeamCount, subdivision);
  }

  const sixteenths = createNoteNotationPlan('sixteenth');
  assert.equal(sixteenths.beams.filter((beam) => beam.key.startsWith('beam-0-')).length, 1);
  assert.equal(sixteenths.beams.filter((beam) => beam.key.startsWith('beam-1-')).length, 1);
  assert.ok(sixteenths.beams.every((beam) => beam.rotationDegrees < 0), 'beams should rise toward the right');
});

test('triplets include a visible group label and all display sizes keep their note geometry', () => {
  const fullTriplet = createNoteNotationPlan('triplet');
  assert.equal(fullTriplet.tupletLabels[0]?.text, '3');
  assert.equal(fullTriplet.tupletLabels[0]?.fontSize, 14);

  assert.equal(createNoteNotationPlan('triplet', 'compact').tupletLabels[0]?.fontSize, 12);
  assert.equal(createNoteNotationPlan('triplet', 'mini').tupletLabels[0]?.fontSize, 8);

  for (const subdivision of [
    'quarter', 'eighth', 'duplet', 'triplet', 'quadruplet', 'quintuplet', 'sextuplet',
    'septuplet', 'octuplet', 'nonuplet', 'sixteenth', 'thirtySecond', 'sixtyFourth',
  ] as const) {
    const full = createNoteNotationPlan(subdivision, 'full');
    const compact = createNoteNotationPlan(subdivision, 'compact');
    const mini = createNoteNotationPlan(subdivision, 'mini');
    assert.equal(compact.notes.length, full.notes.length, subdivision);
    assert.equal(mini.notes.length, full.notes.length, subdivision);
    assert.ok(compact.height < full.height, subdivision);
    assert.ok(mini.height < compact.height, subdivision);
  }
});

test('quintuplet preview uses two beams for the five notes in a quarter-note beat', () => {
  const quintuplet = createNoteNotationPlan('quintuplet', 'compact', '3/4');

  assert.equal(quintuplet.tupletLabels[0]?.text, '5');
  assert.ok(quintuplet.events.every((event) => event.beamCount === 2));
  assert.equal(quintuplet.beams.filter((beam) => beam.kind === 'beam' && beam.level === 0).length, 1);
  assert.equal(quintuplet.beams.filter((beam) => beam.kind === 'beam' && beam.level === 1).length, 2);
});

test('tuplet note groups span the selected meter pulse', () => {
  const dupletInCompound = createNoteNotationPlan('duplet', 'full', '6/8');
  const tripletInHalfTime = createNoteNotationPlan('triplet', 'full', '2/2');

  assert.equal(dupletInCompound.notes.length, 2);
  assert.equal(tripletInHalfTime.notes.length, 3);
  assert.ok(dupletInCompound.notes[1]!.left - dupletInCompound.notes[0]!.left > 20);
  assert.ok(tripletInHalfTime.notes[2]!.left - tripletInHalfTime.notes[0]!.left > 30);
});
