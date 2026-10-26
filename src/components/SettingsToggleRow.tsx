import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';
import {
  SettingsToggleRowStyle1,
  SettingsToggleRowStyle2,
  SettingsToggleRowStyle3,
  SettingsToggleRowStyle4,
  SettingsToggleRowStyle5,
  SettingsToggleRowStyle6
} from '@/styles/settings';

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
      style={SettingsToggleRowStyle1({ description, colors, disabled })}
    >
      <View style={SettingsToggleRowStyle2()}>
        <Text style={SettingsToggleRowStyle3({ colors })}>{label}</Text>
        {description ? <Text style={SettingsToggleRowStyle4({ colors })}>{description}</Text> : null}
      </View>
      <View
        style={SettingsToggleRowStyle5({ value, colors })}
      >
        <View style={SettingsToggleRowStyle6({ colors })} />
      </View>
    </Pressable>
  );
}
