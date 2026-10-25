import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LEARN_COURSE_REVISION,
  markLessonCompleted,
  parseCompletedLessonIds,
} from '@/rhythm/learnCourse';
import {
  parseLearnLessonRatings,
  updateLearnLessonRating,
} from '@/rhythm/learnRating';
import type { LearnLessonRating } from '@/rhythm/learnRating';
import {
  createLearnCourseProgressSnapshot,
  mergeLearnCourseProgressSnapshots,
  parseLearnCourseProgressSnapshot,
} from '@/rhythm/learnProgressSync';
import {
  getGameCenterStatus,
  loadLearnCourseProgress,
  saveLearnCourseProgress,
} from '../../modules/splitbeat-game-center/src';

const LEGACY_COURSE_REVISION = 'r-ff1b264c4c175e87';
const LEGACY_LEARN_PROGRESS_KEY = 'split-beat.learn-progress.v1';
const LEGACY_LEARN_RATINGS_KEY = 'split-beat.learn-ratings.v1';
const LEARN_PROGRESS_KEY = `split-beat.learn-progress.${LEARN_COURSE_REVISION}`;
const LEARN_RATINGS_KEY = `split-beat.learn-ratings.${LEARN_COURSE_REVISION}`;
const LEARN_PROGRESS_SYNC_KEY = 'split-beat.learn-progress.game-center-sync.v1';
const LEARN_PROGRESS_INSTALL_ID_KEY = 'split-beat.learn-progress.install-id.v1';

async function migrateLegacyProgressIfCompatible(): Promise<void> {
  if (LEARN_COURSE_REVISION !== LEGACY_COURSE_REVISION) return;

  try {
    const [currentProgress, currentRatings, legacyProgress, legacyRatings] = await Promise.all([
      AsyncStorage.getItem(LEARN_PROGRESS_KEY),
      AsyncStorage.getItem(LEARN_RATINGS_KEY),
      AsyncStorage.getItem(LEGACY_LEARN_PROGRESS_KEY),
      AsyncStorage.getItem(LEGACY_LEARN_RATINGS_KEY),
    ]);
    const updates: Promise<void>[] = [];
    if (currentProgress === null && legacyProgress !== null) {
      updates.push(AsyncStorage.setItem(
        LEARN_PROGRESS_KEY,
        JSON.stringify(parseCompletedLessonIds(legacyProgress)),
      ));
    }
    if (currentRatings === null && legacyRatings !== null) {
      updates.push(AsyncStorage.setItem(
        LEARN_RATINGS_KEY,
        JSON.stringify(parseLearnLessonRatings(legacyRatings)),
      ));
    }
    await Promise.all(updates);
  } catch {
    // Local course progress remains readable from the legacy keys if migration fails.
  }
}

export async function readLearnProgress(): Promise<string[]> {
  try {
    await migrateLegacyProgressIfCompatible();
    const current = await AsyncStorage.getItem(LEARN_PROGRESS_KEY);
    if (current !== null) return parseCompletedLessonIds(current);
    if (LEARN_COURSE_REVISION === LEGACY_COURSE_REVISION) {
      return parseCompletedLessonIds(await AsyncStorage.getItem(LEGACY_LEARN_PROGRESS_KEY));
    }
    return [];
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
    await migrateLegacyProgressIfCompatible();
    const current = await AsyncStorage.getItem(LEARN_RATINGS_KEY);
    if (current !== null) return parseLearnLessonRatings(current);
    if (LEARN_COURSE_REVISION === LEGACY_COURSE_REVISION) {
      return parseLearnLessonRatings(await AsyncStorage.getItem(LEGACY_LEARN_RATINGS_KEY));
    }
    return [];
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

export async function isLearnProgressSyncEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(LEARN_PROGRESS_SYNC_KEY)) === 'true';
  } catch {
    return false;
  }
}

async function getLearnProgressInstallId(): Promise<string> {
  const existing = await AsyncStorage.getItem(LEARN_PROGRESS_INSTALL_ID_KEY);
  if (existing && /^[a-z0-9-]{8,64}$/.test(existing)) return existing;

  const installId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
  await AsyncStorage.setItem(LEARN_PROGRESS_INSTALL_ID_KEY, installId);
  return installId;
}

async function writeLearnProgressSnapshot(
  completedLessonIds: readonly string[],
  ratings: readonly LearnLessonRating[],
): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(LEARN_PROGRESS_KEY, JSON.stringify(completedLessonIds)),
    AsyncStorage.setItem(LEARN_RATINGS_KEY, JSON.stringify(ratings)),
  ]);
}

async function performLearnProgressGameCenterSync() {
  const status = getGameCenterStatus();
  if (!status.available) throw new Error('Game Center is not available on this platform.');
  if (!status.authenticated) throw new Error('Sign in to Game Center before syncing course progress.');

  const [completedLessonIds, ratings, installId] = await Promise.all([
    readLearnProgress(),
    readLearnRatings(),
    getLearnProgressInstallId(),
  ]);
  const localSnapshot = createLearnCourseProgressSnapshot(completedLessonIds, ratings);
  const remotePayloads = await loadLearnCourseProgress(LEARN_COURSE_REVISION);
  const snapshots = remotePayloads
    .map(parseLearnCourseProgressSnapshot)
    .filter((snapshot) => snapshot !== null);
  const merged = mergeLearnCourseProgressSnapshots([localSnapshot, ...snapshots]);

  await writeLearnProgressSnapshot(merged.completedLessonIds, merged.ratings);
  await saveLearnCourseProgress(LEARN_COURSE_REVISION, installId, JSON.stringify(merged));
  await AsyncStorage.setItem(LEARN_PROGRESS_SYNC_KEY, 'true');
  return merged;
}

let learnProgressSyncQueue: Promise<void> = Promise.resolve();

export function syncLearnProgressWithGameCenter() {
  const syncTask = learnProgressSyncQueue.then(performLearnProgressGameCenterSync);
  learnProgressSyncQueue = syncTask.then(() => undefined, () => undefined);
  return syncTask;
}

export async function syncLearnProgressIfEnabled(): Promise<void> {
  if (!(await isLearnProgressSyncEnabled()) || !getGameCenterStatus().authenticated) return;
  await syncLearnProgressWithGameCenter();
}
