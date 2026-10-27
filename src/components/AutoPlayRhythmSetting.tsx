import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { useShakeToRevealOption } from '@/features/settings/useShakeToRevealOption';
import { useTheme } from '@/theme/ThemeProvider';
import { autoPlaySettingStyle1, autoPlaySettingStyle2 } from '@/styles/settings';

export function AutoPlayRhythmSetting({
  active,
  value,
  onChange,
  testID,
}: {
  active: boolean;
  value: boolean;
  onChange: (value: boolean) => void;
  testID: string;
}) {
  const { colors } = useTheme();
  const { isRevealed, reveal } = useShakeToRevealOption({ active, optionEnabled: value });
  const isVisible = isRevealed || value;

  if (!isVisible) {
    return (
      <View style={autoPlaySettingStyle1({ colors })}>
        <Text testID={`${testID}.shakeHint`} style={autoPlaySettingStyle2({ colors })}>
          Shake your device to reveal Auto-play.
        </Text>
      </View>
    );
  }

  return (
    <SettingsToggleRow
      testID={testID}
      label="Auto-play the shown rhythm"
      description="Hear the displayed left and right patterns using each hand’s selected sound."
      value={value}
      onChange={(nextValue) => {
        if (nextValue) reveal();
        onChange(nextValue);
      }}
    />
  );
}
