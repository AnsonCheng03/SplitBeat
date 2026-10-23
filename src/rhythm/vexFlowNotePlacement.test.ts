/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Stave, StaveNote, Stem } from 'vexflow';
import { positionVexFlowNote } from '@/rhythm/vexFlowNotePlacement';

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
