import { Pressable, View } from 'react-native';
import { TutorialNotationPreview } from '@/components/TutorialNotationPreview';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { TutorialPhase } from '@/features/tutorial/tutorialFlow';
import {
  tutorialStyleAction,
  tutorialStyleActionLabel,
  tutorialStyleActions,
  tutorialStyleIntroDescription,
} from '@/styles/tutorial';

export function TutorialTransitionStage({
  phase,
  compact,
  onContinue,
  onDone,
}: {
  phase: Extract<TutorialPhase, 'mode-intro' | 'complete'>;
  compact: boolean;
  onContinue: () => void;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const isComplete = phase === 'complete';

  return (
    <>
      <Text style={tutorialStyleIntroDescription({ colors, compact })}>
        {t(isComplete
          ? 'You practiced the same rhythm as individual notes and as a full bar.'
          : 'Now read the whole bar from left to right, then tap the hand for each beat.')}
      </Text>
      {!isComplete ? <TutorialNotationPreview displayMode="score" beatIndex={0} compact={compact} /> : null}
      <View style={tutorialStyleActions({ compact })}>
        <Pressable
          testID={isComplete ? 'tutorial.done' : 'tutorial.startBarView'}
          accessibilityRole="button"
          onPress={isComplete ? onDone : onContinue}
          style={({ pressed }) => tutorialStyleAction({ colors, pressed, compact })}
        >
          <Text style={tutorialStyleActionLabel({ colors })}>{t(isComplete ? 'Done' : 'Continue to bar view')}</Text>
        </Pressable>
      </View>
    </>
  );
}
