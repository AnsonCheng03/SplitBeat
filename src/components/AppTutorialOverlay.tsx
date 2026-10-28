import { Modal, useWindowDimensions, View } from 'react-native';
import { TutorialPracticeStage } from '@/components/TutorialPracticeStage';
import { TutorialSkipControl } from '@/components/TutorialSkipControl';
import { TutorialTransitionStage } from '@/components/TutorialTransitionStage';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTutorialPractice } from '@/features/tutorial/useTutorialPractice';
import { useTheme } from '@/theme/ThemeProvider';
import {
  tutorialStyleCard,
  tutorialStyleHeader,
  tutorialStyleIntroDescription,
  tutorialStyleIntroTitle,
  tutorialStyleOverlay,
  tutorialStyleStepTitle,
} from '@/styles/tutorial';

export function AppTutorialOverlay({ onDismiss }: { onDismiss: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { height } = useWindowDimensions();
  const compact = height < 500;
  const { phase, mode, modeIndex, beatIndex, expectedHand, feedback, tapHand, startBarView } = useTutorialPractice();
  const isPractice = phase === 'practice';
  const heading = t(phase === 'complete' ? 'Tutorial complete' : mode.title);

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View testID="tutorial.overlay" style={tutorialStyleOverlay()}>
        <TutorialSkipControl onSkip={onDismiss} />
        <View style={tutorialStyleCard({ colors, compact })}>
          <View style={tutorialStyleHeader({ compact })}>
            <Text style={tutorialStyleStepTitle({ colors })}>
              {t(phase === 'complete' ? 'TUTORIAL' : 'TUTORIAL · MODE {step} OF 2', { step: modeIndex + 1 })}
            </Text>
          </View>
          <Text testID="tutorial.title" style={tutorialStyleIntroTitle({ colors, compact })}>{heading}</Text>
          {isPractice ? (
            <>
              <Text style={tutorialStyleIntroDescription({ colors, compact })}>{t(mode.description)}</Text>
              <TutorialPracticeStage
                mode={mode}
                beatIndex={beatIndex}
                expectedHand={expectedHand}
                feedback={feedback}
                compact={compact}
                onTapHand={tapHand}
              />
            </>
          ) : (
            <TutorialTransitionStage
              phase={phase}
              compact={compact}
              onContinue={startBarView}
              onDone={onDismiss}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
