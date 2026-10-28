import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_COMPLETED_STORAGE_KEY = 'split-beat.app-tutorial.completed.v1';

export async function readTutorialCompletion(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(TUTORIAL_COMPLETED_STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function saveTutorialCompletion(completed = true): Promise<void> {
  try {
    await AsyncStorage.setItem(TUTORIAL_COMPLETED_STORAGE_KEY, completed ? 'true' : 'false');
  } catch {
    // The tutorial can still be completed for this session if storage is unavailable.
  }
}
