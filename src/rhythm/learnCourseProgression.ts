import { getLessonAvailability, isLearnCourseCheckpoint, LEARN_COURSE, markLessonCompleted } from '@/rhythm/learnCourse';
import { starsForAccuracy, updateLearnLessonRating } from '@/rhythm/learnRating';
import type { LearnLessonRating } from '@/rhythm/learnRating';

export interface LearnLessonOutcome {
  completedLessonIds: string[];
  lessonRatings: LearnLessonRating[];
  lessonRating: LearnLessonRating | null;
  lessonCompleted: boolean;
  isCheckpointChallenge: boolean;
  checkpointPassed: boolean;
  checkpointUnlockedLessonIds: string[];
}

export function getCheckpointUnlockedLessonIds(
  lessonRatings: readonly LearnLessonRating[],
): string[] {
  const fiveStarCheckpointNumbers = lessonRatings.flatMap((rating) => {
    if (starsForAccuracy(rating.bestAccuracy) !== 5) return [];
    const lesson = LEARN_COURSE.find((candidate) => candidate.id === rating.lessonId);
    return lesson && isLearnCourseCheckpoint(lesson.number) ? [lesson.number] : [];
  });
  const highestUnlockedCheckpoint = Math.max(0, ...fiveStarCheckpointNumbers);

  return LEARN_COURSE
    .filter((lesson) => lesson.number < highestUnlockedCheckpoint)
    .map((lesson) => lesson.id);
}

export function isLearnLessonCheckpointChallenge({
  lessonId,
  completedLessonIds,
  skippedLessonIds,
  lessonRatings,
  checkpointUnlockedLessonIds,
}: {
  lessonId: string;
  completedLessonIds: readonly string[];
  skippedLessonIds: readonly string[];
  lessonRatings: readonly LearnLessonRating[];
  checkpointUnlockedLessonIds?: readonly string[];
}): boolean {
  const lessonIndex = LEARN_COURSE.findIndex((lesson) => lesson.id === lessonId);
  if (lessonIndex < 0) return false;

  const lesson = LEARN_COURSE[lessonIndex];
  if (!isLearnCourseCheckpoint(lesson.number)) return false;

  const courseProgressIds = new Set([...completedLessonIds, ...skippedLessonIds]);
  if (courseProgressIds.has(lessonId)) return false;

  const previousLessonProgressed = lessonIndex === 0
    || courseProgressIds.has(LEARN_COURSE[lessonIndex - 1].id);
  const unlockedLessonIds = checkpointUnlockedLessonIds ?? getCheckpointUnlockedLessonIds(lessonRatings);

  return !previousLessonProgressed && !unlockedLessonIds.includes(lessonId);
}

export function evaluateLearnLessonOutcome({
  lessonId,
  accuracy,
  completedLessonIds,
  skippedLessonIds,
  lessonRatings,
}: {
  lessonId: string;
  accuracy: number;
  completedLessonIds: readonly string[];
  skippedLessonIds: readonly string[];
  lessonRatings: readonly LearnLessonRating[];
}): LearnLessonOutcome {
  const updatedRatings = updateLearnLessonRating(lessonRatings, lessonId, accuracy);
  const lessonRating = updatedRatings.find((rating) => rating.lessonId === lessonId) ?? null;
  const courseProgressIds = [...new Set([...completedLessonIds, ...skippedLessonIds])];
  const checkpointUnlockedBeforeAttempt = getCheckpointUnlockedLessonIds(lessonRatings);
  const lesson = LEARN_COURSE.find((candidate) => candidate.id === lessonId);
  const isCheckpointChallenge = isLearnLessonCheckpointChallenge({
    lessonId,
    completedLessonIds,
    skippedLessonIds,
    lessonRatings,
    checkpointUnlockedLessonIds: checkpointUnlockedBeforeAttempt,
  });
  const checkpointPassed = isCheckpointChallenge && starsForAccuracy(accuracy) === 5;
  const shouldComplete = !isCheckpointChallenge || checkpointPassed;
  const availability = lesson
    ? getLessonAvailability(lessonId, courseProgressIds, checkpointUnlockedBeforeAttempt)
    : 'locked';
  const nextCompletedLessonIds = shouldComplete && availability !== 'locked'
    ? markLessonCompleted(courseProgressIds, lessonId, checkpointUnlockedBeforeAttempt)
    : [...completedLessonIds];

  return {
    completedLessonIds: nextCompletedLessonIds,
    lessonRatings: updatedRatings,
    lessonRating,
    lessonCompleted: nextCompletedLessonIds.includes(lessonId),
    isCheckpointChallenge,
    checkpointPassed,
    checkpointUnlockedLessonIds: getCheckpointUnlockedLessonIds(updatedRatings),
  };
}
