import { Pressable, View, useWindowDimensions } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScoreRhythmMeasure } from '@/components/ScoreRhythmMeasure';
import { placeSingleTrackOnHand } from '@/rhythm/importedScoreLibrary';
import type { ImportedScoreSource, ImportedScoreLibraryEntry } from '@/rhythm/importedScoreLibrary';
import { scoreTrainingMode, type ScoreDisplayMode } from '@/rhythm/scoreStaff';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import { useTheme } from '@/theme/ThemeProvider';
import type { ImportedRhythmScore } from '@/types/importedScore';
import type { Hand } from '@/types/rhythm';
import {
  ImportedScorePreviewStyle1,
  ImportedScorePreviewStyle2,
  ImportedScorePreviewStyle3,
  ImportedScorePreviewStyle4,
  ImportedScorePreviewStyle5,
  ImportedScorePreviewStyle6,
  ImportedScorePreviewStyle7,
  ImportedScorePreviewStyle8,
  ImportedScorePreviewStyle9,
  ImportedScorePreviewStyle10,
  ImportedScorePreviewStyle11,
  ImportedScorePreviewStyle12,
  ImportedScorePreviewStyle13,
  ImportedScorePreviewStyle14,
  ImportedScorePreviewStyle15,
  ImportedScorePreviewStyle16,
  ImportedScorePreviewStyle17,
  ImportedScorePreviewStyle18,
  ImportedScorePreviewStyle19,
  ImportedScorePreviewStyle20,
  ImportedScorePreviewStyle21,
  ImportedScorePreviewStyle22,
  ImportedScorePreviewStyle23,
  ImportedScorePreviewStyle24,
  ImportedScorePreviewStyle25,
  ImportedScorePreviewStyle26,
  ImportedScorePreviewStyle27,
  ImportedScorePreviewStyle28,
  ImportedScorePreviewStyle29
} from '@/styles/exercise';

export function ImportedScorePreview({
  score,
  fileName,
  source,
  singleHand,
  savedLibraryEnabled,
  scoreNotationEnabled,
  currentEntry,
  previewMeasureIndex,
  scoreDisplayMode,
  importing,
  starting,
  onMeasureChange,
  onDisplayModeChange,
  onSave,
  onOpenLibrary,
  onImport,
  onStart,
}: {
  score: ImportedRhythmScore;
  fileName: string;
  source: ImportedScoreSource;
  singleHand: Hand;
  savedLibraryEnabled: boolean;
  scoreNotationEnabled: boolean;
  currentEntry?: ImportedScoreLibraryEntry;
  previewMeasureIndex: number;
  scoreDisplayMode: ScoreDisplayMode;
  importing: boolean;
  starting: boolean;
  onMeasureChange: (index: number) => void;
  onDisplayModeChange: (mode: ScoreDisplayMode) => void;
  onSave: (saved: boolean) => void;
  onOpenLibrary: () => void;
  onImport: () => void;
  onStart: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const previewScore = placeSingleTrackOnHand(score, singleHand);
  const hasOneActiveHand = scoreTrainingMode(score, singleHand).trainingMode === 'single-hand';
  const previewContentWidth = Math.min(850, width - insets.left - insets.right);
  const initialPreviewNotationWidth = Math.max(0, previewContentWidth - 210);
  const scoreTrackDescription = t(score.trackCount === 1 ? '1 track · one hand' : hasOneActiveHand ? '2 tracks · one active hand' : '2 tracks · two hands');
  const scoreMeasureDescription = t('{count} {unit}', { count: score.measures.length, unit: t(score.measures.length === 1 ? 'bar' : 'bars') });
  const scoreTempoDescription = score.bpm ? `${score.bpm} BPM` : t('uses your saved tempo');
  const scoreNoteDescription = hasOneActiveHand
    ? t('{count} notes · one-hand mode', { count: score.measures.reduce((count, measure) => count + measure.leftEvents.filter((event) => !event.isRest).length + measure.rightEvents.filter((event) => !event.isRest).length, 0) })
    : t('{left} left-hand notes · {right} right-hand notes', {
        left: score.measures.reduce((count, measure) => count + measure.leftEvents.filter((event) => !event.isRest).length, 0),
        right: score.measures.reduce((count, measure) => count + measure.rightEvents.filter((event) => !event.isRest).length, 0),
      });

  return (
    <>
      <View style={ImportedScorePreviewStyle1()}>
        <Text raw style={ImportedScorePreviewStyle2({ colors })}>{score.title}</Text>
        <View style={ImportedScorePreviewStyle3()}>
          <Text raw numberOfLines={1} style={ImportedScorePreviewStyle4({ colors })}>{fileName}</Text>
          {savedLibraryEnabled ? (
            <Pressable
              testID="scoreImport.save"
              accessibilityRole="button"
              accessibilityLabel={t(currentEntry?.saved ? 'Remove score from saved scores' : 'Save this score')}
              disabled={!currentEntry}
              onPress={() => onSave(!currentEntry?.saved)}
              style={({ pressed }) => (ImportedScorePreviewStyle5({ pressed, colors, currentEntry }))}
            >
              <Text style={ImportedScorePreviewStyle6({ currentEntry, colors })}>{!currentEntry ? 'SAVING…' : currentEntry.saved ? 'SAVED ✓' : 'SAVE SCORE'}</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={ImportedScorePreviewStyle7({ colors })}>{source.toUpperCase()} · {savedLibraryEnabled ? 'STORED ON THIS DEVICE' : 'SESSION ONLY'}</Text>
        <Text testID="scoreImport.summary" style={ImportedScorePreviewStyle8({ colors })}>
          {t('{tracks} · {measures} · {meter} · {tempo}', { tracks: scoreTrackDescription, measures: scoreMeasureDescription, meter: score.timeSignature, tempo: scoreTempoDescription })}
        </Text>
        <Text style={ImportedScorePreviewStyle9({ colors })}>{scoreNoteDescription}</Text>
      </View>
      {score.warnings.map((warning) => (
        <Text key={warning} style={ImportedScorePreviewStyle10({ colors })}>{warning}</Text>
      ))}
      <View style={ImportedScorePreviewStyle11({ colors })}>
        <Pressable
          testID="scoreImport.previousMeasure"
          disabled={previewMeasureIndex === 0}
          onPress={() => onMeasureChange(Math.max(0, previewMeasureIndex - 1))}
          accessibilityLabel={t('Previous score measure')}
          style={ImportedScorePreviewStyle12({ previewMeasureIndex })}
        >
          <Text style={ImportedScorePreviewStyle13({ colors })}>‹</Text>
        </Pressable>
        <View style={ImportedScorePreviewStyle14()}>
          <ScoreRhythmMeasure
            measure={previewScore.measures[previewMeasureIndex]}
            number={previewMeasureIndex + 1}
            count={score.measures.length}
            compact
            beamGroupQuarterNotes={pulseQuarterNotes(score.timeSignature)}
            initialNotationWidth={initialPreviewNotationWidth}
          />
        </View>
        <Pressable
          testID="scoreImport.nextMeasure"
          disabled={previewMeasureIndex >= score.measures.length - 1}
          onPress={() => onMeasureChange(Math.min(score.measures.length - 1, previewMeasureIndex + 1))}
          accessibilityLabel={t('Next score measure')}
          style={ImportedScorePreviewStyle15({ previewMeasureIndex, score })}
        >
          <Text style={ImportedScorePreviewStyle16({ colors })}>›</Text>
        </Pressable>
      </View>
      <Text style={ImportedScorePreviewStyle17({ colors })}>Check the extracted rhythms against your score before you start.</Text>
      {scoreNotationEnabled ? <Text style={ImportedScorePreviewStyle18({ colors })}>PRACTICE DISPLAY</Text> : null}
      {scoreNotationEnabled ? (
        <View style={ImportedScorePreviewStyle19()}>
          {([
            { value: 'focus', label: 'ONE NOTE', detail: 'Current beat · large hand panels' },
            { value: 'slide', label: 'SLIDE', detail: 'Move one bar at a time' },
            { value: 'fade', label: 'FADE', detail: 'Keep bars still · fade forward' },
            { value: 'slide-per-note', label: 'SLIDE PER NOTE', detail: 'Move as each note arrives' },
          ] as const).map((option) => {
            const selected = scoreDisplayMode === option.value;
            return (
              <Pressable
                key={option.value}
                testID={`scoreImport.display.${option.value}`}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => onDisplayModeChange(option.value)}
                style={ImportedScorePreviewStyle20({ selected, colors })}
              >
                <Text style={ImportedScorePreviewStyle21({ selected, colors })}>{option.label}</Text>
                <Text style={ImportedScorePreviewStyle22({ colors })}>{option.detail}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View style={ImportedScorePreviewStyle23()}>
        {savedLibraryEnabled ? (
          <Pressable testID="scoreImport.library" onPress={onOpenLibrary} style={ImportedScorePreviewStyle24({ colors })}>
            <Text style={ImportedScorePreviewStyle25({ colors })}>MY SCORES</Text>
          </Pressable>
        ) : null}
        <Pressable testID="scoreImport.changeFile" onPress={onImport} disabled={importing} style={ImportedScorePreviewStyle26({ colors })}>
          <Text style={ImportedScorePreviewStyle27({ colors })}>{importing ? 'OPENING…' : 'IMPORT FILE'}</Text>
        </Pressable>
        <Pressable testID="scoreImport.start" disabled={starting} onPress={onStart} style={ImportedScorePreviewStyle28({ colors })}>
          <Text style={ImportedScorePreviewStyle29({ colors })}>{starting ? 'STARTING…' : 'PRACTISE THIS SCORE'}</Text>
        </Pressable>
      </View>
    </>
  );
}
