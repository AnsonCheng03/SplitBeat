import {
  createBarNoteNotationPlan,
  createSharedBarNoteAnchorInsets,
} from '@/rhythm/noteNotation';
import type { NoteNotationPlan, NoteNotationSize } from '@/rhythm/noteNotation';
import { scoreNotationEventsForSpan } from '@/rhythm/scoreStaff';
import type { ScoreRhythmEvent } from '@/types/importedScore';

export function scoreLaneHeight(size: NoteNotationSize): number {
  return size === 'compact' ? 48 : 60;
}

export function createScoreRhythmLaneModel({
  events,
  alignmentEventGroups,
  durationQuarter,
  width,
  size,
  beamGroupQuarterNotes,
}: {
  events: readonly ScoreRhythmEvent[];
  alignmentEventGroups?: readonly (readonly ScoreRhythmEvent[])[];
  durationQuarter: number;
  width: number;
  size: NoteNotationSize;
  beamGroupQuarterNotes: number;
}): {
  plan: NoteNotationPlan | null;
  noteCount: number;
  restCount: number;
} {
  const notationEvents = scoreNotationEventsForSpan(events, durationQuarter);
  const alignedNotationEventGroups = alignmentEventGroups?.map((group) => scoreNotationEventsForSpan(group, durationQuarter))
    ?? [notationEvents];
  const anchorInsets = width > 0
    ? createSharedBarNoteAnchorInsets(alignedNotationEventGroups, { durationQuarter, width, size })
    : undefined;
  const noteCount = events.filter((event) => !event.isRest).length;
  const restCount = events.length === 0 ? 1 : events.filter((event) => event.isRest).length;
  const plan = width > 0
    ? createBarNoteNotationPlan(notationEvents, {
      durationQuarter,
      width,
      size,
      beamGroupQuarterNotes,
      anchorInsets,
    })
    : null;
  return { plan, noteCount, restCount };
}
