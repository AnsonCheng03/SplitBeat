export function appearanceStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { marginTop: 18, borderTopWidth: 1, borderTopColor: colors.line };
}

export function appearanceStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 12 };
}

export function appearanceStyle3(): import('react-native').ViewStyle {
  return { marginTop: 24 };
}

export function appearanceStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.7, marginBottom: 5 };
}

export function appearanceStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, lineHeight: 17 };
}

export function audioStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { marginTop: 18, borderTopWidth: 1, borderTopColor: colors.line };
}

export function audioStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 12 };
}

export function audioStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 12 };
}

export function audioStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 12 };
}

export function audioStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 18 };
}

export function audioStyle6(): import('react-native').ViewStyle {
  return { marginTop: 23 };
}

export function audioStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.6, marginBottom: 10 };
}

export function audioStyle8(): import('react-native').ViewStyle {
  return { marginTop: 23 };
}

export function audioStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.6, marginBottom: 10 };
}

export function languageStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { marginTop: 20, maxWidth: 680, padding: 18, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function languageStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 14 };
}

export function timingStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { marginTop: 15, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function timingStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 14, fontWeight: '800' };
}

export function timingStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 12 };
}

export function timingStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center', marginTop: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface };
}

export function timingStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 0.4 };
}

export function timingStyle6(): import('react-native').ViewStyle {
  return { marginTop: 20 };
}

export function timingStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.4 };
}

export function timingStyle8(): import('react-native').ViewStyle {
  return { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 };
}

export function timingStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10 };
}

export function timingStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10 };
}

export function LivePracticeSettingsStyle1({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { width: '100%', maxWidth: 820, maxHeight: '100%', flex: 1, paddingHorizontal: compact ? 8 : 18, paddingVertical: compact ? 4 : 12 };
}

export function LivePracticeSettingsStyle2({ compact }: { compact: boolean }): import('react-native').ViewStyle {
  return { minHeight: compact ? 38 : 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? 4 : 10 };
}

export function LivePracticeSettingsStyle3(): import('react-native').ViewStyle {
  return { minHeight: 40, justifyContent: 'center', paddingRight: 14 };
}

export function LivePracticeSettingsStyle4({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: compact ? 10 : 11, fontWeight: '900', letterSpacing: 0.7 };
}

export function LivePracticeSettingsStyle5({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: compact ? 15 : 19, fontWeight: '900', letterSpacing: 0.8 };
}

export function LivePracticeSettingsStyle6(): import('react-native').ViewStyle {
  return { width: 62 };
}

export function LivePracticeSettingsStyle7(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', gap: 16 };
}

export function LivePracticeSettingsStyle8(): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 220 };
}

export function LivePracticeSettingsStyle9(): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 220 };
}

export function LivePracticeSettingsStyle10({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7 };
}

export function LivePracticeSettingsStyle11(): import('react-native').ViewStyle {
  return { marginTop: 12 };
}

export function LivePracticeSettingsStyle12({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 42, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 12, marginTop: 8, borderRadius: 11, borderWidth: 1, borderColor: colors.line };
}

export function LivePracticeSettingsStyle13({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 };
}

export function LivePracticeSettingsStyle14({ compact, colors }: { compact: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: compact ? 42 : 48, alignItems: 'center', justifyContent: 'center', marginTop: 8, borderRadius: 13, backgroundColor: colors.accent };
}

export function LivePracticeSettingsStyle15({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 12, fontWeight: '900', letterSpacing: 1 };
}

export function LivePracticeSettingsStyle16({ colors, compact }: { colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: compact ? 10 : 11, fontWeight: '900', letterSpacing: 1.1, marginTop: compact ? 14 : 18, marginBottom: 3 };
}

export function LivePracticeSettingsStyle17(): import('react-native').ViewStyle {
  return { marginTop: 13 };
}

export function LivePracticeSettingsStyle18({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.7, marginBottom: 7 };
}

export function LivePracticeSettingsStyle19(): import('react-native').ViewStyle {
  return { marginTop: 12 };
}

export function LivePracticeSettingsStyle20({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.7, marginBottom: 7 };
}

export function RhythmChallengeSettingsStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 12 };
}

export function RhythmChallengeSettingsStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 12 };
}

export function RhythmChallengeSettingsStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 12 };
}

export function RhythmChallengeSettingsStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 12, lineHeight: 17, marginTop: 8 };
}

export function RhythmMeterSettingsStyle1(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', gap: 12 };
}

export function RhythmMeterSettingsStyle2({ selected, colors }: { selected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flexGrow: 1, flexBasis: '18%', minWidth: 76, minHeight: 48, paddingHorizontal: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: selected ? colors.text : colors.surface, borderWidth: 1, borderColor: selected ? colors.text : colors.line };
}

export function RhythmMeterSettingsStyle3({ selected, colors }: { selected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: selected ? colors.background : colors.muted, fontSize: 13, fontWeight: '800' };
}

export function RhythmPatternSettingsStyle1(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', gap: 12 };
}

export function RhythmPatternSettingsStyle2({ selected, colors, cannotRemove }: { selected: boolean; colors: import('@/theme').ThemeColors; cannotRemove: boolean }): import('react-native').ViewStyle {
  return { paddingHorizontal: 15, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.leftSurface : colors.surface, borderWidth: 1, borderColor: selected ? colors.left : colors.line, opacity: cannotRemove ? 0.72 : 1 };
}

export function RhythmPatternSettingsStyle3({ selected, colors }: { selected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: selected ? colors.left : colors.muted, fontSize: 12, fontWeight: '700' };
}

export function RhythmPatternSettingsStyle4(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 };
}

export function RhythmPatternSettingsStyle5({ selected, colors }: { selected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 48, paddingHorizontal: 14, borderRadius: 12, justifyContent: 'center', backgroundColor: selected ? colors.leftSurface : colors.surface, borderWidth: 1, borderColor: selected ? colors.left : colors.line };
}

export function RhythmPatternSettingsStyle6({ selected, colors }: { selected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: selected ? colors.left : colors.text, fontSize: 13, fontWeight: '800' };
}

export function SettingsChoiceRowStyle1(): import('react-native').ViewStyle {
  return { flexDirection: 'row', flexWrap: 'wrap', gap: 12 };
}

export function SettingsChoiceRowStyle2({ selected, colors }: { selected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
              flex: 1,
              minWidth: 88,
              minHeight: 50,
              paddingHorizontal: 10,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: selected ? colors.text : colors.surface,
              borderWidth: 1,
              borderColor: selected ? colors.text : colors.line,
            };
}

export function SettingsChoiceRowStyle3({ selected, colors }: { selected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: selected ? colors.background : colors.muted, fontSize: 12, fontWeight: '700' };
}

export function SettingsPageStyle1({ sidebarWidth, insets, colors }: { sidebarWidth: 176 | 224; insets: import("react-native-safe-area-context").EdgeInsets; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: sidebarWidth + insets.left,
            borderRightWidth: 1,
            borderRightColor: colors.line,
            backgroundColor: colors.surface,
          };
}

export function SettingsPageStyle2({ sidebarWidth, compact }: { sidebarWidth: 176 | 224; compact: boolean }): import('react-native').ViewStyle {
  return {
          width: sidebarWidth,
          paddingHorizontal: compact ? 10 : 14,
          paddingTop: compact ? 8 : 14,
          paddingBottom: compact ? 8 : 12,
          backgroundColor: 'transparent',
        };
}

export function SettingsPageStyle3({ compact, mobileLayout = false }: { compact: boolean; mobileLayout?: boolean }): import('react-native').ViewStyle {
  return { minHeight: 48, justifyContent: 'center', marginBottom: mobileLayout ? 0 : compact ? 10 : 20, paddingHorizontal: 8 };
}

export function SettingsPageStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 0.6 };
}

export function SettingsPageStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, paddingHorizontal: 8 };
}

export function SettingsPageStyle6(): import('react-native').ViewStyle {
  return { flex: 1 };
}

export function SettingsPageStyle7({ selected, pressed, colors }: { selected: boolean; pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
                    minHeight: 50,
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: selected || pressed ? colors.surfaceRaised : 'transparent',
                    borderWidth: 1,
                    borderColor: selected ? colors.line : 'transparent',
                  };
}

export function SettingsPageStyle8({ selected, colors, compact }: { selected: boolean; colors: import('@/theme').ThemeColors; compact: boolean }): import('react-native').TextStyle {
  return { color: selected ? colors.text : colors.muted, fontSize: compact ? 12 : 13, fontWeight: selected ? '800' : '600' };
}

export function SettingsPageStyle9({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, paddingHorizontal: 8, paddingTop: 12 };
}

export function SettingsPageStyle10(): import('react-native').ViewStyle {
  return { flex: 1, minWidth: 0 };
}

export function SettingsPageStyle11(): import('react-native').ViewStyle {
  return { flex: 1 };
}

export function SettingsPageStyle12({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.7 };
}

export function SettingsPageStyle13({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 6 };
}

export function SettingsSectionStyle1(): import('react-native').ViewStyle {
  return { marginTop: 28 };
}

export function SettingsSectionStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.6, marginBottom: 14 };
}

export function SettingsToggleRowStyle1({ description, colors, disabled }: { description: string | undefined; colors: import('@/theme').ThemeColors; disabled: boolean }): import('react-native').ViewStyle {
  return { minHeight: description ? 82 : 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, gap: 18, paddingVertical: 14, opacity: disabled ? 0.55 : 1 };
}

export function SettingsToggleRowStyle2(): import('react-native').ViewStyle {
  return { flex: 1, gap: 4 };
}

export function SettingsToggleRowStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 14, fontWeight: '600' };
}

export function SettingsToggleRowStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, lineHeight: 17 };
}

export function SettingsToggleRowStyle5({ value, colors }: { value: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
          width: 46,
          height: 27,
          borderRadius: 20,
          backgroundColor: value ? colors.left : colors.surfaceRaised,
          justifyContent: 'center',
          paddingHorizontal: 3,
          alignItems: value ? 'flex-end' : 'flex-start',
        };
}

export function SettingsToggleRowStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 21, height: 21, borderRadius: 99, backgroundColor: colors.text };
}

export function TimingCalibrationViewStyle1({ isLeft, colors, accent, complete }: { isLeft: boolean; colors: import('@/theme').ThemeColors; accent: string; complete: boolean }): import('react-native').ViewStyle {
  return {
          flex: 1,
          minHeight: 170,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isLeft ? colors.leftSurface : colors.rightSurface,
          borderWidth: 1,
          borderColor: accent,
          borderRadius: 18,
          marginHorizontal: 5,
          opacity: complete ? 0.55 : 1,
        };
}

export function TimingCalibrationViewStyle2({ accent }: { accent: string }): import('react-native').TextStyle {
  return { color: accent, fontSize: 12, fontWeight: '800', letterSpacing: 2 };
}

export function TimingCalibrationViewStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 21, fontWeight: '800', marginTop: 8 };
}

export function TimingCalibrationViewStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 14, marginTop: 8, fontVariant: ['tabular-nums'] };
}

export function TimingCalibrationViewStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return {
          minHeight: 54,
          marginTop: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        };
}

export function TimingCalibrationViewStyle6({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 14, fontWeight: '800' };
}

export function TimingCalibrationViewStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { flex: 1, backgroundColor: colors.background };
}

export function TimingCalibrationViewStyle8(): import('react-native').ViewStyle {
  return { flex: 1, width: '100%', maxWidth: 950, alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 10 };
}

export function TimingCalibrationViewStyle9(): import('react-native').ViewStyle {
  return { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' };
}

export function TimingCalibrationViewStyle10(): import('react-native').ViewStyle {
  return { minWidth: 76, minHeight: 44, justifyContent: 'center' };
}

export function TimingCalibrationViewStyle11({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 13, fontWeight: '800' };
}

export function TimingCalibrationViewStyle12({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 };
}

export function TimingCalibrationViewStyle13(): import('react-native').ViewStyle {
  return { width: 54 };
}

export function TimingCalibrationViewStyle14(): import('react-native').ViewStyle {
  return { alignItems: 'center', marginTop: 16, marginBottom: 20 };
}

export function TimingCalibrationViewStyle15({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 28, fontWeight: '900', textAlign: 'center' };
}

export function TimingCalibrationViewStyle16({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 7, maxWidth: 600 };
}

export function TimingCalibrationViewStyle17({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 12, textAlign: 'center', marginTop: 5 };
}

export function TimingCalibrationViewStyle18(): import('react-native').ViewStyle {
  return { flex: 1, alignItems: 'center', justifyContent: 'center' };
}

export function TimingCalibrationViewStyle19({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: 14 };
}

export function TimingCalibrationViewStyle20({ colors, starting }: { colors: import('@/theme').ThemeColors; starting: boolean }): import('react-native').ViewStyle {
  return { minHeight: 58, minWidth: 250, paddingHorizontal: 24, borderRadius: 16, backgroundColor: colors.left, alignItems: 'center', justifyContent: 'center', opacity: starting ? 0.65 : 1 };
}

export function TimingCalibrationViewStyle21({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.background, fontSize: 15, fontWeight: '900', letterSpacing: 0.7 };
}

export function TimingCalibrationViewStyle22(): import('react-native').ViewStyle {
  return { flex: 1, alignItems: 'center', justifyContent: 'center' };
}

export function TimingCalibrationViewStyle23({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.left, fontSize: 18, fontWeight: '800', textAlign: 'center' };
}

export function TimingCalibrationViewStyle24({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 54, minWidth: 190, marginTop: 24, borderRadius: 15, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' };
}

export function TimingCalibrationViewStyle25({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 14, fontWeight: '800' };
}

export function TimingCalibrationViewStyle26({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textAlign: 'center', marginBottom: 9 };
}

export function TimingCalibrationViewStyle27(): import('react-native').ViewStyle {
  return { flex: 1, flexDirection: 'row', marginBottom: 12 };
}

export function TimingCalibrationViewStyle28({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, textAlign: 'center', minHeight: 20 };
}

export function LivePracticeSettingsStyle21(): import('react-native').ViewStyle {
  return { paddingBottom: 12 };
}

export function SettingsPageStyle14({ mobileLayout }: { mobileLayout: boolean }): import('react-native').ViewStyle {
  return { flex: 1, flexDirection: mobileLayout ? 'column' : 'row', minWidth: 0 };
}

export function SettingsPageStyle15(): import('react-native').ViewStyle {
  return { gap: 10, paddingBottom: 10 };
}

export function SettingsPageStyle16(): import('react-native').ViewStyle {
  return { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 };
}

export function SettingsPageStyle17(): import('react-native').ViewStyle {
  return { alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8 };
}

export function SettingsPageStyle18({ selected, pressed, colors }: { selected: boolean; pressed: boolean; colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { minHeight: 44, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 12, backgroundColor: selected || pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: selected ? colors.accent : colors.line };
}

export function SettingsPageStyle19({ selected, colors }: { selected: boolean; colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: selected ? colors.accent : colors.muted, fontSize: 12, fontWeight: selected ? '800' : '600' };
}

export function SettingsPageStyle20({ compact, mobileLayout }: { compact: boolean; mobileLayout: boolean }): import('react-native').ViewStyle {
  return { paddingHorizontal: mobileLayout ? 16 : compact ? 16 : 28, paddingTop: mobileLayout ? 16 : compact ? 14 : 20, paddingBottom: compact ? 20 : 28, width: '100%', maxWidth: 1120, alignSelf: 'center' };
}

export function SettingsPageStyle21({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, paddingHorizontal: 8 };
}

export function SettingsPageStyle22(): import('react-native').ViewStyle {
  return { height: 52, flexGrow: 0, flexShrink: 0 };
}

export function rhythmSettingsHelperTextStyle(colors: import('@/theme').ThemeColors): import('react-native').TextStyle {
  return { color: colors.dim, fontSize: 12, lineHeight: 17, marginTop: 8 };
}

export function resetAllSettingsStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { maxWidth: 680, marginTop: 28, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.line };
}

export function resetAllSettingsStyle2({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.danger, fontSize: 12, fontWeight: '900', letterSpacing: 0.8 };
}

export function resetAllSettingsStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 };
}

export function resetAllSettingsStyle4({ colors, pressed }: { colors: import('@/theme').ThemeColors; pressed: boolean }): import('react-native').ViewStyle {
  return { minWidth: 190, minHeight: 52, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingHorizontal: 16, borderRadius: 13, borderWidth: 1, borderColor: colors.danger, backgroundColor: pressed ? colors.surfaceRaised : 'transparent' };
}

export function resetAllSettingsStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.danger, fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' };
}

export function tutorialReplayStyle1({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { maxWidth: 680, marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function tutorialReplayStyle2(): import('react-native').ViewStyle {
  return { flexDirection: 'row', alignItems: 'center', gap: 9 };
}

export function tutorialReplayStyle3({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').ViewStyle {
  return { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent };
}

export function tutorialReplayStyle4({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 };
}

export function tutorialReplayStyle5({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 };
}

export function tutorialReplayStyle6({ colors, pressed }: { colors: import('@/theme').ThemeColors; pressed: boolean }): import('react-native').ViewStyle {
  return { minHeight: 48, minWidth: 190, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingHorizontal: 15, borderRadius: 12, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line };
}

export function tutorialReplayStyle7({ colors }: { colors: import('@/theme').ThemeColors }): import('react-native').TextStyle {
  return { color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 };
}
