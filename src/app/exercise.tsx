import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExercisePairPanel } from '@/components/ExercisePairPanel';
import { ExerciseLoadingState } from '@/components/ExerciseLoadingState';
import { ExerciseHeader } from '@/components/ExerciseHeader';
import { ExerciseComposer } from '@/components/ExerciseComposer';
import { ExerciseHistoryPanel } from '@/components/ExerciseHistoryPanel';
import { useExerciseScreen } from '@/features/exercise/useExerciseScreen';
import { exerciseStyle1, exerciseStyle2 } from '@/styles/exercise';

export default function ExerciseScreen() {
  const {
    colors,
    featureFlags,
    settings,
    combinationProgress,
    combinationProgressLoaded,
    savedPracticePairs,
    savedPracticePairsLoaded,
    removeSavedPracticePair,
    exerciseScrollRef,
    filter,
    query,
    activeTab,
    leftSelection,
    rightSelection,
    leftNotes,
    rightNotes,
    composerHand,
    composerMode,
    savedCompositions,
    savingComposition,
    practiceDuration,
    starting,
    visibleProgress,
    mixtureExamples,
    composedResult,
    composedScore,
    barLengthQuarterNotes,
    compositionAlreadySaved,
    practiceDurations,
    onHome,
    onFilterChange,
    onQueryChange,
    onTabChange,
    onDurationChange,
    onLeftSelectionChange,
    onRightSelectionChange,
    onPracticeProgress,
    onPracticeSavedPair,
    onPracticeSelectedPair,
    onComposerHandChange,
    onComposerModeChange,
    onAppendComposerSymbol,
    onUndoComposerSymbol,
    onClearComposerHand,
    onPracticeComposedScore,
    onSaveComposedScore,
    onPracticeSavedComposition,
    onRemoveComposedScore,
  } = useExerciseScreen();

  if (starting) {
    return <ExerciseLoadingState preparingPractice />;
  }

  if (!combinationProgressLoaded || !savedPracticePairsLoaded) {
    return <ExerciseLoadingState />;
  }

  return (
    <SafeAreaView testID="exercise.screen" style={exerciseStyle1({ colors })}>
      <ScrollView
        ref={exerciseScrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={exerciseStyle2()}
      >
        <ExerciseHeader
          progressCount={combinationProgress.length}
          activeTab={activeTab}
          duration={practiceDuration}
          durations={practiceDurations}
          onHome={onHome}
          onTabChange={onTabChange}
          onDurationChange={onDurationChange}
        />

        {activeTab === 'review' || activeTab === 'later' ? (
          <ExerciseHistoryPanel
            view={activeTab}
            progress={visibleProgress}
            progressLoaded={combinationProgressLoaded}
            savedPairs={savedPracticePairs}
            savedPairsLoaded={savedPracticePairsLoaded}
            filter={filter}
            query={query}
            starting={starting}
            onFilterChange={onFilterChange}
            onQueryChange={onQueryChange}
            onPracticeProgress={(record) => void onPracticeProgress(record)}
            onPracticeSaved={(saved) => void onPracticeSavedPair(saved)}
            onRemoveSaved={removeSavedPracticePair}
          />
        ) : activeTab === 'pair' ? (
          <ExercisePairPanel
            leftSelection={leftSelection}
            rightSelection={rightSelection}
            mixtures={mixtureExamples}
            includeSixtyFourth={featureFlags.sixtyFourthNotes}
            timeSignature={settings.timeSignature}
            starting={starting}
            onLeftChange={onLeftSelectionChange}
            onRightChange={onRightSelectionChange}
            onPractice={() => void onPracticeSelectedPair()}
          />
        ) : (
          <ExerciseComposer
            settings={settings}
            featureFlags={featureFlags}
            hand={composerHand}
            mode={composerMode}
            leftNotes={leftNotes}
            rightNotes={rightNotes}
            result={composedResult}
            score={composedScore}
            barLengthQuarterNotes={barLengthQuarterNotes}
            compositionAlreadySaved={compositionAlreadySaved}
            savedCompositions={savedCompositions}
            starting={starting}
            saving={savingComposition}
            onHandChange={onComposerHandChange}
            onModeChange={onComposerModeChange}
            onAppendSymbol={onAppendComposerSymbol}
            onUndo={onUndoComposerSymbol}
            onClear={onClearComposerHand}
            onPractice={() => void onPracticeComposedScore()}
            onSave={() => void onSaveComposedScore()}
            onPracticeSaved={(entry) => void onPracticeSavedComposition(entry)}
            onRemoveSaved={(entry) => void onRemoveComposedScore(entry)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
