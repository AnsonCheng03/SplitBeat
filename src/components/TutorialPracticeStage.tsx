import { Pressable, View } from 'react-native';
import { TutorialNotationPreview } from '@/components/TutorialNotationPreview';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { TutorialModeStep } from '@/features/tutorial/tutorialFlow';
import type { Hand } from '@/types/rhythm';
import {
  tutorialStyleBeatCount,
  tutorialStyleFeedback,
  tutorialStyleHint,
  tutorialStylePracticeActions,
  tutorialStylePracticeButton,
  tutorialStylePracticeButtonLabel,
} from '@/styles/tutorial';

export function TutorialPracticeStage({
  mode,
  beatIndex,
  expectedHand,
  feedback,
  compact,
  onTapHand,
}: {
  mode: TutorialModeStep;
  beatIndex: number;
  expectedHand: Hand;
  feedback: 'correct' | 'retry' | null;
  compact: boolean;
  onTapHand: (hand: Hand) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const feedbackText = feedback === 'retry'
    ? t('That was the other hand. Start this bar again from beat one.')
    : feedback === 'correct'
      ? t('Correct. Continue to beat {beat}.', { beat: beatIndex + 1 })
      : '';

  return (
    <>
      <Text testID="tutorial.beatCount" style={tutorialStyleBeatCount({ colors })}>
        {t('Beat {beat} of {count}', { beat: beatIndex + 1, count: 4 })}
      </Text>
      <TutorialNotationPreview displayMode={mode.displayMode} beatIndex={beatIndex} compact={compact} />
      <Text testID="tutorial.hint" accessibilityLiveRegion="polite" style={tutorialStyleHint({ colors, hand: expectedHand, compact })}>
        {t(expectedHand === 'left' ? 'Beat {beat}: tap the left side.' : 'Beat {beat}: tap the right side.', { beat: beatIndex + 1 })}
      </Text>
      {feedbackText ? (
        <Text testID="tutorial.feedback" accessibilityLiveRegion="polite" style={tutorialStyleFeedback({ colors, retry: feedback === 'retry', compact })}>
          {feedbackText}
        </Text>
      ) : null}
      <View style={tutorialStylePracticeActions({ compact })}>
        <PracticeHandButton hand="left" compact={compact} onPress={onTapHand} />
        <PracticeHandButton hand="right" compact={compact} onPress={onTapHand} />
      </View>
    </>
  );
}

function PracticeHandButton({ hand, compact, onPress }: { hand: Hand; compact: boolean; onPress: (hand: Hand) => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Pressable
      testID={`tutorial.tap${hand === 'left' ? 'Left' : 'Right'}`}
      accessibilityRole="button"
      accessibilityLabel={t(hand === 'left' ? 'Tap the left side' : 'Tap the right side')}
      onPress={() => onPress(hand)}
      style={({ pressed }) => tutorialStylePracticeButton({ colors, hand, pressed, compact })}
    >
      <Text style={tutorialStylePracticeButtonLabel({ colors, hand })}>{t(hand.toUpperCase())}</Text>
    </Pressable>
  );
}
