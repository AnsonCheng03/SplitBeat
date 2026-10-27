import { View } from 'react-native';
import { SettingsPage } from '@/components/SettingsPage';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { Text } from '@/i18n/LocalizedText';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import { appearanceStyle1, appearanceStyle2, appearanceStyle3, appearanceStyle4, appearanceStyle5 } from '@/styles/settings';

export default function AppearanceSettingsScreen() {
  const { mode, setMode, colors } = useTheme();
  const { settings, featureFlags, updateSettings } = useRhythmSession();

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
      {featureFlags.scoreNotation && settings.practiceDisplayMode === 'score' ? (
        <View style={appearanceStyle3()}>
          <Text style={appearanceStyle4({ colors })}>SCORE MOVEMENT</Text>
          <Text style={appearanceStyle5({ colors })}>
            Choose how score bars advance while you practise.
          </Text>
          <SettingsChoiceRow
            options={[
              { label: 'SLIDE', value: 'slide' as const },
              { label: 'FADE', value: 'fade' as const },
              { label: 'SLIDE PER NOTE', value: 'slide-per-note' as const },
            ]}
            value={settings.scoreMotionMode ?? 'fade'}
            onChange={(scoreMotionMode) => updateSettings({ scoreMotionMode })}
            testIDPrefix="settings.appearance.scoreMotion"
          />
        </View>
      ) : null}
    </SettingsPage>
  );
}
