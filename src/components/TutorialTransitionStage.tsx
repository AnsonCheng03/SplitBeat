import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { TutorialPhase } from '@/features/tutorial/tutorialFlow';
import {
  tutorialStyleAction,
  tutorialStyleActionLabel,
  tutorialStyleActions,
  tutorialStyleStepTitle,
  tutorialStyleTransitionBody,
  tutorialStyleTransitionDescription,
  tutorialStyleTransitionStage,
  tutorialStyleTransitionTitle,
} from '@/styles/tutorial';

export function TutorialTransitionStage({
  phase,
  compact,
  topInset,
  bottomInset,
  onContinue,
  onDone,
}: {
  phase: Extract<TutorialPhase, 'mode-intro' | 'complete'>;
  compact: boolean;
  topInset: number;
  bottomInset: number;
  onContinue: () => void;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const isComplete = phase === 'complete';

  return (
    <View style={tutorialStyleTransitionStage({ topInset, bottomInset })}>
      <View style={tutorialStyleTransitionBody()}>
        <Text style={tutorialStyleStepTitle({ colors })}>
          {t(isComplete ? 'TUTORIAL' : 'TUTORIAL · MODE 2 OF 2')}
        </Text>
        <Text testID="tutorial.title" style={tutorialStyleTransitionTitle({ colors, compact })}>
          {t(isComplete ? 'Tutorial complete' : 'BAR VIEW')}
        </Text>
        <Text style={tutorialStyleTransitionDescription({ colors, compact })}>
          {t(isComplete
            ? 'You practiced the same rhythm as individual notes and as a full bar.'
            : 'Now read the whole bar from left to right, then tap the hand for each beat.')}
        </Text>
      </View>
      <View style={tutorialStyleActions()}>
        <Pressable
          testID={isComplete ? 'tutorial.done' : 'tutorial.startBarView'}
          accessibilityRole="button"
          onPress={isComplete ? onDone : onContinue}
          style={({ pressed }) => tutorialStyleAction({ colors, pressed, compact })}
        >
          <Text style={tutorialStyleActionLabel({ colors })}>{t(isComplete ? 'Done' : 'Continue to bar view')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
