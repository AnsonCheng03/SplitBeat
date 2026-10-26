export function AccuracyDisplayStyle1(): import('react-native').ViewStyle {
  return { alignItems: 'center' };
}

export function AccuracyDisplayStyle2({ isLeft, colors, compact }: { isLeft: boolean; colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: isLeft ? colors.left : colors.right, fontSize: compact ? 12 : 14, fontWeight: '700' };
}

export function AccuracyDisplayStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text };
}

export function AccuracyDisplayStyle4({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: compact ? 5 : 10 };
}

export function AccuracyDisplayStyle5({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.left, fontSize: compact ? 12 : 14, fontWeight: '700' };
}

export function AccuracyDisplayStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text };
}

export function AccuracyDisplayStyle7({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.right, fontSize: compact ? 12 : 14, fontWeight: '700' };
}

export function AccuracyDisplayStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text };
}

export function rootNavigatorScreenOptions(colors: import('@/theme').ThemeColors) {
  return {
    headerShown: false as const,
    contentStyle: { backgroundColor: colors.background },
    animation: 'fade' as const,
  };
}

export function FullBleedSafeAreaStyle1({ backgroundColor }: { backgroundColor: string }): import('react-native').ViewStyle {
  return { flex: 1, backgroundColor };
}

export function FullBleedSafeAreaStyle2(): import('react-native').ViewStyle {
  return { flex: 1, backgroundColor: 'transparent' };
}

export function HardwareKeyboardInputStyle1(): import('react-native').TextStyle {
  return { position: 'absolute', left: 0, top: 0, width: 1, height: 1, opacity: 0 };
}

export function NotationPreloaderStyle1({ plan }: { plan: import("@/rhythm/noteNotation").NoteNotationPlan }): import('react-native').ViewStyle {
  return { position: 'absolute', left: 0, top: 0, width: plan.width, height: plan.height, opacity: 0 };
}

export function SessionEndingOverlayStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background };
}

export function SessionEndingOverlayStyle2({ opacity, translateY, scale }: { opacity: import("react-native").Animated.Value; translateY: import("react-native").Animated.AnimatedInterpolation<string | number>; scale: import("react-native").Animated.AnimatedInterpolation<string | number> }): import('react-native').ViewStyle {
  return { alignItems: 'center', opacity, transform: [{ translateY }, { scale }] };
}

export function SessionEndingOverlayStyle3(): import('react-native').ViewStyle {
  return { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: 22 };
}

export function SessionEndingOverlayStyle4({ colors, haloScale }: { colors: import('@/theme').ThemeColors; haloScale: import("react-native").Animated.Value }): import('react-native').ViewStyle {
  return { position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: colors.accent, opacity: 0.35, transform: [{ scale: haloScale }] };
}

export function SessionEndingOverlayStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent };
}

export function SessionEndingOverlayStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 34, lineHeight: 40, fontWeight: '900' };
}

export function SessionEndingOverlayStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 2.2, textAlign: 'center' };
}

export function SessionEndingOverlayStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 48, lineHeight: 58, fontWeight: '900', fontVariant: ['tabular-nums'], marginTop: 7 };
}

export function SessionEndingOverlayStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.3, marginTop: 3 };
}

export function SessionEndingOverlayStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 12 };
}

export function SessionEndingOverlayStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { position: 'absolute', bottom: 30, width: 170, height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.line };
}

export function SessionEndingOverlayStyle12({ progressWidth, colors }: { progressWidth: import("react-native").Animated.AnimatedInterpolation<string | number>; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: progressWidth, height: '100%', backgroundColor: colors.accent };
}
