import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { analyzeSessionSwingFeel, recountSessionFeel } from '@/rhythm/swingFeel';
import { LEARN_COURSE } from '@/rhythm/learnCourse';
import { buildFeedback, replayErrorBarGroups, weakestCombination } from '@/features/results/resultPresentation';
import { useResultsReplay } from '@/features/results/useResultsReplay';
import { useResultsDiagnostics } from '@/features/results/useResultsDiagnostics';
import { useLessonCompletion } from '@/features/results/useLessonCompletion';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { ReplayPattern, RhythmicFeel } from '@/types/rhythm';

export function useResultsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const {
    results,
    settings,
    sessionSettings,
    featureFlags,
    prepareRepeatExercise,
    savedPracticePairsLoaded,
    savePairsForLater,
    discardReplayData,
  } = useRhythmSession();
  const router = useRouter();
  const { lessonId: rawLessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const lessonId = Array.isArray(rawLessonId) ? rawLessonId[0] : rawLessonId;
  const [startingAgain, setStartingAgain] = useState(false);
  const [showMissedNotes, setShowMissedNotes] = useState(false);
  const [savedPracticeBars, setSavedPracticeBars] = useState<Set<number>>(() => new Set());
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [countAsFeel, setCountAsFeel] = useState<RhythmicFeel>(results?.feel ?? 'straight');
  const courseLesson = LEARN_COURSE.find((lesson) => lesson.id === lessonId);
  const { lessonCompleted, lessonRating } = useLessonCompletion(results, courseLesson);
  const replaySoundEnabled = (sessionSettings ?? settings).soundEnabled && featureFlags.soundEffects;
  const { replay, replayBar, finishVisualReplay } = useResultsReplay({
    results,
    replaySoundEnabled,
    metronomeSound: settings.metronomeSound,
    leftHandSound: settings.leftHandSound,
    rightHandSound: settings.rightHandSound,
    discardReplayData,
  });
  const { showDiagnosticExport, exportingDiagnostic, confirmSessionLogExport } = useResultsDiagnostics({
    results,
    settings,
    sessionSettings,
    featureFlags,
    courseLesson,
  });
  const countedResults = useMemo(
    () => results ? recountSessionFeel(results, countAsFeel) : null,
    [countAsFeel, results],
  );
  const viewResults = countedResults ?? results;
  const swingFeelAnalysis = useMemo(
    () => results ? analyzeSessionSwingFeel(results) : null,
    [results],
  );
  const replayErrorBars = replayErrorBarGroups(viewResults);
  const extraTapCount = (viewResults?.replayTaps ?? []).filter((tap) => !tap.matchedEventId).length;

  const startAgain = useCallback(async () => {
    if (startingAgain) return;
    setStartingAgain(true);
    try {
      await prepareRepeatExercise();
      discardReplayData();
      router.replace(lessonId ? { pathname: '/practice', params: { lessonId } } : '/practice');
    } catch {
      setStartingAgain(false);
      Alert.alert(t('Audio could not start'), t('Check your device audio settings and try again.'));
    }
  }, [discardReplayData, lessonId, prepareRepeatExercise, router, startingAgain, t]);

  const saveReplayBarForPractice = useCallback((barIndex: number, patterns: readonly ReplayPattern[]) => {
    if (!viewResults) return;
    savePairsForLater(patterns, viewResults.timeSignature);
    setSavedPracticeBars((current) => new Set([...current, barIndex]));
  }, [savePairsForLater, viewResults]);

  const continueLearning = useCallback(() => {
    discardReplayData();
    router.replace({ pathname: '/learn', params: { lessonId } });
  }, [discardReplayData, lessonId, router]);

  const changeSessionSettings = useCallback(() => {
    discardReplayData();
    router.replace('/setup');
  }, [discardReplayData, router]);

  const openSessionRecords = useCallback(() => {
    discardReplayData();
    router.replace('/records');
  }, [discardReplayData, router]);

  const returnHome = useCallback(() => {
    discardReplayData();
    router.replace('/');
  }, [discardReplayData, router]);

  const openSetup = useCallback(() => router.replace('/setup'), [router]);
  const toggleMissedNotes = useCallback(() => setShowMissedNotes((expanded) => !expanded), []);
  const toggleBreakdown = useCallback(() => setShowBreakdown((expanded) => !expanded), []);
  const feedback = viewResults
    ? buildFeedback(viewResults, weakestCombination(viewResults), t)
    : null;

  return {
    colors,
    t,
    results,
    viewResults,
    featureFlags,
    savedPracticePairsLoaded,
    courseLesson,
    lessonCompleted,
    lessonRating,
    replaySoundEnabled,
    replay,
    replayBar,
    finishVisualReplay,
    showDiagnosticExport,
    exportingDiagnostic,
    confirmSessionLogExport,
    swingFeelAnalysis,
    replayErrorBars,
    extraTapCount,
    startingAgain,
    showMissedNotes,
    savedPracticeBars,
    showBreakdown,
    countAsFeel,
    feedback,
    onCountAsFeel: setCountAsFeel,
    toggleMissedNotes,
    toggleBreakdown,
    startAgain,
    saveReplayBarForPractice,
    continueLearning,
    changeSessionSettings,
    openSessionRecords,
    returnHome,
    openSetup,
  };
}
