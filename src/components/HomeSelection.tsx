import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useTheme } from '@/theme/ThemeProvider';
import {
  HomeSelectionStyle1,
  HomeSelectionStyle2,
  HomeSelectionStyle3,
  HomeSelectionStyle4,
  HomeSelectionStyle5,
  HomeSelectionStyle6,
  HomeSelectionStyle7,
  HomeSelectionStyle8,
  HomeSelectionStyle9
} from '@/styles/home';

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
      style={({ pressed }) => (HomeSelectionStyle1({ pressed, colors }))}
    >
      <Text style={HomeSelectionStyle2({ color })}>{label}</Text>
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
      style={({ pressed }) => (HomeSelectionStyle3({ selected, colors, selectedColor, pressed }))}
    >
      <ModeMark mode={mode} />
      <Text style={HomeSelectionStyle4({ selected, selectedColor, colors })}>
        {title}
      </Text>
    </Pressable>
  );
}

function ModeMark({ mode }: { mode: 'two-hand' | 'single-hand' }) {
  const { colors } = useTheme();
  if (mode === 'single-hand') {
    return (
      <View style={HomeSelectionStyle5()}>
        <View style={HomeSelectionStyle6({ colors })} />
      </View>
    );
  }

  return (
    <View style={HomeSelectionStyle7()}>
      <View style={HomeSelectionStyle8({ colors })} />
      <View style={HomeSelectionStyle9({ colors })} />
    </View>
  );
}
