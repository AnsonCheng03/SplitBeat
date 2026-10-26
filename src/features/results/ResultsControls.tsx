import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ResultsControlsStyle1,
  ResultsControlsStyle2,
  ResultsControlsStyle3,
  ResultsControlsStyle4,
  ResultsControlsStyle5,
  ResultsControlsStyle6,
  ResultsControlsStyle7,
  ResultsControlsStyle8,
  ResultsControlsStyle9,
  ResultsControlsStyle10,
  ResultsControlsStyle11
} from '@/styles/results';

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
    <View style={ResultsControlsStyle1({ colors })}>
      <Text style={ResultsControlsStyle2({ colors })}>{label}</Text>
      <Text style={ResultsControlsStyle3({ accent, colors })}>{value}</Text>
      {detail ? <Text style={ResultsControlsStyle4({ colors })}>{detail}</Text> : null}
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
      style={({ pressed }) => (ResultsControlsStyle5({ pressed, colors }))}
    >
      <Text style={ResultsControlsStyle6({ colors })}>{title}</Text>
      <Text style={ResultsControlsStyle7({ colors })}>
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
        style={({ pressed }) => (ResultsControlsStyle8({ pressed, colors }))}
      >
        <Text style={ResultsControlsStyle9({ color })}>{label}</Text>
        <Text accessibilityElementsHidden style={ResultsControlsStyle10({ color })}>›</Text>
      </Pressable>
      {!last ? <View style={ResultsControlsStyle11({ colors })} /> : null}
    </View>
  );
}
