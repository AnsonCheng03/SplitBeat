import type { LearnLesson } from '@/rhythm/learnCourse';

export const FREE_LEARN_LESSON_COUNT = 3;

export function requiresLearnCourseUnlock(
  lesson: Pick<LearnLesson, 'number'>,
  hasFullCourseUnlock: boolean,
): boolean {
  return lesson.number > FREE_LEARN_LESSON_COUNT && !hasFullCourseUnlock;
}
