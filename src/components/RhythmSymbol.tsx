import { NoteNotation } from '@/components/NoteNotation';
import { createNoteNotationPlan, type NoteNotationSize } from '@/rhythm/noteNotation';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import type { Subdivision, TimeSignature } from '@/types/rhythm';

interface RhythmSymbolProps {
  subdivision: Subdivision;
  color: string;
  compact?: boolean;
  mini?: boolean;
  timeSignature?: TimeSignature;
}

function notationSize(compact: boolean, mini: boolean): NoteNotationSize {
  if (mini) return 'mini';
  return compact ? 'compact' : 'full';
}

export function RhythmSymbol({ subdivision, color, compact = false, mini = false, timeSignature = '4/4' }: RhythmSymbolProps) {
  const plan = createNoteNotationPlan(subdivision, notationSize(compact, mini), timeSignature);

  return (
    <NoteNotation plan={plan} color={color} accessibilityLabel={SUBDIVISION_LABELS[subdivision]} />
  );
}
