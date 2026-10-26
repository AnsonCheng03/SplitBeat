import { useMemo } from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { createNoteNotationPlan, fitNotationScale, type NoteNotationSize } from '@/rhythm/noteNotation';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import type { Subdivision, TimeSignature } from '@/types/rhythm';

interface RhythmSymbolProps {
  subdivision: Subdivision;
  color: string;
  compact?: boolean;
  mini?: boolean;
  timeSignature?: TimeSignature;
  scale?: number;
  maxWidth?: number;
  maxHeight?: number;
  /** Common visual span for paired hands whose patterns contain different note counts. */
  groupWidth?: number;
  rest?: boolean;
  readyTestID?: string;
}

function notationSize(compact: boolean, mini: boolean): NoteNotationSize {
  if (mini) return 'mini';
  return compact ? 'compact' : 'full';
}

export function RhythmSymbol({ subdivision, color, compact = false, mini = false, timeSignature = '4/4', scale = 1, maxWidth, maxHeight, groupWidth, rest = false, readyTestID }: RhythmSymbolProps) {
  const { t } = useI18n();
  const size = notationSize(compact, mini);
  const plan = useMemo(() => createNoteNotationPlan(subdivision, size, timeSignature, groupWidth), [groupWidth, size, subdivision, timeSignature]);
  const fittedScale = fitNotationScale(plan.width, plan.height, scale, maxWidth, maxHeight);
  const notation = <NoteNotation
    plan={plan}
    color={color}
    accessibilityLabel={rest
      ? t('{note} rest', { note: t(SUBDIVISION_LABELS[subdivision]) })
      : t(SUBDIVISION_LABELS[subdivision])}
    readyTestID={readyTestID}
    restSymbol={rest}
    centerVisualContent
  />;
  if (fittedScale === 1) return notation;

  return (
    <View style={{ width: plan.width * fittedScale, height: plan.height * fittedScale, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: plan.width, height: plan.height, transform: [{ scale: fittedScale }] }}>
        {notation}
      </View>
    </View>
  );
}
