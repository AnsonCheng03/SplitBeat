import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { createBarNoteNotationPlan } from '@/rhythm/noteNotation';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import type { ReplayExpectedEvent, ReplayTap, Hand, TimeSignature } from '@/types/rhythm';
import { colors } from '@/theme';

interface ReplayTimelineProps {
  barIndex: number;
  expectedEvents: readonly ReplayExpectedEvent[];
  taps: readonly ReplayTap[];
  hands: readonly Hand[];
  beatsPerBar: number;
  bpm: number;
  timeSignature: TimeSignature;
  playbackId: number;
  onPlaybackEnd: (barIndex: number, playbackId: number) => void;
}

const TIMING_MISS = colors.danger;
const TIMING_CORRECT = '#4DE0B2';

export function ReplayTimeline({
  barIndex,
  expectedEvents,
  taps,
  hands,
  beatsPerBar,
  bpm,
  timeSignature,
  playbackId,
  onPlaybackEnd,
}: ReplayTimelineProps) {
  const { t } = useI18n();
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [playhead] = useState(() => new Animated.Value(0));
  const beatQuarterNotes = pulseQuarterNotes(timeSignature);
  const barDurationQuarter = beatsPerBar * beatQuarterNotes;
  const durationMs = beatsPerBar * 60_000 / bpm;

  useEffect(() => {
    if (timelineWidth <= 0) return;
    playhead.setValue(0);
    const animation = Animated.timing(playhead, {
      toValue: Math.max(0, timelineWidth - 24),
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) onPlaybackEnd(barIndex, playbackId);
    });
    return () => animation.stop();
  }, [barIndex, durationMs, onPlaybackEnd, playbackId, playhead, timelineWidth]);

  return (
    <View
      testID={`results.replayTimeline.${barIndex}`}
      accessibilityLabel={t('Visual replay for bar {bar}, showing expected notes and your recorded taps', { bar: barIndex })}
      onLayout={({ nativeEvent }) => setTimelineWidth(nativeEvent.layout.width)}
      style={{ position: 'relative', marginTop: 9, padding: 12, overflow: 'hidden', borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}
    >
      <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 10 }}>
        {t('BAR {bar} · EXPECTED NOTES AND YOUR TAPS', { bar: barIndex })}
      </Text>

      {hands.map((hand) => {
        const accent = hand === 'left' ? colors.left : colors.right;
        const laneEvents = expectedEvents.filter((event) => event.hand === hand);
        const laneTaps = taps.filter((tap) => tap.hand === hand);
        return (
          <ReplayHandLane
            key={hand}
            hand={hand}
            accent={accent}
            events={laneEvents}
            taps={laneTaps}
            beatsPerBar={beatsPerBar}
            beatQuarterNotes={beatQuarterNotes}
            barDurationQuarter={barDurationQuarter}
            timeSignature={timeSignature}
            timestampBeatMs={60_000 / bpm}
            barIndex={barIndex}
            isLastLane={hand === hands.at(-1)}
          />
        );
      })}

      {timelineWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          testID={`results.replayPlayhead.${barIndex}`}
          style={{ position: 'absolute', top: 28, bottom: 17, left: 12, width: 2, backgroundColor: colors.text, opacity: 0.72, transform: [{ translateX: playhead }] }}
        />
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {hands.map((hand) => (
              <View key={hand} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: hand === 'left' ? colors.left : colors.right }} />
            ))}
          </View>
          <Text style={{ color: colors.muted, fontSize: 9 }}>Expected</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <ReplayStatusBadge status="correct" size={10} style={{ position: 'relative' }} />
          <Text style={{ color: colors.muted, fontSize: 9 }}>Correct</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <ReplayStatusBadge status="miss" size={10} style={{ position: 'relative' }} />
          <Text style={{ color: colors.muted, fontSize: 9 }}>Missed / extra</Text>
        </View>
      </View>
    </View>
  );
}

function ReplayHandLane({
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
        <BeatGuides beatsPerBar={beatsPerBar} anchorStartX={anchorStartX} anchorWidth={anchorWidth} />
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
          return (
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
        <BeatGuides beatsPerBar={beatsPerBar} anchorStartX={anchorStartX} anchorWidth={anchorWidth} />
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

function ReplayStatusBadge({
  status,
  size,
  testID,
  accessibilityLabel,
  style,
}: {
  status: 'correct' | 'miss';
  size: number;
  testID?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
}) {
  const { t } = useI18n();
  const label = accessibilityLabel ?? t(status === 'correct' ? 'Correct' : 'Missed / extra');
  return (
    <View
      pointerEvents="none"
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={label}
      testID={testID}
      style={[{
        position: 'absolute',
        zIndex: 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: status === 'correct' ? TIMING_CORRECT : TIMING_MISS,
        borderWidth: 1,
        borderColor: colors.background,
      }, style]}
    >
      <Text accessible={false} style={{ color: colors.background, fontSize: Math.max(7, size * 0.72), lineHeight: size, fontWeight: '900', textAlign: 'center' }}>
        {status === 'correct' ? '✓' : '×'}
      </Text>
    </View>
  );
}

function BeatGuides({
  beatsPerBar,
  anchorStartX,
  anchorWidth,
}: {
  beatsPerBar: number;
  anchorStartX: number;
  anchorWidth: number;
}) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: anchorStartX, width: anchorWidth, top: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
      {Array.from({ length: beatsPerBar + 1 }, (_, beat) => (
        <View key={beat} style={{ width: 1, height: '100%', backgroundColor: colors.line, opacity: beat === 0 || beat === beatsPerBar ? 0.7 : 0.38 }} />
      ))}
    </View>
  );
}
