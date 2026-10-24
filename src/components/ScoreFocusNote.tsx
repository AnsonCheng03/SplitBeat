import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { createBarNoteNotationPlan } from '@/rhythm/noteNotation';
import type { ScoreRhythmEvent } from '@/types/importedScore';

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
  const [measuredLayout, setMeasuredLayout] = useState({ estimate: initialWidth, width: 0 });
  const width = measuredLayout.estimate === initialWidth && measuredLayout.width > 0
    ? measuredLayout.width
    : initialWidth;
  const plan = useMemo(() => {
    if (!event || width <= 0) return null;
    const durationQuarter = Math.max(2, event.durationQuarter * 2);
    return createBarNoteNotationPlan([{
      startQuarter: (durationQuarter - event.durationQuarter) / 2,
      durationQuarter: event.durationQuarter,
      tupletNumber: event.tupletNumber,
    }], {
      durationQuarter,
      width,
      size: 'full',
    });
  }, [event, width]);

  return (
    <View
      testID={testID}
      onLayout={({ nativeEvent }) => setMeasuredLayout({ estimate: initialWidth, width: nativeEvent.layout.width })}
      style={{ width: '76%', maxWidth: 620, height: 76, alignSelf: 'center', justifyContent: 'center' }}
    >
      {plan ? (
        <NoteNotation plan={plan} color={color} accessibilityLabel={t('Next score note')} testID={`${testID}.notation`} useNativeGlyphs />
      ) : !event ? (
        <Text style={{ color, textAlign: 'center', fontSize: 16, fontWeight: '900', letterSpacing: 1.2 }}>REST</Text>
      ) : null}
    </View>
  );
}
