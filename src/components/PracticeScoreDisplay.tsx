import { View } from 'react-native';
import { ScoreBeatFocus } from '@/components/ScoreBeatFocus';
import { ScrollingScoreRhythm } from '@/components/ScrollingScoreRhythm';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import { useTheme } from '@/theme/ThemeProvider';
import type { ThemeColors } from '@/theme';
import type { ExerciseSettings, Hand, SessionSnapshot } from '@/types/rhythm';
import type { ScoreDisplayMode } from '@/rhythm/scoreStaff';
import { PracticeRhythmDisplayStyle4, PracticeRhythmDisplayStyle5 } from '@/styles/practice';

type ScoreMeasure = NonNullable<SessionSnapshot['scoreMeasure']>;

export function PracticeScoreDisplay({
  importedMeasure,
  displayMeasure,
  snapshot,
  settings,
  scoreDisplayMode,
  quarterInMeasure,
  compact,
  singleHandMode,
  focusedHand,
  focusWidth,
  viewportWidth,
}: {
  importedMeasure?: ScoreMeasure;
  displayMeasure: ScoreMeasure;
  snapshot: SessionSnapshot | null;
  settings: ExerciseSettings;
  scoreDisplayMode: ScoreDisplayMode;
  quarterInMeasure: number;
  compact: boolean;
  singleHandMode: boolean;
  focusedHand: Hand;
  focusWidth: number;
  viewportWidth: number;
}) {
  const { colors } = useTheme();
  const scoreEvents = importedMeasure && scoreDisplayMode === 'focus';

  if (scoreEvents) {
    return (
      <ScoreFocusDisplay
        measure={importedMeasure}
        snapshot={snapshot}
        settings={settings}
        compact={compact}
        singleHandMode={singleHandMode}
        focusedHand={focusedHand}
        focusWidth={focusWidth}
        colors={colors}
      />
    );
  }

  const isImportedScore = Boolean(importedMeasure);
  const sequence = isImportedScore
    ? snapshot?.scoreMeasureSequence ?? 0
    : snapshot?.practiceScoreSequence ?? 0;
  const count = isImportedScore
    ? snapshot?.scoreMeasureCount ?? 1
    : snapshot?.practiceScoreCount ?? 1;
  const previousMeasure = isImportedScore
    ? snapshot?.scorePreviousMeasure
    : snapshot?.practiceScorePreviousMeasure;
  const nextMeasure = isImportedScore
    ? snapshot?.scoreNextMeasure
    : snapshot?.practiceScoreNextMeasure;
  const upcomingMeasures = isImportedScore
    ? snapshot?.scoreUpcomingMeasures
    : snapshot?.practiceScoreUpcomingMeasures;
  const visibleHand = singleHandMode ? focusedHand : undefined;
  const focusedColor = visibleHand === 'left' ? colors.left : colors.right;

  return (
    <View style={PracticeRhythmDisplayStyle5()}>
      <ScrollingScoreRhythm
        measure={displayMeasure}
        previousMeasure={previousMeasure}
        nextMeasure={nextMeasure ?? displayMeasure}
        upcomingMeasures={upcomingMeasures}
        sequence={sequence}
        count={count}
        movementMode={scoreDisplayMode === 'focus' ? 'fade' : scoreDisplayMode}
        quarterInMeasure={quarterInMeasure}
        compact={compact}
        beamGroupQuarterNotes={pulseQuarterNotes(settings.timeSignature)}
        minimal
        showHandLabels
        visibleHand={visibleHand}
        focusedColor={singleHandMode ? focusedColor : undefined}
        initialViewportWidth={viewportWidth}
      />
    </View>
  );
}

function ScoreFocusDisplay({
  measure,
  snapshot,
  settings,
  compact,
  singleHandMode,
  focusedHand,
  focusWidth,
  colors,
}: {
  measure: ScoreMeasure;
  snapshot: SessionSnapshot | null;
  settings: ExerciseSettings;
  compact: boolean;
  singleHandMode: boolean;
  focusedHand: Hand;
  focusWidth: number;
  colors: ThemeColors;
}) {
  const beatDurationQuarter = pulseQuarterNotes(settings.timeSignature);
  const quarterInMeasure = snapshot?.scoreQuarterInMeasure ?? 0;

  if (singleHandMode) {
    return (
      <ScoreBeatFocus
        measure={measure}
        nextMeasure={snapshot?.scoreNextMeasure}
        quarterInMeasure={quarterInMeasure}
        beatDurationQuarter={beatDurationQuarter}
        hand={focusedHand}
        color={colors.accent}
        oneHand
        compact={compact}
        initialWidth={focusWidth * 0.86}
      />
    );
  }

  return (
    <View style={PracticeRhythmDisplayStyle4()}>
      {(['left', 'right'] as const).map((hand) => (
        <ScoreBeatFocus
          key={hand}
          measure={measure}
          nextMeasure={snapshot?.scoreNextMeasure}
          quarterInMeasure={quarterInMeasure}
          beatDurationQuarter={beatDurationQuarter}
          hand={hand}
          color={hand === 'left' ? colors.left : colors.right}
          oneHand={false}
          compact={compact}
          initialWidth={focusWidth}
        />
      ))}
    </View>
  );
}
