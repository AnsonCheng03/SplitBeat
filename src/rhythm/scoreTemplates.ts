import type { ImportedRhythmScore, ScoreRhythmEvent } from '@/types/importedScore';

interface TemplateNote {
  pitches: number[];
  durationQuarter: number;
}

export interface ScoreTemplate {
  id: string;
  title: string;
  subtitle: string;
  score: ImportedRhythmScore;
}

function trackEvents(bars: readonly (readonly TemplateNote[])[]): ScoreRhythmEvent[][] {
  return bars.map((bar) => {
    let startQuarter = 0;
    return bar.map((note) => {
      const event = {
        startQuarter,
        durationQuarter: note.durationQuarter,
        midiPitches: [...note.pitches],
      };
      startQuarter += note.durationQuarter;
      return event;
    });
  });
}

function note(pitch: number, durationQuarter = 1): TemplateNote {
  return { pitches: [pitch], durationQuarter };
}

function chord(pitches: number[], durationQuarter: number): TemplateNote {
  return { pitches, durationQuarter };
}

function makeTemplateScore(
  title: string,
  bpm: number,
  trackCount: 1 | 2,
  rightBars: readonly (readonly TemplateNote[])[],
  leftBars: readonly (readonly TemplateNote[])[] = [],
): ImportedRhythmScore {
  const measureCount = Math.max(rightBars.length, leftBars.length);
  const rightEvents = trackEvents(rightBars);
  const leftEvents = trackEvents(leftBars);
  const measures = Array.from({ length: measureCount }, (_, index) => ({
    index,
    startQuarter: index * 4,
    durationQuarter: 4,
    rightEvents: rightEvents[index] ?? [],
    leftEvents: leftEvents[index] ?? [],
  }));
  return {
    formatVersion: 1,
    title,
    timeSignature: '4/4',
    trackCount,
    bpm,
    measures,
    totalQuarterNotes: measureCount * 4,
    warnings: [],
  };
}

export const SCORE_TEMPLATES: readonly ScoreTemplate[] = [
  {
    id: 'jingle-bells-easy-duet',
    title: 'Jingle Bells',
    subtitle: 'Easy duet · two hands · 4/4',
    score: makeTemplateScore(
      'Jingle Bells · Easy Duet',
      100,
      2,
      [
        [note(76), note(76), note(76, 2)],
        [note(76), note(76), note(76, 2)],
        [note(76), note(79), note(72), note(74)],
        [note(76, 4)],
        [note(77), note(77), note(77), note(77)],
        [note(77), note(76), note(76), note(76)],
        [note(76), note(74), note(74), note(76)],
        [note(74, 2), note(67, 2)],
      ],
      [
        [chord([48, 55], 2), chord([48, 55], 2)],
        [chord([43, 50], 2), chord([43, 50], 2)],
        [chord([48, 55], 2), chord([48, 55], 2)],
        [chord([43, 50], 2), chord([43, 50], 2)],
        [chord([41, 48], 2), chord([41, 48], 2)],
        [chord([41, 48], 2), chord([41, 48], 2)],
        [chord([43, 50], 2), chord([43, 50], 2)],
        [chord([48, 55], 2), chord([48, 55], 2)],
      ],
    ),
  },
  {
    id: 'ode-to-joy-one-hand',
    title: 'Ode to Joy',
    subtitle: 'Steady melody · one hand · 4/4',
    score: makeTemplateScore(
      'Ode to Joy · Melody',
      90,
      1,
      [
        [note(66), note(66), note(67), note(69)],
        [note(69), note(67), note(66), note(64)],
        [note(62), note(62), note(64), note(66)],
        [note(66), note(64), note(64, 2)],
        [note(66), note(66), note(67), note(69)],
        [note(69), note(67), note(66), note(64)],
        [note(62), note(62), note(64), note(66)],
        [note(64), note(62), note(62, 2)],
      ],
    ),
  },
  {
    id: 'twinkle-twinkle-two-hands',
    title: 'Twinkle, Twinkle',
    subtitle: 'Simple melody and pulse · two hands · 4/4',
    score: makeTemplateScore(
      'Twinkle, Twinkle · Easy Duet',
      88,
      2,
      [
        [note(60), note(60), note(67), note(67)],
        [note(69), note(69), note(67, 2)],
        [note(65), note(65), note(64), note(64)],
        [note(62), note(62), note(60, 2)],
        [note(67), note(67), note(65), note(65)],
        [note(64), note(64), note(62, 2)],
        [note(67), note(67), note(65), note(65)],
        [note(64), note(64), note(62, 2)],
        [note(60), note(60), note(67), note(67)],
        [note(69), note(69), note(67, 2)],
        [note(65), note(65), note(64), note(64)],
        [note(62), note(62), note(60, 2)],
      ],
      Array.from({ length: 12 }, (_, index) => {
        const bass = [48, 43, 41, 43][index % 4]!;
        return [chord([bass, bass + 7], 2), chord([bass, bass + 7], 2)];
      }),
    ),
  },
];
