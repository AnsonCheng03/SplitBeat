import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { SessionSnapshot } from '@/types/rhythm';
import {
  PracticePauseOverlaysStyle27,
  PracticePauseOverlaysStyle28,
  PracticePauseOverlaysStyle29,
  PracticePauseOverlaysStyle30,
  PracticePauseOverlaysStyle31,
  PracticePauseOverlaysStyle32,
  PracticePauseOverlaysStyle33,
  PracticePauseOverlaysStyle34,
  PracticePauseOverlaysStyle35,
  PracticePauseOverlaysStyle36,
  PracticePauseOverlaysStyle37,
  PracticePauseOverlaysStyle38,
  PracticePauseOverlaysStyle39,
} from '@/styles/practice';

export function PracticeScoreRewindControl({
  snapshot,
  compact,
  actionLoading,
  rewindBars,
  maxRewindBars,
  onRewindBarsChange,
  onRestart,
}: {
  snapshot: SessionSnapshot;
  compact: boolean;
  actionLoading: boolean;
  rewindBars: number;
  maxRewindBars: number;
  onRewindBarsChange: (bars: number) => void;
  onRestart: (barsBack: number) => Promise<void>;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  if (snapshot.scoreMeasureCount === undefined) return null;

  return (
    <View style={PracticePauseOverlaysStyle27({ compact })}>
      <View style={PracticePauseOverlaysStyle28()}>
        <Text style={PracticePauseOverlaysStyle29({ colors, compact })}>{t('REWIND SCORE')}</Text>
        <Text style={PracticePauseOverlaysStyle30({ colors, compact })}>
          {maxRewindBars} {t(maxRewindBars === 1 ? 'BAR' : 'BARS')} {t('AVAILABLE')}
        </Text>
      </View>
      <View style={PracticePauseOverlaysStyle31({ compact })}>
        <Pressable
          testID="practice.pause.rewindMinus"
          accessibilityRole="button"
          accessibilityLabel={t('Rewind one fewer bar')}
          disabled={maxRewindBars === 0 || rewindBars <= 1}
          onPress={() => onRewindBarsChange(Math.max(1, rewindBars - 1))}
          style={PracticePauseOverlaysStyle32({ compact, colors, maxRewindBars, rewindBars })}
        >
          <Text style={PracticePauseOverlaysStyle33({ colors })}>−</Text>
        </Pressable>
        <Text testID="practice.pause.rewindCount" style={PracticePauseOverlaysStyle34({ colors, compact })}>
          {rewindBars} {t(rewindBars === 1 ? 'BAR' : 'BARS')} {t('BACK')}
        </Text>
        <Pressable
          testID="practice.pause.rewindPlus"
          accessibilityRole="button"
          accessibilityLabel={t('Rewind one more bar')}
          disabled={maxRewindBars === 0 || rewindBars >= maxRewindBars}
          onPress={() => onRewindBarsChange(Math.min(maxRewindBars, rewindBars + 1))}
          style={PracticePauseOverlaysStyle35({ compact, colors, maxRewindBars, rewindBars })}
        >
          <Text style={PracticePauseOverlaysStyle36({ colors })}>+</Text>
        </Pressable>
        <Pressable
          testID="practice.pause.rewind"
          accessibilityRole="button"
          disabled={maxRewindBars === 0 || actionLoading}
          onPress={() => void onRestart(rewindBars)}
          style={PracticePauseOverlaysStyle37({ compact, colors, maxRewindBars, pauseActionLoading: actionLoading })}
        >
          <Text style={PracticePauseOverlaysStyle38({ colors, compact })}>{t('REWIND')}</Text>
        </Pressable>
      </View>
      <Text style={PracticePauseOverlaysStyle39({ colors, compact })}>
        {t('Rewind starts a fresh run from the selected bar.')}
      </Text>
    </View>
  );
}
