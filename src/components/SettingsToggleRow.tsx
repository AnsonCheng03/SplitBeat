import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';

export function SettingsToggleRow({
  label,
  description,
  value,
  onChange,
  disabled = false,
  testID,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={{ minHeight: description ? 72 : 54, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, gap: 16, paddingVertical: 10, opacity: disabled ? 0.55 : 1 }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
        {description ? <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{description}</Text> : null}
      </View>
      <View
        style={{
          width: 46,
          height: 27,
          borderRadius: 20,
          backgroundColor: value ? colors.left : colors.surfaceRaised,
          justifyContent: 'center',
          paddingHorizontal: 3,
          alignItems: value ? 'flex-end' : 'flex-start',
        }}
      >
        <View style={{ width: 21, height: 21, borderRadius: 99, backgroundColor: colors.text }} />
      </View>
    </Pressable>
  );
}
