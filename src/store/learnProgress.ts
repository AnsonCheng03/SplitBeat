import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  markLessonCompleted,
  parseCompletedLessonIds,
} from '@/rhythm/learnCourse';
import {
  parseLearnLessonRatings,
  updateLearnLessonRating,
} from '@/rhythm/learnRating';
import type { LearnLessonRating } from '@/rhythm/learnRating';

const LEARN_PROGRESS_KEY = 'split-beat.learn-progress.v1';
const LEARN_RATINGS_KEY = 'split-beat.learn-ratings.v1';

export async function readLearnProgress(): Promise<string[]> {
  try {
    return parseCompletedLessonIds(await AsyncStorage.getItem(LEARN_PROGRESS_KEY));
  } catch {
    return [];
  }
}

export async function completeLearnLesson(lessonId: string): Promise<string[]> {
  const progress = await readLearnProgress();
  const completedLessonIds = markLessonCompleted(progress, lessonId);
  try {
    await AsyncStorage.setItem(LEARN_PROGRESS_KEY, JSON.stringify(completedLessonIds));
  } catch {
    return progress;
  }
  return completedLessonIds;
}

export async function readLearnRatings(): Promise<LearnLessonRating[]> {
  try {
    return parseLearnLessonRatings(await AsyncStorage.getItem(LEARN_RATINGS_KEY));
  } catch {
    return [];
  }
}

export async function recordLearnLessonResult(
  lessonId: string,
  accuracy: number,
): Promise<LearnLessonRating | null> {
  const ratings = await readLearnRatings();
  const updated = updateLearnLessonRating(ratings, lessonId, accuracy);
  if (updated.length === ratings.length && !updated.some((rating) => rating.lessonId === lessonId)) {
    return null;
  }
  const rating = updated.find((item) => item.lessonId === lessonId) ?? null;
  try {
    await AsyncStorage.setItem(LEARN_RATINGS_KEY, JSON.stringify(updated));
    return rating;
  } catch {
    return ratings.find((item) => item.lessonId === lessonId) ?? null;
  }
}
