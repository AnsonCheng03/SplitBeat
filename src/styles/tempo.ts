import type { ThemeColors } from '@/theme';
import type { TextStyle, ViewStyle } from 'react-native';

export function tapTempoCounterStyle1({ colors, compact }: { colors: ThemeColors; compact: boolean }): ViewStyle {
  return {
    width: compact ? 62 : 88,
    minHeight: compact ? 34 : 42,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: compact ? 4 : 5,
    paddingHorizontal: compact ? 8 : 10,
    borderRadius: compact ? 9 : 11,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.line,
  };
}

export function tapTempoCounterStyle2({ colors, compact }: { colors: ThemeColors; compact: boolean }): TextStyle {
  return {
    color: colors.text,
    fontSize: compact ? 16 : 30,
    lineHeight: compact ? 20 : 34,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  };
}

export function tapTempoCounterStyle3({ colors, compact }: { colors: ThemeColors; compact: boolean }): TextStyle {
  return {
    color: colors.muted,
    fontSize: compact ? 9 : 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  };
}

export function tapTempoHintStyle({ colors, compact }: { colors: ThemeColors; compact: boolean }): TextStyle {
  return {
    color: colors.dim,
    fontSize: compact ? 8 : 10,
    lineHeight: compact ? 11 : 14,
    marginTop: compact ? 4 : 7,
  };
}
