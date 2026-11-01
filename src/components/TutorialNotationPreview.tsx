import { useWindowDimensions, View } from 'react-native';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { ScrollingScoreRhythm } from '@/components/ScrollingScoreRhythm';
import { TUTORIAL_BAR_HANDS, TUTORIAL_BAR_MEASURE } from '@/features/tutorial/tutorialFlow';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { Hand, PracticeDisplayMode } from '@/types/rhythm';
import {
  tutorialStylePreviewCurrentNote,
  tutorialStylePreviewCurrentTitle,
  tutorialStylePreviewHand,
  tutorialStylePreviewHands,
  tutorialStyleScorePreview,
} from '@/styles/tutorial';

export function TutorialNotationPreview({
  displayMode,
  beatIndex,
  compact,
}: {
  displayMode: PracticeDisplayMode;
  beatIndex: number;
  compact: boolean;
}) {
  const { t } = useI18n();
  const { width } = useWindowDimensions();

  if (displayMode === 'rhythm') {
    return (
      <View testID="tutorial.notation.note" style={tutorialStylePreviewHands()}>
        <HandNote hand="left" activeHand={TUTORIAL_BAR_HANDS[beatIndex]} compact={compact} label={t('LEFT')} />
        <HandNote hand="right" activeHand={TUTORIAL_BAR_HANDS[beatIndex]} compact={compact} label={t('RIGHT')} />
      </View>
    );
  }

  return (
    <View testID="tutorial.notation.bar" style={tutorialStyleScorePreview({ compact })}>
      <ScrollingScoreRhythm
        measure={TUTORIAL_BAR_MEASURE}
        nextMeasure={TUTORIAL_BAR_MEASURE}
        upcomingMeasures={[TUTORIAL_BAR_MEASURE]}
        sequence={0}
        count={1}
        movementMode="slide"
        quarterInMeasure={0}
        counterBeatInBar={beatIndex}
        counterBeatsPerBar={4}
        compact={compact}
        beamGroupQuarterNotes={1}
        minimal
        showHandLabels
        initialViewportWidth={Math.min(width * 0.88, 1060)}
      />
    </View>
  );
}

function HandNote({ hand, activeHand, compact, label }: { hand: Hand; activeHand: Hand; compact: boolean; label: string }) {
  const { colors } = useTheme();
  const color = hand === 'left' ? colors.left : colors.right;
  const isRest = activeHand !== hand;

  return (
    <View style={tutorialStylePreviewHand()}>
      <Text style={tutorialStylePreviewCurrentTitle({ color, compact })}>{label}</Text>
      <View style={tutorialStylePreviewCurrentNote({ compact })}>
        <RhythmSymbol
          subdivision="quarter"
          color={color}
          rest={isRest}
          scale={compact ? 1.7 : 2.15}
          maxWidth={compact ? 110 : 154}
          maxHeight={compact ? 100 : 142}
          readyTestID={`tutorial.notation.note.${hand}.ready`}
        />
      </View>
    </View>
  );
}
