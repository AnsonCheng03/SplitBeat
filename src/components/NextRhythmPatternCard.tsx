import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { MixtureSymbol } from '@/components/MixtureSymbol';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExerciseStep, Hand, TimeSignature } from '@/types/rhythm';
import {
  NextPatternPreviewStyle5,
  NextPatternPreviewStyle12,
  nextRhythmPatternCardWrapperStyle,
  nextRhythmPatternCardSurfaceStyle,
  nextRhythmPatternCardTintStyle,
  nextRhythmPatternCardContentStyle,
  nextRhythmPatternCardHeaderStyle,
  nextRhythmPatternCardLabelRowStyle,
  nextRhythmPatternCardCountdownStyle,
  nextRhythmPatternSymbolsStyle,
  nextRhythmPatternHandStyle,
} from '@/styles/notation';

export function NextRhythmPatternCard({
  step,
  countdown,
  compact,
  timeSignature,
  focusedHand,
  groupWidth,
  maxNoteHeight,
}: {
  step: ExerciseStep;
  countdown: number;
  compact: boolean;
  timeSignature: TimeSignature;
  focusedHand?: Hand;
  groupWidth: number;
  maxNoteHeight: number;
}) {
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const symbolGroupWidth = Math.min(groupWidth, 64);
  const symbolMaxHeight = Math.min(maxNoteHeight, 48);
  const light = mode === 'light';

  return (
    <View style={nextRhythmPatternCardWrapperStyle}>
      <View style={nextRhythmPatternCardSurfaceStyle({ light })}>
        <BlurView
          pointerEvents="none"
          tint={light ? 'light' : 'dark'}
          intensity={42}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={nextRhythmPatternCardTintStyle({ light })} />
        <View style={nextRhythmPatternCardContentStyle}>
          <View style={nextRhythmPatternCardHeaderStyle()}>
            <View style={nextRhythmPatternCardLabelRowStyle()}>
              <Text style={NextPatternPreviewStyle5({ colors, compact })}>{t('NEXT')}</Text>
              <Text style={nextRhythmPatternCardCountdownStyle({ colors, compact })}>
                {' · '}{countdown} {t(countdown === 1 ? 'BEAT' : 'BEATS')}
              </Text>
            </View>
          </View>
          <View style={nextRhythmPatternSymbolsStyle}>
            {focusedHand ? (
              <HandPreview
                hand={focusedHand}
                step={step}
                colorOverride={colors.accent}
                timeSignature={timeSignature}
                groupWidth={symbolGroupWidth}
                maxNoteHeight={symbolMaxHeight}
                readyTestID={`practice.nextPattern.${focusedHand}.ready`}
              />
            ) : (
              <>
                <HandPreview
                  hand="left"
                  step={step}
                  timeSignature={timeSignature}
                  groupWidth={symbolGroupWidth}
                  maxNoteHeight={symbolMaxHeight}
                  readyTestID="practice.nextPattern.left.ready"
                />
                <View style={NextPatternPreviewStyle12({ colors })} />
                <HandPreview
                  hand="right"
                  step={step}
                  timeSignature={timeSignature}
                  groupWidth={symbolGroupWidth}
                  maxNoteHeight={symbolMaxHeight}
                  readyTestID="practice.nextPattern.right.ready"
                />
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function HandPreview({
  hand,
  step,
  colorOverride,
  timeSignature,
  groupWidth,
  maxNoteHeight,
  readyTestID,
}: {
  hand: Hand;
  step: ExerciseStep;
  colorOverride?: string;
  timeSignature: TimeSignature;
  groupWidth: number;
  maxNoteHeight: number;
  readyTestID: string;
}) {
  const { colors } = useTheme();
  const left = hand === 'left';
  const color = colorOverride ?? (left ? colors.left : colors.right);
  const subdivision = left ? step.leftSubdivision : step.rightSubdivision;
  const mixtureId = left ? step.leftMixture : step.rightMixture;
  const rest = left ? step.leftRest : step.rightRest;

  return (
    <View style={nextRhythmPatternHandStyle}>
      {mixtureId && !rest ? (
        <MixtureSymbol
          mixtureId={mixtureId}
          color={color}
          scale={1}
          groupWidth={groupWidth}
          maxWidth={groupWidth}
          maxHeight={maxNoteHeight}
          readyTestID={readyTestID}
        />
      ) : (
        <RhythmSymbol
          subdivision={subdivision}
          color={color}
          timeSignature={timeSignature}
          scale={1}
          groupWidth={groupWidth}
          maxWidth={groupWidth}
          maxHeight={maxNoteHeight}
          readyTestID={readyTestID}
          rest={rest}
        />
      )}
    </View>
  );
}
