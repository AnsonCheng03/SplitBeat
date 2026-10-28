import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { useTutorialSkipHold } from '@/features/tutorial/useTutorialSkipHold';
import {
  tutorialStyleHoldFill,
  tutorialStyleHoldLabel,
  tutorialStyleHoldTarget,
  tutorialStyleHoldTrack,
} from '@/styles/tutorial';

export function TutorialSkipControl({ onSkip }: { onSkip: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { progress, startHold, endHold } = useTutorialSkipHold(onSkip);

  return (
    <Pressable
      testID="tutorial.holdToSkip"
      accessibilityRole="button"
      accessibilityLabel={t('Hold to skip tutorial')}
      accessibilityHint={t('Keep holding the top-left corner until the bar fills.')}
      onPressIn={startHold}
      onPressOut={endHold}
      style={tutorialStyleHoldTarget({ top: insets.top + 10, left: insets.left + 10, colors })}
    >
      <Text style={tutorialStyleHoldLabel({ colors })}>{t('Hold to skip')}</Text>
      <View style={tutorialStyleHoldTrack({ colors })}>
        <View style={tutorialStyleHoldFill({ colors, progress })} />
      </View>
    </Pressable>
  );
}
