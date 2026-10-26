import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { HomeActivity, HomeActivityOption } from '@/features/home/homeActivity';

export function useHomeScreen() {
  const { colors } = useTheme();
  const { settings, featureFlags, updateSettings, audioStatus, prepareAudio, prepareExercise } = useRhythmSession();
  const { t } = useI18n();
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [openingActivity, setOpeningActivity] = useState<HomeActivity | null>(null);
  const openingActivityRef = useRef(false);
  const [activityPickerVisible, setActivityPickerVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<HomeActivity>('practice');

  const activityOptions = useMemo<HomeActivityOption[]>(() => [
    {
      id: 'practice',
      title: 'Free practice',
      description: 'Play a rhythm at your own pace.',
      testID: 'home.activity.practice',
    },
    ...(featureFlags.focusPractice
      ? [{
        id: 'focus' as const,
        title: 'Focus practice',
        description: 'Review rhythm combinations you want to improve.',
        testID: 'home.exercise',
      }]
      : []),
    ...(featureFlags.scoreImport
      ? [{
        id: 'score' as const,
        title: 'Train from a score',
        description: 'Import a score or continue one you saved.',
        testID: 'home.importScore',
      }]
      : []),
    ...(featureFlags.learnCourse
      ? [{
        id: 'learn' as const,
        title: 'Learn rhythm',
        description: 'Follow the guided course, one lesson at a time.',
        testID: 'home.learn',
      }]
      : []),
  ], [featureFlags.focusPractice, featureFlags.learnCourse, featureFlags.scoreImport]);
  const currentActivity = activityOptions.find((option) => option.id === selectedActivity) ?? activityOptions[0];
  const isFreePractice = currentActivity.id === 'practice';
  const loadingActivityTitle = activityOptions.find((option) => option.id === openingActivity)?.title ?? 'Focus practice';
  const loadingMessage = openingActivity
    ? t('Loading {activity}…', { activity: t(loadingActivityTitle) })
    : '';

  useFocusEffect(useCallback(() => {
    setStarting(false);
    setOpeningActivity(null);
    openingActivityRef.current = false;
  }, []));

  const startFreePractice = useCallback(async () => {
    if (starting || audioStatus === 'loading') return;
    setStarting(true);
    try {
      if (audioStatus === 'error') {
        await prepareAudio();
        return;
      }
      await prepareExercise();
      router.replace('/practice');
    } catch {
      Alert.alert(t('Audio could not start'), t('Check your device audio settings and try again.'));
    } finally {
      setStarting(false);
    }
  }, [audioStatus, prepareAudio, prepareExercise, router, starting, t]);

  const navigateToActivity = useCallback((activity: HomeActivity) => {
    switch (activity) {
      case 'practice':
        router.replace('/practice');
        return;
      case 'focus':
        router.push('/exercise');
        return;
      case 'score':
        router.push('/import-score');
        return;
      case 'learn':
        router.push('/learn');
        return;
    }
  }, [router]);

  const openSelectedActivity = useCallback(async () => {
    if (openingActivityRef.current) return;
    openingActivityRef.current = true;
    setOpeningActivity(currentActivity.id);

    // Let the loading screen render before navigation starts.
    await new Promise<void>((resolve) => setTimeout(resolve, 350));
    try {
      navigateToActivity(currentActivity.id);
    } catch {
      openingActivityRef.current = false;
      setOpeningActivity(null);
      Alert.alert(t('Could not open practice'), t('Please try again.'));
    }
  }, [currentActivity.id, navigateToActivity, t]);

  const startPractice = useCallback(async () => {
    if (isFreePractice) await startFreePractice();
    else await openSelectedActivity();
  }, [isFreePractice, openSelectedActivity, startFreePractice]);

  const buttonStatus = openingActivity || starting ? 'loading' : isFreePractice ? audioStatus : 'ready';
  const startTitle = openingActivity
    ? 'OPENING…'
    : starting
      ? 'STARTING…'
      : isFreePractice
        ? audioStatus === 'ready'
          ? 'START PRACTICE'
          : audioStatus === 'error'
            ? 'RETRY AUDIO SETUP'
            : 'PREPARING AUDIO…'
        : currentActivity.id === 'focus'
          ? 'START FOCUS PRACTICE'
          : currentActivity.id === 'score'
            ? 'CHOOSE A SCORE'
            : 'OPEN LEARN RHYTHM';
  const startSubtitle = openingActivity
    ? loadingMessage
    : isFreePractice
      ? audioStatus === 'ready'
        ? 'Audio ready · tap to begin'
        : audioStatus === 'error'
          ? 'TAP TO PREPARE THE METRONOME AGAIN'
          : 'PREPARING THE METRONOME'
      : currentActivity.description;
  const startAccessibilityLabel = openingActivity
    ? t('Loading {activity}', { activity: t(loadingActivityTitle) })
    : isFreePractice
      ? audioStatus === 'ready'
        ? t('Start practice')
        : audioStatus === 'error'
          ? t('Retry audio setup')
          : t('Loading audio engine')
      : currentActivity.id === 'focus'
        ? t('Open focus practice')
        : currentActivity.id === 'score'
          ? t('Choose a score')
          : t('Open learn rhythm');

  return {
    colors,
    settings,
    featureFlags,
    updateSettings,
    t,
    starting,
    openingActivity,
    activityPickerVisible,
    selectedActivity,
    activityOptions,
    currentActivity,
    loadingMessage,
    isFreePractice,
    buttonStatus,
    startTitle,
    startSubtitle,
    startAccessibilityLabel,
    startPractice,
    onSelectTwoHand: () => updateSettings({ trainingMode: 'two-hand' }),
    onSelectSingleHand: () => updateSettings({ trainingMode: 'single-hand', singleHand: 'left' }),
    onOpenActivityPicker: () => setActivityPickerVisible(true),
    onCloseActivityPicker: () => setActivityPickerVisible(false),
    onSelectActivity: (activity: HomeActivity) => {
      setSelectedActivity(activity);
      setActivityPickerVisible(false);
    },
    onOpenRecords: () => router.push('/records'),
    onOpenSettings: () => router.push('/setup'),
  };
}
