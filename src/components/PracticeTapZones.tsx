import { View } from 'react-native';
import { TapZone } from '@/components/TapZone';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExerciseSettings, Hand, SessionSnapshot, TapFeedback } from '@/types/rhythm';

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
    <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
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
              ? { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }
              : { position: 'absolute', [hand === 'left' ? 'left' : 'right']: 0, top: 0, bottom: 0, width: '50%' }}
          />
        );
      })}
      {settings.trainingMode === 'two-hand' ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: colors.line, opacity: 0.65 }} />
      ) : null}
    </View>
  );
}
