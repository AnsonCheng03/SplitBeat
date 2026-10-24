import type { ImportedRhythmScore, ScoreRhythmEvent } from '@/types/importedScore';
import type { TimeSignature } from '@/types/rhythm';

interface TemplateNote {
  pitches: number[];
  durationQuarter: number;
}

export interface ScoreTemplate {
  id: string;
  title: string;
  subtitle: string;
  category: ScoreTemplateCategory;
  tags: readonly ScoreTemplateTag[];
  score: ImportedRhythmScore;
}

export const SCORE_TEMPLATE_CATEGORIES = ['Pop', 'Classical', 'Traditional'] as const;
export type ScoreTemplateCategory = (typeof SCORE_TEMPLATE_CATEGORIES)[number];

export const SCORE_TEMPLATE_TAGS = [
  'Easy',
  'Difficult',
  'One hand',
  'Both hands',
  'Holiday',
  'Melody',
  'Duet',
  'Syncopation',
  'Original',
] as const;
export type ScoreTemplateTag = (typeof SCORE_TEMPLATE_TAGS)[number];

export interface ScoreTemplateFilters {
  category?: ScoreTemplateCategory | 'All';
  tags?: readonly ScoreTemplateTag[];
}

export function filterScoreTemplates(
  templates: readonly ScoreTemplate[],
  filters: ScoreTemplateFilters = {},
): ScoreTemplate[] {
  return templates.filter((template) => {
    if (filters.category && filters.category !== 'All' && template.category !== filters.category) return false;
    return (filters.tags ?? []).every((tag) => template.tags.includes(tag));
  });
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
  timeSignature: TimeSignature = '4/4',
): ImportedRhythmScore {
  const measureCount = Math.max(rightBars.length, leftBars.length);
  const rightEvents = trackEvents(rightBars);
  const leftEvents = trackEvents(leftBars);
  const [beats, denominator] = timeSignature.split('/').map(Number);
  const measureDurationQuarter = (beats! * 4) / denominator!;
  const measures = Array.from({ length: measureCount }, (_, index) => ({
    index,
    startQuarter: index * measureDurationQuarter,
    durationQuarter: measureDurationQuarter,
    rightEvents: rightEvents[index] ?? [],
    leftEvents: leftEvents[index] ?? [],
  }));
  return {
    formatVersion: 1,
    title,
    timeSignature,
    trackCount,
    bpm,
    measures,
    totalQuarterNotes: measureCount * measureDurationQuarter,
    warnings: [],
  };
}

export const SCORE_TEMPLATES: readonly ScoreTemplate[] = [
  {
    id: 'jingle-bells-easy-duet',
    title: 'Jingle Bells',
    subtitle: 'A familiar holiday melody arranged for two hands.',
    category: 'Traditional',
    tags: ['Easy', 'Both hands', 'Holiday', 'Duet'],
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
    subtitle: 'A steady single-hand line from Beethoven’s theme.',
    category: 'Classical',
    tags: ['Easy', 'One hand', 'Melody'],
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
    subtitle: 'A calm melody paired with a simple bass pulse.',
    category: 'Traditional',
    tags: ['Easy', 'Both hands', 'Melody'],
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
  {
    id: 'pop-groove-difficult-duet',
    title: 'Pop Groove',
    subtitle: 'An original syncopated groove with interlocking hands.',
    category: 'Pop',
    tags: ['Difficult', 'Both hands', 'Syncopation', 'Original'],
    score: makeTemplateScore(
      'Pop Groove',
      96,
      2,
      [
        [note(72, 0.75), note(76, 0.25), note(79, 0.5), note(76, 0.75), note(74, 0.25), note(76, 1), note(72, 0.5)],
        [note(74, 0.5), note(77, 0.75), note(76, 0.25), note(72, 0.5), note(74, 0.75), note(76, 0.25), note(79, 1)],
        [note(79, 0.75), note(76, 0.25), note(74, 0.5), note(76, 0.75), note(72, 0.25), note(71, 1), note(72, 0.5)],
        [note(76, 0.5), note(74, 0.75), note(72, 0.25), note(71, 0.5), note(72, 0.75), note(74, 0.25), note(72, 1)],
      ],
      [
        [chord([48, 55], 1), chord([55, 60], 1), chord([43, 50], 1), chord([55, 62], 1)],
        [chord([45, 52], 1), chord([52, 57], 1), chord([41, 48], 1), chord([52, 59], 1)],
        [chord([41, 48], 1), chord([48, 53], 1), chord([45, 52], 1), chord([48, 55], 1)],
        [chord([43, 50], 1), chord([50, 55], 1), chord([48, 55], 1), chord([50, 57], 1)],
      ],
    ),
  },
  {
    id: 'fur-elise-difficult-one-hand',
    title: 'Für Elise',
    subtitle: 'A quick repeated-note motif in its original 3/8 meter.',
    category: 'Classical',
    tags: ['Difficult', 'One hand', 'Melody'],
    score: makeTemplateScore(
      'Für Elise',
      92,
      1,
      [
        [note(76, 0.5), note(75, 0.5), note(76, 0.5)],
        [note(75, 0.5), note(76, 0.5), note(71, 0.5)],
        [note(74, 0.5), note(72, 0.5), note(69, 0.5)],
        [note(69, 0.5), note(71, 0.5), note(72, 0.5)],
        [note(71, 0.5), note(72, 0.5), note(74, 0.5)],
        [note(71, 0.5), note(72, 0.5), note(74, 0.5)],
        [note(72, 0.5), note(71, 0.5), note(72, 0.5)],
        [note(76, 0.5), note(75, 0.5), note(76, 0.5)],
      ],
      [],
      '3/8',
    ),
  },
];
