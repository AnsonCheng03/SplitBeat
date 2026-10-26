import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ComposerSymbolButton } from '@/components/ComposerSymbolButton';
import { PrimaryButton, ChoiceChip } from '@/components/ExercisePatternPicker';
import { ScoreRhythmMeasure } from '@/components/ScoreRhythmMeasure';
import type { FeatureFlags } from '@/features/featureFlags';
import { composerPreviewDimensions } from '@/rhythm/scoreLayout';
import { COMPOSER_TUPLET_SYMBOLS, NOTE_VALUE_SYMBOLS } from '@/rhythm/scoreComposer';
import type { ComposerSymbolId, ComposedNoteValue, ComposeRhythmScoreResult } from '@/rhythm/scoreComposer';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import { useTheme } from '@/theme/ThemeProvider';
import type { ImportedScoreLibraryEntry } from '@/rhythm/importedScoreLibrary';
import type { ExerciseSettings, Hand } from '@/types/rhythm';
import type { ImportedRhythmScore } from '@/types/importedScore';

export function ExerciseComposer({
  settings,
  featureFlags,
  hand,
  mode,
  leftNotes,
  rightNotes,
  result,
  score,
  barLengthQuarterNotes,
  compositionAlreadySaved,
  savedCompositions,
  starting,
  saving,
  onHandChange,
  onModeChange,
  onAppendSymbol,
  onUndo,
  onClear,
  onPractice,
  onSave,
  onPracticeSaved,
  onRemoveSaved,
}: {
  settings: ExerciseSettings;
  featureFlags: FeatureFlags;
  hand: Hand;
  mode: 'note' | 'rest';
  leftNotes: ComposedNoteValue[];
  rightNotes: ComposedNoteValue[];
  result: ComposeRhythmScoreResult;
  score: ImportedRhythmScore | null;
  barLengthQuarterNotes: number;
  compositionAlreadySaved: boolean;
  savedCompositions: ImportedScoreLibraryEntry[];
  starting: boolean;
  saving: boolean;
  onHandChange: (hand: Hand) => void;
  onModeChange: (mode: 'note' | 'rest') => void;
  onAppendSymbol: (symbolId: ComposerSymbolId) => void;
  onUndo: (hand: Hand) => void;
  onClear: (hand: Hand) => void;
  onPractice: () => void;
  onSave: () => void;
  onPracticeSaved: (entry: ImportedScoreLibraryEntry) => void;
  onRemoveSaved: (entry: ImportedScoreLibraryEntry) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const sectionTitle = { color: colors.muted, fontSize: 10, fontWeight: '900' as const, letterSpacing: 1.2 };
  const noteColor = hand === 'left' ? colors.left : colors.right;
  const selectedHandNotes = hand === 'left' ? leftNotes : rightNotes;
  const selectedDuration = selectedHandNotes.reduce((total, item) => total + item.durationQuarter, 0);
  const nextBar = Math.floor((selectedDuration + 0.000001) / barLengthQuarterNotes) + 1;

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <Text style={sectionTitle}>{t('COMPOSE A SCORE')}</Text>
        <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900' }}>{settings.timeSignature} · {settings.trainingMode === 'single-hand' ? `${settings.singleHand.toUpperCase()} HAND` : 'BOTH HANDS'}</Text>
      </View>
      <Text style={{ color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 5, marginBottom: 10 }}>{t('Choose a hand, then tap a note symbol to add it in order. The next symbol starts in the next bar automatically.')}</Text>

      {settings.trainingMode === 'two-hand' ? (
        <View style={{ flexDirection: 'row', gap: 7, marginBottom: 8 }}>
          <ChoiceChip testID="exercise.composer.hand.left" label={t('LEFT HAND')} selected={hand === 'left'} selectedColor={colors.left} onPress={() => onHandChange('left')} />
          <ChoiceChip testID="exercise.composer.hand.right" label={t('RIGHT HAND')} selected={hand === 'right'} selectedColor={colors.right} onPress={() => onHandChange('right')} />
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 7, marginBottom: 8 }}>
        <ChoiceChip testID="exercise.composer.mode.note" label={t('Add notes')} selected={mode === 'note'} selectedColor={noteColor} onPress={() => onModeChange('note')} />
        <ChoiceChip testID="exercise.composer.mode.rest" label={t('Add rests')} selected={mode === 'rest'} selectedColor={colors.accent} onPress={() => onModeChange('rest')} />
      </View>

      <Text style={sectionTitle}>{t('NOTE VALUES')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingVertical: 7 }}>
        {NOTE_VALUE_SYMBOLS.filter((symbol) => featureFlags.sixtyFourthNotes || symbol.id !== 'sixtyFourth').map((symbol) => (
          <ComposerSymbolButton
            key={symbol.id}
            testID={`exercise.composer.symbol.${symbol.id}`}
            symbolId={symbol.id as ComposerSymbolId}
            timeSignature={settings.timeSignature}
            color={noteColor}
            isRest={mode === 'rest'}
            onPress={() => onAppendSymbol(symbol.id as ComposerSymbolId)}
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
            color={noteColor}
            isRest={mode === 'rest'}
            onPress={() => onAppendSymbol(symbol.id)}
          />
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 2, marginBottom: 8 }}>
        <Text testID="exercise.composer.timeline" style={{ flex: 1, color: noteColor, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }}>
          {t('HAND TIMELINE · {count} symbols · {duration} quarter notes. Next symbol starts in bar {bar}.', {
            count: selectedHandNotes.length,
            duration: Number(selectedDuration.toFixed(3)),
            bar: nextBar,
          })}
        </Text>
        <Pressable testID="exercise.composer.undo" accessibilityRole="button" accessibilityLabel={t('Undo last symbol')} disabled={selectedHandNotes.length === 0} onPress={() => onUndo(hand)} style={{ paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.surface, opacity: selectedHandNotes.length === 0 ? 0.45 : 1 }}>
          <Text style={{ color: colors.muted, fontSize: 8, fontWeight: '900' }}>{t('UNDO')}</Text>
        </Pressable>
        <Pressable testID="exercise.composer.clear" accessibilityRole="button" accessibilityLabel={t('Clear hand')} disabled={selectedHandNotes.length === 0} onPress={() => onClear(hand)} style={{ paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.surface, opacity: selectedHandNotes.length === 0 ? 0.45 : 1 }}>
          <Text style={{ color: colors.muted, fontSize: 8, fontWeight: '900' }}>{t('CLEAR')}</Text>
        </Pressable>
      </View>

      {score ? (
        <>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 5 }}>
            {score.measures.length === 1 ? t('1 bar') : t('{count} bars', { count: score.measures.length })}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: 8, paddingBottom: 7 }}>
            {score.measures.slice(0, 12).map((measure) => {
              const preview = composerPreviewDimensions(measure);
              return (
                <View key={measure.index} style={{ width: preview.cardWidth, minHeight: 87, justifyContent: 'center', paddingHorizontal: 4, paddingVertical: 5, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
                  <Text style={{ color: colors.dim, fontSize: 8, fontWeight: '900', letterSpacing: 1, paddingLeft: 4, marginBottom: 1 }}>{t('BAR {bar}', { bar: measure.index + 1 })}</Text>
                  <ScoreRhythmMeasure
                    measure={measure}
                    number={measure.index + 1}
                    count={score.measures.length}
                    compact
                    hideHeader
                    beamGroupQuarterNotes={pulseQuarterNotes(settings.timeSignature)}
                    initialNotationWidth={preview.notationWidth}
                    testIdPrefix={`exercise.composer.preview.${measure.index + 1}`}
                  />
                </View>
              );
            })}
            {score.measures.length > 12 ? (
              <View style={{ width: 110, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800' }}>+ {score.measures.length - 12}</Text>
              </View>
            ) : null}
          </ScrollView>
          <Text style={{ color: colors.dim, fontSize: 9, lineHeight: 14, marginBottom: 3 }}>{t('Notes are grouped inside each bar according to the selected time signature. A note crossing a bar line is tied and is not tapped again.')}</Text>
        </>
      ) : (
        <Text style={{ color: colors.dim, fontSize: 10, paddingVertical: 9 }}>{t(result.ok ? 'Add at least one note to the active hand or hands.' : result.error)}</Text>
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <PrimaryButton testID="exercise.practiceBar" flex={1} title={starting ? t('PREPARING…') : t('PRACTICE COMPOSITION')} onPress={onPractice} disabled={starting || !score} />
        {featureFlags.savedScoreLibrary ? (
          <PrimaryButton testID="exercise.saveComposition" flex={1} title={saving ? t('SAVING…') : compositionAlreadySaved ? t('SAVED ✓') : t('SAVE SCORE')} onPress={onSave} disabled={saving || compositionAlreadySaved || !score} />
        ) : null}
      </View>

      {featureFlags.savedScoreLibrary ? (
        <View style={{ marginTop: 15 }}>
          <Text style={{ ...sectionTitle, marginBottom: 7 }}>{t('SAVED COMPOSITIONS')}</Text>
          {savedCompositions.length === 0 ? (
            <Text style={{ color: colors.dim, fontSize: 10, paddingVertical: 6 }}>{t('No saved compositions yet.')}</Text>
          ) : savedCompositions.map((entry) => (
            <View key={entry.id} style={{ flexDirection: 'row', gap: 7, marginBottom: 6 }}>
              <Pressable testID={`exercise.composition.${entry.id}`} accessibilityRole="button" accessibilityLabel={t('Practice this score') + `: ${entry.score.title}`} onPress={() => onPracticeSaved(entry)} disabled={starting} style={({ pressed }) => ({ flex: 1, minHeight: 47, justifyContent: 'center', paddingHorizontal: 11, borderRadius: 10, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line })}>
                <Text raw numberOfLines={1} style={{ color: colors.text, fontSize: 10, fontWeight: '800' }}>{entry.score.title}</Text>
                <Text style={{ color: colors.dim, fontSize: 8, marginTop: 3 }}>{entry.score.timeSignature} · {t('{count} bars', { count: entry.score.measures.length })}</Text>
              </Pressable>
              <Pressable testID={`exercise.composition.remove.${entry.id}`} accessibilityRole="button" accessibilityLabel={t('Remove saved score {title}', { title: entry.score.title })} onPress={() => onRemoveSaved(entry)} style={{ minWidth: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
                <Text style={{ color: colors.muted, fontSize: 8, fontWeight: '900' }}>{t('REMOVE')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}
