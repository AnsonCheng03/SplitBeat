import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { ScoreDisplayMode } from '@/types/rhythm';
import {
  scoreDisplayDescriptionStyle,
  scoreDisplayLabelStyle,
  scoreDisplayModeButtonStyle,
  scoreDisplayModeButtonTextStyle,
  scoreDisplayModeOptionsStyle,
  scoreDisplayPickerContainerStyle,
} from '@/styles/practice';

const SCORE_DISPLAY_OPTIONS: readonly { label: string; value: ScoreDisplayMode }[] = [
  { label: 'ONE NOTE', value: 'focus' },
  { label: 'SLIDE', value: 'slide' },
  { label: 'FADE', value: 'fade' },
  { label: 'SLIDE PER NOTE', value: 'slide-per-note' },
];

const SCORE_DISPLAY_DESCRIPTIONS: Record<ScoreDisplayMode, string> = {
  focus: 'Current beat · large hand panels',
  slide: 'Move one bar at a time',
  fade: 'Keep bars still · fade forward',
  'slide-per-note': 'Move as each note arrives',
};

export function ScoreDisplayModePicker({
  value,
  onChange,
  testIDPrefix,
  allowOneNote = false,
}: {
  value: ScoreDisplayMode;
  onChange: (value: ScoreDisplayMode) => void;
  testIDPrefix: string;
  allowOneNote?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const options = allowOneNote
    ? SCORE_DISPLAY_OPTIONS
    : SCORE_DISPLAY_OPTIONS.filter((option) => option.value !== 'focus');

  return (
    <View style={scoreDisplayPickerContainerStyle()}>
      <Text style={scoreDisplayLabelStyle({ colors })}>SCORE DISPLAY</Text>
      <View style={scoreDisplayModeOptionsStyle()}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              testID={`${testIDPrefix}.${option.value}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => scoreDisplayModeButtonStyle({ selected, pressed, colors })}
            >
              <Text style={scoreDisplayModeButtonTextStyle({ selected, colors })}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={scoreDisplayDescriptionStyle({ colors })}>{t(SCORE_DISPLAY_DESCRIPTIONS[value])}</Text>
    </View>
  );
}
