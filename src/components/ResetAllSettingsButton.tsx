import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useResetAllSettings } from '@/features/settings/useResetAllSettings';
import { useTheme } from '@/theme/ThemeProvider';
import {
  resetAllSettingsStyle1,
  resetAllSettingsStyle2,
  resetAllSettingsStyle3,
  resetAllSettingsStyle4,
  resetAllSettingsStyle5,
} from '@/styles/settings';

export function ResetAllSettingsButton() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { confirmResetAllSettings } = useResetAllSettings();

  return (
    <View style={resetAllSettingsStyle1({ colors })}>
      <Text style={resetAllSettingsStyle2({ colors })}>RESET ALL SETTINGS</Text>
      <Text style={resetAllSettingsStyle3({ colors })}>
        This resets your preferences while keeping your practice records, course progress, and saved compositions.
      </Text>
      <Pressable
        testID="setup.resetAllSettings"
        accessibilityRole="button"
        accessibilityLabel={t('Reset all settings')}
        accessibilityHint={t('This resets your settings only. Your records and saved content are kept.')}
        onPress={confirmResetAllSettings}
        style={({ pressed }) => resetAllSettingsStyle4({ colors, pressed })}
      >
        <Text style={resetAllSettingsStyle5({ colors })}>RESET ALL</Text>
      </Pressable>
    </View>
  );
}
