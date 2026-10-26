import { TextInput, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ChoiceChip } from '@/components/ExercisePatternPicker';
import { CombinationTile, SavedPracticeTile } from '@/components/ExerciseHistoryTiles';
import type { CombinationFilter, CombinationProgress, SavedPracticePair } from '@/rhythm/targetedPractice';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ExerciseHistoryPanelStyle1,
  ExerciseHistoryPanelStyle2,
  ExerciseHistoryPanelStyle3,
  ExerciseHistoryPanelStyle4,
  ExerciseHistoryPanelStyle5,
  ExerciseHistoryPanelStyle6,
  ExerciseHistoryPanelStyle7,
  ExerciseHistoryPanelStyle8,
  ExerciseHistoryPanelStyle9,
  ExerciseHistoryPanelStyle10,
  ExerciseHistoryPanelStyle11,
  ExerciseHistoryPanelStyle12,
  exerciseSectionTitleStyle
} from '@/styles/exercise';

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
  const sectionTitle = exerciseSectionTitleStyle(colors);

  if (view === 'review') {
    return (
      <>
        <View style={ExerciseHistoryPanelStyle1()}>
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
            style={ExerciseHistoryPanelStyle2({ colors })}
          />
        </View>
        <View style={ExerciseHistoryPanelStyle3()}>
          {filterOptions.map((option) => (
            <ChoiceChip key={option.value} label={option.label} selected={filter === option.value} onPress={() => onFilterChange(option.value)} />
          ))}
        </View>
        {progress.length > 0 ? (
          <View style={ExerciseHistoryPanelStyle4()}>
            {progress.map((record) => (
              <CombinationTile key={record.id} record={record} onPress={() => onPracticeProgress(record)} />
            ))}
          </View>
        ) : (
          <View style={ExerciseHistoryPanelStyle5({ colors })}>
            <Text style={ExerciseHistoryPanelStyle6({ colors })}>
              {progressLoaded ? progress.length ? 'No combinations match this filter.' : 'Your combinations will appear here after practice.' : 'Loading your practice history…'}
            </Text>
            <Text style={ExerciseHistoryPanelStyle7({ colors })}>Accuracy is saved on this device and includes mixture patterns.</Text>
          </View>
        )}
      </>
    );
  }

  return (
    <>
      <Text style={sectionTitle}>{t('SAVED FROM YOUR RESULTS')}</Text>
      <Text style={ExerciseHistoryPanelStyle8({ colors })}>
        {t('Practice a saved bar pattern again, or remove it when you no longer need it.')}
      </Text>
      {savedPairs.length > 0 ? (
        <View style={ExerciseHistoryPanelStyle9()}>
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
        <View testID="exercise.saved.empty" style={ExerciseHistoryPanelStyle10({ colors })}>
          <Text style={ExerciseHistoryPanelStyle11({ colors })}>{savedPairsLoaded ? t('No saved patterns yet.') : t('Loading saved patterns…')}</Text>
          <Text style={ExerciseHistoryPanelStyle12({ colors })}>{t('Save a missed bar from the result replay and it will appear here.')}</Text>
        </View>
      )}
    </>
  );
}
