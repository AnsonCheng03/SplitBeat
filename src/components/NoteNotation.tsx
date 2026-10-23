import { Text, View } from 'react-native';
import type { NoteNotationPlan } from '@/rhythm/noteNotation';
import VexFlowNotationDOM from '@/components/VexFlowNotationDOM';

export function NoteNotation({
  plan,
  color,
  accessibilityLabel,
  testID,
}: {
  plan: NoteNotationPlan;
  color: string;
  accessibilityLabel?: string;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={{ width: plan.width, height: plan.height, alignSelf: 'center', justifyContent: 'flex-end' }}
    >
      <VexFlowNotationDOM
        plan={plan}
        color={color}
        dom={{
          scrollEnabled: false,
          bounces: false,
          style: { position: 'absolute', left: 0, top: 0, width: plan.width, height: plan.height, backgroundColor: 'transparent' },
        }}
      />
      {plan.tupletLabels.map((label, index) => (
        <Text
          key={label.key}
          testID={testID ? `${testID}.tuplet.${index}` : undefined}
          style={{
            position: 'absolute',
            left: label.left,
            top: label.top,
            width: label.width,
            textAlign: 'center',
            color,
            fontSize: label.fontSize,
            fontWeight: '800',
            lineHeight: label.fontSize + 2,
          }}
        >
          {label.text}
        </Text>
      ))}
    </View>
  );
}
