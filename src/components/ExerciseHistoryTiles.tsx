import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { combinationAccuracy, combinationHandAccuracy, combinationTitle } from '@/rhythm/targetedPractice';
import type { CombinationProgress, SavedPracticePair } from '@/rhythm/targetedPractice';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ExerciseHistoryTilesStyle1,
  ExerciseHistoryTilesStyle2,
  ExerciseHistoryTilesStyle3,
  ExerciseHistoryTilesStyle4,
  ExerciseHistoryTilesStyle5,
  ExerciseHistoryTilesStyle6,
  ExerciseHistoryTilesStyle7,
  ExerciseHistoryTilesStyle8,
  ExerciseHistoryTilesStyle9,
  ExerciseHistoryTilesStyle10,
  ExerciseHistoryTilesStyle11
} from '@/styles/exercise';

export function SavedPracticeTile({ item, onPractice, onRemove, disabled }: { item: SavedPracticePair; onPractice: () => void; onRemove: () => void; disabled: boolean }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const testKey = item.id.replace(/[^a-zA-Z0-9]/g, '_');
  return (
    <View style={ExerciseHistoryTilesStyle1()}>
      <Pressable
        testID={`exercise.savedPair.${testKey}`}
        accessibilityRole="button"
        accessibilityLabel={t('Practice saved pattern: {pattern}, {meter}', { pattern: combinationTitle(item), meter: item.timeSignature })}
        disabled={disabled}
        onPress={onPractice}
        style={({ pressed }) => (ExerciseHistoryTilesStyle2({ pressed, colors, disabled }))}
      >
        <Text numberOfLines={1} style={ExerciseHistoryTilesStyle3({ colors })}>{combinationTitle(item)}</Text>
        <Text style={ExerciseHistoryTilesStyle4({ colors })}>{item.timeSignature} · {t('from result replay')}</Text>
      </Pressable>
      <Pressable
        testID={`exercise.savedPair.remove.${testKey}`}
        accessibilityRole="button"
        accessibilityLabel={t('Remove saved pattern {pattern}', { pattern: combinationTitle(item) })}
        onPress={onRemove}
        style={({ pressed }) => (ExerciseHistoryTilesStyle5({ pressed, colors }))}
      >
        <Text style={ExerciseHistoryTilesStyle6({ colors })}>{t('REMOVE')}</Text>
      </Pressable>
    </View>
  );
}

export function CombinationTile({ record, onPress }: { record: CombinationProgress; onPress: () => void }) {
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
      style={({ pressed }) => (ExerciseHistoryTilesStyle7({ pressed, colors }))}
    >
      <View style={ExerciseHistoryTilesStyle8()}>
        <Text numberOfLines={1} style={ExerciseHistoryTilesStyle9({ colors })}>{combinationTitle(record)}</Text>
        <Text style={ExerciseHistoryTilesStyle10({ accuracy, colors })}>{Math.round(accuracy)}%</Text>
      </View>
      <Text style={ExerciseHistoryTilesStyle11({ colors })}>
        {record.timeSignature} · {correctCount}/{expectedCount} correct · L {leftAccuracy === null ? '—' : `${Math.round(leftAccuracy)}%`} · R {rightAccuracy === null ? '—' : `${Math.round(rightAccuracy)}%`} · {record.sessions} {record.sessions === 1 ? 'session' : 'sessions'}
      </Text>
    </Pressable>
  );
}
