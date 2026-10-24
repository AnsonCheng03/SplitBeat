import type { TimeSignature } from '@/types/rhythm';

export interface ScoreRhythmEvent {
  /** Note attack, measured in quarter notes from the start of its measure. */
  startQuarter: number;
  /** Notated duration, measured in quarter notes. */
  durationQuarter: number;
  /** MIDI pitches for the note or chord; omitted for unpitched score events. */
  midiPitches?: number[];
  /** Actual note count in the MusicXML tuplet group, when explicitly marked. */
  tupletNumber?: number;
  /** An explicit rest included in generated mixture notation. */
  isRest?: boolean;
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
