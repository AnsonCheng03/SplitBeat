import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';

export function ReplayStatusBadge({
  status,
  size,
  testID,
  accessibilityLabel,
  style,
}: {
  status: 'correct' | 'miss';
  size: number;
  testID?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const label = accessibilityLabel ?? t(status === 'correct' ? 'Correct' : 'Missed / extra');
  return (
    <View
      pointerEvents="none"
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={label}
      testID={testID}
      style={[{
        position: 'absolute',
        zIndex: 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: status === 'correct' ? colors.left : colors.danger,
        borderWidth: 1,
        borderColor: colors.background,
      }, style]}
    >
      <Text accessible={false} style={{ color: colors.background, fontSize: Math.max(7, size * 0.72), lineHeight: size, fontWeight: '900', textAlign: 'center' }}>
        {status === 'correct' ? '✓' : '×'}
      </Text>
    </View>
  );
}
