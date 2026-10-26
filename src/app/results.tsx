import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResultsOverview } from '@/features/results/ResultsOverview';
import { ResultsMissedNotes } from '@/features/results/ResultsMissedNotes';
import { ResultsPerformanceBreakdown } from '@/features/results/ResultsPerformanceBreakdown';
import { ResultsFooter } from '@/features/results/ResultsFooter';
import { analyzeSessionSwingFeel, recountSessionFeel } from '@/rhythm/swingFeel';
import { LEARN_COURSE } from '@/rhythm/learnCourse';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { ReplayPattern, RhythmicFeel } from '@/types/rhythm';
import { buildFeedback, replayErrorBarGroups, weakestCombination } from '@/features/results/resultPresentation';
import { useResultsReplay } from '@/features/results/useResultsReplay';
import { useResultsDiagnostics } from '@/features/results/useResultsDiagnostics';
import { useLessonCompletion } from '@/features/results/useLessonCompletion';
import { resultsStyle1, resultsStyle2, resultsStyle3, resultsStyle4, resultsStyle5, resultsStyle6 } from '@/styles/results';

export default function ResultsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { results, settings, sessionSettings, featureFlags, prepareRepeatExercise, savedPracticePairsLoaded, savePairsForLater, discardReplayData } = useRhythmSession();
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
  const viewResults = countedResults ?? results!;
  const swingFeelAnalysis = useMemo(
    () => results ? analyzeSessionSwingFeel(results) : null,
    [results],
  );
  const replayErrorBars = replayErrorBarGroups(viewResults);
  const extraTapCount = (viewResults?.replayTaps ?? []).filter((tap) => !tap.matchedEventId).length;
  const startAgain = async () => {
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
  };

  const saveReplayBarForPractice = (barIndex: number, patterns: readonly ReplayPattern[]) => {
    savePairsForLater(patterns, viewResults.timeSignature);
    setSavedPracticeBars((current) => new Set([...current, barIndex]));
  };

  const continueLearning = () => {
    discardReplayData();
    router.replace({ pathname: '/learn', params: { lessonId } });
  };

  const changeSessionSettings = () => {
    discardReplayData();
    router.replace('/setup');
  };

  const openSessionRecords = () => {
    discardReplayData();
    router.replace('/records');
  };

  const returnHome = () => {
    discardReplayData();
    router.replace('/');
  };

  if (!results) {
    return (
      <SafeAreaView testID="results.screen" style={resultsStyle1({ colors })}>
        <Text style={resultsStyle2({ colors })}>{t('No session results yet.')}</Text>
        <Pressable onPress={() => router.replace('/setup')} style={resultsStyle3()}>
          <Text style={resultsStyle4({ colors })}>{t('SET UP A SESSION')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const weakest = weakestCombination(viewResults);
  const feedback = buildFeedback(viewResults, weakest, t);

  return (
    <SafeAreaView testID="results.screen" style={resultsStyle5({ colors })}>
      <ScrollView
        contentContainerStyle={resultsStyle6()}
        showsVerticalScrollIndicator={false}
      >
        <ResultsOverview
          results={viewResults}
          courseLesson={courseLesson}
          lessonCompleted={lessonCompleted}
          lessonRating={lessonRating}
          swingFeelAnalysis={swingFeelAnalysis}
          originalFeel={results.feel}
          countAsFeel={countAsFeel}
          onCountAsFeel={setCountAsFeel}
          gameCenterEnabled={featureFlags.gameCenter}
        />

        {featureFlags.missedNoteReplay && replayErrorBars.length > 0 ? (
          <ResultsMissedNotes
            results={viewResults}
            groups={replayErrorBars}
            extraTapCount={extraTapCount}
            expanded={showMissedNotes}
            replay={replay}
            replaySoundEnabled={replaySoundEnabled}
            savedBars={savedPracticeBars}
            savedPracticePairsLoaded={savedPracticePairsLoaded}
            focusPracticeEnabled={featureFlags.focusPractice}
            onToggle={() => setShowMissedNotes((expanded) => !expanded)}
            onReplay={(barIndex, expectedEvents, taps, beatsPerBar) => void replayBar(barIndex, expectedEvents, taps, beatsPerBar)}
            onSaveForLater={saveReplayBarForPractice}
            onPlaybackEnd={finishVisualReplay}
          />
        ) : null}

        <ResultsPerformanceBreakdown
          results={viewResults}
          expanded={showBreakdown}
          feedback={feedback}
          onToggle={() => setShowBreakdown((expanded) => !expanded)}
        />

        <ResultsFooter
          courseLesson={courseLesson}
          lessonCompleted={lessonCompleted}
          featureFlags={featureFlags}
          startingAgain={startingAgain}
          showDiagnosticExport={showDiagnosticExport}
          exportingDiagnostic={exportingDiagnostic}
          onStartAgain={() => void startAgain()}
          onContinueLearning={continueLearning}
          onConfirmExport={confirmSessionLogExport}
          onChangeSettings={changeSessionSettings}
          onViewRecords={openSessionRecords}
          onBackHome={returnHome}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
