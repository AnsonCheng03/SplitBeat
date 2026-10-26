import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { createBarNoteNotationPlan, createSharedBarNoteAnchorInsets, type NoteNotationSize } from '@/rhythm/noteNotation';
import { scoreNotationEventsForSpan } from '@/rhythm/scoreStaff';
import type { ScoreRhythmEvent } from '@/types/importedScore';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ScoreRhythmLaneStyle1,
  ScoreRhythmLaneStyle2,
  ScoreRhythmLaneStyle3,
  ScoreRhythmLaneStyle4,
  ScoreRhythmLaneStyle5,
  ScoreRhythmLaneStyle6
} from '@/styles/notation';

export function scoreLaneHeight(size: NoteNotationSize): number {
  return size === 'compact' ? 48 : 60;
}

export function RhythmTrack({
  label,
  events,
  alignmentEventGroups,
  durationQuarter,
  color,
  size,
  beamGroupQuarterNotes,
  minimal = false,
  showStaffLines = false,
  showHandLabels = false,
  initialNotationWidth = 0,
  testIdPrefix = 'practice.scoreMeasure',
}: {
  label: string;
  events: ScoreRhythmEvent[];
  alignmentEventGroups?: readonly (readonly ScoreRhythmEvent[])[];
  durationQuarter: number;
  color: string;
  size: NoteNotationSize;
  beamGroupQuarterNotes: number;
  minimal?: boolean;
  showStaffLines?: boolean;
  showHandLabels?: boolean;
  initialNotationWidth?: number;
  testIdPrefix?: string;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const laneHeight = scoreLaneHeight(size);
  const [measuredLayout, setMeasuredLayout] = useState({ estimate: initialNotationWidth, width: 0 });
  const notationWidth = measuredLayout.estimate === initialNotationWidth && measuredLayout.width > 0
    ? measuredLayout.width
    : initialNotationWidth;
  const notationEvents = useMemo(
    () => scoreNotationEventsForSpan(events, durationQuarter),
    [durationQuarter, events],
  );
  const alignedNotationEventGroups = useMemo(
    () => alignmentEventGroups?.map((group) => scoreNotationEventsForSpan(group, durationQuarter)) ?? [notationEvents],
    [alignmentEventGroups, durationQuarter, notationEvents],
  );
  const anchorInsets = useMemo(() => notationWidth > 0
    ? createSharedBarNoteAnchorInsets(alignedNotationEventGroups, {
      durationQuarter,
      width: notationWidth,
      size,
    })
    : undefined, [alignedNotationEventGroups, durationQuarter, notationWidth, size]);
  const noteCount = useMemo(() => events.filter((event) => !event.isRest).length, [events]);
  const restCount = events.length === 0 ? 1 : events.filter((event) => event.isRest).length;
  const restDescription = t(restCount === 1 ? '{count} rest' : '{count} rests', { count: restCount });
  const plan = useMemo(() => notationWidth > 0
    ? createBarNoteNotationPlan(notationEvents, {
      durationQuarter,
      width: notationWidth,
      size,
      beamGroupQuarterNotes,
      anchorInsets,
    })
    : null, [anchorInsets, beamGroupQuarterNotes, durationQuarter, notationEvents, notationWidth, size]);

  return (
    <View style={ScoreRhythmLaneStyle1({ laneHeight, minimal })}>
      {(!minimal || showHandLabels) ? <Text style={ScoreRhythmLaneStyle2({ color })}>{label}</Text> : null}
      <View
        onLayout={({ nativeEvent }) => setMeasuredLayout({ estimate: initialNotationWidth, width: nativeEvent.layout.width })}
        style={ScoreRhythmLaneStyle3({ laneHeight })}
      >
        {plan ? (
          <View style={ScoreRhythmLaneStyle4({ laneHeight })}>
            <NoteNotation
              plan={plan}
              color={color}
              showStaffLines={showStaffLines}
              staffLineColor={colors.dim}
              testID={`${testIdPrefix}.${label.toLowerCase()}Notation`}
              accessibilityLabel={t('{hand} bar with {notes} notes and {restDescription}', {
                hand: t(label.toLowerCase()),
                notes: noteCount,
                restDescription,
              })}
            />
          </View>
        ) : null}
      </View>
      {!minimal ? (
        <Text style={ScoreRhythmLaneStyle5({ colors })}>
          {noteCount}
        </Text>
      ) : null}
    </View>
  );
}

export function MeasureBarLine({ testID, inset = 0 }: { testID?: string; inset?: number }) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={ScoreRhythmLaneStyle6({ inset, colors })}
    />
  );
}
