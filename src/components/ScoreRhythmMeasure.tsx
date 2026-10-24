import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { createBarNoteNotationPlan, type NoteNotationSize } from '@/rhythm/noteNotation';
import { scoreNotationEvents } from '@/rhythm/scoreStaff';
import type { ScoreRhythmEvent, ScoreRhythmMeasure as ScoreMeasure } from '@/types/importedScore';
import type { Hand } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';

function RhythmTrack({
  label,
  events,
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
  const [measuredLayout, setMeasuredLayout] = useState({ estimate: initialNotationWidth, width: 0 });
  const notationWidth = measuredLayout.estimate === initialNotationWidth && measuredLayout.width > 0
    ? measuredLayout.width
    : initialNotationWidth;
  const noteEvents = useMemo(() => scoreNotationEvents(events), [events]);
  const restEvents = useMemo(() => events.filter((event) => event.isRest), [events]);
  const plan = useMemo(() => notationWidth > 0
    ? createBarNoteNotationPlan(noteEvents, {
      durationQuarter,
      width: notationWidth,
      size,
      beamGroupQuarterNotes,
    })
    : null, [beamGroupQuarterNotes, durationQuarter, noteEvents, notationWidth, size]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: minimal ? 0 : 10, minHeight: size === 'compact' ? 40 : 54 }}>
      {(!minimal || showHandLabels) ? <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 1, width: 48 }}>{label}</Text> : null}
      <View
        onLayout={({ nativeEvent }) => setMeasuredLayout({ estimate: initialNotationWidth, width: nativeEvent.layout.width })}
        style={{ flex: 1, minHeight: size === 'compact' ? 36 : 50, justifyContent: 'center' }}
      >
        {events.length === 0 ? (
          <View style={{ minHeight: size === 'compact' ? 36 : 50, alignItems: 'center', justifyContent: 'center' }}>
            {showStaffLines && plan ? <NoteNotation plan={plan} color={color} showStaffLines staffLineColor={colors.dim} /> : null}
            <Text style={{ position: 'absolute', color: colors.muted, fontSize: size === 'compact' ? 9 : 11, fontWeight: '800', letterSpacing: 1.1, textAlign: 'center' }}>
              REST
            </Text>
          </View>
        ) : plan ? (
          <View style={{ minHeight: size === 'compact' ? 36 : 50, justifyContent: 'center' }}>
            {noteEvents.length > 0 || showStaffLines ? (
              <NoteNotation
                plan={plan}
                color={color}
                showStaffLines={showStaffLines}
                staffLineColor={colors.dim}
                testID={`${testIdPrefix}.${label.toLowerCase()}Notation`}
                accessibilityLabel={t('{hand} bar with {notes} notes and {rests} rests', {
                  hand: t(label.toLowerCase()),
                  notes: noteEvents.length,
                  rests: restEvents.length,
                })}
              />
            ) : null}
            {restEvents.map((event, index) => (
              <Text
                key={`${label}.rest.${event.startQuarter}.${index}`}
                style={{
                  position: 'absolute',
                  left: `${((event.startQuarter + event.durationQuarter / 2) / durationQuarter) * 100}%`,
                  transform: [{ translateX: -12 }],
                  color,
                  fontSize: size === 'compact' ? 7 : 8,
                  fontWeight: '900',
                  letterSpacing: 0.2,
                  textAlign: 'center',
                }}
              >
                REST
              </Text>
            ))}
          </View>
        ) : null}
      </View>
      {!minimal ? (
        <Text style={{ color: colors.muted, fontSize: 10, fontVariant: ['tabular-nums'], width: 28, textAlign: 'right' }}>
          {noteEvents.length}
        </Text>
      ) : null}
    </View>
  );
}

function MeasureBarLine({ testID, inset = 0 }: { testID?: string; inset?: number }) {
  const { colors } = useTheme();
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
  hideHeader = false,
  testIdPrefix = 'practice.scoreMeasure',
  visibleHand,
  focusedColor,
  minimal = false,
  showStaffLines = false,
  showHandLabels = false,
  initialNotationWidth = 0,
}: {
  measure: ScoreMeasure;
  number: number;
  count: number;
  compact?: boolean;
  beamGroupQuarterNotes?: number;
  hideHeader?: boolean;
  testIdPrefix?: string;
  visibleHand?: Hand;
  focusedColor?: string;
  minimal?: boolean;
  showStaffLines?: boolean;
  showHandLabels?: boolean;
  initialNotationWidth?: number;
}) {
  const { colors } = useTheme();
  const size: NoteNotationSize = compact ? 'compact' : 'full';

  return (
    <View testID={testIdPrefix} style={{ position: 'relative', paddingHorizontal: compact ? 4 : 12, paddingVertical: compact ? 3 : 7, gap: compact ? 2 : 4 }}>
      {!hideHeader ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? 0 : 2 }}>
          <Text style={{ color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '800', letterSpacing: 1.1 }}>SCORE RHYTHM</Text>
          <Text style={{ color: colors.text, fontSize: compact ? 10 : 11, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            BAR {number} / {count}
          </Text>
        </View>
      ) : null}
      {!visibleHand || visibleHand === 'left' ? (
        <RhythmTrack
          label="LEFT"
          events={measure.leftEvents}
          durationQuarter={measure.durationQuarter}
          color={visibleHand ? focusedColor ?? colors.left : colors.left}
          size={size}
          beamGroupQuarterNotes={beamGroupQuarterNotes}
          minimal={minimal}
          showStaffLines={showStaffLines}
          showHandLabels={showHandLabels}
          initialNotationWidth={initialNotationWidth}
          testIdPrefix={testIdPrefix}
        />
      ) : null}
      {!visibleHand || visibleHand === 'right' ? (
        <RhythmTrack
          label="RIGHT"
          events={measure.rightEvents}
          durationQuarter={measure.durationQuarter}
          color={visibleHand ? focusedColor ?? colors.right : colors.right}
          size={size}
          beamGroupQuarterNotes={beamGroupQuarterNotes}
          minimal={minimal}
          showStaffLines={showStaffLines}
          showHandLabels={showHandLabels}
          initialNotationWidth={initialNotationWidth}
          testIdPrefix={testIdPrefix}
        />
      ) : null}
      <MeasureBarLine testID={`${testIdPrefix}.barline`} inset={2} />
    </View>
  );
}

interface ScrollingScoreRhythmProps {
  measure: ScoreMeasure;
  previousMeasure?: ScoreMeasure;
  nextMeasure: ScoreMeasure;
  upcomingMeasures?: ScoreMeasure[];
  sequence: number;
  count: number;
  compact?: boolean;
  beamGroupQuarterNotes?: number;
  minimal?: boolean;
  visibleHand?: Hand;
  focusedColor?: string;
  showStaffLines?: boolean;
  initialViewportWidth?: number;
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
  visibleHand,
  focusedColor,
  showStaffLines,
  initialNotationWidth,
}: {
  bar: VisibleScoreBar;
  count: number;
  width: number;
  size: NoteNotationSize;
  beamGroupQuarterNotes: number;
  minimal: boolean;
  visibleHand?: Hand;
  focusedColor?: string;
  showStaffLines: boolean;
  initialNotationWidth: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      testID={`practice.scoreMeasure.bar.${bar.sequence}`}
      style={{ position: 'relative', width, paddingHorizontal: 4, paddingVertical: size === 'compact' ? 3 : 7, gap: size === 'compact' ? 2 : 4 }}
    >
      {!minimal ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: size === 'compact' ? 0 : 2 }}>
          <Text style={{ color: colors.text, fontSize: size === 'compact' ? 10 : 11, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            BAR {bar.number} / {count}
          </Text>
        </View>
      ) : null}
      {(!visibleHand || visibleHand === 'left') ? <RhythmTrack
        label="LEFT"
        events={bar.measure.leftEvents}
        durationQuarter={bar.measure.durationQuarter}
        color={visibleHand ? focusedColor ?? colors.left : colors.left}
        size={size}
        beamGroupQuarterNotes={beamGroupQuarterNotes}
        minimal={minimal}
        showStaffLines={showStaffLines}
        initialNotationWidth={initialNotationWidth}
        testIdPrefix={`practice.scoreMeasure.bar.${bar.sequence}`}
      /> : null}
      {(!visibleHand || visibleHand === 'right') ? <RhythmTrack
        label="RIGHT"
        events={bar.measure.rightEvents}
        durationQuarter={bar.measure.durationQuarter}
        color={visibleHand ? focusedColor ?? colors.right : colors.right}
        size={size}
        beamGroupQuarterNotes={beamGroupQuarterNotes}
        minimal={minimal}
        showStaffLines={showStaffLines}
        initialNotationWidth={initialNotationWidth}
        testIdPrefix={`practice.scoreMeasure.bar.${bar.sequence}`}
      /> : null}
      <MeasureBarLine testID={`practice.scoreMeasure.barline.${bar.sequence}`} inset={4} />
    </View>
  );
}

/** Slides the score viewport when its supplied sequence changes. */
export function ScrollingScoreRhythm({
  measure,
  previousMeasure,
  nextMeasure,
  upcomingMeasures,
  sequence,
  count,
  compact = false,
  beamGroupQuarterNotes = 1,
  minimal = false,
  visibleHand,
  focusedColor,
  showStaffLines = false,
  initialViewportWidth = 0,
}: ScrollingScoreRhythmProps) {
  const { colors } = useTheme();
  const [measuredViewportWidth, setMeasuredViewportWidth] = useState(0);
  const viewportWidth = measuredViewportWidth || initialViewportWidth;
  const size: NoteNotationSize = compact ? 'compact' : 'full';
  const [translateX] = useState(() => new Animated.Value(0));
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const visibleSequenceRef = useRef(sequence);
  const barWidth = viewportWidth > 0 ? Math.max(160, Math.min(320, viewportWidth / 3)) : 0;
  const initialNotationWidth = Math.max(0, barWidth - 8);
  const followingMeasures = upcomingMeasures?.length ? upcomingMeasures : [measure, nextMeasure];
  const upcomingBars = followingMeasures.map((item, offset) => scoreBar(item, count, sequence + offset));
  const visibleBars = sequence === 0 || !previousMeasure
    ? upcomingBars
    : [scoreBar(previousMeasure, count, sequence - 1), ...upcomingBars];

  useLayoutEffect(() => {
    if (sequence === visibleSequenceRef.current) return;
    visibleSequenceRef.current = sequence;
    animationRef.current?.stop();

    if (barWidth <= 0) {
      translateX.setValue(0);
      return;
    }

    translateX.setValue(0);
    animationRef.current = Animated.timing(translateX, {
      toValue: -barWidth,
      duration: 190,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animationRef.current.start();

    return () => animationRef.current?.stop();
  }, [barWidth, sequence, translateX]);

  return (
    <View
      testID="practice.scoreMeasure"
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}
    >
      <View style={{ width: 52, gap: compact ? 2 : 4 }}>
        {(!visibleHand || visibleHand === 'left') ? (
          <View style={{ minHeight: compact ? 40 : 54, justifyContent: 'center' }}>
            <Text style={{ color: visibleHand ? focusedColor ?? colors.left : colors.left, fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>LEFT</Text>
          </View>
        ) : null}
        {(!visibleHand || visibleHand === 'right') ? (
          <View style={{ minHeight: compact ? 40 : 54, justifyContent: 'center' }}>
            <Text style={{ color: visibleHand ? focusedColor ?? colors.right : colors.right, fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>RIGHT</Text>
          </View>
        ) : null}
      </View>
      <View
        testID="practice.scoreMeasure.viewport"
        onLayout={({ nativeEvent }) => setMeasuredViewportWidth(nativeEvent.layout.width)}
        style={{ flex: 1, overflow: 'hidden', paddingVertical: minimal ? 0 : compact ? 3 : 7 }}
      >
        {barWidth > 0 ? (
          <Animated.View
            testID="practice.scoreMeasure.strip"
            style={{ width: barWidth * visibleBars.length, flexDirection: 'row', transform: [{ translateX }] }}
          >
            {visibleBars.map((bar) => (
              <ScoreBarPanel
                key={bar.sequence}
                bar={bar}
                count={count}
                width={barWidth}
                size={size}
                beamGroupQuarterNotes={beamGroupQuarterNotes}
                minimal={minimal}
                visibleHand={visibleHand}
                focusedColor={focusedColor}
                showStaffLines={showStaffLines}
                initialNotationWidth={initialNotationWidth}
              />
            ))}
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
