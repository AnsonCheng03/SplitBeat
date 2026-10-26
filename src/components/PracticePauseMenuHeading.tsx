import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';
import { PracticePauseOverlaysStyle19, PracticePauseOverlaysStyle20, PracticePauseOverlaysStyle21 } from '@/styles/practice';

export function PracticePauseMenuHeading({ bpm, compact }: { bpm: number; compact: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={PracticePauseOverlaysStyle19({ compact })}>
      <Text style={PracticePauseOverlaysStyle20({ colors, compact })}>PAUSED</Text>
      <Text style={PracticePauseOverlaysStyle21({ colors, compact })}>{bpm} BPM</Text>
    </View>
  );
}
