import { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { type NoteNotationSize } from '@/rhythm/noteNotation';
import { MeasureBarLine, RhythmTrack } from '@/components/ScoreRhythmLane';
import type { ScoreRhythmMeasure as ScoreMeasure } from '@/types/importedScore';
import type { Hand } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';
import { ScoreRhythmMeasureStyle1, ScoreRhythmMeasureStyle2, ScoreRhythmMeasureStyle3, ScoreRhythmMeasureStyle4 } from '@/styles/notation';

export function ScoreRhythmMeasure({
  measure,
  number,
  count,
  compact = false,
  beamGroupQuarterNotes = 1,
  hideHeader = false,
  testIdPrefix = 'practice.scoreMeasure',
  visibleHand,
  focusedColor,
  minimal = false,
  showStaffLines = false,
  showHandLabels = false,
  initialNotationWidth = 0,
}: {
  measure: ScoreMeasure;
  number: number;
  count: number;
  compact?: boolean;
  beamGroupQuarterNotes?: number;
  hideHeader?: boolean;
  testIdPrefix?: string;
  visibleHand?: Hand;
  focusedColor?: string;
  minimal?: boolean;
  showStaffLines?: boolean;
  showHandLabels?: boolean;
  initialNotationWidth?: number;
}) {
  const { colors } = useTheme();
  const size: NoteNotationSize = compact ? 'compact' : 'full';
  const alignmentEventGroups = useMemo(
    () => [measure.leftEvents, measure.rightEvents],
    [measure.leftEvents, measure.rightEvents],
  );

  return (
    <View testID={testIdPrefix} style={ScoreRhythmMeasureStyle1({ compact })}>
      {!hideHeader ? (
        <View style={ScoreRhythmMeasureStyle2({ compact })}>
          <Text style={ScoreRhythmMeasureStyle3({ colors, compact })}>SCORE RHYTHM</Text>
          <Text style={ScoreRhythmMeasureStyle4({ colors, compact })}>
            BAR {number} / {count}
          </Text>
        </View>
      ) : null}
      {!visibleHand || visibleHand === 'left' ? (
        <RhythmTrack
          label="LEFT"
          events={measure.leftEvents}
          alignmentEventGroups={alignmentEventGroups}
          durationQuarter={measure.durationQuarter}
          color={visibleHand ? focusedColor ?? colors.left : colors.left}
          size={size}
          beamGroupQuarterNotes={beamGroupQuarterNotes}
          minimal={minimal}
          showStaffLines={showStaffLines}
          showHandLabels={showHandLabels}
          initialNotationWidth={initialNotationWidth}
          testIdPrefix={testIdPrefix}
        />
      ) : null}
      {!visibleHand || visibleHand === 'right' ? (
        <RhythmTrack
          label="RIGHT"
          events={measure.rightEvents}
          alignmentEventGroups={alignmentEventGroups}
          durationQuarter={measure.durationQuarter}
          color={visibleHand ? focusedColor ?? colors.right : colors.right}
          size={size}
          beamGroupQuarterNotes={beamGroupQuarterNotes}
          minimal={minimal}
          showStaffLines={showStaffLines}
          showHandLabels={showHandLabels}
          initialNotationWidth={initialNotationWidth}
          testIdPrefix={testIdPrefix}
        />
      ) : null}
      <MeasureBarLine testID={`${testIdPrefix}.barline`} inset={2} />
    </View>
  );
}
