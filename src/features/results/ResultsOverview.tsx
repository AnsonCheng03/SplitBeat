import type { DimensionValue } from 'react-native';
import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { GameCenterChallengeCard } from '@/components/GameCenterChallengeCard';
import { accuracyPercent } from '@/rhythm/scoring';
import { starsForAccuracy } from '@/rhythm/learnRating';
import { sessionAccuracy, percent, timingText } from '@/features/results/resultPresentation';
import type { LearnLesson } from '@/rhythm/learnCourse';
import { LEARN_COURSE } from '@/rhythm/learnCourse';
import type { RhythmicFeel, SessionResults } from '@/types/rhythm';
import { useTheme } from '@/theme/ThemeProvider';
import { ResultsScorePanel as ScorePanel } from '@/features/results/ResultsControls';
import type { LearnLessonRating } from '@/rhythm/learnRating';

export function ResultsOverview({
  results,
  courseLesson,
  lessonCompleted,
  lessonRating,
  swingFeelAnalysis,
  originalFeel,
  countAsFeel,
  onCountAsFeel,
  gameCenterEnabled,
}: {
  results: SessionResults;
  courseLesson?: LearnLesson;
  lessonCompleted: boolean;
  lessonRating: LearnLessonRating | null;
  swingFeelAnalysis: { likelyStraight: boolean } | null;
  originalFeel: RhythmicFeel;
  countAsFeel: RhythmicFeel;
  onCountAsFeel: (feel: RhythmicFeel) => void;
  gameCenterEnabled: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const viewResults = results;
  const overall = sessionAccuracy(viewResults);
  const displayedHands = viewResults.trainingMode === 'single-hand' ? [viewResults.singleHand] : ['left', 'right'] as const;
  const sessionOptions = [
    t(viewResults.feel === 'swing' ? 'Swing' : 'Straight'),
    viewResults.graceNotesEnabled ? t('GRACE PICKUPS') : null,
    viewResults.restBetweenChanges ? t('REST BEFORE CHANGES') : null,
    t(viewResults.trainingMode === 'single-hand' ? 'ONE HAND' : 'TWO HANDS'),
  ].filter(Boolean).join(' · ');

  return (
    <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 }}>{courseLesson ? lessonCompleted ? 'LESSON COMPLETE' : 'LESSON FINISHED' : viewResults.source === 'score' ? 'SCORE SESSION COMPLETE' : 'SESSION COMPLETE'}</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12, maxWidth: '68%', textAlign: 'right' }}>
            {viewResults.bpm} BPM · {viewResults.timeSignature} · {viewResults.source === 'score' ? viewResults.scoreTitle : sessionOptions}
          </Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 }}>{courseLesson ? courseLesson.title : 'Your timing.'}</Text>
        {courseLesson && lessonCompleted ? (
          <Text testID="results.lessonComplete" style={{ color: colors.left, fontSize: 13, fontWeight: '800', marginTop: 7 }}>
            {courseLesson.number === LEARN_COURSE.length ? 'Course complete. You have reached the final lesson.' : 'Lesson complete. The next lesson is ready.'}
          </Text>
        ) : null}

        {viewResults.source !== 'score' && viewResults.replayExpectedEvents?.length ? (
          <View testID="results.feelCount" style={{ paddingHorizontal: 13, paddingVertical: 11, marginTop: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: swingFeelAnalysis?.likelyStraight && originalFeel === 'swing' ? colors.accent : colors.line }}>
            {swingFeelAnalysis?.likelyStraight && originalFeel === 'swing' ? (
              <Text testID="results.swingFeelWarning" style={{ color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: '800', marginBottom: 8 }}>
                {t('This was set to swing, but your taps line up more closely with straight timing.')}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }}>{t('COUNT THIS SESSION AS')}</Text>
                <Text style={{ color: colors.dim, fontSize: 10, lineHeight: 14, marginTop: 3 }}>{t('Recount these taps without playing again.')}</Text>
              </View>
              {(['straight', 'swing'] as const).map((feel) => (
                <Pressable
                  key={feel}
                  testID={`results.countAs.${feel}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: countAsFeel === feel }}
                  onPress={() => onCountAsFeel(feel)}
                  style={{ minWidth: 76, minHeight: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 10, backgroundColor: countAsFeel === feel ? colors.accent : colors.background, borderWidth: 1, borderColor: countAsFeel === feel ? colors.accent : colors.line }}
                >
                  <Text style={{ color: countAsFeel === feel ? colors.background : colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>{t(feel === 'straight' ? 'Straight' : 'Swing').toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 20, marginTop: 17 }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>{courseLesson ? 'LESSON ACCURACY' : viewResults.source === 'score' ? 'SCORE ACCURACY' : 'OVERALL ACCURACY'}</Text>
          <Text style={{ color: colors.text, fontSize: 58, lineHeight: 66, fontWeight: '900', marginTop: 4 }}>{percent(overall)}</Text>
          {courseLesson ? (
            <View testID="results.lessonRating" accessibilityLabel={t('{score} correct, {stars} out of 5 stars', { score: percent(overall), stars: starsForAccuracy(overall) })} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <Text testID="results.lessonStars" style={{ color: colors.accent, fontSize: 19, fontWeight: '900', letterSpacing: 1.4 }}>
                {'★'.repeat(starsForAccuracy(overall))}{'☆'.repeat(5 - starsForAccuracy(overall))}
              </Text>
              <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 }}>
                {t('{count} / 5 STARS', { count: starsForAccuracy(overall) })}
              </Text>
            </View>
          ) : null}
          {courseLesson && lessonRating ? (
            <Text testID="results.lessonBest" style={{ color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 7 }}>
              Best: {percent(lessonRating.bestAccuracy)} · {lessonRating.attempts} {lessonRating.attempts === 1 ? 'attempt' : 'attempts'}
            </Text>
          ) : null}
          <View style={{ height: 4, borderRadius: 3, backgroundColor: colors.line, marginTop: 11, overflow: 'hidden' }}>
            <View style={{ width: (String(overall) + '%') as DimensionValue, height: 4, backgroundColor: colors.accent, borderRadius: 3 }} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 11 }}>
          {displayedHands.map((hand) => (
            <ScorePanel
              key={hand}
              label={viewResults.trainingMode === 'single-hand' ? 'ONE HAND' : `${hand.toUpperCase()} HAND`}
              value={percent(accuracyPercent(viewResults[hand]))}
              detail={timingText(viewResults[hand])}
              accent={viewResults.trainingMode === 'single-hand' ? colors.accent : hand === 'left' ? colors.left : colors.right}
            />
          ))}
        </View>
        {viewResults.source === 'score' ? null : (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <ScorePanel label="STEADY RHYTHM" value={viewResults.stable.totalExpected ? percent(accuracyPercent(viewResults.stable)) : '—'} detail="Outside switch window" />
            <ScorePanel label="DURING SWITCHES" value={viewResults.transition.totalExpected ? percent(accuracyPercent(viewResults.transition)) : '—'} detail="First 2 beats after change" />
          </View>
        )}

        {gameCenterEnabled && viewResults.challengeMode && !courseLesson ? (
          <GameCenterChallengeCard
            testID="results.gameCenter"
            challengeMode
            longestCorrectStreak={results.longestCorrectStreak}
          />
        ) : null}
    </View>
  );
}
