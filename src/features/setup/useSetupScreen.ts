import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { useTapTempo } from '@/features/tempo/useTapTempo';
import { keepModeLoadingVisible, waitForModeLoadingFrame } from '@/features/modeLoadingFeedback';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { DurationOption } from '@/types/rhythm';

export const setupDurations: { label: string; value: DurationOption }[] = [
  { label: '30 sec', value: 30 },
  { label: '60 sec', value: 60 },
  { label: '2 min', value: 120 },
  { label: 'Endless', value: 'endless' },
];

export function useSetupScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings, audioStatus, prepareExercise } = useRhythmSession();
  const { t } = useI18n();
  const [starting, setStarting] = useState(false);
  const router = useRouter();
  const onTempoTap = useTapTempo((bpm) => updateSettings({ bpm }));

  const startPractice = async () => {
    if (starting || audioStatus === 'loading') return;
    const loadingStartedAt = Date.now();
    setStarting(true);
    try {
      await waitForModeLoadingFrame();
      await prepareExercise();
      await keepModeLoadingVisible(loadingStartedAt);
      router.replace('/practice');
    } catch {
      Alert.alert(t('Audio could not start'), t('Check your device audio settings and try again.'));
    } finally {
      setStarting(false);
    }
  };

  const changeTempo = (amount: number) => {
    updateSettings({ bpm: Math.min(200, Math.max(40, settings.bpm + amount)) });
  };

  return {
    colors,
    t,
    settings,
    audioStatus,
    starting,
    durations: setupDurations,
    onStartPractice: startPractice,
    onDecreaseTempo: () => changeTempo(-1),
    onIncreaseTempo: () => changeTempo(1),
    onTempoChange: (bpm: number) => updateSettings({ bpm }),
    onTempoTap,
    onDurationChange: (durationSeconds: DurationOption) => updateSettings({ durationSeconds }),
    startAccessibilityLabel: audioStatus === 'error'
      ? 'Retry audio setup before starting exercise'
      : audioStatus === 'ready'
        ? 'Start exercise'
        : 'Loading audio engine',
    startTitle: starting
      ? 'STARTING SESSION…'
      : audioStatus === 'ready'
        ? 'START PRACTICE'
        : audioStatus === 'error'
          ? 'RETRY AUDIO SETUP'
          : 'PREPARING AUDIO…',
    startSubtitle: audioStatus === 'ready'
      ? 'Tap to begin your session'
      : audioStatus === 'error'
        ? 'Check audio setup and tap to retry'
        : 'Preparing the metronome and hand sounds',
  };
}
