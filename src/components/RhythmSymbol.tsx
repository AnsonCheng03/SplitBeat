import { useMemo } from 'react';
import { View } from 'react-native';
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
  scale?: number;
}

function notationSize(compact: boolean, mini: boolean): NoteNotationSize {
  if (mini) return 'mini';
  return compact ? 'compact' : 'full';
}

export function RhythmSymbol({ subdivision, color, compact = false, mini = false, timeSignature = '4/4', scale = 1 }: RhythmSymbolProps) {
  const size = notationSize(compact, mini);
  const plan = useMemo(() => createNoteNotationPlan(subdivision, size, timeSignature), [size, subdivision, timeSignature]);

  const notation = <NoteNotation
    plan={plan}
    color={color}
    accessibilityLabel={SUBDIVISION_LABELS[subdivision]}
    useNativeGlyphs
  />;
  if (scale === 1) return notation;

  return (
    <View style={{ width: plan.width * scale, height: plan.height * scale, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: plan.width, height: plan.height, transform: [{ scale }] }}>
        {notation}
      </View>
    </View>
  );
}
