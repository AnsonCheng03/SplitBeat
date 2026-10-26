import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import {
  authenticateGameCenter,
  getGameCenterStatus,
  showGameCenterLeaderboard,
  subscribeToGameCenterStatus,
  submitLongestStreak,
} from '../../../modules/splitbeat-game-center/src';
import type { GameCenterStatus } from '../../../modules/splitbeat-game-center/src';

export function useGameCenterChallenge({
  challengeMode,
  longestCorrectStreak,
}: {
  challengeMode: boolean;
  longestCorrectStreak?: number;
}) {
  const { t } = useI18n();
  const [status, setStatus] = useState<GameCenterStatus>(getGameCenterStatus);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scoreStatus, setScoreStatus] = useState<'idle' | 'submitted' | 'failed'>('idle');
  const submittedRef = useRef(false);
  const hasScore = challengeMode && typeof longestCorrectStreak === 'number';

  const updateStatus = useCallback((nextStatus: GameCenterStatus) => {
    setStatus(nextStatus);
    if (nextStatus.error) setMessage(t(nextStatus.error));
  }, [t]);

  useEffect(() => {
    const subscription = subscribeToGameCenterStatus(updateStatus);
    return () => subscription?.remove();
  }, [updateStatus]);

  const submitScore = useCallback(async () => {
    if (!hasScore || longestCorrectStreak === undefined || submitting) return;
    submittedRef.current = true;
    setSubmitting(true);
    setScoreStatus('idle');
    setMessage(t('Sending your clean streak to Game Center…'));
    try {
      await submitLongestStreak(longestCorrectStreak);
      setScoreStatus('submitted');
      setMessage(t('Challenge score submitted. Game Center keeps your best streak.'));
    } catch (error) {
      setScoreStatus('failed');
      setMessage(t(error instanceof Error ? error.message : 'Could not submit this score.'));
    } finally {
      setSubmitting(false);
    }
  }, [hasScore, longestCorrectStreak, submitting, t]);

  useEffect(() => {
    if (!hasScore || !status.available || !status.authenticated || submittedRef.current) return;
    void submitScore();
  }, [hasScore, status.available, status.authenticated, submitScore]);

  const openLeaderboard = () => {
    try {
      showGameCenterLeaderboard();
    } catch (error) {
      setMessage(t(error instanceof Error ? error.message : 'Could not open Game Center.'));
    }
  };

  const signIn = () => {
    setMessage(t('Waiting for Game Center…'));
    authenticateGameCenter();
  };

  const handleAction = () => {
    if (!status.authenticated) signIn();
    else if (hasScore && scoreStatus !== 'submitted') void submitScore();
    else openLeaderboard();
  };

  const actionLabel = !status.authenticated
    ? 'SIGN IN TO GAME CENTER'
    : scoreStatus === 'failed'
      ? 'RETRY SCORE'
      : scoreStatus === 'submitted' || !hasScore
        ? 'VIEW LEADERBOARD'
        : 'SUBMIT SCORE';
  const description = Platform.OS !== 'ios'
    ? 'Game Center is available on iOS. Your best clean streak is saved in My Records on this device.'
    : hasScore
      ? status.authenticated
        ? 'A correct note adds one. A missed note or off-beat tap resets the run.'
        : 'Sign in to send this challenge score. Your local record is saved either way.'
      : 'Challenge scores count consecutive correct notes across both hands. A miss or extra tap breaks the run.';

  return {
    t,
    status,
    message,
    submitting,
    hasScore,
    actionLabel,
    description,
    handleAction,
  };
}
