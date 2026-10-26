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
      <View style={{ paddingHorizontal: 2, paddingTop: 2, paddingBottom: 8 }}>
        <Text raw style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>{score.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
          <Text raw numberOfLines={1} style={{ flex: 1, color: colors.dim, fontSize: 10 }}>{fileName}</Text>
          {savedLibraryEnabled ? (
            <Pressable
              testID="scoreImport.save"
              accessibilityRole="button"
              accessibilityLabel={t(currentEntry?.saved ? 'Remove score from saved scores' : 'Save this score')}
              disabled={!currentEntry}
              onPress={() => onSave(!currentEntry?.saved)}
              style={({ pressed }) => ({ minHeight: 34, justifyContent: 'center', paddingHorizontal: 10, marginLeft: 8, borderRadius: 9, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: currentEntry?.saved ? colors.accent : colors.line, opacity: currentEntry ? 1 : 0.6 })}
            >
              <Text style={{ color: currentEntry?.saved ? colors.accent : colors.left, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>{!currentEntry ? 'SAVING…' : currentEntry.saved ? 'SAVED ✓' : 'SAVE SCORE'}</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={{ color: colors.dim, fontSize: 9, marginTop: 4 }}>{source.toUpperCase()} · {savedLibraryEnabled ? 'STORED ON THIS DEVICE' : 'SESSION ONLY'}</Text>
        <Text testID="scoreImport.summary" style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
          {t('{tracks} · {measures} · {meter} · {tempo}', { tracks: scoreTrackDescription, measures: scoreMeasureDescription, meter: score.timeSignature, tempo: scoreTempoDescription })}
        </Text>
        <Text style={{ color: colors.dim, fontSize: 11, marginTop: 3 }}>{scoreNoteDescription}</Text>
      </View>
      {score.warnings.map((warning) => (
        <Text key={warning} style={{ color: colors.accent, fontSize: 11, lineHeight: 15, marginBottom: 6 }}>{warning}</Text>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, marginTop: 5, paddingVertical: 5 }}>
        <Pressable
          testID="scoreImport.previousMeasure"
          disabled={previewMeasureIndex === 0}
          onPress={() => onMeasureChange(Math.max(0, previewMeasureIndex - 1))}
          accessibilityLabel={t('Previous score measure')}
          style={{ width: 36, alignItems: 'center', justifyContent: 'center', opacity: previewMeasureIndex === 0 ? 0.35 : 1 }}
        >
          <Text style={{ color: colors.text, fontSize: 26 }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
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
          style={{ width: 36, alignItems: 'center', justifyContent: 'center', opacity: previewMeasureIndex >= score.measures.length - 1 ? 0.35 : 1 }}
        >
          <Text style={{ color: colors.text, fontSize: 26 }}>›</Text>
        </Pressable>
      </View>
      <Text style={{ color: colors.dim, fontSize: 10, lineHeight: 14, marginTop: 7 }}>Check the extracted rhythms against your score before you start.</Text>
      {scoreNotationEnabled ? <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 12, marginBottom: 6 }}>PRACTICE DISPLAY</Text> : null}
      {scoreNotationEnabled ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {([
            { value: 'focus', label: 'ONE NOTE', detail: 'Current beat · large hand panels' },
            { value: 'staff', label: 'MOVING SCORE', detail: 'Both hand lanes · slides at each bar' },
          ] as const).map((option) => {
            const selected = scoreDisplayMode === option.value;
            return (
              <Pressable
                key={option.value}
                testID={`scoreImport.display.${option.value}`}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => onDisplayModeChange(option.value)}
                style={{ flex: 1, minHeight: 54, justifyContent: 'center', paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: selected ? colors.accent : colors.line, backgroundColor: selected ? `${colors.accent}18` : colors.surface }}
              >
                <Text style={{ color: selected ? colors.accent : colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }}>{option.label}</Text>
                <Text style={{ color: colors.muted, fontSize: 9, marginTop: 3 }}>{option.detail}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 9, marginTop: 11 }}>
        {savedLibraryEnabled ? (
          <Pressable testID="scoreImport.library" onPress={onOpenLibrary} style={{ minHeight: 56, width: 94, borderRadius: 14, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800' }}>MY SCORES</Text>
          </Pressable>
        ) : null}
        <Pressable testID="scoreImport.changeFile" onPress={onImport} disabled={importing} style={{ minHeight: 56, width: 108, borderRadius: 14, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800' }}>{importing ? 'OPENING…' : 'IMPORT FILE'}</Text>
        </Pressable>
        <Pressable testID="scoreImport.start" disabled={starting} onPress={onStart} style={{ flex: 1, minHeight: 56, borderRadius: 14, backgroundColor: colors.left, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.background, fontSize: 15, fontWeight: '900', letterSpacing: 0.7 }}>{starting ? 'STARTING…' : 'PRACTISE THIS SCORE'}</Text>
        </Pressable>
      </View>
    </>
  );
}
