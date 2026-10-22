import { Text, View } from 'react-native';
import type { NoteNotationPlan } from '@/rhythm/noteNotation';

export function NoteNotation({
  plan,
  color,
  staffLineColor,
  accessibilityLabel,
  testID,
}: {
  plan: NoteNotationPlan;
  color: string;
  staffLineColor?: string;
  accessibilityLabel?: string;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={{ width: plan.width, height: plan.height, alignSelf: 'center', justifyContent: 'flex-end' }}
    >
      {plan.staffLineY !== null && staffLineColor ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: plan.staffLineY, height: 1, backgroundColor: staffLineColor }}
        />
      ) : null}
      {plan.beams.map((beam) => (
        <View
          key={beam.key}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: beam.left,
            top: beam.top,
            width: beam.width,
            height: beam.height,
            borderRadius: beam.height / 2,
            backgroundColor: color,
            transform: [{ rotate: `${beam.rotationDegrees}deg` }],
          }}
        />
      ))}
      {plan.notes.map((note) => (
        <View key={note.key} pointerEvents="none" style={{ position: 'absolute', left: note.left, top: 0, width: note.headWidth, height: plan.height }}>
          <View
            style={{
              position: 'absolute',
              left: note.stemLeft,
              top: note.stemTop,
              width: note.stemWidth,
              height: note.stemHeight,
              borderTopLeftRadius: note.stemWidth / 2,
              borderTopRightRadius: note.stemWidth / 2,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: note.headTop,
              width: note.headWidth,
              height: note.headHeight,
              borderRadius: note.headHeight,
              backgroundColor: color,
              transform: [{ rotate: '-24deg' }],
            }}
          />
        </View>
      ))}
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
