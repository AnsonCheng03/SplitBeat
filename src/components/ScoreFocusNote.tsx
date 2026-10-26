import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { NoteNotation } from '@/components/NoteNotation';
import { createScoreFocusNotePlan } from '@/rhythm/scoreFocusNote';
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
  const [measuredLayout, setMeasuredLayout] = useState({ estimate: initialWidth, width: 0 });
  const width = measuredLayout.estimate === initialWidth && measuredLayout.width > 0
    ? measuredLayout.width
    : initialWidth;
  const plan = useMemo(() => createScoreFocusNotePlan(event, width), [event, width]);

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
