import type { ViewStyle, TextStyle } from 'react-native';
import type { ThemeColors } from '@/theme';
import type { Hand } from '@/types/rhythm';

export function tutorialStyleOverlay({ colors }: { colors: ThemeColors }): ViewStyle {
  return {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    elevation: 1000,
    overflow: 'hidden',
    backgroundColor: colors.background,
  };
}

export function tutorialStyleContent(): ViewStyle {
  return { flex: 1, width: '100%' };
}

export function tutorialStyleHoldTarget({ top, left, pressed }: { top: number; left: number; pressed: boolean }): ViewStyle {
  return {
    position: 'absolute',
    zIndex: 2,
    top,
    left,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'transparent',
    opacity: pressed ? 0.72 : 1,
  };
}

export function tutorialStyleHoldIcon(): ViewStyle {
  return { width: 26, height: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 };
}

export function tutorialStyleHoldTriangle({ colors }: { colors: ThemeColors }): ViewStyle {
  return {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.muted,
  };
}

export function tutorialStyleHoldEndBar({ colors }: { colors: ThemeColors }): ViewStyle {
  return { width: 2, height: 12, borderRadius: 1, backgroundColor: colors.muted };
}

export function tutorialStyleHoldTrack({ colors }: { colors: ThemeColors }): ViewStyle {
  return { width: 28, height: 3, marginTop: 5, borderRadius: 2, overflow: 'hidden', backgroundColor: colors.line };
}

export function tutorialStyleHoldFill({ colors, progress }: { colors: ThemeColors; progress: number }): ViewStyle {
  return { width: `${Math.min(1, Math.max(0, progress)) * 100}%`, height: '100%', backgroundColor: colors.accent };
}

export function tutorialStylePracticeStage(): ViewStyle {
  return { flex: 1 };
}

export function tutorialStyleHandSurface({ hand, colors }: { hand: Hand; colors: ThemeColors }): ViewStyle {
  return {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: hand === 'left' ? 0 : '50%',
    right: hand === 'left' ? '50%' : 0,
    backgroundColor: hand === 'left' ? colors.leftSurface : colors.rightSurface,
  };
}

export function tutorialStyleDivider({ colors }: { colors: ThemeColors }): ViewStyle {
  return {
    position: 'absolute',
    top: '13%',
    bottom: '13%',
    left: '50%',
    width: 1,
    marginLeft: -0.5,
    backgroundColor: colors.line,
    opacity: 0.55,
  };
}

export function tutorialStyleTapTarget({ hand, colors, pressed }: { hand: Hand; colors: ThemeColors; pressed: boolean }): ViewStyle {
  return {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: hand === 'left' ? 0 : '50%',
    right: hand === 'left' ? '50%' : 0,
    backgroundColor: pressed ? (hand === 'left' ? colors.leftPressed : colors.rightPressed) : 'transparent',
  };
}

export function tutorialStyleTopCounter({ top }: { top: number }): ViewStyle {
  return {
    position: 'absolute',
    top,
    left: '50%',
    width: 220,
    marginLeft: -110,
    alignItems: 'center',
  };
}

export function tutorialStyleTopLabel({ top, rightInset }: { top: number; rightInset: number }): ViewStyle {
  return {
    position: 'absolute',
    top,
    right: Math.max(20, rightInset + 12),
    alignItems: 'flex-end',
    gap: 4,
  };
}

export function tutorialStyleStepTitle({ colors }: { colors: ThemeColors }): TextStyle {
  return { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 };
}

export function tutorialStyleModeTitle({ colors, compact }: { colors: ThemeColors; compact: boolean }): TextStyle {
  return { color: colors.text, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.2 };
}

export function tutorialStyleNotationLayer({ topInset, bottomInset, compact }: { topInset: number; bottomInset: number; compact: boolean }): ViewStyle {
  return {
    position: 'absolute',
    top: topInset + (compact ? 48 : 58),
    right: 0,
    bottom: bottomInset + (compact ? 64 : 78),
    left: 0,
    alignItems: 'stretch',
    justifyContent: 'center',
  };
}

export function tutorialStylePreview({ compact }: { compact: boolean }): ViewStyle {
  return { width: '100%', flex: 1, minHeight: compact ? 110 : 150, alignItems: 'center', justifyContent: 'center' };
}

export function tutorialStylePreviewHands(): ViewStyle {
  return { width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center' };
}

export function tutorialStylePreviewHand(): ViewStyle {
  return { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', gap: 14 };
}

export function tutorialStylePreviewCurrentTitle({ color, compact }: { color: string; compact: boolean }): TextStyle {
  return { color, fontSize: compact ? 11 : 14, fontWeight: '900', letterSpacing: 2 };
}

export function tutorialStylePreviewCurrentNote({ compact }: { compact: boolean }): ViewStyle {
  return {
    width: compact ? 120 : 170,
    height: compact ? 112 : 156,
    alignItems: 'center',
    justifyContent: 'center',
  };
}

export function tutorialStyleScorePreview({ compact }: { compact: boolean }): ViewStyle {
  return { width: '88%', maxWidth: 1060, height: compact ? 100 : 124, alignSelf: 'center' };
}

export function tutorialStylePrompt({ bottom, compact }: { bottom: number; compact: boolean }): ViewStyle {
  return {
    position: 'absolute',
    right: 24,
    bottom,
    left: 24,
    alignItems: 'center',
    minHeight: compact ? 40 : 48,
    justifyContent: 'center',
  };
}

export function tutorialStyleHint({ colors, hand, compact }: { colors: ThemeColors; hand: Hand; compact: boolean }): TextStyle {
  return {
    color: hand === 'left' ? colors.left : colors.right,
    fontSize: compact ? 13 : 16,
    lineHeight: compact ? 18 : 22,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
  };
}

export function tutorialStyleFeedback({ colors, retry, compact }: { colors: ThemeColors; retry: boolean; compact: boolean }): TextStyle {
  return {
    color: retry ? colors.danger : colors.muted,
    minHeight: compact ? 15 : 19,
    marginTop: 3,
    fontSize: compact ? 10 : 12,
    lineHeight: compact ? 14 : 17,
    fontWeight: '700',
    textAlign: 'center',
  };
}

export function tutorialStyleTransitionStage({ topInset, bottomInset }: { topInset: number; bottomInset: number }): ViewStyle {
  return { flex: 1, justifyContent: 'space-between', paddingTop: topInset + 60, paddingBottom: bottomInset + 18, paddingHorizontal: 24 };
}

export function tutorialStyleTransitionBody(): ViewStyle {
  return { flex: 1, width: '100%', maxWidth: 1080, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' };
}

export function tutorialStyleTransitionTitle({ colors, compact }: { colors: ThemeColors; compact: boolean }): TextStyle {
  return { color: colors.text, fontSize: compact ? 23 : 30, lineHeight: compact ? 28 : 36, fontWeight: '900', letterSpacing: -0.4, textAlign: 'center' };
}

export function tutorialStyleTransitionDescription({ colors, compact }: { colors: ThemeColors; compact: boolean }): TextStyle {
  return { maxWidth: 760, color: colors.muted, fontSize: compact ? 12 : 15, lineHeight: compact ? 17 : 22, marginTop: 8, textAlign: 'center' };
}

export function tutorialStyleActions(): ViewStyle {
  return { width: '100%', maxWidth: 700, alignSelf: 'center' };
}

export function tutorialStyleAction({ colors, pressed, compact }: { colors: ThemeColors; pressed: boolean; compact: boolean }): ViewStyle {
  return {
    width: '100%',
    minHeight: compact ? 48 : 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: colors.accent,
    opacity: pressed ? 0.8 : 1,
  };
}

export function tutorialStyleActionLabel({ colors }: { colors: ThemeColors }): TextStyle {
  return { color: colors.background, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 };
}
