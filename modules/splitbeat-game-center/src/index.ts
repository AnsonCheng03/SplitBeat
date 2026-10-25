import { requireOptionalNativeModule } from 'expo';

export interface GameCenterStatus {
  available: boolean;
  authenticated: boolean;
  playerAlias: string;
  leaderboardID: string | null;
  error?: string;
}

interface GameCenterNativeModule {
  getStatus: () => GameCenterStatus;
  authenticate: () => void;
  submitLongestStreak: (score: number) => Promise<void>;
  loadLearnCourseProgress: (revision: string) => Promise<string[]>;
  saveLearnCourseProgress: (revision: string, installId: string, snapshot: string) => Promise<void>;
  showLeaderboard: () => boolean;
  addListener: (
    eventName: 'onAuthenticationChanged',
    listener: (status: GameCenterStatus) => void,
  ) => { remove: () => void };
}

const nativeModule = requireOptionalNativeModule<GameCenterNativeModule>('SplitBeatGameCenter');

const unavailableStatus: GameCenterStatus = {
  available: false,
  authenticated: false,
  playerAlias: '',
  leaderboardID: null,
};

export function getGameCenterStatus(): GameCenterStatus {
  return nativeModule?.getStatus() ?? unavailableStatus;
}

export function authenticateGameCenter(): void {
  nativeModule?.authenticate();
}

export function subscribeToGameCenterStatus(
  listener: (status: GameCenterStatus) => void,
): { remove: () => void } | null {
  return nativeModule?.addListener('onAuthenticationChanged', listener) ?? null;
}

export async function submitLongestStreak(score: number): Promise<void> {
  if (!nativeModule) throw new Error('Game Center is not available on this platform.');
  await nativeModule.submitLongestStreak(score);
}

export async function loadLearnCourseProgress(revision: string): Promise<string[]> {
  if (!nativeModule) throw new Error('Game Center is not available on this platform.');
  return nativeModule.loadLearnCourseProgress(revision);
}

export async function saveLearnCourseProgress(
  revision: string,
  installId: string,
  snapshot: string,
): Promise<void> {
  if (!nativeModule) throw new Error('Game Center is not available on this platform.');
  await nativeModule.saveLearnCourseProgress(revision, installId, snapshot);
}

export function showGameCenterLeaderboard(): void {
  if (!nativeModule) throw new Error('Game Center is not available on this platform.');
  if (!nativeModule.showLeaderboard()) {
    throw new Error('Sign in to Game Center to view the leaderboard.');
  }
}
