import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { MeasureBarLine, RhythmTrack, scoreLaneHeight } from '@/components/ScoreRhythmLane';
import type { NoteNotationSize } from '@/rhythm/noteNotation';
import { scoreBarWidth } from '@/rhythm/scoreLayout';
import type { ScoreRhythmMeasure as ScoreMeasure } from '@/types/importedScore';
import type { Hand } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';

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
  showHandLabels?: boolean;
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
  const alignmentEventGroups = useMemo(
    () => [bar.measure.leftEvents, bar.measure.rightEvents],
    [bar.measure.leftEvents, bar.measure.rightEvents],
  );
  return (
    <View
      testID={`practice.scoreMeasure.bar.${bar.sequence}`}
      style={{
        position: 'relative',
        width,
        paddingHorizontal: 4,
        paddingVertical: minimal ? 0 : size === 'compact' ? 3 : 7,
        gap: size === 'compact' ? 2 : 4,
      }}
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
        alignmentEventGroups={alignmentEventGroups}
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
        alignmentEventGroups={alignmentEventGroups}
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
  showHandLabels = false,
  initialViewportWidth = 0,
}: ScrollingScoreRhythmProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [measuredViewportWidth, setMeasuredViewportWidth] = useState(0);
  const showLaneLabels = !minimal || showHandLabels;
  const labelColumnWidth = showLaneLabels ? 46 : 0;
  const viewportWidth = measuredViewportWidth || Math.max(0, initialViewportWidth - labelColumnWidth);
  const size: NoteNotationSize = compact ? 'compact' : 'full';
  const laneHeight = scoreLaneHeight(size);
  const visibleLaneCount = visibleHand ? 1 : 2;
  const laneGap = visibleLaneCount > 1 ? compact ? 2 : 4 : 0;
  const scoreRowsHeight = laneHeight * visibleLaneCount + laneGap;
  const [translateX] = useState(() => new Animated.Value(0));
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const visibleSequenceRef = useRef(sequence);
  const barWidth = scoreBarWidth(viewportWidth, count);
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
      {showLaneLabels ? (
        <View style={{ width: labelColumnWidth, gap: laneGap }}>
          {(!visibleHand || visibleHand === 'left') ? (
            <View style={{ height: laneHeight, justifyContent: 'center' }}>
              <Text style={{ color: visibleHand ? focusedColor ?? colors.left : colors.left, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.6 }}>{t('LEFT')}</Text>
            </View>
          ) : null}
          {(!visibleHand || visibleHand === 'right') ? (
            <View style={{ height: laneHeight, justifyContent: 'center' }}>
              <Text style={{ color: visibleHand ? focusedColor ?? colors.right : colors.right, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.6 }}>{t('RIGHT')}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View
        testID="practice.scoreMeasure.viewport"
        onLayout={({ nativeEvent }) => setMeasuredViewportWidth(nativeEvent.layout.width)}
        style={{
          flex: 1,
          height: minimal ? scoreRowsHeight : undefined,
          overflow: 'hidden',
          paddingVertical: minimal ? 0 : compact ? 3 : 7,
        }}
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
