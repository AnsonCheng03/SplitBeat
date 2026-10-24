import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import type { Hand, TrainingMode } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';

interface AccuracyDisplayProps {
  left: number;
  right: number;
  trainingMode?: TrainingMode;
  singleHand?: Hand;
  compact?: boolean;
}

export function AccuracyDisplay({ left, right, trainingMode = 'two-hand', singleHand = 'left', compact = false }: AccuracyDisplayProps) {
  const { colors } = useTheme();
  if (trainingMode === 'single-hand') {
    const isLeft = singleHand === 'left';
    return (
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: isLeft ? colors.left : colors.right, fontSize: compact ? 12 : 14, fontWeight: '700' }}>
          {isLeft ? 'L' : 'R'} <Text style={{ color: colors.text }}>{Math.round(isLeft ? left : right)}%</Text>
        </Text>
      </View>
    );
  }

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
