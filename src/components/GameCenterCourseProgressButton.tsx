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
    <View style={{ flex: 1, minWidth: 0, marginTop: 8 }}>
      <Pressable
        testID="learn.syncProgress"
        accessibilityRole="button"
        accessibilityLabel={t(status.authenticated ? 'Sync course progress' : 'Restore course progress from Game Center')}
        accessibilityState={{ disabled: syncing || !status.available }}
        disabled={syncing || !status.available}
        onPress={handlePress}
        style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, opacity: syncing ? 0.6 : pressed ? 0.75 : 1 })}
      >
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 }}>
          {t(syncing ? 'SYNCING COURSE…' : status.authenticated ? 'SYNC COURSE PROGRESS' : 'RESTORE FROM GAME CENTER')}
        </Text>
      </Pressable>
      <Text style={{ color: colors.dim, fontSize: 8, lineHeight: 11, marginTop: 4 }}>
        {t('Course progress syncs through Game Center and your iCloud account. Course content changes start a separate progress version.')}
      </Text>
      {message ? (
        <Text testID="learn.syncProgress.status" accessibilityLiveRegion="polite" style={{ color: hasError ? colors.right : colors.muted, fontSize: 9, lineHeight: 13, marginTop: 4 }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
