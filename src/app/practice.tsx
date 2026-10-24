import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Countdown } from '@/components/Countdown';
import { HardwareKeyboardInput } from '@/components/HardwareKeyboardInput';
import { MetronomeIndicator } from '@/components/MetronomeIndicator';
import { NextPatternPreview } from '@/components/NextPatternPreview';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { ScoreFocusNote } from '@/components/ScoreFocusNote';
import { ScrollingScoreRhythm } from '@/components/ScoreRhythmMeasure';
import { TapZone } from '@/components/TapZone';
import { findNextScoreEvent, type ScoreDisplayMode } from '@/rhythm/scoreStaff';
import { pulseQuarterNotes, SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { useRhythmSession } from '@/store/sessionStore';
import type { Hand, TapFeedback } from '@/types/rhythm';
import { colors } from '@/theme';

export default function PracticeScreen() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 520;
  const router = useRouter();
  const { lessonId: rawLessonId, scoreDisplayMode: rawScoreDisplayMode } = useLocalSearchParams<{
    lessonId?: string;
    scoreDisplayMode?: string;
  }>();
  const lessonId = Array.isArray(rawLessonId) ? rawLessonId[0] : rawLessonId;
  const scoreDisplayModeParam = Array.isArray(rawScoreDisplayMode) ? rawScoreDisplayMode[0] : rawScoreDisplayMode;
  const scoreDisplayMode: ScoreDisplayMode = scoreDisplayModeParam === 'focus' ? 'focus' : 'staff';
  const {
    snapshot,
    settings,
    sessionSettings,
    exercisePrepared,
    startPreparedExercise,
    registerTap,
    stopExercise,
    resumeExercise,
    results,
  } = useRhythmSession();
  const activeSettings = sessionSettings ?? settings;
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
    router.replace(lessonId ? { pathname: '/results', params: { lessonId } } : '/results');
  }, [lessonId, router]);

  useEffect(() => {
    if (!snapshot && !exercisePrepared) router.replace(lessonId ? '/learn' : '/setup');
    else if (!exercisePrepared && snapshot?.phase === 'finished' && results) navigateToResults();
  }, [exercisePrepared, lessonId, navigateToResults, router, snapshot, results]);

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
      const scoringHand = activeSettings.trainingMode === 'single-hand' ? activeSettings.singleHand : hand;
      const feedback = registerTap(scoringHand, timestamp);
      setKeyboardTapTokens((current) => ({
        ...current,
        [scoringHand]: { token: current[scoringHand].token + 1, feedback },
      }));
    },
    [registerTap, activeSettings.singleHand, activeSettings.trainingMode],
  );

  const enabledHand = (hand: Hand) => activeSettings.trainingMode !== 'single-hand' || activeSettings.singleHand === hand;
  const singleHandMode = activeSettings.trainingMode === 'single-hand';
  const focusedHand = activeSettings.singleHand;
  const step = snapshot?.currentStep;
  const beatFlashToken = snapshot?.phase === 'running' ? snapshot.beatIndex + 1 : 0;
  const showNextPattern = Boolean(!snapshot?.scoreMeasure && snapshot?.nextStep);
  const previewTop = Math.max(insets.top, 8) + (compact ? 46 : 58);
  const previewHeight = snapshot?.scoreMeasure
    ? Math.min(220, Math.max(112, height * 0.25))
    : compact ? 62 : 74;
  const changeCountdown = snapshot?.scoreMeasure ? undefined : snapshot?.beatsUntilChange;
  const scoreHandToShow = singleHandMode ? focusedHand : undefined;
  const scoreHandColor = scoreHandToShow === 'left' ? colors.left : colors.right;
  const scoreMeasure = snapshot?.scoreMeasure;
  const scoreQuarterInMeasure = snapshot?.scoreQuarterInMeasure ?? 0;
  const scoreSequence = snapshot?.scoreMeasureSequence ?? 0;
  const scoreFocusEvents = scoreMeasure
    ? {
        left: findNextScoreEvent(scoreMeasure, snapshot?.scoreNextMeasure ?? scoreMeasure, 'left', scoreQuarterInMeasure),
        right: findNextScoreEvent(scoreMeasure, snapshot?.scoreNextMeasure ?? scoreMeasure, 'right', scoreQuarterInMeasure),
      }
    : undefined;
  const rhythmDisplayStyle = snapshot?.scoreMeasure
    ? {
        top: Math.max(insets.top, 8) + (compact ? 46 : 58),
        height: Math.min(180, Math.max(110, height * 0.25)),
      }
    : { top: -insets.top, bottom: -insets.bottom };

  const resumeFromChallenge = async () => {
    try {
      await resumeExercise();
    } catch {
      Alert.alert('Could not resume audio', 'Check your device audio settings and try again.');
    }
  };

  return (
    <View testID="practice.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <HardwareKeyboardInput onTap={handleKeyboardTap} />
      <View style={{ flex: 1 }}>
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', top: -insets.top, bottom: -insets.bottom, left: -insets.left, right: -insets.right }}
        >
          {singleHandMode ? (
            <TapZone
              hand={focusedHand}
              testID="practice.tap.single"
              onTap={registerTap}
              hapticsEnabled={activeSettings.hapticsEnabled}
              tapResultFlashEnabled={activeSettings.tapResultFlashEnabled}
              flashSource={focusedHand === 'left' ? activeSettings.leftFlashSource : activeSettings.rightFlashSource}
              beatFlashToken={beatFlashToken}
              singleHand
              accessibilityLabelOverride="One-hand full-screen tap area"
              keyboardTapToken={keyboardTapTokens[focusedHand].token}
              keyboardTapFeedback={keyboardTapTokens[focusedHand].feedback}
              resting={snapshot?.isRest}
              compact={compact}
              minimal
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
          ) : (
            <>
              <TapZone
                hand="left"
                onTap={registerTap}
                hapticsEnabled={activeSettings.hapticsEnabled}
                tapResultFlashEnabled={activeSettings.tapResultFlashEnabled}
                flashSource={activeSettings.leftFlashSource}
                beatFlashToken={beatFlashToken}
                keyboardTapToken={keyboardTapTokens.left.token}
                keyboardTapFeedback={keyboardTapTokens.left.feedback}
                enabled={enabledHand('left')}
                resting={snapshot?.isRest}
                compact={compact}
                minimal
                showMinimalLabel={Boolean(snapshot?.scoreMeasure)}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%' }}
              />
              <TapZone
                hand="right"
                onTap={registerTap}
                hapticsEnabled={activeSettings.hapticsEnabled}
                tapResultFlashEnabled={activeSettings.tapResultFlashEnabled}
                flashSource={activeSettings.rightFlashSource}
                beatFlashToken={beatFlashToken}
                keyboardTapToken={keyboardTapTokens.right.token}
                keyboardTapFeedback={keyboardTapTokens.right.feedback}
                enabled={enabledHand('right')}
                resting={snapshot?.isRest}
                compact={compact}
                minimal
                showMinimalLabel={Boolean(snapshot?.scoreMeasure)}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%' }}
              />

              <View
                pointerEvents="none"
                style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: colors.line, opacity: 0.65 }}
              />
            </>
          )}
        </View>

        {showNextPattern && snapshot ? (
          <NextPatternPreview
            step={snapshot.scoreMeasure ? null : snapshot.nextStep}
            beatsUntilChange={snapshot.beatsUntilChange}
            graceNotesEnabled={activeSettings.graceNotesEnabled}
            restBeforeChange={activeSettings.restBetweenChanges}
            compact={compact}
            timeSignature={activeSettings.timeSignature}
            leftInset={insets.left}
            rightInset={insets.right}
            top={previewTop}
            height={previewHeight}
            scoreMeasure={snapshot.scoreNextMeasure}
            scoreMeasureNumber={snapshot.scoreMeasureCount && snapshot.scoreMeasureSequence !== undefined
              ? (snapshot.scoreMeasureSequence + 1) % snapshot.scoreMeasureCount + 1
              : undefined}
            scoreMeasureCount={snapshot.scoreMeasureCount}
            scoreMeasureSequence={snapshot.scoreMeasureSequence}
            scoreBeatsUntilChange={snapshot.beatsPerBar - snapshot.beatInBar}
            beamGroupQuarterNotes={pulseQuarterNotes(activeSettings.timeSignature)}
            focusedHand={singleHandMode ? focusedHand : undefined}
          />
        ) : null}

        {snapshot ? (
          <View
            testID="practice.rhythmDisplay"
            pointerEvents="none"
            style={[{ position: 'absolute', left: -insets.left, right: -insets.right, flexDirection: 'row', alignItems: 'center', backgroundColor: snapshot.scoreMeasure ? colors.surface : 'transparent' }, rhythmDisplayStyle]}
          >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: snapshot.scoreMeasure ? Math.max(16, insets.left + 18, insets.right + 18) : 0 }}>
              {snapshot.scoreMeasure ? (
                scoreDisplayMode === 'staff' ? (
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                  <ScrollingScoreRhythm
                    measure={snapshot.scoreMeasure}
                    previousMeasure={snapshot.scorePreviousMeasure}
                    nextMeasure={snapshot.scoreNextMeasure ?? snapshot.scoreMeasure}
                    upcomingMeasures={snapshot.scoreUpcomingMeasures}
                    sequence={scoreSequence}
                    count={snapshot.scoreMeasureCount ?? 1}
                    compact={compact}
                    beamGroupQuarterNotes={pulseQuarterNotes(activeSettings.timeSignature)}
                    minimal
                    visibleHand={scoreHandToShow}
                    focusedColor={singleHandMode ? scoreHandColor : undefined}
                  />
                </View>
              ) : (
                singleHandMode ? (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: scoreHandColor, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 }}>{focusedHand.toUpperCase()} HAND</Text>
                    <ScoreFocusNote event={scoreFocusEvents?.[focusedHand]} color={scoreHandColor} testID="practice.scoreFocusNote" />
                  </View>
                ) : (
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Text style={{ color: colors.left, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 }}>LEFT HAND</Text>
                      <ScoreFocusNote event={scoreFocusEvents?.left} color={colors.left} testID="practice.scoreFocusNote.left" />
                    </View>
                    <View style={{ width: 1, height: 84, backgroundColor: colors.line, opacity: 0.7 }} />
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Text style={{ color: colors.right, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 }}>RIGHT HAND</Text>
                      <ScoreFocusNote event={scoreFocusEvents?.right} color={colors.right} testID="practice.scoreFocusNote.right" />
                    </View>
                  </View>
                )
              ) ) : singleHandMode && step ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10 }}>
                <Text style={{ color: colors.accent, fontSize: compact ? 11 : 14, fontWeight: '900', letterSpacing: 2 }}>
                  {focusedHand.toUpperCase()}
                </Text>
                <RhythmSymbol
                  subdivision={focusedHand === 'left' ? step.leftSubdivision : step.rightSubdivision}
                  color={colors.accent}
                  compact={compact}
                  timeSignature={activeSettings.timeSignature}
                  scale={compact ? 1.35 : 1.8}
                />
                <Text style={{ color: colors.text, fontSize: compact ? 13 : 17, fontWeight: '800' }}>
                  {SUBDIVISION_LABELS[focusedHand === 'left' ? step.leftSubdivision : step.rightSubdivision]}
                </Text>
              </View>
            ) : (
              <>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10, opacity: enabledHand('left') ? 1 : 0.12 }}>
                  {enabledHand('left') && step ? (
                    <>
                      <Text style={{ color: colors.left, fontSize: compact ? 11 : 14, fontWeight: '900', letterSpacing: 2 }}>LEFT</Text>
                      <RhythmSymbol subdivision={step.leftSubdivision} color={colors.left} compact={compact} timeSignature={activeSettings.timeSignature} scale={compact ? 1.35 : 1.8} />
                      <Text style={{ color: colors.text, fontSize: compact ? 13 : 17, fontWeight: '800' }}>{SUBDIVISION_LABELS[step.leftSubdivision]}</Text>
                    </>
                  ) : null}
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10, opacity: enabledHand('right') ? 1 : 0.12 }}>
                  {enabledHand('right') && step ? (
                    <>
                      <Text style={{ color: colors.right, fontSize: compact ? 11 : 14, fontWeight: '900', letterSpacing: 2 }}>RIGHT</Text>
                      <RhythmSymbol subdivision={step.rightSubdivision} color={colors.right} compact={compact} timeSignature={activeSettings.timeSignature} scale={compact ? 1.35 : 1.8} />
                      <Text style={{ color: colors.text, fontSize: compact ? 13 : 17, fontWeight: '800' }}>{SUBDIVISION_LABELS[step.rightSubdivision]}</Text>
                    </>
                  ) : null}
                </View>
              </>
              )}
            </View>
          </View>
        ) : null}

        <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top, left: 0, right: 0, minHeight: compact ? 42 : 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: Math.max(compact ? 13 : 22, insets.left + 12), paddingRight: Math.max(compact ? 13 : 22, insets.right + 12) }}>
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
                isPaused={snapshot.phase === 'paused'}
                compact={compact}
              />
            ) : null}
          </View>
          <View testID="practice.changeCountdown" style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', minWidth: compact ? 74 : 112, gap: compact ? 4 : 7 }}>
            {snapshot && showNextPattern && snapshot.phase === 'running' && changeCountdown !== undefined ? (
              <>
                <Text testID="practice.nextPattern.countdown" style={{ color: colors.accent, fontSize: compact ? 21 : 30, lineHeight: compact ? 25 : 34, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
                  {changeCountdown}
                </Text>
                <Text style={{ color: colors.accent, fontSize: compact ? 9 : 11, fontWeight: '900', letterSpacing: 1 }}>
                  {changeCountdown === 1 ? 'BEAT' : 'BEATS'}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {tutorialVisible ? (
          <Pressable
            testID="practice.tutorial"
            accessibilityRole="button"
            accessibilityLabel={activeSettings.trainingMode === 'single-hand'
              ? 'Tap anywhere to start. Use either hand to tap anywhere during the exercise.'
              : 'Tap anywhere to start. Use your left hand on the left half and your right hand on the right half.'}
            disabled={starting}
            onPress={() => void beginExercise()}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(7, 10, 14, 0.62)' }}
          >
            <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
              {activeSettings.trainingMode === 'single-hand' ? (
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Math.max(28, insets.left + 28, insets.right + 28) }}>
                  <Text style={{ color: colors.accent, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.2 }}>
                    ONE HAND · FULL SCREEN
                  </Text>
                  <Text style={{ color: colors.text, fontSize: compact ? 18 : 22, fontWeight: '800', textAlign: 'center', marginTop: 9 }}>
                    Use either hand
                  </Text>
                </View>
              ) : (
                <>
                  <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }}>
                    <Text style={{ color: colors.left, fontSize: compact ? 12 : 15, fontWeight: '900', letterSpacing: 1.3, textAlign: 'center' }}>
                      LEFT HAND
                    </Text>
                    <Text style={{ color: colors.text, fontSize: compact ? 14 : 19, fontWeight: '800', textAlign: 'center', marginTop: 9 }}>
                      Tap left half
                    </Text>
                  </View>
                  <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }}>
                    <Text style={{ color: colors.right, fontSize: compact ? 12 : 15, fontWeight: '900', letterSpacing: 1.3, textAlign: 'center' }}>
                      RIGHT HAND
                    </Text>
                    <Text style={{ color: colors.text, fontSize: compact ? 14 : 19, fontWeight: '800', textAlign: 'center', marginTop: 9 }}>
                      Tap right half
                    </Text>
                  </View>
                  <View style={{ position: 'absolute', top: '22%', bottom: '22%', left: '50%', width: 1, backgroundColor: colors.line, opacity: 0.9 }} />
                </>
              )}
              <View style={{ position: 'absolute', left: 12, right: 12, bottom: Math.max(20, insets.bottom + 14), alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.4, textAlign: 'center' }}>
                  {starting ? 'STARTING…' : 'TAP ANYWHERE TO START'}
                </Text>
                {!activeSettings.soundEnabled ? (
                  <Text testID="practice.soundWarning" style={{ color: colors.danger, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
                    Sound is off. Turn it on in Settings to hear the beat.
                  </Text>
                ) : null}
              </View>
            </View>
          </Pressable>
        ) : null}

        {snapshot?.phase === 'paused' ? (
          <View testID="practice.challengePause" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7, 10, 14, 0.72)', paddingHorizontal: 24 }}>
            <View style={{ width: '100%', maxWidth: 460, alignItems: 'center', padding: compact ? 18 : 26, borderRadius: 20, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.surface }}>
              <Text style={{ color: colors.accent, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.6 }}>
                CHALLENGE PAUSE
              </Text>
              <Text style={{ color: colors.text, fontSize: compact ? 17 : 22, lineHeight: compact ? 23 : 29, fontWeight: '800', textAlign: 'center', marginTop: 10 }}>
                {snapshot.challengeMessage ?? 'Take a breath, then continue when you are ready.'}
              </Text>
              <Pressable testID="practice.challengeResume" accessibilityRole="button" onPress={() => void resumeFromChallenge()} style={{ minHeight: 54, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginTop: 20, borderRadius: 14, backgroundColor: colors.accent }}>
                <Text style={{ color: colors.background, fontSize: 14, fontWeight: '900', letterSpacing: 1.1 }}>CONTINUE</Text>
              </Pressable>
              <Pressable testID="practice.challengeEnd" accessibilityRole="button" onPress={stop} style={{ minHeight: 44, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '900', letterSpacing: 1 }}>END SESSION</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
