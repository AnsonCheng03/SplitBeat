export function RhythmMissionsStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, backgroundColor: colors.background };
}

export function RhythmMissionsStyle2(): import('react-native').ViewStyle {
  return { flexGrow: 1, alignSelf: 'center', width: '100%', maxWidth: 1280, paddingHorizontal: 22, paddingVertical: 16, gap: 13 };
}

export function RhythmMissionsStyle3(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 };
}

export function RhythmMissionsStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { padding: 15, gap: 4, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function RhythmMissionsStyle5(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 12, flexWrap: 'wrap' };
}

export function RhythmMissionsStyle6(): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 220, gap: 7 };
}

export function RhythmMissionsStyle7(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', gap: 7 };
}

export function RhythmMissionsStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { padding: 13, gap: 8, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function RhythmMissionsStyle9(): import('react-native').ViewStyle {
  return { padding: 12, borderRadius: 14, backgroundColor: 'transparent', gap: 10 };
}

export function RhythmMissionsStyle10(): import('react-native').ViewStyle {
  return { gap: 5, marginBottom: 3 };
}

export function RhythmMissionsStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 16, borderRadius: 13, backgroundColor: colors.accent };
}

export function RhythmMissionsStyle12({ color, large }: { color: string; large?: boolean }): import('react-native').TextStyle {
  return { color, fontSize: large ? 22 : 11, lineHeight: large ? 28 : 16, fontWeight: large ? '900' : '700' };
}

export function RhythmMissionPathStyle1(): import('react-native').ViewStyle {
  return { gap: 7 };
}

export function RhythmMissionPathStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 };
}

export function RhythmMissionPathStyle3(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 8, paddingVertical: 2 };
}

export function RhythmMissionPathStyle4({ selected, completed, unlocked, pressed, colors }: { selected: boolean; completed: boolean; unlocked: boolean; pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  const activeColor = completed ? colors.left : colors.accent;
  return { width: 142, minHeight: 50, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: selected ? `${activeColor}1A` : colors.surface, borderWidth: selected ? 1.5 : 1, borderColor: selected ? activeColor : colors.line, opacity: !unlocked ? 0.45 : pressed ? 0.72 : 1 };
}

export function RhythmMissionPathStyle5({ selected, completed, unlocked, colors }: { selected: boolean; completed: boolean; unlocked: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: completed ? colors.left : selected ? colors.accent : unlocked ? colors.text : colors.dim, fontSize: 10, lineHeight: 15, fontWeight: '800' };
}

export function RhythmMissionTapPadStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { padding: 14, gap: 8, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function RhythmMissionTapPadStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 };
}

export function RhythmMissionTapPadStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, lineHeight: 15 };
}

export function RhythmMissionTapPadStyle4({ active, disabled, pressed, colors }: { active: boolean; disabled: boolean; pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 88, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 12, backgroundColor: active ? colors.left : colors.accent, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 };
}

export function RhythmMissionTapPadStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 };
}

export function RhythmMissionTapPadStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 10, fontWeight: '700' };
}
