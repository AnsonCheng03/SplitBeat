import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import { Alert } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { generateMixturePattern } from '@/rhythm/mixtures';
import type { MixturePattern } from '@/rhythm/mixtures';
import { composeRhythmScore, noteValuesForSymbol } from '@/rhythm/scoreComposer';
import type { ComposerSymbolId, ComposedNoteValue } from '@/rhythm/scoreComposer';
import {
  barDurationQuarterNotes,
  filterCombinationProgress,
  practicePairFromProgress,
  practicePairFromSelections,
} from '@/rhythm/targetedPractice';
import type { CombinationFilter, CombinationProgress, SavedPracticePair } from '@/rhythm/targetedPractice';
import type { ExerciseTab, ExerciseDurationOption, PatternSelection } from '@/features/exercise/exerciseTypes';
import { createImportedScoreEntry, rememberImportedScore, setImportedScoreSaved } from '@/rhythm/importedScoreLibrary';
import type { ImportedScoreLibraryEntry } from '@/rhythm/importedScoreLibrary';
import { loadImportedScoreLibrary, saveImportedScoreLibrary } from '@/store/importedScoreLibrary';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { DurationOption, Hand } from '@/types/rhythm';
import { remainingPracticeLoadingFeedbackMs } from './practiceLaunchFeedback';

const waitForNextAnimationFrame = () => new Promise<void>((resolve) => {
  requestAnimationFrame(() => resolve());
});

const practiceDurations: ExerciseDurationOption[] = [
  { label: '30 sec', value: 30 },
  { label: '60 sec', value: 60 },
  { label: '2 min', value: 120 },
  { label: 'Endless', value: 'endless' },
];

export function useExerciseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useI18n();
  const {
    featureFlags,
    settings,
    combinationProgress,
    combinationProgressLoaded,
    savedPracticePairs,
    savedPracticePairsLoaded,
    removeSavedPracticePair,
    prepareExercise,
  } = useRhythmSession();
  useEffect(() => {
    if (!featureFlags.focusPractice) router.replace('/');
  }, [featureFlags.focusPractice, router]);

  const [filter, setFilter] = useState<CombinationFilter>('all');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ExerciseTab>('review');
  const exerciseScrollRef = useRef<ScrollView>(null);
  const [leftSelection, setLeftSelection] = useState<PatternSelection>({ subdivision: 'quarter', rest: false });
  const [rightSelection, setRightSelection] = useState<PatternSelection>({ subdivision: 'eighth', rest: false });
  const [leftNoteGroups, setLeftNoteGroups] = useState<ComposedNoteValue[][]>([]);
  const [rightNoteGroups, setRightNoteGroups] = useState<ComposedNoteValue[][]>([]);
  const [selectedComposerHand, setSelectedComposerHand] = useState<Hand>('left');
  const composerHand = settings.trainingMode === 'single-hand' ? settings.singleHand : selectedComposerHand;
  const [composerMode, setComposerMode] = useState<'note' | 'rest'>('note');
  const [savedCompositions, setSavedCompositions] = useState<ImportedScoreLibraryEntry[]>([]);
  const [savingComposition, setSavingComposition] = useState(false);
  const [practiceDuration, setPracticeDuration] = useState<DurationOption>('endless');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!featureFlags.savedScoreLibrary) return;
    let active = true;
    void loadImportedScoreLibrary().then((entries) => {
      if (active) setSavedCompositions(entries.filter((entry) => entry.source === 'created' && entry.saved));
    });
    return () => { active = false; };
  }, [featureFlags.savedScoreLibrary]);

  const visibleProgress = useMemo(
    () => filterCombinationProgress(combinationProgress, filter, query),
    [combinationProgress, filter, query],
  );
  const leftNotes = useMemo(() => leftNoteGroups.flat(), [leftNoteGroups]);
  const rightNotes = useMemo(() => rightNoteGroups.flat(), [rightNoteGroups]);
  const mixtureExamples = useMemo(() => {
    const values = (settings.mixtureNoteValues ?? []).filter((value) =>
      featureFlags.sixtyFourthNotes || value !== 'sixtyFourth',
    );
    if (values.length === 0) return [];

    const barLength = barDurationQuarterNotes(settings.timeSignature);
    const examples: MixturePattern[] = [];
    const seen = new Set<string>();
    for (let seed = 1; seed <= 24 && examples.length < 4; seed += 1) {
      const pattern = generateMixturePattern(values, barLength, settings.mixtureRestsEnabled === true);
      if (pattern && !seen.has(pattern.id)) {
        examples.push(pattern);
        seen.add(pattern.id);
      }
    }
    return examples;
  }, [featureFlags.sixtyFourthNotes, settings.mixtureNoteValues, settings.mixtureRestsEnabled, settings.timeSignature]);
  const composedResult = useMemo(() => composeRhythmScore({
    title: 'Composed rhythm',
    timeSignature: settings.timeSignature,
    trainingMode: settings.trainingMode,
    singleHand: settings.singleHand,
    left: leftNotes,
    right: rightNotes,
  }), [leftNotes, rightNotes, settings.singleHand, settings.timeSignature, settings.trainingMode]);
  const composedScore = composedResult.ok ? composedResult.score : null;
  const compositionFileName = composedScore ? `${composedScore.timeSignature} · ${composedScore.measures.length} bars` : '';
  const compositionEntryId = composedScore
    ? createImportedScoreEntry('created', compositionFileName, composedScore, 0).id
    : null;
  const compositionAlreadySaved = Boolean(compositionEntryId && savedCompositions.some((entry) => entry.id === compositionEntryId));

  const selectTab = (tab: ExerciseTab) => {
    exerciseScrollRef.current?.scrollTo({ y: 0, animated: false });
    setActiveTab(tab);
  };

  const launchPractice = async (prepare: () => Promise<void>) => {
    if (starting) return;
    const loadingStartedAt = Date.now();
    setStarting(true);
    await waitForNextAnimationFrame();
    try {
      await prepare();
      const feedbackDelay = remainingPracticeLoadingFeedbackMs(loadingStartedAt, Date.now());
      if (feedbackDelay > 0) await new Promise<void>((resolve) => setTimeout(resolve, feedbackDelay));
      router.replace('/practice');
    } catch {
      Alert.alert(t('Could not prepare practice'), t('Check your audio setup and try again.'));
    } finally {
      setStarting(false);
    }
  };

  const practiceProgress = (progress: CombinationProgress) => launchPractice(() => prepareExercise(undefined, {
    settings: {
      timeSignature: progress.timeSignature,
      trainingMode: 'two-hand',
      durationSeconds: practiceDuration,
      handRestsEnabled: false,
    },
    patternPairs: [practicePairFromProgress(progress)],
    patternPairWeights: [1],
  }));

  const practiceSavedPair = (saved: SavedPracticePair) => {
    const pair = practicePairFromSelections(
      { subdivision: saved.leftSubdivision, mixture: saved.leftMixture, rest: saved.leftRest === true },
      { subdivision: saved.rightSubdivision, mixture: saved.rightMixture, rest: saved.rightRest === true },
    );
    return launchPractice(() => prepareExercise(undefined, {
      settings: {
        timeSignature: saved.timeSignature,
        trainingMode: 'two-hand',
        durationSeconds: practiceDuration,
        handRestsEnabled: pair.leftRest === true || pair.rightRest === true,
      },
      patternPairs: [pair],
      patternPairWeights: [1],
    }));
  };

  const practiceSelectedPair = () => {
    if (leftSelection.rest && rightSelection.rest) {
      Alert.alert(t('Choose a rhythm'), t('At least one hand needs a note to practise.'));
      return;
    }
    const pair = practicePairFromSelections(leftSelection, rightSelection);
    return launchPractice(() => prepareExercise(undefined, {
      settings: {
        trainingMode: 'two-hand',
        durationSeconds: practiceDuration,
        handRestsEnabled: false,
      },
      patternPairs: [pair],
      patternPairWeights: [1],
    }));
  };

  const appendComposerSymbol = (symbolId: ComposerSymbolId) => {
    const additions = noteValuesForSymbol(symbolId, settings.timeSignature, composerMode === 'rest');
    const setGroups = composerHand === 'left' ? setLeftNoteGroups : setRightNoteGroups;
    if (additions.length > 0) setGroups((current) => [...current, additions]);
  };

  const removeLastComposerSymbol = (hand: Hand) => {
    const setGroups = hand === 'left' ? setLeftNoteGroups : setRightNoteGroups;
    setGroups((current) => current.slice(0, -1));
  };

  const clearComposerHand = (hand: Hand) => {
    if (hand === 'left') setLeftNoteGroups([]);
    else setRightNoteGroups([]);
  };

  const saveComposedScore = async () => {
    if (!composedScore || savingComposition) {
      if (!composedScore) Alert.alert(t('Check the bar'), t(composedResult.ok ? 'Add at least one note to the active hand or hands.' : composedResult.error));
      return;
    }
    setSavingComposition(true);
    try {
      const existing = await loadImportedScoreLibrary();
      const created = createImportedScoreEntry('created', compositionFileName, composedScore, Date.now());
      const remembered = rememberImportedScore(existing, created);
      const saved = setImportedScoreSaved(remembered, created.id, true);
      await saveImportedScoreLibrary(saved);
      setSavedCompositions(saved.filter((entry) => entry.source === 'created' && entry.saved));
    } catch (error) {
      const full = error instanceof Error && error.message.includes('up to');
      Alert.alert(
        t(full ? 'Score library is full' : 'Could not save score'),
        t(full ? 'Remove a saved score and try again.' : 'Check available storage and try again.'),
      );
    } finally {
      setSavingComposition(false);
    }
  };

  const removeComposedScore = async (entry: ImportedScoreLibraryEntry) => {
    try {
      const existing = await loadImportedScoreLibrary();
      const updated = setImportedScoreSaved(existing, entry.id, false);
      await saveImportedScoreLibrary(updated);
      setSavedCompositions(updated.filter((item) => item.source === 'created' && item.saved));
    } catch {
      Alert.alert(t('Could not save score'), t('Check available storage and try again.'));
    }
  };

  const practiceComposedScore = () => {
    if (!composedScore) {
      Alert.alert(t('Check the bar'), t(composedResult.ok ? 'Add at least one note to the active hand or hands.' : composedResult.error));
      return;
    }
    return launchPractice(() => prepareExercise(composedScore));
  };

  const practiceSavedComposition = (entry: ImportedScoreLibraryEntry) => launchPractice(() => prepareExercise(entry.score));

  return {
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
    barLengthQuarterNotes: barDurationQuarterNotes(settings.timeSignature),
    compositionAlreadySaved,
    practiceDurations,
    onHome: () => router.replace('/'),
    onFilterChange: setFilter,
    onQueryChange: setQuery,
    onTabChange: selectTab,
    onDurationChange: setPracticeDuration,
    onLeftSelectionChange: setLeftSelection,
    onRightSelectionChange: setRightSelection,
    onPracticeProgress: practiceProgress,
    onPracticeSavedPair: practiceSavedPair,
    onPracticeSelectedPair: practiceSelectedPair,
    onComposerHandChange: setSelectedComposerHand,
    onComposerModeChange: setComposerMode,
    onAppendComposerSymbol: appendComposerSymbol,
    onUndoComposerSymbol: removeLastComposerSymbol,
    onClearComposerHand: clearComposerHand,
    onPracticeComposedScore: practiceComposedScore,
    onSaveComposedScore: saveComposedScore,
    onPracticeSavedComposition: practiceSavedComposition,
    onRemoveComposedScore: removeComposedScore,
  };
}
