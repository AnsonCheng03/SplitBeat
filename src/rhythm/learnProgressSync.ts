import { LEARN_COURSE_REVISION, parseCompletedLessonIds, parseSkippedLessonIds } from '@/rhythm/learnCourse';
import {
  parseLearnLessonRatings,
} from '@/rhythm/learnRating';
import type { LearnLessonRating } from '@/rhythm/learnRating';

export interface LearnCourseProgressSnapshot {
  schemaVersion: 1;
  courseRevision: string;
  completedLessonIds: string[];
  skippedLessonIds: string[];
  ratings: LearnLessonRating[];
  updatedAt: number;
}
export function createLearnCourseProgressSnapshot(
  completedLessonIds: readonly string[],
  ratings: readonly LearnLessonRating[],
  updatedAt = Date.now(),
  skippedLessonIds: readonly string[] = [],
): LearnCourseProgressSnapshot {
  return {
    schemaVersion: 1,
    courseRevision: LEARN_COURSE_REVISION,
    completedLessonIds: parseCompletedLessonIds(JSON.stringify(completedLessonIds)),
    skippedLessonIds: parseSkippedLessonIds(JSON.stringify(skippedLessonIds)),
    ratings: parseLearnLessonRatings(JSON.stringify(ratings)),
    updatedAt: Number.isFinite(updatedAt) ? Math.max(0, updatedAt) : 0,
  };
}

export function parseLearnCourseProgressSnapshot(
  raw: string,
): LearnCourseProgressSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const candidate = parsed as Partial<LearnCourseProgressSnapshot>;
    if (
      candidate.schemaVersion !== 1
      || candidate.courseRevision !== LEARN_COURSE_REVISION
      || !Array.isArray(candidate.completedLessonIds)
      || !Array.isArray(candidate.ratings)
    ) return null;
    return createLearnCourseProgressSnapshot(
      candidate.completedLessonIds,
      candidate.ratings,
      candidate.updatedAt ?? 0,
      Array.isArray(candidate.skippedLessonIds) ? candidate.skippedLessonIds : [],
    );
  } catch {
    return null;
  }
}

/** Merges progress only within the exact same rhythm-content revision. */
export function mergeLearnCourseProgressSnapshots(
  snapshots: readonly LearnCourseProgressSnapshot[],
): LearnCourseProgressSnapshot {
  const compatible = snapshots.filter((snapshot) => (
    snapshot.schemaVersion === 1 && snapshot.courseRevision === LEARN_COURSE_REVISION
  ));
  const completedLessonIds = new Set<string>();
  const skippedLessonIds = new Set<string>();
  const ratingsByLesson = new Map<string, LearnLessonRating>();
  const ratingUpdatedAt = new Map<string, number>();

  for (const snapshot of compatible) {
    for (const lessonId of snapshot.completedLessonIds) completedLessonIds.add(lessonId);
    for (const lessonId of snapshot.skippedLessonIds) skippedLessonIds.add(lessonId);
    for (const rating of snapshot.ratings) {
      const existing = ratingsByLesson.get(rating.lessonId);
      const existingUpdatedAt = ratingUpdatedAt.get(rating.lessonId) ?? -1;
      const incomingIsNewer = snapshot.updatedAt > existingUpdatedAt;
      ratingsByLesson.set(rating.lessonId, {
        lessonId: rating.lessonId,
        lastAccuracy: !existing || incomingIsNewer
          ? rating.lastAccuracy
          : snapshot.updatedAt === existingUpdatedAt
            ? Math.max(existing.lastAccuracy, rating.lastAccuracy)
            : existing.lastAccuracy,
        bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, rating.bestAccuracy),
        attempts: Math.max(existing?.attempts ?? 0, rating.attempts),
      });
      ratingUpdatedAt.set(rating.lessonId, Math.max(existingUpdatedAt, snapshot.updatedAt));
    }
  }

  for (const lessonId of ratingsByLesson.keys()) skippedLessonIds.delete(lessonId);

  const orderedCompleted = parseCompletedLessonIds(JSON.stringify([...completedLessonIds]));
  const orderedSkipped = parseSkippedLessonIds(JSON.stringify([...skippedLessonIds]));
  const orderedRatings = parseLearnLessonRatings(JSON.stringify([...ratingsByLesson.values()]));
  return createLearnCourseProgressSnapshot(
    orderedCompleted,
    orderedRatings,
    compatible.reduce((latest, snapshot) => Math.max(latest, snapshot.updatedAt), 0),
    orderedSkipped,
  );
}
