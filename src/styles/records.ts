export function recordsStyle1({ colors, isLast }: { colors: import('@/theme').ThemeColors; isLast: boolean }): import('react-native').ViewStyle {
  return { paddingHorizontal: 15, paddingVertical: 13, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: colors.line };
}

export function recordsStyle2(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 };
}

export function recordsStyle3(): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 };
}

export function recordsStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { flex: 1, minWidth: 0, color: colors.text, fontSize: 14, fontWeight: '800' };
}

export function recordsStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, marginTop: 4 };
}

export function recordsStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] };
}

export function recordsStyle7(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4, marginTop: 8 };
}

export function recordsStyle8({ record, colors, primaryHand }: { record: import("@/store/sessionHistory").SessionRecord; colors: import('@/theme').ThemeColors; primaryHand: "left" | "right" }): import('react-native').TextStyle {
  return { color: record.trainingMode === 'single-hand' ? colors.accent : primaryHand === 'left' ? colors.left : colors.right, fontSize: 11, fontWeight: '800' };
}

export function recordsStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.right, fontSize: 11, fontWeight: '800' };
}

export function recordsStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 11, fontWeight: '800' };
}

export function recordsStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, marginTop: 6 };
}

export function recordsStyle13({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, backgroundColor: colors.background };
}

export function recordsStyle14(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 };
}

export function recordsStyle15(): import('react-native').ViewStyle {
  return { minHeight: 44, justifyContent: 'center' };
}

export function recordsStyle16({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.7 };
}

export function recordsStyle17({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 };
}

export function recordsStyle18({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 31, fontWeight: '900', letterSpacing: -0.8 };
}

export function recordsStyle19({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 18 };
}

export function recordsStyle20({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, paddingVertical: 25 };
}

export function recordsStyle21({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { alignItems: 'center', padding: 28, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function recordsStyle22({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 16, fontWeight: '800' };
}

export function recordsStyle23({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 7, lineHeight: 18 };
}

export function recordsStyle24({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { marginTop: 15, minHeight: 42, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.left };
}

export function recordsStyle25({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 };
}

export function recordsStyle26({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'stretch', marginBottom: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 15, overflow: 'hidden' };
}

export function recordsStyle27(): import('react-native').ViewStyle {
  return { flex: 1, paddingHorizontal: 10, paddingVertical: 12 };
}

export function recordsStyle28({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 };
}

export function recordsStyle29({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 4 };
}

export function recordsStyle30(): import('react-native').ViewStyle {
  return { flex: 1, paddingHorizontal: 10, paddingVertical: 12 };
}

export function recordsStyle31({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 };
}

export function recordsStyle32({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 24, fontWeight: '900', marginTop: 4 };
}

export function recordsStyle33(): import('react-native').ViewStyle {
  return { flex: 1, paddingHorizontal: 10, paddingVertical: 12 };
}

export function recordsStyle34({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 };
}

export function recordsStyle35({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 24, fontWeight: '900', marginTop: 4 };
}

export function recordsStyle36({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 14, fontWeight: '900', marginBottom: 10 };
}

export function GameCenterChallengeCardStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 17, padding: 16, marginTop: 14 };
}

export function GameCenterChallengeCardStyle2(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 };
}

export function GameCenterChallengeCardStyle3(): import('react-native').ViewStyle {
  return { flex: 1 };
}

export function GameCenterChallengeCardStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.7 };
}

export function GameCenterChallengeCardStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 5 };
}

export function GameCenterChallengeCardStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.left, maxWidth: '38%', fontSize: 11, fontWeight: '800' };
}

export function GameCenterChallengeCardStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 11, lineHeight: 16, marginTop: 8 };
}

export function GameCenterChallengeCardStyle8({ pressed, colors, submitting }: { pressed: boolean; colors: import('@/theme').ThemeColors; submitting: boolean }): import('react-native').ViewStyle {
  return { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 14, marginTop: 13, borderRadius: 12, backgroundColor: pressed ? colors.surfaceRaised : colors.background, borderWidth: 1, borderColor: colors.line, opacity: submitting ? 0.6 : 1 };
}

export function GameCenterChallengeCardStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 0.7 };
}

export function GameCenterChallengeCardStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 9 };
}

export function GameCenterCourseProgressButtonStyle1(): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 0, marginTop: 8 };
}

export function GameCenterCourseProgressButtonStyle2({ colors, syncing, pressed }: { colors: import('@/theme').ThemeColors; syncing: boolean; pressed: boolean }): import('react-native').ViewStyle {
  return { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, opacity: syncing ? 0.6 : pressed ? 0.75 : 1 };
}

export function GameCenterCourseProgressButtonStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 };
}

export function GameCenterCourseProgressButtonStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 8, lineHeight: 11, marginTop: 4 };
}

export function GameCenterCourseProgressButtonStyle5({ hasError, colors }: { hasError: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: hasError ? colors.right : colors.muted, fontSize: 9, lineHeight: 13, marginTop: 4 };
}

export function recordsStyle37(): import('react-native').ViewStyle {
  return { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, maxWidth: 720, width: '100%', alignSelf: 'center' };
}

export function recordsStyle38({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 15, overflow: 'hidden' };
}

export function recordsStyle39({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 1, marginVertical: 10, backgroundColor: colors.line };
}

export function recordsStyle40(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignSelf: 'stretch' };
}

export function recordsStyle41({ colors, tone, active, pressed }: { colors: import('@/theme').ThemeColors; tone: 'favorite' | 'share' | 'replay'; active: boolean; pressed: boolean }): import('react-native').ViewStyle {
  const backgroundColor = tone === 'replay'
    ? colors.left
    : tone === 'favorite' && active
      ? colors.accent
      : colors.surfaceRaised;
  return { width: 62, alignItems: 'center', justifyContent: 'center', backgroundColor, opacity: pressed ? 0.72 : 1 };
}

export function recordsStyle42({ colors, tone, active }: { colors: import('@/theme').ThemeColors; tone: 'favorite' | 'share' | 'replay'; active: boolean }): import('react-native').TextStyle {
  const color = tone === 'replay'
    ? colors.background
    : tone === 'favorite' && active
      ? colors.background
      : tone === 'favorite'
        ? colors.accent
        : colors.text;
  return { color, fontSize: 25, fontWeight: '900' };
}

export function recordsStyle44(): import('react-native').ViewStyle {
  return { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18, backgroundColor: 'rgba(0, 0, 0, 0.62)' };
}

export function recordsStyle45({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: '100%', maxWidth: 760, maxHeight: '92%', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background };
}

export function recordsStyle46(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 };
}

export function recordsStyle47(): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 0 };
}

export function recordsStyle48({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 16, fontWeight: '900' };
}

export function recordsStyle49({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, marginTop: 5 };
}

export function recordsStyle50({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.surfaceRaised };
}

export function recordsStyle51({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 25, fontWeight: '800', lineHeight: 30 };
}

export function recordsStyle52({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 46, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 10, marginTop: 14, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.surfaceRaised };
}

export function recordsStyle53({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 14, fontWeight: '900' };
}

export function recordsStyle54(): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 0 };
}

export function recordsStyle55({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, marginTop: -5, marginBottom: 9 };
}
