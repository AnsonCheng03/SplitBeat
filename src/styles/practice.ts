import type { ViewStyle } from 'react-native';
import type { PracticeLayout, PracticePaneFrame } from '@/features/deviceLayout/practiceLayout';

export function practiceStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, backgroundColor: colors.background };
}

export function practiceStyle2(): import('react-native').ViewStyle {
  return { flex: 1 };
}

export function practiceStyle3(): import('react-native').ViewStyle {
  return { flex: 1 };
}

export function practiceStyle4({ insets }: { insets: import("react-native-safe-area-context").EdgeInsets }): import('react-native').ViewStyle {
  return { position: 'absolute', top: -insets.top, bottom: -insets.bottom, left: -insets.left, right: -insets.right };
}

export function PracticeDisplayPickerStyle1(): import('react-native').ViewStyle {
  return { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 };
}

export function PracticeDisplayPickerStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { width: 76, color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 };
}

export function PracticeDisplayPickerStyle3(): import('react-native').ViewStyle {
  return { flex: 1, flexDirection: 'row', gap: 8 };
}

export function PracticeDisplayPickerStyle4({ selected, colors, pressed }: { selected: boolean; colors: import('@/theme').ThemeColors; pressed: boolean }): import('react-native').ViewStyle {
  return {
                flex: 1,
                minHeight: 48,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: selected ? colors.surfaceRaised : colors.surface,
                borderWidth: 1,
                borderColor: selected ? colors.accent : colors.line,
                opacity: pressed ? 0.8 : 1,
              };
}

export function PracticeDisplayPickerStyle5({ selected, colors }: { selected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: selected ? colors.accent : colors.muted, fontSize: 12, fontWeight: '800' };
}

export function PracticeIntroOverlayStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.background };
}

export function PracticeIntroOverlayStyle2(): import('react-native').ViewStyle {
  return { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 };
}

export function PracticeIntroOverlayStyle3({ leftInset, rightInset, frame }: { leftInset: number; rightInset: number; frame?: PracticePaneFrame }): import('react-native').ViewStyle {
  return { position: 'absolute', top: frame?.top ?? 0, left: frame?.left ?? 0, width: frame?.width, height: frame?.height, bottom: frame ? undefined : 0, right: frame ? undefined : 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Math.max(28, leftInset + 28, rightInset + 28) };
}

export function PracticeIntroOverlayStyle4({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.2 };
}

export function PracticeIntroOverlayStyle5({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 18 : 22, fontWeight: '800', textAlign: 'center', marginTop: 9 };
}

export function PracticeIntroOverlayStyle6({ frame }: { frame: PracticePaneFrame }): import('react-native').ViewStyle {
  return { position: 'absolute', left: frame.left, top: frame.top, width: frame.width, height: frame.height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 };
}

export function PracticeIntroOverlayStyle7({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.left, fontSize: compact ? 12 : 15, fontWeight: '900', letterSpacing: 1.3, textAlign: 'center' };
}

export function PracticeIntroOverlayStyle8({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 14 : 19, fontWeight: '800', textAlign: 'center', marginTop: 9 };
}

export function PracticeIntroOverlayStyle9({ frame }: { frame: PracticePaneFrame }): import('react-native').ViewStyle {
  return { position: 'absolute', left: frame.left, top: frame.top, width: frame.width, height: frame.height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 };
}

export function PracticeIntroOverlayStyle10({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.right, fontSize: compact ? 12 : 15, fontWeight: '900', letterSpacing: 1.3, textAlign: 'center' };
}

export function PracticeIntroOverlayStyle11({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 14 : 19, fontWeight: '800', textAlign: 'center', marginTop: 9 };
}

export function PracticeIntroOverlayStyle12({ colors, layout }: { colors: import('@/theme').ThemeColors; layout: PracticeLayout }): import('react-native').ViewStyle {
  if (layout.division) return { opacity: 0 };
  return layout.axis === 'horizontal'
    ? { position: 'absolute', top: '22%', bottom: '22%', left: '50%', width: 1, backgroundColor: colors.line, opacity: 0.9 }
    : { position: 'absolute', left: '22%', right: '22%', top: '50%', height: 1, backgroundColor: colors.line, opacity: 0.9 };
}

export function PracticeIntroOverlayStyle13({ bottomInset, width }: { bottomInset: number; width: number }): import('react-native').ViewStyle {
  return { position: 'absolute', left: 12, width: Math.max(0, width - 24), bottom: Math.max(20, bottomInset + 14), alignItems: 'center' };
}

export function PracticeIntroOverlayStyle14({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.4, textAlign: 'center' };
}

export function PracticeIntroOverlayStyle15({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.danger, fontSize: 11, textAlign: 'center', marginTop: 10 };
}

export function PracticeOverlayBackdropStyle1({ light }: { light: boolean }): import('react-native').ViewStyle {
  return { backgroundColor: light ? 'rgba(248, 248, 245, 0.56)' : 'rgba(7, 10, 14, 0.32)' };
}

export function PracticePauseOverlaysStyle1({ insets }: { insets: import("react-native-safe-area-context").EdgeInsets }): import('react-native').ViewStyle {
  return { position: 'absolute', top: Math.max(insets.top + 52, 58), left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16 };
}

export function PracticePauseOverlaysStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: '100%', maxWidth: 520, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent };
}

export function PracticePauseOverlaysStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'center' };
}

export function PracticePauseOverlaysStyle4(): import('react-native').ViewStyle {
  return { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8 };
}

export function PracticePauseOverlaysStyle5({ colors, pauseActionLoading }: { colors: import('@/theme').ThemeColors; pauseActionLoading: boolean }): import('react-native').ViewStyle {
  return { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.accent, opacity: pauseActionLoading ? 0.5 : 1 };
}

export function PracticePauseOverlaysStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 };
}

export function PracticePauseOverlaysStyle7(): import('react-native').ViewStyle {
  return { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 };
}

export function PracticePauseOverlaysStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 };
}

export function PracticePauseOverlaysStyle9({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { width: '100%', maxWidth: 460, alignItems: 'center', paddingHorizontal: compact ? 8 : 16 };
}

export function PracticePauseOverlaysStyle10({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: compact ? 12 : 14, fontWeight: '900', letterSpacing: 1.6 };
}

export function PracticePauseOverlaysStyle11({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 17 : 22, lineHeight: compact ? 23 : 29, fontWeight: '800', textAlign: 'center', marginTop: 10 };
}

export function PracticePauseOverlaysStyle12(): import('react-native').ViewStyle {
  return { minHeight: 46, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginTop: 14 };
}

export function PracticePauseOverlaysStyle13({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 };
}

export function PracticePauseOverlaysStyle14({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 54, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginTop: 20, borderRadius: 14, backgroundColor: colors.accent };
}

export function PracticePauseOverlaysStyle15({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 14, fontWeight: '900', letterSpacing: 1.1 };
}

export function PracticePauseOverlaysStyle16(): import('react-native').ViewStyle {
  return { minHeight: 44, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4 };
}

export function PracticePauseOverlaysStyle17({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, fontWeight: '900', letterSpacing: 1 };
}

export function PracticePauseOverlaysStyle18({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { width: '100%', maxWidth: 700, paddingHorizontal: compact ? 8 : 20, paddingVertical: compact ? 4 : 10 };
}

export function PracticePauseOverlaysStyle19({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? 8 : 12 };
}

export function PracticePauseOverlaysStyle20({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 18 : 22, fontWeight: '900', letterSpacing: 1 };
}

export function PracticePauseOverlaysStyle21({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: compact ? 13 : 16, fontWeight: '900', fontVariant: ['tabular-nums'] };
}

export function PracticePauseOverlaysStyle22({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { paddingHorizontal: 13, paddingVertical: 10, marginBottom: 7, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent };
}

export function PracticePauseOverlaysStyle23({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 11, lineHeight: 16, fontWeight: '700' };
}

export function PracticePauseOverlaysStyle24({ colors, pauseActionLoading }: { colors: import('@/theme').ThemeColors; pauseActionLoading: boolean }): import('react-native').ViewStyle {
  return { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', marginTop: 5, paddingHorizontal: 10, borderRadius: 9, backgroundColor: colors.accent, opacity: pauseActionLoading ? 0.5 : 1 };
}

export function PracticePauseOverlaysStyle25({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 };
}

export function PracticePauseOverlaysStyle26({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 };
}

export function PracticePauseOverlaysStyle27({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { paddingVertical: compact ? 7 : 10, marginBottom: compact ? 8 : 12 };
}

export function PracticePauseOverlaysStyle28(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' };
}

export function PracticePauseOverlaysStyle29({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 1.2 };
}

export function PracticePauseOverlaysStyle30({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: compact ? 9 : 10 };
}

export function PracticePauseOverlaysStyle31({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: compact ? 6 : 9 };
}

export function PracticePauseOverlaysStyle32({ compact, colors, maxRewindBars, rewindBars }: { compact: boolean; colors: import('@/theme').ThemeColors; maxRewindBars: number; rewindBars: number }): import('react-native').ViewStyle {
  return { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: maxRewindBars === 0 || rewindBars <= 1 ? 0.4 : 1 };
}

export function PracticePauseOverlaysStyle33({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 22, fontWeight: '700' };
}

export function PracticePauseOverlaysStyle34({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { minWidth: 84, color: colors.text, fontSize: compact ? 12 : 14, fontWeight: '900', textAlign: 'center' };
}

export function PracticePauseOverlaysStyle35({ compact, colors, maxRewindBars, rewindBars }: { compact: boolean; colors: import('@/theme').ThemeColors; maxRewindBars: number; rewindBars: number }): import('react-native').ViewStyle {
  return { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: maxRewindBars === 0 || rewindBars >= maxRewindBars ? 0.4 : 1 };
}

export function PracticePauseOverlaysStyle36({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 22, fontWeight: '700' };
}

export function PracticePauseOverlaysStyle37({ compact, colors, maxRewindBars, pauseActionLoading }: { compact: boolean; colors: import('@/theme').ThemeColors; maxRewindBars: number; pauseActionLoading: boolean }): import('react-native').ViewStyle {
  return { flex: 1, minHeight: compact ? 36 : 42, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', opacity: maxRewindBars === 0 || pauseActionLoading ? 0.4 : 1 };
}

export function PracticePauseOverlaysStyle38({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: compact ? 10 : 11, fontWeight: '900', letterSpacing: 0.8 };
}

export function PracticePauseOverlaysStyle39({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: compact ? 8 : 9, marginTop: 5 };
}

export function PracticePauseOverlaysStyle40({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { paddingVertical: compact ? 7 : 10 };
}

export function PracticePauseOverlaysStyle41(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' };
}

export function PracticePauseOverlaysStyle42({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 1.2 };
}

export function PracticePauseOverlaysStyle43({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 15 : 18, fontWeight: '900', fontVariant: ['tabular-nums'] };
}

export function PracticePauseOverlaysStyle44({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: compact ? 2 : 5 };
}

export function PracticePauseOverlaysStyle45({ colors, bpmDraft }: { colors: import('@/theme').ThemeColors; bpmDraft: number }): import('react-native').ViewStyle {
  return { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: bpmDraft <= 40 ? 0.4 : 1 };
}

export function PracticePauseOverlaysStyle46({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 20, fontWeight: '700' };
}

export function PracticePauseOverlaysStyle47(): import('react-native').ViewStyle {
  return { flex: 1, height: 44 };
}

export function PracticePauseOverlaysStyle48({ colors, bpmDraft }: { colors: import('@/theme').ThemeColors; bpmDraft: number }): import('react-native').ViewStyle {
  return { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: bpmDraft >= 200 ? 0.4 : 1 };
}

export function PracticePauseOverlaysStyle49({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 20, fontWeight: '700' };
}

export function PracticePauseOverlaysStyle50({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: compact ? 8 : 9, marginTop: 2 };
}

export function PracticePauseOverlaysStyle51({ compact, colors, pauseActionLoading }: { compact: boolean; colors: import('@/theme').ThemeColors; pauseActionLoading: boolean }): import('react-native').ViewStyle {
  return { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingHorizontal: 15, marginTop: 5, borderRadius: 10, backgroundColor: colors.accent, opacity: pauseActionLoading ? 0.5 : 1 };
}

export function PracticePauseOverlaysStyle52({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.8 };
}

export function PracticePauseOverlaysStyle53({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flexDirection: 'row', gap: 9, marginTop: compact ? 8 : 12 };
}

export function PracticePauseOverlaysStyle54({ compact, colors, pauseActionLoading }: { compact: boolean; colors: import('@/theme').ThemeColors; pauseActionLoading: boolean }): import('react-native').ViewStyle {
  return { flex: 1, minHeight: compact ? 42 : 50, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', opacity: pauseActionLoading ? 0.5 : 1 };
}

export function PracticePauseOverlaysStyle55({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: compact ? 11 : 13, fontWeight: '900', letterSpacing: 1 };
}

export function PracticePauseOverlaysStyle56({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flex: 1, minHeight: compact ? 42 : 50, alignItems: 'center', justifyContent: 'center' };
}

export function PracticePauseOverlaysStyle57({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 10 : 12, fontWeight: '900', letterSpacing: 0.8 };
}

export function PracticePauseOverlaysStyle58({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flexDirection: 'row', justifyContent: 'space-between', marginTop: compact ? 2 : 5 };
}

export function PracticePauseOverlaysStyle59(): import('react-native').ViewStyle {
  return { minHeight: 40, justifyContent: 'center', paddingHorizontal: 8 };
}

export function PracticePauseOverlaysStyle60({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.8 };
}

export function PracticePauseOverlaysStyle61(): import('react-native').ViewStyle {
  return { minHeight: 40, justifyContent: 'center', paddingHorizontal: 8 };
}

export function PracticePauseOverlaysStyle62({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 0.8 };
}

export function PracticeRhythmDisplayStyle1({ leftInset, rightInset, scoreDisplayTop, scoreDisplayHeight, colors }: { leftInset: number; rightInset: number; scoreDisplayTop: number; scoreDisplayHeight: number; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { position: 'absolute', top: 0, left: -leftInset, right: -rightInset, height: scoreDisplayTop + scoreDisplayHeight, backgroundColor: colors.surface };
}

export function PracticeRhythmDisplayStyle2({ isScoreDisplay, isScoreFocusDisplay, colors, layout }: { isScoreDisplay: boolean; isScoreFocusDisplay: boolean; colors: import('@/theme').ThemeColors; layout: PracticeLayout }): import('react-native').ViewStyle {
  const scorePane = isScoreDisplay && layout.division ? layout.leftHand : undefined;
  return {
    position: 'absolute',
    left: scorePane?.left ?? 0,
    right: scorePane ? undefined : 0,
    width: scorePane?.width,
    top: scorePane?.top,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isScoreDisplay && !isScoreFocusDisplay ? colors.surface : 'transparent',
  };
}

export function PracticeRhythmDisplayStyle3({ isScoreDisplay, scoreContentMargin, layout }: { isScoreDisplay: boolean; scoreContentMargin: number; layout: PracticeLayout }): import('react-native').ViewStyle {
  if (isScoreDisplay) return { flex: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: scoreContentMargin };
  if (layout.division) return { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 };
  return {
    flex: 1,
    flexDirection: layout.axis === 'horizontal' ? 'row' : 'column',
    alignItems: 'center',
  };
}

export function PracticeRhythmDisplayStyle4(): import('react-native').ViewStyle {
  return { flex: 1, flexDirection: 'row', alignItems: 'center' };
}

export function PracticeRhythmDisplayStyle5(): import('react-native').ViewStyle {
  return { flex: 1, justifyContent: 'center' };
}

export function PracticeRhythmDisplayStyle6({ compact, frame }: { compact: boolean; frame?: PracticePaneFrame }): import('react-native').ViewStyle {
  if (frame) return { position: 'absolute', left: frame.left, top: frame.top, width: frame.width, height: frame.height, alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10 };
  return { flex: 1, alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10 };
}

export function PracticeRhythmDisplayStyle7({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: compact ? 11 : 14, fontWeight: '900', letterSpacing: 2 };
}

export function PracticeRhythmDisplayStyle8({ compact, enabled, frame }: { compact: boolean; enabled: boolean; frame?: PracticePaneFrame }): import('react-native').ViewStyle {
  if (frame) return { position: 'absolute', left: frame.left, top: frame.top, width: frame.width, height: frame.height, alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10, opacity: enabled ? 1 : 0.12 };
  return { flex: 1, alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 10, opacity: enabled ? 1 : 0.12 };
}

export function PracticeRhythmDisplayStyle9({ hand, colors, compact }: { hand: "left" | "right"; colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: hand === 'left' ? colors.left : colors.right, fontSize: compact ? 11 : 14, fontWeight: '900', letterSpacing: 2 };
}

export function PracticeStatusBarStyle1({ safeTopInset, snapshot, compact, leftInset, rightInset }: { safeTopInset: number; snapshot: import("@/types/rhythm").SessionSnapshot | null; compact: boolean; leftInset: number; rightInset: number }): import('react-native').ViewStyle {
  return { position: 'absolute', top: safeTopInset, left: 0, right: 0, minHeight: snapshot?.resumeCountIn ? (compact ? 48 : 58) : compact ? 42 : 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: Math.max(compact ? 13 : 22, leftInset + 12), paddingRight: Math.max(compact ? 13 : 22, rightInset + 12) };
}

export function PracticeStatusBarStyle2({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: compact ? 11 : 12, fontWeight: '800', letterSpacing: 1 };
}

export function PracticeStatusBarStyle3({ snapshot, width, compact, layout }: { snapshot: import("@/types/rhythm").SessionSnapshot | null; width: number; compact: boolean; layout: PracticeLayout }): import('react-native').ViewStyle {
  const keepCounterInsideLeftPane = layout.axis === 'horizontal' && layout.division;
  const availableWidth = keepCounterInsideLeftPane ? layout.leftHand.width : width;
  const counterWidth = Math.min(
    availableWidth,
    snapshot?.resumeCountIn ? Math.min(520, Math.max(200, availableWidth * 0.5)) : 90,
  );
  return {
    position: keepCounterInsideLeftPane ? 'absolute' : undefined,
    left: keepCounterInsideLeftPane ? layout.leftHand.left : undefined,
    width: keepCounterInsideLeftPane ? layout.leftHand.width : undefined,
    top: keepCounterInsideLeftPane ? 0 : undefined,
    bottom: keepCounterInsideLeftPane ? 0 : undefined,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: counterWidth,
    minHeight: snapshot?.resumeCountIn ? (compact ? 48 : 58) : 38,
  };
}

export function PracticeStatusBarStyle4({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: compact ? 7 : 9, fontWeight: '900', letterSpacing: 1.2 };
}

export function PracticeStatusBarStyle5({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { maxWidth: '100%', color: colors.text, fontSize: compact ? 8 : 10, lineHeight: compact ? 11 : 13, fontWeight: '800', textAlign: 'center' };
}

export function PracticeStatusBarStyle6({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { alignItems: 'flex-end', justifyContent: 'center', minWidth: compact ? 74 : 112 };
}

export function PracticeStatusBarStyle7({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: compact ? 8 : 10, lineHeight: compact ? 11 : 13, fontWeight: '900', letterSpacing: 0.8 };
}

export function PracticeStatusBarStyle8({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: compact ? 7 : 9, lineHeight: compact ? 9 : 11, fontWeight: '900', letterSpacing: compact ? 0.5 : 0.8 };
}

export function PracticeStatusBarStyle9({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end', minHeight: compact ? 25 : 34, gap: compact ? 4 : 7 };
}

export function PracticeStatusBarStyle10({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: compact ? 21 : 30, lineHeight: compact ? 25 : 34, fontWeight: '900', fontVariant: ['tabular-nums'] };
}

export function PracticeStatusBarStyle11({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: compact ? 9 : 11, fontWeight: '900', letterSpacing: 1 };
}

export function PracticeTapZonesStyle1(): import('react-native').ViewStyle {
  return { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 };
}

export function PracticeTapZonesStyle2(): import('react-native').ViewStyle {
  return { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 };
}

export function PracticeTapZonesStyle3({ frame }: { frame: PracticePaneFrame }): import('react-native').ViewStyle {
  return { position: 'absolute', left: frame.left, top: frame.top, width: frame.width, height: frame.height };
}

export function PracticeTapZonesStyle4({ colors, layout }: { colors: import('@/theme').ThemeColors; layout: PracticeLayout }): import('react-native').ViewStyle {
  if (layout.division) return { opacity: 0 };
  return layout.axis === 'horizontal'
    ? { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: colors.line, opacity: 0.65 }
    : { position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: colors.line, opacity: 0.65 };
}

export function TapZoneStyle1({ minimal, compact, pressed, pressedBackground, restingBackground, accent, restingBorder, enabled, missed }: { minimal: boolean; compact: boolean; pressed: boolean; pressedBackground: string; restingBackground: string; accent: string; restingBorder: string; enabled: boolean; missed: boolean }): import('react-native').ViewStyle {
  return {
          flex: 1,
          minHeight: minimal ? 0 : compact ? 90 : 180,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? pressedBackground : restingBackground,
          borderColor: pressed ? accent : restingBorder,
          borderWidth: minimal ? 0 : 1,
          borderRadius: minimal ? 0 : 18,
          marginHorizontal: minimal ? 0 : 4,
          transform: minimal ? undefined : [{ scale: pressed ? 0.985 : 1 }],
          opacity: enabled ? 1 : missed ? 0.82 : 0.44,
        };
}

export function TapZoneStyle2({ minimal, accent, beatFlashOpacity }: { minimal: boolean; accent: string; beatFlashOpacity: import("react-native").Animated.Value }): import('react-native').ViewStyle {
  return { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: minimal ? 0 : 18, backgroundColor: accent, opacity: beatFlashOpacity };
}

export function TapZoneStyle3({ minimal, tapResultColor, colors, tapResultOpacity }: { minimal: boolean; tapResultColor: import("@/rhythm/flashSource").TapResultFlash | null; colors: import('@/theme').ThemeColors; tapResultOpacity: import("react-native").Animated.Value }): import('react-native').ViewStyle {
  return { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: minimal ? 0 : 18, backgroundColor: tapResultColor === 'correct' ? colors.left : colors.danger, opacity: tapResultOpacity };
}

export function TapZoneStyle4({ accent, compact }: { accent: string; compact: boolean }): import('react-native').TextStyle {
  return { color: accent, fontSize: compact ? 11 : 12, fontWeight: '800', letterSpacing: 2 };
}

export function TapZoneStyle5({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 18 : 21, fontWeight: '700', marginTop: 6 };
}

export function TapZoneStyle6({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return {
              color: colors.muted,
              fontSize: compact ? 7 : 8,
              fontWeight: '700',
              letterSpacing: 0.1,
              marginTop: 4,
            };
}

export function TapZoneStyle7({ accent, compact }: { accent: string; compact: boolean }): import('react-native').TextStyle {
  return { position: 'absolute', top: '58%', left: 0, right: 0, color: accent, fontSize: compact ? 11 : 13, fontWeight: '900', letterSpacing: 2, opacity: 0.7, textAlign: 'center' };
}

export function TapZoneStyle8({ compact, colors, tapResultOpacity }: { compact: boolean; colors: import('@/theme').ThemeColors; tapResultOpacity: import("react-native").Animated.Value }): import('react-native').TextStyle {
  return {
            position: 'absolute',
            top: compact ? 8 : 11,
            right: 10,
            color: colors.danger,
            fontSize: 8,
            fontWeight: '900',
            letterSpacing: 0.7,
            opacity: tapResultOpacity.interpolate({ inputRange: [0, 0.5], outputRange: [0, 1] }),
          };
}

export function TapZoneStyle9({ compact, accent, pressed }: { compact: boolean; accent: string; pressed: boolean }): import('react-native').ViewStyle {
  return {
            position: 'absolute',
            bottom: compact ? 12 : 16,
            width: 30,
            height: 3,
            borderRadius: 4,
            backgroundColor: accent,
            opacity: pressed ? 1 : 0.5,
          };
}

export const practiceOverlayContentStyle: ViewStyle = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
};

export function PracticePauseOverlaysStyle63({ insets }: { insets: import("react-native-safe-area-context").EdgeInsets }): import('react-native').ViewStyle {
  return { paddingHorizontal: Math.max(24, insets.left + 24, insets.right + 24), paddingVertical: Math.max(12, insets.top + 8, insets.bottom + 8) };
}

export function PracticePauseOverlaysStyle64({ insets }: { insets: import("react-native-safe-area-context").EdgeInsets }): import('react-native').ViewStyle {
  return { paddingHorizontal: Math.max(16, insets.left + 16, insets.right + 16), paddingVertical: Math.max(10, insets.top + 8, insets.bottom + 8) };
}
