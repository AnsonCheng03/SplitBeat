import { Pressable } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';
import { ScoreTemplateFilterChipStyle1, ScoreTemplateFilterChipStyle2 } from '@/styles/exercise';

export function ScoreTemplateFilterChip({
  testID,
  label,
  selected,
  accessibilityLabel,
  onPress,
}: {
  testID: string;
  label: string;
  selected: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => (ScoreTemplateFilterChipStyle1({ selected, colors, pressed }))}
    >
      <Text raw style={ScoreTemplateFilterChipStyle2({ selected, colors })}>{label}</Text>
    </Pressable>
  );
}
