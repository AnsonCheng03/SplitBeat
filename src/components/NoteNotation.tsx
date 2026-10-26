import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import type { NoteNotationPlan } from '@/rhythm/noteNotation';
import { notationVisualCenterOffsetY } from '@/rhythm/noteNotation';
import VexFlowNotationDOM from '@/components/VexFlowNotationDOM';
import { NoteNotationStyle1, NoteNotationStyle2, NoteNotationStyle3, NoteNotationStyle4, noteNotationDOMStyle } from '@/styles/notation';

export function NoteNotation({
  plan,
  color,
  accessibilityLabel,
  testID,
  readyTestID,
  restSymbol = false,
  centerVisualContent = false,
  showStaffLines = false,
  staffLineColor,
  onReady,
}: {
  plan: NoteNotationPlan;
  color: string;
  accessibilityLabel?: string;
  testID?: string;
  readyTestID?: string;
  restSymbol?: boolean;
  centerVisualContent?: boolean;
  showStaffLines?: boolean;
  staffLineColor?: string;
  onReady?: () => void;
}) {
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);
  const visualOffsetY = centerVisualContent && !restSymbol && !showStaffLines
    ? notationVisualCenterOffsetY(plan)
    : 0;

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={NoteNotationStyle1({ plan })}
    >
      {showStaffLines ? Array.from({ length: 5 }, (_, index) => (
        <View
          key={`staff-line-${index}`}
          pointerEvents="none"
          style={NoteNotationStyle2({ plan, index, staffLineColor })}
        />
      )) : null}
      <VexFlowNotationDOM
        plan={plan}
        color={color}
        restSymbol={restSymbol}
        onReady={handleReady}
        noteCenterY={restSymbol
          ? plan.height / 2
          : showStaffLines
          ? (plan.height - 24) / 2 + 24
          : plan.noteBaselineY ?? plan.height - 7}
        dom={{
          scrollEnabled: false,
          bounces: false,
          style: noteNotationDOMStyle(plan, visualOffsetY),
        }}
      />
      {ready && readyTestID ? (
        <View
          testID={readyTestID}
          pointerEvents="none"
          style={NoteNotationStyle3()}
        />
      ) : null}
      {plan.tupletLabels.map((label, index) => (
        <Text
          key={label.key}
          testID={testID ? `${testID}.tuplet.${index}` : undefined}
          style={NoteNotationStyle4({ label, visualOffsetY, color })}
        >
          {label.text}
        </Text>
      ))}
    </View>
  );
}
