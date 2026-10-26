import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { ReplayBeatGuides } from '@/components/ReplayBeatGuides';
import { ReplayStatusBadge } from '@/components/ReplayStatusBadge';
import { createBarNoteNotationPlan } from '@/rhythm/noteNotation';
import type { Hand, ReplayExpectedEvent, ReplayTap, TimeSignature } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';

export function ReplayHandLane({
  hand,
  accent,
  events,
  taps,
  beatsPerBar,
  beatQuarterNotes,
  barDurationQuarter,
  timeSignature,
  timestampBeatMs,
  barIndex,
  isLastLane,
}: {
  hand: Hand;
  accent: string;
  events: readonly ReplayExpectedEvent[];
  taps: readonly ReplayTap[];
  beatsPerBar: number;
  beatQuarterNotes: number;
  barDurationQuarter: number;
  timeSignature: TimeSignature;
  timestampBeatMs: number;
  barIndex: number;
  isLastLane: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [trackWidth, setTrackWidth] = useState(0);
  const orderedEvents = useMemo(() => [...events].sort((first, second) =>
    first.beatInBar - second.beatInBar || first.expectedTimeMs - second.expectedTimeMs), [events]);
  const plan = useMemo(() => trackWidth > 0 && orderedEvents.length > 0
    ? createBarNoteNotationPlan(
      orderedEvents.map((event) => ({
        startQuarter: event.beatInBar * beatQuarterNotes,
        durationQuarter: event.durationQuarter,
        ...(event.tupletNumber === undefined ? {} : { tupletNumber: event.tupletNumber }),
      })),
      {
        durationQuarter: barDurationQuarter,
        width: trackWidth,
        size: 'compact',
        beamGroupQuarterNotes: beatQuarterNotes,
      },
    )
    : null, [barDurationQuarter, beatQuarterNotes, orderedEvents, trackWidth]);
  const anchorStartX = plan?.anchorStartX ?? 0;
  const anchorWidth = plan?.anchorWidth ?? trackWidth;
  const laneHeight = Math.max(44, plan?.height ?? 0);
  const notePlanTop = plan ? (laneHeight - plan.height) / 2 : 0;
  const elapsedAtBarStart = (barIndex - 1) * beatsPerBar * timestampBeatMs;

  return (
    <View style={{ marginBottom: isLastLane ? 0 : 13 }}>
      <Text style={{ color: accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 3 }}>
        {t('{hand} · EXPECTED', { hand: t(hand === 'left' ? 'LEFT' : 'RIGHT') })}
      </Text>
      <View
        onLayout={({ nativeEvent }) => setTrackWidth(nativeEvent.layout.width)}
        style={{ position: 'relative', height: laneHeight, justifyContent: 'center' }}
      >
        <ReplayBeatGuides beatsPerBar={beatsPerBar} anchorStartX={anchorStartX} anchorWidth={anchorWidth} />
        {plan ? (
          <NoteNotation
            plan={plan}
            color={accent}
            testID={`results.replayExpected.${barIndex}.${hand}`}
            accessibilityLabel={t('{hand} hand expected rhythm, {count} notes', { hand: t(hand), count: events.length })}
          />
        ) : events.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center', fontWeight: '700' }}>REST</Text>
        ) : null}
        {plan?.notes.map((note, index) => {
          const event = orderedEvents[index];
          if (!event) return null;
          const size = Math.max(7, Math.min(8, note.headWidth * 0.75));
          return event.reached === false ? null : (
            <ReplayStatusBadge
              key={event.id}
              status={event.matched ? 'correct' : 'miss'}
              size={size}
              testID={`results.replayStatus.expected.${event.id}`}
              style={{
                left: note.left + note.headWidth / 2 - size / 2,
                top: notePlanTop + note.headTop + note.headHeight / 2 - size / 2,
              }}
            />
          );
        })}
      </View>

      <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.9, marginTop: 2, marginBottom: 2 }}>
        YOUR TAPS
      </Text>
      <View style={{ position: 'relative', height: 18, justifyContent: 'center' }}>
        <ReplayBeatGuides beatsPerBar={beatsPerBar} anchorStartX={anchorStartX} anchorWidth={anchorWidth} />
        <View style={{ height: 1, backgroundColor: colors.line }} />
        {taps.map((tap) => {
          const elapsedInBarMs = tap.timestampMs - elapsedAtBarStart;
          const beatPosition = elapsedInBarMs / timestampBeatMs;
          const position = Math.max(0, Math.min(1, beatPosition / beatsPerBar));
          const matched = Boolean(tap.matchedEventId);
          const error = tap.timingErrorMs;
          const timingLabel = error === undefined
            ? t(', extra tap')
            : t(', {timing} by {error} milliseconds', {
              error: Math.round(Math.abs(error)),
              timing: t(error > 0 ? 'late' : error < 0 ? 'early' : 'on time'),
            });
          return (
            <ReplayStatusBadge
              key={tap.id}
              testID={`results.replayTap.${tap.id}`}
              status={matched ? 'correct' : 'miss'}
              size={12}
              accessibilityLabel={t('{hand} hand tap at {time} milliseconds into bar {bar}{timing}', {
                hand: t(hand),
                time: Math.round(elapsedInBarMs),
                bar: barIndex,
                timing: timingLabel,
              })}
              style={{ left: anchorStartX + anchorWidth * position - 6, top: 3 }}
            />
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', width: anchorWidth, marginLeft: anchorStartX, marginTop: 2 }}>
        {Array.from({ length: beatsPerBar }, (_, beat) => (
          <Text key={beat} style={{ color: colors.muted, flex: 1, textAlign: 'center', fontSize: 9, fontVariant: ['tabular-nums'] }}>{beat + 1}</Text>
        ))}
      </View>
    </View>
  );
}
