import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MetronomeAudio } from '@/audio/metronome';
import { SOUND_OPTIONS } from '@/audio/soundPresets';
import { normalizeFlashSource } from '@/rhythm/flashSource';
import { applyFeatureFlagsToPatternPairs, applyFeatureFlagsToSettings, BUILD_FEATURE_FLAGS } from '@/features/featureFlags';
import type { FeatureFlags } from '@/features/featureFlags';
import {
  applyChallengeBarOutcomes,
  applyChallengeOutcomes,
  challengeMessage,
  createChallengeStreaks,
} from '@/rhythm/challenge';
import { scoreFromMeasure } from '@/rhythm/scoreStaff';
import { getSessionDurationSeconds, RhythmTimingEngine } from '@/rhythm/timingEngine';
import { waitForNotationReady } from '@/rhythm/notationReadiness';
import { legacyMixturesIncludeRests, mixtureNoteValuesFromLegacyIds } from '@/rhythm/mixtures';
import {
  DEFAULT_GOOD_WINDOW_MS,
  normalizeGoodWindowMs,
  normalizeTapOffsetMs,
} from '@/rhythm/timingCalibration';
import { timeSignatureMetrics } from '@/rhythm/subdivisions';
import { alignedPatternChangeIntervalBeats } from '@/rhythm/patternChange';
import type { CombinationProgress, SavedPracticePair } from '@/rhythm/targetedPractice';
import { useCombinationProgress, useSavedPracticePairs, useSessionHistory } from '@/store/useSessionPersistence';
import { useSessionClock } from '@/store/useSessionClock';
import type { SessionRecord } from '@/store/sessionHistory';
import { MIXTURE_NOTE_VALUES, MIXTURE_PATTERN_IDS, SUBDIVISIONS, TIME_SIGNATURES } from '@/types/rhythm';
import type { ImportedRhythmScore } from '@/types/importedScore';
import type {
  ExerciseSettings,
  Hand,
  ChallengeMissStreak,
  ChallengeWrongBarStreak,
  SessionResults,
  SessionSnapshot,
  RhythmicFeel,
  RhythmPatternPair,
  SoundPreset,
  Subdivision,
  TapFeedback,
  TapInputSource,
  TimeSignature,
} from '@/types/rhythm';

const SETTINGS_KEY = 'two-hand-rhythm-trainer.settings.v1';
const COUNT_IN_BEATS = 3;
const AUDIO_LEAD_IN_MS = 300;
const FORCE_SILENT_E2E = process.env.EXPO_PUBLIC_E2E_SILENT === '1';
const LIVE_PRACTICE_SETTING_KEYS = [
  'soundEnabled',
  'backgroundMusicEnabled',
  'sessionCuesEnabled',
  'metronomeSound',
  'leftHandSound',
  'rightHandSound',
  'leftFlashSource',
  'rightFlashSource',
  'tapResultFlashEnabled',
  'referenceRhythmEnabled',
  'leftTapOffsetMs',
  'rightTapOffsetMs',
  'autoCalibrationEnabled',
  'goodWindowMs',
  'hapticsEnabled',
] as const satisfies readonly (keyof ExerciseSettings)[];

type LivePracticeSettingKey = (typeof LIVE_PRACTICE_SETTING_KEYS)[number];

function livePracticeSettingsPatch(
  patch: Partial<ExerciseSettings>,
): Partial<Pick<ExerciseSettings, LivePracticeSettingKey>> {
  const livePatch: Partial<Pick<ExerciseSettings, LivePracticeSettingKey>> = {};
  for (const key of LIVE_PRACTICE_SETTING_KEYS) {
    if (patch[key] !== undefined) Object.assign(livePatch, { [key]: patch[key] });
  }
  return livePatch;
}

export type AudioPreparationStatus = 'loading' | 'ready' | 'error';

export interface ExercisePreparationOptions {
  settings?: Partial<ExerciseSettings>;
  patternPairs?: readonly RhythmPatternPair[];
  patternPairWeights?: readonly number[];
}

export const DEFAULT_SETTINGS: ExerciseSettings = {
  bpm: 60,
  timeSignature: '4/4',
  durationSeconds: 60,
  changeIntervalBeats: 4,
  restBetweenChanges: false,
  handRestsEnabled: false,
  enabledSubdivisions: ['quarter', 'eighth'],
  enabledMixtures: [],
  mixtureNoteValues: [],
  mixtureRestsEnabled: false,
  feel: 'straight',
  graceNotesEnabled: false,
  trainingMode: 'two-hand',
  practiceDisplayMode: 'rhythm',
  scoreMotionMode: 'fade',
  singleHand: 'left',
  soundEnabled: !FORCE_SILENT_E2E,
  backgroundMusicEnabled: false,
  sessionCuesEnabled: true,
  metronomeSound: 'wood',
  leftHandSound: 'soft',
  rightHandSound: 'beep',
  leftFlashSource: 'tap',
  rightFlashSource: 'tap',
  tapResultFlashEnabled: true,
  referenceRhythmEnabled: false,
  challengeAction: 'off',
  challengeTriggerMode: 'notes',
  challengeMissStreak: 3,
  challengeWrongBarStreak: 2,
  leftTapOffsetMs: 0,
  rightTapOffsetMs: 0,
  autoCalibrationEnabled: true,
  goodWindowMs: DEFAULT_GOOD_WINDOW_MS,
  hapticsEnabled: false,
};

export interface SessionContextValue {
  settings: ExerciseSettings;
  featureFlags: FeatureFlags;
  sessionSettings: ExerciseSettings | null;
  updateSettings: (patch: Partial<ExerciseSettings>) => void;
  resetSettings: () => void;
  audioStatus: AudioPreparationStatus;
  prepareAudio: () => Promise<void>;
  prepareExercise: (score?: ImportedRhythmScore, options?: ExercisePreparationOptions) => Promise<void>;
  prepareRepeatExercise: () => Promise<void>;
  startPreparedExercise: () => Promise<void>;
  exercisePrepared: boolean;
  stopExercise: () => void;
  pauseExercise: () => void;
  resumeExercise: () => Promise<void>;
  restartPausedExercise: (barsBack: number, bpm: number) => Promise<void>;
  restartExerciseWithFeel: (feel: RhythmicFeel) => Promise<void>;
  registerTap: (hand: Hand, timestamp: number, inputSource?: TapInputSource) => TapFeedback | null;
  snapshot: SessionSnapshot | null;
  results: SessionResults | null;
  sessionHistory: SessionRecord[];
  sessionHistoryLoaded: boolean;
  combinationProgress: CombinationProgress[];
  combinationProgressLoaded: boolean;
  savedPracticePairs: SavedPracticePair[];
  savedPracticePairsLoaded: boolean;
  savePairsForLater: (pairs: readonly RhythmPatternPair[], timeSignature: TimeSignature) => void;
  removeSavedPracticePair: (id: string) => void;
  discardReplayData: () => void;
}

function restoreSettings(raw: string | null): ExerciseSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<ExerciseSettings>;
    const enabledSubdivisions = Array.isArray(parsed.enabledSubdivisions)
      ? SUBDIVISIONS.filter((item) => parsed.enabledSubdivisions?.includes(item))
      : DEFAULT_SETTINGS.enabledSubdivisions;
    const validSubdivisions =
      enabledSubdivisions.length >= 2 ? enabledSubdivisions : DEFAULT_SETTINGS.enabledSubdivisions;
    const legacyEnabledMixtures = Array.isArray(parsed.enabledMixtures)
      ? MIXTURE_PATTERN_IDS.filter((item) => parsed.enabledMixtures?.includes(item))
      : DEFAULT_SETTINGS.enabledMixtures;
    const mixtureNoteValues = Array.isArray(parsed.mixtureNoteValues)
      ? MIXTURE_NOTE_VALUES.filter((item) => parsed.mixtureNoteValues?.includes(item))
      : mixtureNoteValuesFromLegacyIds(legacyEnabledMixtures);
    const durationSeconds = [30, 60, 120, 'endless'].includes(
      parsed.durationSeconds as number | 'endless',
    )
      ? (parsed.durationSeconds as ExerciseSettings['durationSeconds'])
      : DEFAULT_SETTINGS.durationSeconds;
    const changeIntervalBeats = [1, 2, 4, 8].includes(parsed.changeIntervalBeats ?? -1)
      ? (parsed.changeIntervalBeats as ExerciseSettings['changeIntervalBeats'])
      : DEFAULT_SETTINGS.changeIntervalBeats;
    const timeSignature = TIME_SIGNATURES.includes(
      parsed.timeSignature as (typeof TIME_SIGNATURES)[number],
    )
      ? (parsed.timeSignature as ExerciseSettings['timeSignature'])
      : DEFAULT_SETTINGS.timeSignature;
    const restoreSound = (sound: unknown, fallback: SoundPreset): SoundPreset =>
      SOUND_OPTIONS.some((option) => option.value === sound) ? (sound as SoundPreset) : fallback;

    return {
      bpm:
        typeof parsed.bpm === 'number'
          ? Math.max(40, Math.min(200, Math.round(parsed.bpm)))
          : DEFAULT_SETTINGS.bpm,
      timeSignature,
      durationSeconds,
      changeIntervalBeats,
      restBetweenChanges: parsed.restBetweenChanges === true,
      handRestsEnabled: parsed.handRestsEnabled === true,
      enabledSubdivisions: validSubdivisions as Subdivision[],
      enabledMixtures: [],
      mixtureNoteValues: [...mixtureNoteValues],
      mixtureRestsEnabled: parsed.mixtureRestsEnabled === true || legacyMixturesIncludeRests(legacyEnabledMixtures),
      feel: parsed.feel === 'swing' ? 'swing' : 'straight',
      graceNotesEnabled:
        typeof parsed.graceNotesEnabled === 'boolean'
          ? parsed.graceNotesEnabled
          : DEFAULT_SETTINGS.graceNotesEnabled,
      trainingMode: parsed.trainingMode === 'single-hand' ? 'single-hand' : 'two-hand',
      practiceDisplayMode: parsed.practiceDisplayMode === 'score' ? 'score' : 'rhythm',
      scoreMotionMode: parsed.scoreMotionMode === 'slide' || parsed.scoreMotionMode === 'slide-per-note' || parsed.scoreMotionMode === 'fade'
        ? parsed.scoreMotionMode
        : DEFAULT_SETTINGS.scoreMotionMode,
      singleHand: parsed.singleHand === 'right' ? 'right' : 'left',
      soundEnabled: FORCE_SILENT_E2E
        ? false
        : typeof parsed.soundEnabled === 'boolean'
          ? parsed.soundEnabled
          : true,
      backgroundMusicEnabled: parsed.backgroundMusicEnabled === true,
      sessionCuesEnabled: typeof parsed.sessionCuesEnabled === 'boolean'
        ? parsed.sessionCuesEnabled
        : DEFAULT_SETTINGS.sessionCuesEnabled,
      metronomeSound: restoreSound(parsed.metronomeSound, DEFAULT_SETTINGS.metronomeSound),
      leftHandSound: restoreSound(parsed.leftHandSound, DEFAULT_SETTINGS.leftHandSound),
      rightHandSound: restoreSound(parsed.rightHandSound, DEFAULT_SETTINGS.rightHandSound),
      leftFlashSource: normalizeFlashSource(parsed.leftFlashSource, DEFAULT_SETTINGS.leftFlashSource),
      rightFlashSource: normalizeFlashSource(parsed.rightFlashSource, DEFAULT_SETTINGS.rightFlashSource),
      tapResultFlashEnabled: typeof parsed.tapResultFlashEnabled === 'boolean'
        ? parsed.tapResultFlashEnabled
        : DEFAULT_SETTINGS.tapResultFlashEnabled,
      referenceRhythmEnabled: parsed.referenceRhythmEnabled === true,
      challengeAction: parsed.challengeAction === 'pause' || parsed.challengeAction === 'stop'
        ? parsed.challengeAction
        : 'off',
      challengeMissStreak: [1, 2, 3, 5].includes(parsed.challengeMissStreak ?? -1)
        ? parsed.challengeMissStreak as ChallengeMissStreak
        : DEFAULT_SETTINGS.challengeMissStreak,
      challengeTriggerMode: parsed.challengeTriggerMode === 'bars' ? 'bars' : 'notes',
      challengeWrongBarStreak: [1, 2, 3, 5].includes(parsed.challengeWrongBarStreak ?? -1)
        ? parsed.challengeWrongBarStreak as ChallengeWrongBarStreak
        : DEFAULT_SETTINGS.challengeWrongBarStreak,
      leftTapOffsetMs:
        typeof parsed.leftTapOffsetMs === 'number'
          ? normalizeTapOffsetMs(parsed.leftTapOffsetMs)
          : DEFAULT_SETTINGS.leftTapOffsetMs,
      rightTapOffsetMs:
        typeof parsed.rightTapOffsetMs === 'number'
          ? normalizeTapOffsetMs(parsed.rightTapOffsetMs)
          : DEFAULT_SETTINGS.rightTapOffsetMs,
      autoCalibrationEnabled: typeof parsed.autoCalibrationEnabled === 'boolean'
        ? parsed.autoCalibrationEnabled
        : DEFAULT_SETTINGS.autoCalibrationEnabled,
      goodWindowMs:
        typeof parsed.goodWindowMs === 'number'
          ? normalizeGoodWindowMs(parsed.goodWindowMs)
          : DEFAULT_SETTINGS.goodWindowMs,
      hapticsEnabled: typeof parsed.hapticsEnabled === 'boolean' ? parsed.hapticsEnabled : false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function monotonicNow(): number {
  return globalThis.performance.now();
}

function resolveSessionConfiguration(
  settings: ExerciseSettings,
  score: ImportedRhythmScore | undefined,
  options: ExercisePreparationOptions,
  featureFlags: FeatureFlags,
) {
  const configuredSettings = applyFeatureFlagsToSettings(
    { ...settings, ...options.settings },
    featureFlags,
  );
  const activeSettings = score
    ? {
        ...configuredSettings,
        bpm: score.bpm ?? configuredSettings.bpm,
        timeSignature: score.timeSignature,
      }
    : configuredSettings;
  const patternPairs = applyFeatureFlagsToPatternPairs(
    options.patternPairs,
    featureFlags,
    configuredSettings.enabledSubdivisions,
  );

  return { activeSettings, patternPairs };
}

function createSessionTiming(
  settings: ExerciseSettings,
  score: ImportedRhythmScore | undefined,
  performanceNow: number,
  audioNow: number,
) {
  const metrics = timeSignatureMetrics(settings.bpm, settings.timeSignature);
  const countInDurationMs = COUNT_IN_BEATS * metrics.beatDurationMs;

  return {
    metrics,
    sessionStartTime: performanceNow + AUDIO_LEAD_IN_MS + countInDurationMs,
    sessionStartAudioTime: audioNow + AUDIO_LEAD_IN_MS / 1_000 + countInDurationMs / 1_000,
    patternChangeIntervalBeats: alignedPatternChangeIntervalBeats(
      settings.changeIntervalBeats,
      metrics.beatsPerBar,
    ),
    durationSeconds: getSessionDurationSeconds(settings, score),
  };
}

function createAudioStartOptions(
  settings: ExerciseSettings,
  score: ImportedRhythmScore | undefined,
  engine: RhythmTimingEngine,
  timing: ReturnType<typeof createSessionTiming>,
): Parameters<MetronomeAudio['start']>[0] {
  return {
    sessionStartAudioTime: timing.sessionStartAudioTime,
    sessionStartTime: timing.sessionStartTime,
    bpm: settings.bpm,
    beatsPerBar: timing.metrics.beatsPerBar,
    durationSeconds: timing.durationSeconds,
    soundEnabled: settings.soundEnabled && !FORCE_SILENT_E2E,
    backgroundMusicEnabled: settings.backgroundMusicEnabled,
    sessionCuesEnabled: settings.sessionCuesEnabled,
    changeIntervalBeats: timing.patternChangeIntervalBeats,
    patternChangesEnabled: !score,
    referenceRhythmEnabled: settings.referenceRhythmEnabled,
    getReferenceEventsThrough: (timeMs) => engine.getReferenceEventsThrough(timeMs),
    sounds: {
      metronome: settings.metronomeSound,
      leftHand: settings.leftHandSound,
      rightHand: settings.rightHandSound,
    },
  };
}

function restartScoreFromMeasure(
  score: ImportedRhythmScore | undefined,
  currentMeasureIndex: number | undefined,
  barsBack: number,
  bpm: number,
): ImportedRhythmScore | undefined {
  if (!score) return undefined;
  const foundMeasureIndex = score.measures.findIndex((measure) => measure.index === currentMeasureIndex);
  const currentIndex = foundMeasureIndex < 0 ? 0 : foundMeasureIndex;
  const barsToRewind = Math.max(0, Math.floor(barsBack));
  const startMeasureIndex = Math.max(0, currentIndex - barsToRewind);

  return { ...scoreFromMeasure(score, startMeasureIndex), bpm };
}

function createRestartOptions(
  previousOptions: ExercisePreparationOptions,
  activeSettings: ExerciseSettings,
  overrides: Partial<ExerciseSettings>,
): ExercisePreparationOptions {
  return {
    ...previousOptions,
    settings: { ...previousOptions.settings, ...activeSettings, ...overrides },
  };
}

export function useSessionController(): SessionContextValue {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const featureFlags = BUILD_FEATURE_FLAGS;
  const featureFlagsRef = useRef<FeatureFlags>(BUILD_FEATURE_FLAGS);
  const [sessionSettings, setSessionSettings] = useState<ExerciseSettings | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [results, setResults] = useState<SessionResults | null>(null);
  const { records: sessionHistory, loaded: sessionHistoryLoaded, recordSession } = useSessionHistory(featureFlags.sessionRecords);
  const { progress: combinationProgress, loaded: combinationProgressLoaded, recordSessionResults } = useCombinationProgress(featureFlags.focusPractice);
  const {
    pairs: savedPracticePairs,
    loaded: savedPracticePairsLoaded,
    savePairsForLater,
    removeSavedPracticePair,
  } = useSavedPracticePairs();
  const [audioStatus, setAudioStatus] = useState<AudioPreparationStatus>('loading');
  const engineRef = useRef<RhythmTimingEngine | null>(null);
  const audioRef = useRef<MetronomeAudio | null>(null);
  const audioPreparationRef = useRef<Promise<void> | null>(null);
  const { stopSessionClock: stopTimers, scheduleSessionClock } = useSessionClock();
  const sessionIdRef = useRef<string | null>(null);
  const pendingScoreRef = useRef<ImportedRhythmScore | undefined>(undefined);
  const lastScoreRef = useRef<ImportedRhythmScore | undefined>(undefined);
  const pendingOptionsRef = useRef<ExercisePreparationOptions>({});
  const lastOptionsRef = useRef<ExercisePreparationOptions>({});
  const sessionSettingsRef = useRef<ExerciseSettings>(DEFAULT_SETTINGS);
  const challengeStreaksRef = useRef(createChallengeStreaks());
  const challengeWrongBarIndexesRef = useRef(new Set<number>());
  const challengeWrongBarStreakRef = useRef(0);
  const challengePausedRef = useRef(false);
  const [exercisePrepared, setExercisePrepared] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (active) setSettings(restoreSettings(raw));
      })
      .catch(() => {
        if (active) setSettings(DEFAULT_SETTINGS);
      })
      .finally(() => {
        if (active) setSettingsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (settingsLoaded) void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, settingsLoaded]);

  const prepareAudio = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.prepare();
      setAudioStatus('ready');
      return;
    }
    if (audioPreparationRef.current) return audioPreparationRef.current;

    const preparation = new Promise<void>((resolve, reject) => {
      requestAnimationFrame(() => {
        setAudioStatus('loading');
        requestAnimationFrame(() => {
          let audio: MetronomeAudio;
          try {
            audio = new MetronomeAudio();
            audioRef.current = audio;
          } catch (error) {
            reject(error);
            return;
          }
          void audio.prepare().then(resolve, (error: unknown) => {
            void audio.stop();
            if (audioRef.current === audio) audioRef.current = null;
            reject(error);
          });
        });
      });
    });
    audioPreparationRef.current = preparation;

    try {
      await preparation;
      setAudioStatus('ready');
    } catch (error) {
      setAudioStatus('error');
      throw error;
    } finally {
      if (audioPreparationRef.current === preparation) audioPreparationRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    const startupPreparation = setTimeout(() => {
      void prepareAudio().catch(() => undefined);
    }, 0);
    return () => clearTimeout(startupPreparation);
  }, [prepareAudio, settingsLoaded]);

  useEffect(() => {
    audioRef.current?.setSoundEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  useEffect(() => {
    audioRef.current?.setReferenceRhythmEnabled(settings.referenceRhythmEnabled);
  }, [settings.referenceRhythmEnabled]);

  useEffect(() => {
    audioRef.current?.setBackgroundMusicEnabled(settings.backgroundMusicEnabled);
  }, [settings.backgroundMusicEnabled]);

  useEffect(() => {
    audioRef.current?.setSessionCuesEnabled(settings.sessionCuesEnabled);
  }, [settings.sessionCuesEnabled]);

  useEffect(() => {
    audioRef.current?.setSounds({
      metronome: settings.metronomeSound,
      leftHand: settings.leftHandSound,
      rightHand: settings.rightHandSound,
    });
  }, [settings.metronomeSound, settings.leftHandSound, settings.rightHandSound]);

  const updateSettings = useCallback((patch: Partial<ExerciseSettings>) => {
    const effectivePatch = FORCE_SILENT_E2E && patch.soundEnabled !== undefined
      ? { ...patch, soundEnabled: false }
      : patch;
    setSettings((current) => ({ ...current, ...effectivePatch }));
    const livePatch = livePracticeSettingsPatch(effectivePatch);
    if (engineRef.current && Object.keys(livePatch).length > 0) {
      sessionSettingsRef.current = { ...sessionSettingsRef.current, ...livePatch };
      setSessionSettings((current) => current ? { ...current, ...livePatch } : current);
      engineRef.current.recordSettingsChange(monotonicNow(), livePatch);
      engineRef.current.updateTimingCalibration({
        ...(livePatch.leftTapOffsetMs === undefined ? {} : { leftTapOffsetMs: livePatch.leftTapOffsetMs }),
        ...(livePatch.rightTapOffsetMs === undefined ? {} : { rightTapOffsetMs: livePatch.rightTapOffsetMs }),
        ...(livePatch.autoCalibrationEnabled === undefined ? {} : { autoCalibrationEnabled: livePatch.autoCalibrationEnabled }),
        ...(livePatch.goodWindowMs === undefined ? {} : { goodWindowMs: livePatch.goodWindowMs }),
      });
    }
  }, []);

  const resetSettings = useCallback(() => {
    updateSettings(DEFAULT_SETTINGS);
  }, [updateSettings]);

  const resetChallengeProgress = useCallback(() => {
    challengeStreaksRef.current = createChallengeStreaks();
    challengeWrongBarIndexesRef.current.clear();
    challengeWrongBarStreakRef.current = 0;
    challengePausedRef.current = false;
  }, []);

  const prepareAudioForPlayback = useCallback(async () => {
    const audio = audioRef.current ?? new MetronomeAudio();
    audioRef.current = audio;

    try {
      await audio.prepare();
      await audio.resume();
      setAudioStatus('ready');
      return audio;
    } catch (error) {
      sessionIdRef.current = null;
      setAudioStatus('error');
      void audio.stop();
      if (audioRef.current === audio) audioRef.current = null;
      throw error;
    }
  }, []);

  const saveCompletedSession = useCallback((completedResults: SessionResults) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    sessionIdRef.current = null;
    recordSession(sessionId, completedResults);
    recordSessionResults(completedResults);
  }, [recordSession, recordSessionResults]);

  const finalizeSession = useCallback((
    finalSnapshot: SessionSnapshot,
    finalResults: SessionResults,
  ) => {
    setSnapshot({ ...finalSnapshot, phase: 'finished', results: finalResults });
    setResults(finalResults);
    saveCompletedSession(finalResults);
    stopTimers();
    challengePausedRef.current = false;
    void audioRef.current?.stop();
    audioRef.current = null;
    engineRef.current = null;
  }, [saveCompletedSession, stopTimers]);

  const stopExercise = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const now = monotonicNow();
    const finalResults = engine.getResults(now);
    finalizeSession(engine.advance(now), finalResults);
  }, [finalizeSession]);

  const pauseForChallenge = useCallback((message: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    const now = monotonicNow();
    engine.pause(now);
    challengePausedRef.current = true;
    stopTimers();
    setSnapshot({ ...engine.advance(now), phase: 'paused', challengeMessage: message });
    void audioRef.current?.pause().catch(() => undefined);
  }, [stopTimers]);

  const pauseExercise = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || snapshot?.phase === 'paused' || snapshot?.phase === 'finished') return;
    const now = monotonicNow();
    if (snapshot?.resumeCountIn) engine.cancelResumeCountIn(now);
    engine.pause(now);
    const pausedSnapshot = engine.advance(now);
    if (pausedSnapshot.phase === 'finished') {
      stopExercise();
      return;
    }
    stopTimers();
    setSnapshot({ ...pausedSnapshot, phase: 'paused' });
    void audioRef.current?.pause().catch(() => undefined);
  }, [snapshot?.phase, snapshot?.resumeCountIn, stopExercise, stopTimers]);

  const checkChallenge = useCallback((engine: RhythmTimingEngine): boolean => {
    const activeSettings = sessionSettingsRef.current;
    const outcomes = engine.takeChallengeOutcomes();
    let trigger = null;
    if (activeSettings.challengeTriggerMode === 'bars') {
      const processed = applyChallengeBarOutcomes(
        challengeWrongBarStreakRef.current,
        challengeWrongBarIndexesRef.current,
        outcomes,
        engine.takeCompletedChallengeBars(),
        activeSettings.challengeWrongBarStreak,
      );
      challengeWrongBarStreakRef.current = processed.consecutiveWrongBars;
      challengeWrongBarIndexesRef.current = processed.wrongBarIndexes;
      trigger = processed.trigger;
    } else {
      engine.takeCompletedChallengeBars();
      const processed = applyChallengeOutcomes(
        challengeStreaksRef.current,
        outcomes,
        activeSettings.challengeMissStreak,
      );
      challengeStreaksRef.current = processed.streaks;
      trigger = processed.trigger;
    }
    if (activeSettings.challengeAction === 'off') return false;

    if (!trigger) return false;

    const message = challengeMessage(trigger, activeSettings.challengeAction);
    if (activeSettings.challengeAction === 'stop') stopExercise();
    else pauseForChallenge(message);
    return true;
  }, [pauseForChallenge, stopExercise]);

  const advanceSessionClock = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return false;

    const nextSnapshot = engine.advance(monotonicNow());
    if (challengePausedRef.current && !nextSnapshot.resumeCountIn) resetChallengeProgress();
    if (nextSnapshot.phase === 'finished' && nextSnapshot.results) {
      finalizeSession(nextSnapshot, nextSnapshot.results);
      return false;
    }
    if (checkChallenge(engine)) return false;

    setSnapshot(nextSnapshot);
    return true;
  }, [checkChallenge, finalizeSession, resetChallengeProgress]);

  const configureActiveSession = useCallback((activeSettings: ExerciseSettings, score?: ImportedRhythmScore) => {
    sessionSettingsRef.current = activeSettings;
    resetChallengeProgress();
    setSessionSettings(activeSettings);
    if (score) setSettings(activeSettings);
    sessionIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }, [resetChallengeProgress]);

  const startSession = useCallback(async (
    score?: ImportedRhythmScore,
    preparationOptions: ExercisePreparationOptions = {},
  ) => {
    stopTimers();
    if (audioPreparationRef.current) await audioPreparationRef.current;
    if (engineRef.current && audioRef.current) {
      await audioRef.current.stop();
      audioRef.current = null;
    }

    const performanceNow = monotonicNow();
    const { activeSettings, patternPairs } = resolveSessionConfiguration(
      settings,
      score,
      preparationOptions,
      featureFlagsRef.current,
    );
    configureActiveSession(activeSettings, score);

    const audio = await prepareAudioForPlayback();
    const timing = createSessionTiming(activeSettings, score, performanceNow, audio.currentTime);
    const engine = new RhythmTimingEngine({
      settings: activeSettings,
      sessionStartTime: timing.sessionStartTime,
      importedScore: score,
      patternPairs,
      patternPairWeights: preparationOptions.patternPairWeights,
    });
    engineRef.current = engine;
    setResults(null);
    setSnapshot(engine.advance(performanceNow));
    audio.start(createAudioStartOptions(activeSettings, score, engine, timing));

    scheduleSessionClock(advanceSessionClock, 30);
  }, [advanceSessionClock, configureActiveSession, prepareAudioForPlayback, scheduleSessionClock, settings, stopTimers]);

  const restartPausedExercise = useCallback(async (barsBack: number, bpm: number) => {
    if (snapshot?.phase !== 'paused') throw new Error('Pause the exercise before changing it.');
    const nextBpm = Math.max(40, Math.min(200, Math.round(bpm)));
    const originalScore = lastScoreRef.current;
    const scoreForSession = restartScoreFromMeasure(
      originalScore,
      snapshot.scoreMeasure?.index,
      barsBack,
      nextBpm,
    );

    const activeSettings = sessionSettingsRef.current;
    const nextOptions = createRestartOptions(lastOptionsRef.current, activeSettings, { bpm: nextBpm });
    setSettings((current) => ({ ...current, bpm: nextBpm }));

    const previousAudio = audioRef.current;
    audioRef.current = null;
    await previousAudio?.stop();
    await startSession(scoreForSession, nextOptions);
    lastScoreRef.current = originalScore ? { ...originalScore, bpm: nextBpm } : undefined;
    lastOptionsRef.current = nextOptions;
    setExercisePrepared(false);
  }, [snapshot, startSession]);

  const restartExerciseWithFeel = useCallback(async (feel: RhythmicFeel) => {
    const options: ExercisePreparationOptions = {
      ...lastOptionsRef.current,
      settings: { ...lastOptionsRef.current.settings, ...sessionSettingsRef.current, feel },
    };
    const previousAudio = audioRef.current;
    audioRef.current = null;
    await previousAudio?.stop();
    await startSession(lastScoreRef.current, options);
    lastOptionsRef.current = options;
    setExercisePrepared(false);
  }, [startSession]);

  const prepareExercise = useCallback(async (
    score?: ImportedRhythmScore,
    options: ExercisePreparationOptions = {},
  ) => {
    const activeFlags = featureFlagsRef.current;
    pendingOptionsRef.current = options;
    setSessionSettings(applyFeatureFlagsToSettings({ ...settings, ...options.settings }, activeFlags));
    await Promise.all([prepareAudio(), waitForNotationReady()]);
    pendingScoreRef.current = score;
    setExercisePrepared(true);
  }, [prepareAudio, settings]);

  const prepareRepeatExercise = useCallback(async () => {
    if (!results) throw new Error('There is no completed exercise to repeat.');
    await prepareExercise(lastScoreRef.current, lastOptionsRef.current);
  }, [prepareExercise, results]);

  const startPreparedExercise = useCallback(async () => {
    if (!exercisePrepared) throw new Error('Prepare an exercise before starting.');
    const score = pendingScoreRef.current;
    const options = pendingOptionsRef.current;
    await startSession(score, options);
    lastScoreRef.current = score;
    lastOptionsRef.current = options;
    pendingScoreRef.current = undefined;
    pendingOptionsRef.current = {};
    setExercisePrepared(false);
  }, [exercisePrepared, startSession]);

  const registerTap = useCallback((hand: Hand, timestamp: number, inputSource: 'touch' | 'keyboard' = 'touch'): TapFeedback | null => {
    const engine = engineRef.current;
    if (!engine) return null;
    const tapResult = engine.tapWithDetails(hand, timestamp, inputSource);
    if (challengePausedRef.current && !engine.isPaused()) {
      challengeStreaksRef.current = createChallengeStreaks();
      challengeWrongBarIndexesRef.current.clear();
      challengeWrongBarStreakRef.current = 0;
      challengePausedRef.current = false;
    }
    if (tapResult.feedback === 'ignored') return 'ignored';
    if (tapResult.midiPitches?.length) audioRef.current?.playScorePitches(tapResult.midiPitches);
    else audioRef.current?.playHandClick(hand);
    const nextSnapshot = engine.advance(monotonicNow());
    if (nextSnapshot.phase === 'finished') setSnapshot(nextSnapshot);
    else if (!checkChallenge(engine)) setSnapshot(nextSnapshot);
    return tapResult.feedback;
  }, [checkChallenge]);

  const resumeExercise = useCallback(async () => {
    const engine = engineRef.current;
    const audio = audioRef.current;
    if (!engine || snapshot?.phase !== 'paused') return;
    try {
      if (!audio) throw new Error('The metronome audio session is unavailable.');
      const { durationMs } = await audio.resumeWithCountIn();
      const now = monotonicNow();
      engine.beginResumeCountIn(now, durationMs);
      setSnapshot(engine.advance(now));
      scheduleSessionClock(advanceSessionClock, 0);
    } catch {
      setAudioStatus('error');
      throw new Error('The metronome audio could not resume.');
    }
  }, [advanceSessionClock, scheduleSessionClock, snapshot?.phase]);

  const discardReplayData = useCallback(() => {
    setResults((current) => current ? {
      ...current,
      missedEvents: [],
      replayExpectedEvents: [],
      replayTaps: [],
    } : current);
    setSnapshot((current) => current?.results
      ? {
          ...current,
          results: {
            ...current.results,
            missedEvents: [],
            replayExpectedEvents: [],
            replayTaps: [],
          },
        }
      : current,
    );
  }, []);

  useEffect(
    () => () => {
      void audioRef.current?.stop();
    },
    [],
  );

  const value = useMemo(
    () => ({ settings, featureFlags, sessionSettings, updateSettings, resetSettings, audioStatus, prepareAudio, prepareExercise, prepareRepeatExercise, startPreparedExercise, stopExercise, pauseExercise, resumeExercise, restartPausedExercise, restartExerciseWithFeel, registerTap, snapshot, exercisePrepared, results, sessionHistory, sessionHistoryLoaded, combinationProgress, combinationProgressLoaded, savedPracticePairs, savedPracticePairsLoaded, savePairsForLater, removeSavedPracticePair, discardReplayData }),
    [settings, featureFlags, sessionSettings, updateSettings, resetSettings, audioStatus, prepareAudio, prepareExercise, prepareRepeatExercise, startPreparedExercise, stopExercise, pauseExercise, resumeExercise, restartPausedExercise, restartExerciseWithFeel, registerTap, snapshot, exercisePrepared, results, sessionHistory, sessionHistoryLoaded, combinationProgress, combinationProgressLoaded, savedPracticePairs, savedPracticePairsLoaded, savePairsForLater, removeSavedPracticePair, discardReplayData],
  );

  return value;
}
