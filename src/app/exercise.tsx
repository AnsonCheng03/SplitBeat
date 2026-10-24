import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MIXTURE_PATTERNS, patternLabelForHand } from '@/rhythm/mixtures';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import {
  combinationAccuracy,
  combinationHandAccuracy,
  combinationTitle,
  createTypedBarScore,
  filterCombinationProgress,
  practicePairFromProgress,
  practicePairFromSelections,
} from '@/rhythm/targetedPractice';
import type { CombinationFilter, CombinationProgress } from '@/rhythm/targetedPractice';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';
import { SUBDIVISIONS } from '@/types/rhythm';
import type { Hand, MixturePatternId, Subdivision } from '@/types/rhythm';

type PatternSelection = { subdivision: Subdivision; mixture?: MixturePatternId; rest: boolean };
type ExerciseTab = 'review' | 'pair' | 'bar';

const filterOptions: { value: CombinationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'weak', label: 'Needs work' },
  { value: 'mixtures', label: 'Mixtures' },
  { value: 'rests', label: 'Rests' },
];

const subdivisionShortLabels: Partial<Record<Subdivision, string>> = {
  quarter: 'Quarter',
  eighth: 'Eighth',
  sixteenth: '16th',
  thirtySecond: '32nd',
  sixtyFourth: '64th',
};

function defaultBarText(timeSignature: string, unit: 'q' | 'e'): string {
  const [numerator, denominator] = timeSignature.split('/').map(Number);
  const quarterNotes = numerator * (4 / denominator);
  const count = Math.round(quarterNotes * (unit === 'q' ? 1 : 2));
  return Array.from({ length: count }, () => unit).join(' ');
}

function noteSelectionLabel(selection: PatternSelection): string {
  return patternLabelForHand(selection.subdivision, selection.rest, selection.mixture);
}

export default function ExerciseScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const {
    featureFlags,
    settings,
    combinationProgress,
    combinationProgressLoaded,
    prepareExercise,
  } = useRhythmSession();
  useEffect(() => {
    if (!featureFlags.focusPractice) router.replace('/');
  }, [featureFlags.focusPractice, router]);
  const [filter, setFilter] = useState<CombinationFilter>('all');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ExerciseTab>('review');
  const [leftSelection, setLeftSelection] = useState<PatternSelection>({ subdivision: 'quarter', rest: false });
  const [rightSelection, setRightSelection] = useState<PatternSelection>({ subdivision: 'eighth', rest: false });
  const [leftText, setLeftText] = useState(() => defaultBarText(settings.timeSignature, 'q'));
  const [rightText, setRightText] = useState(() => defaultBarText(settings.timeSignature, 'e'));
  const [starting, setStarting] = useState(false);

  const visibleProgress = useMemo(
    () => filterCombinationProgress(combinationProgress, filter, query),
    [combinationProgress, filter, query],
  );

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
      durationSeconds: settings.durationSeconds,
      handRestsEnabled: false,
    },
    patternPairs: [practicePairFromProgress(progress)],
    patternPairWeights: [1],
  }));

  const practiceSelectedPair = () => {
    if (leftSelection.rest && rightSelection.rest) {
      Alert.alert(t('Choose a rhythm'), t('At least one hand needs a note to practise.'));
      return;
    }
    const pair = practicePairFromSelections(leftSelection, rightSelection);
    return launch(() => prepareExercise(undefined, {
      settings: {
        trainingMode: 'two-hand',
        durationSeconds: settings.durationSeconds,
        handRestsEnabled: false,
      },
      patternPairs: [pair],
      patternPairWeights: [1],
    }));
  };

  const practiceTypedBar = () => {
    const result = createTypedBarScore(
      leftText,
      rightText,
      settings.timeSignature,
      settings.trainingMode,
      settings.singleHand,
    );
    if (!result.ok) {
      Alert.alert(t('Check the bar'), t(result.error));
      return;
    }
    return launch(() => prepareExercise(result.score));
  };

  return (
    <SafeAreaView testID="exercise.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
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
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 5 }}>Review combinations you miss, choose your own pair, or type a bar.</Text>
          </View>
          <View style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
            <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>{combinationProgress.length} SAVED PAIRS</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 17 }}>
          <ChoiceChip testID="exercise.tab.review" label="Review pairs" selected={activeTab === 'review'} onPress={() => setActiveTab('review')} />
          <ChoiceChip testID="exercise.tab.pair" label="Choose a pair" selected={activeTab === 'pair'} onPress={() => setActiveTab('pair')} />
          <ChoiceChip testID="exercise.tab.bar" label="Type a bar" selected={activeTab === 'bar'} onPress={() => setActiveTab('bar')} />
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
        ) : activeTab === 'pair' ? (
          <>
            <Text style={sectionTitle}>CHOOSE A RHYTHM FOR EACH HAND</Text>
            <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 12, marginTop: 9 }}>
              <PatternPicker hand="left" selection={leftSelection} onChange={setLeftSelection} />
              <PatternPicker hand="right" selection={rightSelection} onChange={setRightSelection} />
            </View>
            <PrimaryButton testID="exercise.practicePair" title={starting ? 'PREPARING…' : 'PRACTICE THIS PAIR'} onPress={() => void practiceSelectedPair()} disabled={starting} />
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <Text style={sectionTitle}>TYPE A BAR</Text>
              <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900' }}>{settings.timeSignature} · {settings.trainingMode === 'single-hand' ? `${settings.singleHand.toUpperCase()} HAND` : 'BOTH HANDS'}</Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 10, marginTop: 5, marginBottom: 10 }}>Type note values in order, separated by spaces. Rests use an “r” prefix. Every active hand must fill one full bar.</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {settings.trainingMode === 'two-hand' || settings.singleHand === 'left' ? (
                <BarInput label="LEFT HAND" color={colors.left} value={leftText} onChangeText={setLeftText} testID="exercise.leftBar" />
              ) : null}
              {settings.trainingMode === 'two-hand' || settings.singleHand === 'right' ? (
                <BarInput label="RIGHT HAND" color={colors.right} value={rightText} onChangeText={setRightText} testID="exercise.rightBar" />
              ) : null}
            </View>
            <View style={{ paddingHorizontal: 13, paddingVertical: 10, marginTop: 8, borderRadius: 11, backgroundColor: colors.surface }}>
              <Text style={{ color: colors.muted, fontSize: 9, lineHeight: 15 }}>
                q quarter · e eighth · de dotted eighth · 16 sixteenth · 32 demisemiquaver · 64 hemidemisemiquaver · dq dotted quarter · r16 sixteenth rest · re eighth rest
              </Text>
              <Text style={{ color: colors.dim, fontSize: 9, marginTop: 3 }}>Example in 4/4: q e e 16 16 q q · Mix notes and rests freely.</Text>
            </View>
            <PrimaryButton testID="exercise.practiceBar" title={starting ? 'PREPARING…' : 'PRACTICE THIS BAR'} onPress={() => void practiceTypedBar()} disabled={starting} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CombinationTile({ record, onPress }: { record: CombinationProgress; onPress: () => void }) {
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

function PatternPicker({ hand, selection, onChange }: { hand: Hand; selection: PatternSelection; onChange: (selection: PatternSelection) => void }) {
  const color = hand === 'left' ? colors.left : colors.right;
  const options: { key: string; label: string; subdivision: Subdivision; mixture?: MixturePatternId; rest: boolean }[] = [
    ...SUBDIVISIONS.map((subdivision) => ({ key: subdivision, label: subdivisionShortLabels[subdivision] ?? SUBDIVISION_LABELS[subdivision], subdivision, rest: false })),
    ...MIXTURE_PATTERNS.map((mixture) => ({ key: mixture.id, label: mixture.label, subdivision: 'quarter' as const, mixture: mixture.id, rest: false })),
    { key: 'rest', label: 'Rest', subdivision: 'quarter', rest: true },
  ];
  const isSelected = (option: (typeof options)[number]) =>
    selection.subdivision === option.subdivision && selection.mixture === option.mixture && selection.rest === option.rest;

  return (
    <View style={{ flex: 1, minWidth: 0, padding: 12, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
      <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>{hand.toUpperCase()} HAND</Text>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 4, marginBottom: 8 }}>{noteSelectionLabel(selection)}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {options.map((option) => (
          <ChoiceChip
            key={option.key}
            label={option.label}
            selected={isSelected(option)}
            selectedColor={color}
            onPress={() => onChange({ subdivision: option.subdivision, ...(option.mixture ? { mixture: option.mixture } : {}), rest: option.rest })}
          />
        ))}
      </View>
    </View>
  );
}

function BarInput({ label, color, value, onChangeText, testID }: { label: string; color: string; value: string; onChangeText: (value: string) => void; testID: string }) {
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, minWidth: 0, padding: 11, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
      <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>{label}</Text>
      <TextInput
        testID={testID}
        accessibilityLabel={t('{hand} bar notes', { hand: t(label.toLowerCase()) })}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        placeholder="q e e 16 16 q"
        placeholderTextColor={colors.dim}
        style={{ minHeight: 41, color: colors.text, fontFamily: 'monospace', fontSize: 12, marginTop: 5, paddingHorizontal: 9, borderRadius: 9, backgroundColor: colors.background, borderColor: colors.line, borderWidth: 1 }}
      />
    </View>
  );
}

function ChoiceChip({ testID, label, selected, selectedColor = colors.accent, onPress }: { testID?: string; label: string; selected: boolean; selectedColor?: string; onPress: () => void }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={{ minHeight: 30, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: selected ? `${selectedColor}24` : colors.background, borderWidth: 1, borderColor: selected ? selectedColor : colors.line }}>
      <Text numberOfLines={1} style={{ color: selected ? selectedColor : colors.muted, fontSize: 9, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ testID, title, onPress, disabled }: { testID: string; title: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} disabled={disabled} style={({ pressed }) => ({ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 9, borderRadius: 12, backgroundColor: pressed || disabled ? colors.surfaceRaised : colors.left, opacity: disabled ? 0.65 : 1 })}>
      <Text style={{ color: disabled ? colors.muted : colors.background, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>{title}</Text>
    </Pressable>
  );
}

const sectionTitle = { color: colors.muted, fontSize: 10, fontWeight: '900' as const, letterSpacing: 1.2 };
