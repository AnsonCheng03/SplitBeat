import { getLessonAvailability, LEARN_COURSE } from '@/rhythm/learnCourse';
import { starsForAccuracy } from '@/rhythm/learnRating';
import type { LearnLessonRating } from '@/rhythm/learnRating';

export interface LearnCourseSkipGate {
  canSkip: boolean;
  completedScoreCount: number;
  averageBestAccuracy: number;
  hasFiveStarLesson: boolean;
  lessonsToSkip: string[];
}

export function getLessonsToSkipBeforeTarget(
  targetLessonId: string,
  completedLessonIds: readonly string[],
): string[] {
  const targetIndex = LEARN_COURSE.findIndex((lesson) => lesson.id === targetLessonId);
  if (targetIndex < 0) return [];
  return LEARN_COURSE
    .slice(0, targetIndex)
    .filter((lesson) => !completedLessonIds.includes(lesson.id))
    .map((lesson) => lesson.id);
}

export function evaluateLearnCourseSkipGate({
  targetLessonId,
  hasFullCourseUnlock,
  completedLessonIds,
  skippedLessonIds,
  lessonRatings,
}: {
  targetLessonId: string;
  hasFullCourseUnlock: boolean;
  completedLessonIds: readonly string[];
  skippedLessonIds: readonly string[];
  lessonRatings: readonly LearnLessonRating[];
}): LearnCourseSkipGate {
  const completedScores = lessonRatings.filter((rating) => (
    completedLessonIds.includes(rating.lessonId)
    && !skippedLessonIds.includes(rating.lessonId)
  ));
  const totalBestAccuracy = completedScores.reduce((total, rating) => total + rating.bestAccuracy, 0);
  const averageBestAccuracy = completedScores.length
    ? totalBestAccuracy / completedScores.length
    : 0;
  const hasFiveStarLesson = completedScores.some((rating) => starsForAccuracy(rating.bestAccuracy) === 5);
  const lessonsToSkip = getLessonsToSkipBeforeTarget(targetLessonId, completedLessonIds);
  const targetIsLocked = getLessonAvailability(targetLessonId, completedLessonIds) === 'locked';
  const scoreRequirementMet = averageBestAccuracy >= 80 || hasFiveStarLesson;

  return {
    canSkip: hasFullCourseUnlock && targetIsLocked && lessonsToSkip.length > 0 && scoreRequirementMet,
    completedScoreCount: completedScores.length,
    averageBestAccuracy,
    hasFiveStarLesson,
    lessonsToSkip,
  };
}
