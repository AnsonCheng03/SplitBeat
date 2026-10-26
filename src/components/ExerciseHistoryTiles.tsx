import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { combinationAccuracy, combinationHandAccuracy, combinationTitle } from '@/rhythm/targetedPractice';
import type { CombinationProgress, SavedPracticePair } from '@/rhythm/targetedPractice';
import { useTheme } from '@/theme/ThemeProvider';

export function SavedPracticeTile({ item, onPractice, onRemove, disabled }: { item: SavedPracticePair; onPractice: () => void; onRemove: () => void; disabled: boolean }) {
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
