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
import {
  ResultsOverviewStyle1,
  ResultsOverviewStyle2,
  ResultsOverviewStyle3,
  ResultsOverviewStyle4,
  ResultsOverviewStyle5,
  ResultsOverviewStyle6,
  ResultsOverviewStyle7,
  ResultsOverviewStyle8,
  ResultsOverviewStyle9,
  ResultsOverviewStyle10,
  ResultsOverviewStyle11,
  ResultsOverviewStyle12,
  ResultsOverviewStyle13,
  ResultsOverviewStyle14,
  ResultsOverviewStyle15,
  ResultsOverviewStyle16,
  ResultsOverviewStyle17,
  ResultsOverviewStyle18,
  ResultsOverviewStyle19,
  ResultsOverviewStyle20,
  ResultsOverviewStyle21,
  ResultsOverviewStyle22,
  ResultsOverviewStyle23,
  ResultsOverviewStyle24
} from '@/styles/results';

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
        <View style={ResultsOverviewStyle1()}>
          <Text style={ResultsOverviewStyle2({ colors })}>{courseLesson ? lessonCompleted ? 'LESSON COMPLETE' : 'LESSON FINISHED' : viewResults.source === 'score' ? 'SCORE SESSION COMPLETE' : 'SESSION COMPLETE'}</Text>
          <Text numberOfLines={1} style={ResultsOverviewStyle3({ colors })}>
            {viewResults.bpm} BPM · {viewResults.timeSignature} · {viewResults.source === 'score' ? viewResults.scoreTitle : sessionOptions}
          </Text>
        </View>
        <Text style={ResultsOverviewStyle4({ colors })}>{courseLesson ? courseLesson.title : 'Your timing.'}</Text>
        {courseLesson && lessonCompleted ? (
          <Text testID="results.lessonComplete" style={ResultsOverviewStyle5({ colors })}>
            {courseLesson.number === LEARN_COURSE.length ? 'Course complete. You have reached the final lesson.' : 'Lesson complete. The next lesson is ready.'}
          </Text>
        ) : null}

        {viewResults.source !== 'score' && viewResults.replayExpectedEvents?.length ? (
          <View testID="results.feelCount" style={ResultsOverviewStyle6({ colors, swingFeelAnalysis, originalFeel })}>
            {swingFeelAnalysis?.likelyStraight && originalFeel === 'swing' ? (
              <Text testID="results.swingFeelWarning" style={ResultsOverviewStyle7({ colors })}>
                {t('This was set to swing, but your taps line up more closely with straight timing.')}
              </Text>
            ) : null}
            <View style={ResultsOverviewStyle8()}>
              <View style={ResultsOverviewStyle9()}>
                <Text style={ResultsOverviewStyle10({ colors })}>{t('COUNT THIS SESSION AS')}</Text>
                <Text style={ResultsOverviewStyle11({ colors })}>{t('Recount these taps without playing again.')}</Text>
              </View>
              {(['straight', 'swing'] as const).map((feel) => (
                <Pressable
                  key={feel}
                  testID={`results.countAs.${feel}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: countAsFeel === feel }}
                  onPress={() => onCountAsFeel(feel)}
                  style={ResultsOverviewStyle12({ countAsFeel, feel, colors })}
                >
                  <Text style={ResultsOverviewStyle13({ countAsFeel, feel, colors })}>{t(feel === 'straight' ? 'Straight' : 'Swing').toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={ResultsOverviewStyle14({ colors })}>
          <Text style={ResultsOverviewStyle15({ colors })}>{courseLesson ? 'LESSON ACCURACY' : viewResults.source === 'score' ? 'SCORE ACCURACY' : 'OVERALL ACCURACY'}</Text>
          <Text style={ResultsOverviewStyle16({ colors })}>{percent(overall)}</Text>
          {courseLesson ? (
            <View testID="results.lessonRating" accessibilityLabel={t('{score} correct, {stars} out of 5 stars', { score: percent(overall), stars: starsForAccuracy(overall) })} style={ResultsOverviewStyle17()}>
              <Text testID="results.lessonStars" style={ResultsOverviewStyle18({ colors })}>
                {'★'.repeat(starsForAccuracy(overall))}{'☆'.repeat(5 - starsForAccuracy(overall))}
              </Text>
              <Text style={ResultsOverviewStyle19({ colors })}>
                {t('{count} / 5 STARS', { count: starsForAccuracy(overall) })}
              </Text>
            </View>
          ) : null}
          {courseLesson && lessonRating ? (
            <Text testID="results.lessonBest" style={ResultsOverviewStyle20({ colors })}>
              Best: {percent(lessonRating.bestAccuracy)} · {lessonRating.attempts} {lessonRating.attempts === 1 ? 'attempt' : 'attempts'}
            </Text>
          ) : null}
          <View style={ResultsOverviewStyle21({ colors })}>
            <View style={ResultsOverviewStyle22({ overall, colors })} />
          </View>
        </View>

        <View style={ResultsOverviewStyle23()}>
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
          <View style={ResultsOverviewStyle24()}>
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
