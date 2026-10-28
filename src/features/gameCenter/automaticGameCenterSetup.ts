import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authenticateGameCenter,
  getGameCenterStatus,
  subscribeToGameCenterStatus,
} from '../../../modules/splitbeat-game-center/src';
import type { GameCenterStatus } from '../../../modules/splitbeat-game-center/src';
import { resetLearnProgressGameCenterSync } from '@/store/learnProgress';

const AUTOMATIC_SETUP_ATTEMPTED_KEY = 'split-beat.game-center.automatic-setup-attempted.v1';
const GAME_CENTER_AUTHENTICATION_TIMEOUT_MS = 15_000;

type SetupRequestListener = () => void;
const setupRequestListeners = new Set<SetupRequestListener>();
let authenticationWait: Promise<GameCenterStatus> | null = null;

export async function hasAutomaticGameCenterSetupBeenAttempted(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(AUTOMATIC_SETUP_ATTEMPTED_KEY)) === 'true';
  } catch {
    return true;
  }
}

export async function markAutomaticGameCenterSetupAttempted(): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTOMATIC_SETUP_ATTEMPTED_KEY, 'true');
  } catch {
    // Avoid repeatedly presenting system sign-in if the marker cannot be saved.
  }
}

export function subscribeToAutomaticGameCenterSetupRequests(
  listener: SetupRequestListener,
): () => void {
  setupRequestListeners.add(listener);
  return () => setupRequestListeners.delete(listener);
}

export async function resetAutomaticGameCenterSetup(): Promise<void> {
  await Promise.allSettled([
    AsyncStorage.removeItem(AUTOMATIC_SETUP_ATTEMPTED_KEY),
    resetLearnProgressGameCenterSync(),
  ]);
  setupRequestListeners.forEach((listener) => listener());
}

export function waitForGameCenterAuthentication(): Promise<GameCenterStatus> {
  if (authenticationWait) return authenticationWait;

  const currentStatus = getGameCenterStatus();
  if (currentStatus.authenticated || !currentStatus.available) {
    return Promise.resolve(currentStatus);
  }

  const wait = new Promise<GameCenterStatus>((resolve) => {
    let resolved = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let subscription: ReturnType<typeof subscribeToGameCenterStatus> = null;

    const finish = (status: GameCenterStatus) => {
      if (resolved) return;
      resolved = true;
      if (timeout !== null) clearTimeout(timeout);
      subscription?.remove();
      resolve(status);
    };

    subscription = subscribeToGameCenterStatus((status) => {
      if (status.authenticated || status.error) finish(status);
    });
    if (!subscription) {
      finish(getGameCenterStatus());
      return;
    }

    const latestStatus = getGameCenterStatus();
    if (latestStatus.authenticated) {
      finish(latestStatus);
      return;
    }

    timeout = setTimeout(() => finish(getGameCenterStatus()), GAME_CENTER_AUTHENTICATION_TIMEOUT_MS);
    try {
      authenticateGameCenter();
    } catch (error) {
      finish({
        ...getGameCenterStatus(),
        error: error instanceof Error ? error.message : 'Game Center authentication failed.',
      });
    }
  });

  let wrappedWait: Promise<GameCenterStatus>;
  wrappedWait = wait.finally(() => {
    if (authenticationWait === wrappedWait) authenticationWait = null;
  });
  authenticationWait = wrappedWait;
  return wrappedWait;
}
