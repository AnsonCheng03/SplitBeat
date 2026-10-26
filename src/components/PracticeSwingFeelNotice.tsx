import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { SessionSnapshot } from '@/types/rhythm';
import {
  PracticePauseOverlaysStyle22,
  PracticePauseOverlaysStyle23,
  PracticePauseOverlaysStyle24,
  PracticePauseOverlaysStyle25,
  PracticePauseOverlaysStyle26,
} from '@/styles/practice';

export function PracticeSwingFeelNotice({
  snapshot,
  actionLoading,
  onRestartStraight,
}: {
  snapshot: SessionSnapshot;
  actionLoading: boolean;
  onRestartStraight: () => Promise<void>;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const mismatch = snapshot.swingFeelMismatch;
  if (!mismatch?.likelyStraight) return null;

  return (
    <View testID="practice.pause.swingFeelWarning" style={PracticePauseOverlaysStyle22({ colors })}>
      <Text style={PracticePauseOverlaysStyle23({ colors })}>
        {t('Your taps are lining up with straight timing, while this exercise is set to swing.')}
      </Text>
      {mismatch.latestBarIndex <= 3 ? (
        <Pressable
          testID="practice.pause.restartStraight"
          accessibilityRole="button"
          disabled={actionLoading}
          onPress={() => void onRestartStraight()}
          style={PracticePauseOverlaysStyle24({ colors, pauseActionLoading: actionLoading })}
        >
          <Text style={PracticePauseOverlaysStyle25({ colors })}>{t('RESTART AS STRAIGHT')}</Text>
        </Pressable>
      ) : (
        <Text style={PracticePauseOverlaysStyle26({ colors })}>
          {t('You can count this session as straight on the results page.')}
        </Text>
      )}
    </View>
  );
}
