import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  parseImportedScoreLibrary,
  type ImportedScoreLibraryEntry,
} from '@/rhythm/importedScoreLibrary';

const IMPORTED_SCORE_LIBRARY_KEY = 'split-beat.imported-score-library.v1';

export async function loadImportedScoreLibrary(): Promise<ImportedScoreLibraryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(IMPORTED_SCORE_LIBRARY_KEY);
    return parseImportedScoreLibrary(raw);
  } catch {
    return [];
  }
}

export async function saveImportedScoreLibrary(
  entries: readonly ImportedScoreLibraryEntry[],
): Promise<void> {
  await AsyncStorage.setItem(
    IMPORTED_SCORE_LIBRARY_KEY,
    JSON.stringify({ version: 1, entries }),
  );
}
