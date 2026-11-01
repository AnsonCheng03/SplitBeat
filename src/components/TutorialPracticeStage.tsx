import { Pressable, View } from 'react-native';
import { TutorialNotationPreview } from '@/components/TutorialNotationPreview';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { TutorialModeStep } from '@/features/tutorial/tutorialFlow';
import type { Hand } from '@/types/rhythm';
import {
  tutorialStyleFeedback,
  tutorialStyleHint,
  tutorialStyleNotationLayer,
  tutorialStylePreview,
  tutorialStylePrompt,
  tutorialStylePracticeStage,
  tutorialStyleTapTarget,
} from '@/styles/tutorial';

export function TutorialPracticeStage({
  mode,
  beatIndex,
  expectedHand,
  feedback,
  compact,
  topInset,
  bottomInset,
  onTapHand,
}: {
  mode: TutorialModeStep;
  beatIndex: number;
  expectedHand: Hand;
  feedback: 'correct' | 'retry' | null;
  compact: boolean;
  topInset: number;
  bottomInset: number;
  onTapHand: (hand: Hand) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const feedbackText = feedback === 'retry'
    ? t('That was the other hand. Start this bar again from beat one.')
    : feedback === 'correct'
      ? t('Correct. Continue to beat {beat}.', { beat: beatIndex + 1 })
      : '';
  const hint = t(expectedHand === 'left' ? 'Beat {beat}: tap the left side.' : 'Beat {beat}: tap the right side.', { beat: beatIndex + 1 });

  return (
    <View testID="tutorial.practiceStage" style={tutorialStylePracticeStage()}>
      <PracticeTapTarget hand="left" onTap={onTapHand} />
      <PracticeTapTarget hand="right" onTap={onTapHand} />

      <View pointerEvents="none" style={tutorialStyleNotationLayer({ topInset, bottomInset, compact })}>
        <View style={tutorialStylePreview({ compact })}>
          <TutorialNotationPreview displayMode={mode.displayMode} beatIndex={beatIndex} compact={compact} />
        </View>
      </View>

      <View pointerEvents="none" style={tutorialStylePrompt({ bottom: bottomInset + (compact ? 14 : 22), compact })}>
        <Text testID="tutorial.hint" accessibilityLiveRegion="polite" style={tutorialStyleHint({ colors, hand: expectedHand, compact })}>
          {hint}
        </Text>
        {feedbackText ? (
          <Text testID="tutorial.feedback" accessibilityLiveRegion="polite" style={tutorialStyleFeedback({ colors, retry: feedback === 'retry', compact })}>
            {feedbackText}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function PracticeTapTarget({ hand, onTap }: { hand: Hand; onTap: (hand: Hand) => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Pressable
      testID={`tutorial.tap${hand === 'left' ? 'Left' : 'Right'}`}
      accessibilityRole="button"
      accessibilityLabel={t(hand === 'left' ? 'Tap the left side' : 'Tap the right side')}
      style={({ pressed }) => tutorialStyleTapTarget({ hand, colors, pressed })}
      onPress={() => onTap(hand)}
    />
  );
}
