import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import type { PracticeDisplayMode } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';
import { PracticeDisplayPickerStyle1, PracticeDisplayPickerStyle2, PracticeDisplayPickerStyle3, PracticeDisplayPickerStyle4, PracticeDisplayPickerStyle5 } from '@/styles/practice';

export function PracticeDisplayPicker({
  value,
  onChange,
  testIDPrefix,
  label = 'NOTATION',
}: {
  value: PracticeDisplayMode;
  onChange: (value: PracticeDisplayMode) => void;
  testIDPrefix: string;
  label?: string;
}) {
  const { colors } = useTheme();
  const options: { label: string; value: PracticeDisplayMode }[] = [
    { label: 'Rhythm symbols', value: 'rhythm' },
    { label: 'Score notes', value: 'score' },
  ];

  return (
    <View style={PracticeDisplayPickerStyle1()}>
      <Text style={PracticeDisplayPickerStyle2({ colors })}>
        {label}
      </Text>
      <View style={PracticeDisplayPickerStyle3()}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              testID={`${testIDPrefix}.${option.value}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => (PracticeDisplayPickerStyle4({ selected, colors, pressed }))}
            >
              <Text style={PracticeDisplayPickerStyle5({ selected, colors })}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
