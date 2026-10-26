import { createBarNoteNotationPlan } from '@/rhythm/noteNotation';
import type { NoteNotationPlan } from '@/rhythm/noteNotation';
import type { ScoreRhythmEvent } from '@/types/importedScore';

export function createScoreFocusNotePlan(event: ScoreRhythmEvent | undefined, width: number): NoteNotationPlan | null {
  if (!event || width <= 0) return null;
  const notationDurationQuarter = event.notationDurationQuarter ?? event.durationQuarter;
  const durationQuarter = Math.max(2, notationDurationQuarter * 2);
  return createBarNoteNotationPlan([{
    startQuarter: (durationQuarter - notationDurationQuarter) / 2,
    durationQuarter: notationDurationQuarter,
    tupletNumber: event.tupletNumber,
    ...(event.isRest || event.isCrossBarTieContinuation ? { isRest: true } : {}),
  }], {
    durationQuarter,
    width,
    size: 'full',
  });
}
