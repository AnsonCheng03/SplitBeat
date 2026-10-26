import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { createComposerSymbolNotationPlan, composerSymbolLabelKey } from '@/rhythm/composerSymbolNotation';
import type { ComposerSymbolId } from '@/rhythm/scoreComposer';
import type { TimeSignature } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';
import { ComposerSymbolButtonStyle1, ComposerSymbolButtonStyle2, ComposerSymbolButtonStyle3 } from '@/styles/exercise';

export function ComposerSymbolButton({
  symbolId,
  timeSignature,
  color,
  isRest,
  onPress,
  testID,
}: {
  symbolId: ComposerSymbolId;
  timeSignature: TimeSignature;
  color: string;
  isRest: boolean;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const label = t(composerSymbolLabelKey(symbolId));
  const plan = useMemo(
    () => createComposerSymbolNotationPlan(symbolId, timeSignature, isRest),
    [isRest, symbolId, timeSignature],
  );

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t(isRest ? 'Add a {note} rest' : 'Add {note}', { note: label })}
      onPress={onPress}
      style={({ pressed }) => (ComposerSymbolButtonStyle1({ pressed, color, colors }))}
    >
      <View style={ComposerSymbolButtonStyle2()}>
        {plan ? (
          <NoteNotation
            plan={plan}
            color={color}
            restSymbol={isRest}
            accessibilityLabel={t(isRest ? '{note} rest' : '{note}', { note: label })}
          />
        ) : null}
      </View>
      <Text numberOfLines={1} style={ComposerSymbolButtonStyle3({ colors })}>
        {label}
      </Text>
    </Pressable>
  );
}
