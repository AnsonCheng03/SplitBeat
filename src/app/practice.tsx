import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Slider from '@react-native-community/slider';
import { BlurTargetView } from 'expo-blur';
import { Alert, AppState, Pressable, useWindowDimensions, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Countdown } from '@/components/Countdown';
import { HardwareKeyboardInput } from '@/components/HardwareKeyboardInput';
import { LivePracticeSettings } from '@/components/LivePracticeSettings';
import { MixtureSymbol } from '@/components/MixtureSymbol';
import { MetronomeIndicator } from '@/components/MetronomeIndicator';
import { NextPatternPreview } from '@/components/NextPatternPreview';
import { PracticeOverlayBackdrop } from '@/components/PracticeOverlayBackdrop';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { ScoreBeatFocus } from '@/components/ScoreBeatFocus';
import { ScrollingScoreRhythm } from '@/components/ScoreRhythmMeasure';
import { SessionEndingOverlay } from '@/components/SessionEndingOverlay';
import { TapZone } from '@/components/TapZone';
import { findNextScoreEvent, type ScoreDisplayMode } from '@/rhythm/scoreStaff';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import { getResumeStartNotes } from '@/rhythm/resumeStart';
import { useRhythmSession } from '@/store/sessionStore';
import type { Hand, TapFeedback } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';

function formatTimeRemaining(seconds: number, t: (source: string, values?: Record<string, string | number>) => string): string {
  const roundedSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = String(roundedSeconds % 60).padStart(2, '0');
  return t('{time} LEFT', { time: `${minutes}:${remainingSeconds}` });
}

export default function PracticeScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { width, height } = useWindowDimensions();
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
    featureFlags,
    updateSettings,
    snapshot,
    settings,
    sessionSettings,
    exercisePrepared,
    startPreparedExercise,
    registerTap,
    stopExercise,
    pauseExercise,
    resumeExercise,
    restartPausedExercise,
    restartExerciseWithFeel,
    results,
  } = useRhythmSession();
  const activeSettings = sessionSettings ?? settings;
  const tapFeedbackEnabled = featureFlags.tapFeedback;
  const blurTargetRef = useRef<View>(null);
  const hasStartedExitRef = useRef(false);
  const swingWarningDismissedRef = useRef(false);
  const lifecyclePhaseRef = useRef(snapshot?.phase);
  const pauseExerciseRef = useRef(pauseExercise);
  const appStateRef = useRef(AppState.currentState);
  useLayoutEffect(() => {
    lifecyclePhaseRef.current = snapshot?.phase;
    pauseExerciseRef.current = pauseExercise;
  });
  const [endingVisible, setEndingVisible] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(true);
  const [starting, setStarting] = useState(false);
  const [pauseActionLoading, setPauseActionLoading] = useState(false);
  const [earlySwingWarningVisible, setEarlySwingWarningVisible] = useState(false);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [bpmDraft, setBpmDraft] = useState(activeSettings.bpm);
  const [rewindBars, setRewindBars] = useState(1);
  const [keyboardTapTokens, setKeyboardTapTokens] = useState<Record<Hand, { token: number; feedback: TapFeedback | null }>>({
    left: { token: 0, feedback: null },
    right: { token: 0, feedback: null },
  });

  useFocusEffect(useCallback(() => {
    appStateRef.current = AppState.currentState;
    const pauseActiveSession = () => {
      const phase = lifecyclePhaseRef.current;
      if (phase === 'running' || phase === 'countdown') pauseExerciseRef.current();
    };
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;
      if (previousState === 'active' && nextState !== 'active') pauseActiveSession();
    });

    return () => {
      subscription.remove();
      pauseActiveSession();
    };
  }, []));

  const showEnding = useCallback(() => {
    if (hasStartedExitRef.current) return;
    hasStartedExitRef.current = true;
    setEndingVisible(true);
  }, []);

  const navigateToResults = useCallback(() => {
    router.replace(lessonId ? { pathname: '/results', params: { lessonId } } : '/results');
  }, [lessonId, router]);

  const shouldShowEarlySwingWarning = Boolean(
    !tutorialVisible &&
    snapshot?.phase === 'running' &&
    snapshot.swingFeelMismatch?.likelyStraight &&
    snapshot.swingFeelMismatch.latestBarIndex <= 3,
  );

  useEffect(() => {
    if (!snapshot && !exercisePrepared) router.replace(lessonId ? '/learn' : '/setup');
    else if (!exercisePrepared && snapshot?.phase === 'finished' && results) showEnding();
  }, [exercisePrepared, lessonId, router, showEnding, snapshot, results]);

  useEffect(() => {
    if (shouldShowEarlySwingWarning && !swingWarningDismissedRef.current) {
      setEarlySwingWarningVisible(true);
    }
  }, [shouldShowEarlySwingWarning]);

  const stop = () => {
    stopExercise();
  };

  const openPauseMenu = () => {
    if (!snapshot || snapshot.phase === 'paused' || snapshot.phase === 'finished') return;
    setBpmDraft(snapshot.bpm);
    setRewindBars(1);
    pauseExercise();
  };

  const continueFromPause = async () => {
    try {
      await resumeExercise();
    } catch {
      Alert.alert(t('Could not resume audio'), t('Check your device audio settings and try again.'));
    }
  };

  const restartFromPause = async (barsBack: number) => {
    if (pauseActionLoading) return;
    setPauseActionLoading(true);
    try {
      await restartPausedExercise(barsBack, bpmDraft);
    } catch {
      Alert.alert(t('Could not restart practice'), t('Try again, or continue at the current tempo.'));
    } finally {
      setPauseActionLoading(false);
    }
  };

  const restartWithStraightFeel = async () => {
    if (pauseActionLoading) return;
    setPauseActionLoading(true);
    try {
      swingWarningDismissedRef.current = true;
      setEarlySwingWarningVisible(false);
      await restartExerciseWithFeel('straight');
    } catch {
      Alert.alert(t('Could not restart practice'), t('Try again, or continue at the current tempo.'));
    } finally {
      setPauseActionLoading(false);
    }
  };

  const dismissEarlySwingWarning = () => {
    swingWarningDismissedRef.current = true;
    setEarlySwingWarningVisible(false);
  };

  const backHomeFromPause = () => {
    hasStartedExitRef.current = true;
    stopExercise();
    router.replace('/');
  };

  const beginExercise = async () => {
    if (starting || !exercisePrepared) return;
    setStarting(true);
    try {
      await startPreparedExercise();
      setTutorialVisible(false);
    } catch {
      Alert.alert(t('Audio could not start'), t('Check your device audio settings and try again.'));
    } finally {
      setStarting(false);
    }
  };

  const handleKeyboardTap = useCallback(
    (hand: Hand, timestamp: number) => {
      const scoringHand = activeSettings.trainingMode === 'single-hand' ? activeSettings.singleHand : hand;
      const feedback = registerTap(scoringHand, timestamp, 'keyboard');
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
  const scoreContentMargin = Math.max(16, insets.left + 18, insets.right + 18);
  const initialScoreContentWidth = Math.max(0, width - scoreContentMargin * 2);
  const initialScoreViewportWidth = Math.max(0, initialScoreContentWidth - 52);
  const initialScoreFocusWidth = Math.min(620, initialScoreContentWidth * (singleHandMode ? 0.76 : 0.38));
  const step = snapshot?.currentStep;
  const beatFlashToken = snapshot?.phase === 'running' ? snapshot.beatIndex + 1 : 0;
  const importedScoreMeasure = snapshot?.scoreMeasure;
  const practiceScoreMeasure = activeSettings.practiceDisplayMode === 'score'
    ? snapshot?.practiceScoreMeasure
    : undefined;
  const displayScoreMeasure = importedScoreMeasure ?? practiceScoreMeasure;
  const isScoreDisplay = Boolean(displayScoreMeasure);
  const isScoreFocusDisplay = Boolean(importedScoreMeasure && scoreDisplayMode === 'focus');
  const scoreDisplayTop = Math.max(insets.top, 8) + (compact ? 46 : 58);
  const scoreDisplayHeight = compact
    ? Math.min(180, Math.max(110, height * 0.25))
    : Math.min(200, Math.max(136, height * 0.27));
  const showNextPattern = Boolean(!isScoreDisplay && snapshot?.nextStep);
  const previewTop = Math.max(insets.top, 8) + (compact ? 46 : 58);
  const previewHeight = isScoreDisplay
    ? Math.min(220, Math.max(112, height * 0.25))
    : compact ? 88 : 104;
  const changeCountdown = isScoreDisplay ? undefined : snapshot?.beatsUntilChange;
  const scoreHandToShow = singleHandMode ? focusedHand : undefined;
  const scoreHandColor = scoreHandToShow === 'left' ? colors.left : colors.right;
  const scoreMeasure = importedScoreMeasure;
  const scoreQuarterInMeasure = snapshot?.scoreQuarterInMeasure ?? 0;
  const scoreSequence = snapshot?.scoreMeasureSequence ?? 0;
  const displayScoreSequence = importedScoreMeasure
    ? snapshot?.scoreMeasureSequence ?? 0
    : snapshot?.practiceScoreSequence ?? 0;
  const displayScoreCount = importedScoreMeasure
    ? snapshot?.scoreMeasureCount ?? 1
    : snapshot?.practiceScoreCount ?? 1;
  const displayScorePreviousMeasure = importedScoreMeasure
    ? snapshot?.scorePreviousMeasure
    : snapshot?.practiceScorePreviousMeasure;
  const displayScoreNextMeasure = importedScoreMeasure
    ? snapshot?.scoreNextMeasure
    : snapshot?.practiceScoreNextMeasure;
  const displayScoreUpcomingMeasures = importedScoreMeasure
    ? snapshot?.scoreUpcomingMeasures
    : snapshot?.practiceScoreUpcomingMeasures;
  const maxRewindBars = Math.max(0, snapshot?.scoreMeasure?.index ?? 0);
  const scoreBarsRemaining = snapshot?.scoreMeasureCount === undefined
    ? undefined
    : snapshot.phase === 'finished'
      ? 0
      : Math.max(0, snapshot.scoreMeasureCount - scoreSequence);
  const remainingLabel = scoreBarsRemaining !== undefined
    ? t('{count} {unit} LEFT', { count: scoreBarsRemaining, unit: t(scoreBarsRemaining === 1 ? 'BAR' : 'BARS') })
    : snapshot?.secondsRemaining !== null && snapshot?.secondsRemaining !== undefined
      ? formatTimeRemaining(snapshot.secondsRemaining, t)
      : snapshot
        ? 'ENDLESS'
        : '';
  const scoreFocusEvents = scoreMeasure
    ? {
        left: findNextScoreEvent(scoreMeasure, snapshot?.scoreNextMeasure, 'left', scoreQuarterInMeasure),
        right: findNextScoreEvent(scoreMeasure, snapshot?.scoreNextMeasure, 'right', scoreQuarterInMeasure),
      }
    : undefined;
  const resumeStartNotes = snapshot?.resumeCountIn && step
    ? getResumeStartNotes({
        step,
        singleHand: singleHandMode,
        focusedHand,
        scoreEvents: importedScoreMeasure ? scoreFocusEvents : undefined,
      })
    : [];
  const resumeStartLabel = resumeStartNotes
    .map(({ hand, label }) => `${t(hand === 'left' ? 'LEFT HAND' : 'RIGHT HAND')}: ${t(label)}`)
    .join('  ·  ');
  const rhythmDisplayStyle = isScoreDisplay
    && !isScoreFocusDisplay
    ? {
        top: scoreDisplayTop,
        height: scoreDisplayHeight,
      }
    : { top: -insets.top, bottom: -insets.bottom };

  const resumeFromChallenge = async () => {
    try {
      await resumeExercise();
    } catch {
      Alert.alert(t('Could not resume audio'), t('Check your device audio settings and try again.'));
    }
  };

  const endingResults = results ?? snapshot?.results;
  const endingExpected = endingResults ? endingResults.left.totalExpected + endingResults.right.totalExpected : 0;
  const endingHits = endingResults ? endingResults.left.totalHit + endingResults.right.totalHit : 0;
  const endingAccuracy = endingExpected === 0 ? 0 : endingHits / endingExpected * 100;

  return (
    <View testID="practice.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      {featureFlags.externalKeyboard ? <HardwareKeyboardInput onTap={handleKeyboardTap} /> : null}
      <BlurTargetView ref={blurTargetRef} collapsable={false} style={{ flex: 1 }}>
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
              tapResultFlashEnabled={tapFeedbackEnabled && activeSettings.tapResultFlashEnabled}
              flashSource={tapFeedbackEnabled ? (focusedHand === 'left' ? activeSettings.leftFlashSource : activeSettings.rightFlashSource) : 'beat'}
              beatFlashToken={tapFeedbackEnabled ? beatFlashToken : 0}
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
                tapResultFlashEnabled={tapFeedbackEnabled && activeSettings.tapResultFlashEnabled}
                flashSource={tapFeedbackEnabled ? activeSettings.leftFlashSource : 'beat'}
                beatFlashToken={tapFeedbackEnabled ? beatFlashToken : 0}
                keyboardTapToken={keyboardTapTokens.left.token}
                keyboardTapFeedback={keyboardTapTokens.left.feedback}
                enabled={enabledHand('left')}
                resting={snapshot?.isRest}
                compact={compact}
                minimal
                showMinimalLabel={isScoreDisplay && !isScoreFocusDisplay}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%' }}
              />
              <TapZone
                hand="right"
                onTap={registerTap}
                hapticsEnabled={activeSettings.hapticsEnabled}
                tapResultFlashEnabled={tapFeedbackEnabled && activeSettings.tapResultFlashEnabled}
                flashSource={tapFeedbackEnabled ? activeSettings.rightFlashSource : 'beat'}
                beatFlashToken={tapFeedbackEnabled ? beatFlashToken : 0}
                keyboardTapToken={keyboardTapTokens.right.token}
                keyboardTapFeedback={keyboardTapTokens.right.feedback}
                enabled={enabledHand('right')}
                resting={snapshot?.isRest}
                compact={compact}
                minimal
                showMinimalLabel={isScoreDisplay && !isScoreFocusDisplay}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%' }}
              />

              <View
                pointerEvents="none"
                style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: colors.line, opacity: 0.65 }}
              />
            </>
          )}
        </View>

        {!tutorialVisible && isScoreDisplay && !isScoreFocusDisplay && snapshot ? (
          <View
            testID="practice.scoreBackground"
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: -insets.left, right: -insets.right, height: scoreDisplayTop + scoreDisplayHeight, backgroundColor: colors.surface }}
          />
        ) : null}

        {!tutorialVisible && showNextPattern && snapshot && !snapshot.resumeCountIn ? (
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

        {!tutorialVisible && snapshot ? (
          <View
            testID="practice.rhythmDisplay"
            pointerEvents="none"
            style={[{ position: 'absolute', left: -insets.left, right: -insets.right, flexDirection: 'row', alignItems: 'center', backgroundColor: isScoreDisplay && !isScoreFocusDisplay ? colors.surface : 'transparent' }, rhythmDisplayStyle]}
          >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: isScoreDisplay ? scoreContentMargin : 0 }}>
              {displayScoreMeasure ? (
                importedScoreMeasure && scoreDisplayMode === 'focus' ? (
                  singleHandMode ? (
                    <ScoreBeatFocus
                      measure={importedScoreMeasure}
                      nextMeasure={snapshot?.scoreNextMeasure}
                      quarterInMeasure={scoreQuarterInMeasure}
                      beatDurationQuarter={pulseQuarterNotes(activeSettings.timeSignature)}
                      hand={focusedHand}
                      color={colors.accent}
                      oneHand
                      compact={compact}
                      initialWidth={initialScoreFocusWidth * 0.86}
                    />
                  ) : (
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <ScoreBeatFocus
                        measure={importedScoreMeasure}
                        nextMeasure={snapshot?.scoreNextMeasure}
                        quarterInMeasure={scoreQuarterInMeasure}
                        beatDurationQuarter={pulseQuarterNotes(activeSettings.timeSignature)}
                        hand="left"
                        color={colors.left}
                        oneHand={false}
                        compact={compact}
                        initialWidth={initialScoreFocusWidth}
                      />
                      <ScoreBeatFocus
                        measure={importedScoreMeasure}
                        nextMeasure={snapshot?.scoreNextMeasure}
                        quarterInMeasure={scoreQuarterInMeasure}
                        beatDurationQuarter={pulseQuarterNotes(activeSettings.timeSignature)}
                        hand="right"
                        color={colors.right}
                        oneHand={false}
                        compact={compact}
                        initialWidth={initialScoreFocusWidth}
                      />
                    </View>
                  )
                ) : (
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ScrollingScoreRhythm
                      measure={displayScoreMeasure}
                      previousMeasure={displayScorePreviousMeasure}
                      nextMeasure={displayScoreNextMeasure ?? displayScoreMeasure}
                      upcomingMeasures={displayScoreUpcomingMeasures}
                      sequence={displayScoreSequence}
                      count={displayScoreCount}
                      compact={compact}
                      beamGroupQuarterNotes={pulseQuarterNotes(activeSettings.timeSignature)}
                      minimal
                      visibleHand={scoreHandToShow}
                      focusedColor={singleHandMode ? scoreHandColor : undefined}
                      initialViewportWidth={initialScoreViewportWidth}
                    />
                  </View>
                )
              ) : singleHandMode && step ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10 }}>
                <Text style={{ color: colors.accent, fontSize: compact ? 11 : 14, fontWeight: '900', letterSpacing: 2 }}>
                  {focusedHand.toUpperCase()}
                </Text>
                {(focusedHand === 'left' ? step.leftRest : step.rightRest) ? (
                  <RhythmSymbol
                    subdivision={focusedHand === 'left' ? step.leftSubdivision : step.rightSubdivision}
                    color={colors.accent}
                    compact={compact}
                    timeSignature={activeSettings.timeSignature}
                    scale={compact ? 1.35 : 1.8}
                    rest
                  />
                ) : (focusedHand === 'left' ? step.leftMixture : step.rightMixture) ? (
                  <MixtureSymbol
                    mixtureId={(focusedHand === 'left' ? step.leftMixture : step.rightMixture)!}
                    color={colors.accent}
                    compact={compact}
                    scale={compact ? 1.35 : 1.8}
                  />
                ) : (
                  <RhythmSymbol
                    subdivision={focusedHand === 'left' ? step.leftSubdivision : step.rightSubdivision}
                    color={colors.accent}
                    compact={compact}
                    timeSignature={activeSettings.timeSignature}
                    scale={compact ? 1.35 : 1.8}
                    rest={focusedHand === 'left' ? step.leftRest : step.rightRest}
                  />
                )}
              </View>
            ) : (
              <>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10, opacity: enabledHand('left') ? 1 : 0.12 }}>
                  {enabledHand('left') && step ? (
                    <>
                      <Text style={{ color: colors.left, fontSize: compact ? 11 : 14, fontWeight: '900', letterSpacing: 2 }}>LEFT</Text>
                      {step.leftRest ? <RhythmSymbol subdivision={step.leftSubdivision} color={colors.left} compact={compact} timeSignature={activeSettings.timeSignature} scale={compact ? 1.35 : 1.8} rest /> : step.leftMixture ? <MixtureSymbol mixtureId={step.leftMixture} color={colors.left} compact={compact} scale={compact ? 1.35 : 1.8} /> : <RhythmSymbol subdivision={step.leftSubdivision} color={colors.left} compact={compact} timeSignature={activeSettings.timeSignature} scale={compact ? 1.35 : 1.8} />}
                    </>
                  ) : null}
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10, opacity: enabledHand('right') ? 1 : 0.12 }}>
                  {enabledHand('right') && step ? (
                    <>
                      <Text style={{ color: colors.right, fontSize: compact ? 11 : 14, fontWeight: '900', letterSpacing: 2 }}>RIGHT</Text>
                      {step.rightRest ? <RhythmSymbol subdivision={step.rightSubdivision} color={colors.right} compact={compact} timeSignature={activeSettings.timeSignature} scale={compact ? 1.35 : 1.8} rest /> : step.rightMixture ? <MixtureSymbol mixtureId={step.rightMixture} color={colors.right} compact={compact} scale={compact ? 1.35 : 1.8} /> : <RhythmSymbol subdivision={step.rightSubdivision} color={colors.right} compact={compact} timeSignature={activeSettings.timeSignature} scale={compact ? 1.35 : 1.8} />}
                    </>
                  ) : null}
                </View>
              </>
              )}
            </View>
          </View>
        ) : null}

        <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top, left: 0, right: 0, minHeight: snapshot?.resumeCountIn ? (compact ? 48 : 58) : compact ? 42 : 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: Math.max(compact ? 13 : 22, insets.left + 12), paddingRight: Math.max(compact ? 13 : 22, insets.right + 12) }}>
          <Pressable
            testID="practice.pause"
            accessibilityRole="button"
            accessibilityLabel={t('Pause practice')}
            disabled={!snapshot || snapshot.phase === 'paused' || snapshot.phase === 'finished'}
            onPress={openPauseMenu}
            hitSlop={12}
          >
            <Text style={{ color: colors.muted, fontSize: compact ? 11 : 12, fontWeight: '800', letterSpacing: 1 }}>
              Ⅱ  PAUSE
            </Text>
          </Pressable>
          <View testID="practice.beatCounter" style={{ alignItems: 'center', justifyContent: 'center', minWidth: snapshot?.resumeCountIn ? Math.min(520, Math.max(200, width * 0.5)) : 90, minHeight: snapshot?.resumeCountIn ? (compact ? 48 : 58) : 38 }}>
            {snapshot?.resumeCountIn ? (
              <>
                <Text testID="practice.resumeCountIn" style={{ color: colors.accent, fontSize: compact ? 7 : 9, fontWeight: '900', letterSpacing: 1.2 }}>LISTEN</Text>
                <Text
                  testID="practice.resumeStartNote"
                  accessibilityLabel={t('START WITH') + ': ' + resumeStartLabel}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.55}
                  style={{ maxWidth: '100%', color: colors.text, fontSize: compact ? 8 : 10, lineHeight: compact ? 11 : 13, fontWeight: '800', textAlign: 'center' }}
                >
                  {t('START WITH')}: {resumeStartLabel}
                </Text>
              </>
            ) : null}
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
          <View style={{ alignItems: 'flex-end', justifyContent: 'center', minWidth: compact ? 74 : 112 }}>
            {remainingLabel ? (
              <Text
                testID={scoreBarsRemaining === undefined ? 'practice.timeRemaining' : 'practice.barsRemaining'}
                accessibilityLabel={scoreBarsRemaining === undefined
                  ? remainingLabel === 'ENDLESS' ? t('Endless session') : t('{time} remaining', { time: remainingLabel.replace(' LEFT', '') })
                  : t('{count} {unit} remaining', { count: scoreBarsRemaining, unit: t(scoreBarsRemaining === 1 ? 'bar' : 'bars') })}
                numberOfLines={1}
                style={{ color: colors.accent, fontSize: compact ? 8 : 10, lineHeight: compact ? 11 : 13, fontWeight: '900', letterSpacing: 0.8 }}
              >
                {remainingLabel}
              </Text>
            ) : null}
            <View testID="practice.changeCountdown" style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', minHeight: compact ? 25 : 34, gap: compact ? 4 : 7 }}>
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
        </View>

        {tutorialVisible ? (
          <Pressable
            testID="practice.tutorial"
            accessibilityRole="button"
            accessibilityLabel={t(activeSettings.trainingMode === 'single-hand'
              ? 'Tap anywhere to start. Use either hand to tap anywhere during the exercise.'
              : 'Tap anywhere to start. Use your left hand on the left half and your right hand on the right half.')}
            disabled={starting}
            onPress={() => void beginExercise()}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.background }}
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
      </View>
      </BlurTargetView>

        {earlySwingWarningVisible && snapshot?.phase === 'running' && snapshot.swingFeelMismatch?.likelyStraight && snapshot.swingFeelMismatch.latestBarIndex <= 3 ? (
          <View pointerEvents="box-none" style={{ position: 'absolute', top: Math.max(insets.top + 52, 58), left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16 }}>
            <View testID="practice.swingFeel.earlyWarning" style={{ width: '100%', maxWidth: 520, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent }}>
              <Text style={{ color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'center' }}>
                {t('Your taps are lining up with straight timing, while this exercise is set to swing.')}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                <Pressable testID="practice.swingFeel.restartStraight" accessibilityRole="button" disabled={pauseActionLoading} onPress={() => void restartWithStraightFeel()} style={{ minHeight: 38, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.accent, opacity: pauseActionLoading ? 0.5 : 1 }}>
                  <Text style={{ color: colors.background, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }}>{t('RESTART AS STRAIGHT')}</Text>
                </Pressable>
                <Pressable testID="practice.swingFeel.keepSwing" accessibilityRole="button" onPress={dismissEarlySwingWarning} style={{ minHeight: 38, justifyContent: 'center', paddingHorizontal: 12 }}>
                  <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }}>{t('KEEP PLAYING SWING')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        {snapshot?.phase === 'paused' && quickSettingsOpen ? (
          <LivePracticeSettings
            settings={activeSettings}
            featureFlags={featureFlags}
            blurTarget={blurTargetRef}
            onSettingsChange={updateSettings}
            onBack={() => setQuickSettingsOpen(false)}
            compact={compact}
          />
        ) : null}

        {snapshot?.phase === 'paused' && snapshot.challengeMessage && !quickSettingsOpen ? (
          <PracticeOverlayBackdrop
            testID="practice.challengePause"
            blurTarget={blurTargetRef}
            contentStyle={{ paddingHorizontal: Math.max(24, insets.left + 24, insets.right + 24), paddingVertical: Math.max(12, insets.top + 8, insets.bottom + 8) }}
          >
            <View style={{ width: '100%', maxWidth: 460, alignItems: 'center', paddingHorizontal: compact ? 8 : 16 }}>
              <Text style={{ color: colors.accent, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.6 }}>
                CHALLENGE PAUSE
              </Text>
              <Text style={{ color: colors.text, fontSize: compact ? 17 : 22, lineHeight: compact ? 23 : 29, fontWeight: '800', textAlign: 'center', marginTop: 10 }}>
                {snapshot.challengeMessage ?? 'Take a breath, then continue when you are ready.'}
              </Text>
              <Pressable
                testID="practice.challengeLiveSettings"
                accessibilityRole="button"
                onPress={() => setQuickSettingsOpen(true)}
                style={{ minHeight: 46, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginTop: 14 }}
              >
                <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 }}>LIVE SETTINGS</Text>
              </Pressable>
              <Pressable testID="practice.challengeResume" accessibilityRole="button" onPress={() => void resumeFromChallenge()} style={{ minHeight: 54, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginTop: 20, borderRadius: 14, backgroundColor: colors.accent }}>
                <Text style={{ color: colors.background, fontSize: 14, fontWeight: '900', letterSpacing: 1.1 }}>CONTINUE</Text>
              </Pressable>
              <Pressable testID="practice.challengeEnd" accessibilityRole="button" onPress={stop} style={{ minHeight: 44, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '900', letterSpacing: 1 }}>END SESSION</Text>
              </Pressable>
            </View>
          </PracticeOverlayBackdrop>
        ) : null}

        {snapshot?.phase === 'paused' && !snapshot.challengeMessage && !quickSettingsOpen ? (
          <PracticeOverlayBackdrop
            testID="practice.pauseMenu"
            blurTarget={blurTargetRef}
            contentStyle={{ paddingHorizontal: Math.max(16, insets.left + 16, insets.right + 16), paddingVertical: Math.max(10, insets.top + 8, insets.bottom + 8) }}
          >
            <View style={{ width: '100%', maxWidth: 700, paddingHorizontal: compact ? 8 : 20, paddingVertical: compact ? 4 : 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? 8 : 12 }}>
                <Text style={{ color: colors.text, fontSize: compact ? 18 : 22, fontWeight: '900', letterSpacing: 1 }}>PAUSED</Text>
                <Text style={{ color: colors.accent, fontSize: compact ? 13 : 16, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{bpmDraft} BPM</Text>
              </View>

              {snapshot.swingFeelMismatch?.likelyStraight ? (
                <View testID="practice.pause.swingFeelWarning" style={{ paddingHorizontal: 13, paddingVertical: 10, marginBottom: 7, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent }}>
                  <Text style={{ color: colors.text, fontSize: 11, lineHeight: 16, fontWeight: '700' }}>
                    {t('Your taps are lining up with straight timing, while this exercise is set to swing.')}
                  </Text>
                  {snapshot.swingFeelMismatch.latestBarIndex <= 3 ? (
                    <Pressable testID="practice.pause.restartStraight" accessibilityRole="button" disabled={pauseActionLoading} onPress={() => void restartWithStraightFeel()} style={{ minHeight: 36, alignSelf: 'flex-start', justifyContent: 'center', marginTop: 5, paddingHorizontal: 10, borderRadius: 9, backgroundColor: colors.accent, opacity: pauseActionLoading ? 0.5 : 1 }}>
                      <Text style={{ color: colors.background, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }}>{t('RESTART AS STRAIGHT')}</Text>
                    </Pressable>
                  ) : (
                    <Text style={{ color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 }}>{t('You can count this session as straight on the results page.')}</Text>
                  )}
                </View>
              ) : null}

              {snapshot.scoreMeasureCount !== undefined ? (
                <View style={{ paddingVertical: compact ? 7 : 10, marginBottom: compact ? 8 : 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 1.2 }}>REWIND SCORE</Text>
                    <Text style={{ color: colors.dim, fontSize: compact ? 9 : 10 }}>{maxRewindBars} {maxRewindBars === 1 ? 'BAR' : 'BARS'} AVAILABLE</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: compact ? 6 : 9 }}>
                    <Pressable
                      testID="practice.pause.rewindMinus"
                      accessibilityRole="button"
                      accessibilityLabel={t('Rewind one fewer bar')}
                      disabled={maxRewindBars === 0 || rewindBars <= 1}
                      onPress={() => setRewindBars((current) => Math.max(1, current - 1))}
                      style={{ width: 40, height: compact ? 34 : 40, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: maxRewindBars === 0 || rewindBars <= 1 ? 0.4 : 1 }}
                    >
                      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>−</Text>
                    </Pressable>
                    <Text testID="practice.pause.rewindCount" style={{ minWidth: 84, color: colors.text, fontSize: compact ? 12 : 14, fontWeight: '900', textAlign: 'center' }}>
                      {rewindBars} {rewindBars === 1 ? 'BAR' : 'BARS'} BACK
                    </Text>
                    <Pressable
                      testID="practice.pause.rewindPlus"
                      accessibilityRole="button"
                      accessibilityLabel={t('Rewind one more bar')}
                      disabled={maxRewindBars === 0 || rewindBars >= maxRewindBars}
                      onPress={() => setRewindBars((current) => Math.min(maxRewindBars, current + 1))}
                      style={{ width: 40, height: compact ? 34 : 40, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: maxRewindBars === 0 || rewindBars >= maxRewindBars ? 0.4 : 1 }}
                    >
                      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>+</Text>
                    </Pressable>
                    <Pressable
                      testID="practice.pause.rewind"
                      accessibilityRole="button"
                      disabled={maxRewindBars === 0 || pauseActionLoading}
                      onPress={() => void restartFromPause(rewindBars)}
                      style={{ flex: 1, minHeight: compact ? 36 : 42, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', opacity: maxRewindBars === 0 || pauseActionLoading ? 0.4 : 1 }}
                    >
                      <Text style={{ color: colors.background, fontSize: compact ? 10 : 11, fontWeight: '900', letterSpacing: 0.8 }}>REWIND</Text>
                    </Pressable>
                  </View>
                  <Text style={{ color: colors.dim, fontSize: compact ? 8 : 9, marginTop: 5 }}>Rewind starts a fresh run from the selected bar.</Text>
                </View>
              ) : null}

              <View style={{ paddingVertical: compact ? 7 : 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 1.2 }}>TEMPO</Text>
                  <Text style={{ color: colors.text, fontSize: compact ? 15 : 18, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{bpmDraft} BPM</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: compact ? 2 : 5 }}>
                  <Pressable testID="practice.pause.bpmMinus" accessibilityRole="button" accessibilityLabel={t('Decrease tempo')} disabled={bpmDraft <= 40} onPress={() => setBpmDraft((current) => Math.max(40, current - 1))} style={{ width: 36, height: 34, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: bpmDraft <= 40 ? 0.4 : 1 }}>
                    <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>−</Text>
                  </Pressable>
                  <Slider
                    testID="practice.pause.bpmSlider"
                    accessibilityLabel={t('Practice tempo')}
                    style={{ flex: 1, height: 34 }}
                    minimumValue={40}
                    maximumValue={200}
                    step={1}
                    value={bpmDraft}
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.line}
                    thumbTintColor={colors.text}
                    onValueChange={setBpmDraft}
                  />
                  <Pressable testID="practice.pause.bpmPlus" accessibilityRole="button" accessibilityLabel={t('Increase tempo')} disabled={bpmDraft >= 200} onPress={() => setBpmDraft((current) => Math.min(200, current + 1))} style={{ width: 36, height: 34, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: bpmDraft >= 200 ? 0.4 : 1 }}>
                    <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>+</Text>
                  </Pressable>
                </View>
                <Text style={{ color: colors.dim, fontSize: compact ? 8 : 9, marginTop: 2 }}>
                  Applying a tempo starts play over, or restarts a score from this bar.
                </Text>
                {bpmDraft !== snapshot.bpm ? (
                  <Pressable
                    testID="practice.pause.applyBpm"
                    accessibilityRole="button"
                    disabled={pauseActionLoading}
                    onPress={() => void restartFromPause(0)}
                    style={{ alignSelf: 'flex-end', minHeight: compact ? 34 : 40, justifyContent: 'center', paddingHorizontal: 15, marginTop: 5, borderRadius: 10, backgroundColor: colors.accent, opacity: pauseActionLoading ? 0.5 : 1 }}
                  >
                    <Text style={{ color: colors.background, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.8 }}>APPLY BPM</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={{ flexDirection: 'row', gap: 9, marginTop: compact ? 8 : 12 }}>
                <Pressable
                  testID="practice.pause.continue"
                  accessibilityRole="button"
                  disabled={pauseActionLoading}
                  onPress={() => void continueFromPause()}
                  style={{ flex: 1, minHeight: compact ? 42 : 50, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', opacity: pauseActionLoading ? 0.5 : 1 }}
                >
                  <Text style={{ color: colors.background, fontSize: compact ? 11 : 13, fontWeight: '900', letterSpacing: 1 }}>CONTINUE</Text>
                </Pressable>
                <Pressable
                  testID="practice.pause.liveSettings"
                  accessibilityRole="button"
                  onPress={() => setQuickSettingsOpen(true)}
                  style={{ flex: 1, minHeight: compact ? 42 : 50, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: colors.text, fontSize: compact ? 10 : 12, fontWeight: '900', letterSpacing: 0.8 }}>LIVE SETTINGS</Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: compact ? 2 : 5 }}>
                <Pressable testID="practice.pause.finish" accessibilityRole="button" onPress={stop} style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: 8 }}>
                  <Text style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.8 }}>END SESSION</Text>
                </Pressable>
                <Pressable testID="practice.pause.home" accessibilityRole="button" onPress={backHomeFromPause} style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: 8 }}>
                  <Text style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.8 }}>BACK HOME</Text>
                </Pressable>
              </View>
            </View>
          </PracticeOverlayBackdrop>
        ) : null}

        {endingVisible && endingResults ? (
          <SessionEndingOverlay
            accuracy={endingAccuracy}
            hits={endingHits}
            expected={endingExpected}
            isScore={endingResults.source === 'score'}
            isLesson={Boolean(lessonId)}
            onComplete={navigateToResults}
          />
        ) : null}
    </View>
  );
}
