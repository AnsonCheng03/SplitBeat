import type { TextStyle, ViewStyle } from 'react-native';
import type { ThemeColors } from '@/theme';

export function SessionEndSettingsStyle1(): ViewStyle {
  return { gap: 14 };
}

export function SessionEndSettingsStyle2(): ViewStyle {
  return { gap: 9 };
}

export function SessionEndSettingsStyle3({ colors }: { colors: ThemeColors }): TextStyle {
  return { color: colors.muted, fontWeight: '800', fontSize: 11, letterSpacing: 1.1 };
}
