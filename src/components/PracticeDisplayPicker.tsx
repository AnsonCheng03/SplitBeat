import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import type { PracticeDisplayMode } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';

export function PracticeDisplayPicker({
  value,
  onChange,
  testIDPrefix,
}: {
  value: PracticeDisplayMode;
  onChange: (value: PracticeDisplayMode) => void;
  testIDPrefix: string;
}) {
  const { colors } = useTheme();
  const options: { label: string; value: PracticeDisplayMode }[] = [
    { label: 'Rhythm symbols', value: 'rhythm' },
    { label: 'Score notes', value: 'score' },
  ];

  return (
    <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ width: 76, color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }}>
        NOTATION
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              testID={`${testIDPrefix}.${option.value}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 42,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: selected ? colors.surfaceRaised : colors.surface,
                borderWidth: 1,
                borderColor: selected ? colors.accent : colors.line,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: selected ? colors.accent : colors.muted, fontSize: 12, fontWeight: '800' }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
