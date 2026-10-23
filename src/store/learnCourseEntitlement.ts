import AsyncStorage from '@react-native-async-storage/async-storage';

const LEARN_COURSE_UNLOCK_KEY = 'split-beat.learn-course-unlocked.v1';

export async function readLearnCourseUnlock(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(LEARN_COURSE_UNLOCK_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function saveLearnCourseUnlock(): Promise<void> {
  await AsyncStorage.setItem(LEARN_COURSE_UNLOCK_KEY, 'true');
}

export async function clearLearnCourseUnlock(): Promise<void> {
  await AsyncStorage.removeItem(LEARN_COURSE_UNLOCK_KEY);
}
