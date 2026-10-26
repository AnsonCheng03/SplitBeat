export function learnStyle1({ detailWidth, insets, colors }: { detailWidth: number; insets: import("react-native-safe-area-context").EdgeInsets; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: detailWidth + insets.left,
            borderRightWidth: 1,
            borderRightColor: colors.line,
            backgroundColor: colors.surface,
          };
}

export function learnStyle2({ detailWidth }: { detailWidth: number }): import('react-native').ViewStyle {
  return { width: detailWidth, flexGrow: 0, backgroundColor: 'transparent' };
}

export function learnStyle3(): import('react-native').ViewStyle {
  return { minHeight: 44, justifyContent: 'center' };
}

export function learnStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.9 };
}

export function learnStyle5({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: compact ? 7 : 15 };
}

export function learnStyle6({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 24 : 30, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 };
}

export function learnStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 };
}

export function learnStyle8({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { marginTop: compact ? 13 : 20 };
}

export function learnStyle9(): import('react-native').ViewStyle {
  return { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' };
}

export function learnStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 };
}

export function learnStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 11, fontWeight: '900' };
}

export function learnStyle12({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { height: 5, borderRadius: 4, backgroundColor: colors.line, marginTop: 8, overflow: 'hidden' };
}

export function learnStyle13({ lessonProgressPercent, completedLessonIds, colors }: { lessonProgressPercent: (completedLessonIds: readonly string[]) => number; completedLessonIds: string[]; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: `${lessonProgressPercent(completedLessonIds)}%`, height: 5, borderRadius: 4, backgroundColor: colors.left };
}

export function learnStyle14({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 9, fontWeight: '800', marginTop: 6 };
}

export function learnStyle15({ compact, colors }: { compact: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { alignSelf: 'flex-start', minHeight: 44, marginTop: compact ? 10 : 12, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 10, backgroundColor: colors.surfaceRaised };
}

export function learnStyle16({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 };
}

export function learnStyle17({ compact, colors, purchase, pressed }: { compact: boolean; colors: import('@/theme').ThemeColors; purchase: { connected: boolean; entitlementLoaded: boolean; errorMessage: string | null; storeErrorMessage: string | null; hasFullCourseUnlock: boolean; isPurchasing: boolean; isRestoring: boolean; notice: string | null; productLookupFinished: boolean; isRetryingStore: boolean; isCheckingStoreEnvironment: boolean; isTestFlightFreeAccess: boolean; unlockProduct: import("expo-iap").Product | undefined; retryStoreConnection: () => Promise<void>; buyFullCourse: () => Promise<void>; restoreFullCourse: () => Promise<void>; }; pressed: boolean }): import('react-native').ViewStyle {
  return { alignSelf: 'flex-end', minHeight: 44, marginTop: compact ? 10 : 12, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, opacity: !purchase.connected || purchase.isRestoring ? 0.5 : pressed ? 0.7 : 1 };
}

export function learnStyle18({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 };
}

export function learnStyle19({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { marginTop: compact ? 14 : 23 };
}

export function learnStyle20({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 };
}

export function learnStyle21({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 18 : 22, fontWeight: '900', marginTop: 5 };
}

export function learnStyle22({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 11, fontWeight: '800', marginTop: 3 };
}

export function learnStyle23({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 7 };
}

export function learnStyle24({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { marginTop: 14, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.line };
}

export function learnStyle25({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.9 };
}

export function learnStyle26({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 4 };
}

export function learnStyle27({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 12 };
}

export function learnStyle28({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flex: 1, minHeight: compact ? 8 : 18 };
}

export function learnStyle29({ compact, colors, purchase, pressed }: { compact: boolean; colors: import('@/theme').ThemeColors; purchase: { connected: boolean; entitlementLoaded: boolean; errorMessage: string | null; storeErrorMessage: string | null; hasFullCourseUnlock: boolean; isPurchasing: boolean; isRestoring: boolean; notice: string | null; productLookupFinished: boolean; isRetryingStore: boolean; isCheckingStoreEnvironment: boolean; isTestFlightFreeAccess: boolean; unlockProduct: import("expo-iap").Product | undefined; retryStoreConnection: () => Promise<void>; buyFullCourse: () => Promise<void>; restoreFullCourse: () => Promise<void>; }; pressed: boolean }): import('react-native').ViewStyle {
  return { minHeight: compact ? 50 : 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderRadius: 15, backgroundColor: colors.accent, opacity: !purchase.connected || !purchase.unlockProduct || purchase.isPurchasing || !purchase.entitlementLoaded ? 0.6 : pressed ? 0.82 : 1 };
}

export function learnStyle30({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 12, fontWeight: '900', letterSpacing: 0.4 };
}

export function learnStyle31({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 10, fontWeight: '700', marginTop: 2 };
}

export function learnStyle32({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 22, fontWeight: '700' };
}

export function learnStyle33({ compact, colors, starting, progressLoaded, lessonSequenceLocked, audioStatus, pressed }: { compact: boolean; colors: import('@/theme').ThemeColors; starting: boolean; progressLoaded: boolean; lessonSequenceLocked: boolean; audioStatus: import("@/store/useSessionController").AudioPreparationStatus; pressed: boolean }): import('react-native').ViewStyle {
  return { minHeight: compact ? 50 : 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderRadius: 15, backgroundColor: colors.left, opacity: starting || !progressLoaded || lessonSequenceLocked || audioStatus === 'loading' ? 0.65 : pressed ? 0.84 : 1 };
}

export function learnStyle34({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 };
}

export function learnStyle35(): import('react-native').TextStyle {
  return { color: '#18352C', fontSize: 10, fontWeight: '700', marginTop: 2 };
}

export function learnStyle36({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 22, fontWeight: '700' };
}

export function learnStyle37({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.right, fontSize: 9, lineHeight: 13, marginTop: 6 };
}

export function learnStyle38({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.right, fontSize: 9, lineHeight: 13, marginTop: 6 };
}

export function learnStyle39({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.left, fontSize: 9, lineHeight: 13, marginTop: 6 };
}

export function learnStyle40({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 9, lineHeight: 13, marginTop: 6 };
}

export function learnStyle41({ purchase, pressed }: { purchase: { connected: boolean; entitlementLoaded: boolean; errorMessage: string | null; storeErrorMessage: string | null; hasFullCourseUnlock: boolean; isPurchasing: boolean; isRestoring: boolean; notice: string | null; productLookupFinished: boolean; isRetryingStore: boolean; isCheckingStoreEnvironment: boolean; isTestFlightFreeAccess: boolean; unlockProduct: import("expo-iap").Product | undefined; retryStoreConnection: () => Promise<void>; buyFullCourse: () => Promise<void>; restoreFullCourse: () => Promise<void>; }; pressed: boolean }): import('react-native').ViewStyle {
  return { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, opacity: purchase.isRetryingStore ? 0.55 : pressed ? 0.7 : 1 };
}

export function learnStyle42({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 };
}

export function LearnCoursePathStyle1({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 0, paddingHorizontal: compact ? 10 : 18, paddingTop: compact ? 13 : 20, paddingBottom: 12 };
}

export function LearnCoursePathStyle2({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: compact ? 9 : 14 };
}

export function LearnCoursePathStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 };
}

export function LearnCoursePathStyle4({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: compact ? 9 : 10, fontWeight: '700' };
}

export function LearnCoursePathStyle5(): import('react-native').ViewStyle {
  return { flex: 1 };
}

export function LearnLessonTileStyle1({ selected, colors, disabled, pressed }: { selected: boolean; colors: import('@/theme').ThemeColors; disabled: boolean; pressed: boolean }): import('react-native').ViewStyle {
  return {
        flexGrow: 0,
        flexBasis: 'auto',
        width: '100%',
        minWidth: 0,
        minHeight: 82,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: selected ? colors.surfaceRaised : colors.surface,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? colors.accent : colors.line,
        opacity: disabled ? 0.42 : pressed ? 0.8 : 1,
      };
}

export function LearnLessonTileStyle2(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' };
}

export function LearnLessonTileStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 };
}

export function LearnLessonTileStyle4({ completed, colors, disabled }: { completed: boolean; colors: import('@/theme').ThemeColors; disabled: boolean }): import('react-native').TextStyle {
  return { color: completed ? colors.left : disabled ? colors.dim : colors.accent, fontSize: 11, fontWeight: '900' };
}

export function LearnLessonTileStyle5({ disabled, colors }: { disabled: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: disabled ? colors.muted : colors.text, fontSize: 14, fontWeight: '800', marginTop: 8 };
}

export function LearnLessonTileStyle6(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 3 };
}

export function LearnLessonTileStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { flex: 1, color: colors.muted, fontSize: 10 };
}

export function LearnLessonTileStyle8({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 9, fontWeight: '900', fontVariant: ['tabular-nums'] };
}

export function LearnLessonTileStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 8, fontWeight: '800' };
}

export function LearnPatternPreviewStyle1(): import('react-native').ViewStyle {
  return { marginTop: 12 };
}

export function LearnPatternPreviewStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 };
}

export function LearnPatternPreviewStyle3(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 };
}

export function LearnPatternPreviewStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function LearnPatternPreviewStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 8, fontWeight: '800' };
}

export function LearnPatternPreviewStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 8, fontWeight: '700', marginTop: 6 };
}

export function LearnPatternPreviewStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 5 };
}

export function LearnPatternPreviewStyle8(): import('react-native').ViewStyle {
  return { marginTop: 12 };
}

export function LearnPatternPreviewStyle9(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'stretch', gap: 10 };
}

export function LearnPatternPreviewStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 8 };
}

export function LearnPatternPreviewStyle11(): import('react-native').ViewStyle {
  return { marginTop: 12 };
}

export function LearnPatternPreviewStyle12(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: 10 };
}

export function LearnPatternPreviewStyle13({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 8 };
}

export function LearnPatternPreviewStyle14({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 0, minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function LearnPatternPreviewStyle15({ color }: { color: string }): import('react-native').TextStyle {
  return { alignSelf: 'stretch', color, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 };
}

export function LearnPatternPreviewStyle16({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { alignSelf: 'stretch', color: colors.text, fontSize: 10, lineHeight: 12, fontWeight: '700', textAlign: 'center' };
}

export function LearnPatternPreviewStyle17({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 0, minHeight: 82, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function LearnPatternPreviewStyle18({ color }: { color: string }): import('react-native').TextStyle {
  return { color, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 };
}

export function LearnPatternPreviewStyle19(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 };
}

export function LearnPatternPreviewStyle20({ color }: { color: string }): import('react-native').TextStyle {
  return { color, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 };
}

export function LearnPatternPreviewStyle21({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 9, lineHeight: 11, fontWeight: '700', marginTop: 4 };
}

export function learnStyle43(): import('react-native').ViewStyle {
  return { flexDirection: 'row' };
}

export function learnStyle44({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { flexGrow: 1, paddingHorizontal: compact ? 16 : 24, paddingVertical: compact ? 10 : 18 };
}

export function LearnCoursePathStyle6(): import('react-native').ViewStyle {
  return { gap: 8, paddingBottom: 14 };
}
