import { Pressable, View } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { useTutorialSkipHold } from '@/features/tutorial/useTutorialSkipHold';
import {
  tutorialStyleHoldEndBar,
  tutorialStyleHoldFill,
  tutorialStyleHoldIcon,
  tutorialStyleHoldTarget,
  tutorialStyleHoldTrack,
  tutorialStyleHoldTriangle,
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
      style={({ pressed }) => tutorialStyleHoldTarget({
        top: insets.top + 10,
        left: insets.left + 10,
        colors,
        pressed,
      })}
    >
      <View accessibilityElementsHidden style={tutorialStyleHoldIcon()}>
        <View style={tutorialStyleHoldTriangle({ colors })} />
        <View style={tutorialStyleHoldTriangle({ colors })} />
        <View style={tutorialStyleHoldEndBar({ colors })} />
      </View>
      <View style={tutorialStyleHoldTrack({ colors })}>
        <View style={tutorialStyleHoldFill({ colors, progress })} />
      </View>
    </Pressable>
  );
}
