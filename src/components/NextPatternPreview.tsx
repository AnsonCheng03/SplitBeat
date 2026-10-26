import { useLayoutEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { NextRhythmPatternCard } from '@/components/NextRhythmPatternCard';
import { ScoreRhythmMeasure } from '@/components/ScoreRhythmMeasure';
import { patternLabelForHand } from '@/rhythm/mixtures';
import { useTheme } from '@/theme/ThemeProvider';
import type { ScoreRhythmMeasure as ScoreMeasure } from '@/types/importedScore';
import type { ExerciseStep, Hand, TimeSignature } from '@/types/rhythm';
import {
  NextPatternPreviewStyle2,
  NextPatternPreviewStyle3,
  NextPatternPreviewStyle4,
  NextPatternPreviewStyle5,
  NextPatternPreviewStyle6,
  NextPatternPreviewStyle7,
  NextPatternPreviewStyle8,
  NextPatternPreviewStyle9,
  NextPatternPreviewStyle10,
} from '@/styles/notation';

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
  groupWidth: number;
  maxNoteHeight: number;
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
  groupWidth,
  maxNoteHeight,
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
      style={NextPatternPreviewStyle2({ top, height, isScorePreview, leftInset, rightInset, slideProgress })}
    >
      <View
        style={NextPatternPreviewStyle3({ isScorePreview })}
      >
        {isScorePreview ? (
          <View style={NextPatternPreviewStyle4({ compact })}>
            <Text style={NextPatternPreviewStyle5({ colors, compact })}>
              {title}
            </Text>
            <View style={NextPatternPreviewStyle6()}>
              {scoreMeasureNumber !== undefined && scoreMeasureCount !== undefined ? (
                <Text style={NextPatternPreviewStyle7({ colors, compact })}>
                  {scoreMeasureNumber}/{scoreMeasureCount}
                </Text>
              ) : null}
              <Text
                testID="practice.nextScore.countdown"
                style={NextPatternPreviewStyle8({ colors, compact })}
              >
                {countdown}
              </Text>
              <Text style={NextPatternPreviewStyle9({ colors, compact })}>
                {countdownLabel}
              </Text>
            </View>
          </View>
        ) : null}

        {scoreMeasure ? (
          <View style={NextPatternPreviewStyle10()}>
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
          <NextRhythmPatternCard
            step={step}
            countdown={countdown}
            compact={compact}
            timeSignature={timeSignature}
            focusedHand={focusedHand}
            groupWidth={groupWidth}
            maxNoteHeight={maxNoteHeight}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}
