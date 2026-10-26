import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import type { Hand, TrainingMode } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';
import {
  AccuracyDisplayStyle1,
  AccuracyDisplayStyle2,
  AccuracyDisplayStyle3,
  AccuracyDisplayStyle4,
  AccuracyDisplayStyle5,
  AccuracyDisplayStyle6,
  AccuracyDisplayStyle7,
  AccuracyDisplayStyle8
} from '@/styles/shared';

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
      <View style={AccuracyDisplayStyle1()}>
        <Text style={AccuracyDisplayStyle2({ isLeft, colors, compact })}>
          {isLeft ? 'L' : 'R'} <Text style={AccuracyDisplayStyle3({ colors })}>{Math.round(isLeft ? left : right)}%</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={AccuracyDisplayStyle4({ compact })}>
      <Text style={AccuracyDisplayStyle5({ colors, compact })}>
        L <Text style={AccuracyDisplayStyle6({ colors })}>{Math.round(left)}%</Text>
      </Text>
      <Text style={AccuracyDisplayStyle7({ colors, compact })}>
        R <Text style={AccuracyDisplayStyle8({ colors })}>{Math.round(right)}%</Text>
      </Text>
    </View>
  );
}
