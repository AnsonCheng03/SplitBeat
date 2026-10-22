import { Pressable, Text, View } from 'react-native';
import { colors } from '@/theme';

export function SettingsToggleRow({
  label,
  value,
  onChange,
  testID,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{ minHeight: 54, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line }}
    >
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
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
