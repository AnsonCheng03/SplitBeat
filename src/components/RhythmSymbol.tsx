import { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
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
  rest?: boolean;
}

function notationSize(compact: boolean, mini: boolean): NoteNotationSize {
  if (mini) return 'mini';
  return compact ? 'compact' : 'full';
}

export function RhythmSymbol({ subdivision, color, compact = false, mini = false, timeSignature = '4/4', scale = 1, rest = false }: RhythmSymbolProps) {
  const { t } = useI18n();
  const size = notationSize(compact, mini);
  const plan = useMemo(() => createNoteNotationPlan(subdivision, size, timeSignature), [size, subdivision, timeSignature]);

  if (rest) {
    return (
      <View style={{ width: Math.max(plan.width, compact ? 44 : 58) * scale, height: plan.height * scale, alignItems: 'center', justifyContent: 'center' }}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={{ color, fontSize: (mini ? 8 : compact ? 10 : 15) * scale, fontWeight: '900', letterSpacing: mini ? 0.7 : 1.8, textAlign: 'center' }}>
          REST
        </Text>
      </View>
    );
  }

  const notation = <NoteNotation
    plan={plan}
    color={color}
    accessibilityLabel={t(SUBDIVISION_LABELS[subdivision])}
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
