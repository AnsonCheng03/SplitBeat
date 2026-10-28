import { getLessonAvailability, LEARN_COURSE } from '@/rhythm/learnCourse';
import type { LearnLessonRating } from '@/rhythm/learnRating';

export interface LearnCourseSkipGate {
  canSkip: boolean;
  completedScoreCount: number;
  averageBestAccuracy: number;
  lessonsToSkip: string[];
}

export function getLessonsToSkipBeforeTarget(
  targetLessonId: string,
  completedLessonIds: readonly string[],
  checkpointUnlockedLessonIds: readonly string[] = [],
): string[] {
  const targetIndex = LEARN_COURSE.findIndex((lesson) => lesson.id === targetLessonId);
  if (targetIndex < 0) return [];
  return LEARN_COURSE
    .slice(0, targetIndex)
    .filter((lesson) => (
      !completedLessonIds.includes(lesson.id)
      && !checkpointUnlockedLessonIds.includes(lesson.id)
    ))
    .map((lesson) => lesson.id);
}

export function evaluateLearnCourseSkipGate({
  targetLessonId,
  hasFullCourseUnlock,
  completedLessonIds,
  skippedLessonIds,
  lessonRatings,
  checkpointUnlockedLessonIds = [],
}: {
  targetLessonId: string;
  hasFullCourseUnlock: boolean;
  completedLessonIds: readonly string[];
  skippedLessonIds: readonly string[];
  lessonRatings: readonly LearnLessonRating[];
  checkpointUnlockedLessonIds?: readonly string[];
}): LearnCourseSkipGate {
  const completedScores = lessonRatings.filter((rating) => (
    completedLessonIds.includes(rating.lessonId)
    && !skippedLessonIds.includes(rating.lessonId)
  ));
  const totalBestAccuracy = completedScores.reduce((total, rating) => total + rating.bestAccuracy, 0);
  const averageBestAccuracy = completedScores.length
    ? totalBestAccuracy / completedScores.length
    : 0;
  const lessonsToSkip = getLessonsToSkipBeforeTarget(
    targetLessonId,
    completedLessonIds,
    checkpointUnlockedLessonIds,
  );
  const targetIsLocked = getLessonAvailability(
    targetLessonId,
    completedLessonIds,
    checkpointUnlockedLessonIds,
  ) === 'locked';
  const scoreRequirementMet = averageBestAccuracy >= 80;

  return {
    canSkip: hasFullCourseUnlock && targetIsLocked && lessonsToSkip.length > 0 && scoreRequirementMet,
    completedScoreCount: completedScores.length,
    averageBestAccuracy,
    lessonsToSkip,
  };
}
