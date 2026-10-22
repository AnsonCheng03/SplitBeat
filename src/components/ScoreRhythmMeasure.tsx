import { Text, View } from 'react-native';
import type { ScoreRhythmEvent, ScoreRhythmMeasure as ScoreMeasure } from '@/types/importedScore';
import { colors } from '@/theme';

function RhythmTrack({
  label,
  events,
  durationQuarter,
  color,
}: {
  label: string;
  events: ScoreRhythmEvent[];
  durationQuarter: number;
  color: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 34 }}>
      <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 1, width: 42 }}>{label}</Text>
      <View style={{ flex: 1, height: 23, borderRadius: 7, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, backgroundColor: colors.dim }} />
        <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, backgroundColor: colors.dim }} />
        {events.map((event, index) => {
          const position = Math.max(0, Math.min(100, (event.startQuarter / durationQuarter) * 100));
          const duration = Math.max(0.4, Math.min(100, (event.durationQuarter / durationQuarter) * 100));
          return (
            <View
              key={`${event.startQuarter}:${index}`}
              style={{ position: 'absolute', left: `${position}%`, top: 0, bottom: 0, width: `${duration}%`, justifyContent: 'center' }}
            >
              {event.durationQuarter > 0.2 ? (
                <View style={{ position: 'absolute', left: 5, top: 10, height: 2, width: '100%', backgroundColor: color, opacity: 0.55 }} />
              ) : null}
              <View style={{ width: 10, height: 8, borderRadius: 8, backgroundColor: color, borderWidth: 1, borderColor: colors.background }} />
            </View>
          );
        })}
      </View>
      <Text style={{ color: colors.muted, fontSize: 10, fontVariant: ['tabular-nums'], width: 28, textAlign: 'right' }}>{events.length}</Text>
    </View>
  );
}

export function ScoreRhythmMeasure({
  measure,
  number,
  count,
  compact = false,
}: {
  measure: ScoreMeasure;
  number: number;
  count: number;
  compact?: boolean;
}) {
  return (
    <View testID="practice.scoreMeasure" style={{ paddingHorizontal: compact ? 4 : 12, paddingVertical: compact ? 5 : 10, gap: compact ? 2 : 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? 0 : 2 }}>
        <Text style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '800', letterSpacing: 1.1 }}>SCORE RHYTHM</Text>
        <Text style={{ color: colors.text, fontSize: compact ? 10 : 11, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
          BAR {number} / {count}
        </Text>
      </View>
      <RhythmTrack label="LEFT" events={measure.leftEvents} durationQuarter={measure.durationQuarter} color={colors.left} />
      <RhythmTrack label="RIGHT" events={measure.rightEvents} durationQuarter={measure.durationQuarter} color={colors.right} />
    </View>
  );
}
