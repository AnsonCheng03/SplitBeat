import { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { type NoteNotationSize } from '@/rhythm/noteNotation';
import { MeasureBarLine, RhythmTrack } from '@/components/ScoreRhythmLane';
import type { ScoreRhythmMeasure as ScoreMeasure } from '@/types/importedScore';
import type { Hand } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';

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
    <View testID={testIdPrefix} style={{ position: 'relative', paddingHorizontal: compact ? 4 : 12, paddingVertical: compact ? 3 : 7, gap: compact ? 2 : 4 }}>
      {!hideHeader ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? 0 : 2 }}>
          <Text style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '800', letterSpacing: 1.1 }}>SCORE RHYTHM</Text>
          <Text style={{ color: colors.text, fontSize: compact ? 10 : 11, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
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
