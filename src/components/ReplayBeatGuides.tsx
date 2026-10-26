import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { ReplayBeatGuidesStyle1, ReplayBeatGuidesStyle2 } from '@/styles/results';

export function ReplayBeatGuides({
  beatsPerBar,
  anchorStartX,
  anchorWidth,
}: {
  beatsPerBar: number;
  anchorStartX: number;
  anchorWidth: number;
}) {
  const { colors } = useTheme();
  return (
    <View pointerEvents="none" style={ReplayBeatGuidesStyle1({ anchorStartX, anchorWidth })}>
      {Array.from({ length: beatsPerBar + 1 }, (_, beat) => (
        <View key={beat} style={ReplayBeatGuidesStyle2({ colors, beat, beatsPerBar })} />
      ))}
    </View>
  );
}
