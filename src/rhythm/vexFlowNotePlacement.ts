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
