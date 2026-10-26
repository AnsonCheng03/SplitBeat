import { useMemo } from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { createRhythmSymbolNotationModel } from '@/rhythm/rhythmSymbolNotation';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import type { Subdivision, TimeSignature } from '@/types/rhythm';
import { RhythmSymbolStyle1, RhythmSymbolStyle2 } from '@/styles/notation';

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

export function RhythmSymbol({ subdivision, color, compact = false, mini = false, timeSignature = '4/4', scale = 1, maxWidth, maxHeight, groupWidth, rest = false, readyTestID }: RhythmSymbolProps) {
  const { t } = useI18n();
  const { plan, fittedScale } = useMemo(() => createRhythmSymbolNotationModel({
    subdivision,
    compact,
    mini,
    timeSignature,
    scale,
    maxWidth,
    maxHeight,
    groupWidth,
  }), [compact, groupWidth, maxHeight, maxWidth, mini, scale, subdivision, timeSignature]);
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
    <View style={RhythmSymbolStyle1({ plan, fittedScale })}>
      <View style={RhythmSymbolStyle2({ plan, fittedScale })}>
        {notation}
      </View>
    </View>
  );
}
