import { createNoteNotationPlan, fitNotationScale } from '@/rhythm/noteNotation';
import type { NoteNotationPlan, NoteNotationSize } from '@/rhythm/noteNotation';
import type { Subdivision, TimeSignature } from '@/types/rhythm';

export function rhythmNotationSize(compact: boolean, mini: boolean): NoteNotationSize {
  if (mini) return 'mini';
  return compact ? 'compact' : 'full';
}

export function createRhythmSymbolNotationModel({
  subdivision,
  compact,
  mini,
  timeSignature,
  scale,
  maxWidth,
  maxHeight,
  groupWidth,
}: {
  subdivision: Subdivision;
  compact: boolean;
  mini: boolean;
  timeSignature: TimeSignature;
  scale: number;
  maxWidth?: number;
  maxHeight?: number;
  groupWidth?: number;
}): { plan: NoteNotationPlan; fittedScale: number } {
  const size = rhythmNotationSize(compact, mini);
  const plan = createNoteNotationPlan(subdivision, size, timeSignature, groupWidth);
  const fittedScale = fitNotationScale(plan.width, plan.height, scale, maxWidth, maxHeight);
  return { plan, fittedScale };
}
