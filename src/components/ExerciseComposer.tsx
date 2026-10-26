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
import { ExerciseComposerStyle1,
  ExerciseComposerStyle2,
  ExerciseComposerStyle3,
  ExerciseComposerStyle4,
  ExerciseComposerStyle5,
  ExerciseComposerStyle6,
  ExerciseComposerStyle7,
  ExerciseComposerStyle8,
  ExerciseComposerStyle9,
  ExerciseComposerStyle10,
  ExerciseComposerStyle11,
  ExerciseComposerStyle12,
  ExerciseComposerStyle13,
  ExerciseComposerStyle14,
  ExerciseComposerStyle15,
  ExerciseComposerStyle16,
  ExerciseComposerStyle17,
  ExerciseComposerStyle18,
  ExerciseComposerStyle19,
  ExerciseComposerStyle20,
  ExerciseComposerStyle21,
  ExerciseComposerStyle22,
  ExerciseComposerStyle23,
  ExerciseComposerStyle24,
  ExerciseComposerStyle25,
  ExerciseComposerStyle26,
  ExerciseComposerStyle27,
  ExerciseComposerStyle28,
  ExerciseComposerStyle29, ExerciseComposerStyle30, ExerciseComposerStyle31, ExerciseComposerStyle32, exerciseSectionTitleStyle } from '@/styles/exercise';

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
  const sectionTitle = exerciseSectionTitleStyle(colors);
  const noteColor = hand === 'left' ? colors.left : colors.right;
  const selectedHandNotes = hand === 'left' ? leftNotes : rightNotes;
  const selectedDuration = selectedHandNotes.reduce((total, item) => total + item.durationQuarter, 0);
  const nextBar = Math.floor((selectedDuration + 0.000001) / barLengthQuarterNotes) + 1;

  return (
    <>
      <View style={ExerciseComposerStyle1()}>
        <Text style={sectionTitle}>{t('COMPOSE A SCORE')}</Text>
        <Text style={ExerciseComposerStyle2({ colors })}>{settings.timeSignature} · {settings.trainingMode === 'single-hand' ? `${settings.singleHand.toUpperCase()} HAND` : 'BOTH HANDS'}</Text>
      </View>
      <Text style={ExerciseComposerStyle3({ colors })}>{t('Choose a hand, then tap a note symbol to add it in order. The next symbol starts in the next bar automatically.')}</Text>

      {settings.trainingMode === 'two-hand' ? (
        <View style={ExerciseComposerStyle4()}>
          <ChoiceChip testID="exercise.composer.hand.left" label={t('LEFT HAND')} selected={hand === 'left'} selectedColor={colors.left} onPress={() => onHandChange('left')} />
          <ChoiceChip testID="exercise.composer.hand.right" label={t('RIGHT HAND')} selected={hand === 'right'} selectedColor={colors.right} onPress={() => onHandChange('right')} />
        </View>
      ) : null}

      <View style={ExerciseComposerStyle5()}>
        <ChoiceChip testID="exercise.composer.mode.note" label={t('Add notes')} selected={mode === 'note'} selectedColor={noteColor} onPress={() => onModeChange('note')} />
        <ChoiceChip testID="exercise.composer.mode.rest" label={t('Add rests')} selected={mode === 'rest'} selectedColor={colors.accent} onPress={() => onModeChange('rest')} />
      </View>

      <Text style={sectionTitle}>{t('NOTE VALUES')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ExerciseComposerStyle30()}>
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

      <Text style={ExerciseComposerStyle6({ sectionTitle })}>{t('TUPLET GROUPS')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ExerciseComposerStyle31()}>
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

      <View style={ExerciseComposerStyle7()}>
        <Text testID="exercise.composer.timeline" style={ExerciseComposerStyle8({ noteColor })}>
          {t('HAND TIMELINE · {count} symbols · {duration} quarter notes. Next symbol starts in bar {bar}.', {
            count: selectedHandNotes.length,
            duration: Number(selectedDuration.toFixed(3)),
            bar: nextBar,
          })}
        </Text>
        <Pressable testID="exercise.composer.undo" accessibilityRole="button" accessibilityLabel={t('Undo last symbol')} disabled={selectedHandNotes.length === 0} onPress={() => onUndo(hand)} style={ExerciseComposerStyle9({ colors, selectedHandNotes })}>
          <Text style={ExerciseComposerStyle10({ colors })}>{t('UNDO')}</Text>
        </Pressable>
        <Pressable testID="exercise.composer.clear" accessibilityRole="button" accessibilityLabel={t('Clear hand')} disabled={selectedHandNotes.length === 0} onPress={() => onClear(hand)} style={ExerciseComposerStyle11({ colors, selectedHandNotes })}>
          <Text style={ExerciseComposerStyle12({ colors })}>{t('CLEAR')}</Text>
        </Pressable>
      </View>

      {score ? (
        <>
          <Text style={ExerciseComposerStyle13({ colors })}>
            {score.measures.length === 1 ? t('1 bar') : t('{count} bars', { count: score.measures.length })}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={ExerciseComposerStyle32()}>
            {score.measures.slice(0, 12).map((measure) => {
              const preview = composerPreviewDimensions(measure);
              return (
                <View key={measure.index} style={ExerciseComposerStyle14({ preview, colors })}>
                  <Text style={ExerciseComposerStyle15({ colors })}>{t('BAR {bar}', { bar: measure.index + 1 })}</Text>
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
              <View style={ExerciseComposerStyle16()}>
                <Text style={ExerciseComposerStyle17({ colors })}>+ {score.measures.length - 12}</Text>
              </View>
            ) : null}
          </ScrollView>
          <Text style={ExerciseComposerStyle18({ colors })}>{t('Notes are grouped inside each bar according to the selected time signature. A note crossing a bar line is tied and is not tapped again.')}</Text>
        </>
      ) : (
        <Text style={ExerciseComposerStyle19({ colors })}>{t(result.ok ? 'Add at least one note to the active hand or hands.' : result.error)}</Text>
      )}

      <View style={ExerciseComposerStyle20()}>
        <PrimaryButton testID="exercise.practiceBar" flex={1} title={starting ? t('PREPARING…') : t('PRACTICE COMPOSITION')} onPress={onPractice} disabled={starting || !score} />
        {featureFlags.savedScoreLibrary ? (
          <PrimaryButton testID="exercise.saveComposition" flex={1} title={saving ? t('SAVING…') : compositionAlreadySaved ? t('SAVED ✓') : t('SAVE SCORE')} onPress={onSave} disabled={saving || compositionAlreadySaved || !score} />
        ) : null}
      </View>

      {featureFlags.savedScoreLibrary ? (
        <View style={ExerciseComposerStyle21()}>
          <Text style={ExerciseComposerStyle22({ sectionTitle })}>{t('SAVED COMPOSITIONS')}</Text>
          {savedCompositions.length === 0 ? (
            <Text style={ExerciseComposerStyle23({ colors })}>{t('No saved compositions yet.')}</Text>
          ) : savedCompositions.map((entry) => (
            <View key={entry.id} style={ExerciseComposerStyle24()}>
              <Pressable testID={`exercise.composition.${entry.id}`} accessibilityRole="button" accessibilityLabel={t('Practice this score') + `: ${entry.score.title}`} onPress={() => onPracticeSaved(entry)} disabled={starting} style={({ pressed }) => (ExerciseComposerStyle25({ pressed, colors }))}>
                <Text raw numberOfLines={1} style={ExerciseComposerStyle26({ colors })}>{entry.score.title}</Text>
                <Text style={ExerciseComposerStyle27({ colors })}>{entry.score.timeSignature} · {t('{count} bars', { count: entry.score.measures.length })}</Text>
              </Pressable>
              <Pressable testID={`exercise.composition.remove.${entry.id}`} accessibilityRole="button" accessibilityLabel={t('Remove saved score {title}', { title: entry.score.title })} onPress={() => onRemoveSaved(entry)} style={ExerciseComposerStyle28({ colors })}>
                <Text style={ExerciseComposerStyle29({ colors })}>{t('REMOVE')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}
