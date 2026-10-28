import { Text, View } from 'react-native';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { TUTORIAL_BAR_HANDS } from '@/features/tutorial/tutorialFlow';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { PracticeDisplayMode } from '@/types/rhythm';
import {
  tutorialStylePreview,
  tutorialStylePreviewBeat,
  tutorialStylePreviewBeatLabel,
  tutorialStylePreviewCurrentNote,
  tutorialStylePreviewCurrentTitle,
  tutorialStylePreviewMeasure,
  tutorialStylePreviewMeasureBarline,
  tutorialStylePreviewNoteCell,
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
  const { colors } = useTheme();
  const { t } = useI18n();

  if (displayMode === 'rhythm') {
    const hand = TUTORIAL_BAR_HANDS[beatIndex];
    const handColor = hand === 'left' ? colors.left : colors.right;
    return (
      <View testID="tutorial.notation.note" style={tutorialStylePreview({ colors, compact })}>
        <Text style={tutorialStylePreviewCurrentTitle({ color: handColor, compact })}>{t(hand.toUpperCase())}</Text>
        <View style={tutorialStylePreviewCurrentNote({ compact })}>
          <RhythmSymbol
            subdivision="quarter"
            color={handColor}
            scale={compact ? 1.3 : 1.6}
            maxWidth={100}
            maxHeight={90}
          />
        </View>
      </View>
    );
  }

  return (
    <View testID="tutorial.notation.bar" style={tutorialStylePreview({ colors, compact })}>
      <View style={tutorialStylePreviewMeasure()}>
        <View style={tutorialStylePreviewMeasureBarline({ colors, compact })} />
        {TUTORIAL_BAR_HANDS.map((hand, index) => {
          const handColor = hand === 'left' ? colors.left : colors.right;
          const current = beatIndex === index;
          return (
            <View
              key={`${hand}.${index}`}
              testID={`tutorial.barBeat.${index + 1}`}
              style={tutorialStylePreviewBeat({ current, colors, handColor, compact })}
            >
              <Text style={tutorialStylePreviewBeatLabel({ current, colors, compact })}>{index + 1}</Text>
              <View style={tutorialStylePreviewNoteCell({ compact })}>
                <RhythmSymbol
                  subdivision="quarter"
                  color={handColor}
                  scale={compact ? 0.7 : 0.82}
                  maxWidth={compact ? 44 : 52}
                  maxHeight={compact ? 52 : 65}
                />
              </View>
            </View>
          );
        })}
        <View style={tutorialStylePreviewMeasureBarline({ colors, compact })} />
      </View>
    </View>
  );
}
