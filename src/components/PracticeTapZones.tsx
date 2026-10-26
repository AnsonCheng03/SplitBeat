import { View } from 'react-native';
import { TapZone } from '@/components/TapZone';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExerciseSettings, Hand, SessionSnapshot, TapFeedback } from '@/types/rhythm';
import { PracticeTapZonesStyle1, PracticeTapZonesStyle2, PracticeTapZonesStyle3, PracticeTapZonesStyle4 } from '@/styles/practice';

type KeyboardTokens = Record<Hand, { token: number; feedback: TapFeedback | null }>;

export function PracticeTapZones({
  settings,
  snapshot,
  compact,
  tapFeedbackEnabled,
  scoreDisplay,
  beatFlashToken,
  keyboardTapTokens,
  onTap,
}: {
  settings: ExerciseSettings;
  snapshot: SessionSnapshot | null;
  compact: boolean;
  tapFeedbackEnabled: boolean;
  scoreDisplay: boolean;
  beatFlashToken: number;
  keyboardTapTokens: KeyboardTokens;
  onTap: (hand: Hand, timestamp: number) => TapFeedback | null;
}) {
  const { colors } = useTheme();
  const hands: readonly Hand[] = settings.trainingMode === 'single-hand' ? [settings.singleHand] : ['left', 'right'];

  return (
    <View pointerEvents="box-none" style={PracticeTapZonesStyle1()}>
      {hands.map((hand) => {
        const singleHand = settings.trainingMode === 'single-hand';
        const flashSource = tapFeedbackEnabled
          ? hand === 'left' ? settings.leftFlashSource : settings.rightFlashSource
          : 'beat';
        return (
          <TapZone
            key={hand}
            hand={hand}
            testID={singleHand ? 'practice.tap.single' : undefined}
            onTap={onTap}
            hapticsEnabled={settings.hapticsEnabled}
            tapResultFlashEnabled={tapFeedbackEnabled && settings.tapResultFlashEnabled}
            flashSource={flashSource}
            beatFlashToken={tapFeedbackEnabled ? beatFlashToken : 0}
            singleHand={singleHand}
            accessibilityLabelOverride={singleHand ? 'One-hand full-screen tap area' : undefined}
            keyboardTapToken={keyboardTapTokens[hand].token}
            keyboardTapFeedback={keyboardTapTokens[hand].feedback}
            enabled={singleHand || settings.trainingMode !== 'single-hand' || settings.singleHand === hand}
            resting={snapshot?.isRest}
            compact={compact}
            minimal
            showMinimalLabel={!singleHand && scoreDisplay}
            style={singleHand
              ? PracticeTapZonesStyle2()
              : PracticeTapZonesStyle3({ hand })}
          />
        );
      })}
      {settings.trainingMode === 'two-hand' ? (
        <View pointerEvents="none" style={PracticeTapZonesStyle4({ colors })} />
      ) : null}
    </View>
  );
}
