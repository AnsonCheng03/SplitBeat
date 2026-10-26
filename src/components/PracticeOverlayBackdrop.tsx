import type { ReactNode, RefObject } from 'react';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type View as NativeView, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { PracticeOverlayBackdropStyle1, practiceOverlayContentStyle } from '@/styles/practice';

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
        style={[StyleSheet.absoluteFill, PracticeOverlayBackdropStyle1({ light })]}
      />
      <View style={[practiceOverlayContentStyle, contentStyle]}>
        {children}
      </View>
    </View>
  );
}
