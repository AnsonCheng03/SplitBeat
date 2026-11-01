import { useEffect } from 'react';
import { BackHandler, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MetronomeIndicator } from '@/components/MetronomeIndicator';
import { TutorialPracticeStage } from '@/components/TutorialPracticeStage';
import { TutorialSkipControl } from '@/components/TutorialSkipControl';
import { TutorialTransitionStage } from '@/components/TutorialTransitionStage';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTutorialPractice } from '@/features/tutorial/useTutorialPractice';
import { useTheme } from '@/theme/ThemeProvider';
import {
  tutorialStyleContent,
  tutorialStyleDivider,
  tutorialStyleHandSurface,
  tutorialStyleModeTitle,
  tutorialStyleOverlay,
  tutorialStyleStepTitle,
  tutorialStyleTopCounter,
  tutorialStyleTopLabel,
} from '@/styles/tutorial';

export function AppTutorialOverlay({ onDismiss }: { onDismiss: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < 500;
  const { phase, mode, modeIndex, beatIndex, expectedHand, feedback, tapHand, startBarView } = useTutorialPractice();
  const isPractice = phase === 'practice';

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  return (
    <View testID="tutorial.overlay" style={tutorialStyleOverlay({ colors })}>
      <View pointerEvents="none" style={tutorialStyleHandSurface({ hand: 'left', colors })} />
      <View pointerEvents="none" style={tutorialStyleHandSurface({ hand: 'right', colors })} />
      <View pointerEvents="none" style={tutorialStyleDivider({ colors })} />

      {isPractice ? (
        <>
          <View pointerEvents="none" style={tutorialStyleTopCounter({ top: insets.top + (compact ? 4 : 8) })}>
            <MetronomeIndicator
              beatInBar={beatIndex}
              beatsPerBar={4}
              isRunning
              compact={compact}
              beatPositionTestID="tutorial.beatCount"
            />
          </View>
          <View pointerEvents="none" style={tutorialStyleTopLabel({ top: insets.top + (compact ? 4 : 8), rightInset: insets.right })}>
            <Text style={tutorialStyleStepTitle({ colors })}>
              {t('TUTORIAL · MODE {step} OF 2', { step: modeIndex + 1 })}
            </Text>
            <Text testID="tutorial.title" style={tutorialStyleModeTitle({ colors, compact })}>{t(mode.title)}</Text>
          </View>
        </>
      ) : null}

      <TutorialSkipControl onSkip={onDismiss} />
      <View style={tutorialStyleContent()}>
        {isPractice ? (
          <TutorialPracticeStage
            mode={mode}
            beatIndex={beatIndex}
            expectedHand={expectedHand}
            feedback={feedback}
            compact={compact}
            topInset={insets.top}
            bottomInset={insets.bottom}
            onTapHand={tapHand}
          />
        ) : (
          <TutorialTransitionStage
            phase={phase}
            compact={compact}
            topInset={insets.top}
            bottomInset={insets.bottom}
            onContinue={startBarView}
            onDone={onDismiss}
          />
        )}
      </View>
    </View>
  );
}
