import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BlurTargetView } from 'expo-blur';
import { Alert, AppState, useWindowDimensions, View } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HardwareKeyboardInput } from '@/components/HardwareKeyboardInput';
import { SessionEndingOverlay } from '@/components/SessionEndingOverlay';
import { findNextScoreEvent, type ScoreDisplayMode } from '@/rhythm/scoreStaff';
import { getResumeStartNotes } from '@/rhythm/resumeStart';
import { useRhythmSession } from '@/store/sessionStore';
import type { Hand, TapFeedback } from '@/types/rhythm';
import { PracticePauseOverlays } from '@/components/PracticePauseOverlays';
import { PracticeRhythmDisplay } from '@/components/PracticeRhythmDisplay';
import { PracticeStatusBar } from '@/components/PracticeStatusBar';
import { PracticeIntroOverlay } from '@/components/PracticeIntroOverlay';
import { PracticeTapZones } from '@/components/PracticeTapZones';
import { useTheme } from '@/theme/ThemeProvider';
import { practiceStyle1, practiceStyle2, practiceStyle3, practiceStyle4 } from '@/styles/practice';

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

  const singleHandMode = activeSettings.trainingMode === 'single-hand';
  const focusedHand = activeSettings.singleHand;
  const beatFlashToken = snapshot?.phase === 'running' ? snapshot.beatIndex + 1 : 0;
  const importedScoreMeasure = snapshot?.scoreMeasure;
  const practiceScoreMeasure = activeSettings.practiceDisplayMode === 'score'
    ? snapshot?.practiceScoreMeasure
    : undefined;
  const displayScoreMeasure = importedScoreMeasure ?? practiceScoreMeasure;
  const isScoreDisplay = Boolean(displayScoreMeasure);
  const isScoreFocusDisplay = Boolean(importedScoreMeasure && scoreDisplayMode === 'focus');
  const showNextPattern = Boolean(!isScoreDisplay && snapshot?.nextStep);
  const changeCountdown = isScoreDisplay ? undefined : snapshot?.beatsUntilChange;
  const step = snapshot?.currentStep;
  const scoreMeasure = importedScoreMeasure;
  const scoreQuarterInMeasure = snapshot?.scoreQuarterInMeasure ?? 0;
  const scoreSequence = snapshot?.scoreMeasureSequence ?? 0;
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


  const endingResults = results ?? snapshot?.results;
  const endingExpected = endingResults ? endingResults.left.totalExpected + endingResults.right.totalExpected : 0;
  const endingHits = endingResults ? endingResults.left.totalHit + endingResults.right.totalHit : 0;
  const endingAccuracy = endingExpected === 0 ? 0 : endingHits / endingExpected * 100;

  return (
    <View testID="practice.screen" style={practiceStyle1({ colors })}>
      {featureFlags.externalKeyboard ? <HardwareKeyboardInput onTap={handleKeyboardTap} /> : null}
      <BlurTargetView ref={blurTargetRef} collapsable={false} style={practiceStyle2()}>
      <View style={practiceStyle3()}>
        <View pointerEvents="box-none" style={practiceStyle4({ insets })}>
          <PracticeTapZones
            settings={activeSettings}
            snapshot={snapshot}
            compact={compact}
            tapFeedbackEnabled={tapFeedbackEnabled}
            scoreDisplay={isScoreDisplay && !isScoreFocusDisplay}
            beatFlashToken={beatFlashToken}
            keyboardTapTokens={keyboardTapTokens}
            onTap={registerTap}
          />
        </View>

        <PracticeRhythmDisplay
          snapshot={snapshot}
          settings={activeSettings}
          tutorialVisible={tutorialVisible}
          scoreDisplayMode={scoreDisplayMode}
          compact={compact}
          width={width}
          height={height}
          topInset={insets.top}
          bottomInset={insets.bottom}
          leftInset={insets.left}
          rightInset={insets.right}
        />

        <PracticeStatusBar
          snapshot={snapshot}
          compact={compact}
          width={width}
          topInset={insets.top}
          leftInset={insets.left}
          rightInset={insets.right}
          remainingLabel={remainingLabel}
          scoreBarsRemaining={scoreBarsRemaining}
          resumeStartLabel={resumeStartLabel}
          showNextPattern={showNextPattern}
          changeCountdown={changeCountdown}
          onPause={openPauseMenu}
        />

        {tutorialVisible ? (
          <PracticeIntroOverlay
            settings={activeSettings}
            compact={compact}
            leftInset={insets.left}
            rightInset={insets.right}
            bottomInset={insets.bottom}
            starting={starting}
            soundEnabled={activeSettings.soundEnabled}
            onStart={() => void beginExercise()}
          />
        ) : null}
      </View>
      </BlurTargetView>

        <PracticePauseOverlays
          snapshot={snapshot}
          settings={activeSettings}
          featureFlags={featureFlags}
          blurTarget={blurTargetRef}
          compact={compact}
          quickSettingsOpen={quickSettingsOpen}
          onOpenQuickSettings={() => setQuickSettingsOpen(true)}
          onCloseQuickSettings={() => setQuickSettingsOpen(false)}
          earlySwingWarningVisible={earlySwingWarningVisible}
          pauseActionLoading={pauseActionLoading}
          bpmDraft={bpmDraft}
          onBpmChange={setBpmDraft}
          rewindBars={rewindBars}
          onRewindBarsChange={setRewindBars}
          onSettingsChange={updateSettings}
          onResume={continueFromPause}
          onRestart={restartFromPause}
          onRestartStraight={restartWithStraightFeel}
          onDismissSwingWarning={dismissEarlySwingWarning}
          onStop={stopExercise}
          onBackHome={backHomeFromPause}
        />

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
