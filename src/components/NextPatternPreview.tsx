import { useLayoutEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { ScoreRhythmMeasure } from '@/components/ScoreRhythmMeasure';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { colors } from '@/theme';
import type { ScoreRhythmMeasure as ScoreMeasure } from '@/types/importedScore';
import type { ExerciseStep, Hand, Subdivision, TimeSignature } from '@/types/rhythm';

interface NextPatternPreviewProps {
  step: ExerciseStep | null;
  beatsUntilChange: number;
  graceNotesEnabled?: boolean;
  restBeforeChange?: boolean;
  compact?: boolean;
  timeSignature: TimeSignature;
  leftInset: number;
  rightInset: number;
  top: number;
  height: number;
  scoreMeasure?: ScoreMeasure | null;
  scoreMeasureNumber?: number;
  scoreMeasureCount?: number;
  scoreMeasureSequence?: number;
  scoreBeatsUntilChange?: number;
  beamGroupQuarterNotes?: number;
  focusedHand?: Hand;
}

interface HandPreviewProps {
  hand: Hand;
  subdivision: Subdivision;
  timeSignature: TimeSignature;
  compact: boolean;
  label?: string;
  colorOverride?: string;
}

function HandPreview({ hand, subdivision, timeSignature, compact, label = hand.toUpperCase(), colorOverride }: HandPreviewProps) {
  const color = colorOverride ?? (hand === 'left' ? colors.left : colors.right);

  return (
    <View style={{ flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: compact ? 1 : 3 }}>
      <Text
        numberOfLines={1}
        style={{ color, fontSize: compact ? 9 : 11, fontWeight: '900', letterSpacing: 1 }}
      >
        {label}
      </Text>
      <RhythmSymbol subdivision={subdivision} color={color} timeSignature={timeSignature} />
      <Text
        numberOfLines={1}
        style={{
          color: colors.text,
          fontSize: compact ? 11 : 13,
          lineHeight: compact ? 13 : 16,
          fontWeight: '800',
        }}
      >
        {SUBDIVISION_LABELS[subdivision]}
      </Text>
    </View>
  );
}

export function NextPatternPreview({
  step,
  beatsUntilChange,
  graceNotesEnabled = false,
  restBeforeChange = false,
  compact = false,
  timeSignature,
  leftInset,
  rightInset,
  top,
  height,
  scoreMeasure,
  scoreMeasureNumber,
  scoreMeasureCount,
  scoreMeasureSequence,
  scoreBeatsUntilChange,
  beamGroupQuarterNotes = 1,
  focusedHand,
}: NextPatternPreviewProps) {
  const [slideProgress] = useState(() => new Animated.Value(0));
  const previewId = scoreMeasure
    ? `score:${scoreMeasureSequence ?? scoreMeasure.index}`
    : step?.id;

  useLayoutEffect(() => {
    if (!previewId) return;

    slideProgress.setValue(0);
    const animation = Animated.timing(slideProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [previewId, slideProgress]);

  if (!step && !scoreMeasure) return null;

  const isScorePreview = Boolean(scoreMeasure);
  const title = isScorePreview ? 'NEXT BAR' : 'UP NEXT';
  const countdown = isScorePreview ? scoreBeatsUntilChange ?? beatsUntilChange : beatsUntilChange;
  const countdownLabel = countdown === 1 ? 'BEAT' : 'BEATS';
  const changeDetail = restBeforeChange
    ? ', with a rest before the change'
    : graceNotesEnabled
      ? ', with a grace note pickup before the change'
      : '';
  const accessibleDescription = scoreMeasure
    ? `Next score bar ${scoreMeasureNumber ?? scoreMeasure.index + 1}. Starts in ${countdown} ${countdownLabel.toLowerCase()}.`
    : step
      ? focusedHand
        ? `Next pattern. Changes in ${countdown} ${countdownLabel.toLowerCase()}. One hand: ${SUBDIVISION_LABELS[focusedHand === 'left' ? step.leftSubdivision : step.rightSubdivision]}` + changeDetail
        : `Next pattern. Changes in ${countdown} ${countdownLabel.toLowerCase()}. ` +
        `Left hand: ${SUBDIVISION_LABELS[step.leftSubdivision]}. ` +
        `Right hand: ${SUBDIVISION_LABELS[step.rightSubdivision]}` + changeDetail
      : 'Upcoming pattern';

  return (
    <Animated.View
      testID="practice.nextPattern"
      pointerEvents="none"
      accessibilityLabel={accessibleDescription}
      style={{
        position: 'absolute',
        top,
        left: -leftInset,
        right: -rightInset,
        height,
        opacity: slideProgress,
        transform: [{ translateX: slideProgress.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }],
      }}
    >
      <View
        style={{
          flex: 1,
          width: '94%',
          maxWidth: 760,
          alignSelf: 'center',
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderWidth: 1,
          borderRadius: 15,
          paddingHorizontal: compact ? 9 : 13,
          paddingVertical: compact ? 6 : 9,
        }}
      >
        <View style={{ minHeight: compact ? 18 : 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: compact ? 4 : 6 }}>
          <Text style={{ color: colors.muted, fontSize: compact ? 9 : 11, fontWeight: '900', letterSpacing: 1.2 }}>
            {title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
            {isScorePreview && scoreMeasureNumber !== undefined && scoreMeasureCount !== undefined ? (
              <Text style={{ color: colors.text, fontSize: compact ? 10 : 12, fontWeight: '800', marginRight: 3 }}>
                {scoreMeasureNumber}/{scoreMeasureCount}
              </Text>
            ) : null}
            <Text
              testID="practice.nextPattern.countdown"
              style={{ color: colors.accent, fontSize: compact ? 18 : 22, lineHeight: compact ? 20 : 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}
            >
              {countdown}
            </Text>
            <Text style={{ color: colors.accent, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.5 }}>
              {countdownLabel}
            </Text>
          </View>
        </View>

        {scoreMeasure ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ScoreRhythmMeasure
              measure={scoreMeasure}
              number={scoreMeasureNumber ?? scoreMeasure.index + 1}
              count={scoreMeasureCount ?? 1}
              compact={compact}
              beamGroupQuarterNotes={beamGroupQuarterNotes}
              hideHeader
              testIdPrefix="practice.nextScoreMeasure"
              visibleHand={focusedHand}
              focusedColor={focusedHand ? colors.accent : undefined}
              minimal={Boolean(focusedHand)}
            />
          </View>
        ) : step ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            {focusedHand ? (
              <HandPreview
                hand={focusedHand}
                label="ONE HAND"
                subdivision={focusedHand === 'left' ? step.leftSubdivision : step.rightSubdivision}
                timeSignature={timeSignature}
                compact={compact}
                colorOverride={colors.accent}
              />
            ) : (
              <>
                <HandPreview hand="left" subdivision={step.leftSubdivision} timeSignature={timeSignature} compact={compact} />
                <View style={{ width: 1, height: '82%', backgroundColor: colors.line }} />
                <HandPreview hand="right" subdivision={step.rightSubdivision} timeSignature={timeSignature} compact={compact} />
              </>
            )}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}
