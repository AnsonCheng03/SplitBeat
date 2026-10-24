import { useLayoutEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { MixtureSymbol } from '@/components/MixtureSymbol';
import { ScoreRhythmMeasure } from '@/components/ScoreRhythmMeasure';
import { patternLabelForHand } from '@/rhythm/mixtures';
import { useTheme } from '@/theme/ThemeProvider';
import type { ScoreRhythmMeasure as ScoreMeasure } from '@/types/importedScore';
import type { ExerciseStep, Hand, MixturePatternId, Subdivision, TimeSignature } from '@/types/rhythm';

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
  mixtureId?: MixturePatternId;
  rest: boolean;
  timeSignature: TimeSignature;
  compact: boolean;
  label?: string;
  colorOverride?: string;
}

function HandPreview({ hand, subdivision, mixtureId, rest, timeSignature, compact, label = 'NEXT', colorOverride }: HandPreviewProps) {
  const { colors } = useTheme();
  const color = colorOverride ?? (hand === 'left' ? colors.left : colors.right);

  return (
    <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: compact ? 8 : 12, paddingHorizontal: compact ? 5 : 12 }}>
      <Text
        numberOfLines={1}
        style={{ color, fontSize: compact ? 9 : 11, fontWeight: '900', letterSpacing: 1, minWidth: compact ? 29 : 38 }}
      >
        {label}
      </Text>
      {rest ? (
        <RhythmSymbol subdivision={subdivision} color={color} timeSignature={timeSignature} compact scale={compact ? 0.85 : 1} rest />
      ) : mixtureId ? (
        <MixtureSymbol mixtureId={mixtureId} color={color} compact scale={compact ? 0.85 : 1} />
      ) : (
        <RhythmSymbol subdivision={subdivision} color={color} timeSignature={timeSignature} compact scale={compact ? 0.85 : 1} />
      )}
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
  const { colors } = useTheme();
  const { t } = useI18n();
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
  const title = t(isScorePreview ? 'NEXT BAR' : 'UP NEXT');
  const countdown = isScorePreview ? scoreBeatsUntilChange ?? beatsUntilChange : beatsUntilChange;
  const countdownLabel = t(countdown === 1 ? 'BEAT' : 'BEATS');
  const changeDetail = restBeforeChange
    ? t(' · rest before the change')
    : graceNotesEnabled
      ? t(' · grace note pickup before the change')
      : '';
  const accessibleDescription = scoreMeasure
    ? t('Next score bar {bar}. Starts in {count} {unit}.', {
      bar: scoreMeasureNumber ?? scoreMeasure.index + 1,
      count: countdown,
      unit: t(countdown === 1 ? 'beat' : 'beats'),
    })
    : step
      ? focusedHand
        ? t('Next pattern. Changes in {count} {unit}. One hand: {pattern}{detail}', {
          count: countdown,
          unit: t(countdown === 1 ? 'beat' : 'beats'),
          pattern: t(patternLabelForHand(focusedHand === 'left' ? step.leftSubdivision : step.rightSubdivision, focusedHand === 'left' ? step.leftRest : step.rightRest, focusedHand === 'left' ? step.leftMixture : step.rightMixture)),
          detail: changeDetail,
        })
        : t('Next pattern. Changes in {count} {unit}. Left hand: {left}. Right hand: {right}{detail}', {
          count: countdown,
          unit: t(countdown === 1 ? 'beat' : 'beats'),
          left: t(patternLabelForHand(step.leftSubdivision, step.leftRest, step.leftMixture)),
          right: t(patternLabelForHand(step.rightSubdivision, step.rightRest, step.rightMixture)),
          detail: changeDetail,
        })
      : t('Upcoming pattern');

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
        paddingHorizontal: Math.max(16, leftInset + 18, rightInset + 18),
        opacity: slideProgress,
        transform: [{ translateX: slideProgress.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }],
      }}
    >
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1120,
          alignSelf: 'center',
          justifyContent: 'center',
        }}
      >
        {isScorePreview ? (
          <View style={{ minHeight: compact ? 18 : 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: compact ? 4 : 6 }}>
            <Text style={{ color: colors.muted, fontSize: compact ? 9 : 11, fontWeight: '900', letterSpacing: 1.2 }}>
              {title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
              {scoreMeasureNumber !== undefined && scoreMeasureCount !== undefined ? (
                <Text style={{ color: colors.text, fontSize: compact ? 10 : 12, fontWeight: '800', marginRight: 3 }}>
                  {scoreMeasureNumber}/{scoreMeasureCount}
                </Text>
              ) : null}
              <Text
                testID="practice.nextScore.countdown"
                style={{ color: colors.accent, fontSize: compact ? 18 : 22, lineHeight: compact ? 20 : 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}
              >
                {countdown}
              </Text>
              <Text style={{ color: colors.accent, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.5 }}>
                {countdownLabel}
              </Text>
            </View>
          </View>
        ) : null}

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
                subdivision={focusedHand === 'left' ? step.leftSubdivision : step.rightSubdivision}
                mixtureId={focusedHand === 'left' ? step.leftMixture : step.rightMixture}
                rest={focusedHand === 'left' ? step.leftRest : step.rightRest}
                timeSignature={timeSignature}
                compact={compact}
                colorOverride={colors.accent}
              />
            ) : (
              <>
                <HandPreview hand="left" subdivision={step.leftSubdivision} mixtureId={step.leftMixture} rest={step.leftRest} timeSignature={timeSignature} compact={compact} />
                <View style={{ width: 1, height: '82%', backgroundColor: colors.line }} />
                <HandPreview hand="right" subdivision={step.rightSubdivision} mixtureId={step.rightMixture} rest={step.rightRest} timeSignature={timeSignature} compact={compact} />
              </>
            )}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}
