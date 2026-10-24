import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { createBarNoteNotationPlan, createNoteNotationPlan } from '@/rhythm/noteNotation';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import { COMPOSER_TUPLET_SYMBOLS, NOTE_VALUE_SYMBOLS } from '@/rhythm/scoreComposer';
import type { ComposerSymbolId } from '@/rhythm/scoreComposer';
import { TUPLET_SUBDIVISIONS } from '@/types/rhythm';
import type { TimeSignature } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';

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
  const noteValue = NOTE_VALUE_SYMBOLS.find((symbol) => symbol.id === symbolId);
  const tupletValue = COMPOSER_TUPLET_SYMBOLS.find((symbol) => symbol.id === symbolId);
  const label = t(noteValue?.label ?? tupletValue?.label ?? symbolId);
  const plan = useMemo(() => {
    if (isRest) {
      const durationQuarter = noteValue?.durationQuarter ?? pulseQuarterNotes(timeSignature);
      return createBarNoteNotationPlan([{
        startQuarter: durationQuarter / 2,
        durationQuarter,
      }], {
        durationQuarter: durationQuarter * 2,
        width: 45,
        size: 'mini',
        beamGroupQuarterNotes: durationQuarter,
      });
    }
    if (TUPLET_SUBDIVISIONS.includes(symbolId as (typeof TUPLET_SUBDIVISIONS)[number])) {
      return createNoteNotationPlan(symbolId as (typeof TUPLET_SUBDIVISIONS)[number], 'mini', timeSignature);
    }
    if (!noteValue) return null;
    return createBarNoteNotationPlan([{
      startQuarter: noteValue.durationQuarter / 2,
      durationQuarter: noteValue.durationQuarter,
    }], {
      durationQuarter: noteValue.durationQuarter * 2,
      width: 45,
      size: 'mini',
      beamGroupQuarterNotes: noteValue.durationQuarter,
    });
  }, [isRest, noteValue, symbolId, timeSignature]);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t(isRest ? 'Add a {note} rest' : 'Add {note}', { note: label })}
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 78,
        minHeight: 75,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 7,
        paddingVertical: 7,
        borderRadius: 11,
        backgroundColor: pressed ? `${color}24` : colors.background,
        borderWidth: 1,
        borderColor: pressed ? color : colors.line,
      })}
    >
      <View style={{ height: 39, minWidth: 46, justifyContent: 'center', alignItems: 'center' }}>
        {plan ? (
          <NoteNotation
            plan={plan}
            color={color}
            restSymbol={isRest}
            accessibilityLabel={t(isRest ? '{note} rest' : '{note}', { note: label })}
          />
        ) : null}
      </View>
      <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 8, fontWeight: '800', marginTop: 2, maxWidth: 100 }}>
        {label}
      </Text>
    </Pressable>
  );
}
