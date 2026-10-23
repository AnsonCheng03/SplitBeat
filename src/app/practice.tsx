import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Countdown } from '@/components/Countdown';
import { HardwareKeyboardInput } from '@/components/HardwareKeyboardInput';
import { MetronomeIndicator } from '@/components/MetronomeIndicator';
import { NextPatternPreview } from '@/components/NextPatternPreview';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { ScrollingScoreRhythm } from '@/components/ScoreRhythmMeasure';
import { TapZone } from '@/components/TapZone';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import { useRhythmSession } from '@/store/sessionStore';
import type { Hand, TapFeedback } from '@/types/rhythm';
import { colors } from '@/theme';

export default function PracticeScreen() {
  const { height } = useWindowDimensions();
  const compact = height < 520;
  const router = useRouter();
  const {
    snapshot,
    settings,
    exercisePrepared,
    startPreparedExercise,
    registerTap,
    stopExercise,
    results,
  } = useRhythmSession();
  const hasNavigatedToResultsRef = useRef(false);
  const [tutorialVisible, setTutorialVisible] = useState(true);
  const [starting, setStarting] = useState(false);
  const [keyboardTapTokens, setKeyboardTapTokens] = useState<Record<Hand, { token: number; feedback: TapFeedback | null }>>({
    left: { token: 0, feedback: null },
    right: { token: 0, feedback: null },
  });

  const navigateToResults = useCallback(() => {
    if (hasNavigatedToResultsRef.current) return;
    hasNavigatedToResultsRef.current = true;
    router.replace('/results');
  }, [router]);

  useEffect(() => {
    if (!snapshot && !exercisePrepared) router.replace('/setup');
    else if (snapshot?.phase === 'finished' && results) navigateToResults();
  }, [exercisePrepared, navigateToResults, router, snapshot, results]);

  const stop = () => {
    stopExercise();
    navigateToResults();
  };

  const beginExercise = async () => {
    if (starting || !exercisePrepared) return;
    setStarting(true);
    try {
      await startPreparedExercise();
      setTutorialVisible(false);
    } catch {
      Alert.alert('Audio could not start', 'Check your device audio settings and try again.');
    } finally {
      setStarting(false);
    }
  };

  const handleKeyboardTap = useCallback(
    (hand: Hand, timestamp: number) => {
      const feedback = registerTap(hand, timestamp);
      setKeyboardTapTokens((current) => ({
        ...current,
        [hand]: { token: current[hand].token + 1, feedback },
      }));
    },
    [registerTap],
  );

  const enabledHand = (hand: Hand) => settings.trainingMode !== 'single-hand' || settings.singleHand === hand;
  const step = snapshot?.currentStep;
  const showNextPattern = Boolean(snapshot?.nextStep && !snapshot.scoreMeasure);
  const previewTop = compact ? 46 : 58;
  const previewHeight = compact ? 94 : 106;
  const rhythmDisplayTop = showNextPattern
    ? Math.max(height * 0.21, previewTop + previewHeight + 10)
    : height * 0.21;

  return (
    <SafeAreaView testID="practice.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <HardwareKeyboardInput onTap={handleKeyboardTap} />
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <TapZone
          hand="left"
          onTap={registerTap}
          hapticsEnabled={settings.hapticsEnabled}
          keyboardTapToken={keyboardTapTokens.left.token}
          keyboardTapFeedback={keyboardTapTokens.left.feedback}
          enabled={enabledHand('left')}
          resting={snapshot?.isRest}
          compact={compact}
          minimal
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%' }}
        />
        <TapZone
          hand="right"
          onTap={registerTap}
          hapticsEnabled={settings.hapticsEnabled}
          keyboardTapToken={keyboardTapTokens.right.token}
          keyboardTapFeedback={keyboardTapTokens.right.feedback}
          enabled={enabledHand('right')}
          resting={snapshot?.isRest}
          compact={compact}
          minimal
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%' }}
        />

        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: colors.line, opacity: 0.65 }}
        />

        {showNextPattern && snapshot?.nextStep ? (
          <NextPatternPreview
            step={snapshot.nextStep}
            beatsUntilChange={snapshot.beatsUntilChange}
            graceNotesEnabled={settings.graceNotesEnabled}
            restBeforeChange={settings.restBetweenChanges}
            compact={compact}
            timeSignature={settings.timeSignature}
            top={previewTop}
            height={previewHeight}
          />
        ) : null}

        {snapshot ? (
          <View
            testID="practice.rhythmDisplay"
            pointerEvents="none"
            style={{ position: 'absolute', top: rhythmDisplayTop, bottom: '5%', left: 0, right: 0, flexDirection: 'row', alignItems: 'center' }}
          >
            {snapshot.scoreMeasure ? (
              <View style={{ flex: 1 }}>
                <ScrollingScoreRhythm
                  measure={snapshot.scoreMeasure}
                  previousMeasure={snapshot.scorePreviousMeasure}
                  nextMeasure={snapshot.scoreNextMeasure ?? snapshot.scoreMeasure}
                  sequence={snapshot.scoreMeasureSequence ?? 0}
                  count={snapshot.scoreMeasureCount ?? 1}
                  compact={compact}
                  beamGroupQuarterNotes={pulseQuarterNotes(settings.timeSignature)}
                  minimal
                />
              </View>
            ) : (
              <>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: enabledHand('left') ? 1 : 0.12 }}>
                  {enabledHand('left') && step ? (
                    <RhythmSymbol subdivision={step.leftSubdivision} color={colors.left} compact={compact} timeSignature={settings.timeSignature} />
                  ) : null}
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: enabledHand('right') ? 1 : 0.12 }}>
                  {enabledHand('right') && step ? (
                    <RhythmSymbol subdivision={step.rightSubdivision} color={colors.right} compact={compact} timeSignature={settings.timeSignature} />
                  ) : null}
                </View>
              </>
            )}
          </View>
        ) : null}

        <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, minHeight: compact ? 42 : 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: compact ? 13 : 22 }}>
          <Pressable testID="practice.end" onPress={stop} hitSlop={12}>
            <Text style={{ color: colors.muted, fontSize: compact ? 11 : 12, fontWeight: '800', letterSpacing: 1 }}>
              ‹  END
            </Text>
          </Pressable>
          <View testID="practice.beatCounter" style={{ alignItems: 'center', justifyContent: 'center', minWidth: 90, minHeight: 38 }}>
            {snapshot?.countdown !== null && snapshot?.countdown !== undefined ? (
              <Countdown value={snapshot.countdown} compact={compact} />
            ) : snapshot ? (
              <MetronomeIndicator
                beatInBar={snapshot.beatInBar}
                beatsPerBar={snapshot.beatsPerBar}
                isRunning={snapshot.phase === 'running'}
                isRest={snapshot.isRest}
                compact={compact}
              />
            ) : null}
          </View>
          <View style={{ width: compact ? 35 : 48 }} />
        </View>

        {tutorialVisible ? (
          <Pressable
            testID="practice.tutorial"
            accessibilityRole="button"
            accessibilityLabel={settings.trainingMode === 'single-hand'
              ? `Tap anywhere to start. Use your ${settings.singleHand} hand on the ${settings.singleHand} half.`
              : 'Tap anywhere to start. Use your left hand on the left half and your right hand on the right half.'}
            disabled={starting}
            onPress={() => void beginExercise()}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, backgroundColor: 'rgba(7, 10, 14, 0.88)' }}
          >
            <View pointerEvents="none" style={{ alignItems: 'center', maxWidth: 420, gap: compact ? 8 : 10 }}>
              {settings.trainingMode === 'single-hand' ? (
                <>
                  <Text style={{ color: settings.singleHand === 'left' ? colors.left : colors.right, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.2 }}>
                    {settings.singleHand.toUpperCase()} HAND
                  </Text>
                  <Text style={{ color: colors.text, fontSize: compact ? 18 : 22, fontWeight: '800', textAlign: 'center' }}>
                    Tap the {settings.singleHand} half with your {settings.singleHand} hand.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ color: colors.left, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.2 }}>
                    LEFT HAND → LEFT HALF
                  </Text>
                  <Text style={{ color: colors.right, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.2 }}>
                    RIGHT HAND → RIGHT HALF
                  </Text>
                </>
              )}
              <Text style={{ color: colors.muted, fontSize: compact ? 12 : 14, fontWeight: '700', letterSpacing: 1, marginTop: compact ? 23 : 30 }}>
                {starting ? 'STARTING…' : 'TAP ANYWHERE TO START'}
              </Text>
              {!settings.soundEnabled ? (
                <Text testID="practice.soundWarning" style={{ color: colors.danger, fontSize: 11, textAlign: 'center', marginTop: 14 }}>
                  Sound is off. Turn it on in Settings to hear the beat.
                </Text>
              ) : null}
            </View>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
