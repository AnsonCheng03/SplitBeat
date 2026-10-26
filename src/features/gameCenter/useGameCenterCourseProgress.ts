import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import {
  authenticateGameCenter,
  getGameCenterStatus,
  subscribeToGameCenterStatus,
} from '../../../modules/splitbeat-game-center/src';
import type { GameCenterStatus } from '../../../modules/splitbeat-game-center/src';
import { syncLearnProgressWithGameCenter } from '@/store/learnProgress';
import type { LearnCourseProgressSnapshot } from '@/rhythm/learnProgressSync';

export function useGameCenterCourseProgress(onProgressSynced: (snapshot: LearnCourseProgressSnapshot) => void) {
  const { t } = useI18n();
  const [status, setStatus] = useState<GameCenterStatus>(getGameCenterStatus);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const syncAfterAuthentication = useRef(false);

  const syncProgress = useCallback(async () => {
    setSyncing(true);
    setMessage('');
    setHasError(false);
    try {
      const snapshot = await syncLearnProgressWithGameCenter();
      onProgressSynced(snapshot);
      setMessage(t('Course progress synced with Game Center and iCloud.'));
    } catch (error) {
      setMessage(t(error instanceof Error ? error.message : 'Could not sync course progress.'));
      setHasError(true);
    } finally {
      setSyncing(false);
    }
  }, [onProgressSynced, t]);

  const updateStatus = useCallback((nextStatus: GameCenterStatus) => {
    setStatus(nextStatus);
    if (nextStatus.error) {
      setMessage(t(nextStatus.error));
      setHasError(true);
    }
    if (syncAfterAuthentication.current && nextStatus.authenticated) {
      syncAfterAuthentication.current = false;
      void syncProgress();
    }
  }, [syncProgress, t]);

  useEffect(() => {
    const subscription = subscribeToGameCenterStatus(updateStatus);
    return () => subscription?.remove();
  }, [updateStatus]);

  const handlePress = () => {
    setHasError(false);
    if (!status.authenticated) {
      syncAfterAuthentication.current = true;
      setMessage(t('Waiting for Game Center…'));
      authenticateGameCenter();
      return;
    }
    void syncProgress();
  };

  return {
    t,
    status,
    syncing,
    message,
    hasError,
    handlePress,
  };
}
