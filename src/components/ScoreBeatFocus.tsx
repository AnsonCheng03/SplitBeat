import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { NoteNotation } from '@/components/NoteNotation';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { createBarNoteNotationPlan } from '@/rhythm/noteNotation';
import { centerScoreBeatEvents, scoreBeatEvents, scoreNotationEventsForSpan } from '@/rhythm/scoreStaff';
import type { ScoreRhythmMeasure, ScoreRhythmEvent } from '@/types/importedScore';
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

const TUPLET_LABELS: Record<number, string> = {
  2: 'Duplet (2)',
  3: 'Triplet (3)',
  4: 'Quadruplet (4)',
  5: 'Quintuplet (5)',
  6: 'Sextuplet (6)',
  7: 'Septuplet (7)',
  8: 'Octuplet (8)',
  9: 'Nonuplet (9)',
};

const DURATION_LABELS: readonly [number, string][] = [
  [4, 'whole'],
  [3, 'dotted half'],
  [2, 'half'],
  [1.5, 'dotted quarter'],
  [1, 'Quarter (Crotchet)'],
  [0.75, 'dotted eighth'],
  [0.5, 'Quaver (Eighth)'],
  [0.375, 'dotted sixteenth'],
  [0.25, 'Semiquaver (16th)'],
  [0.125, 'Demisemiquaver (32nd)'],
  [0.0625, 'Hemidemisemiquaver (64th)'],
];

function eventLabel(event: ScoreRhythmEvent): string {
  if (event.isRest || event.isCrossBarTieContinuation) return 'Rest';
  if (event.tupletNumber !== undefined) return TUPLET_LABELS[event.tupletNumber] ?? 'score note';

  const duration = event.notationDurationQuarter ?? event.durationQuarter;
  return DURATION_LABELS.find(([quarterNotes]) => Math.abs(duration - quarterNotes) < 0.00001)?.[1] ?? 'score note';
}

function scoreBeatLabel(events: readonly ScoreRhythmEvent[], t: (source: string) => string): string {
  const visibleEvents = events.filter((event) => !event.isRest && !event.isCrossBarTieContinuation);
  if (visibleEvents.length === 0) return '';
  const counts = new Map<string, number>();
  visibleEvents.forEach((event) => {
    const label = eventLabel(event);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return [...counts].map(([label, count]) => `${t(label)}${count > 1 ? ` ×${count}` : ''}`).join('  +  ');
}

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
  const notationScale = compact ? 1.3 : 1.55;
  const events = useMemo(
    () => scoreBeatEvents(measure, nextMeasure, quarterInMeasure, beatDurationQuarter, hand),
    [beatDurationQuarter, hand, measure, nextMeasure, quarterInMeasure],
  );
  const notationEvents = useMemo(
    () => oneHand ? centerScoreBeatEvents(events, beatDurationQuarter) : events,
    [beatDurationQuarter, events, oneHand],
  );
  const notes = useMemo(() => scoreNotationEventsForSpan(notationEvents, beatDurationQuarter), [beatDurationQuarter, notationEvents]);
  const plan = useMemo(() => notes.length > 0 && notationWidth > 0
    ? createBarNoteNotationPlan(notes, {
      durationQuarter: beatDurationQuarter,
      width: notationWidth / notationScale,
      size: 'full',
      beamGroupQuarterNotes: beatDurationQuarter,
    })
    : null,
  [beatDurationQuarter, notes, notationScale, notationWidth]);
  const visualBeatLabel = scoreBeatLabel(events, t);
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
