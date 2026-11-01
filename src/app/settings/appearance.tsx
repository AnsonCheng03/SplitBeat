import { View } from 'react-native';
import { SettingsPage } from '@/components/SettingsPage';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';
import { appearanceStyle1, appearanceStyle2 } from '@/styles/settings';

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
      <View style={appearanceStyle1({ colors })}>
        <SettingsToggleRow
          testID="settings.appearance.lightMode"
          label="Light mode"
          description="Use the bright rhythm canvas and high-contrast note colors."
          value={mode === 'light'}
          onChange={(enabled) => setMode(enabled ? 'light' : 'dark')}
        />
      </View>
      <Text style={appearanceStyle2({ colors })}>
        Your choice is saved on this device. The practice tempo remains in the pause controls.
      </Text>
    </SettingsPage>
  );
}
