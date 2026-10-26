import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { MixtureSymbol } from '@/components/MixtureSymbol';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { patternSelectionLabel } from '@/i18n/patternLabels';
import type { MixturePattern } from '@/rhythm/mixtures';
import { SUBDIVISIONS } from '@/types/rhythm';
import type { Hand, TimeSignature } from '@/types/rhythm';
import type { PatternSelection } from '@/features/exercise/exerciseTypes';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ExercisePatternPickerStyle1,
  ExercisePatternPickerStyle2,
  ExercisePatternPickerStyle3,
  ExercisePatternPickerStyle4,
  ExercisePatternPickerStyle5,
  ExercisePatternPickerStyle6,
  ExercisePatternPickerStyle7,
  ExercisePatternPickerStyle8,
  ExercisePatternPickerStyle9
} from '@/styles/exercise';

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
    <View style={ExercisePatternPickerStyle1({ colors })}>
      <Text style={ExercisePatternPickerStyle2({ color })}>{hand.toUpperCase()} HAND</Text>
      <PatternSelectionSymbol selection={selection} color={color} timeSignature={timeSignature} accessibilityLabel={patternSelectionLabel(selection, t)} selected />
      <View style={ExercisePatternPickerStyle3()}>
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
  return (
    <View style={ExercisePatternPickerStyle4({ selected })}>
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
      style={({ pressed }) => (ExercisePatternPickerStyle5({ selected, color, pressed, colors }))}
    >
      <PatternSelectionSymbol selection={selection} color={selected ? color : colors.muted} timeSignature={timeSignature} accessibilityLabel={label} />
    </Pressable>
  );
}

export function ChoiceChip({ testID, label, selected, selectedColor, onPress }: { testID?: string; label: string; selected: boolean; selectedColor?: string; onPress: () => void }) {
  const { colors } = useTheme();
  const chipColor = selectedColor ?? colors.accent;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={ExercisePatternPickerStyle6({ selected, chipColor, colors })}>
      <Text numberOfLines={1} style={ExercisePatternPickerStyle7({ selected, chipColor, colors })}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({ testID, title, onPress, disabled, flex }: { testID: string; title: string; onPress: () => void; disabled: boolean; flex?: number }) {
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} disabled={disabled} style={({ pressed }) => (ExercisePatternPickerStyle8({ flex, pressed, disabled, colors }))}>
      <Text style={ExercisePatternPickerStyle9({ disabled, colors })}>{title}</Text>
    </Pressable>
  );
}
