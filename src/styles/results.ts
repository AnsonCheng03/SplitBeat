export function resultsStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background };
}

export function resultsStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted };
}

export function resultsStyle3(): import('react-native').ViewStyle {
  return { padding: 16 };
}

export function resultsStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.left, fontWeight: '800' };
}

export function resultsStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, backgroundColor: colors.background };
}

export function ReplayBeatGuidesStyle1({ anchorStartX, anchorWidth }: { anchorStartX: number; anchorWidth: number }): import('react-native').ViewStyle {
  return { position: 'absolute', left: anchorStartX, width: anchorWidth, top: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between' };
}

export function ReplayBeatGuidesStyle2({ colors, beat, beatsPerBar }: { colors: import('@/theme').ThemeColors; beat: number; beatsPerBar: number }): import('react-native').ViewStyle {
  return { width: 1, height: '100%', backgroundColor: colors.line, opacity: beat === 0 || beat === beatsPerBar ? 0.7 : 0.38 };
}

export function ReplayHandLaneStyle1({ isLastLane }: { isLastLane: boolean }): import('react-native').ViewStyle {
  return { marginBottom: isLastLane ? 0 : 13 };
}

export function ReplayHandLaneStyle2({ accent }: { accent: string }): import('react-native').TextStyle {
  return { color: accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 3 };
}

export function ReplayHandLaneStyle3({ laneHeight }: { laneHeight: number }): import('react-native').ViewStyle {
  return { position: 'relative', height: laneHeight, justifyContent: 'center' };
}

export function ReplayHandLaneStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, textAlign: 'center', fontWeight: '700' };
}

export function ReplayHandLaneStyle5({ note, size, notePlanTop }: { note: import("@/rhythm/noteNotation").NoteGlyphShape; size: number; notePlanTop: number }): import('react-native').ViewStyle {
  return {
                left: note.left + note.headWidth / 2 - size / 2,
                top: notePlanTop + note.headTop + note.headHeight / 2 - size / 2,
              };
}

export function ReplayHandLaneStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.9, marginTop: 2, marginBottom: 2 };
}

export function ReplayHandLaneStyle7(): import('react-native').ViewStyle {
  return { position: 'relative', height: 18, justifyContent: 'center' };
}

export function ReplayHandLaneStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { height: 1, backgroundColor: colors.line };
}

export function ReplayHandLaneStyle9({ anchorStartX, anchorWidth, position }: { anchorStartX: number; anchorWidth: number; position: number }): import('react-native').ViewStyle {
  return { left: anchorStartX + anchorWidth * position - 6, top: 3 };
}

export function ReplayHandLaneStyle10({ anchorWidth, anchorStartX }: { anchorWidth: number; anchorStartX: number }): import('react-native').ViewStyle {
  return { flexDirection: 'row', width: anchorWidth, marginLeft: anchorStartX, marginTop: 2 };
}

export function ReplayHandLaneStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, flex: 1, textAlign: 'center', fontSize: 9, fontVariant: ['tabular-nums'] };
}

export function ReplayStatusBadgeStyle1({ size, status, colors }: { size: number; status: "miss" | "correct"; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
        position: 'absolute',
        zIndex: 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: status === 'correct' ? colors.left : colors.danger,
        borderWidth: 1,
        borderColor: colors.background,
      };
}

export function ReplayStatusBadgeStyle2({ colors, size }: { colors: import('@/theme').ThemeColors; size: number }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: Math.max(7, size * 0.72), lineHeight: size, fontWeight: '900', textAlign: 'center' };
}

export function ReplayTimelineStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { position: 'relative', marginTop: 9, padding: 12, overflow: 'hidden', borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ReplayTimelineStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 10 };
}

export function ReplayTimelineStyle3({ colors, playhead }: { colors: import('@/theme').ThemeColors; playhead: import("react-native").Animated.Value }): import('react-native').ViewStyle {
  return { position: 'absolute', top: 28, bottom: 17, left: 12, width: 2, backgroundColor: colors.text, opacity: 0.72, transform: [{ translateX: playhead }] };
}

export function ReplayTimelineStyle4(): import('react-native').ViewStyle {
  return { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 4 };
}

export function ReplayTimelineStyle5(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: 5 };
}

export function ReplayTimelineStyle6(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: 2 };
}

export function ReplayTimelineStyle7({ hand, colors }: { hand: import("@/types/rhythm").Hand; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 7, height: 7, borderRadius: 4, backgroundColor: hand === 'left' ? colors.left : colors.right };
}

export function ReplayTimelineStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 9 };
}

export function ReplayTimelineStyle9(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: 5 };
}

export function ReplayTimelineStyle10(): import('react-native').ViewStyle {
  return { position: 'relative' };
}

export function ReplayTimelineStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 9 };
}

export function ReplayTimelineStyle12(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: 5 };
}

export function ReplayTimelineStyle13(): import('react-native').ViewStyle {
  return { position: 'relative' };
}

export function ReplayTimelineStyle14({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 9 };
}

export function ResultsControlsStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15 };
}

export function ResultsControlsStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 };
}

export function ResultsControlsStyle3({ accent, colors }: { accent: string | undefined; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: accent ?? colors.text, fontSize: 25, fontWeight: '900', marginTop: 7 };
}

export function ResultsControlsStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, marginTop: 4 };
}

export function ResultsControlsStyle5({ pressed, colors }: { pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
        paddingHorizontal: 14,
        borderRadius: 13,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
      };
}

export function ResultsControlsStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 14, fontWeight: '800', flex: 1 };
}

export function ResultsControlsStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 };
}

export function ResultsControlsStyle8({ pressed, colors }: { pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
          minHeight: 58,
          paddingHorizontal: 17,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: pressed ? colors.surfaceRaised : 'transparent',
        };
}

export function ResultsControlsStyle9({ color }: { color: string }): import('react-native').TextStyle {
  return { color, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 };
}

export function ResultsControlsStyle10({ color }: { color: string }): import('react-native').TextStyle {
  return { color, fontSize: 23, lineHeight: 27, fontWeight: '500' };
}

export function ResultsControlsStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { height: 1, marginHorizontal: 16, backgroundColor: colors.line };
}

export function ResultsFooterStyle1({ pressed, colors, startingAgain }: { pressed: boolean; colors: import('@/theme').ThemeColors; startingAgain: boolean }): import('react-native').ViewStyle {
  return { backgroundColor: pressed ? '#A8EADB' : colors.left, minHeight: 64, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 30, opacity: startingAgain ? 0.72 : 1 };
}

export function ResultsFooterStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 15, fontWeight: '900', letterSpacing: 0.8 };
}

export function ResultsFooterStyle3({ pressed, colors }: { pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { backgroundColor: pressed ? colors.surfaceRaised : colors.surface, minHeight: 60, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 14, borderWidth: 1, borderColor: colors.line };
}

export function ResultsFooterStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 };
}

export function ResultsFooterStyle5(): import('react-native').ViewStyle {
  return { marginTop: 18 };
}

export function ResultsFooterStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8 };
}

export function ResultsFooterStyle7({ pressed, colors, exportingDiagnostic }: { pressed: boolean; colors: import('@/theme').ThemeColors; exportingDiagnostic: boolean }): import('react-native').ViewStyle {
  return { minHeight: 58, paddingHorizontal: 16, borderRadius: 15, justifyContent: 'center', backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line, opacity: exportingDiagnostic ? 0.7 : 1 };
}

export function ResultsFooterStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 };
}

export function ResultsFooterStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, marginTop: 4 };
}

export function ResultsFooterStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { marginTop: 14, marginBottom: 18, overflow: 'hidden', borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function ResultsMissedNotesStyle1(): import('react-native').ViewStyle {
  return { marginTop: 22 };
}

export function ResultsMissedNotesStyle2(): import('react-native').ViewStyle {
  return { paddingTop: 12 };
}

export function ResultsMissedNotesStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 9 };
}

export function ResultsMissedNotesStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 9 };
}

export function ResultsMissedNotesStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line };
}

export function ResultsMissedNotesStyle6(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: 10 };
}

export function ResultsMissedNotesStyle7(): import('react-native').ViewStyle {
  return { flex: 1, gap: 4 };
}

export function ResultsMissedNotesStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 12, fontWeight: '800' };
}

export function ResultsMissedNotesStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.left, fontSize: 11, lineHeight: 16 };
}

export function ResultsMissedNotesStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.right, fontSize: 11, lineHeight: 16 };
}

export function ResultsMissedNotesStyle11({ pressed, colors, replayActive, replay }: { pressed: boolean; colors: import('@/theme').ThemeColors; replayActive: boolean; replay: { barIndex: number; playbackId: number; isPlaying: boolean; isStarting: boolean } | null }): import('react-native').ViewStyle {
  return { paddingHorizontal: 14, minHeight: 40, justifyContent: 'center', borderRadius: 11, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: replayActive && replay!.isPlaying ? colors.accent : colors.line };
}

export function ResultsMissedNotesStyle12({ replayActive, replay, colors }: { replayActive: boolean; replay: { barIndex: number; playbackId: number; isPlaying: boolean; isStarting: boolean } | null; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: replayActive && replay!.isPlaying ? colors.accent : colors.text, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 };
}

export function ResultsMissedNotesStyle13({ pressed, colors, savedBars, barIndex }: { pressed: boolean; colors: import('@/theme').ThemeColors; savedBars: ReadonlySet<number>; barIndex: number }): import('react-native').ViewStyle {
  return { paddingHorizontal: 11, minHeight: 40, justifyContent: 'center', borderRadius: 11, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: savedBars.has(barIndex) ? colors.left : colors.line };
}

export function ResultsMissedNotesStyle14({ savedBars, barIndex, colors }: { savedBars: ReadonlySet<number>; barIndex: number; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: savedBars.has(barIndex) ? colors.left : colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.4 };
}

export function ResultsOverviewStyle1(): import('react-native').ViewStyle {
  return { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 };
}

export function ResultsOverviewStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 };
}

export function ResultsOverviewStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, maxWidth: '68%', textAlign: 'right' };
}

export function ResultsOverviewStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 };
}

export function ResultsOverviewStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.left, fontSize: 13, fontWeight: '800', marginTop: 7 };
}

export function ResultsOverviewStyle6({ colors, swingFeelAnalysis, originalFeel }: { colors: import('@/theme').ThemeColors; swingFeelAnalysis: { likelyStraight: boolean; } | null; originalFeel: import("@/types/rhythm").RhythmicFeel }): import('react-native').ViewStyle {
  return { paddingHorizontal: 13, paddingVertical: 11, marginTop: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: swingFeelAnalysis?.likelyStraight && originalFeel === 'swing' ? colors.accent : colors.line };
}

export function ResultsOverviewStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: '800', marginBottom: 8 };
}

export function ResultsOverviewStyle8(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 };
}

export function ResultsOverviewStyle9(): import('react-native').ViewStyle {
  return { flex: 1 };
}

export function ResultsOverviewStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 };
}

export function ResultsOverviewStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10, lineHeight: 14, marginTop: 3 };
}

export function ResultsOverviewStyle12({ countAsFeel, feel, colors }: { countAsFeel: import("@/types/rhythm").RhythmicFeel; feel: "straight" | "swing"; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minWidth: 76, minHeight: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 10, backgroundColor: countAsFeel === feel ? colors.accent : colors.background, borderWidth: 1, borderColor: countAsFeel === feel ? colors.accent : colors.line };
}

export function ResultsOverviewStyle13({ countAsFeel, feel, colors }: { countAsFeel: import("@/types/rhythm").RhythmicFeel; feel: "straight" | "swing"; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: countAsFeel === feel ? colors.background : colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 };
}

export function ResultsOverviewStyle14({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 20, marginTop: 17 };
}

export function ResultsOverviewStyle15({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 };
}

export function ResultsOverviewStyle16({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 58, lineHeight: 66, fontWeight: '900', marginTop: 4 };
}

export function ResultsOverviewStyle17(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 };
}

export function ResultsOverviewStyle18({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 19, fontWeight: '900', letterSpacing: 1.4 };
}

export function ResultsOverviewStyle19({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 };
}

export function ResultsOverviewStyle20({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 7 };
}

export function ResultsOverviewStyle21({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { height: 4, borderRadius: 3, backgroundColor: colors.line, marginTop: 11, overflow: 'hidden' };
}

export function ResultsOverviewStyle22({ overall, colors }: { overall: number; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: (String(overall) + '%') as import("react-native").DimensionValue, height: 4, backgroundColor: colors.accent, borderRadius: 3 };
}

export function ResultsOverviewStyle23(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 10, marginTop: 11 };
}

export function ResultsOverviewStyle24(): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 10, marginTop: 10 };
}

export function ResultsPerformanceBreakdownStyle1(): import('react-native').ViewStyle {
  return { marginTop: 25 };
}

export function ResultsPerformanceBreakdownStyle2(): import('react-native').ViewStyle {
  return { paddingTop: 16 };
}

export function ResultsPerformanceBreakdownStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 3 };
}

export function ResultsPerformanceBreakdownStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line };
}

export function ResultsPerformanceBreakdownStyle5({ hand, colors }: { hand: import("@/types/rhythm").Hand; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: hand === 'left' ? colors.left : colors.right, fontWeight: '800', fontSize: 12, letterSpacing: 1 };
}

export function ResultsPerformanceBreakdownStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, marginTop: 4 };
}

export function ResultsPerformanceBreakdownStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] };
}

export function ResultsPerformanceBreakdownStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 17, marginTop: 22 };
}

export function ResultsPerformanceBreakdownStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 };
}

export function ResultsPerformanceBreakdownStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 13 };
}

export function ResultsPerformanceBreakdownStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 30, fontWeight: '900', marginTop: 5 };
}

export function ResultsPerformanceBreakdownStyle12(): import('react-native').ViewStyle {
  return { marginTop: 22 };
}

export function ResultsPerformanceBreakdownStyle13({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 5 };
}

export function ResultsPerformanceBreakdownStyle14({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line };
}

export function ResultsPerformanceBreakdownStyle15({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, flex: 1, fontSize: 12 };
}

export function ResultsPerformanceBreakdownStyle16({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, width: 58, textAlign: 'right', fontSize: 12, fontWeight: '800' };
}

export function ResultsPerformanceBreakdownStyle17({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.left, width: 58, textAlign: 'right', fontSize: 12, fontWeight: '800' };
}

export function ResultsPerformanceBreakdownStyle18({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.right, width: 58, textAlign: 'right', fontSize: 12, fontWeight: '800' };
}

export function ResultsPerformanceBreakdownStyle19(): import('react-native').ViewStyle {
  return { marginTop: 23, gap: 9 };
}

export function ResultsPerformanceBreakdownStyle20({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 14, lineHeight: 21 };
}

export function resultsStyle6(): import('react-native').ViewStyle {
  return { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32, maxWidth: 720, width: '100%', alignSelf: 'center' };
}
