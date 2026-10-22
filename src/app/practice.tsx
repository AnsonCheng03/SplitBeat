import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccuracyDisplay } from '@/components/AccuracyDisplay';
import { Countdown } from '@/components/Countdown';
import { HardwareKeyboardInput } from '@/components/HardwareKeyboardInput';
import { MetronomeIndicator } from '@/components/MetronomeIndicator';
import { NextPatternPreview } from '@/components/NextPatternPreview';
import { PianoRhythmStaff } from '@/components/PianoRhythmStaff';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { ScoreRhythmMeasure } from '@/components/ScoreRhythmMeasure';
import { TapZone } from '@/components/TapZone';
import { pulseQuarterNotes, SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { useRhythmSession } from '@/store/sessionStore';
import type { Hand, TapFeedback } from '@/types/rhythm';
import { colors } from '@/theme';

export default function PracticeScreen() {
  const { height } = useWindowDimensions();
  const compact = height < 520;
  const router = useRouter();
  const { snapshot, settings, updateSettings, audioStatus, registerTap, stopExercise, results } = useRhythmSession();
  const [keyboardTapTokens, setKeyboardTapTokens] = useState<Record<Hand, { token: number; feedback: TapFeedback | null }>>({
    left: { token: 0, feedback: null },
    right: { token: 0, feedback: null },
  });

  useEffect(() => {
    if (!snapshot) router.replace('/setup');
    if (snapshot?.phase === 'finished' && results) router.replace('/results');
  }, [router, snapshot, results]);

  const stop = () => {
    stopExercise();
    router.replace('/results');
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

  if (!snapshot) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  const step = snapshot.currentStep;
  const timeLabel = snapshot.secondsRemaining === null ? 'ENDLESS' : Math.ceil(snapshot.secondsRemaining) + 's';

  return (
    <SafeAreaView testID="practice.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <HardwareKeyboardInput onTap={handleKeyboardTap} />
      <View style={{ flex: 1, paddingHorizontal: compact ? 12 : 18, paddingTop: compact ? 2 : 8, paddingBottom: compact ? 3 : 9, maxWidth: 950, width: '100%', alignSelf: 'center' }}>
        <View style={{ minHeight: compact ? 38 : 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable testID="practice.end" onPress={stop} hitSlop={12}>
            <Text style={{ color: colors.muted, fontSize: compact ? 11 : 12, fontWeight: '800', letterSpacing: 1 }}>
              ‹  END
            </Text>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: compact ? 22 : 28, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
              {snapshot.bpm}
              <Text style={{ color: colors.muted, fontSize: compact ? 11 : 12, fontWeight: '700' }}> BPM</Text>
            </Text>
            <Text testID="practice.timeSignature" style={{ color: colors.muted, fontSize: compact ? 10 : 11, fontWeight: '700' }}>
              {snapshot.timeSignature}
            </Text>
            <Text testID="practice.feel" style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '700' }}>
              {settings.feel === 'swing' ? 'SWING' : 'STRAIGHT'}
            </Text>
            <Text testID="practice.mode" style={{ color: colors.dim, fontSize: compact ? 7 : 8, fontWeight: '800', letterSpacing: 0.6 }}>
              {settings.trainingMode === 'single-hand' ? `${settings.singleHand.toUpperCase()} HAND ONLY` : 'TWO HANDS'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', minWidth: 75 }}>
            <Pressable
              testID="practice.soundToggle"
              accessibilityRole="button"
              accessibilityLabel={settings.soundEnabled ? 'Sound on. Tap to mute.' : 'Sound off. Tap to enable.'}
              onPress={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              hitSlop={8}
            >
              <Text
                testID="practice.soundStatus"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={{ color: settings.soundEnabled ? colors.left : colors.danger, fontSize: compact ? 8 : 9, fontWeight: '900', letterSpacing: compact ? 0.1 : 0.35 }}
              >
                {settings.soundEnabled ? 'SOUND ON' : audioStatus === 'ready' ? 'SOUND OFF · TAP TO ENABLE' : 'AUDIO OFF · TAP TO ENABLE'}
              </Text>
            </Pressable>
            <Text style={{ color: colors.muted, fontSize: compact ? 10 : 11, fontWeight: '700', marginTop: 2 }}>{timeLabel}</Text>
          </View>
        </View>

        {!snapshot.scoreMeasure ? (
          <View style={{ height: compact ? 36 : 40, justifyContent: 'center', alignItems: 'center', overflow: 'visible' }}>
            <NextPatternPreview
              step={snapshot.nextStep}
              beatsUntilChange={snapshot.beatsUntilChange}
              graceNotesEnabled={settings.graceNotesEnabled}
              restBeforeChange={snapshot.isRest}
              compact={compact}
              timeSignature={settings.timeSignature}
            />
          </View>
        ) : null}

        <View style={{ height: compact ? 40 : 60, justifyContent: 'center' }}>
          <MetronomeIndicator
            beatInBar={snapshot.beatInBar}
            beatsPerBar={snapshot.beatsPerBar}
            isRunning={snapshot.phase === 'running'}
            isRest={snapshot.isRest}
            compact={compact}
          />
        </View>
        <View style={{ minHeight: compact ? 24 : 36, justifyContent: 'center' }}>
          <Countdown value={snapshot.countdown} compact={compact} />
        </View>

        <View
          testID="practice.rhythmDisplay"
          style={{ flex: compact ? 0.8 : 0.95, minHeight: compact ? 88 : 130, maxHeight: compact ? 116 : 190, justifyContent: 'center', marginTop: compact ? 1 : 5, marginBottom: compact ? 2 : 7 }}
        >
          {snapshot.scoreMeasure ? (
            <>
              <Text numberOfLines={1} style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '700', textAlign: 'center' }}>
                {snapshot.scoreTitle}
              </Text>
              <ScoreRhythmMeasure
                measure={snapshot.scoreMeasure}
                number={snapshot.scoreMeasureNumber ?? 1}
                count={snapshot.scoreMeasureCount ?? 1}
                compact={compact}
                beamGroupQuarterNotes={pulseQuarterNotes(settings.timeSignature)}
              />
            </>
          ) : settings.practiceDisplay === 'piano-staff' ? (
            <PianoRhythmStaff
              steps={snapshot.barSteps}
              barStartBeat={snapshot.barStartBeat}
              timeSignature={settings.timeSignature}
              feel={settings.feel}
              restBetweenChanges={settings.restBetweenChanges}
              activeHand={settings.trainingMode === 'single-hand' ? settings.singleHand : undefined}
              compact={compact}
            />
          ) : (
            <View style={{ flex: 1, minHeight: compact ? 78 : 130, maxHeight: compact ? 112 : 190, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: colors.line, opacity: settings.trainingMode === 'single-hand' && settings.singleHand !== 'left' ? 0.38 : 1 }}>
                <Text style={{ color: colors.left, fontSize: compact ? 10 : 11, fontWeight: '800', letterSpacing: 1.6 }}>{settings.trainingMode === 'single-hand' && settings.singleHand !== 'left' ? 'LEFT · REST' : 'LEFT HAND'}</Text>
                {settings.trainingMode === 'single-hand' && settings.singleHand !== 'left' ? <View style={{ height: compact ? 56 : 68 }} /> : <RhythmSymbol subdivision={step.leftSubdivision} color={colors.left} compact={compact} timeSignature={settings.timeSignature} />}
                <Text numberOfLines={2} style={{ color: colors.text, fontSize: compact ? 12 : 14, fontWeight: '700', textAlign: 'center', paddingHorizontal: 6 }}>
                  {settings.trainingMode === 'single-hand' && settings.singleHand !== 'left' ? 'Not playing' : SUBDIVISION_LABELS[step.leftSubdivision]}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: settings.trainingMode === 'single-hand' && settings.singleHand !== 'right' ? 0.38 : 1 }}>
                <Text style={{ color: colors.right, fontSize: compact ? 10 : 11, fontWeight: '800', letterSpacing: 1.6 }}>{settings.trainingMode === 'single-hand' && settings.singleHand !== 'right' ? 'RIGHT · REST' : 'RIGHT HAND'}</Text>
                {settings.trainingMode === 'single-hand' && settings.singleHand !== 'right' ? <View style={{ height: compact ? 56 : 68 }} /> : <RhythmSymbol subdivision={step.rightSubdivision} color={colors.right} compact={compact} timeSignature={settings.timeSignature} />}
                <Text numberOfLines={2} style={{ color: colors.text, fontSize: compact ? 12 : 14, fontWeight: '700', textAlign: 'center', paddingHorizontal: 6 }}>
                  {settings.trainingMode === 'single-hand' && settings.singleHand !== 'right' ? 'Not playing' : SUBDIVISION_LABELS[step.rightSubdivision]}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ minHeight: compact ? 34 : 48, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: compact ? 3 : 5 }}>
            <Text style={{ color: colors.muted, fontSize: compact ? 10 : 11 }}>ACCURACY</Text>
          </View>
          <AccuracyDisplay
            left={snapshot.leftAccuracy}
            right={snapshot.rightAccuracy}
            trainingMode={settings.trainingMode}
            singleHand={settings.singleHand}
            compact={compact}
          />
        </View>

        <View style={{ flex: 1.25, minHeight: compact ? 100 : 180, flexDirection: 'row', marginTop: compact ? 3 : 8 }}>
          <TapZone
            hand="left"
            onTap={registerTap}
            hapticsEnabled={settings.hapticsEnabled}
            keyboardTapToken={keyboardTapTokens.left.token}
            keyboardTapFeedback={keyboardTapTokens.left.feedback}
            enabled={settings.trainingMode !== 'single-hand' || settings.singleHand === 'left'}
            resting={snapshot.isRest}
            compact={compact}
          />
          <TapZone
            hand="right"
            onTap={registerTap}
            hapticsEnabled={settings.hapticsEnabled}
            keyboardTapToken={keyboardTapTokens.right.token}
            keyboardTapFeedback={keyboardTapTokens.right.feedback}
            enabled={settings.trainingMode !== 'single-hand' || settings.singleHand === 'right'}
            resting={snapshot.isRest}
            compact={compact}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
