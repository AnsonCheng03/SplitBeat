import { Text, View } from 'react-native';
import { colors } from '@/theme';

interface MetronomeIndicatorProps {
  beatInBar: number;
  beatsPerBar: number;
  isRunning: boolean;
  isRest?: boolean;
  compact?: boolean;
}

export function MetronomeIndicator({
  beatInBar,
  beatsPerBar,
  isRunning,
  isRest = false,
  compact = false,
}: MetronomeIndicatorProps) {
  return (
    <View style={{ alignItems: 'center', gap: compact ? 6 : 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 10 : 13 }}>
        {Array.from({ length: beatsPerBar }, (_, beat) => {
          const active = isRunning && beat === beatInBar;
          return (
            <View
              key={beat}
              style={{
                width: active ? (compact ? 15 : 18) : compact ? 9 : 11,
                height: active ? (compact ? 15 : 18) : compact ? 9 : 11,
                borderRadius: 99,
                backgroundColor: active ? (beat === 0 ? colors.accent : colors.text) : colors.dim,
                opacity: active ? 1 : 0.6,
              }}
            />
          );
        })}
      </View>
      <Text testID={isRest ? 'practice.restBeat' : undefined} style={{ color: isRest ? colors.accent : colors.muted, fontSize: compact ? 10 : 11, letterSpacing: 1.4, fontWeight: isRest ? '900' : '500' }}>
        {isRest ? 'REST' : isRunning ? 'BEAT' : 'GET READY'}
      </Text>
    </View>
  );
}
