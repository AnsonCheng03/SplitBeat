import { View } from 'react-native';
import { SettingsPage } from '@/components/SettingsPage';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';

export default function AppearanceSettingsScreen() {
  const { mode, setMode, colors } = useTheme();

  return (
    <SettingsPage
      testID="settings.appearance.screen"
      backTestID="settings.appearance.back"
      section="appearance"
      title="Appearance"
      description="Choose the look that feels clearest while you practise."
    >
      <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: colors.line }}>
        <SettingsToggleRow
          testID="settings.appearance.lightMode"
          label="Light mode"
          description="Use the bright rhythm canvas and high-contrast note colors."
          value={mode === 'light'}
          onChange={(enabled) => setMode(enabled ? 'light' : 'dark')}
        />
      </View>
      <Text style={{ color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 12 }}>
        Your choice is saved on this device. The practice tempo remains in the pause controls.
      </Text>
    </SettingsPage>
  );
}
