import { StaveNote, TickContext } from 'vexflow';

/** Places a VexFlow note by its center while registering it with its tick context. */
export function positionVexFlowNote(note: StaveNote, centerX: number): TickContext {
  const tickContext = new TickContext().addTickable(note).preFormat();

  // VexFlow adds the stave's note-start and padding offsets in getAbsoluteX().
  // Subtract them here so the rendered notehead, rather than the tick context,
  // lands at the requested center.
  tickContext.setX(0);
  tickContext.setX(centerX - note.getGlyphWidth() / 2 - note.getAbsoluteX());

  return tickContext;
}

/** Apply a measured top position after the note has been placed on its stave. */
export function alignVexFlowStemTop(note: StaveNote, topY: number): void {
  if (!Number.isFinite(topY)) throw new RangeError('A stem top must be finite.');
  if (!note.hasStem()) return;

  const stemBaseY = note.getStemExtents().baseY;
  note.setStemLength(stemBaseY - topY);
  note.getStem()?.setExtension(note.getStemExtension());
}
