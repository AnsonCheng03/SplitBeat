export function CountdownStyle1({ colors, value, compact }: { colors: import('@/theme').ThemeColors; value: number | "START" | null; compact: boolean }): import('react-native').TextStyle {
  return {
        color: colors.accent,
        fontSize: value! === 'START' ? (compact ? 19 : 22) : compact ? 29 : 34,
        fontWeight: '800',
        letterSpacing: value! === 'START' ? 2 : 0,
        textAlign: 'center',
      };
}

export function MetronomeIndicatorStyle1({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { alignItems: 'center', gap: compact ? 6 : 9 };
}

export function MetronomeIndicatorStyle2({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: compact ? 10 : 13 };
}

export function MetronomeIndicatorStyle3({ active, compact, beat, colors }: { active: boolean; compact: boolean; beat: number; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
                width: active ? (compact ? 15 : 18) : compact ? 9 : 11,
                height: active ? (compact ? 15 : 18) : compact ? 9 : 11,
                borderRadius: 99,
                backgroundColor: active ? (beat === 0 ? colors.accent : colors.text) : colors.dim,
                opacity: active ? 1 : 0.6,
              };
}

export function MetronomeIndicatorStyle4({ isRest, isPaused, colors, compact }: { isRest: boolean; isPaused: boolean; colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: isRest || isPaused ? colors.accent : colors.muted, fontSize: compact ? 10 : 11, letterSpacing: compact ? 0.5 : 0.8, fontWeight: isRest || isPaused ? '900' : '700' };
}

export function MixtureSymbolStyle1({ plan, fittedScale }: { plan: import("@/rhythm/noteNotation").NoteNotationPlan; fittedScale: number }): import('react-native').ViewStyle {
  return { width: plan.width * fittedScale, height: plan.height * fittedScale, alignItems: 'center', justifyContent: 'center' };
}

export function MixtureSymbolStyle2({ plan, fittedScale }: { plan: import("@/rhythm/noteNotation").NoteNotationPlan; fittedScale: number }): import('react-native').ViewStyle {
  return { width: plan.width, height: plan.height, transform: [{ scale: fittedScale }], alignItems: 'center', justifyContent: 'center' };
}

export function NextPatternPreviewStyle2({ top, height, frame, isScorePreview, leftInset, rightInset, slideProgress }: { top: number; height: number; frame: import('@/features/deviceLayout/practiceLayout').PracticePaneFrame; isScorePreview: boolean; leftInset: number; rightInset: number; slideProgress: import("react-native").Animated.Value }): import('react-native').ViewStyle {
  return {
        position: 'absolute',
        top,
        left: frame.left,
        width: frame.width,
        height,
        // Keep previews within one physical panel when the display has a hinge.
        // Score headers keep safe-area padding because they contain edge labels.
        paddingHorizontal: isScorePreview ? Math.max(16, leftInset + 18, rightInset + 18) : 0,
        opacity: slideProgress,
        transform: [{ translateX: slideProgress.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }],
      };
}

export function NextPatternPreviewStyle3({ isScorePreview }: { isScorePreview: boolean }): import('react-native').ViewStyle {
  return {
          flex: 1,
          width: '100%',
          maxWidth: isScorePreview ? 1120 : undefined,
          alignSelf: 'center',
          justifyContent: 'center',
        };
}

export function NextPatternPreviewStyle4({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { minHeight: compact ? 18 : 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: compact ? 4 : 6 };
}

export function NextPatternPreviewStyle5({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: compact ? 9 : 11, fontWeight: '900', letterSpacing: 1.2 };
}

export function NextPatternPreviewStyle6(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'baseline', gap: 5 };
}

export function NextPatternPreviewStyle7({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 10 : 12, fontWeight: '800', marginRight: 3 };
}

export function NextPatternPreviewStyle8({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: compact ? 18 : 22, lineHeight: compact ? 20 : 24, fontWeight: '900', fontVariant: ['tabular-nums'] };
}

export function NextPatternPreviewStyle9({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.5 };
}

export function NextPatternPreviewStyle10(): import('react-native').ViewStyle {
  return { flex: 1, justifyContent: 'center' };
}

export function NextPatternPreviewStyle12({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 1, height: '42%', backgroundColor: colors.line };
}

export const nextRhythmPatternCardWrapperStyle: import('react-native').ViewStyle = {
  width: '19%',
  minWidth: 160,
  maxWidth: 360,
  alignSelf: 'center',
};

export function nextRhythmPatternCardSurfaceStyle({ light }: { light: boolean }): import('react-native').ViewStyle {
  return {
    position: 'relative',
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: light ? 'rgba(112, 68, 204, 0.24)' : 'rgba(172, 145, 255, 0.28)',
    overflow: 'hidden',
    backgroundColor: light ? 'rgba(255, 255, 255, 0.54)' : 'rgba(25, 23, 44, 0.38)',
  };
}

export function nextRhythmPatternCardTintStyle({ light }: { light: boolean }): import('react-native').ViewStyle {
  return {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: light ? 'rgba(255, 255, 255, 0.16)' : 'rgba(12, 12, 24, 0.16)',
  };
}

export const nextRhythmPatternCardContentStyle: import('react-native').ViewStyle = {
  position: 'relative',
  paddingHorizontal: 12,
  paddingVertical: 6,
  gap: 5,
  zIndex: 1,
};

export function nextRhythmPatternCardHeaderStyle(): import('react-native').ViewStyle {
  return { minHeight: 16, alignItems: 'center', justifyContent: 'center' };
}

export function nextRhythmPatternCardLabelRowStyle(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' };
}

export function nextRhythmPatternCardCountdownStyle({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.8 };
}

export const nextRhythmPatternSymbolsStyle: import('react-native').ViewStyle = {
  width: '100%',
  minHeight: 44,
  flexDirection: 'row',
  alignItems: 'center',
};

export const nextRhythmPatternHandStyle: import('react-native').ViewStyle = {
  flex: 1,
  minWidth: 0,
  alignItems: 'center',
  justifyContent: 'center',
};

export function NoteNotationStyle1({ plan }: { plan: import("@/rhythm/noteNotation").NoteNotationPlan }): import('react-native').ViewStyle {
  return { width: plan.width, height: plan.height, alignSelf: 'center', justifyContent: 'flex-end', position: 'relative' };
}

export function NoteNotationStyle2({ plan, index, staffLineColor }: { plan: import("@/rhythm/noteNotation").NoteNotationPlan; index: number; staffLineColor: string | undefined }): import('react-native').ViewStyle {
  return {
            position: 'absolute',
            left: 0,
            right: 0,
            top: (plan.height - 24) / 2 + index * 6,
            height: 1,
            backgroundColor: staffLineColor ?? '#53616F',
            opacity: 0.85,
          };
}

export function NoteNotationStyle3(): import('react-native').ViewStyle {
  return { position: 'absolute', right: 0, bottom: 0, width: 1, height: 1, opacity: 0.01 };
}

export function NoteNotationStyle4({ label, visualOffsetY, color }: { label: { key: string; text: string; left: number; width: number; top: number; fontSize: number; }; visualOffsetY: number; color: string }): import('react-native').TextStyle {
  return {
            position: 'absolute',
            left: label.left,
            top: label.top + visualOffsetY,
            width: label.width,
            textAlign: 'center',
            color,
            fontSize: label.fontSize,
            fontWeight: '800',
            lineHeight: label.fontSize + 2,
          };
}

export function RhythmSymbolStyle1({ plan, fittedScale }: { plan: import("@/rhythm/noteNotation").NoteNotationPlan; fittedScale: number }): import('react-native').ViewStyle {
  return { width: plan.width * fittedScale, height: plan.height * fittedScale, alignItems: 'center', justifyContent: 'center' };
}

export function RhythmSymbolStyle2({ plan, fittedScale }: { plan: import("@/rhythm/noteNotation").NoteNotationPlan; fittedScale: number }): import('react-native').ViewStyle {
  return { width: plan.width, height: plan.height, transform: [{ scale: fittedScale }] };
}

export function ScoreBeatFocusStyle1({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flex: 1, alignItems: 'center', justifyContent: 'center', gap: compact ? 7 : 11 };
}

export function ScoreBeatFocusStyle2({ color, compact }: { color: string; compact: boolean }): import('react-native').TextStyle {
  return { color, fontSize: compact ? 11 : 14, fontWeight: '900', letterSpacing: 2 };
}

export function ScoreBeatFocusStyle3({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { width: '86%', height: compact ? 88 : 112, alignItems: 'center', justifyContent: 'center' };
}

export function ScoreBeatFocusStyle4({ plan, notationScale }: { plan: import("@/rhythm/noteNotation").NoteNotationPlan | null; notationScale: 1.3 | 1.55 }): import('react-native').ViewStyle {
  return { width: plan!.width * notationScale, height: plan!.height * notationScale, alignItems: 'center', justifyContent: 'center' };
}

export function ScoreBeatFocusStyle5({ plan, notationScale }: { plan: import("@/rhythm/noteNotation").NoteNotationPlan | null; notationScale: 1.3 | 1.55 }): import('react-native').ViewStyle {
  return { width: plan!.width, height: plan!.height, transform: [{ scale: notationScale }] };
}

export function ScoreBeatFocusStyle6({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { width: '88%', color: colors.text, fontSize: compact ? 12 : 16, lineHeight: compact ? 16 : 20, fontWeight: '800', textAlign: 'center' };
}

export function ScoreFocusNoteStyle1(): import('react-native').ViewStyle {
  return { width: '76%', maxWidth: 620, height: 76, alignSelf: 'center', justifyContent: 'center' };
}

export function ScoreFocusNoteStyle2({ color }: { color: string }): import('react-native').TextStyle {
  return { color, textAlign: 'center', fontSize: 16, fontWeight: '900', letterSpacing: 1.2 };
}

export function ScoreRhythmLaneStyle1({ laneHeight, minimal }: { laneHeight: number; minimal: boolean }): import('react-native').ViewStyle {
  return { height: laneHeight, flexDirection: 'row', alignItems: 'center', gap: minimal ? 0 : 10 };
}

export function ScoreRhythmLaneStyle2({ color }: { color: string }): import('react-native').TextStyle {
  return { color, fontSize: 9, fontWeight: '900', letterSpacing: 1, width: 48 };
}

export function ScoreRhythmLaneStyle3({ laneHeight }: { laneHeight: number }): import('react-native').ViewStyle {
  return { flex: 1, height: laneHeight, justifyContent: 'center' };
}

export function ScoreRhythmLaneStyle4({ laneHeight }: { laneHeight: number }): import('react-native').ViewStyle {
  return { height: laneHeight, justifyContent: 'center' };
}

export function ScoreRhythmLaneStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontVariant: ['tabular-nums'], width: 28, textAlign: 'right' };
}

export function ScoreRhythmLaneStyle6({ inset, colors }: { inset: number; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
        position: 'absolute',
        top: 1,
        bottom: 1,
        right: inset,
        width: 2,
        backgroundColor: colors.muted,
        opacity: 0.7,
      };
}

export function ScoreRhythmMeasureStyle1({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { position: 'relative', paddingHorizontal: compact ? 4 : 12, paddingVertical: compact ? 3 : 7, gap: compact ? 2 : 4 };
}

export function ScoreRhythmMeasureStyle2({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? 0 : 2 };
}

export function ScoreRhythmMeasureStyle3({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '800', letterSpacing: 1.1 };
}

export function ScoreRhythmMeasureStyle4({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 10 : 11, fontWeight: '800', fontVariant: ['tabular-nums'] };
}

export function ScrollingScoreRhythmStyle1({ width, minimal, size }: { width: number; minimal: boolean; size: import("@/rhythm/noteNotation").NoteNotationSize }): import('react-native').ViewStyle {
  return {
        position: 'relative',
        width,
        paddingHorizontal: 4,
        paddingVertical: minimal ? 0 : size === 'compact' ? 3 : 7,
        gap: size === 'compact' ? 2 : 4,
      };
}

export function ScrollingScoreRhythmStyle2({ size }: { size: import("@/rhythm/noteNotation").NoteNotationSize }): import('react-native').ViewStyle {
  return { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: size === 'compact' ? 0 : 2 };
}

export function ScrollingScoreRhythmStyle3({ colors, size }: { colors: import('@/theme').ThemeColors; size: import("@/rhythm/noteNotation").NoteNotationSize }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: size === 'compact' ? 10 : 11, fontWeight: '800', fontVariant: ['tabular-nums'] };
}

export function ScrollingScoreRhythmStyle4(): import('react-native').ViewStyle {
  return { flex: 1, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' };
}

export function ScrollingScoreRhythmStyle5({ labelColumnWidth, laneGap }: { labelColumnWidth: 0 | 46; laneGap: 2 | 0 | 4 }): import('react-native').ViewStyle {
  return { width: labelColumnWidth, gap: laneGap };
}

export function ScrollingScoreRhythmStyle6({ laneHeight }: { laneHeight: number }): import('react-native').ViewStyle {
  return { height: laneHeight, justifyContent: 'center' };
}

export function ScrollingScoreRhythmStyle7({ visibleHand, focusedColor, colors, compact }: { visibleHand: import("@/types/rhythm").Hand | undefined; focusedColor: string | undefined; colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: visibleHand ? focusedColor ?? colors.left : colors.left, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.6 };
}

export function ScrollingScoreRhythmStyle8({ laneHeight }: { laneHeight: number }): import('react-native').ViewStyle {
  return { height: laneHeight, justifyContent: 'center' };
}

export function ScrollingScoreRhythmStyle9({ visibleHand, focusedColor, colors, compact }: { visibleHand: import("@/types/rhythm").Hand | undefined; focusedColor: string | undefined; colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: visibleHand ? focusedColor ?? colors.right : colors.right, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.6 };
}

export function ScrollingScoreRhythmStyle10({ minimal, scoreRowsHeight, compact }: { minimal: boolean; scoreRowsHeight: number; compact: boolean }): import('react-native').ViewStyle {
  return {
          flex: 1,
          height: minimal ? scoreRowsHeight : undefined,
          overflow: 'hidden',
          paddingVertical: minimal ? 0 : compact ? 3 : 7,
        };
}

export function ScrollingScoreRhythmStyle11({ barWidth, visibleBars, translateX, fadeProgress }: { barWidth: number; visibleBars: { measure: import("@/types/importedScore").ScoreRhythmMeasure; number: number; sequence: number }[]; translateX: import("react-native").Animated.Value; fadeProgress: import("react-native").Animated.Value }): import('react-native').ViewStyle {
  return { width: barWidth * visibleBars.length, flexDirection: 'row', opacity: fadeProgress, transform: [{ translateX }] };
}

export function VexFlowNotationDOMStyle1({ plan }: { plan: import("@/rhythm/noteNotation").NoteNotationPlan }): import('react').CSSProperties {
  return {
        width: plan.width,
        height: plan.height,
        overflow: 'hidden',
        background: 'transparent',
      };
}

export function noteNotationDOMStyle(plan: import('@/rhythm/noteNotation').NoteNotationPlan, visualOffsetY: number): import('react').CSSProperties {
  return { position: 'absolute', left: 0, top: visualOffsetY, width: plan.width, height: plan.height, backgroundColor: 'transparent' };
}
