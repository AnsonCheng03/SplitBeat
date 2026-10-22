import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccuracyDisplay } from '@/components/AccuracyDisplay';
import { Countdown } from '@/components/Countdown';
import { HardwareKeyboardInput } from '@/components/HardwareKeyboardInput';
import { MetronomeIndicator } from '@/components/MetronomeIndicator';
import { NextPatternPreview } from '@/components/NextPatternPreview';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { ScoreRhythmMeasure } from '@/components/ScoreRhythmMeasure';
import { TapZone } from '@/components/TapZone';
import { pulseQuarterNotes, SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { useRhythmSession } from '@/store/sessionStore';
import type { Hand } from '@/types/rhythm';
import { colors } from '@/theme';

export default function PracticeScreen() {
  const { height } = useWindowDimensions();
  const compact = height < 520;
  const router = useRouter();
  const { snapshot, settings, registerTap, stopExercise, results } = useRhythmSession();
  const [keyboardTapTokens, setKeyboardTapTokens] = useState<Record<Hand, number>>({ left: 0, right: 0 });

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
      setKeyboardTapTokens((current) => ({ ...current, [hand]: current[hand] + 1 }));
      registerTap(hand, timestamp);
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
        <View style={{ minHeight: compact ? 32 : 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
          </View>
          <View style={{ alignItems: 'flex-end', minWidth: 54 }}>
            <Text style={{ color: colors.muted, fontSize: compact ? 10 : 11, fontWeight: '700' }}>{timeLabel}</Text>
          </View>
        </View>

        <View style={{ height: compact ? 40 : 60, justifyContent: 'center' }}>
          <MetronomeIndicator
            beatInBar={snapshot.beatInBar}
            beatsPerBar={snapshot.beatsPerBar}
            isRunning={snapshot.phase === 'running'}
            compact={compact}
          />
        </View>
        <View style={{ minHeight: compact ? 24 : 36, justifyContent: 'center' }}>
          <Countdown value={snapshot.countdown} compact={compact} />
        </View>

        {snapshot.scoreMeasure ? (
          <View style={{ flex: compact ? 0.8 : 0.95, minHeight: compact ? 88 : 122, maxHeight: compact ? 116 : 160, justifyContent: 'center', marginTop: compact ? 1 : 5, marginBottom: compact ? 2 : 7 }}>
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
          </View>
        ) : (
          <>
            <View style={{ flex: compact ? 0.8 : 0.95, minHeight: compact ? 78 : 130, maxHeight: compact ? 112 : 190, flexDirection: 'row', alignItems: 'center', marginTop: compact ? 1 : 5, marginBottom: compact ? 2 : 7 }}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: colors.line }}>
                <Text style={{ color: colors.left, fontSize: compact ? 10 : 11, fontWeight: '800', letterSpacing: 1.6 }}>LEFT HAND</Text>
                <RhythmSymbol subdivision={step.leftSubdivision} color={colors.left} compact={compact} />
                <Text numberOfLines={2} style={{ color: colors.text, fontSize: compact ? 12 : 14, fontWeight: '700', textAlign: 'center', paddingHorizontal: 6 }}>
                  {SUBDIVISION_LABELS[step.leftSubdivision]}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.right, fontSize: compact ? 10 : 11, fontWeight: '800', letterSpacing: 1.6 }}>RIGHT HAND</Text>
                <RhythmSymbol subdivision={step.rightSubdivision} color={colors.right} compact={compact} />
                <Text numberOfLines={2} style={{ color: colors.text, fontSize: compact ? 12 : 14, fontWeight: '700', textAlign: 'center', paddingHorizontal: 6 }}>
                  {SUBDIVISION_LABELS[step.rightSubdivision]}
                </Text>
              </View>
            </View>

            <NextPatternPreview
              step={snapshot.nextStep}
              beatsUntilChange={snapshot.beatsUntilChange}
              secondsUntilChange={snapshot.secondsUntilChange}
              graceNotesEnabled={settings.graceNotesEnabled}
              compact={compact}
            />
          </>
        )}

        <View style={{ minHeight: compact ? 34 : 48, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: compact ? 3 : 5 }}>
            <Text style={{ color: colors.muted, fontSize: compact ? 10 : 11 }}>ACCURACY</Text>
          </View>
          <AccuracyDisplay left={snapshot.leftAccuracy} right={snapshot.rightAccuracy} compact={compact} />
        </View>

        <View style={{ flex: 1.25, minHeight: compact ? 100 : 180, flexDirection: 'row', marginTop: compact ? 3 : 8 }}>
          <TapZone
            hand="left"
            onTap={registerTap}
            hapticsEnabled={settings.hapticsEnabled}
            keyboardTapToken={keyboardTapTokens.left}
            compact={compact}
          />
          <TapZone
            hand="right"
            onTap={registerTap}
            hapticsEnabled={settings.hapticsEnabled}
            keyboardTapToken={keyboardTapTokens.right}
            compact={compact}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
