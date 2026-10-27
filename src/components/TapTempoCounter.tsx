import { Pressable } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { tapTempoCounterStyle1, tapTempoCounterStyle2, tapTempoCounterStyle3 } from '@/styles/tempo';

export function TapTempoCounter({
  bpm,
  onTap,
  testID,
  compact = false,
}: {
  bpm: number;
  onTap: () => void;
  testID: string;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t('Tap tempo')}
      accessibilityValue={{ text: `${bpm} BPM` }}
      accessibilityHint={t('Tap the BPM number in time with the beat. Recent taps are averaged over five seconds.')}
      onPress={onTap}
      style={tapTempoCounterStyle1({ colors, compact })}
    >
      <Text style={tapTempoCounterStyle2({ colors, compact })}>{bpm}</Text>
      <Text style={tapTempoCounterStyle3({ colors, compact })}>BPM</Text>
    </Pressable>
  );
}
