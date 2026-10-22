import { Text, View } from 'react-native';
import { SUBDIVISION_COUNTS, SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import type { Subdivision } from '@/types/rhythm';

interface RhythmSymbolProps {
  subdivision: Subdivision;
  color: string;
  compact?: boolean;
}

function beamGroupSize(count: number, beamIndex: number): number {
  if (beamIndex === 0 || count === 4 || count === 2) return count;
  return Math.max(2, count / 2 ** beamIndex);
}

export function RhythmSymbol({ subdivision, color, compact = false }: RhythmSymbolProps) {
  const count = SUBDIVISION_COUNTS[subdivision];
  const noteSlotWidth = count >= 16 ? (compact ? 8 : 10) : count >= 8 ? (compact ? 11 : 13) : compact ? 19 : 24;
  const glyphWidth = count * noteSlotWidth;
  const headSize = count >= 8 ? (compact ? 8 : 10) : compact ? 15 : 18;
  const stemHeight = compact ? 31 : 39;
  const stemWidth = count >= 8 ? 1.5 : 2;
  const beamHeight = count >= 8 ? (compact ? 2 : 2.5) : compact ? 4 : 5;
  const beamGap = beamHeight + (compact ? 2 : 3);
  const beamCount = subdivision === 'triplet' ? 1 : Math.log2(count);
  const beamSegments = Array.from({ length: beamCount }, (_, beamIndex) => {
    const groupSize = beamGroupSize(count, beamIndex);
    return Array.from({ length: Math.ceil(count / groupSize) }, (_, groupIndex) => {
      const firstNote = groupIndex * groupSize;
      const lastNote = Math.min(count, firstNote + groupSize) - 1;
      return {
        key: `${beamIndex}:${groupIndex}`,
        left: firstNote * noteSlotWidth + noteSlotWidth / 2,
        width: (lastNote - firstNote) * noteSlotWidth,
        top: beamIndex * beamGap,
      };
    });
  }).flat();

  return (
    <View
      accessibilityLabel={SUBDIVISION_LABELS[subdivision]}
      style={{ width: glyphWidth + noteSlotWidth, height: compact ? 56 : 68, alignItems: 'center', justifyContent: 'flex-end' }}
    >
      <View style={{ width: glyphWidth, height: stemHeight + 14, justifyContent: 'flex-end' }}>
        <View
          style={{
            height: stemHeight + 8,
            flexDirection: 'row',
            alignItems: 'flex-end',
          }}
        >
          {Array.from({ length: count }, (_, index) => (
            <View key={index} style={{ width: noteSlotWidth, height: stemHeight + 8 }}>
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: (noteSlotWidth - headSize) / 2,
                  width: headSize,
                  height: count >= 8 ? headSize * 0.65 : compact ? 9 : 11,
                  borderRadius: 20,
                  backgroundColor: color,
                  transform: [{ rotate: '-20deg' }],
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  bottom: count >= 8 ? 4 : compact ? 5 : 6,
                  left: noteSlotWidth / 2,
                  width: stemWidth,
                  height: stemHeight,
                  backgroundColor: color,
                  borderTopRightRadius: 2,
                }}
              />
            </View>
          ))}
        </View>
        {beamSegments.map((beam) => (
          <View
            key={beam.key}
            style={{
              position: 'absolute',
              top: beam.top,
              left: beam.left,
              width: Math.max(beamHeight, beam.width),
              height: beamHeight,
              borderRadius: 3,
              backgroundColor: color,
            }}
          />
        ))}
      </View>
      {subdivision === 'triplet' && (
        <Text style={{ color, position: 'absolute', top: -2, fontSize: compact ? 13 : 15, fontWeight: '800' }}>
          3
        </Text>
      )}
    </View>
  );
}
