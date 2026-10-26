import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

export function ExerciseLoadingState() {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <SafeAreaView testID="exercise.loading" accessibilityState={{ busy: true }} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text accessibilityLiveRegion="polite" style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>
          {t('Loading {activity}…', { activity: t('Focus practice') })}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>{t('Preparing your practice history.')}</Text>
      </View>
    </SafeAreaView>
  );
}
