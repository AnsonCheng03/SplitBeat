import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ResultsActionRow } from '@/features/results/ResultsControls';
import { LEARN_COURSE } from '@/rhythm/learnCourse';
import type { LearnLesson } from '@/rhythm/learnCourse';
import type { FeatureFlags } from '@/features/featureFlags';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ResultsFooterStyle1,
  ResultsFooterStyle2,
  ResultsFooterStyle3,
  ResultsFooterStyle4,
  ResultsFooterStyle5,
  ResultsFooterStyle6,
  ResultsFooterStyle7,
  ResultsFooterStyle8,
  ResultsFooterStyle9,
  ResultsFooterStyle10
} from '@/styles/results';

export function ResultsFooter({
  courseLesson,
  lessonCompleted,
  checkpointChallenge,
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
  checkpointChallenge: boolean;
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
        style={({ pressed }) => (ResultsFooterStyle1({ pressed, colors, startingAgain }))}
      >
        <Text style={ResultsFooterStyle2({ colors })}>{startingAgain ? 'PREPARING…' : 'START AGAIN'}</Text>
      </Pressable>
      {featureFlags.learnCourse && courseLesson && (lessonCompleted || checkpointChallenge) ? (
        <Pressable
          testID={lessonCompleted ? 'results.continueLearning' : 'results.retryCheckpoint'}
          accessibilityRole="button"
          accessibilityLabel={t(lessonCompleted ? 'Continue the guided course' : 'Retry this checkpoint')}
          onPress={onContinueLearning}
          style={({ pressed }) => (ResultsFooterStyle3({ pressed, colors }))}
        >
          <Text style={ResultsFooterStyle4({ colors })}>
            {lessonCompleted
              ? courseLesson.number === LEARN_COURSE.length ? t('VIEW COURSE') : t('CONTINUE LEARNING')
              : t('RETRY CHECKPOINT')}
          </Text>
        </Pressable>
      ) : null}
      {showDiagnosticExport ? (
        <View style={ResultsFooterStyle5()}>
          <Text style={ResultsFooterStyle6({ colors })}>{t('DEVELOPER DIAGNOSTICS')}</Text>
          <Pressable
            testID="results.exportDiagnosticLog"
            accessibilityRole="button"
            accessibilityLabel={t('Export session log')}
            accessibilityState={{ disabled: exportingDiagnostic }}
            disabled={exportingDiagnostic}
            onPress={onConfirmExport}
            style={({ pressed }) => (ResultsFooterStyle7({ pressed, colors, exportingDiagnostic }))}
          >
            <Text style={ResultsFooterStyle8({ colors })}>{exportingDiagnostic ? t('PREPARING LOG…') : t('EXPORT SESSION LOG')}</Text>
            <Text style={ResultsFooterStyle9({ colors })}>{t('Share a JSON with settings, expected notes, and tap timestamps.')}</Text>
          </Pressable>
        </View>
      ) : null}
      <View testID="results.navigation" style={ResultsFooterStyle10({ colors })}>
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
