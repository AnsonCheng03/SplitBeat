import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { createBarNoteNotationPlan } from '@/rhythm/noteNotation';
import type { ScoreRhythmEvent } from '@/types/importedScore';
import { ScoreFocusNoteStyle1, ScoreFocusNoteStyle2 } from '@/styles/notation';

export function ScoreFocusNote({
  event,
  color,
  initialWidth = 0,
  testID = 'practice.scoreFocusNote',
}: {
  event?: ScoreRhythmEvent;
  color: string;
  initialWidth?: number;
  testID?: string;
}) {
  const { t } = useI18n();
  const showsTieContinuationRest = event?.isCrossBarTieContinuation === true;
  const [measuredLayout, setMeasuredLayout] = useState({ estimate: initialWidth, width: 0 });
  const width = measuredLayout.estimate === initialWidth && measuredLayout.width > 0
    ? measuredLayout.width
    : initialWidth;
  const plan = useMemo(() => {
    if (!event || width <= 0) return null;
    const notationDurationQuarter = event.notationDurationQuarter ?? event.durationQuarter;
    const durationQuarter = Math.max(2, notationDurationQuarter * 2);
    return createBarNoteNotationPlan([{
      startQuarter: (durationQuarter - notationDurationQuarter) / 2,
      durationQuarter: notationDurationQuarter,
      tupletNumber: event.tupletNumber,
      ...(event.isRest || showsTieContinuationRest ? { isRest: true } : {}),
    }], {
      durationQuarter,
      width,
      size: 'full',
    });
  }, [event, showsTieContinuationRest, width]);

  return (
    <View
      testID={testID}
      onLayout={({ nativeEvent }) => setMeasuredLayout({ estimate: initialWidth, width: nativeEvent.layout.width })}
      style={ScoreFocusNoteStyle1()}
    >
      {plan ? (
        <NoteNotation plan={plan} color={color} accessibilityLabel={t('Next score note')} testID={`${testID}.notation`} />
      ) : !event ? (
        <Text style={ScoreFocusNoteStyle2({ color })}>REST</Text>
      ) : null}
    </View>
  );
}
