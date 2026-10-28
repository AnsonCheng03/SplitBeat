import { Alert } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import { resetAutomaticGameCenterSetup } from '@/features/gameCenter/automaticGameCenterSetup';

export function useResetAllSettings() {
  const { resetSettings } = useRhythmSession();
  const { setMode } = useTheme();
  const { setLanguage, t } = useI18n();

  const confirmResetAllSettings = () => {
    Alert.alert(
      t('Reset all settings?'),
      t('This resets rhythm, audio, appearance, language, and timing preferences to their defaults. It also checks Game Center for saved course progress again. Practice records, local course progress, and saved compositions stay on this device.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Reset all settings'),
          style: 'destructive',
          onPress: () => {
            resetSettings();
            setMode('dark');
            setLanguage('system');
            void resetAutomaticGameCenterSetup();
          },
        },
      ],
    );
  };

  return { confirmResetAllSettings };
}
