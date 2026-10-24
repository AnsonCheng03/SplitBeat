import { LEARN_COURSE } from '@/rhythm/learnCourse';

export interface LearnLessonRating {
  lessonId: string;
  lastAccuracy: number;
  bestAccuracy: number;
  attempts: number;
}

const lessonOrder = new Map(LEARN_COURSE.map((lesson, index) => [lesson.id, index]));

export function starsForAccuracy(accuracy: number): number {
  const roundedAccuracy = Math.max(0, Math.min(100, Math.round(accuracy)));
  if (roundedAccuracy >= 95) return 5;
  if (roundedAccuracy >= 85) return 4;
  if (roundedAccuracy >= 70) return 3;
  if (roundedAccuracy >= 50) return 2;
  return 1;
}

export function updateLearnLessonRating(
  ratings: readonly LearnLessonRating[],
  lessonId: string,
  accuracy: number,
): LearnLessonRating[] {
  if (!lessonOrder.has(lessonId) || !Number.isFinite(accuracy)) return [...ratings];

  const normalizedAccuracy = Math.round(Math.max(0, Math.min(100, accuracy)) * 10) / 10;
  const existing = ratings.find((rating) => rating.lessonId === lessonId);
  const nextRating: LearnLessonRating = {
    lessonId,
    lastAccuracy: normalizedAccuracy,
    bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, normalizedAccuracy),
    attempts: (existing?.attempts ?? 0) + 1,
  };
  const updated = ratings.filter((rating) => rating.lessonId !== lessonId);
  updated.push(nextRating);
  return updated.sort((first, second) => lessonOrder.get(first.lessonId)! - lessonOrder.get(second.lessonId)!);
}

export function parseLearnLessonRatings(raw: string | null): LearnLessonRating[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const ratings = new Map<string, LearnLessonRating>();
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const candidate = item as Partial<LearnLessonRating>;
      if (
        typeof candidate.lessonId !== 'string'
        || !lessonOrder.has(candidate.lessonId)
        || !Number.isFinite(candidate.lastAccuracy)
        || !Number.isFinite(candidate.bestAccuracy)
        || !Number.isFinite(candidate.attempts)
        || (candidate.attempts ?? 0) < 1
      ) continue;

      const lastAccuracy = Math.max(0, Math.min(100, candidate.lastAccuracy!));
      const bestAccuracy = Math.max(lastAccuracy, Math.max(0, Math.min(100, candidate.bestAccuracy!)));
      ratings.set(candidate.lessonId, {
        lessonId: candidate.lessonId,
        lastAccuracy,
        bestAccuracy,
        attempts: Math.max(1, Math.floor(candidate.attempts!)),
      });
    }
    return [...ratings.values()].sort((first, second) => lessonOrder.get(first.lessonId)! - lessonOrder.get(second.lessonId)!);
  } catch {
    return [];
  }
}

export function totalLearnStars(ratings: readonly LearnLessonRating[]): number {
  return ratings.reduce((total, rating) => total + starsForAccuracy(rating.bestAccuracy), 0);
}
