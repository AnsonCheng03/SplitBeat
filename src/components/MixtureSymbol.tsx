import { useMemo } from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { createMixtureSymbolNotationModel } from '@/rhythm/mixtureNotation';
import type { MixturePatternId } from '@/types/rhythm';
import { MixtureSymbolStyle1, MixtureSymbolStyle2 } from '@/styles/notation';

export function MixtureSymbol({
  mixtureId,
  color,
  compact = false,
  mini = false,
  scale = 1,
  maxWidth,
  maxHeight,
  groupWidth,
  accessibilityLabel,
  readyTestID,
}: {
  mixtureId: MixturePatternId;
  color: string;
  compact?: boolean;
  mini?: boolean;
  scale?: number;
  maxWidth?: number;
  maxHeight?: number;
  /** Common visual span used when aligning this hand with the other hand. */
  groupWidth?: number;
  accessibilityLabel?: string;
  readyTestID?: string;
}) {
  const { t } = useI18n();
  const { pattern, plan, fittedScale } = useMemo(() => createMixtureSymbolNotationModel({
    mixtureId,
    compact,
    mini,
    scale,
    maxWidth,
    maxHeight,
    groupWidth,
  }), [compact, groupWidth, maxHeight, maxWidth, mini, mixtureId, scale]);

  return (
    <View style={MixtureSymbolStyle1({ plan, fittedScale })}>
      <View style={MixtureSymbolStyle2({ plan, fittedScale })}>
        <NoteNotation plan={plan} color={color} accessibilityLabel={accessibilityLabel ?? t(pattern.label)} readyTestID={readyTestID} centerVisualContent />
      </View>
    </View>
  );
}
