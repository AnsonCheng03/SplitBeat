import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ResultsActionRow } from '@/features/results/ResultsControls';
import { LEARN_COURSE } from '@/rhythm/learnCourse';
import type { LearnLesson } from '@/rhythm/learnCourse';
import type { FeatureFlags } from '@/features/featureFlags';
import { useTheme } from '@/theme/ThemeProvider';

export function ResultsFooter({
  courseLesson,
  lessonCompleted,
  featureFlags,
  startingAgain,
  showDiagnosticExport,
  exportingDiagnostic,
  onStartAgain,
  onContinueLearning,
  onConfirmExport,
  onChangeSettings,
  onViewRecords,
  onBackHome,
}: {
  courseLesson?: LearnLesson;
  lessonCompleted: boolean;
  featureFlags: FeatureFlags;
  startingAgain: boolean;
  showDiagnosticExport: boolean;
  exportingDiagnostic: boolean;
  onStartAgain: () => void;
  onContinueLearning: () => void;
  onConfirmExport: () => void;
  onChangeSettings: () => void;
  onViewRecords: () => void;
  onBackHome: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <>
      <Pressable
        testID="results.startAgain"
        accessibilityRole="button"
        accessibilityLabel={t('Start the same exercise again')}
        accessibilityState={{ disabled: startingAgain }}
        disabled={startingAgain}
        onPress={onStartAgain}
        style={({ pressed }) => ({ backgroundColor: pressed ? '#A8EADB' : colors.left, minHeight: 64, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 30, opacity: startingAgain ? 0.72 : 1 })}
      >
        <Text style={{ color: colors.background, fontSize: 15, fontWeight: '900', letterSpacing: 0.8 }}>{startingAgain ? 'PREPARING…' : 'START AGAIN'}</Text>
      </Pressable>
      {featureFlags.learnCourse && courseLesson && lessonCompleted ? (
        <Pressable
          testID="results.continueLearning"
          accessibilityRole="button"
          accessibilityLabel={t('Continue the guided course')}
          onPress={onContinueLearning}
          style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceRaised : colors.surface, minHeight: 60, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 14, borderWidth: 1, borderColor: colors.line })}
        >
          <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 }}>
            {courseLesson.number === LEARN_COURSE.length ? 'VIEW COURSE' : 'CONTINUE LEARNING'}
          </Text>
        </Pressable>
      ) : null}
      {showDiagnosticExport ? (
        <View style={{ marginTop: 18 }}>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8 }}>{t('DEVELOPER DIAGNOSTICS')}</Text>
          <Pressable
            testID="results.exportDiagnosticLog"
            accessibilityRole="button"
            accessibilityLabel={t('Export session log')}
            accessibilityState={{ disabled: exportingDiagnostic }}
            disabled={exportingDiagnostic}
            onPress={onConfirmExport}
            style={({ pressed }) => ({ minHeight: 58, paddingHorizontal: 16, borderRadius: 15, justifyContent: 'center', backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line, opacity: exportingDiagnostic ? 0.7 : 1 })}
          >
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 }}>{exportingDiagnostic ? t('PREPARING LOG…') : t('EXPORT SESSION LOG')}</Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{t('Share a JSON with settings, expected notes, and tap timestamps.')}</Text>
          </Pressable>
        </View>
      ) : null}
      <View testID="results.navigation" style={{ marginTop: 14, marginBottom: 18, overflow: 'hidden', borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
        <ResultsActionRow
          testID="results.settings"
          label={t('CHANGE SETTINGS')}
          accessibilityLabel={t('Change settings')}
          color={colors.text}
          onPress={onChangeSettings}
        />
        {featureFlags.sessionRecords ? (
          <ResultsActionRow
            testID="results.records"
            label={t('VIEW MY RECORD')}
            accessibilityLabel={t('View my record')}
            color={colors.left}
            onPress={onViewRecords}
          />
        ) : null}
        <ResultsActionRow
          testID="results.home"
          label={t('BACK HOME')}
          accessibilityLabel={t('Back home')}
          color={colors.muted}
          onPress={onBackHome}
          last
        />
      </View>
    </>
  );
}
