import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';

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
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            testID={testIDPrefix ? `${testIDPrefix}.${String(option.value)}` : undefined}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minWidth: 88,
              minHeight: 50,
              paddingHorizontal: 10,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: selected ? colors.text : colors.surface,
              borderWidth: 1,
              borderColor: selected ? colors.text : colors.line,
            }}
          >
            <Text style={{ color: selected ? colors.background : colors.muted, fontSize: 12, fontWeight: '700' }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
