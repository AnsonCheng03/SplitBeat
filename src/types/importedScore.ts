import type { TimeSignature } from '@/types/rhythm';

export interface ScoreRhythmEvent {
  /** Note attack, measured in quarter notes from the start of its measure. */
  startQuarter: number;
  /** Played duration, measured in quarter notes. For tied notes this spans all tied segments. */
  durationQuarter: number;
  /** Duration of this written segment when the played duration spans multiple tied notes. */
  notationDurationQuarter?: number;
  /** MIDI pitches for the note or chord; omitted for unpitched score events. */
  midiPitches?: number[];
  /** Actual note count in the MusicXML tuplet group, when explicitly marked. */
  tupletNumber?: number;
  /** An explicit rest included in generated mixture notation. */
  isRest?: boolean;
  /** This written segment is connected to the following segment by a tie. */
  tieToNext?: boolean;
  /** This written segment is connected to the preceding segment by a tie. */
  tieFromPrevious?: boolean;
  /** Display-only continuation segment; the tie's initial segment is the scored attack. */
  isTieContinuation?: boolean;
  /** Continuation starts in a later bar and is shown as a rest in single-note view. */
  isCrossBarTieContinuation?: boolean;
}

export interface ScoreRhythmMeasure {
  index: number;
  startQuarter: number;
  durationQuarter: number;
  leftEvents: ScoreRhythmEvent[];
  rightEvents: ScoreRhythmEvent[];
}

/** Rhythm events and hidden playback pitches parsed from a partwise MusicXML file. */
export interface ImportedRhythmScore {
  formatVersion: 1;
  title: string;
  timeSignature: TimeSignature;
  /** Number of musical tracks represented by this score, limited to one or two. */
  trackCount: 1 | 2;
  /** Tempo in the app's metrical beat unit. */
  bpm: number | null;
  measures: ScoreRhythmMeasure[];
  totalQuarterNotes: number;
  warnings: string[];
}
