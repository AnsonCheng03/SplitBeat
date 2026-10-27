import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { ModeLoadingScreenStyle1, ModeLoadingScreenStyle2, ModeLoadingScreenStyle3, ModeLoadingScreenStyle4 } from '@/styles/exercise';

export function ModeLoadingScreen({ testID, title, detail }: { testID: string; title: string; detail: string }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      testID={testID}
      pointerEvents="auto"
      onStartShouldSetResponder={() => true}
      accessibilityState={{ busy: true }}
      style={ModeLoadingScreenStyle1({ colors })}
    >
      <View style={ModeLoadingScreenStyle2()}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text accessibilityLiveRegion="polite" style={ModeLoadingScreenStyle3({ colors })}>{title}</Text>
        <Text style={ModeLoadingScreenStyle4({ colors })}>{detail}</Text>
      </View>
    </SafeAreaView>
  );
}
