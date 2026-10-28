import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import type { RhythmMissionTapScore } from '@/rhythm/rhythmMissions';
import { useTheme } from '@/theme/ThemeProvider';
import {
  RhythmMissionTapPadStyle1,
  RhythmMissionTapPadStyle2,
  RhythmMissionTapPadStyle3,
  RhythmMissionTapPadStyle4,
  RhythmMissionTapPadStyle5,
  RhythmMissionTapPadStyle6,
} from '@/styles/rhythmMissions';

export function RhythmMissionTapPad({
  answerActive,
  promptPlayed,
  tapCount,
  bpm,
  score,
  onStart,
  onTap,
  onRetry,
}: {
  answerActive: boolean;
  promptPlayed: boolean;
  tapCount: number;
  bpm: number;
  score: RhythmMissionTapScore | null;
  onStart: () => void;
  onTap: () => void;
  onRetry: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={RhythmMissionTapPadStyle1({ colors })}>
      <Text style={RhythmMissionTapPadStyle2({ colors })}>{t('ECHO THE RHYTHM')}</Text>
      <Text style={RhythmMissionTapPadStyle3({ colors })}>
        {answerActive ? t('Tap the pattern now. The first press starts the rhythm.') : promptPlayed ? t('Listen again, then tap the rhythm back on this pad.') : t('Play the prompt before starting your answer.')}
      </Text>
      <Pressable
        testID="mission.tapPad"
        accessibilityRole="button"
        accessibilityLabel={answerActive ? t('Tap the rhythm') : t('Start your answer with the first tap')}
        disabled={(!promptPlayed && !answerActive) || (Boolean(score) && !answerActive)}
        onPress={answerActive ? onTap : score ? undefined : onStart}
        style={({ pressed }) => RhythmMissionTapPadStyle4({ active: answerActive, disabled: !promptPlayed && !answerActive, pressed, colors })}
      >
        <Text style={RhythmMissionTapPadStyle5({ colors })}>
          {answerActive ? t('TAP') : score ? t('ANSWER RECORDED') : t('START · FIRST TAP')}
        </Text>
        <Text style={RhythmMissionTapPadStyle6({ colors })}>
          {answerActive ? t('{count} taps', { count: tapCount }) : t('4 beats · {bpm} BPM', { bpm })}
        </Text>
      </Pressable>
      {score ? (
        <View>
          <Text testID="mission.tapScore" style={RhythmMissionTapPadStyle2({ colors })}>
            {score.passed ? t('Correct! Mission complete.') : t('Your score: {score}% · {correct}/{expected} taps.', {
              score: score.accuracyPercent,
              correct: score.correctTaps,
              expected: score.expectedTaps,
            })}
          </Text>
          {!score.passed ? (
            <Pressable testID="mission.tapRetry" accessibilityRole="button" onPress={onRetry}>
              <Text style={RhythmMissionTapPadStyle3({ colors })}>{t('TRY AGAIN')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
