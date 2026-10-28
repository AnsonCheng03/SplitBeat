import { Pressable, ScrollView } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResultsOverview } from '@/features/results/ResultsOverview';
import { ResultsMissedNotes } from '@/features/results/ResultsMissedNotes';
import { ResultsPerformanceBreakdown } from '@/features/results/ResultsPerformanceBreakdown';
import { ResultsFooter } from '@/features/results/ResultsFooter';
import { ModeLoadingScreen } from '@/components/ModeLoadingScreen';
import { useResultsScreen } from '@/features/results/useResultsScreen';
import { resultsStyle1, resultsStyle2, resultsStyle3, resultsStyle4, resultsStyle5, resultsStyle6 } from '@/styles/results';

export default function ResultsScreen() {
  const {
    colors,
    t,
    results,
    viewResults,
    featureFlags,
    savedPracticePairsLoaded,
    courseLesson,
    lessonCompleted,
    lessonRating,
    checkpointChallenge,
    checkpointPassed,
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
    timingCalibrationSuggested,
    onCountAsFeel,
    toggleMissedNotes,
    toggleBreakdown,
    startAgain,
    saveReplayBarForPractice,
    continueLearning,
    changeSessionSettings,
    openSessionRecords,
    returnHome,
    openSetup,
    openTimingCalibration,
  } = useResultsScreen();

  if (!results || !viewResults) {
    return (
      <SafeAreaView testID="results.screen" style={resultsStyle1({ colors })}>
        <Text style={resultsStyle2({ colors })}>{t('No session results yet.')}</Text>
        <Pressable onPress={openSetup} style={resultsStyle3()}>
          <Text style={resultsStyle4({ colors })}>{t('SET UP A SESSION')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (startingAgain) {
    return (
      <ModeLoadingScreen
        testID="results.preparing"
        title={t('Starting your practice…')}
        detail={t('Preparing the metronome')}
      />
    );
  }

  return (
    <SafeAreaView testID="results.screen" style={resultsStyle5({ colors })}>
      <ScrollView contentContainerStyle={resultsStyle6()} showsVerticalScrollIndicator={false}>
        <ResultsOverview
          results={viewResults}
          courseLesson={courseLesson}
          lessonCompleted={lessonCompleted}
          lessonRating={lessonRating}
          checkpointChallenge={checkpointChallenge}
          checkpointPassed={checkpointPassed}
          swingFeelAnalysis={swingFeelAnalysis}
          originalFeel={results.feel}
          countAsFeel={countAsFeel}
          onCountAsFeel={onCountAsFeel}
          gameCenterEnabled={featureFlags.gameCenter}
          timingCalibrationSuggested={timingCalibrationSuggested}
          onCalibrateTiming={openTimingCalibration}
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
            onToggle={toggleMissedNotes}
            onReplay={(barIndex, expectedEvents, taps, beatsPerBar) => void replayBar(barIndex, expectedEvents, taps, beatsPerBar)}
            onSaveForLater={saveReplayBarForPractice}
            onPlaybackEnd={finishVisualReplay}
          />
        ) : null}

        <ResultsPerformanceBreakdown
          results={viewResults}
          expanded={showBreakdown}
          feedback={feedback ?? []}
          onToggle={toggleBreakdown}
        />

        <ResultsFooter
          courseLesson={courseLesson}
          lessonCompleted={lessonCompleted}
          checkpointChallenge={checkpointChallenge}
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
