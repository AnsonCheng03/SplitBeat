import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { FadeScoreBarSlot } from '@/components/FadeScoreBarSlot';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { MeasureBarLine, RhythmTrack } from '@/components/ScoreRhythmLane';
import { scoreLaneHeight } from '@/rhythm/scoreRhythmLayout';
import type { NoteNotationSize } from '@/rhythm/noteNotation';
import { scoreBarWidth } from '@/rhythm/scoreLayout';
import {
  scoreFadeOutgoingSequence,
  scoreFadeVisibleSequences,
  scoreNoteScrollProgress,
  scoreStripOffset,
} from '@/rhythm/scoreMotion';
import type { ScoreDisplayMode } from '@/rhythm/scoreStaff';
import type { ScoreRhythmMeasure as ScoreMeasure } from '@/types/importedScore';
import type { Hand } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ScrollingScoreRhythmStyle1,
  ScrollingScoreRhythmStyle2,
  ScrollingScoreRhythmStyle3,
  ScrollingScoreRhythmStyle4,
  ScrollingScoreRhythmStyle5,
  ScrollingScoreRhythmStyle6,
  ScrollingScoreRhythmStyle7,
  ScrollingScoreRhythmStyle8,
  ScrollingScoreRhythmStyle9,
  ScrollingScoreRhythmStyle10,
  ScrollingScoreRhythmStyle11
} from '@/styles/notation';

interface ScrollingScoreRhythmProps {
  measure: ScoreMeasure;
  previousMeasure?: ScoreMeasure;
  nextMeasure: ScoreMeasure;
  upcomingMeasures?: ScoreMeasure[];
  sequence: number;
  count: number;
  movementMode: Exclude<ScoreDisplayMode, 'focus'>;
  quarterInMeasure: number;
  counterBeatInBar: number;
  counterBeatsPerBar: number;
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
  slotIndex,
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
  slotIndex: number;
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
      testID={`practice.scoreMeasure.slot.${slotIndex}.bar.${bar.sequence}`}
      style={ScrollingScoreRhythmStyle1({ width, minimal, size })}
    >
      {!minimal ? (
        <View style={ScrollingScoreRhythmStyle2({ size })}>
          <Text style={ScrollingScoreRhythmStyle3({ colors, size })}>
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
        testIdPrefix={`practice.scoreMeasure.slot.${slotIndex}.bar.${bar.sequence}`}
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
        testIdPrefix={`practice.scoreMeasure.slot.${slotIndex}.bar.${bar.sequence}`}
      /> : null}
      <MeasureBarLine testID={`practice.scoreMeasure.slot.${slotIndex}.barline`} inset={4} />
    </View>
  );
}

/** Animates score bars at bar boundaries or note onsets, depending on the selected mode. */
export function ScrollingScoreRhythm({
  measure,
  previousMeasure,
  nextMeasure,
  upcomingMeasures,
  sequence,
  count,
  movementMode,
  quarterInMeasure,
  counterBeatInBar,
  counterBeatsPerBar,
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
  const motionRef = useRef({ sequence, movementMode, barWidth: 0, noteProgress: 0 });
  const barWidth = scoreBarWidth(viewportWidth, count);
  const initialNotationWidth = Math.max(0, barWidth - 8);
  const followingMeasures = upcomingMeasures?.length ? upcomingMeasures : [measure, nextMeasure];
  const upcomingBars = followingMeasures.map((item, offset) => scoreBar(item, count, sequence + offset));
  const regularVisibleBars = sequence === 0 || !previousMeasure
    ? upcomingBars
    : [scoreBar(previousMeasure, count, sequence - 1), ...upcomingBars];
  const visibleBars = movementMode === 'fade'
    ? scoreFadeVisibleSequences(sequence, count, counterBeatInBar, counterBeatsPerBar)
      .flatMap((barSequence) => {
        const bar = upcomingBars.find((candidate) => candidate.sequence === barSequence);
        return bar ? [bar] : [];
      })
    : regularVisibleBars;
  const noteProgress = movementMode === 'slide-per-note'
    ? scoreNoteScrollProgress(measure, quarterInMeasure)
    : 0;
  const renderScoreBarPanel = (bar: VisibleScoreBar, slotIndex: number) => (
    <ScoreBarPanel
      bar={bar}
      slotIndex={slotIndex}
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
  );
  const visibleSlots = visibleBars.map((bar, slotIndex) => {
    const outgoingSequence = movementMode === 'fade'
      ? scoreFadeOutgoingSequence(
        slotIndex,
        sequence,
        count,
        counterBeatInBar,
        counterBeatsPerBar,
      )
      : undefined;
    return {
      bar,
      slotIndex,
      outgoingBar: outgoingSequence === undefined
        ? undefined
        : upcomingBars.find((candidate) => candidate.sequence === outgoingSequence),
    };
  });

  useLayoutEffect(() => {
    const previousMotion = motionRef.current;
    const sequenceChanged = sequence !== previousMotion.sequence;
    const modeChanged = movementMode !== previousMotion.movementMode;
    const widthChanged = barWidth !== previousMotion.barWidth;
    motionRef.current = { sequence, movementMode, barWidth, noteProgress };
    animationRef.current?.stop();

    if (barWidth <= 0) {
      translateX.setValue(0);
      return;
    }

    if (movementMode === 'fade') {
      translateX.setValue(0);
      return () => animationRef.current?.stop();
    }

    const targetOffset = scoreStripOffset(movementMode, barWidth, sequence, noteProgress);
    if (movementMode === 'slide') {
      if (sequenceChanged || modeChanged) {
        if (sequence > 0) {
          translateX.setValue(0);
          animationRef.current = Animated.timing(translateX, {
            toValue: targetOffset,
            duration: 190,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          });
          animationRef.current.start();
        } else {
          translateX.setValue(targetOffset);
        }
      } else if (widthChanged) {
        translateX.setValue(targetOffset);
      }
      return () => animationRef.current?.stop();
    }

    if (widthChanged || sequenceChanged) {
      translateX.setValue(targetOffset);
    } else if (modeChanged || noteProgress !== previousMotion.noteProgress) {
      animationRef.current = Animated.timing(translateX, {
        toValue: targetOffset,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      animationRef.current.start();
    }

    return () => animationRef.current?.stop();
  }, [barWidth, movementMode, noteProgress, sequence, translateX]);

  return (
    <View
      testID="practice.scoreMeasure"
      style={ScrollingScoreRhythmStyle4()}
    >
      {showLaneLabels ? (
        <View style={ScrollingScoreRhythmStyle5({ labelColumnWidth, laneGap })}>
          {(!visibleHand || visibleHand === 'left') ? (
            <View style={ScrollingScoreRhythmStyle6({ laneHeight })}>
              <Text style={ScrollingScoreRhythmStyle7({ visibleHand, focusedColor, colors, compact })}>{t('LEFT')}</Text>
            </View>
          ) : null}
          {(!visibleHand || visibleHand === 'right') ? (
            <View style={ScrollingScoreRhythmStyle8({ laneHeight })}>
              <Text style={ScrollingScoreRhythmStyle9({ visibleHand, focusedColor, colors, compact })}>{t('RIGHT')}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View
        testID="practice.scoreMeasure.viewport"
        onLayout={({ nativeEvent }) => setMeasuredViewportWidth(nativeEvent.layout.width)}
        style={ScrollingScoreRhythmStyle10({ minimal, scoreRowsHeight, compact })}
      >
        {barWidth > 0 ? (
          <Animated.View
            testID="practice.scoreMeasure.strip"
            style={ScrollingScoreRhythmStyle11({ barWidth, visibleBars, translateX })}
          >
            {visibleSlots.map(({ bar, slotIndex, outgoingBar }) => (
              <FadeScoreBarSlot
                key={slotIndex}
                sequence={bar.sequence}
                width={barWidth}
                animate={Boolean(outgoingBar)}
                outgoing={outgoingBar ? renderScoreBarPanel(outgoingBar, slotIndex) : undefined}
              >
                {renderScoreBarPanel(bar, slotIndex)}
              </FadeScoreBarSlot>
            ))}
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
