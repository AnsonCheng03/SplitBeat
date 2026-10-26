import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';

export function HomeHeaderAction({
  testID,
  label,
  color,
  onPress,
  accessibilityLabel,
}: {
  testID: string;
  label: string;
  color: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        minHeight: 36,
        paddingHorizontal: 13,
        justifyContent: 'center',
        borderRadius: 11,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
      })}
    >
      <Text style={{ color, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>{label}</Text>
    </Pressable>
  );
}

export function HomeModeChoice({
  testID,
  mode,
  selected,
  title,
  onPress,
}: {
  testID: string;
  mode: 'two-hand' | 'single-hand';
  selected: boolean;
  title: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const selectedColor = mode === 'single-hand' ? colors.accent : colors.left;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 58,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 14,
        backgroundColor: selected ? colors.surfaceRaised : colors.surface,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? selectedColor : colors.line,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <ModeMark mode={mode} />
      <Text style={{ color: selected ? selectedColor : colors.text, fontSize: 15, fontWeight: '900', letterSpacing: -0.2 }}>
        {title}
      </Text>
    </Pressable>
  );
}

function ModeMark({ mode }: { mode: 'two-hand' | 'single-hand' }) {
  const { colors } = useTheme();
  if (mode === 'single-hand') {
    return (
      <View style={{ width: 25, height: 25, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 12, height: 12, borderRadius: 7, backgroundColor: colors.accent }} />
      </View>
    );
  }

  return (
    <View style={{ width: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ width: 10, height: 10, borderRadius: 6, backgroundColor: colors.left }} />
      <View style={{ width: 10, height: 10, borderRadius: 6, backgroundColor: colors.right }} />
    </View>
  );
}
