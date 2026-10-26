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
import {
  ReplayHandLaneStyle1,
  ReplayHandLaneStyle2,
  ReplayHandLaneStyle3,
  ReplayHandLaneStyle4,
  ReplayHandLaneStyle5,
  ReplayHandLaneStyle6,
  ReplayHandLaneStyle7,
  ReplayHandLaneStyle8,
  ReplayHandLaneStyle9,
  ReplayHandLaneStyle10,
  ReplayHandLaneStyle11
} from '@/styles/results';

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
    <View style={ReplayHandLaneStyle1({ isLastLane })}>
      <Text style={ReplayHandLaneStyle2({ accent })}>
        {t('{hand} · EXPECTED', { hand: t(hand === 'left' ? 'LEFT' : 'RIGHT') })}
      </Text>
      <View
        onLayout={({ nativeEvent }) => setTrackWidth(nativeEvent.layout.width)}
        style={ReplayHandLaneStyle3({ laneHeight })}
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
          <Text style={ReplayHandLaneStyle4({ colors })}>REST</Text>
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
              style={ReplayHandLaneStyle5({ note, size, notePlanTop })}
            />
          );
        })}
      </View>

      <Text style={ReplayHandLaneStyle6({ colors })}>
        YOUR TAPS
      </Text>
      <View style={ReplayHandLaneStyle7()}>
        <ReplayBeatGuides beatsPerBar={beatsPerBar} anchorStartX={anchorStartX} anchorWidth={anchorWidth} />
        <View style={ReplayHandLaneStyle8({ colors })} />
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
              style={ReplayHandLaneStyle9({ anchorStartX, anchorWidth, position })}
            />
          );
        })}
      </View>
      <View style={ReplayHandLaneStyle10({ anchorWidth, anchorStartX })}>
        {Array.from({ length: beatsPerBar }, (_, beat) => (
          <Text key={beat} style={ReplayHandLaneStyle11({ colors })}>{beat + 1}</Text>
        ))}
      </View>
    </View>
  );
}
