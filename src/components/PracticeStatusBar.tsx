import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { Countdown } from '@/components/Countdown';
import { MetronomeIndicator } from '@/components/MetronomeIndicator';
import { useTheme } from '@/theme/ThemeProvider';
import type { SessionSnapshot } from '@/types/rhythm';

export function PracticeStatusBar({
  snapshot,
  compact,
  width,
  topInset,
  leftInset,
  rightInset,
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
  remainingLabel: string;
  scoreBarsRemaining?: number;
  resumeStartLabel: string;
  showNextPattern: boolean;
  changeCountdown?: number;
  onPause: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const safeTopInset = Math.max(topInset, 12);

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: safeTopInset, left: 0, right: 0, minHeight: snapshot?.resumeCountIn ? (compact ? 48 : 58) : compact ? 42 : 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: Math.max(compact ? 13 : 22, leftInset + 12), paddingRight: Math.max(compact ? 13 : 22, rightInset + 12) }}>
      <Pressable
        testID="practice.pause"
        accessibilityRole="button"
        accessibilityLabel={t('Pause practice')}
        disabled={!snapshot || snapshot.phase === 'paused' || snapshot.phase === 'finished'}
        onPress={onPause}
        hitSlop={12}
      >
        <Text style={{ color: colors.muted, fontSize: compact ? 11 : 12, fontWeight: '800', letterSpacing: 1 }}>Ⅱ  PAUSE</Text>
      </Pressable>
      <View testID="practice.beatCounter" style={{ alignItems: 'center', justifyContent: 'center', minWidth: snapshot?.resumeCountIn ? Math.min(520, Math.max(200, width * 0.5)) : 90, minHeight: snapshot?.resumeCountIn ? (compact ? 48 : 58) : 38 }}>
        {snapshot?.resumeCountIn ? (
          <>
            <Text testID="practice.resumeCountIn" style={{ color: colors.accent, fontSize: compact ? 7 : 9, fontWeight: '900', letterSpacing: 1.2 }}>LISTEN</Text>
            <Text
              testID="practice.resumeStartNote"
              accessibilityLabel={t('START WITH') + ': ' + resumeStartLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
              style={{ maxWidth: '100%', color: colors.text, fontSize: compact ? 8 : 10, lineHeight: compact ? 11 : 13, fontWeight: '800', textAlign: 'center' }}
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
      <View style={{ alignItems: 'flex-end', justifyContent: 'center', minWidth: compact ? 74 : 112 }}>
        {remainingLabel ? (
          <Text
            testID={scoreBarsRemaining === undefined ? 'practice.timeRemaining' : 'practice.barsRemaining'}
            accessibilityLabel={scoreBarsRemaining === undefined
              ? remainingLabel === 'ENDLESS' ? t('Endless session') : t('{time} remaining', { time: remainingLabel.replace(' LEFT', '') })
              : t('{count} {unit} remaining', { count: scoreBarsRemaining, unit: t(scoreBarsRemaining === 1 ? 'bar' : 'bars') })}
            numberOfLines={1}
            style={{ color: colors.accent, fontSize: compact ? 8 : 10, lineHeight: compact ? 11 : 13, fontWeight: '900', letterSpacing: 0.8 }}
          >
            {remainingLabel}
          </Text>
        ) : null}
        {snapshot && showNextPattern && snapshot.phase === 'running' && changeCountdown !== undefined ? (
          <Text testID="practice.changeCountdown.label" style={{ color: colors.muted, fontSize: compact ? 7 : 9, lineHeight: compact ? 9 : 11, fontWeight: '900', letterSpacing: compact ? 0.5 : 0.8 }}>
            {t('NEXT CHANGE')}
          </Text>
        ) : null}
        <View
          testID="practice.changeCountdown"
          accessibilityRole="text"
          accessibilityLabel={snapshot && showNextPattern && snapshot.phase === 'running' && changeCountdown !== undefined
            ? t('Next pattern change in {count} {unit}', { count: changeCountdown, unit: t(changeCountdown === 1 ? 'beat' : 'beats') })
            : undefined}
          style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', minHeight: compact ? 25 : 34, gap: compact ? 4 : 7 }}
        >
          {snapshot && showNextPattern && snapshot.phase === 'running' && changeCountdown !== undefined ? (
            <>
              <Text testID="practice.nextPattern.countdown" style={{ color: colors.accent, fontSize: compact ? 21 : 30, lineHeight: compact ? 25 : 34, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{changeCountdown}</Text>
              <Text style={{ color: colors.accent, fontSize: compact ? 9 : 11, fontWeight: '900', letterSpacing: 1 }}>{changeCountdown === 1 ? 'BEAT' : 'BEATS'}</Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}
