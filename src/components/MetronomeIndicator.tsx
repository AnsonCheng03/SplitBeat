import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { MetronomeIndicatorStyle1, MetronomeIndicatorStyle2, MetronomeIndicatorStyle3, MetronomeIndicatorStyle4 } from '@/styles/notation';

interface MetronomeIndicatorProps {
  beatInBar: number;
  beatsPerBar: number;
  isRunning: boolean;
  isRest?: boolean;
  isPaused?: boolean;
  compact?: boolean;
}

export function MetronomeIndicator({
  beatInBar,
  beatsPerBar,
  isRunning,
  isRest = false,
  isPaused = false,
  compact = false,
}: MetronomeIndicatorProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const positionLabel = isRest
    ? t('REST')
    : isPaused
      ? t('PAUSED')
      : isRunning
        ? t('Beat {beat} of {count}', { beat: beatInBar + 1, count: beatsPerBar })
        : t('GET READY');

  return (
    <View style={MetronomeIndicatorStyle1({ compact })}>
      <View style={MetronomeIndicatorStyle2({ compact })}>
        {Array.from({ length: beatsPerBar }, (_, beat) => {
          const active = isRunning && beat === beatInBar;
          return (
            <View
              key={beat}
              testID={`practice.beatDot.${beat + 1}`}
              style={MetronomeIndicatorStyle3({ active, compact, beat, colors })}
            />
          );
        })}
      </View>
      <Text
        raw
        testID={isRest ? 'practice.restBeat' : 'practice.beatPosition'}
        accessibilityLabel={isRunning ? positionLabel : undefined}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={MetronomeIndicatorStyle4({ isRest, isPaused, colors, compact })}
      >
        {positionLabel}
      </Text>
    </View>
  );
}
