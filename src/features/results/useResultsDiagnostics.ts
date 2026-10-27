import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Accelerometer } from 'expo-sensors';
import { useI18n } from '@/i18n/I18nProvider';
import { createSessionDiagnosticLog } from '@/rhythm/sessionDiagnostic';
import type { LearnLesson } from '@/rhythm/learnCourse';
import type { ExerciseSettings, SessionResults } from '@/types/rhythm';
import type { FeatureFlags } from '@/features/featureFlags';

export function useResultsDiagnostics({
  results,
  settings,
  sessionSettings,
  featureFlags,
  courseLesson,
}: {
  results: SessionResults | null;
  settings: ExerciseSettings;
  sessionSettings: ExerciseSettings | null;
  featureFlags: FeatureFlags;
  courseLesson?: LearnLesson;
}) {
  const { t, locale } = useI18n();
  const [showDiagnosticExport, setShowDiagnosticExport] = useState(false);
  const [exportingDiagnostic, setExportingDiagnostic] = useState(false);

  useEffect(() => {
    if (!results || showDiagnosticExport) return;
    let disposed = false;
    let previous: { x: number; y: number; z: number } | null = null;
    let shakeImpulses = 0;
    let lastImpulseAt = 0;
    let lastShakeAt = 0;
    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;

    const detectShake = (acceleration: { x: number; y: number; z: number }) => {
      const current = { x: acceleration.x, y: acceleration.y, z: acceleration.z };
      if (previous) {
        const delta = Math.hypot(
          current.x - previous.x,
          current.y - previous.y,
          current.z - previous.z,
        );
        const now = Date.now();
        if (delta > 1.25) {
          shakeImpulses = now - lastImpulseAt < 650 ? shakeImpulses + 1 : 1;
          lastImpulseAt = now;
          if (shakeImpulses >= 2 && now - lastShakeAt > 1_500) {
            lastShakeAt = now;
            setShowDiagnosticExport(true);
            subscription?.remove();
          }
        }
      }
      previous = current;
    };

    void Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!available || disposed) return;
        Accelerometer.setUpdateInterval(100);
        subscription = Accelerometer.addListener(detectShake);
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      subscription?.remove();
    };
  }, [results, showDiagnosticExport]);

  const exportSessionLog = useCallback(async () => {
    if (!results || exportingDiagnostic) return;
    setExportingDiagnostic(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t('Could not export session log'), t('Sharing is not available on this device.'));
        return;
      }
      const cacheDirectory = FileSystem.cacheDirectory;
      if (!cacheDirectory) throw new Error('The app cache directory is unavailable.');

      const exportedAt = new Date().toISOString();
      const nativeBuildNumber = Platform.OS === 'ios'
        ? Constants.platform?.ios?.buildNumber
        : Platform.OS === 'android'
          ? Constants.platform?.android?.versionCode?.toString()
          : undefined;
      const configuredBuildNumber = Platform.OS === 'ios'
        ? Constants.expoConfig?.ios?.buildNumber
        : Platform.OS === 'android'
          ? Constants.expoConfig?.android?.versionCode?.toString()
          : undefined;
      const log = createSessionDiagnosticLog(results, sessionSettings ?? settings, {
        exportedAt,
        appVersion: Constants.expoConfig?.version ?? 'unknown',
        buildNumber: nativeBuildNumber ?? configuredBuildNumber ?? Constants.nativeBuildVersion ?? 'unknown',
        platform: Platform.OS,
        operatingSystemVersion: String(Platform.Version),
        locale,
        featureFlags,
        ...(courseLesson ? { courseLesson: { id: courseLesson.id, title: courseLesson.title } } : {}),
      });
      const safeTimestamp = exportedAt.replace(/[:.]/g, '-');
      const fileUri = `${cacheDirectory}split-beat-session-${safeTimestamp}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(log, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        UTI: 'public.json',
        dialogTitle: t('Share session log'),
      });
    } catch {
      Alert.alert(t('Could not export session log'), t('Try again after checking available storage.'));
    } finally {
      setExportingDiagnostic(false);
    }
  }, [courseLesson, exportingDiagnostic, featureFlags, locale, results, sessionSettings, settings, t]);

  const confirmSessionLogExport = useCallback(() => {
    Alert.alert(
      t('Export session data?'),
      t('The JSON contains your session settings, generated notes, and tap times. It is shared only after you choose an app.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Continue'), onPress: () => void exportSessionLog() },
      ],
    );
  }, [exportSessionLog, t]);

  return { showDiagnosticExport, exportingDiagnostic, confirmSessionLogExport };
}
