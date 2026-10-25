/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Beam, Dot, Stave, StaveNote, Stem } from 'vexflow';
import { createBarNoteNotationPlan, createNoteNotationPlan } from '@/rhythm/noteNotation';
import { alignVexFlowStemTop, positionVexFlowNote } from '@/rhythm/vexFlowNotePlacement';
import { createVexFlowRhythmNote, createVexFlowRhythmTies } from '@/rhythm/vexFlowRhythmNote';

test('VexFlow note placement registers each note and centers its glyph', () => {
  const tripletCenters = [12, 36, 60] as const;
  const cases = [
    ['q', 12],
    ...tripletCenters.map((centerX) => ['8', centerX] as const),
    ['16', 84],
  ] as const;

  for (const [duration, centerX] of cases) {
    const note = new StaveNote({
      keys: ['e/4'],
      duration,
      stem_direction: Stem.UP,
      glyph_font_scale: 18,
    });
    note.setStave(new Stave(0, 50, 110));

    const tickContext = positionVexFlowNote(note, centerX);

    assert.ok(tickContext.getTickables().includes(note), `${duration} note is registered for rendering`);
    assert.equal(note.getTickContext(), tickContext, `${duration} note keeps its tick context`);
    assert.ok(
      Math.abs(note.getNoteHeadBeginX() + note.getGlyphWidth() / 2 - centerX) < 0.001,
      `${duration} rendered notehead is centered`,
    );
  }
});

test('VexFlow noteheads stay on the intended baseline inside the notation viewport', () => {
  const noteCenterY = 39;
  const lineSpacing = 6;
  const note = createVexFlowRhythmNote(
    { startQuarter: 0, durationQuarter: 0.5 },
    { color: '#07866C', glyphScale: 24, stemLength: 24 },
  );
  note.setStave(new Stave(0, noteCenterY - lineSpacing * 4, 100, {
    spacing_between_lines_px: lineSpacing,
    space_above_staff_ln: 0,
    space_below_staff_ln: 0,
    line_config: Array.from({ length: 5 }, () => ({ visible: false })),
  }));

  assert.equal(note.noteHeads[0]?.getY(), noteCenterY);
  assert.ok((note.noteHeads[0]?.getY() ?? Infinity) < 44, 'notehead stays inside the 44px notation viewport');
});

test('VexFlow stem tops align across every picker note value and beam count', () => {
  const subdivisions = [
    'quarter', 'eighth', 'duplet', 'triplet', 'quadruplet', 'quintuplet', 'sextuplet',
    'septuplet', 'octuplet', 'nonuplet', 'sixteenth', 'thirtySecond', 'sixtyFourth',
  ] as const;
  const expectedStemTop = 12.5;

  for (const subdivision of subdivisions) {
    const plan = createNoteNotationPlan(subdivision, 'compact', '4/4', 52);
    const noteCenterY = plan.noteBaselineY ?? plan.height - 7;
    const stave = new Stave(0, noteCenterY - 24, plan.width, {
      spacing_between_lines_px: 6,
      line_config: Array.from({ length: 5 }, () => ({ visible: false })),
    });
    const glyphScale = Math.max(8, Math.min(56, (plan.notes[0]?.headWidth ?? 8) / 0.306));
    const notes = plan.events.map((event, index) => {
      const shape = plan.notes[index];
      assert.ok(shape, `${subdivision} note ${index + 1} has geometry`);
      const note = createVexFlowRhythmNote(event, {
        color: '#ffffff',
        glyphScale,
        stemLength: noteCenterY - shape.stemTop,
      });
      note.setStave(stave);
      positionVexFlowNote(note, shape.left + shape.headWidth / 2);
      return note;
    });
    const beams = plan.beams
      .filter((shape) => shape.kind === 'beam' && shape.level === 0)
      .flatMap((shape) => {
        const beamNotes = notes.slice(shape.startIndex, shape.endIndex + 1)
          .filter((note, index) => !plan.events[shape.startIndex + index]?.isRest);
        if (beamNotes.length < 2) return [];
        const beam = new Beam(beamNotes, false);
        beam.render_options.beam_width = plan.beamThickness;
        beam.render_options.flat_beams = true;
        beam.render_options.flat_beam_offset = plan.notes[shape.startIndex]?.stemTop ?? expectedStemTop;
        return [beam];
      });

    notes.forEach((note, index) => {
      const shape = plan.notes[index];
      assert.ok(shape);
      alignVexFlowStemTop(note, shape.stemTop);
    });
    beams.forEach((beam) => beam.postFormat());

    notes.forEach((note, index) => {
      const actualStemTop = note.getStemExtents().topY;
      assert.ok(
        Math.abs(actualStemTop - expectedStemTop) < 0.01,
        `${subdivision} note ${index + 1} stem begins at ${actualStemTop}, expected ${expectedStemTop}`,
      );
    });
  }
});

test('VexFlow keeps mixed bar noteheads inside the viewport, including the final flagged note', () => {
  const events = [
    { startQuarter: 0, durationQuarter: 0.75 },
    { startQuarter: 0.75, durationQuarter: 0.125 },
    { startQuarter: 0.875, durationQuarter: 0.125 },
    { startQuarter: 3.875, durationQuarter: 0.125 },
  ];

  for (const width of [96, 240, 640]) {
    const plan = createBarNoteNotationPlan(events, { durationQuarter: 4, width, size: 'compact' });
    const stave = new Stave(0, 0, width);
    const glyphScale = Math.max(12, Math.min(56, (plan.notes[0]?.headWidth ?? 8) / 0.306));

    plan.events.forEach((event, index) => {
      const shape = plan.notes[index];
      assert.ok(shape, `note ${index + 1} has layout geometry`);
      const note = createVexFlowRhythmNote(event, { color: '#ffffff', glyphScale, stemLength: 20 });
      note.setStave(stave);
      positionVexFlowNote(note, shape.left + shape.headWidth / 2);

      const renderedHeadLeft = note.getNoteHeadBeginX();
      const renderedHeadRight = renderedHeadLeft + note.getGlyphWidth();
      assert.ok(renderedHeadLeft >= 0, `note ${index + 1} head begins inside ${width}px bar`);
      assert.ok(renderedHeadRight <= width, `note ${index + 1} head ends inside ${width}px bar`);

      const dot = Dot.getDots(note)[0];
      if (dot) {
        const renderedDotRight = note.getAbsoluteX() + dot.getXShift() + dot.getWidth();
        assert.ok(renderedDotRight <= width, `note ${index + 1} dot ends inside ${width}px bar`);
      }
    });
  }
});

test('VexFlow rhythm-note factory engraves dotted and tuplet values through the note library', () => {
  const dottedEighth = createVexFlowRhythmNote(
    { startQuarter: 0, durationQuarter: 0.75, beamCount: 1 },
    { color: '#ffffff', glyphScale: 24, stemLength: 20 },
  );
  const tripletEighth = createVexFlowRhythmNote(
    { startQuarter: 0, durationQuarter: 1 / 3, beamCount: 1, tupletNumber: 3 },
    { color: '#ffffff', glyphScale: 24, stemLength: 20 },
  );

  assert.equal(Dot.getDots(dottedEighth).length, 1);
  assert.equal(Dot.getDots(tripletEighth).length, 0);
  assert.ok(dottedEighth.hasStem());
  assert.ok(tripletEighth.hasStem());
});

test('VexFlow rhythm-note factory engraves rests with rest glyphs instead of text labels', () => {
  const restDurations = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.375, 0.25, 0.1875, 0.125, 0.09375, 0.0625];
  for (const durationQuarter of restDurations) {
    const rest = createVexFlowRhythmNote(
      { startQuarter: 0, durationQuarter },
      { color: '#ffffff', glyphScale: 24, stemLength: 20, rest: true },
    );
    rest.setStave(new Stave(0, 10, 45, {
      spacing_between_lines_px: 3,
      line_config: Array.from({ length: 5 }, () => ({ visible: false })),
    }));
    positionVexFlowNote(rest, 22.5);

    assert.equal(rest.isRest(), true, `${durationQuarter}-quarter value uses a rest glyph`);
    assert.equal(rest.hasStem(), false, `${durationQuarter}-quarter rest has no note stem`);
    assert.equal(rest.getYs().length, 1, `${durationQuarter}-quarter rest has one valid staff position`);
    assert.ok(Number.isFinite(rest.getYs()[0]), `${durationQuarter}-quarter rest has a finite position`);
    assert.ok(
      Math.abs(rest.getNoteHeadBeginX() + rest.getGlyphWidth() / 2 - 22.5) < 0.001,
      `${durationQuarter}-quarter rest glyph is centered`,
    );
    if (durationQuarter === 0.75) assert.equal(Dot.getDots(rest).length, 1);
  }
});

test('VexFlow creates full ties and partial ties at bar edges', () => {
  const first = createVexFlowRhythmNote(
    { startQuarter: 0, durationQuarter: 0.5, tieToNext: true },
    { color: '#ffffff', glyphScale: 24, stemLength: 20 },
  );
  const second = createVexFlowRhythmNote(
    { startQuarter: 0.5, durationQuarter: 0.5, tieFromPrevious: true },
    { color: '#ffffff', glyphScale: 24, stemLength: 20 },
  );
  const fullTie = createVexFlowRhythmTies([first, second], [
    { startQuarter: 0, durationQuarter: 0.5, tieToNext: true },
    { startQuarter: 0.5, durationQuarter: 0.5, tieFromPrevious: true },
  ]);
  assert.equal(fullTie.length, 1);
  assert.equal(fullTie[0]!.getNotes().first_note, first);
  assert.equal(fullTie[0]!.getNotes().last_note, second);
  assert.equal(fullTie[0]!.isPartial(), false);

  const outgoing = createVexFlowRhythmTies([first], [
    { startQuarter: 3.5, durationQuarter: 0.5, tieToNext: true },
  ]);
  const incoming = createVexFlowRhythmTies([second], [
    { startQuarter: 0, durationQuarter: 0.5, tieFromPrevious: true },
  ]);
  assert.equal(outgoing.length, 1);
  assert.equal(outgoing[0]!.getNotes().first_note, first);
  assert.equal(outgoing[0]!.getNotes().last_note, undefined);
  assert.equal(incoming.length, 1);
  assert.equal(incoming[0]!.getNotes().first_note, undefined);
  assert.equal(incoming[0]!.getNotes().last_note, second);
});
