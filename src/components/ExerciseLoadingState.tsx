import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { ExerciseLoadingStateStyle1, ExerciseLoadingStateStyle2, ExerciseLoadingStateStyle3, ExerciseLoadingStateStyle4 } from '@/styles/exercise';

export function ExerciseLoadingState({ preparingPractice = false }: { preparingPractice?: boolean }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <SafeAreaView
      testID={preparingPractice ? 'exercise.preparing' : 'exercise.loading'}
      accessibilityState={{ busy: true }}
      style={ExerciseLoadingStateStyle1({ colors })}
    >
      <View style={ExerciseLoadingStateStyle2()}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text accessibilityLiveRegion="polite" style={ExerciseLoadingStateStyle3({ colors })}>
          {preparingPractice ? t('Preparing your practice…') : t('Loading {activity}…', { activity: t('Focus practice') })}
        </Text>
        <Text style={ExerciseLoadingStateStyle4({ colors })}>
          {preparingPractice ? t('Generating your rhythm pattern.') : t('Preparing your practice history.')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
