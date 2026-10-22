import { Text, View } from 'react-native';
import { createNoteNotationPlan, type NoteGlyphShape, type NoteNotationSize } from '@/rhythm/noteNotation';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import type { Subdivision } from '@/types/rhythm';

interface RhythmSymbolProps {
  subdivision: Subdivision;
  color: string;
  compact?: boolean;
  mini?: boolean;
}

function NoteGlyph({ shape, color, slotWidth, height }: {
  shape: NoteGlyphShape;
  color: string;
  slotWidth: number;
  height: number;
}) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: shape.left, top: 0, width: slotWidth, height }}>
      <View
        style={{
          position: 'absolute',
          left: shape.stemLeft,
          top: shape.stemTop,
          width: shape.stemWidth,
          height: shape.stemHeight,
          borderTopLeftRadius: shape.stemWidth / 2,
          borderTopRightRadius: shape.stemWidth / 2,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: shape.headLeft,
          top: shape.headTop,
          width: shape.headWidth,
          height: shape.headHeight,
          borderRadius: shape.headHeight,
          backgroundColor: color,
          transform: [{ rotate: '-24deg' }],
        }}
      />
    </View>
  );
}

function notationSize(compact: boolean, mini: boolean): NoteNotationSize {
  if (mini) return 'mini';
  return compact ? 'compact' : 'full';
}

export function RhythmSymbol({ subdivision, color, compact = false, mini = false }: RhythmSymbolProps) {
  const plan = createNoteNotationPlan(subdivision, notationSize(compact, mini));
  const slotWidth = plan.width / plan.notes.length;

  return (
    <View
      accessibilityLabel={SUBDIVISION_LABELS[subdivision]}
      style={{ width: plan.width, height: plan.height, alignSelf: 'center', justifyContent: 'flex-end' }}
    >
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
        <NoteGlyph key={note.key} shape={note} color={color} slotWidth={slotWidth} height={plan.height} />
      ))}
      {plan.tripletLabel ? (
        <Text
          style={{
            position: 'absolute',
            top: plan.tripletLabel.top,
            width: '100%',
            textAlign: 'center',
            color,
            fontSize: plan.tripletLabel.fontSize,
            fontWeight: '800',
            lineHeight: plan.tripletLabel.fontSize + 2,
          }}
        >
          3
        </Text>
      ) : null}
    </View>
  );
}
