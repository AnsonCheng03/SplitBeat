import { StaveNote, TickContext } from 'vexflow';

/** Places a VexFlow note by its center while registering it with its tick context. */
export function positionVexFlowNote(note: StaveNote, centerX: number): TickContext {
  return new TickContext()
    .addTickable(note)
    .preFormat()
    .setX(centerX - note.getGlyphWidth() / 2);
}
