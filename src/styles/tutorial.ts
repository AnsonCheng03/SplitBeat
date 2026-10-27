export function appTutorialStyle1(): import('react-native').ViewStyle {
  return { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'rgba(5, 8, 14, 0.76)' };
}

export function appTutorialStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: '100%', maxWidth: 580, paddingHorizontal: 24, paddingVertical: 20, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function appTutorialStyle3(): import('react-native').ViewStyle {
  return { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' };
}

export function appTutorialStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.6 };
}

export function appTutorialStyle5({ pressed, colors, secondary = false }: { pressed: boolean; colors: import('@/theme').ThemeColors; secondary?: boolean }): import('react-native').ViewStyle {
  return { minWidth: 48, minHeight: 48, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: secondary ? 'transparent' : colors.accent, opacity: pressed ? 0.75 : 1 };
}

export function appTutorialStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 26, lineHeight: 28, fontWeight: '500' };
}

export function appTutorialStyle7(): import('react-native').ViewStyle {
  return { marginTop: 20, marginBottom: 22 };
}

export function appTutorialStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 };
}

export function appTutorialStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 25, lineHeight: 31, fontWeight: '900', letterSpacing: -0.4, marginTop: 10 };
}

export function appTutorialStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 8 };
}

export function appTutorialStyle11(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 7, marginBottom: 20 };
}

export function appTutorialStyle12({ colors, selected }: { colors: import('@/theme').ThemeColors; selected: boolean }): import('react-native').ViewStyle {
  return { height: 4, flex: selected ? 1.8 : 1, borderRadius: 3, backgroundColor: selected ? colors.accent : colors.line };
}

export function appTutorialStyle13(): import('react-native').ViewStyle {
  return { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 };
}

export function appTutorialStyle14({ colors, secondary = false }: { colors: import('@/theme').ThemeColors; secondary?: boolean }): import('react-native').TextStyle {
  return { color: secondary ? colors.muted : colors.background, fontSize: 13, fontWeight: '900', letterSpacing: 0.3 };
}

export function appTutorialStyle15(): import('react-native').ViewStyle {
  return { flex: 1 };
}
