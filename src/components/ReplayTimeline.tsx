import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
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

const TIMING_MISS = '#FF7474';

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
      accessibilityLabel={`Visual replay for bar ${barIndex}, showing expected notes and your recorded taps`}
      onLayout={({ nativeEvent }) => setTimelineWidth(nativeEvent.layout.width)}
      style={{ position: 'relative', marginTop: 9, padding: 12, overflow: 'hidden', borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}
    >
      <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 10 }}>
        BAR {barIndex} · EXPECTED NOTES AND YOUR TAPS
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
          <View style={{ width: 7, height: 7, borderRadius: 4, borderWidth: 1, borderColor: colors.muted }} />
          <Text style={{ color: colors.muted, fontSize: 9 }}>Expected</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent }} />
          <Text style={{ color: colors.muted, fontSize: 9 }}>Tap</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: TIMING_MISS }} />
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
  const [trackWidth, setTrackWidth] = useState(0);
  const plan = useMemo(() => trackWidth > 0 && events.length > 0
    ? createBarNoteNotationPlan(
      events.map((event) => ({
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
    : null, [barDurationQuarter, beatQuarterNotes, events, trackWidth]);
  const anchorStartX = plan?.anchorStartX ?? 0;
  const anchorWidth = plan?.anchorWidth ?? trackWidth;
  const elapsedAtBarStart = (barIndex - 1) * beatsPerBar * timestampBeatMs;

  return (
    <View style={{ marginBottom: isLastLane ? 0 : 13 }}>
      <Text style={{ color: accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 3 }}>
        {hand.toUpperCase()} · EXPECTED
      </Text>
      <View
        onLayout={({ nativeEvent }) => setTrackWidth(nativeEvent.layout.width)}
        style={{ position: 'relative', minHeight: 42, justifyContent: 'center' }}
      >
        <BeatGuides beatsPerBar={beatsPerBar} anchorStartX={anchorStartX} anchorWidth={anchorWidth} />
        {plan ? (
          <NoteNotation
            plan={plan}
            color={accent}
            testID={`results.replayExpected.${barIndex}.${hand}`}
            accessibilityLabel={`${hand} hand expected rhythm, ${events.length} notes`}
          />
        ) : events.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center', fontWeight: '700' }}>REST</Text>
        ) : null}
        {events.filter((event) => !event.matched).map((event) => (
          <View
            key={event.id}
            accessibilityLabel={`${hand} expected note was missed`}
            testID={`results.replayMissedNote.${event.id}`}
            pointerEvents="none"
            style={{ position: 'absolute', left: anchorStartX + anchorWidth * event.beatInBar / beatsPerBar, bottom: 1, width: 7, height: 7, marginLeft: -3.5, borderRadius: 4, backgroundColor: TIMING_MISS, borderWidth: 1, borderColor: colors.background }}
          />
        ))}
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
            ? ', extra tap'
            : `, ${error > 0 ? '+' : ''}${Math.round(error)} milliseconds ${error > 0 ? 'late' : error < 0 ? 'early' : 'on time'}`;
          return (
            <View
              key={tap.id}
              testID={`results.replayTap.${tap.id}`}
              accessibilityLabel={`${hand} hand tap at ${Math.round(elapsedInBarMs)} milliseconds into bar ${barIndex}${timingLabel}`}
              style={{ position: 'absolute', left: anchorStartX + anchorWidth * position, width: 9, height: 9, marginLeft: -4.5, borderRadius: 5, backgroundColor: matched ? accent : TIMING_MISS, borderWidth: 1, borderColor: colors.background }}
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
