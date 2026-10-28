import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import {
  authenticateGameCenter,
  getGameCenterStatus,
  subscribeToGameCenterStatus,
} from '../../../modules/splitbeat-game-center/src';
import type { GameCenterStatus } from '../../../modules/splitbeat-game-center/src';
import { syncLearnProgressWithGameCenter } from '@/store/learnProgress';

const GAME_CENTER_AUTHENTICATION_TIMEOUT_MS = 15_000;

export function useGameCenterCourseProgress() {
  const { t } = useI18n();
  const [status, setStatus] = useState<GameCenterStatus>(getGameCenterStatus);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const syncAfterAuthentication = useRef(false);
  const authenticationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAuthenticationTimeout = useCallback(() => {
    if (authenticationTimeout.current === null) return;
    clearTimeout(authenticationTimeout.current);
    authenticationTimeout.current = null;
  }, []);

  const syncProgress = useCallback(async () => {
    setSyncing(true);
    setMessage('');
    setHasError(false);
    try {
      await syncLearnProgressWithGameCenter();
      setMessage(t('Course progress synced with Game Center and iCloud.'));
    } catch (error) {
      setMessage(t(error instanceof Error ? error.message : 'Could not sync course progress.'));
      setHasError(true);
    } finally {
      setSyncing(false);
    }
  }, [t]);

  const updateStatus = useCallback((nextStatus: GameCenterStatus) => {
    setStatus(nextStatus);
    if (nextStatus.error) {
      syncAfterAuthentication.current = false;
      clearAuthenticationTimeout();
      setMessage(t(
        nextStatus.authenticated
          ? nextStatus.error
          : 'Sign in to Game Center before syncing course progress.',
      ));
      setHasError(true);
    }
    if (syncAfterAuthentication.current && nextStatus.authenticated) {
      syncAfterAuthentication.current = false;
      clearAuthenticationTimeout();
      void syncProgress();
    }
  }, [clearAuthenticationTimeout, syncProgress, t]);

  useEffect(() => {
    const subscription = subscribeToGameCenterStatus(updateStatus);
    return () => {
      subscription?.remove();
      syncAfterAuthentication.current = false;
      clearAuthenticationTimeout();
    };
  }, [clearAuthenticationTimeout, updateStatus]);

  const handlePress = () => {
    setHasError(false);
    if (!status.authenticated) {
      syncAfterAuthentication.current = true;
      clearAuthenticationTimeout();
      setMessage(t('Waiting for Game Center…'));
      authenticationTimeout.current = setTimeout(() => {
        authenticationTimeout.current = null;
        if (syncAfterAuthentication.current) {
          setMessage(t('Sign in to Game Center before syncing course progress.'));
          setHasError(true);
        }
      }, GAME_CENTER_AUTHENTICATION_TIMEOUT_MS);
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
