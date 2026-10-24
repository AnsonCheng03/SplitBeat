import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { colors } from '@/theme';

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
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
              minWidth: 72,
              minHeight: 43,
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
