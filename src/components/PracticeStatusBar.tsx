import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { Countdown } from '@/components/Countdown';
import { MetronomeIndicator } from '@/components/MetronomeIndicator';
import { useTheme } from '@/theme/ThemeProvider';
import type { SessionSnapshot } from '@/types/rhythm';
import type { PracticeLayout } from '@/features/deviceLayout/practiceLayout';
import {
  PracticeStatusBarStyle1,
  PracticeStatusBarStyle2,
  PracticeStatusBarStyle3,
  PracticeStatusBarStyle4,
  PracticeStatusBarStyle5,
  PracticeStatusBarStyle6,
  PracticeStatusBarStyle7,
  PracticeStatusBarStyle8,
  PracticeStatusBarStyle9,
  PracticeStatusBarStyle10,
  PracticeStatusBarStyle11
} from '@/styles/practice';

export function PracticeStatusBar({
  snapshot,
  compact,
  width,
  topInset,
  leftInset,
  rightInset,
  layout,
  remainingLabel,
  scoreBarsRemaining,
  resumeStartLabel,
  showNextPattern,
  changeCountdown,
  onPause,
}: {
  snapshot: SessionSnapshot | null;
  compact: boolean;
  width: number;
  topInset: number;
  leftInset: number;
  rightInset: number;
  layout: PracticeLayout;
  remainingLabel: string;
  scoreBarsRemaining?: number;
  resumeStartLabel: string;
  showNextPattern: boolean;
  changeCountdown?: number;
  onPause: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const safeTopInset = Math.max(topInset, layout.safeTopInset, 12);

  return (
    <View pointerEvents="box-none" style={PracticeStatusBarStyle1({ safeTopInset, snapshot, compact, leftInset, rightInset })}>
      <Pressable
        testID="practice.pause"
        accessibilityRole="button"
        accessibilityLabel={t('Pause practice')}
        disabled={!snapshot || snapshot.phase === 'paused' || snapshot.phase === 'finished'}
        onPress={onPause}
        hitSlop={12}
      >
        <Text style={PracticeStatusBarStyle2({ colors, compact })}>Ⅱ  PAUSE</Text>
      </Pressable>
      <View testID="practice.beatCounter" style={PracticeStatusBarStyle3({ snapshot, width, compact, layout })}>
        {snapshot?.resumeCountIn ? (
          <>
            <Text testID="practice.resumeCountIn" style={PracticeStatusBarStyle4({ colors, compact })}>LISTEN</Text>
            <Text
              testID="practice.resumeStartNote"
              accessibilityLabel={t('START WITH') + ': ' + resumeStartLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
              style={PracticeStatusBarStyle5({ colors, compact })}
            >
              {t('START WITH')}: {resumeStartLabel}
            </Text>
          </>
        ) : null}
        {snapshot?.countdown !== null && snapshot?.countdown !== undefined ? (
          <Countdown value={snapshot.countdown} compact={compact} />
        ) : snapshot ? (
          <MetronomeIndicator
            beatInBar={snapshot.counterBeatInBar}
            beatsPerBar={snapshot.counterBeatsPerBar}
            isRunning={snapshot.phase === 'running'}
            isRest={snapshot.isRest}
            isPaused={snapshot.phase === 'paused'}
            compact={compact}
          />
        ) : null}
      </View>
      <View style={PracticeStatusBarStyle6({ compact })}>
        {remainingLabel ? (
          <Text
            testID={scoreBarsRemaining === undefined ? 'practice.timeRemaining' : 'practice.barsRemaining'}
            accessibilityLabel={scoreBarsRemaining === undefined
              ? remainingLabel === 'ENDLESS' ? t('Endless session') : t('{time} remaining', { time: remainingLabel.replace(' LEFT', '') })
              : t('{count} {unit} remaining', { count: scoreBarsRemaining, unit: t(scoreBarsRemaining === 1 ? 'bar' : 'bars') })}
            numberOfLines={1}
            style={PracticeStatusBarStyle7({ colors, compact })}
          >
            {remainingLabel}
          </Text>
        ) : null}
        {snapshot && showNextPattern && snapshot.phase === 'running' && changeCountdown !== undefined ? (
          <Text testID="practice.changeCountdown.label" style={PracticeStatusBarStyle8({ colors, compact })}>
            {t('NEXT CHANGE')}
          </Text>
        ) : null}
        <View
          testID="practice.changeCountdown"
          accessibilityRole="text"
          accessibilityLabel={snapshot && showNextPattern && snapshot.phase === 'running' && changeCountdown !== undefined
            ? t('Next pattern change in {count} {unit}', { count: changeCountdown, unit: t(changeCountdown === 1 ? 'beat' : 'beats') })
            : undefined}
          style={PracticeStatusBarStyle9({ compact })}
        >
          {snapshot && showNextPattern && snapshot.phase === 'running' && changeCountdown !== undefined ? (
            <>
              <Text testID="practice.nextPattern.countdown" style={PracticeStatusBarStyle10({ colors, compact })}>{changeCountdown}</Text>
              <Text style={PracticeStatusBarStyle11({ colors, compact })}>{changeCountdown === 1 ? 'BEAT' : 'BEATS'}</Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}
