/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createNoteNotationPlan } from '@/rhythm/noteNotation';

test('note builder creates joined noteheads and stems at each supported subdivision', () => {
  const cases = [
    ['quarter', 1],
    ['eighth', 2],
    ['triplet', 3],
    ['sixteenth', 4],
    ['thirtySecond', 8],
    ['sixtyFourth', 16],
  ] as const;

  for (const [subdivision, expectedCount] of cases) {
    const plan = createNoteNotationPlan(subdivision);
    assert.equal(plan.notes.length, expectedCount, subdivision);
    const slotWidth = plan.width / expectedCount;

    for (const [index, note] of plan.notes.entries()) {
      assert.equal(note.left, index * slotWidth, `${subdivision} note spacing`);
      assert.ok(note.headWidth > note.headHeight, `${subdivision} notehead should be oval`);
      assert.ok(note.stemTop < note.headTop, `${subdivision} stem should extend above the notehead`);
      assert.ok(note.stemLeft < note.headLeft + note.headWidth, `${subdivision} stem should join the notehead`);
      assert.ok(note.stemLeft + note.stemWidth > note.headLeft, `${subdivision} stem should overlap the notehead`);
    }
  }
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
  assert.equal(fullTriplet.tripletLabel?.fontSize, 14);

  assert.equal(createNoteNotationPlan('triplet', 'compact').tripletLabel?.fontSize, 12);
  assert.equal(createNoteNotationPlan('triplet', 'mini').tripletLabel?.fontSize, 8);

  for (const subdivision of ['quarter', 'eighth', 'triplet', 'sixteenth', 'thirtySecond', 'sixtyFourth'] as const) {
    const full = createNoteNotationPlan(subdivision, 'full');
    const compact = createNoteNotationPlan(subdivision, 'compact');
    const mini = createNoteNotationPlan(subdivision, 'mini');
    assert.equal(compact.notes.length, full.notes.length, subdivision);
    assert.equal(mini.notes.length, full.notes.length, subdivision);
    assert.ok(compact.height < full.height, subdivision);
    assert.ok(mini.height < compact.height, subdivision);
  }
});
