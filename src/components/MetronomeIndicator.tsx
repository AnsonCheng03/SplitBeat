import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';

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
      <Text
        raw
        testID={isRest ? 'practice.restBeat' : 'practice.beatPosition'}
        accessibilityLabel={isRunning ? positionLabel : undefined}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={{ color: isRest || isPaused ? colors.accent : colors.muted, fontSize: compact ? 10 : 11, letterSpacing: compact ? 0.5 : 0.8, fontWeight: isRest || isPaused ? '900' : '700' }}
      >
        {positionLabel}
      </Text>
    </View>
  );
}
