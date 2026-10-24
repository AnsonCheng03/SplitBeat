import { Dot, StaveNote, StaveTie, Stem } from 'vexflow';
import type { NoteNotationEvent } from '@/rhythm/noteNotation';

interface VexFlowRhythmNoteOptions {
  color: string;
  glyphScale: number;
  stemLength: number;
}

const DURATION_VALUES = [
  { duration: 'w', quarterNotes: 4, dots: 0 },
  { duration: 'h', quarterNotes: 2, dots: 0 },
  { duration: 'q', quarterNotes: 1, dots: 0 },
  { duration: '8', quarterNotes: 0.5, dots: 0 },
  { duration: '16', quarterNotes: 0.25, dots: 0 },
  { duration: '32', quarterNotes: 0.125, dots: 0 },
  { duration: '64', quarterNotes: 0.0625, dots: 0 },
  { duration: 'h', quarterNotes: 3, dots: 1 },
  { duration: 'q', quarterNotes: 1.5, dots: 1 },
  { duration: '8', quarterNotes: 0.75, dots: 1 },
  { duration: '16', quarterNotes: 0.375, dots: 1 },
  { duration: '32', quarterNotes: 0.1875, dots: 1 },
  { duration: '64', quarterNotes: 0.09375, dots: 1 },
] as const;

function vexFlowDuration(durationQuarter: number, beamCount: number) {
  const exact = DURATION_VALUES.find((value) => Math.abs(value.quarterNotes - durationQuarter) < 0.00001);
  if (exact) return { duration: exact.duration, dots: exact.dots };

  return {
    duration: beamCount === 0 ? 'q' : beamCount === 1 ? '8' : beamCount === 2 ? '16' : beamCount === 3 ? '32' : '64',
    dots: 0,
  };
}

/** Creates a rhythm note with VexFlow's engraved notehead, stem, flag, and dot glyphs. */
export function createVexFlowRhythmNote(
  event: NoteNotationEvent,
  { color, glyphScale, stemLength }: VexFlowRhythmNoteOptions,
): StaveNote {
  const value = vexFlowDuration(event.durationQuarter, event.beamCount ?? 0);
  const note = new StaveNote({
    keys: ['e/4'],
    duration: value.duration,
    dots: value.dots,
    clef: 'treble',
    stem_direction: Stem.UP,
    glyph_font_scale: glyphScale,
  });
  note.setStyle({ fillStyle: color, strokeStyle: color });
  note.setStemStyle({ fillStyle: color, strokeStyle: color });
  for (let dotIndex = 0; dotIndex < value.dots; dotIndex += 1) {
    Dot.buildAndAttach([note], { all: true });
  }
  if (note.hasStem()) note.setStemLength(stemLength);
  return note;
}

/** Creates full or bar-edge VexFlow ties between written segments. */
export function createVexFlowRhythmTies(
  notes: readonly StaveNote[],
  events: readonly NoteNotationEvent[],
): StaveTie[] {
  return notes.flatMap((note, index) => {
    const event = events[index];
    if (!event) return [];
    const nextTiedIndex = event.tieToNext
      ? events.findIndex((nextEvent, nextIndex) => nextIndex > index
        && nextEvent.tieFromPrevious
        && Math.abs(event.startQuarter + event.durationQuarter - nextEvent.startQuarter) < 0.00001)
      : -1;
    const previousTiedIndex = event.tieFromPrevious
      ? events.findIndex((previousEvent, previousIndex) => previousIndex < index
        && previousEvent.tieToNext
        && Math.abs(previousEvent.startQuarter + previousEvent.durationQuarter - event.startQuarter) < 0.00001)
      : -1;
    const ties: StaveTie[] = [];
    if (event.tieToNext) {
      ties.push(new StaveTie({
        first_note: note,
        ...(nextTiedIndex < 0 || !notes[nextTiedIndex] ? {} : { last_note: notes[nextTiedIndex] }),
      }));
    }
    if (event.tieFromPrevious && previousTiedIndex < 0) {
      ties.push(new StaveTie({ last_note: note }));
    }
    return ties;
  });
}
