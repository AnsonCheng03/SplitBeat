import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ReplayHandLane } from '@/components/ReplayHandLane';
import { ReplayStatusBadge } from '@/components/ReplayStatusBadge';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import type { ReplayExpectedEvent, ReplayTap, Hand, TimeSignature } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ReplayTimelineStyle1,
  ReplayTimelineStyle2,
  ReplayTimelineStyle3,
  ReplayTimelineStyle4,
  ReplayTimelineStyle5,
  ReplayTimelineStyle6,
  ReplayTimelineStyle7,
  ReplayTimelineStyle8,
  ReplayTimelineStyle9,
  ReplayTimelineStyle10,
  ReplayTimelineStyle11,
  ReplayTimelineStyle12,
  ReplayTimelineStyle13,
  ReplayTimelineStyle14
} from '@/styles/results';

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
      style={ReplayTimelineStyle1({ colors })}
    >
      <Text style={ReplayTimelineStyle2({ colors })}>
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
          style={ReplayTimelineStyle3({ colors, playhead })}
        />
      ) : null}

      <View style={ReplayTimelineStyle4()}>
        <View style={ReplayTimelineStyle5()}>
          <View style={ReplayTimelineStyle6()}>
            {hands.map((hand) => (
              <View key={hand} style={ReplayTimelineStyle7({ hand, colors })} />
            ))}
          </View>
          <Text style={ReplayTimelineStyle8({ colors })}>Expected</Text>
        </View>
        <View style={ReplayTimelineStyle9()}>
          <ReplayStatusBadge status="correct" size={10} style={ReplayTimelineStyle10()} />
          <Text style={ReplayTimelineStyle11({ colors })}>Correct</Text>
        </View>
        <View style={ReplayTimelineStyle12()}>
          <ReplayStatusBadge status="miss" size={10} style={ReplayTimelineStyle13()} />
          <Text style={ReplayTimelineStyle14({ colors })}>Missed / extra</Text>
        </View>
      </View>
    </View>
  );
}
