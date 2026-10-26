import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ReplayHandLane } from '@/components/ReplayHandLane';
import { ReplayStatusBadge } from '@/components/ReplayStatusBadge';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import type { ReplayExpectedEvent, ReplayTap, Hand, TimeSignature } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';

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
  const { colors } = useTheme();
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
