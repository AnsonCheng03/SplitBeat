import { Pressable } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';

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
      style={({ pressed }) => ({
        minHeight: 34,
        justifyContent: 'center',
        paddingHorizontal: 13,
        borderRadius: 18,
        backgroundColor: selected ? colors.accent : pressed ? colors.surfaceRaised : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.line,
      })}
    >
      <Text raw style={{ color: selected ? colors.background : colors.muted, fontSize: 11, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}
