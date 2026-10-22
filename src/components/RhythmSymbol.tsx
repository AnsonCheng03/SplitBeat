import { Text, View } from 'react-native';
import { SUBDIVISION_COUNTS, SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import type { Subdivision } from '@/types/rhythm';

interface RhythmSymbolProps {
  subdivision: Subdivision;
  color: string;
  compact?: boolean;
}

export function RhythmSymbol({ subdivision, color, compact = false }: RhythmSymbolProps) {
  const count = SUBDIVISION_COUNTS[subdivision];
  const width = compact ? 74 : 96;
  const headSize = compact ? 15 : 18;
  const stemHeight = compact ? 32 : 40;
  const glyphWidth = count * (compact ? 19 : 24);

  return (
    <View
      accessibilityLabel={SUBDIVISION_LABELS[subdivision]}
      style={{ width, height: compact ? 56 : 68, alignItems: 'center', justifyContent: 'flex-end' }}
    >
      <View style={{ width: glyphWidth, height: stemHeight + 14, justifyContent: 'flex-end' }}>
        <View
          style={{
            height: stemHeight + 8,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingHorizontal: 2,
          }}
        >
          {Array.from({ length: count }, (_, index) => (
            <View key={index} style={{ width: compact ? 18 : 22, height: stemHeight + 8 }}>
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: headSize,
                  height: compact ? 9 : 11,
                  borderRadius: 20,
                  backgroundColor: color,
                  transform: [{ rotate: '-20deg' }],
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  bottom: compact ? 5 : 6,
                  left: compact ? 12 : 14,
                  width: 2,
                  height: stemHeight,
                  backgroundColor: color,
                  borderTopRightRadius: 2,
                }}
              />
            </View>
          ))}
        </View>
        {count > 1 && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 15,
              right: 1,
              height: compact ? 4 : 5,
              borderRadius: 4,
              backgroundColor: color,
            }}
          />
        )}
        {count === 4 && (
          <View
            style={{
              position: 'absolute',
              top: compact ? 7 : 9,
              left: 15,
              right: 1,
              height: compact ? 4 : 5,
              borderRadius: 4,
              backgroundColor: color,
            }}
          />
        )}
      </View>
      {subdivision === 'triplet' && (
        <Text style={{ color, position: 'absolute', top: -2, fontSize: compact ? 13 : 15, fontWeight: '800' }}>
          3
        </Text>
      )}
    </View>
  );
}
