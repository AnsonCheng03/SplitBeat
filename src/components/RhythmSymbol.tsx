import { NoteNotation } from '@/components/NoteNotation';
import { createNoteNotationPlan, type NoteNotationSize } from '@/rhythm/noteNotation';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import type { Subdivision } from '@/types/rhythm';

interface RhythmSymbolProps {
  subdivision: Subdivision;
  color: string;
  compact?: boolean;
  mini?: boolean;
}

function notationSize(compact: boolean, mini: boolean): NoteNotationSize {
  if (mini) return 'mini';
  return compact ? 'compact' : 'full';
}

export function RhythmSymbol({ subdivision, color, compact = false, mini = false }: RhythmSymbolProps) {
  const plan = createNoteNotationPlan(subdivision, notationSize(compact, mini));

  return (
    <NoteNotation plan={plan} color={color} accessibilityLabel={SUBDIVISION_LABELS[subdivision]} />
  );
}
