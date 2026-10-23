import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { NoteNotation } from '@/components/NoteNotation';
import { createBarNoteNotationPlan, type NoteNotationSize } from '@/rhythm/noteNotation';
import type { ScoreRhythmEvent, ScoreRhythmMeasure as ScoreMeasure } from '@/types/importedScore';
import { colors } from '@/theme';

function RhythmTrack({
  label,
  events,
  durationQuarter,
  color,
  size,
  beamGroupQuarterNotes,
}: {
  label: string;
  events: ScoreRhythmEvent[];
  durationQuarter: number;
  color: string;
  size: NoteNotationSize;
  beamGroupQuarterNotes: number;
}) {
  const [notationWidth, setNotationWidth] = useState(0);
  const plan = useMemo(() => notationWidth > 0
    ? createBarNoteNotationPlan(events, {
      durationQuarter,
      width: notationWidth,
      size,
      beamGroupQuarterNotes,
    })
    : null, [beamGroupQuarterNotes, durationQuarter, events, notationWidth, size]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: size === 'compact' ? 32 : 46 }}>
      <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 1, width: 42 }}>{label}</Text>
      <View
        onLayout={({ nativeEvent }) => setNotationWidth(nativeEvent.layout.width)}
        style={{ flex: 1, minHeight: size === 'compact' ? 28 : 42, justifyContent: 'center' }}
      >
        {plan ? (
          <NoteNotation
            plan={plan}
            color={color}
            testID={`practice.scoreMeasure.${label.toLowerCase()}Notation`}
            accessibilityLabel={`${label.toLowerCase()} bar with ${events.length} notes`}
          />
        ) : null}
      </View>
      <Text style={{ color: colors.muted, fontSize: 10, fontVariant: ['tabular-nums'], width: 28, textAlign: 'right' }}>
        {events.length}
      </Text>
    </View>
  );
}

export function ScoreRhythmMeasure({
  measure,
  number,
  count,
  compact = false,
  beamGroupQuarterNotes = 1,
}: {
  measure: ScoreMeasure;
  number: number;
  count: number;
  compact?: boolean;
  beamGroupQuarterNotes?: number;
}) {
  const size: NoteNotationSize = compact ? 'compact' : 'full';

  return (
    <View testID="practice.scoreMeasure" style={{ paddingHorizontal: compact ? 4 : 12, paddingVertical: compact ? 3 : 7, gap: compact ? 2 : 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? 0 : 2 }}>
        <Text style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '800', letterSpacing: 1.1 }}>SCORE RHYTHM</Text>
        <Text style={{ color: colors.text, fontSize: compact ? 10 : 11, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
          BAR {number} / {count}
        </Text>
      </View>
      <RhythmTrack
        label="LEFT"
        events={measure.leftEvents}
        durationQuarter={measure.durationQuarter}
        color={colors.left}
        size={size}
        beamGroupQuarterNotes={beamGroupQuarterNotes}
      />
      <RhythmTrack
        label="RIGHT"
        events={measure.rightEvents}
        durationQuarter={measure.durationQuarter}
        color={colors.right}
        size={size}
        beamGroupQuarterNotes={beamGroupQuarterNotes}
      />
    </View>
  );
}
