import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsPage } from '@/components/SettingsPage';
import { useI18n } from '@/i18n/I18nProvider';
import type { LanguagePreference } from '@/i18n/translation';
import { useTheme } from '@/theme/ThemeProvider';

const LANGUAGE_OPTIONS: readonly { label: string; value: LanguagePreference }[] = [
  { label: 'System default', value: 'system' },
  { label: 'English', value: 'en' },
  { label: 'Traditional Chinese', value: 'zh-Hant' },
];

export default function LanguageSettingsScreen() {
  const { colors } = useTheme();
  const { preference, setLanguage, t } = useI18n();

  return (
    <SettingsPage
      testID="settings.language.screen"
      backTestID="settings.language.back"
      section="language"
      title={t('Language')}
      description={t('Choose the language used throughout Split Beat.')}
    >
      <View style={{ marginTop: 20, maxWidth: 680, padding: 18, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
        <SettingsChoiceRow
          options={LANGUAGE_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
          value={preference}
          onChange={setLanguage}
          testIDPrefix="settings.language.choice"
        />
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 14 }}>
          {t('The app follows your device language when System default is selected.')}
        </Text>
      </View>
    </SettingsPage>
  );
}
