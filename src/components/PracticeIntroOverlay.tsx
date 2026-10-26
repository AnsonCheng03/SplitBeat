import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExerciseSettings } from '@/types/rhythm';

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
      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.background }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
        {singleHand ? (
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Math.max(28, leftInset + 28, rightInset + 28) }}>
            <Text style={{ color: colors.accent, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.2 }}>ONE HAND · FULL SCREEN</Text>
            <Text style={{ color: colors.text, fontSize: compact ? 18 : 22, fontWeight: '800', textAlign: 'center', marginTop: 9 }}>Use either hand</Text>
          </View>
        ) : (
          <>
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }}>
              <Text style={{ color: colors.left, fontSize: compact ? 12 : 15, fontWeight: '900', letterSpacing: 1.3, textAlign: 'center' }}>LEFT HAND</Text>
              <Text style={{ color: colors.text, fontSize: compact ? 14 : 19, fontWeight: '800', textAlign: 'center', marginTop: 9 }}>Tap left half</Text>
            </View>
            <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }}>
              <Text style={{ color: colors.right, fontSize: compact ? 12 : 15, fontWeight: '900', letterSpacing: 1.3, textAlign: 'center' }}>RIGHT HAND</Text>
              <Text style={{ color: colors.text, fontSize: compact ? 14 : 19, fontWeight: '800', textAlign: 'center', marginTop: 9 }}>Tap right half</Text>
            </View>
            <View style={{ position: 'absolute', top: '22%', bottom: '22%', left: '50%', width: 1, backgroundColor: colors.line, opacity: 0.9 }} />
          </>
        )}
        <View style={{ position: 'absolute', left: 12, right: 12, bottom: Math.max(20, bottomInset + 14), alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.4, textAlign: 'center' }}>{starting ? 'STARTING…' : 'TAP ANYWHERE TO START'}</Text>
          {!soundEnabled ? (
            <Text testID="practice.soundWarning" style={{ color: colors.danger, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
              Sound is off. Turn it on in Settings to hear the beat.
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
