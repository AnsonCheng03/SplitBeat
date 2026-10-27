import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import { DEFAULT_GOOD_WINDOW_MS, MAX_GOOD_WINDOW_MS, MIN_GOOD_WINDOW_MS } from '@/rhythm/timingCalibration';

export function signedMilliseconds(value: number): string {
  return `${value > 0 ? '+' : ''}${value} ms`;
}

export function useTimingSettingsScreen() {
  const { colors } = useTheme();
  const { settings, featureFlags, updateSettings } = useRhythmSession();
  const router = useRouter();

  useEffect(() => {
    if (!featureFlags.timingCalibration) router.replace('/setup');
  }, [featureFlags.timingCalibration, router]);

  const reset = () => updateSettings({
    leftTapOffsetMs: 0,
    rightTapOffsetMs: 0,
    goodWindowMs: DEFAULT_GOOD_WINDOW_MS,
  });

  const updateLeftOffset = (leftTapOffsetMs: number) => updateSettings({ leftTapOffsetMs });
  const updateRightOffset = (rightTapOffsetMs: number) => updateSettings({ rightTapOffsetMs });
  const updateGoodWindow = (goodWindowMs: number) => updateSettings({ goodWindowMs });
  const updateAutoCalibration = (autoCalibrationEnabled: boolean) => updateSettings({ autoCalibrationEnabled });

  return {
    colors,
    settings,
    updateSettings,
    reset,
    updateLeftOffset,
    updateRightOffset,
    updateGoodWindow,
    updateAutoCalibration,
    leftOffsetTitle: `LEFT TAP OFFSET · ${signedMilliseconds(settings.leftTapOffsetMs)}`,
    rightOffsetTitle: `RIGHT TAP OFFSET · ${signedMilliseconds(settings.rightTapOffsetMs)}`,
    goodWindowTitle: `ACCEPTABLE TIMING RANGE · ±${settings.goodWindowMs} MS`,
    strictEndpoint: `STRICT · ${MIN_GOOD_WINDOW_MS} ms`,
    wideEndpoint: `WIDE · ${MAX_GOOD_WINDOW_MS} ms`,
    minimumGoodWindowMs: MIN_GOOD_WINDOW_MS,
    maximumGoodWindowMs: MAX_GOOD_WINDOW_MS,
  };
}
