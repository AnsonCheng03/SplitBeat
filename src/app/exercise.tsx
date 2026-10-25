import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScoreRhythmMeasure } from '@/components/ScoreRhythmMeasure';
import { ComposerSymbolButton } from '@/components/ComposerSymbolButton';
import { MixtureSymbol } from '@/components/MixtureSymbol';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { generateMixturePattern } from '@/rhythm/mixtures';
import type { MixturePattern } from '@/rhythm/mixtures';
import { patternSelectionLabel } from '@/i18n/patternLabels';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import { composerPreviewDimensions } from '@/rhythm/scoreLayout';
import { composeRhythmScore, COMPOSER_TUPLET_SYMBOLS, NOTE_VALUE_SYMBOLS, noteValuesForSymbol } from '@/rhythm/scoreComposer';
import type { ComposerSymbolId, ComposedNoteValue } from '@/rhythm/scoreComposer';
import {
  combinationAccuracy,
  combinationHandAccuracy,
  combinationTitle,
  barDurationQuarterNotes,
  filterCombinationProgress,
  practicePairFromProgress,
  practicePairFromSelections,
} from '@/rhythm/targetedPractice';
import type { CombinationFilter, CombinationProgress, SavedPracticePair } from '@/rhythm/targetedPractice';
import { createImportedScoreEntry, rememberImportedScore, setImportedScoreSaved } from '@/rhythm/importedScoreLibrary';
import type { ImportedScoreLibraryEntry } from '@/rhythm/importedScoreLibrary';
import { loadImportedScoreLibrary, saveImportedScoreLibrary } from '@/store/importedScoreLibrary';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import { SUBDIVISIONS } from '@/types/rhythm';
import type { DurationOption, Hand, MixturePatternId, Subdivision, TimeSignature } from '@/types/rhythm';

type PatternSelection = { subdivision: Subdivision; mixture?: MixturePatternId; rest: boolean };
type ExerciseTab = 'review' | 'later' | 'pair' | 'bar';

const filterOptions: { value: CombinationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'weak', label: 'Needs work' },
  { value: 'mixtures', label: 'Mixtures' },
  { value: 'rests', label: 'Rests' },
];

const practiceDurations: { label: string; value: DurationOption }[] = [
  { label: '30 sec', value: 30 },
  { label: '60 sec', value: 60 },
  { label: '2 min', value: 120 },
  { label: 'Endless', value: 'endless' },
];

export default function ExerciseScreen() {
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
  const sectionTitle = { color: colors.muted, fontSize: 10, fontWeight: '900' as const, letterSpacing: 1.2 };
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

  const selectTab = (tab: ExerciseTab) => {
    exerciseScrollRef.current?.scrollTo({ y: 0, animated: false });
    setActiveTab(tab);
  };

  const mixtureExamples = useMemo(() => {
    const values = settings.mixtureNoteValues ?? [];
    if (values.length === 0) return [];

    const barLength = barDurationQuarterNotes(settings.timeSignature);
    const examples: MixturePattern[] = [];
    const seen = new Set<string>();
    for (let seed = 1; seed <= 24 && examples.length < 4; seed += 1) {
      const pattern = generateMixturePattern(
        values,
        barLength,
        settings.mixtureRestsEnabled === true,
      );
      if (pattern && !seen.has(pattern.id)) {
        examples.push(pattern);
        seen.add(pattern.id);
      }
    }
    return examples;
  }, [settings.mixtureNoteValues, settings.mixtureRestsEnabled, settings.timeSignature]);

  const launch = async (prepare: () => Promise<void>) => {
    if (starting) return;
    setStarting(true);
    try {
      await prepare();
      router.replace('/practice');
    } catch {
      Alert.alert(t('Could not prepare practice'), t('Check your audio setup and try again.'));
    } finally {
      setStarting(false);
    }
  };

  const practiceProgress = (progress: CombinationProgress) => launch(() => prepareExercise(undefined, {
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
    return launch(() => prepareExercise(undefined, {
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
    return launch(() => prepareExercise(undefined, {
      settings: {
        trainingMode: 'two-hand',
        durationSeconds: practiceDuration,
        handRestsEnabled: false,
      },
      patternPairs: [pair],
      patternPairWeights: [1],
    }));
  };

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
    return launch(() => prepareExercise(composedScore));
  };

  const practiceSavedComposition = (entry: ImportedScoreLibraryEntry) => launch(() => prepareExercise(entry.score));

  if (!combinationProgressLoaded || !savedPracticePairsLoaded) {
    return (
      <SafeAreaView
        testID="exercise.loading"
        accessibilityState={{ busy: true }}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text accessibilityLiveRegion="polite" style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>
            {t('Loading {activity}…', { activity: t('Focus practice') })}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>
            {t('Preparing your practice history.')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="exercise.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={exerciseScrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 14, paddingBottom: 30 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Pressable testID="exercise.home" accessibilityRole="button" onPress={() => router.replace('/')} hitSlop={10} style={{ paddingVertical: 8, paddingRight: 14 }}>
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>‹  HOME</Text>
          </Pressable>
          <Text style={{ color: colors.dim, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }}>FOCUSED PRACTICE</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 18 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.7 }}>Practice a rhythm.</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 5 }}>{t('Review combinations you miss, choose your own pair, or compose a score.')}</Text>
          </View>
          <View style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
            <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>{combinationProgress.length} SAVED PAIRS</Text>
          </View>
        </View>

        {activeTab !== 'bar' ? (
          <View testID="exercise.duration" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <Text style={sectionTitle}>{t('SESSION LENGTH')}</Text>
            <View style={{ flexDirection: 'row', gap: 7 }}>
              {practiceDurations.map((option) => (
                <ChoiceChip
                  key={option.value}
                  testID={`exercise.duration.${option.value}`}
                  label={t(option.label)}
                  selected={practiceDuration === option.value}
                  onPress={() => setPracticeDuration(option.value)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 17 }}>
          <ChoiceChip testID="exercise.tab.review" label="Review pairs" selected={activeTab === 'review'} onPress={() => selectTab('review')} />
          <ChoiceChip testID="exercise.tab.later" label={t('Saved later')} selected={activeTab === 'later'} onPress={() => selectTab('later')} />
          <ChoiceChip testID="exercise.tab.pair" label="Choose a pair" selected={activeTab === 'pair'} onPress={() => selectTab('pair')} />
          <ChoiceChip testID="exercise.tab.bar" label={t('Compose a score')} selected={activeTab === 'bar'} onPress={() => selectTab('bar')} />
        </View>

        {activeTab === 'review' ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 9 }}>
              <Text style={sectionTitle}>YOUR COMBINATIONS</Text>
              <TextInput
                testID="exercise.search"
                accessibilityLabel={t('Search rhythm combinations')}
                value={query}
                onChangeText={setQuery}
                placeholder={t('Search notes or meter')}
                placeholderTextColor={colors.dim}
                autoCapitalize="none"
                autoCorrect={false}
                style={{ width: 205, minHeight: 37, color: colors.text, fontSize: 11, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1 }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 7, marginBottom: 10 }}>
              {filterOptions.map((option) => (
                <ChoiceChip key={option.value} label={option.label} selected={filter === option.value} onPress={() => setFilter(option.value)} />
              ))}
            </View>
            {visibleProgress.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 18 }}>
                {visibleProgress.map((record) => (
                  <CombinationTile key={record.id} record={record} onPress={() => void practiceProgress(record)} />
                ))}
              </View>
            ) : (
              <View style={{ paddingHorizontal: 16, paddingVertical: 13, marginBottom: 18, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>
                  {combinationProgressLoaded ? combinationProgress.length ? 'No combinations match this filter.' : 'Your combinations will appear here after practice.' : 'Loading your practice history…'}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 10, marginTop: 4 }}>Accuracy is saved on this device and includes mixture patterns.</Text>
              </View>
            )}
          </>
        ) : activeTab === 'later' ? (
          <>
            <Text style={sectionTitle}>{t('SAVED FROM YOUR RESULTS')}</Text>
            <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 10 }}>
              {t('Practice a saved bar pattern again, or remove it when you no longer need it.')}
            </Text>
            {savedPracticePairs.length > 0 ? (
              <View style={{ gap: 8, marginBottom: 18 }}>
                {savedPracticePairs.map((saved) => (
                  <SavedPracticeTile
                    key={saved.id}
                    item={saved}
                    onPractice={() => void practiceSavedPair(saved)}
                    onRemove={() => removeSavedPracticePair(saved.id)}
                    disabled={starting}
                  />
                ))}
              </View>
            ) : (
              <View testID="exercise.saved.empty" style={{ paddingHorizontal: 16, paddingVertical: 13, marginBottom: 18, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>
                  {savedPracticePairsLoaded ? t('No saved patterns yet.') : t('Loading saved patterns…')}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 10, marginTop: 4 }}>{t('Save a missed bar from the result replay and it will appear here.')}</Text>
              </View>
            )}
          </>
        ) : activeTab === 'pair' ? (
          <>
            <Text style={sectionTitle}>CHOOSE A RHYTHM FOR EACH HAND</Text>
            <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 12, marginTop: 9 }}>
              <PatternPicker hand="left" selection={leftSelection} mixtures={mixtureExamples} timeSignature={settings.timeSignature} onChange={setLeftSelection} />
              <PatternPicker hand="right" selection={rightSelection} mixtures={mixtureExamples} timeSignature={settings.timeSignature} onChange={setRightSelection} />
            </View>
            <PrimaryButton testID="exercise.practicePair" title={starting ? 'PREPARING…' : 'PRACTICE THIS PAIR'} onPress={() => void practiceSelectedPair()} disabled={starting} />
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <Text style={sectionTitle}>{t('COMPOSE A SCORE')}</Text>
              <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900' }}>{settings.timeSignature} · {settings.trainingMode === 'single-hand' ? `${settings.singleHand.toUpperCase()} HAND` : 'BOTH HANDS'}</Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 5, marginBottom: 10 }}>{t('Choose a hand, then tap a note symbol to add it in order. The next symbol starts in the next bar automatically.')}</Text>

            {settings.trainingMode === 'two-hand' ? (
              <View style={{ flexDirection: 'row', gap: 7, marginBottom: 8 }}>
                <ChoiceChip testID="exercise.composer.hand.left" label={t('LEFT HAND')} selected={composerHand === 'left'} selectedColor={colors.left} onPress={() => setSelectedComposerHand('left')} />
                <ChoiceChip testID="exercise.composer.hand.right" label={t('RIGHT HAND')} selected={composerHand === 'right'} selectedColor={colors.right} onPress={() => setSelectedComposerHand('right')} />
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 7, marginBottom: 8 }}>
              <ChoiceChip testID="exercise.composer.mode.note" label={t('Add notes')} selected={composerMode === 'note'} selectedColor={composerHand === 'left' ? colors.left : colors.right} onPress={() => setComposerMode('note')} />
              <ChoiceChip testID="exercise.composer.mode.rest" label={t('Add rests')} selected={composerMode === 'rest'} selectedColor={colors.accent} onPress={() => setComposerMode('rest')} />
            </View>

            <Text style={sectionTitle}>{t('NOTE VALUES')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingVertical: 7 }}>
              {NOTE_VALUE_SYMBOLS.map((symbol) => (
                <ComposerSymbolButton
                  key={symbol.id}
                  testID={`exercise.composer.symbol.${symbol.id}`}
                  symbolId={symbol.id as ComposerSymbolId}
                  timeSignature={settings.timeSignature}
                  color={composerHand === 'left' ? colors.left : colors.right}
                  isRest={composerMode === 'rest'}
                  onPress={() => appendComposerSymbol(symbol.id as ComposerSymbolId)}
                />
              ))}
            </ScrollView>

            <Text style={{ ...sectionTitle, marginTop: 3 }}>{t('TUPLET GROUPS')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingVertical: 7 }}>
              {COMPOSER_TUPLET_SYMBOLS.map((symbol) => (
                <ComposerSymbolButton
                  key={symbol.id}
                  testID={`exercise.composer.symbol.${symbol.id}`}
                  symbolId={symbol.id}
                  timeSignature={settings.timeSignature}
                  color={composerHand === 'left' ? colors.left : colors.right}
                  isRest={composerMode === 'rest'}
                  onPress={() => appendComposerSymbol(symbol.id)}
                />
              ))}
            </ScrollView>

            {(() => {
              const selectedHandNotes = composerHand === 'left' ? leftNotes : rightNotes;
              const selectedDuration = selectedHandNotes.reduce((total, item) => total + item.durationQuarter, 0);
              const nextBar = Math.floor((selectedDuration + 0.000001) / barDurationQuarterNotes(settings.timeSignature)) + 1;
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 2, marginBottom: 8 }}>
                  <Text testID="exercise.composer.timeline" style={{ flex: 1, color: composerHand === 'left' ? colors.left : colors.right, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }}>
                    {t('HAND TIMELINE · {count} symbols · {duration} quarter notes. Next symbol starts in bar {bar}.', {
                      count: selectedHandNotes.length,
                      duration: Number(selectedDuration.toFixed(3)),
                      bar: nextBar,
                    })}
                  </Text>
                  <Pressable testID="exercise.composer.undo" accessibilityRole="button" accessibilityLabel={t('Undo last symbol')} disabled={selectedHandNotes.length === 0} onPress={() => removeLastComposerSymbol(composerHand)} style={{ paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.surface, opacity: selectedHandNotes.length === 0 ? 0.45 : 1 }}>
                    <Text style={{ color: colors.muted, fontSize: 8, fontWeight: '900' }}>{t('UNDO')}</Text>
                  </Pressable>
                  <Pressable testID="exercise.composer.clear" accessibilityRole="button" accessibilityLabel={t('Clear hand')} disabled={selectedHandNotes.length === 0} onPress={() => clearComposerHand(composerHand)} style={{ paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.surface, opacity: selectedHandNotes.length === 0 ? 0.45 : 1 }}>
                    <Text style={{ color: colors.muted, fontSize: 8, fontWeight: '900' }}>{t('CLEAR')}</Text>
                  </Pressable>
                </View>
              );
            })()}

            {composedScore ? (
              <>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 5 }}>
                  {composedScore.measures.length === 1 ? t('1 bar') : t('{count} bars', { count: composedScore.measures.length })}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: 8, paddingBottom: 7 }}>
                  {composedScore.measures.slice(0, 12).map((measure) => {
                    const preview = composerPreviewDimensions(measure);
                    return (
                      <View key={measure.index} style={{ width: preview.cardWidth, minHeight: 87, justifyContent: 'center', paddingHorizontal: 4, paddingVertical: 5, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
                        <Text style={{ color: colors.dim, fontSize: 8, fontWeight: '900', letterSpacing: 1, paddingLeft: 4, marginBottom: 1 }}>{t('BAR {bar}', { bar: measure.index + 1 })}</Text>
                        <ScoreRhythmMeasure
                          measure={measure}
                          number={measure.index + 1}
                          count={composedScore.measures.length}
                          compact
                          hideHeader
                          beamGroupQuarterNotes={pulseQuarterNotes(settings.timeSignature)}
                          initialNotationWidth={preview.notationWidth}
                          testIdPrefix={`exercise.composer.preview.${measure.index + 1}`}
                        />
                      </View>
                    );
                  })}
                  {composedScore.measures.length > 12 ? (
                    <View style={{ width: 110, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800' }}>+ {composedScore.measures.length - 12}</Text>
                    </View>
                  ) : null}
                </ScrollView>
                <Text style={{ color: colors.dim, fontSize: 9, lineHeight: 14, marginBottom: 3 }}>{t('Notes are grouped inside each bar according to the selected time signature. A note crossing a bar line is tied and is not tapped again.')}</Text>
              </>
            ) : (
              <Text style={{ color: colors.dim, fontSize: 10, paddingVertical: 9 }}>{t(composedResult.ok ? 'Add at least one note to the active hand or hands.' : composedResult.error)}</Text>
            )}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PrimaryButton testID="exercise.practiceBar" flex={1} title={starting ? t('PREPARING…') : t('PRACTICE COMPOSITION')} onPress={() => void practiceComposedScore()} disabled={starting || !composedScore} />
              {featureFlags.savedScoreLibrary ? (
                <PrimaryButton testID="exercise.saveComposition" flex={1} title={savingComposition ? t('SAVING…') : compositionAlreadySaved ? t('SAVED ✓') : t('SAVE SCORE')} onPress={() => void saveComposedScore()} disabled={savingComposition || compositionAlreadySaved || !composedScore} />
              ) : null}
            </View>

            {featureFlags.savedScoreLibrary ? (
              <View style={{ marginTop: 15 }}>
                <Text style={{ ...sectionTitle, marginBottom: 7 }}>{t('SAVED COMPOSITIONS')}</Text>
                {savedCompositions.length === 0 ? (
                  <Text style={{ color: colors.dim, fontSize: 10, paddingVertical: 6 }}>{t('No saved compositions yet.')}</Text>
                ) : savedCompositions.map((entry) => (
                  <View key={entry.id} style={{ flexDirection: 'row', gap: 7, marginBottom: 6 }}>
                    <Pressable testID={`exercise.composition.${entry.id}`} accessibilityRole="button" accessibilityLabel={t('Practice this score') + `: ${entry.score.title}`} onPress={() => void practiceSavedComposition(entry)} disabled={starting} style={({ pressed }) => ({ flex: 1, minHeight: 47, justifyContent: 'center', paddingHorizontal: 11, borderRadius: 10, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line })}>
                      <Text raw numberOfLines={1} style={{ color: colors.text, fontSize: 10, fontWeight: '800' }}>{entry.score.title}</Text>
                      <Text style={{ color: colors.dim, fontSize: 8, marginTop: 3 }}>{entry.score.timeSignature} · {t('{count} bars', { count: entry.score.measures.length })}</Text>
                    </Pressable>
                    <Pressable testID={`exercise.composition.remove.${entry.id}`} accessibilityRole="button" accessibilityLabel={t('Remove saved score {title}', { title: entry.score.title })} onPress={() => void removeComposedScore(entry)} style={{ minWidth: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
                      <Text style={{ color: colors.muted, fontSize: 8, fontWeight: '900' }}>{t('REMOVE')}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SavedPracticeTile({ item, onPractice, onRemove, disabled }: { item: SavedPracticePair; onPractice: () => void; onRemove: () => void; disabled: boolean }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const testKey = item.id.replace(/[^a-zA-Z0-9]/g, '_');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8 }}>
      <Pressable
        testID={`exercise.savedPair.${testKey}`}
        accessibilityRole="button"
        accessibilityLabel={t('Practice saved pattern: {pattern}, {meter}', { pattern: combinationTitle(item), meter: item.timeSignature })}
        disabled={disabled}
        onPress={onPractice}
        style={({ pressed }) => ({ flex: 1, minHeight: 58, paddingHorizontal: 13, paddingVertical: 9, justifyContent: 'center', borderRadius: 12, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line, opacity: disabled ? 0.65 : 1 })}
      >
        <Text numberOfLines={1} style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{combinationTitle(item)}</Text>
        <Text style={{ color: colors.muted, fontSize: 10, marginTop: 4 }}>{item.timeSignature} · {t('from result replay')}</Text>
      </Pressable>
      <Pressable
        testID={`exercise.savedPair.remove.${testKey}`}
        accessibilityRole="button"
        accessibilityLabel={t('Remove saved pattern {pattern}', { pattern: combinationTitle(item) })}
        onPress={onRemove}
        style={({ pressed }) => ({ minWidth: 74, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line })}
      >
        <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>{t('REMOVE')}</Text>
      </Pressable>
    </View>
  );
}

function CombinationTile({ record, onPress }: { record: CombinationProgress; onPress: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const accuracy = combinationAccuracy(record);
  const leftAccuracy = combinationHandAccuracy(record, 'left');
  const rightAccuracy = combinationHandAccuracy(record, 'right');
  const correctCount = record.leftHit + record.rightHit;
  const expectedCount = record.leftExpected + record.rightExpected;
  return (
    <Pressable
      testID={`exercise.pair.${record.id}`}
      accessibilityRole="button"
      accessibilityLabel={t('Practice {combination}, {accuracy} percent correct', {
        combination: t(combinationTitle(record)),
        accuracy: Math.round(accuracy),
      })}
      onPress={onPress}
      style={({ pressed }) => ({ flexGrow: 1, flexBasis: '31%', minWidth: 235, minHeight: 76, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 13, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line, opacity: pressed ? 0.84 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 11, fontWeight: '800' }}>{combinationTitle(record)}</Text>
        <Text style={{ color: accuracy < 80 ? colors.accent : colors.left, fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] }}>{Math.round(accuracy)}%</Text>
      </View>
      <Text style={{ color: colors.dim, fontSize: 9, marginTop: 6 }}>
        {record.timeSignature} · {correctCount}/{expectedCount} correct · L {leftAccuracy === null ? '—' : `${Math.round(leftAccuracy)}%`} · R {rightAccuracy === null ? '—' : `${Math.round(rightAccuracy)}%`} · {record.sessions} {record.sessions === 1 ? 'session' : 'sessions'}
      </Text>
    </Pressable>
  );
}

function PatternPicker({ hand, selection, mixtures, timeSignature, onChange }: { hand: Hand; selection: PatternSelection; mixtures: readonly MixturePattern[]; timeSignature: TimeSignature; onChange: (selection: PatternSelection) => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const color = hand === 'left' ? colors.left : colors.right;
  const options: { key: string; selection: PatternSelection }[] = [
    ...SUBDIVISIONS.map((subdivision) => ({ key: subdivision, selection: { subdivision, rest: false } })),
    ...mixtures.map((mixture) => ({ key: mixture.id, selection: { subdivision: 'quarter' as const, mixture: mixture.id, rest: false } })),
    { key: 'rest', selection: { subdivision: 'quarter', rest: true } },
  ];
  const isSelected = (option: (typeof options)[number]) =>
    selection.subdivision === option.selection.subdivision && selection.mixture === option.selection.mixture && selection.rest === option.selection.rest;

  return (
    <View style={{ flex: 1, minWidth: 0, padding: 12, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
      <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>{hand.toUpperCase()} HAND</Text>
      <PatternSelectionSymbol selection={selection} color={color} timeSignature={timeSignature} accessibilityLabel={patternSelectionLabel(selection, t)} selected />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((option) => (
          <PatternOptionButton
            key={option.key}
            hand={hand}
            optionKey={option.key}
            selection={option.selection}
            timeSignature={timeSignature}
            color={color}
            selected={isSelected(option)}
            onPress={() => onChange(option.selection)}
          />
        ))}
      </View>
    </View>
  );
}

function PatternSelectionSymbol({ selection, color, timeSignature, accessibilityLabel, selected = false }: {
  selection: PatternSelection;
  color: string;
  timeSignature: TimeSignature;
  accessibilityLabel: string;
  selected?: boolean;
}) {
  const symbolWidth = selected ? 120 : 52;
  const symbolHeight = selected ? 38 : 30;
  const slot = selected
    ? { width: 132, height: 54, paddingHorizontal: 6, marginBottom: 8 }
    : { width: 58, height: 36, paddingHorizontal: 3, marginBottom: 0 };

  return (
    <View style={{ width: slot.width, height: slot.height, marginBottom: slot.marginBottom, paddingHorizontal: slot.paddingHorizontal, alignItems: 'center', justifyContent: 'center' }}>
      {selection.mixture ? (
        <MixtureSymbol
          mixtureId={selection.mixture}
          color={color}
          compact={!selected}
          groupWidth={symbolWidth}
          maxWidth={symbolWidth}
          maxHeight={symbolHeight}
          accessibilityLabel={accessibilityLabel}
        />
      ) : (
        <RhythmSymbol
          subdivision={selection.subdivision}
          color={color}
          timeSignature={timeSignature}
          compact={!selected}
          groupWidth={symbolWidth}
          maxWidth={symbolWidth}
          maxHeight={symbolHeight}
          rest={selection.rest}
        />
      )}
    </View>
  );
}

function PatternOptionButton({ hand, optionKey, selection, timeSignature, color, selected, onPress }: {
  hand: Hand;
  optionKey: string;
  selection: PatternSelection;
  timeSignature: TimeSignature;
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const label = patternSelectionLabel(selection, t);

  return (
    <Pressable
      testID={`exercise.pair.${hand}.${optionKey}`}
      accessibilityRole="button"
      accessibilityLabel={t('Select {pattern}', { pattern: label })}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 70,
        minHeight: 52,
        paddingHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 9,
        backgroundColor: selected ? `${color}24` : pressed ? colors.surfaceRaised : colors.background,
        borderWidth: 1,
        borderColor: selected ? color : colors.line,
      })}
    >
      <PatternSelectionSymbol selection={selection} color={selected ? color : colors.muted} timeSignature={timeSignature} accessibilityLabel={label} />
    </Pressable>
  );
}

function ChoiceChip({ testID, label, selected, selectedColor, onPress }: { testID?: string; label: string; selected: boolean; selectedColor?: string; onPress: () => void }) {
  const { colors } = useTheme();
  const chipColor = selectedColor ?? colors.accent;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={{ minHeight: 30, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: selected ? `${chipColor}24` : colors.background, borderWidth: 1, borderColor: selected ? chipColor : colors.line }}>
      <Text numberOfLines={1} style={{ color: selected ? chipColor : colors.muted, fontSize: 9, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ testID, title, onPress, disabled, flex }: { testID: string; title: string; onPress: () => void; disabled: boolean; flex?: number }) {
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} disabled={disabled} style={({ pressed }) => ({ flex, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 9, borderRadius: 12, backgroundColor: pressed || disabled ? colors.surfaceRaised : colors.left, opacity: disabled ? 0.65 : 1 })}>
      <Text style={{ color: disabled ? colors.muted : colors.background, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>{title}</Text>
    </Pressable>
  );
}
