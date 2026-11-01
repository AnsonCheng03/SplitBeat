import { View } from 'react-native';
import { SettingsPage } from '@/components/SettingsPage';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import { DEFAULT_SCORE_DISPLAY_MODE } from '@/rhythm/scoreStaff';
import type { ScoreDisplayMode } from '@/types/rhythm';
import { appearanceStyle1, appearanceStyle2, appearanceStyle3, appearanceStyle4, appearanceStyle5 } from '@/styles/settings';

export default function AppearanceSettingsScreen() {
  const { mode, setMode, colors } = useTheme();
  const { t } = useI18n();
  const { settings, featureFlags, updateSettings } = useRhythmSession();
  const scoreDisplayMode = settings.scoreDisplayMode ?? DEFAULT_SCORE_DISPLAY_MODE;
  const scoreDisplayDescription: Record<ScoreDisplayMode, string> = {
    focus: 'Current beat · large hand panels',
    slide: 'Move one bar at a time',
    fade: 'Keep bars still · fade forward',
    'slide-per-note': 'Move as each note arrives',
  };

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
      {featureFlags.scoreNotation ? (
        <View style={appearanceStyle3()}>
          <Text style={appearanceStyle4({ colors })}>SCORE DISPLAY</Text>
          <Text style={appearanceStyle5({ colors })}>
            Choose how score notation appears while you practise.
          </Text>
          <Text style={appearanceStyle5({ colors })}>
            {t(scoreDisplayDescription[scoreDisplayMode])}
          </Text>
          <SettingsChoiceRow
            options={[
              { label: 'ONE NOTE', value: 'focus' as const },
              { label: 'SLIDE', value: 'slide' as const },
              { label: 'FADE', value: 'fade' as const },
              { label: 'SLIDE PER NOTE', value: 'slide-per-note' as const },
            ]}
            value={scoreDisplayMode}
            onChange={(scoreDisplayMode) => updateSettings({ scoreDisplayMode })}
            testIDPrefix="settings.appearance.scoreDisplay"
          />
        </View>
      ) : null}
    </SettingsPage>
  );
}
