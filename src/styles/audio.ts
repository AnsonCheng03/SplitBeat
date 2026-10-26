export function AudioStartButtonStyle1({ status, colors, buttonBackground, disabled, pressed }: { status: import("@/store/sessionStore").AudioPreparationStatus; colors: import('@/theme').ThemeColors; buttonBackground: string; disabled: boolean; pressed: boolean }): import('react-native').ViewStyle {
  return {
          width: '100%',
          minHeight: 82,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: status === 'ready' ? colors.left : status === 'error' ? colors.danger : colors.line,
          backgroundColor: buttonBackground,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 13,
          gap: 14,
          opacity: disabled ? 0.82 : pressed ? 0.84 : 1,
        };
}

export function AudioStartButtonStyle2(): import('react-native').ViewStyle {
  return { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' };
}

export function AudioStartButtonStyle3({ status, colors, foreground, ringColor, turn }: { status: import("@/store/sessionStore").AudioPreparationStatus; colors: import('@/theme').ThemeColors; foreground: string; ringColor: string; turn: import("react-native").Animated.AnimatedInterpolation<string | number> }): import('react-native').ViewStyle {
  return {
              position: 'absolute',
              width: 56,
              height: 56,
              borderRadius: 28,
              borderWidth: 2.5,
              borderColor: status === 'loading' ? colors.surfaceRaised : foreground,
              borderTopColor: status === 'loading' ? ringColor : undefined,
              borderRightColor: status === 'loading' ? ringColor : undefined,
              transform: status === 'loading' ? [{ rotate: turn }] : undefined,
            };
}

export function AudioStartButtonStyle4({ status, colors }: { status: import("@/store/sessionStore").AudioPreparationStatus; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: status === 'ready' ? colors.background : colors.surfaceRaised,
              alignItems: 'center',
              justifyContent: 'center',
            };
}

export function AudioStartButtonStyle5({ status, colors }: { status: import("@/store/sessionStore").AudioPreparationStatus; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
                marginLeft: 3,
                width: 0,
                height: 0,
                borderTopWidth: 8,
                borderBottomWidth: 8,
                borderLeftWidth: 12,
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                borderLeftColor: status === 'ready' ? colors.left : colors.text,
              };
}

export function AudioStartButtonStyle6(): import('react-native').ViewStyle {
  return { flex: 1, gap: 4 };
}

export function AudioStartButtonStyle7({ foreground }: { foreground: string }): import('react-native').TextStyle {
  return { color: foreground, fontSize: 16, fontWeight: '900', letterSpacing: 0.6 };
}

export function AudioStartButtonStyle8({ status, colors }: { status: import("@/store/sessionStore").AudioPreparationStatus; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: status === 'ready' ? '#18352C' : colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 };
}

export function AudioStartButtonStyle9({ foreground }: { foreground: string }): import('react-native').TextStyle {
  return { color: foreground, fontSize: 24, fontWeight: '500' };
}

export function AudioStartButtonStyle10({ disabled, pressed }: { disabled: boolean; pressed: boolean }): import('react-native').ViewStyle {
  return {
        width: 94,
        height: 94,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.78 : pressed ? 0.82 : 1,
      };
}

export function AudioStartButtonStyle11({ status, colors, ringColor, turn }: { status: import("@/store/sessionStore").AudioPreparationStatus; colors: import('@/theme').ThemeColors; ringColor: string; turn: import("react-native").Animated.AnimatedInterpolation<string | number> }): import('react-native').ViewStyle {
  return {
          position: 'absolute',
          width: 92,
          height: 92,
          borderRadius: 46,
          borderWidth: 3,
          borderColor: status === 'loading' ? colors.surfaceRaised : ringColor,
          borderTopColor: status === 'loading' ? ringColor : undefined,
          borderRightColor: status === 'loading' ? ringColor : undefined,
          transform: status === 'loading' ? [{ rotate: turn }] : undefined,
        };
}

export function AudioStartButtonStyle12({ disabled, colors }: { disabled: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: disabled ? colors.surfaceRaised : colors.left,
          alignItems: 'center',
          justifyContent: 'center',
        };
}

export function AudioStartButtonStyle13({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
            marginLeft: 5,
            width: 0,
            height: 0,
            borderTopWidth: 12,
            borderBottomWidth: 12,
            borderLeftWidth: 18,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: colors.background,
          };
}
