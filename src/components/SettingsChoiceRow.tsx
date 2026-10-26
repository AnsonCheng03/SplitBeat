import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';
import { SettingsChoiceRowStyle1, SettingsChoiceRowStyle2, SettingsChoiceRowStyle3 } from '@/styles/settings';

export function SettingsChoiceRow<T extends string | number>({
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  testIDPrefix?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={SettingsChoiceRowStyle1()}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            testID={testIDPrefix ? `${testIDPrefix}.${String(option.value)}` : undefined}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={SettingsChoiceRowStyle2({ selected, colors })}
          >
            <Text style={SettingsChoiceRowStyle3({ selected, colors })}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
