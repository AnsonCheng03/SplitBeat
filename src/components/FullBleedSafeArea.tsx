import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

export function FullBleedSafeArea({
  testID,
  backgroundColor,
  contentStyle,
  underlay,
  children,
}: {
  testID?: string;
  backgroundColor: string;
  contentStyle?: StyleProp<ViewStyle>;
  underlay?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={{ flex: 1, backgroundColor }}>
      {underlay}
      <SafeAreaView testID={testID} style={[{ flex: 1, backgroundColor: 'transparent' }, contentStyle]}>
        {children}
      </SafeAreaView>
    </View>
  );
}
