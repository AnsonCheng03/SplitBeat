import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { MixtureSymbol } from '@/components/MixtureSymbol';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { patternSelectionLabel } from '@/i18n/patternLabels';
import type { MixturePattern } from '@/rhythm/mixtures';
import { SUBDIVISIONS } from '@/types/rhythm';
import type { Hand, MixturePatternId, Subdivision, TimeSignature } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';

export type PatternSelection = { subdivision: Subdivision; mixture?: MixturePatternId; rest: boolean };

export function PatternPicker({ hand, selection, mixtures, includeSixtyFourth, timeSignature, onChange }: { hand: Hand; selection: PatternSelection; mixtures: readonly MixturePattern[]; includeSixtyFourth: boolean; timeSignature: TimeSignature; onChange: (selection: PatternSelection) => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const color = hand === 'left' ? colors.left : colors.right;
  const options: { key: string; selection: PatternSelection }[] = [
    ...SUBDIVISIONS.filter((subdivision) => includeSixtyFourth || subdivision !== 'sixtyFourth')
      .map((subdivision) => ({ key: subdivision, selection: { subdivision, rest: false } })),
    ...mixtures.map((mixture) => ({ key: mixture.id, selection: { subdivision: 'quarter' as const, mixture: mixture.id, rest: false } })),
    { key: 'rest', selection: { subdivision: 'quarter', rest: true } },
  ];
  const isSelected = (option: (typeof options)[number]) =>
    selection.subdivision === option.selection.subdivision && selection.mixture === option.selection.mixture && selection.rest === option.selection.rest;

  return (
    <View style={{ flex: 1, minWidth: 0, padding: 12, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
      <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>{hand.toUpperCase()} HAND</Text>
      <PatternSelectionSymbol selection={selection} color={color} timeSignature={timeSignature} accessibilityLabel={patternSelectionLabel(selection, t)} selected />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((option) => (
          <PatternOptionButton
            key={option.key}
            hand={hand}
            optionKey={option.key}
            selection={option.selection}
            timeSignature={timeSignature}
            color={color}
            selected={isSelected(option)}
            onPress={() => onChange(option.selection)}
          />
        ))}
      </View>
    </View>
  );
}

function PatternSelectionSymbol({ selection, color, timeSignature, accessibilityLabel, selected = false }: {
  selection: PatternSelection;
  color: string;
  timeSignature: TimeSignature;
  accessibilityLabel: string;
  selected?: boolean;
}) {
  const symbolWidth = selected ? 120 : 52;
  const symbolHeight = selected ? 38 : 30;
  const slot = selected
    ? { width: 132, height: 54, paddingHorizontal: 6, marginBottom: 8 }
    : { width: 58, height: 36, paddingHorizontal: 3, marginBottom: 0 };

  return (
    <View style={{ width: slot.width, height: slot.height, marginBottom: slot.marginBottom, paddingHorizontal: slot.paddingHorizontal, alignItems: 'center', justifyContent: 'center' }}>
      {selection.mixture ? (
        <MixtureSymbol
          mixtureId={selection.mixture}
          color={color}
          compact={!selected}
          groupWidth={symbolWidth}
          maxWidth={symbolWidth}
          maxHeight={symbolHeight}
          accessibilityLabel={accessibilityLabel}
        />
      ) : (
        <RhythmSymbol
          subdivision={selection.subdivision}
          color={color}
          timeSignature={timeSignature}
          compact={!selected}
          groupWidth={symbolWidth}
          maxWidth={symbolWidth}
          maxHeight={symbolHeight}
          rest={selection.rest}
        />
      )}
    </View>
  );
}

function PatternOptionButton({ hand, optionKey, selection, timeSignature, color, selected, onPress }: {
  hand: Hand;
  optionKey: string;
  selection: PatternSelection;
  timeSignature: TimeSignature;
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const label = patternSelectionLabel(selection, t);

  return (
    <Pressable
      testID={`exercise.pair.${hand}.${optionKey}`}
      accessibilityRole="button"
      accessibilityLabel={t('Select {pattern}', { pattern: label })}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 70,
        minHeight: 52,
        paddingHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 9,
        backgroundColor: selected ? `${color}24` : pressed ? colors.surfaceRaised : colors.background,
        borderWidth: 1,
        borderColor: selected ? color : colors.line,
      })}
    >
      <PatternSelectionSymbol selection={selection} color={selected ? color : colors.muted} timeSignature={timeSignature} accessibilityLabel={label} />
    </Pressable>
  );
}

export function ChoiceChip({ testID, label, selected, selectedColor, onPress }: { testID?: string; label: string; selected: boolean; selectedColor?: string; onPress: () => void }) {
  const { colors } = useTheme();
  const chipColor = selectedColor ?? colors.accent;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={{ minHeight: 30, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: selected ? `${chipColor}24` : colors.background, borderWidth: 1, borderColor: selected ? chipColor : colors.line }}>
      <Text numberOfLines={1} style={{ color: selected ? chipColor : colors.muted, fontSize: 9, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({ testID, title, onPress, disabled, flex }: { testID: string; title: string; onPress: () => void; disabled: boolean; flex?: number }) {
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} disabled={disabled} style={({ pressed }) => ({ flex, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 9, borderRadius: 12, backgroundColor: pressed || disabled ? colors.surfaceRaised : colors.left, opacity: disabled ? 0.65 : 1 })}>
      <Text style={{ color: disabled ? colors.muted : colors.background, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>{title}</Text>
    </Pressable>
  );
}
