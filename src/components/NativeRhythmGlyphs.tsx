import { View } from 'react-native';
import type { NoteNotationPlan } from '@/rhythm/noteNotation';

/** Renders engraved rhythm geometry with native views where Expo DOM is unavailable. */
export function NativeRhythmGlyphs({
  plan,
  color,
  testID,
}: {
  plan: NoteNotationPlan;
  color: string;
  testID?: string;
}) {
  return (
    <>
      {plan.notes.map((note, index) => {
        const event = plan.events[index];
        const hasStem = (event?.durationQuarter ?? 0) < 4;
        if (!hasStem) return null;
        return (
          <View
            key={`${note.key}-stem`}
            style={{
              position: 'absolute',
              left: note.left + note.stemLeft,
              top: note.stemTop,
              width: note.stemWidth,
              height: note.stemHeight,
              backgroundColor: color,
              borderRadius: note.stemWidth,
              zIndex: 1,
            }}
          />
        );
      })}
      {plan.beams.map((beam) => (
        <View
          key={beam.key}
          style={{
            position: 'absolute',
            left: beam.left,
            top: beam.top,
            width: beam.width,
            height: beam.height,
            backgroundColor: color,
            borderRadius: beam.height,
            transform: [{ rotate: `${beam.rotationDegrees}deg` }],
          }}
        />
      ))}
      {plan.notes.map((note, index) => {
        const filled = (plan.events[index]?.durationQuarter ?? 0) < 2;
        return (
          <View
            key={`${note.key}-head`}
            testID={testID ? `${testID}.note.${index}` : undefined}
            style={{
              position: 'absolute',
              left: note.left,
              top: note.headTop,
              width: note.headWidth,
              height: note.headHeight,
              borderRadius: note.headHeight,
              backgroundColor: filled ? color : 'transparent',
              borderColor: color,
              borderWidth: filled ? 0 : Math.max(1, note.headWidth * 0.16),
              transform: [{ rotate: '-24deg' }],
              zIndex: 2,
            }}
          />
        );
      })}
    </>
  );
}
