import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ResultsCalibrationPromptStyle1,
  ResultsCalibrationPromptStyle2,
  ResultsCalibrationPromptStyle3,
  ResultsCalibrationPromptStyle4,
} from '@/styles/results';

export function ResultsCalibrationPrompt({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View testID="results.calibrationPrompt" style={ResultsCalibrationPromptStyle1({ colors })}>
      <Text style={ResultsCalibrationPromptStyle2({ colors })}>{t('Does the click feel out of sync?')}</Text>
      <Text style={ResultsCalibrationPromptStyle3({ colors })}>
        {t('A short timing check can measure your hand offsets. Saved calibration is used for scoring by default.')}
      </Text>
      <Pressable
        testID="results.calibrateTiming"
        accessibilityRole="button"
        onPress={onPress}
        style={ResultsCalibrationPromptStyle4({ colors })}
      >
        <Text style={ResultsCalibrationPromptStyle2({ colors, button: true })}>{t('CALIBRATE TIMING')}</Text>
      </Pressable>
    </View>
  );
}
