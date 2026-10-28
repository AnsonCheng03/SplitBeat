export function learnSongLessonCardStyle1(): import('react-native').ViewStyle {
  return { marginTop: 12, gap: 6 };
}

export function learnSongLessonCardStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 };
}

export function learnSongLessonCardStyle3({ colors, pressed }: { colors: import('@/theme').ThemeColors; pressed: boolean }): import('react-native').ViewStyle {
  return { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.surfaceRaised : colors.surface };
}

export function learnSongLessonCardStyle4(): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 0 };
}

export function learnSongLessonCardStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 12, fontWeight: '900' };
}

export function learnSongLessonCardStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 };
}

export function learnSongLessonCardStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 10, fontWeight: '900' };
}

export function learnSongsLinkStyle({ colors, pressed }: { colors: import('@/theme').ThemeColors; pressed: boolean }): import('react-native').ViewStyle {
  return { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: 11, marginTop: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.surfaceRaised : colors.surface };
}

export function learnSongsLinkTextStyle({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 };
}

export function learnSongLibraryStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, backgroundColor: colors.background };
}

export function learnSongLibraryStyle2(): import('react-native').ViewStyle {
  return { flexGrow: 1, width: '100%', alignSelf: 'center', maxWidth: 1320, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 30 };
}

export function learnSongLibraryStyle3(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 };
}

export function learnSongLibraryStyle4(): import('react-native').ViewStyle {
  return { minHeight: 44, justifyContent: 'center' };
}

export function learnSongLibraryStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 };
}

export function learnSongLibraryStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 };
}

export function learnSongLibraryStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.7, marginTop: 4 };
}

export function learnSongLibraryStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5, maxWidth: 760 };
}

export function learnSongLibraryStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10, lineHeight: 15, marginTop: 7, marginBottom: 18 };
}

export function learnSongLibraryStyle10(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', gap: 10 };
}

export function learnSongLibraryStyle11({ cardBasis, colors, pressed, selected }: { cardBasis: '48%' | '100%'; colors: import('@/theme').ThemeColors; pressed: boolean; selected: boolean }): import('react-native').ViewStyle {
  return { flexGrow: 1, flexBasis: cardBasis, maxWidth: cardBasis, minWidth: 240, minHeight: 126, justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 15, borderWidth: selected ? 1.5 : 1, borderColor: selected ? colors.accent : colors.line, backgroundColor: pressed || selected ? colors.surfaceRaised : colors.surface };
}

export function learnSongLibraryStyle12(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 };
}

export function learnSongLibraryStyle13({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { flex: 1, color: colors.text, fontSize: 14, fontWeight: '900' };
}

export function learnSongLibraryStyle14({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 };
}

export function learnSongLibraryStyle15({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 6 };
}

export function learnSongLibraryStyle16({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10, marginTop: 7 };
}

export function learnSongLibraryStyle17({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 35, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 12, marginTop: 9, borderRadius: 9, backgroundColor: colors.left };
}

export function learnSongLibraryStyle18({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 };
}
