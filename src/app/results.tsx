import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Accelerometer } from 'expo-sensors';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MetronomeAudio } from '@/audio/metronome';
import { createReplayAudioEvents } from '@/audio/replay';
import { ResultsOverview } from '@/features/results/ResultsOverview';
import { ResultsMissedNotes } from '@/features/results/ResultsMissedNotes';
import { ResultsPerformanceBreakdown } from '@/features/results/ResultsPerformanceBreakdown';
import { ResultsFooter } from '@/features/results/ResultsFooter';
import { analyzeSessionSwingFeel, recountSessionFeel } from '@/rhythm/swingFeel';
import { LEARN_COURSE } from '@/rhythm/learnCourse';
import { createSessionDiagnosticLog } from '@/rhythm/sessionDiagnostic';
import {
  completeLearnLesson,
  recordLearnLessonResult,
  syncLearnProgressIfEnabled,
} from '@/store/learnProgress';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { ReplayPattern, RhythmicFeel, SessionResults } from '@/types/rhythm';
import { buildFeedback, replayErrorBarGroups, sessionAccuracy, weakestCombination } from '@/features/results/resultPresentation';

export default function ResultsScreen() {
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const { results, settings, sessionSettings, featureFlags, prepareRepeatExercise, savedPracticePairsLoaded, savePairsForLater, discardReplayData } = useRhythmSession();
  const router = useRouter();
  const { lessonId: rawLessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const lessonId = Array.isArray(rawLessonId) ? rawLessonId[0] : rawLessonId;
  const [replay, setReplay] = useState<{ barIndex: number; playbackId: number; isPlaying: boolean; isStarting: boolean } | null>(null);
  const replaySequenceRef = useRef(0);
  const replayAudioRef = useRef<{ playbackId: number; audio: MetronomeAudio } | null>(null);
  const [startingAgain, setStartingAgain] = useState(false);
  const [showMissedNotes, setShowMissedNotes] = useState(false);
  const [savedPracticeBars, setSavedPracticeBars] = useState<Set<number>>(() => new Set());
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [lessonRating, setLessonRating] = useState<Awaited<ReturnType<typeof recordLearnLessonResult>>>(null);
  const [showDiagnosticExport, setShowDiagnosticExport] = useState(false);
  const [exportingDiagnostic, setExportingDiagnostic] = useState(false);
  const [countAsFeel, setCountAsFeel] = useState<RhythmicFeel>(results?.feel ?? 'straight');
  const completionAttemptedRef = useRef<string | null>(null);
  const courseLesson = LEARN_COURSE.find((lesson) => lesson.id === lessonId);
  const lessonAccuracy = results ? sessionAccuracy(results) : 0;
  const countedResults = useMemo(
    () => results ? recountSessionFeel(results, countAsFeel) : null,
    [countAsFeel, results],
  );
  const viewResults = countedResults ?? results!;
  const swingFeelAnalysis = useMemo(
    () => results ? analyzeSessionSwingFeel(results) : null,
    [results],
  );
  const replayErrorBars = replayErrorBarGroups(viewResults);
  const extraTapCount = (viewResults?.replayTaps ?? []).filter((tap) => !tap.matchedEventId).length;
  const replaySoundEnabled = (sessionSettings ?? settings).soundEnabled && featureFlags.soundEffects;

  useEffect(() => {
    if (!results || showDiagnosticExport) return;
    let disposed = false;
    let previous: { x: number; y: number; z: number } | null = null;
    let shakeImpulses = 0;
    let lastImpulseAt = 0;
    let lastShakeAt = 0;
    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;

    void Accelerometer.isAvailableAsync().then((available) => {
      if (!available || disposed) return;
      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener((acceleration) => {
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
      });
    }).catch(() => undefined);

    return () => {
      disposed = true;
      subscription?.remove();
    };
  }, [results, showDiagnosticExport]);

  const stopReplayAudio = useCallback(async (playbackId?: number) => {
    const current = replayAudioRef.current;
    if (!current || (playbackId !== undefined && current.playbackId !== playbackId)) return;
    replayAudioRef.current = null;
    try {
      await current.audio.stop();
    } catch {
      // Audio teardown is best effort; it must not interrupt visual replay.
    }
  }, []);

  useEffect(() => {
    if (!results || !courseLesson || completionAttemptedRef.current === courseLesson.id) return;
    completionAttemptedRef.current = courseLesson.id;
    void Promise.all([
      completeLearnLesson(courseLesson.id),
      recordLearnLessonResult(courseLesson.id, lessonAccuracy),
    ]).then(([completedIds, rating]) => {
      setLessonCompleted(completedIds.includes(courseLesson.id));
      setLessonRating(rating);
      void syncLearnProgressIfEnabled().catch(() => {});
    });
  }, [courseLesson, lessonAccuracy, results]);

  useFocusEffect(useCallback(() => () => {
    void stopReplayAudio();
    discardReplayData();
  }, [discardReplayData, stopReplayAudio]));

  const replayBar = useCallback(async (
    barIndex: number,
    expectedEvents: NonNullable<SessionResults['replayExpectedEvents']>,
    taps: NonNullable<SessionResults['replayTaps']>,
    beatsPerBar: number,
  ) => {
    replaySequenceRef.current += 1;
    const playbackId = replaySequenceRef.current;
    setReplay({ barIndex, playbackId, isPlaying: false, isStarting: true });
    await stopReplayAudio();
    if (playbackId !== replaySequenceRef.current) return;

    if (!replaySoundEnabled || process.env.EXPO_PUBLIC_E2E_SILENT === '1') {
      setReplay({ barIndex, playbackId, isPlaying: true, isStarting: false });
      return;
    }

    try {
      const audio = new MetronomeAudio();
      replayAudioRef.current = { playbackId, audio };
      await audio.prepare();
      await audio.resume();
      if (playbackId !== replaySequenceRef.current) {
        await stopReplayAudio(playbackId);
        return;
      }
      const replayEvents = createReplayAudioEvents(barIndex, beatsPerBar, results?.bpm ?? 60, expectedEvents, taps);
      audio.playReplayEvents(replayEvents, {
        metronome: settings.metronomeSound,
        leftHand: settings.leftHandSound,
        rightHand: settings.rightHandSound,
      }, beatsPerBar * 60_000 / (results?.bpm ?? 60));
      setReplay({ barIndex, playbackId, isPlaying: true, isStarting: false });
    } catch {
      await stopReplayAudio(playbackId);
      if (playbackId !== replaySequenceRef.current) return;
      setReplay({ barIndex, playbackId, isPlaying: true, isStarting: false });
      Alert.alert(t('Replay sound unavailable'), t('The visual replay will continue. Check your device audio and try again.'));
    }
  }, [replaySoundEnabled, results, settings.leftHandSound, settings.metronomeSound, settings.rightHandSound, stopReplayAudio, t]);

  const finishVisualReplay = useCallback((barIndex: number, playbackId: number) => {
    setReplay((current) => current?.barIndex === barIndex && current.playbackId === playbackId
      ? { ...current, isPlaying: false, isStarting: false }
      : current,
    );
    void stopReplayAudio(playbackId);
  }, [stopReplayAudio]);

  const startAgain = async () => {
    if (startingAgain) return;
    setStartingAgain(true);
    try {
      await prepareRepeatExercise();
      discardReplayData();
      router.replace(lessonId ? { pathname: '/practice', params: { lessonId } } : '/practice');
    } catch {
      setStartingAgain(false);
      Alert.alert(t('Audio could not start'), t('Check your device audio settings and try again.'));
    }
  };

  const saveBarForLater = (barIndex: number, patterns: readonly ReplayPattern[]) => {
    savePairsForLater(patterns, viewResults.timeSignature);
    setSavedPracticeBars((current) => new Set([...current, barIndex]));
  };

  const exportSessionLog = async () => {
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
      const log = createSessionDiagnosticLog(results, sessionSettings ?? settings, {
        exportedAt,
        appVersion: Constants.expoConfig?.version ?? 'unknown',
        buildNumber: Constants.nativeBuildVersion ?? 'unknown',
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
  };

  const confirmSessionLogExport = () => {
    Alert.alert(
      t('Export session data?'),
      t('The JSON contains your session settings, generated notes, and tap times. It is shared only after you choose an app.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Continue'), onPress: () => void exportSessionLog() },
      ],
    );
  };

  if (!results) {
    return (
      <SafeAreaView testID="results.screen" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.muted }}>{t('No session results yet.')}</Text>
        <Pressable onPress={() => router.replace('/setup')} style={{ padding: 16 }}>
          <Text style={{ color: colors.left, fontWeight: '800' }}>{t('SET UP A SESSION')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const weakest = weakestCombination(viewResults);
  const feedback = buildFeedback(viewResults, weakest, t);

  return (
    <SafeAreaView testID="results.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <ResultsOverview
          results={viewResults}
          courseLesson={courseLesson}
          lessonCompleted={lessonCompleted}
          lessonRating={lessonRating}
          swingFeelAnalysis={swingFeelAnalysis}
          originalFeel={results.feel}
          countAsFeel={countAsFeel}
          onCountAsFeel={setCountAsFeel}
          gameCenterEnabled={featureFlags.gameCenter}
        />

        {featureFlags.missedNoteReplay && replayErrorBars.length > 0 ? (
          <ResultsMissedNotes
            results={viewResults}
            groups={replayErrorBars}
            extraTapCount={extraTapCount}
            expanded={showMissedNotes}
            replay={replay}
            replaySoundEnabled={replaySoundEnabled}
            savedBars={savedPracticeBars}
            savedPracticePairsLoaded={savedPracticePairsLoaded}
            focusPracticeEnabled={featureFlags.focusPractice}
            onToggle={() => setShowMissedNotes((expanded) => !expanded)}
            onReplay={(barIndex, expectedEvents, taps, beatsPerBar) => void replayBar(barIndex, expectedEvents, taps, beatsPerBar)}
            onSaveForLater={saveBarForLater}
            onPlaybackEnd={finishVisualReplay}
          />
        ) : null}

        <ResultsPerformanceBreakdown
          results={viewResults}
          expanded={showBreakdown}
          feedback={feedback}
          onToggle={() => setShowBreakdown((expanded) => !expanded)}
        />

        <ResultsFooter
          courseLesson={courseLesson}
          lessonCompleted={lessonCompleted}
          featureFlags={featureFlags}
          startingAgain={startingAgain}
          showDiagnosticExport={showDiagnosticExport}
          exportingDiagnostic={exportingDiagnostic}
          onStartAgain={() => void startAgain()}
          onContinueLearning={() => {
            discardReplayData();
            router.replace({ pathname: '/learn', params: { lessonId } });
          }}
          onConfirmExport={confirmSessionLogExport}
          onChangeSettings={() => {
            discardReplayData();
            router.replace('/setup');
          }}
          onViewRecords={() => {
            discardReplayData();
            router.replace('/records');
          }}
          onBackHome={() => {
            discardReplayData();
            router.replace('/');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
