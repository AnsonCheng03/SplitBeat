import AsyncStorage from '@react-native-async-storage/async-storage';

export const LEARN_COURSE_UNLOCK_PRODUCT_ID = 'com.splitbeat.learncourse.unlock';

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
