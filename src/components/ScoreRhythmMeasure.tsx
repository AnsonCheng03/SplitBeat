import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
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
  minimal = false,
}: {
  label: string;
  events: ScoreRhythmEvent[];
  durationQuarter: number;
  color: string;
  size: NoteNotationSize;
  beamGroupQuarterNotes: number;
  minimal?: boolean;
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: minimal ? 0 : 10, minHeight: size === 'compact' ? 32 : 46 }}>
      {!minimal ? <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 1, width: 42 }}>{label}</Text> : null}
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
      {!minimal ? (
        <Text style={{ color: colors.muted, fontSize: 10, fontVariant: ['tabular-nums'], width: 28, textAlign: 'right' }}>
          {events.length}
        </Text>
      ) : null}
    </View>
  );
}

function MeasureBarLine({ testID, inset = 0 }: { testID?: string; inset?: number }) {
  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 1,
        bottom: 1,
        right: inset,
        width: 2,
        backgroundColor: colors.muted,
        opacity: 0.7,
      }}
    />
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
    <View testID="practice.scoreMeasure" style={{ position: 'relative', paddingHorizontal: compact ? 4 : 12, paddingVertical: compact ? 3 : 7, gap: compact ? 2 : 4 }}>
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
      <MeasureBarLine testID="practice.scoreMeasure.barline" inset={2} />
    </View>
  );
}

interface ScrollingScoreRhythmProps {
  measure: ScoreMeasure;
  previousMeasure?: ScoreMeasure;
  nextMeasure: ScoreMeasure;
  sequence: number;
  count: number;
  compact?: boolean;
  beamGroupQuarterNotes?: number;
  minimal?: boolean;
}

interface VisibleScoreBar {
  measure: ScoreMeasure;
  number: number;
  sequence: number;
}

function scoreBar(measure: ScoreMeasure, count: number, sequence: number): VisibleScoreBar {
  return {
    measure,
    number: ((sequence % count) + count) % count + 1,
    sequence,
  };
}

function ScoreBarPanel({
  bar,
  count,
  width,
  size,
  beamGroupQuarterNotes,
  minimal,
}: {
  bar: VisibleScoreBar;
  count: number;
  width: number;
  size: NoteNotationSize;
  beamGroupQuarterNotes: number;
  minimal: boolean;
}) {
  return (
    <View style={{ position: 'relative', width, paddingHorizontal: 4, paddingVertical: size === 'compact' ? 3 : 7, gap: size === 'compact' ? 2 : 4 }}>
      {!minimal ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: size === 'compact' ? 0 : 2 }}>
          <Text style={{ color: colors.text, fontSize: size === 'compact' ? 10 : 11, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            BAR {bar.number} / {count}
          </Text>
        </View>
      ) : null}
      <RhythmTrack
        label="LEFT"
        events={bar.measure.leftEvents}
        durationQuarter={bar.measure.durationQuarter}
        color={colors.left}
        size={size}
        beamGroupQuarterNotes={beamGroupQuarterNotes}
        minimal={minimal}
      />
      <RhythmTrack
        label="RIGHT"
        events={bar.measure.rightEvents}
        durationQuarter={bar.measure.durationQuarter}
        color={colors.right}
        size={size}
        beamGroupQuarterNotes={beamGroupQuarterNotes}
        minimal={minimal}
      />
      <MeasureBarLine testID={`practice.scoreMeasure.barline.${bar.sequence}`} inset={4} />
    </View>
  );
}

/** Advances one complete bar at a time; both hand rows share the same horizontal motion. */
export function ScrollingScoreRhythm({
  measure,
  previousMeasure,
  nextMeasure,
  sequence,
  count,
  compact = false,
  beamGroupQuarterNotes = 1,
  minimal = false,
}: ScrollingScoreRhythmProps) {
  const [viewportWidth, setViewportWidth] = useState(0);
  const size: NoteNotationSize = compact ? 'compact' : 'full';
  const [translateX] = useState(() => new Animated.Value(0));
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const visibleSequenceRef = useRef(sequence);
  const visibleBars = sequence === 0 || !previousMeasure
    ? [scoreBar(measure, count, sequence), scoreBar(nextMeasure, count, sequence + 1)]
    : [scoreBar(previousMeasure, count, sequence - 1), scoreBar(measure, count, sequence)];

  useLayoutEffect(() => {
    if (sequence === visibleSequenceRef.current) return;
    visibleSequenceRef.current = sequence;
    animationRef.current?.stop();

    if (viewportWidth <= 0 || previousMeasure?.index === measure.index) {
      translateX.setValue(0);
      return;
    }

    translateX.setValue(0);
    animationRef.current = Animated.timing(translateX, {
      toValue: -viewportWidth,
      duration: 190,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animationRef.current.start();

    return () => animationRef.current?.stop();
  }, [measure.index, previousMeasure?.index, sequence, translateX, viewportWidth]);

  return (
    <View
      testID="practice.scoreMeasure"
      onLayout={({ nativeEvent }) => setViewportWidth(nativeEvent.layout.width)}
      style={{ overflow: 'hidden', paddingHorizontal: compact ? 4 : 12, paddingVertical: minimal ? 0 : compact ? 3 : 7 }}
    >
      {!minimal ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? 0 : 2 }}>
          <Text style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '800', letterSpacing: 1.1 }}>SCORE RHYTHM</Text>
        </View>
      ) : null}
      {viewportWidth > 0 ? (
        <Animated.View
          testID="practice.scoreMeasure.strip"
          style={{ width: viewportWidth * 2, flexDirection: 'row', transform: [{ translateX }] }}
        >
          {visibleBars.map((bar) => (
            <ScoreBarPanel
              key={bar.sequence}
              bar={bar}
              count={count}
              width={viewportWidth}
              size={size}
              beamGroupQuarterNotes={beamGroupQuarterNotes}
              minimal={minimal}
            />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}
