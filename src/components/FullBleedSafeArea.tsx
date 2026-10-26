import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { FullBleedSafeAreaStyle1, FullBleedSafeAreaStyle2 } from '@/styles/shared';

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
    <View style={FullBleedSafeAreaStyle1({ backgroundColor })}>
      {underlay}
      <SafeAreaView testID={testID} style={[FullBleedSafeAreaStyle2(), contentStyle]}>
        {children}
      </SafeAreaView>
    </View>
  );
}
