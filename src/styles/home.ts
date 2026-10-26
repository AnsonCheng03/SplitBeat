export function indexStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, backgroundColor: colors.background };
}

export function indexStyle2(): import('react-native').ViewStyle {
  return { flex: 1, width: '100%', maxWidth: 1080, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 10 };
}

export function indexStyle3(): import('react-native').ViewStyle {
  return { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 };
}

export function indexStyle4(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 0, flexShrink: 1 };
}

export function indexStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 8, height: 8, borderRadius: 8, backgroundColor: colors.left };
}

export function indexStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 8, height: 8, borderRadius: 8, backgroundColor: colors.right };
}

export function indexStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginLeft: 4 };
}

export function indexStyle8(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 7 };
}

export function indexStyle9(): import('react-native').ViewStyle {
  return { flex: 1, width: '100%', maxWidth: 820, alignSelf: 'center', justifyContent: 'center', paddingVertical: 16 };
}

export function indexStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.6 };
}

export function indexStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 14, marginTop: 5 };
}

export function indexStyle12(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 10, marginTop: 20, maxWidth: 520 };
}

export function indexStyle13(): import('react-native').ViewStyle {
  return { width: '100%', maxWidth: 960, alignSelf: 'center', flexDirection: 'row', alignItems: 'stretch', gap: 10, paddingBottom: 2 };
}

export function indexStyle14({ pressed, colors }: { pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
              width: 220,
              minHeight: 82,
              paddingHorizontal: 15,
              paddingVertical: 12,
              justifyContent: 'center',
              borderRadius: 17,
              backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              opacity: pressed ? 0.86 : 1,
            };
}

export function indexStyle15({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 };
}

export function indexStyle16(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 5 };
}

export function indexStyle17({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { flex: 1, color: colors.accent, fontSize: 13, fontWeight: '900' };
}

export function indexStyle18({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 18, fontWeight: '700' };
}

export function indexStyle19(): import('react-native').ViewStyle {
  return { flex: 1 };
}

export function HomeActivityPickerStyle1(): import('react-native').ViewStyle {
  return { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.68)' };
}

export function HomeActivityPickerStyle2(): import('react-native').ViewStyle {
  return { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 };
}

export function HomeActivityPickerStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: '100%', maxWidth: 560, padding: 22, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function HomeActivityPickerStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 22, fontWeight: '900' };
}

export function HomeActivityPickerStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 13, marginTop: 5, marginBottom: 16 };
}

export function HomeActivityPickerStyle6(): import('react-native').ViewStyle {
  return { gap: 8 };
}

export function HomeActivityPickerStyle7({ isSelected, colors, pressed }: { isSelected: boolean; colors: import('@/theme').ThemeColors; pressed: boolean }): import('react-native').ViewStyle {
  return { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 13, backgroundColor: isSelected ? colors.surfaceRaised : colors.background, borderWidth: 1, borderColor: isSelected ? colors.accent : colors.line, opacity: pressed ? 0.82 : 1 };
}

export function HomeActivityPickerStyle8(): import('react-native').ViewStyle {
  return { flex: 1 };
}

export function HomeActivityPickerStyle9({ isSelected, colors }: { isSelected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: isSelected ? colors.accent : colors.text, fontSize: 14, fontWeight: '800' };
}

export function HomeActivityPickerStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, marginTop: 2 };
}

export function HomeActivityPickerStyle11({ isSelected, colors }: { isSelected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: isSelected ? colors.accent : colors.dim, fontSize: 16, fontWeight: '900' };
}

export function HomeActivityPickerStyle12({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 20, elevation: 20, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: colors.background };
}

export function HomeActivityPickerStyle13({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 17, fontWeight: '800' };
}

export function HomeSelectionStyle1({ pressed, colors }: { pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
        minHeight: 36,
        paddingHorizontal: 13,
        justifyContent: 'center',
        borderRadius: 11,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
      };
}

export function HomeSelectionStyle2({ color }: { color: string }): import('react-native').TextStyle {
  return { color, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 };
}

export function HomeSelectionStyle3({ selected, colors, selectedColor, pressed }: { selected: boolean; colors: import('@/theme').ThemeColors; selectedColor: string; pressed: boolean }): import('react-native').ViewStyle {
  return {
        flex: 1,
        minHeight: 58,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 14,
        backgroundColor: selected ? colors.surfaceRaised : colors.surface,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? selectedColor : colors.line,
        opacity: pressed ? 0.82 : 1,
      };
}

export function HomeSelectionStyle4({ selected, selectedColor, colors }: { selected: boolean; selectedColor: string; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: selected ? selectedColor : colors.text, fontSize: 15, fontWeight: '900', letterSpacing: -0.2 };
}

export function HomeSelectionStyle5(): import('react-native').ViewStyle {
  return { width: 25, height: 25, alignItems: 'center', justifyContent: 'center' };
}

export function HomeSelectionStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 12, height: 12, borderRadius: 7, backgroundColor: colors.accent };
}

export function HomeSelectionStyle7(): import('react-native').ViewStyle {
  return { width: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' };
}

export function HomeSelectionStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 10, height: 10, borderRadius: 6, backgroundColor: colors.left };
}

export function HomeSelectionStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 10, height: 10, borderRadius: 6, backgroundColor: colors.right };
}
