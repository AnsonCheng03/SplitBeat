import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { useAppTutorial } from '@/store/AppTutorialProvider';
import { useRhythmSession } from '@/store/sessionStore';
import {
  hasRestorableGameCenterLearnProgress,
  isLearnProgressSyncEnabled,
  syncLearnProgressWithGameCenter,
} from '@/store/learnProgress';
import {
  hasAutomaticGameCenterSetupBeenAttempted,
  markAutomaticGameCenterSetupAttempted,
  subscribeToAutomaticGameCenterSetupRequests,
  waitForGameCenterAuthentication,
} from '@/features/gameCenter/automaticGameCenterSetup';
import { getGameCenterStatus } from '../../../modules/splitbeat-game-center/src';

export function useAutomaticGameCenterCourseProgress(): void {
  const { featureFlags } = useRhythmSession();
  const { languageLoaded, t } = useI18n();
  const { tutorialLoaded, tutorialCompleted, tutorialVisible } = useAppTutorial();
  const [setupRequestGeneration, setSetupRequestGeneration] = useState(0);
  const processedGeneration = useRef(-1);

  useEffect(() => subscribeToAutomaticGameCenterSetupRequests(() => {
    setSetupRequestGeneration((generation) => generation + 1);
  }), []);

  const showSyncFailure = useCallback(() => {
    Alert.alert(
      t('Could not sync course progress.'),
      t('You can retry course progress sync in Settings.'),
      [{ text: t('OK') }],
    );
  }, [t]);

  const syncProgress = useCallback(async () => {
    try {
      await syncLearnProgressWithGameCenter();
    } catch {
      showSyncFailure();
    }
  }, [showSyncFailure]);

  const askToRestoreProgress = useCallback(() => {
    Alert.alert(
      t('Game Center progress found'),
      t('We found saved course progress for this version. Restore it and combine it with progress on this device?'),
      [
        { text: t('Not now'), style: 'cancel' },
        { text: t('Restore'), onPress: () => { void syncProgress(); } },
      ],
    );
  }, [syncProgress, t]);

  useEffect(() => {
    if (
      !featureFlags.gameCenter
      || !languageLoaded
      || !tutorialLoaded
      || !tutorialCompleted
      || tutorialVisible
      || processedGeneration.current === setupRequestGeneration
    ) return;

    processedGeneration.current = setupRequestGeneration;
    let active = true;

    const setupGameCenterProgress = async () => {
      if (!getGameCenterStatus().available) return;
      if (await hasAutomaticGameCenterSetupBeenAttempted()) return;

      await markAutomaticGameCenterSetupAttempted();
      const status = await waitForGameCenterAuthentication();
      if (!active || !status.authenticated) return;

      if (await isLearnProgressSyncEnabled()) {
        await syncProgress();
        return;
      }

      if (await hasRestorableGameCenterLearnProgress()) {
        if (active) askToRestoreProgress();
        return;
      }

      await syncProgress();
    };

    void setupGameCenterProgress().catch(() => {
      if (active) {
        Alert.alert(
          t('Could not check Game Center course progress.'),
          t('You can retry course progress sync in Settings.'),
          [{ text: t('OK') }],
        );
      }
    });

    return () => { active = false; };
  }, [
    askToRestoreProgress,
    featureFlags.gameCenter,
    languageLoaded,
    setupRequestGeneration,
    syncProgress,
    t,
    tutorialCompleted,
    tutorialLoaded,
    tutorialVisible,
  ]);
}
