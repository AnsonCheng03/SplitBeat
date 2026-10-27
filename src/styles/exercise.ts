export function exerciseStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, backgroundColor: colors.background };
}

export function importscoreStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, backgroundColor: colors.background };
}

export function importscoreStyle2(): import('react-native').ViewStyle {
  return { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 };
}

export function importscoreStyle3(): import('react-native').ViewStyle {
  return { minHeight: 44, justifyContent: 'center' };
}

export function importscoreStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 13, fontWeight: '800' };
}

export function importscoreStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.7 };
}

export function importscoreStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 };
}

export function importscoreStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 14, marginTop: 5, marginBottom: 13 };
}

export function importscoreStyle8({ colors, importing }: { colors: import('@/theme').ThemeColors; importing: boolean }): import('react-native').ViewStyle {
  return { minHeight: 58, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 2, backgroundColor: colors.left, opacity: importing ? 0.7 : 1 };
}

export function importscoreStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 14, fontWeight: '900', letterSpacing: 0.7 };
}

export function importscoreStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 11, lineHeight: 16, marginTop: 8 };
}

export function importscoreStyle11(): import('react-native').ViewStyle {
  return { alignSelf: 'flex-start', paddingVertical: 9 };
}

export function importscoreStyle12({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 11, fontWeight: '700' };
}

export function setupStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { paddingHorizontal: 28, paddingTop: 9, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.background };
}

export function setupStyle2(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'stretch', gap: 18, marginTop: 22 };
}

export function setupStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1.25, minWidth: 0, backgroundColor: colors.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.line };
}

export function setupStyle4(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' };
}

export function setupStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontWeight: '800', fontSize: 11, letterSpacing: 1.1 };
}

export function setupStyle9(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 };
}

export function setupStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' };
}

export function setupStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 23 };
}

export function setupStyle12(): import('react-native').ViewStyle {
  return { flex: 1, height: 48 };
}

export function setupStyle13({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' };
}

export function setupStyle14({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 23 };
}

export function setupStyle15(): import('react-native').ViewStyle {
  return { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 52 };
}

export function setupStyle16({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10 };
}

export function setupStyle17({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10 };
}

export function setupStyle18({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 0, backgroundColor: colors.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.line };
}

export function setupStyle19({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontWeight: '800', fontSize: 11, letterSpacing: 1.1, marginBottom: 16 };
}

export function ComposerSymbolButtonStyle1({ pressed, color, colors }: { pressed: boolean; color: string; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
        minWidth: 78,
        minHeight: 75,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 7,
        paddingVertical: 7,
        borderRadius: 11,
        backgroundColor: pressed ? `${color}24` : colors.background,
        borderWidth: 1,
        borderColor: pressed ? color : colors.line,
      };
}

export function ComposerSymbolButtonStyle2(): import('react-native').ViewStyle {
  return { height: 39, minWidth: 46, justifyContent: 'center', alignItems: 'center' };
}

export function ComposerSymbolButtonStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 8, fontWeight: '800', marginTop: 2, maxWidth: 100 };
}

export function ExampleScoreBrowserStyle1(): import('react-native').ViewStyle {
  return { marginTop: 13 };
}

export function ExampleScoreBrowserStyle2(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 };
}

export function ExampleScoreBrowserStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 };
}

export function ExampleScoreBrowserStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10 };
}

export function ExampleScoreBrowserStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 11, marginBottom: 8 };
}

export function ExampleScoreBrowserStyle6(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' };
}

export function ExampleScoreBrowserStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5 };
}

export function ExampleScoreBrowserStyle8(): import('react-native').ViewStyle {
  return { minHeight: 30, justifyContent: 'center', paddingHorizontal: 4 };
}

export function ExampleScoreBrowserStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 9, fontWeight: '900' };
}

export function ExampleScoreBrowserStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5 };
}

export function ExampleScoreBrowserStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 72, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ExampleScoreBrowserStyle12({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 11, textAlign: 'center' };
}

export function ExampleScoreBrowserStyle13(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', gap: 8 };
}

export function ExampleScoreBrowserStyle14({ templateCardBasis, pressed, colors }: { templateCardBasis: "100%" | "48%"; pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flexGrow: 1, flexBasis: templateCardBasis, maxWidth: templateCardBasis, minHeight: 96, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ExampleScoreBrowserStyle15(): import('react-native').ViewStyle {
  return { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 };
}

export function ExampleScoreBrowserStyle16({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { flex: 1, color: colors.text, fontSize: 12, fontWeight: '900' };
}

export function ExampleScoreBrowserStyle17({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 9, fontWeight: '900' };
}

export function ExampleScoreBrowserStyle18({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10, marginTop: 4 };
}

export function ExampleScoreBrowserStyle19(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 };
}

export function ExampleScoreBrowserStyle20({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.background };
}

export function ExampleScoreBrowserStyle21({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 8, fontWeight: '800' };
}

export function ExerciseComposerStyle1(): import('react-native').ViewStyle {
  return { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 };
}

export function ExerciseComposerStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 10, fontWeight: '900' };
}

export function ExerciseComposerStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 5, marginBottom: 10 };
}

export function ExerciseComposerStyle4(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 7, marginBottom: 8 };
}

export function ExerciseComposerStyle5(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 7, marginBottom: 8 };
}

export function ExerciseComposerStyle6({ sectionTitle }: { sectionTitle: { color: string; fontSize: number; fontWeight: "900"; letterSpacing: number; } }): import('react-native').TextStyle {
  return { ...sectionTitle, marginTop: 3 };
}

export function ExerciseComposerStyle7(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 2, marginBottom: 8 };
}

export function ExerciseComposerStyle8({ noteColor }: { noteColor: string }): import('react-native').TextStyle {
  return { flex: 1, color: noteColor, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 };
}

export function ExerciseComposerStyle9({ colors, selectedHandNotes }: { colors: import('@/theme').ThemeColors; selectedHandNotes: import("@/rhythm/scoreComposer").ComposedNoteValue[] }): import('react-native').ViewStyle {
  return { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.surface, opacity: selectedHandNotes.length === 0 ? 0.45 : 1 };
}

export function ExerciseComposerStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 8, fontWeight: '900' };
}

export function ExerciseComposerStyle11({ colors, selectedHandNotes }: { colors: import('@/theme').ThemeColors; selectedHandNotes: import("@/rhythm/scoreComposer").ComposedNoteValue[] }): import('react-native').ViewStyle {
  return { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.surface, opacity: selectedHandNotes.length === 0 ? 0.45 : 1 };
}

export function ExerciseComposerStyle12({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 8, fontWeight: '900' };
}

export function ExerciseComposerStyle13({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 5 };
}

export function ExerciseComposerStyle14({ preview, colors }: { preview: { notationWidth: number; cardWidth: number; }; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: preview.cardWidth, minHeight: 87, justifyContent: 'center', paddingHorizontal: 4, paddingVertical: 5, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ExerciseComposerStyle15({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 8, fontWeight: '900', letterSpacing: 1, paddingLeft: 4, marginBottom: 1 };
}

export function ExerciseComposerStyle16(): import('react-native').ViewStyle {
  return { width: 110, alignItems: 'center', justifyContent: 'center' };
}

export function ExerciseComposerStyle17({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '800' };
}

export function ExerciseComposerStyle18({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 9, lineHeight: 14, marginBottom: 3 };
}

export function ExerciseComposerStyle19({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10, paddingVertical: 9 };
}

export function ExerciseComposerStyle20(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 8 };
}

export function ExerciseComposerStyle21(): import('react-native').ViewStyle {
  return { marginTop: 15 };
}

export function ExerciseComposerStyle22({ sectionTitle }: { sectionTitle: { color: string; fontSize: number; fontWeight: "900"; letterSpacing: number; } }): import('react-native').TextStyle {
  return { ...sectionTitle, marginBottom: 7 };
}

export function ExerciseComposerStyle23({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10, paddingVertical: 6 };
}

export function ExerciseComposerStyle24(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 7, marginBottom: 6 };
}

export function ExerciseComposerStyle25({ pressed, colors }: { pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, minHeight: 47, justifyContent: 'center', paddingHorizontal: 11, borderRadius: 10, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ExerciseComposerStyle26({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 10, fontWeight: '800' };
}

export function ExerciseComposerStyle27({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 8, marginTop: 3 };
}

export function ExerciseComposerStyle28({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minWidth: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ExerciseComposerStyle29({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 8, fontWeight: '900' };
}

export function ExerciseHeaderStyle1(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 };
}

export function ExerciseHeaderStyle2(): import('react-native').ViewStyle {
  return { paddingVertical: 8, paddingRight: 14 };
}

export function ExerciseHeaderStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1 };
}

export function ExerciseHeaderStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 };
}

export function ExerciseHeaderStyle5(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 18 };
}

export function ExerciseHeaderStyle6(): import('react-native').ViewStyle {
  return { flex: 1 };
}

export function ExerciseHeaderStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.7 };
}

export function ExerciseHeaderStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, marginTop: 5 };
}

export function ExerciseHeaderStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ExerciseHeaderStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 };
}

export function ExerciseHeaderStyle11(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 };
}

export function ExerciseHeaderStyle12({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 };
}

export function ExerciseHeaderStyle13(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 7 };
}

export function ExerciseHeaderStyle14(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 8, marginBottom: 17 };
}

export function ExerciseHistoryPanelStyle1(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 9 };
}

export function ExerciseHistoryPanelStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { width: 205, minHeight: 37, color: colors.text, fontSize: 11, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1 };
}

export function ExerciseHistoryPanelStyle3(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 7, marginBottom: 10 };
}

export function ExerciseHistoryPanelStyle4(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 18 };
}

export function ExerciseHistoryPanelStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { paddingHorizontal: 16, paddingVertical: 13, marginBottom: 18, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ExerciseHistoryPanelStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 12, fontWeight: '800' };
}

export function ExerciseHistoryPanelStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, marginTop: 4 };
}

export function ExerciseHistoryPanelStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 10 };
}

export function ExerciseHistoryPanelStyle9(): import('react-native').ViewStyle {
  return { gap: 8, marginBottom: 18 };
}

export function ExerciseHistoryPanelStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { paddingHorizontal: 16, paddingVertical: 13, marginBottom: 18, borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ExerciseHistoryPanelStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 12, fontWeight: '800' };
}

export function ExerciseHistoryPanelStyle12({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, marginTop: 4 };
}

export function ExerciseHistoryTilesStyle1(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'stretch', gap: 8 };
}

export function ExerciseHistoryTilesStyle2({ pressed, colors, disabled }: { pressed: boolean; colors: import('@/theme').ThemeColors; disabled: boolean }): import('react-native').ViewStyle {
  return { flex: 1, minHeight: 58, paddingHorizontal: 13, paddingVertical: 9, justifyContent: 'center', borderRadius: 12, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line, opacity: disabled ? 0.65 : 1 };
}

export function ExerciseHistoryTilesStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 12, fontWeight: '800' };
}

export function ExerciseHistoryTilesStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, marginTop: 4 };
}

export function ExerciseHistoryTilesStyle5({ pressed, colors }: { pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minWidth: 74, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ExerciseHistoryTilesStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 };
}

export function ExerciseHistoryTilesStyle7({ pressed, colors }: { pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flexGrow: 1, flexBasis: '31%', minWidth: 235, minHeight: 76, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 13, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line, opacity: pressed ? 0.84 : 1 };
}

export function ExerciseHistoryTilesStyle8(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 };
}

export function ExerciseHistoryTilesStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { flex: 1, color: colors.text, fontSize: 11, fontWeight: '800' };
}

export function ExerciseHistoryTilesStyle10({ accuracy, colors }: { accuracy: number; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: accuracy < 80 ? colors.accent : colors.left, fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] };
}

export function ExerciseHistoryTilesStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 9, marginTop: 6 };
}

export function ExerciseLoadingStateStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, backgroundColor: colors.background };
}

export function ExerciseLoadingStateStyle2(): import('react-native').ViewStyle {
  return { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 };
}

export function ExerciseLoadingStateStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 17, fontWeight: '800' };
}

export function ExerciseLoadingStateStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 13, textAlign: 'center' };
}

export function ExercisePairPanelStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 };
}

export function ExercisePairPanelStyle2(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'stretch', gap: 12, marginTop: 9 };
}

export function ExercisePatternPickerStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 0, padding: 12, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ExercisePatternPickerStyle2({ color }: { color: string }): import('react-native').TextStyle {
  return { color, fontSize: 9, fontWeight: '900', letterSpacing: 1 };
}

export function ExercisePatternPickerStyle3(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', gap: 8 };
}

export function ExercisePatternPickerStyle4({ selected }: { selected: boolean }): import('react-native').ViewStyle {
  const slot = selected
    ? { width: 132, height: 54, paddingHorizontal: 6, marginBottom: 8 }
    : { width: 58, height: 36, paddingHorizontal: 3, marginBottom: 0 };

  return { width: slot.width, height: slot.height, marginBottom: slot.marginBottom, paddingHorizontal: slot.paddingHorizontal, alignItems: 'center', justifyContent: 'center' };
}

export function ExercisePatternPickerStyle5({ selected, color, pressed, colors }: { selected: boolean; color: string; pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
        minWidth: 70,
        minHeight: 52,
        paddingHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 9,
        backgroundColor: selected ? `${color}24` : pressed ? colors.surfaceRaised : colors.background,
        borderWidth: 1,
        borderColor: selected ? color : colors.line,
      };
}

export function ExercisePatternPickerStyle6({ selected, chipColor, colors }: { selected: boolean; chipColor: string; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 30, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: selected ? `${chipColor}24` : colors.background, borderWidth: 1, borderColor: selected ? chipColor : colors.line };
}

export function ExercisePatternPickerStyle7({ selected, chipColor, colors }: { selected: boolean; chipColor: string; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: selected ? chipColor : colors.muted, fontSize: 9, fontWeight: '800' };
}

export function ExercisePatternPickerStyle8({ flex, pressed, disabled, colors }: { flex: number | undefined; pressed: boolean; disabled: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 9, borderRadius: 12, backgroundColor: pressed || disabled ? colors.surfaceRaised : colors.left, opacity: disabled ? 0.65 : 1 };
}

export function ExercisePatternPickerStyle9({ disabled, colors }: { disabled: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: disabled ? colors.muted : colors.background, fontSize: 11, fontWeight: '900', letterSpacing: 1 };
}

export function ImportedScorePreviewStyle1(): import('react-native').ViewStyle {
  return { paddingHorizontal: 2, paddingTop: 2, paddingBottom: 8 };
}

export function ImportedScorePreviewStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 19, fontWeight: '900' };
}

export function ImportedScorePreviewStyle3(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 };
}

export function ImportedScorePreviewStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { flex: 1, color: colors.dim, fontSize: 10 };
}

export function ImportedScorePreviewStyle5({ pressed, colors, currentEntry }: { pressed: boolean; colors: import('@/theme').ThemeColors; currentEntry: import("@/rhythm/importedScoreLibrary").ImportedScoreLibraryEntry | undefined }): import('react-native').ViewStyle {
  return { minHeight: 34, justifyContent: 'center', paddingHorizontal: 10, marginLeft: 8, borderRadius: 9, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: currentEntry?.saved ? colors.accent : colors.line, opacity: currentEntry ? 1 : 0.6 };
}

export function ImportedScorePreviewStyle6({ currentEntry, colors }: { currentEntry: import("@/rhythm/importedScoreLibrary").ImportedScoreLibraryEntry | undefined; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: currentEntry?.saved ? colors.accent : colors.left, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 };
}

export function ImportedScorePreviewStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 9, marginTop: 4 };
}

export function ImportedScorePreviewStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, marginTop: 4 };
}

export function ImportedScorePreviewStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 11, marginTop: 3 };
}

export function ImportedScorePreviewStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 11, lineHeight: 15, marginBottom: 6 };
}

export function ImportedScorePreviewStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, marginTop: 5, paddingVertical: 5 };
}

export function ImportedScorePreviewStyle12({ previewMeasureIndex }: { previewMeasureIndex: number }): import('react-native').ViewStyle {
  return { width: 36, alignItems: 'center', justifyContent: 'center', opacity: previewMeasureIndex === 0 ? 0.35 : 1 };
}

export function ImportedScorePreviewStyle13({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 26 };
}

export function ImportedScorePreviewStyle14(): import('react-native').ViewStyle {
  return { flex: 1 };
}

export function ImportedScorePreviewStyle15({ previewMeasureIndex, score }: { previewMeasureIndex: number; score: import("@/types/importedScore").ImportedRhythmScore }): import('react-native').ViewStyle {
  return { width: 36, alignItems: 'center', justifyContent: 'center', opacity: previewMeasureIndex >= score.measures.length - 1 ? 0.35 : 1 };
}

export function ImportedScorePreviewStyle16({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 26 };
}

export function ImportedScorePreviewStyle17({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10, lineHeight: 14, marginTop: 7 };
}

export function ImportedScorePreviewStyle18({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 12, marginBottom: 6 };
}

export function ImportedScorePreviewStyle19(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', gap: 8 };
}

export function ImportedScorePreviewStyle20({ selected, colors }: { selected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: '48%', minHeight: 54, justifyContent: 'center', paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: selected ? colors.accent : colors.line, backgroundColor: selected ? `${colors.accent}18` : colors.surface };
}

export function ImportedScorePreviewStyle21({ selected, colors }: { selected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: selected ? colors.accent : colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 };
}

export function ImportedScorePreviewStyle22({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 9, marginTop: 3 };
}

export function ImportedScorePreviewStyle23(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 9, marginTop: 11 };
}

export function ImportedScorePreviewStyle24({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 56, width: 94, borderRadius: 14, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' };
}

export function ImportedScorePreviewStyle25({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '800' };
}

export function ImportedScorePreviewStyle26({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 56, width: 108, borderRadius: 14, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' };
}

export function ImportedScorePreviewStyle27({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '800' };
}

export function ImportedScorePreviewStyle28({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, minHeight: 56, borderRadius: 14, backgroundColor: colors.left, justifyContent: 'center', alignItems: 'center' };
}

export function ImportedScorePreviewStyle29({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 15, fontWeight: '900', letterSpacing: 0.7 };
}

export function ScoreLibraryListStyle1(): import('react-native').ViewStyle {
  return { marginTop: 15 };
}

export function ScoreLibraryListStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 7 };
}

export function ScoreLibraryListStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 11, paddingVertical: 7 };
}

export function ScoreLibraryListStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 11, paddingVertical: 7 };
}

export function ScoreLibraryListStyle5({ pressed, colors }: { pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, marginBottom: 5, borderRadius: 10, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ScoreLibraryListStyle6(): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 0 };
}

export function ScoreLibraryListStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 11, fontWeight: '800' };
}

export function ScoreLibraryListStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 9, marginTop: 2 };
}

export function ScoreLibraryListStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 10, fontWeight: '900', marginLeft: 9 };
}

export function ScoreLibraryListStyle10(): import('react-native').ViewStyle {
  return { marginTop: 12 };
}

export function ScoreLibraryListStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 7 };
}

export function ScoreLibraryListStyle12({ pressed, colors }: { pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, marginBottom: 4, borderRadius: 10, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ScoreLibraryListStyle13({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { flex: 1, color: colors.text, fontSize: 10, fontWeight: '800' };
}

export function ScoreLibraryListStyle14({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontWeight: '500' };
}

export function ScoreLibraryListStyle15({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 9, fontWeight: '900', marginLeft: 8 };
}

export function ScoreTemplateFilterChipStyle1({ selected, colors, pressed }: { selected: boolean; colors: import('@/theme').ThemeColors; pressed: boolean }): import('react-native').ViewStyle {
  return {
        minHeight: 34,
        justifyContent: 'center',
        paddingHorizontal: 13,
        borderRadius: 18,
        backgroundColor: selected ? colors.accent : pressed ? colors.surfaceRaised : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.line,
      };
}

export function ScoreTemplateFilterChipStyle2({ selected, colors }: { selected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: selected ? colors.background : colors.muted, fontSize: 11, fontWeight: '800' };
}

export function exerciseStyle2(): import('react-native').ViewStyle {
  return { width: '100%', maxWidth: 1100, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 14, paddingBottom: 30 };
}

export function importscoreStyle13(): import('react-native').ViewStyle {
  return { paddingHorizontal: 22, paddingTop: 9, paddingBottom: 24, maxWidth: 850, width: '100%', alignSelf: 'center' };
}

export function ExampleScoreBrowserStyle22(): import('react-native').ViewStyle {
  return { gap: 7, paddingBottom: 8 };
}

export function ExampleScoreBrowserStyle23(): import('react-native').ViewStyle {
  return { gap: 7, paddingBottom: 9 };
}

export function ExerciseComposerStyle30(): import('react-native').ViewStyle {
  return { gap: 7, paddingVertical: 7 };
}

export function ExerciseComposerStyle31(): import('react-native').ViewStyle {
  return { gap: 7, paddingVertical: 7 };
}

export function ExerciseComposerStyle32(): import('react-native').ViewStyle {
  return { gap: 8, paddingBottom: 7 };
}

export function exerciseSectionTitleStyle(colors: import('@/theme').ThemeColors): { color: string; fontSize: number; fontWeight: '900'; letterSpacing: number } {
  return { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 };
}
