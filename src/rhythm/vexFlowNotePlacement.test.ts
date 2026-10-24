/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Dot, Stave, StaveNote, Stem } from 'vexflow';
import { createBarNoteNotationPlan } from '@/rhythm/noteNotation';
import { positionVexFlowNote } from '@/rhythm/vexFlowNotePlacement';
import { createVexFlowRhythmNote } from '@/rhythm/vexFlowRhythmNote';

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
