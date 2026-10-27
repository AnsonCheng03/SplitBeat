import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { APP_TUTORIAL_STEPS, isLastTutorialStep, nextTutorialStepIndex, previousTutorialStepIndex } from '@/features/tutorial/tutorialFlow';
import {
  appTutorialStyle1,
  appTutorialStyle2,
  appTutorialStyle3,
  appTutorialStyle4,
  appTutorialStyle5,
  appTutorialStyle6,
  appTutorialStyle7,
  appTutorialStyle8,
  appTutorialStyle9,
  appTutorialStyle10,
  appTutorialStyle11,
  appTutorialStyle12,
  appTutorialStyle13,
  appTutorialStyle14,
  appTutorialStyle15,
} from '@/styles/tutorial';

export function AppTutorialOverlay({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const step = APP_TUTORIAL_STEPS[stepIndex];
  const lastStep = isLastTutorialStep(stepIndex);

  const advance = () => {
    if (lastStep) onDismiss();
    else setStepIndex((current) => nextTutorialStepIndex(current));
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View testID="tutorial.overlay" style={appTutorialStyle1()}>
        <View style={appTutorialStyle2({ colors })}>
          <View style={appTutorialStyle3()}>
            <Text style={appTutorialStyle4({ colors })}>{t('QUICK TOUR')}</Text>
            <Pressable
              testID="tutorial.close"
              accessibilityRole="button"
              accessibilityLabel={t('Close tutorial')}
              onPress={onDismiss}
              style={({ pressed }) => appTutorialStyle5({ pressed, colors })}
            >
              <Text style={appTutorialStyle6({ colors })}>×</Text>
            </Pressable>
          </View>

          <View style={appTutorialStyle7()}>
            <Text style={appTutorialStyle8({ colors })}>
              {t('STEP {step} OF {count}', { step: stepIndex + 1, count: APP_TUTORIAL_STEPS.length })}
            </Text>
            <Text testID="tutorial.title" style={appTutorialStyle9({ colors })}>{t(step.title)}</Text>
            <Text style={appTutorialStyle10({ colors })}>{t(step.description)}</Text>
          </View>

          <View accessibilityLabel={t('Tutorial progress')} style={appTutorialStyle11()}>
            {APP_TUTORIAL_STEPS.map((tutorialStep, index) => (
              <View
                key={tutorialStep.title}
                accessibilityState={{ selected: index === stepIndex }}
                style={appTutorialStyle12({ colors, selected: index === stepIndex })}
              />
            ))}
          </View>

          <View style={appTutorialStyle13()}>
            <Pressable
              testID="tutorial.skip"
              accessibilityRole="button"
              onPress={onDismiss}
              style={({ pressed }) => appTutorialStyle5({ pressed, colors, secondary: true })}
            >
              <Text style={appTutorialStyle14({ colors, secondary: true })}>{t('Skip')}</Text>
            </Pressable>
            <View style={appTutorialStyle15()} />
            {stepIndex > 0 ? (
              <Pressable
                testID="tutorial.back"
                accessibilityRole="button"
                onPress={() => setStepIndex((current) => previousTutorialStepIndex(current))}
                style={({ pressed }) => appTutorialStyle5({ pressed, colors, secondary: true })}
              >
                <Text style={appTutorialStyle14({ colors, secondary: true })}>{t('Back')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              testID={lastStep ? 'tutorial.done' : 'tutorial.next'}
              accessibilityRole="button"
              onPress={advance}
              style={({ pressed }) => appTutorialStyle5({ pressed, colors })}
            >
              <Text style={appTutorialStyle14({ colors })}>{t(lastStep ? 'Done' : 'Next')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
