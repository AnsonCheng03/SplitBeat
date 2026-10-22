import type { TimeSignature } from '@/types/rhythm';

export interface ScoreRhythmEvent {
  /** Note attack, measured in quarter notes from the start of its measure. */
  startQuarter: number;
  /** Notated duration, measured in quarter notes. */
  durationQuarter: number;
  /** Actual note count in the MusicXML tuplet group, when explicitly marked. */
  tupletNumber?: number;
}

export interface ScoreRhythmMeasure {
  index: number;
  startQuarter: number;
  durationQuarter: number;
  leftEvents: ScoreRhythmEvent[];
  rightEvents: ScoreRhythmEvent[];
}

/** Rhythm-only score data produced from a partwise MusicXML file. */
export interface ImportedRhythmScore {
  formatVersion: 1;
  title: string;
  timeSignature: TimeSignature;
  /** Tempo in the app's metrical beat unit. */
  bpm: number | null;
  measures: ScoreRhythmMeasure[];
  totalQuarterNotes: number;
  warnings: string[];
}
