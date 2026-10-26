import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { NoteNotation } from '@/components/NoteNotation';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { createScoreBeatFocusModel } from '@/rhythm/scoreBeatFocus';
import type { ScoreRhythmMeasure } from '@/types/importedScore';
import type { Hand } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ScoreBeatFocusStyle1,
  ScoreBeatFocusStyle2,
  ScoreBeatFocusStyle3,
  ScoreBeatFocusStyle4,
  ScoreBeatFocusStyle5,
  ScoreBeatFocusStyle6
} from '@/styles/notation';

export function ScoreBeatFocus({
  measure,
  nextMeasure,
  quarterInMeasure,
  beatDurationQuarter,
  hand,
  color,
  oneHand,
  compact,
  initialWidth,
}: {
  measure: ScoreRhythmMeasure;
  nextMeasure?: ScoreRhythmMeasure;
  quarterInMeasure: number;
  beatDurationQuarter: number;
  hand: Hand;
  color: string;
  oneHand: boolean;
  compact: boolean;
  initialWidth: number;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [measuredLayout, setMeasuredLayout] = useState({ estimate: initialWidth, width: 0 });
  const notationWidth = measuredLayout.estimate === initialWidth && measuredLayout.width > 0
    ? measuredLayout.width
    : initialWidth;
  const { plan, notationScale, visualBeatLabel } = useMemo(() => createScoreBeatFocusModel({
    measure,
    nextMeasure,
    quarterInMeasure,
    beatDurationQuarter,
    hand,
    oneHand,
    compact,
    notationWidth,
    translate: t,
  }), [beatDurationQuarter, compact, hand, measure, nextMeasure, notationWidth, oneHand, quarterInMeasure, t]);
  return (
    <View
      testID={`practice.scoreBeat.${hand}`}
      accessibilityLabel={t('{hand} rhythm for this beat: {pattern}', {
        hand: t(hand),
        pattern: visualBeatLabel || t('Rest'),
      })}
      style={ScoreBeatFocusStyle1({ compact })}
    >
      <Text style={ScoreBeatFocusStyle2({ color, compact })}>
        {oneHand ? 'ONE HAND' : hand.toUpperCase()}
      </Text>
      <View
        onLayout={({ nativeEvent }) => setMeasuredLayout({ estimate: initialWidth, width: nativeEvent.layout.width })}
        style={ScoreBeatFocusStyle3({ compact })}
      >
        {plan ? (
          <View style={ScoreBeatFocusStyle4({ plan, notationScale })}>
            <View style={ScoreBeatFocusStyle5({ plan, notationScale })}>
              <NoteNotation testID={`practice.scoreBeat.${hand}.notation`} plan={plan} color={color} accessibilityLabel={t('Current beat score notation')} />
            </View>
          </View>
        ) : null}
      </View>
      {visualBeatLabel ? (
        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
          style={ScoreBeatFocusStyle6({ colors, compact })}
        >
          {visualBeatLabel}
        </Text>
      ) : null}
    </View>
  );
}
