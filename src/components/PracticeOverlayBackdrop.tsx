import type { ReactNode, RefObject } from 'react';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type View as NativeView, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

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
  const { mode } = useTheme();
  const light = mode === 'light';

  return (
    <View testID={testID} style={StyleSheet.absoluteFill}>
      <BlurView
        pointerEvents="none"
        blurTarget={blurTarget}
        blurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : 'none'}
        tint={light ? 'light' : 'dark'}
        intensity={48}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: light ? 'rgba(248, 248, 245, 0.56)' : 'rgba(7, 10, 14, 0.32)' }]}
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
