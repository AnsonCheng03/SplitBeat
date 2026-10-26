import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import {
  authenticateGameCenter,
  getGameCenterStatus,
  subscribeToGameCenterStatus,
} from '../../modules/splitbeat-game-center/src';
import type { GameCenterStatus } from '../../modules/splitbeat-game-center/src';
import { syncLearnProgressWithGameCenter } from '@/store/learnProgress';
import type { LearnCourseProgressSnapshot } from '@/rhythm/learnProgressSync';
import { GameCenterCourseProgressButtonStyle1, GameCenterCourseProgressButtonStyle2, GameCenterCourseProgressButtonStyle3, GameCenterCourseProgressButtonStyle4, GameCenterCourseProgressButtonStyle5 } from '@/styles/records';

interface GameCenterCourseProgressButtonProps {
  onProgressSynced: (snapshot: LearnCourseProgressSnapshot) => void;
}

export function GameCenterCourseProgressButton({
  onProgressSynced,
}: GameCenterCourseProgressButtonProps) {
  const { colors } = useTheme();
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

  if (!status.available) return null;

  return (
    <View style={GameCenterCourseProgressButtonStyle1()}>
      <Pressable
        testID="learn.syncProgress"
        accessibilityRole="button"
        accessibilityLabel={t(status.authenticated ? 'Sync course progress' : 'Restore course progress from Game Center')}
        accessibilityState={{ disabled: syncing || !status.available }}
        disabled={syncing || !status.available}
        onPress={handlePress}
        style={({ pressed }) => (GameCenterCourseProgressButtonStyle2({ colors, syncing, pressed }))}
      >
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={GameCenterCourseProgressButtonStyle3({ colors })}>
          {t(syncing ? 'SYNCING COURSE…' : status.authenticated ? 'SYNC COURSE PROGRESS' : 'RESTORE FROM GAME CENTER')}
        </Text>
      </Pressable>
      <Text style={GameCenterCourseProgressButtonStyle4({ colors })}>
        {t('Course progress syncs through Game Center and your iCloud account. Course content changes start a separate progress version.')}
      </Text>
      {message ? (
        <Text testID="learn.syncProgress.status" accessibilityLiveRegion="polite" style={GameCenterCourseProgressButtonStyle5({ hasError, colors })}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
