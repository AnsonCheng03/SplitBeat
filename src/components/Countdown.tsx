
import { Text } from '@/i18n/LocalizedText';
import { colors } from '@/theme';

interface CountdownProps {
  value: number | 'START' | null;
  compact?: boolean;
}

export function Countdown({ value, compact = false }: CountdownProps) {
  if (value === null) return null;
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={{
        color: colors.accent,
        fontSize: value === 'START' ? (compact ? 19 : 22) : compact ? 29 : 34,
        fontWeight: '800',
        letterSpacing: value === 'START' ? 2 : 0,
        textAlign: 'center',
      }}
    >
      {value}
    </Text>
  );
}
