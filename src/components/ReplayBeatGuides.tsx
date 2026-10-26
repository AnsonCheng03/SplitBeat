import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

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
    <View pointerEvents="none" style={{ position: 'absolute', left: anchorStartX, width: anchorWidth, top: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
      {Array.from({ length: beatsPerBar + 1 }, (_, beat) => (
        <View key={beat} style={{ width: 1, height: '100%', backgroundColor: colors.line, opacity: beat === 0 || beat === beatsPerBar ? 0.7 : 0.38 }} />
      ))}
    </View>
  );
}
