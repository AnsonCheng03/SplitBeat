import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExerciseSettings } from '@/types/rhythm';
import {
  PracticeIntroOverlayStyle1,
  PracticeIntroOverlayStyle2,
  PracticeIntroOverlayStyle3,
  PracticeIntroOverlayStyle4,
  PracticeIntroOverlayStyle5,
  PracticeIntroOverlayStyle6,
  PracticeIntroOverlayStyle7,
  PracticeIntroOverlayStyle8,
  PracticeIntroOverlayStyle9,
  PracticeIntroOverlayStyle10,
  PracticeIntroOverlayStyle11,
  PracticeIntroOverlayStyle12,
  PracticeIntroOverlayStyle13,
  PracticeIntroOverlayStyle14,
  PracticeIntroOverlayStyle15
} from '@/styles/practice';

export function PracticeIntroOverlay({
  settings,
  compact,
  leftInset,
  rightInset,
  bottomInset,
  starting,
  soundEnabled,
  onStart,
}: {
  settings: ExerciseSettings;
  compact: boolean;
  leftInset: number;
  rightInset: number;
  bottomInset: number;
  starting: boolean;
  soundEnabled: boolean;
  onStart: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const singleHand = settings.trainingMode === 'single-hand';

  return (
    <Pressable
      testID="practice.tutorial"
      accessibilityRole="button"
      accessibilityLabel={t(singleHand
        ? 'Tap anywhere to start. Use either hand to tap anywhere during the exercise.'
        : 'Tap anywhere to start. Use your left hand on the left half and your right hand on the right half.')}
      disabled={starting}
      onPress={onStart}
      style={PracticeIntroOverlayStyle1({ colors })}
    >
      <View pointerEvents="none" style={PracticeIntroOverlayStyle2()}>
        {singleHand ? (
          <View style={PracticeIntroOverlayStyle3({ leftInset, rightInset })}>
            <Text style={PracticeIntroOverlayStyle4({ colors, compact })}>ONE HAND · FULL SCREEN</Text>
            <Text style={PracticeIntroOverlayStyle5({ colors, compact })}>Use either hand</Text>
          </View>
        ) : (
          <>
            <View style={PracticeIntroOverlayStyle6()}>
              <Text style={PracticeIntroOverlayStyle7({ colors, compact })}>LEFT HAND</Text>
              <Text style={PracticeIntroOverlayStyle8({ colors, compact })}>Tap left half</Text>
            </View>
            <View style={PracticeIntroOverlayStyle9()}>
              <Text style={PracticeIntroOverlayStyle10({ colors, compact })}>RIGHT HAND</Text>
              <Text style={PracticeIntroOverlayStyle11({ colors, compact })}>Tap right half</Text>
            </View>
            <View style={PracticeIntroOverlayStyle12({ colors })} />
          </>
        )}
        <View style={PracticeIntroOverlayStyle13({ bottomInset })}>
          <Text style={PracticeIntroOverlayStyle14({ colors, compact })}>{starting ? 'STARTING…' : 'TAP ANYWHERE TO START'}</Text>
          {!soundEnabled ? (
            <Text testID="practice.soundWarning" style={PracticeIntroOverlayStyle15({ colors })}>
              Sound is off. Turn it on in Settings to hear the beat.
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
