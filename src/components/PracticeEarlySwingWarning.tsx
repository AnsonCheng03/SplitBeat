import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import type { SessionSnapshot } from '@/types/rhythm';
import {
  PracticePauseOverlaysStyle1,
  PracticePauseOverlaysStyle2,
  PracticePauseOverlaysStyle3,
  PracticePauseOverlaysStyle4,
  PracticePauseOverlaysStyle5,
  PracticePauseOverlaysStyle6,
  PracticePauseOverlaysStyle7,
  PracticePauseOverlaysStyle8,
} from '@/styles/practice';

export function PracticeEarlySwingWarning({
  snapshot,
  visible,
  actionLoading,
  onRestartStraight,
  onDismiss,
}: {
  snapshot: SessionSnapshot | null;
  visible: boolean;
  actionLoading: boolean;
  onRestartStraight: () => void;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const mismatch = snapshot?.swingFeelMismatch;
  if (!visible || snapshot?.phase !== 'running' || !mismatch?.likelyStraight || mismatch.latestBarIndex > 3) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={PracticePauseOverlaysStyle1({ insets })}>
      <View testID="practice.swingFeel.earlyWarning" style={PracticePauseOverlaysStyle2({ colors })}>
        <Text style={PracticePauseOverlaysStyle3({ colors })}>
          {t('Your taps are lining up with straight timing, while this exercise is set to swing.')}
        </Text>
        <View style={PracticePauseOverlaysStyle4()}>
          <Pressable
            testID="practice.swingFeel.restartStraight"
            accessibilityRole="button"
            disabled={actionLoading}
            onPress={onRestartStraight}
            style={PracticePauseOverlaysStyle5({ colors, pauseActionLoading: actionLoading })}
          >
            <Text style={PracticePauseOverlaysStyle6({ colors })}>{t('RESTART AS STRAIGHT')}</Text>
          </Pressable>
          <Pressable
            testID="practice.swingFeel.keepSwing"
            accessibilityRole="button"
            onPress={onDismiss}
            style={PracticePauseOverlaysStyle7()}
          >
            <Text style={PracticePauseOverlaysStyle8({ colors })}>{t('KEEP PLAYING SWING')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
