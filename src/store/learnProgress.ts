import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  markLessonCompleted,
  parseCompletedLessonIds,
} from '@/rhythm/learnCourse';

const LEARN_PROGRESS_KEY = 'split-beat.learn-progress.v1';

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
