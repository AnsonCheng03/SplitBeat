export function tutorialStyleOverlay(): import('react-native').ViewStyle {
  return { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 16, backgroundColor: 'rgba(5, 8, 14, 0.76)' };
}

export function tutorialStyleCard({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').ViewStyle {
  return { width: '100%', maxWidth: 680, paddingHorizontal: compact ? 18 : 24, paddingVertical: compact ? 14 : 20, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function tutorialStyleHoldTarget({ top, left, colors }: { top: number; left: number; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { position: 'absolute', zIndex: 2, top, left, width: 120, minHeight: 48, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface };
}

export function tutorialStyleHoldLabel({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' };
}

export function tutorialStyleHoldTrack({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { height: 3, marginTop: 5, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.line };
}

export function tutorialStyleHoldFill({ colors, progress }: { colors: import('@/theme').ThemeColors; progress: number }): import('react-native').ViewStyle {
  return { width: `${Math.min(1, Math.max(0, progress)) * 100}%`, height: '100%', backgroundColor: colors.accent };
}

export function tutorialStyleHeader({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { minHeight: compact ? 22 : 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 };
}

export function tutorialStyleStepTitle({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 };
}

export function tutorialStyleBeatCount({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] };
}

export function tutorialStyleIntroTitle({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 20 : 23, lineHeight: compact ? 24 : 28, fontWeight: '900', letterSpacing: -0.3, marginTop: compact ? 3 : 7 };
}

export function tutorialStyleIntroDescription({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: compact ? 12 : 14, lineHeight: compact ? 17 : 20, marginTop: compact ? 3 : 5 };
}

export function tutorialStylePreview({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').ViewStyle {
  return { minHeight: compact ? 88 : 112, marginTop: compact ? 8 : 15, paddingHorizontal: compact ? 10 : 16, paddingVertical: compact ? 5 : 10, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line };
}

export function tutorialStylePreviewCurrentTitle({ color, compact }: { color: string; compact: boolean }): import('react-native').TextStyle {
  return { color, fontSize: compact ? 9 : 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 2 };
}

export function tutorialStylePreviewCurrentNote({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { width: 120, height: compact ? 58 : 72, alignItems: 'center', justifyContent: 'center' };
}

export function tutorialStylePreviewMeasure(): import('react-native').ViewStyle {
  return { width: '100%', maxWidth: 460, minHeight: 82, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' };
}

export function tutorialStylePreviewMeasureBarline({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').ViewStyle {
  return { width: 2, height: compact ? 50 : 66, backgroundColor: colors.muted, opacity: 0.65 };
}

export function tutorialStylePreviewBeat({ current, colors, handColor, compact }: { current: boolean; colors: import('@/theme').ThemeColors; handColor: string; compact: boolean }): import('react-native').ViewStyle {
  return { flex: 1, minWidth: compact ? 44 : 54, minHeight: compact ? 60 : 74, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: current ? handColor : 'transparent', backgroundColor: current ? colors.surfaceRaised : 'transparent' };
}

export function tutorialStylePreviewBeatLabel({ current, colors, compact }: { current: boolean; colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: current ? colors.text : colors.muted, fontSize: compact ? 8 : 9, fontWeight: '800', marginBottom: -2 };
}

export function tutorialStylePreviewNoteCell({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { width: compact ? 42 : 50, height: compact ? 44 : 56, alignItems: 'center', justifyContent: 'center' };
}

export function tutorialStyleHint({ colors, hand, compact }: { colors: import('@/theme').ThemeColors; hand: import('@/types/rhythm').Hand; compact: boolean }): import('react-native').TextStyle {
  return { color: hand === 'left' ? colors.left : colors.right, minHeight: compact ? 20 : 22, marginTop: compact ? 7 : 13, fontSize: compact ? 12 : 14, lineHeight: compact ? 17 : 20, fontWeight: '900', textAlign: 'center' };
}

export function tutorialStyleFeedback({ colors, retry, compact }: { colors: import('@/theme').ThemeColors; retry: boolean; compact: boolean }): import('react-native').TextStyle {
  return { color: retry ? colors.danger : colors.muted, minHeight: compact ? 17 : 20, marginTop: 1, fontSize: compact ? 10 : 12, lineHeight: compact ? 14 : 18, fontWeight: '700', textAlign: 'center' };
}

export function tutorialStylePracticeActions({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 12, marginTop: compact ? 6 : 10 };
}

export function tutorialStylePracticeButton({ colors, hand, pressed, compact }: { colors: import('@/theme').ThemeColors; hand: import('@/types/rhythm').Hand; pressed: boolean; compact: boolean }): import('react-native').ViewStyle {
  const handColor = hand === 'left' ? colors.left : colors.right;
  return { flex: 1, minHeight: compact ? 42 : 50, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: handColor, backgroundColor: colors.background, opacity: pressed ? 0.7 : 1 };
}

export function tutorialStylePracticeButtonLabel({ colors, hand }: { colors: import('@/theme').ThemeColors; hand: import('@/types/rhythm').Hand }): import('react-native').TextStyle {
  return { color: hand === 'left' ? colors.left : colors.right, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 };
}

export function tutorialStyleActions({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { alignItems: 'center', marginTop: compact ? 8 : 17 };
}

export function tutorialStyleAction({ colors, pressed, compact }: { colors: import('@/theme').ThemeColors; pressed: boolean; compact: boolean }): import('react-native').ViewStyle {
  return { width: '100%', minHeight: compact ? 42 : 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: 13, backgroundColor: colors.accent, opacity: pressed ? 0.78 : 1 };
}

export function tutorialStyleActionLabel({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 13, fontWeight: '900', letterSpacing: 0.4 };
}
