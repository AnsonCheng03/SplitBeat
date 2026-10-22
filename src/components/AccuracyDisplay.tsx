import { Text, View } from 'react-native';
import { colors } from '@/theme';

interface AccuracyDisplayProps {
  left: number;
  right: number;
  compact?: boolean;
}

export function AccuracyDisplay({ left, right, compact = false }: AccuracyDisplayProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: compact ? 5 : 10 }}>
      <Text style={{ color: colors.left, fontSize: compact ? 12 : 14, fontWeight: '700' }}>
        L <Text style={{ color: colors.text }}>{Math.round(left)}%</Text>
      </Text>
      <Text style={{ color: colors.right, fontSize: compact ? 12 : 14, fontWeight: '700' }}>
        R <Text style={{ color: colors.text }}>{Math.round(right)}%</Text>
      </Text>
    </View>
  );
}
