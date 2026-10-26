import { createBarNoteNotationPlan } from '@/rhythm/noteNotation';
import { centerScoreBeatEvents, scoreBeatEvents, scoreNotationEventsForSpan } from '@/rhythm/scoreStaff';
import type { NoteNotationPlan } from '@/rhythm/noteNotation';
import type { ScoreRhythmMeasure, ScoreRhythmEvent } from '@/types/importedScore';
import type { Hand } from '@/types/rhythm';

const TUPLET_LABELS: Record<number, string> = {
  2: 'Duplet (2)',
  3: 'Triplet (3)',
  4: 'Quadruplet (4)',
  5: 'Quintuplet (5)',
  6: 'Sextuplet (6)',
  7: 'Septuplet (7)',
  8: 'Octuplet (8)',
  9: 'Nonuplet (9)',
};

const DURATION_LABELS: readonly [number, string][] = [
  [4, 'whole'],
  [3, 'dotted half'],
  [2, 'half'],
  [1.5, 'dotted quarter'],
  [1, 'Quarter (Crotchet)'],
  [0.75, 'dotted eighth'],
  [0.5, 'Quaver (Eighth)'],
  [0.375, 'dotted sixteenth'],
  [0.25, 'Semiquaver (16th)'],
  [0.125, 'Demisemiquaver (32nd)'],
  [0.0625, 'Hemidemisemiquaver (64th)'],
];

function eventLabel(event: ScoreRhythmEvent): string {
  if (event.isRest || event.isCrossBarTieContinuation) return 'Rest';
  if (event.tupletNumber !== undefined) return TUPLET_LABELS[event.tupletNumber] ?? 'score note';
  const duration = event.notationDurationQuarter ?? event.durationQuarter;
  return DURATION_LABELS.find(([quarterNotes]) => Math.abs(duration - quarterNotes) < 0.00001)?.[1] ?? 'score note';
}

export function scoreBeatLabel(events: readonly ScoreRhythmEvent[], translate: (source: string) => string): string {
  const visibleEvents = events.filter((event) => !event.isRest && !event.isCrossBarTieContinuation);
  const counts = new Map<string, number>();
  visibleEvents.forEach((event) => {
    const label = eventLabel(event);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return [...counts].map(([label, count]) => `${translate(label)}${count > 1 ? ` ×${count}` : ''}`).join('  +  ');
}

export function createScoreBeatFocusModel({
  measure,
  nextMeasure,
  quarterInMeasure,
  beatDurationQuarter,
  hand,
  oneHand,
  compact,
  notationWidth,
  translate,
}: {
  measure: ScoreRhythmMeasure;
  nextMeasure?: ScoreRhythmMeasure;
  quarterInMeasure: number;
  beatDurationQuarter: number;
  hand: Hand;
  oneHand: boolean;
  compact: boolean;
  notationWidth: number;
  translate: (source: string) => string;
}): {
  plan: NoteNotationPlan | null;
  notationScale: 1.3 | 1.55;
  visualBeatLabel: string;
} {
  const events = scoreBeatEvents(measure, nextMeasure, quarterInMeasure, beatDurationQuarter, hand);
  const notationEvents = oneHand ? centerScoreBeatEvents(events, beatDurationQuarter) : events;
  const notes = scoreNotationEventsForSpan(notationEvents, beatDurationQuarter);
  const notationScale: 1.3 | 1.55 = compact ? 1.3 : 1.55;
  const plan = notes.length > 0 && notationWidth > 0
    ? createBarNoteNotationPlan(notes, {
      durationQuarter: beatDurationQuarter,
      width: notationWidth / notationScale,
      size: 'full',
      beamGroupQuarterNotes: beatDurationQuarter,
    })
    : null;
  return {
    plan,
    notationScale,
    visualBeatLabel: scoreBeatLabel(events, translate),
  };
}
