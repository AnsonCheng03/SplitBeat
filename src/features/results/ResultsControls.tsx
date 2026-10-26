import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';

export function ResultsScorePanel({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15 }}>
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>{label}</Text>
      <Text style={{ color: accent ?? colors.text, fontSize: 25, fontWeight: '900', marginTop: 7 }}>{value}</Text>
      {detail ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{detail}</Text> : null}
    </View>
  );
}

export function ResultsDisclosureHeader({
  title,
  expanded,
  onPress,
  testID,
}: {
  title: string;
  expanded: boolean;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t('{title}, {action} details', { title: t(title), action: t(expanded ? 'Hide' : 'Show') })}
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
        paddingHorizontal: 14,
        borderRadius: 13,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
      })}
    >
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', flex: 1 }}>{title}</Text>
      <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 }}>
        {expanded ? 'HIDE  −' : 'VIEW  +'}
      </Text>
    </Pressable>
  );
}

export function ResultsActionRow({
  testID,
  label,
  accessibilityLabel,
  color,
  onPress,
  last = false,
}: {
  testID: string;
  label: string;
  accessibilityLabel: string;
  color: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => ({
          minHeight: 58,
          paddingHorizontal: 17,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: pressed ? colors.surfaceRaised : 'transparent',
        })}
      >
        <Text style={{ color, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 }}>{label}</Text>
        <Text accessibilityElementsHidden style={{ color, fontSize: 23, lineHeight: 27, fontWeight: '500' }}>›</Text>
      </Pressable>
      {!last ? <View style={{ height: 1, marginHorizontal: 16, backgroundColor: colors.line }} /> : null}
    </View>
  );
}
