import type { ReactNode, RefObject } from 'react';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type View as NativeView, type ViewStyle } from 'react-native';

export function PracticeOverlayBackdrop({
  testID,
  blurTarget,
  children,
  contentStyle,
}: {
  testID: string;
  blurTarget: RefObject<NativeView | null>;
  children: ReactNode;
  contentStyle?: ViewStyle;
}) {
  return (
    <View testID={testID} style={StyleSheet.absoluteFill}>
      <BlurView
        pointerEvents="none"
        blurTarget={blurTarget}
        blurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'}
        tint="dark"
        intensity={48}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(7, 10, 14, 0.24)' }]}
      />
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
