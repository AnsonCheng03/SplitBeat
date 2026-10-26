import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { ReplayStatusBadgeStyle1, ReplayStatusBadgeStyle2 } from '@/styles/results';

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
      style={[ReplayStatusBadgeStyle1({ size, status, colors }), style]}
    >
      <Text accessible={false} style={ReplayStatusBadgeStyle2({ colors, size })}>
        {status === 'correct' ? '✓' : '×'}
      </Text>
    </View>
  );
}
