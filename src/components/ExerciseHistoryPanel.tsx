import { TextInput, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ChoiceChip } from '@/components/ExercisePatternPicker';
import { CombinationTile, SavedPracticeTile } from '@/components/ExerciseHistoryTiles';
import type { CombinationFilter, CombinationProgress, SavedPracticePair } from '@/rhythm/targetedPractice';
import { useTheme } from '@/theme/ThemeProvider';

const filterOptions: { value: CombinationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'weak', label: 'Needs work' },
  { value: 'mixtures', label: 'Mixtures' },
  { value: 'rests', label: 'Rests' },
];

export function ExerciseHistoryPanel({
  view,
  progress,
  progressLoaded,
  savedPairs,
  savedPairsLoaded,
  filter,
  query,
  starting,
  onFilterChange,
  onQueryChange,
  onPracticeProgress,
  onPracticeSaved,
  onRemoveSaved,
}: {
  view: 'review' | 'later';
  progress: CombinationProgress[];
  progressLoaded: boolean;
  savedPairs: SavedPracticePair[];
  savedPairsLoaded: boolean;
  filter: CombinationFilter;
  query: string;
  starting: boolean;
  onFilterChange: (filter: CombinationFilter) => void;
  onQueryChange: (query: string) => void;
  onPracticeProgress: (record: CombinationProgress) => void;
  onPracticeSaved: (pair: SavedPracticePair) => void;
  onRemoveSaved: (id: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const sectionTitle = { color: colors.muted, fontSize: 10, fontWeight: '900' as const, letterSpacing: 1.2 };

  if (view === 'review') {
    return (
      <>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 9 }}>
          <Text style={sectionTitle}>YOUR COMBINATIONS</Text>
          <TextInput
            testID="exercise.search"
            accessibilityLabel={t('Search rhythm combinations')}
            value={query}
            onChangeText={onQueryChange}
            placeholder={t('Search notes or meter')}
            placeholderTextColor={colors.dim}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ width: 205, minHeight: 37, color: colors.text, fontSize: 11, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1 }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 7, marginBottom: 10 }}>
          {filterOptions.map((option) => (
            <ChoiceChip key={option.value} label={option.label} selected={filter === option.value} onPress={() => onFilterChange(option.value)} />
          ))}
        </View>
        {progress.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 18 }}>
            {progress.map((record) => (
              <CombinationTile key={record.id} record={record} onPress={() => onPracticeProgress(record)} />
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingVertical: 13, marginBottom: 18, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>
              {progressLoaded ? progress.length ? 'No combinations match this filter.' : 'Your combinations will appear here after practice.' : 'Loading your practice history…'}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 10, marginTop: 4 }}>Accuracy is saved on this device and includes mixture patterns.</Text>
          </View>
        )}
      </>
    );
  }

  return (
    <>
      <Text style={sectionTitle}>{t('SAVED FROM YOUR RESULTS')}</Text>
      <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 10 }}>
        {t('Practice a saved bar pattern again, or remove it when you no longer need it.')}
      </Text>
      {savedPairs.length > 0 ? (
        <View style={{ gap: 8, marginBottom: 18 }}>
          {savedPairs.map((saved) => (
            <SavedPracticeTile
              key={saved.id}
              item={saved}
              onPractice={() => onPracticeSaved(saved)}
              onRemove={() => onRemoveSaved(saved.id)}
              disabled={starting}
            />
          ))}
        </View>
      ) : (
        <View testID="exercise.saved.empty" style={{ paddingHorizontal: 16, paddingVertical: 13, marginBottom: 18, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>{savedPairsLoaded ? t('No saved patterns yet.') : t('Loading saved patterns…')}</Text>
          <Text style={{ color: colors.muted, fontSize: 10, marginTop: 4 }}>{t('Save a missed bar from the result replay and it will appear here.')}</Text>
        </View>
      )}
    </>
  );
}
