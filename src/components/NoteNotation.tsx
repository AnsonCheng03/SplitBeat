import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import type { NoteNotationPlan } from '@/rhythm/noteNotation';
import { NativeRhythmGlyphs } from '@/components/NativeRhythmGlyphs';
import VexFlowNotationDOM from '@/components/VexFlowNotationDOM';

export function NoteNotation({
  plan,
  color,
  accessibilityLabel,
  testID,
  showStaffLines = false,
  staffLineColor,
  useNativeGlyphs = false,
}: {
  plan: NoteNotationPlan;
  color: string;
  accessibilityLabel?: string;
  testID?: string;
  showStaffLines?: boolean;
  staffLineColor?: string;
  useNativeGlyphs?: boolean;
}) {
  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={{ width: plan.width, height: plan.height, alignSelf: 'center', justifyContent: 'flex-end', position: 'relative' }}
    >
      {showStaffLines ? Array.from({ length: 5 }, (_, index) => (
        <View
          key={`staff-line-${index}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: (plan.height - 24) / 2 + index * 6,
            height: 1,
            backgroundColor: staffLineColor ?? '#53616F',
            opacity: 0.85,
          }}
        />
      )) : null}
      {useNativeGlyphs ? (
        <NativeRhythmGlyphs plan={plan} color={color} testID={testID} />
      ) : (
        <VexFlowNotationDOM
          plan={plan}
          color={color}
          dom={{
            scrollEnabled: false,
            bounces: false,
            style: { position: 'absolute', left: 0, top: 0, width: plan.width, height: plan.height, backgroundColor: 'transparent' },
          }}
        />
      )}
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
