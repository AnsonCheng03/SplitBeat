import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MetronomeAudio } from '@/audio/metronome';
import { SOUND_OPTIONS } from '@/audio/soundPresets';
import { normalizeFlashSource } from '@/rhythm/flashSource';
import { applyChallengeOutcomes, challengeMessage, createChallengeStreaks, createWrongTapTrigger } from '@/rhythm/challenge';
import { scoreFromMeasure } from '@/rhythm/scoreStaff';
import { getSessionDurationSeconds, RhythmTimingEngine } from '@/rhythm/timingEngine';
import {
  DEFAULT_GOOD_WINDOW_MS,
  normalizeGoodWindowMs,
  normalizeTapOffsetMs,
} from '@/rhythm/timingCalibration';
import { timeSignatureMetrics } from '@/rhythm/subdivisions';
import { parseCombinationProgress, recordCombinationProgress } from '@/rhythm/targetedPractice';
import type { CombinationProgress } from '@/rhythm/targetedPractice';
import { appendSessionRecord, createSessionRecord, parseSessionHistory } from '@/store/sessionHistory';
import type { SessionRecord } from '@/store/sessionHistory';
import { MIXTURE_PATTERN_IDS, SUBDIVISIONS, TIME_SIGNATURES } from '@/types/rhythm';
import type { ImportedRhythmScore } from '@/types/importedScore';
import type {
  ExerciseSettings,
  Hand,
  ChallengeMissStreak,
  SessionResults,
  SessionSnapshot,
  RhythmPatternPair,
  SoundPreset,
  Subdivision,
  TapFeedback,
} from '@/types/rhythm';

const SETTINGS_KEY = 'two-hand-rhythm-trainer.settings.v1';
const SESSION_HISTORY_KEY = 'split-beat.session-history.v1';
const COMBINATION_PROGRESS_KEY = 'split-beat.combination-progress.v1';
const COUNT_IN_BEATS = 3;
const AUDIO_LEAD_IN_MS = 300;
const FORCE_SILENT_E2E = process.env.EXPO_PUBLIC_E2E_SILENT === '1';

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
  enabledSubdivisions: ['quarter', 'eighth', 'triplet', 'sixteenth'],
  enabledMixtures: [],
  feel: 'straight',
  graceNotesEnabled: false,
  trainingMode: 'two-hand',
  practiceDisplayMode: 'rhythm',
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
  challengeMissStreak: 3,
  leftTapOffsetMs: 0,
  rightTapOffsetMs: 0,
  goodWindowMs: DEFAULT_GOOD_WINDOW_MS,
  hapticsEnabled: false,
};

interface SessionContextValue {
  settings: ExerciseSettings;
  sessionSettings: ExerciseSettings | null;
  updateSettings: (patch: Partial<ExerciseSettings>) => void;
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
  registerTap: (hand: Hand, timestamp: number) => TapFeedback | null;
  snapshot: SessionSnapshot | null;
  results: SessionResults | null;
  sessionHistory: SessionRecord[];
  sessionHistoryLoaded: boolean;
  combinationProgress: CombinationProgress[];
  combinationProgressLoaded: boolean;
  discardReplayData: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function restoreSettings(raw: string | null): ExerciseSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<ExerciseSettings>;
    const enabledSubdivisions = Array.isArray(parsed.enabledSubdivisions)
      ? SUBDIVISIONS.filter((item) => parsed.enabledSubdivisions?.includes(item))
      : DEFAULT_SETTINGS.enabledSubdivisions;
    const validSubdivisions =
      enabledSubdivisions.length >= 2 ? enabledSubdivisions : DEFAULT_SETTINGS.enabledSubdivisions;
    const enabledMixtures = Array.isArray(parsed.enabledMixtures)
      ? MIXTURE_PATTERN_IDS.filter((item) => parsed.enabledMixtures?.includes(item))
      : DEFAULT_SETTINGS.enabledMixtures;
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
      enabledMixtures: [...enabledMixtures],
      feel: parsed.feel === 'swing' ? 'swing' : 'straight',
      graceNotesEnabled:
        typeof parsed.graceNotesEnabled === 'boolean'
          ? parsed.graceNotesEnabled
          : DEFAULT_SETTINGS.graceNotesEnabled,
      trainingMode: parsed.trainingMode === 'single-hand' ? 'single-hand' : 'two-hand',
      practiceDisplayMode: parsed.practiceDisplayMode === 'score' ? 'score' : 'rhythm',
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
      leftTapOffsetMs:
        typeof parsed.leftTapOffsetMs === 'number'
          ? normalizeTapOffsetMs(parsed.leftTapOffsetMs)
          : DEFAULT_SETTINGS.leftTapOffsetMs,
      rightTapOffsetMs:
        typeof parsed.rightTapOffsetMs === 'number'
          ? normalizeTapOffsetMs(parsed.rightTapOffsetMs)
          : DEFAULT_SETTINGS.rightTapOffsetMs,
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

export function SessionProvider({ children }: React.PropsWithChildren) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [sessionSettings, setSessionSettings] = useState<ExerciseSettings | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [results, setResults] = useState<SessionResults | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);
  const [sessionHistoryLoaded, setSessionHistoryLoaded] = useState(false);
  const [combinationProgress, setCombinationProgress] = useState<CombinationProgress[]>([]);
  const [combinationProgressLoaded, setCombinationProgressLoaded] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioPreparationStatus>('loading');
  const engineRef = useRef<RhythmTimingEngine | null>(null);
  const audioRef = useRef<MetronomeAudio | null>(null);
  const audioPreparationRef = useRef<Promise<void> | null>(null);
  const uiTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sessionIdRef = useRef<string | null>(null);
  const pendingScoreRef = useRef<ImportedRhythmScore | undefined>(undefined);
  const lastScoreRef = useRef<ImportedRhythmScore | undefined>(undefined);
  const pendingOptionsRef = useRef<ExercisePreparationOptions>({});
  const lastOptionsRef = useRef<ExercisePreparationOptions>({});
  const sessionSettingsRef = useRef<ExerciseSettings>(DEFAULT_SETTINGS);
  const challengeStreaksRef = useRef(createChallengeStreaks());
  const challengePausedRef = useRef(false);
  const [exercisePrepared, setExercisePrepared] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(SESSION_HISTORY_KEY)
      .then((raw) => {
        if (active) setSessionHistory(parseSessionHistory(raw));
      })
      .catch(() => {
        if (active) setSessionHistory([]);
      })
      .finally(() => {
        if (active) setSessionHistoryLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(COMBINATION_PROGRESS_KEY)
      .then((raw) => {
        if (active) setCombinationProgress(parseCombinationProgress(raw));
      })
      .catch(() => {
        if (active) setCombinationProgress([]);
      })
      .finally(() => {
        if (active) setCombinationProgressLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

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
    audioRef.current?.setSounds({
      metronome: settings.metronomeSound,
      leftHand: settings.leftHandSound,
      rightHand: settings.rightHandSound,
    });
  }, [settings.metronomeSound, settings.leftHandSound, settings.rightHandSound]);

  const updateSettings = useCallback((patch: Partial<ExerciseSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const stopTimers = useCallback(() => {
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    uiTimerRef.current = undefined;
  }, []);

  const saveCompletedSession = useCallback((completedResults: SessionResults) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    sessionIdRef.current = null;
    const record = createSessionRecord(sessionId, Date.now(), completedResults);
    setSessionHistory((current) => {
      const next = appendSessionRecord(current, record);
      void AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
    if (completedResults.trainingMode !== 'two-hand') return;
    setCombinationProgress((current) => {
      const next = recordCombinationProgress(
        current,
        completedResults.combinations,
        completedResults.timeSignature,
        Date.now(),
      );
      if (next !== current) {
        void AsyncStorage.setItem(COMBINATION_PROGRESS_KEY, JSON.stringify(next)).catch(() => undefined);
      }
      return next;
    });
  }, []);

  const stopExercise = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const now = monotonicNow();
    const finalResults = engine.getResults(now);
    const finalSnapshot = engine.advance(now);
    setResults(finalResults);
    saveCompletedSession(finalResults);
    setSnapshot({ ...finalSnapshot, phase: 'finished', results: finalResults });
    stopTimers();
    challengePausedRef.current = false;
    void audioRef.current?.stop();
    audioRef.current = null;
    engineRef.current = null;
  }, [saveCompletedSession, stopTimers]);

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
    engine.pause(now);
    const pausedSnapshot = engine.advance(now);
    if (pausedSnapshot.phase === 'finished') {
      stopExercise();
      return;
    }
    stopTimers();
    setSnapshot({ ...pausedSnapshot, phase: 'paused' });
    void audioRef.current?.pause().catch(() => undefined);
  }, [snapshot?.phase, stopExercise, stopTimers]);

  const checkChallenge = useCallback((engine: RhythmTimingEngine, feedback?: TapFeedback, hand?: Hand): boolean => {
    const activeSettings = sessionSettingsRef.current;
    const processed = applyChallengeOutcomes(
      challengeStreaksRef.current,
      engine.takeChallengeOutcomes(),
      activeSettings.challengeMissStreak,
    );
    challengeStreaksRef.current = processed.streaks;
    if (activeSettings.challengeAction === 'off') return false;

    const trigger = activeSettings.challengeMissStreak === 1 && feedback === 'miss' && hand
      ? createWrongTapTrigger(hand)
      : processed.trigger;
    if (!trigger) return false;

    const message = challengeMessage(trigger, activeSettings.challengeAction);
    if (activeSettings.challengeAction === 'stop') stopExercise();
    else pauseForChallenge(message);
    return true;
  }, [pauseForChallenge, stopExercise]);

  const scheduleSessionClock = useCallback((initialDelayMs = 30) => {
    const updateFromClock = () => {
      const engine = engineRef.current;
      if (!engine) return;
      const nextSnapshot = engine.advance(monotonicNow());
      if (nextSnapshot.phase === 'finished' && nextSnapshot.results) {
        setSnapshot(nextSnapshot);
        setResults(nextSnapshot.results);
        saveCompletedSession(nextSnapshot.results);
        stopTimers();
        void audioRef.current?.stop();
        audioRef.current = null;
        engineRef.current = null;
        return;
      }
      if (checkChallenge(engine)) return;
      setSnapshot(nextSnapshot);
      uiTimerRef.current = setTimeout(updateFromClock, 50);
    };
    uiTimerRef.current = setTimeout(updateFromClock, initialDelayMs);
  }, [checkChallenge, saveCompletedSession, stopTimers]);

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

    const configuredSettings = { ...settings, ...preparationOptions.settings };
    const activeSettings = score
      ? {
          ...configuredSettings,
          bpm: score.bpm ?? configuredSettings.bpm,
          timeSignature: score.timeSignature,
        }
      : configuredSettings;
    sessionSettingsRef.current = activeSettings;
    challengeStreaksRef.current = createChallengeStreaks();
    challengePausedRef.current = false;
    setSessionSettings(activeSettings);
    if (score) setSettings(activeSettings);
    sessionIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const audio = audioRef.current ?? new MetronomeAudio();
    audioRef.current = audio;
    try {
      await audio.prepare();
      await audio.resume();
      setAudioStatus('ready');
    } catch (error) {
      sessionIdRef.current = null;
      setAudioStatus('error');
      void audio.stop();
      if (audioRef.current === audio) audioRef.current = null;
      throw error;
    }

    const metrics = timeSignatureMetrics(activeSettings.bpm, activeSettings.timeSignature);
    const beatMs = metrics.beatDurationMs;
    const performanceNow = monotonicNow();
    const audioNow = audio.currentTime;
    const sessionStartTime = performanceNow + AUDIO_LEAD_IN_MS + COUNT_IN_BEATS * beatMs;
    const sessionStartAudioTime =
      audioNow + AUDIO_LEAD_IN_MS / 1_000 + (COUNT_IN_BEATS * beatMs) / 1_000;
    const engine = new RhythmTimingEngine({
      settings: activeSettings,
      sessionStartTime,
      importedScore: score,
      patternPairs: preparationOptions.patternPairs,
      patternPairWeights: preparationOptions.patternPairWeights,
    });
    engineRef.current = engine;
    setResults(null);
    setSnapshot(engine.advance(performanceNow));
    audio.start({
      sessionStartAudioTime,
      sessionStartTime,
      bpm: activeSettings.bpm,
      beatsPerBar: metrics.beatsPerBar,
      durationSeconds: getSessionDurationSeconds(activeSettings, score),
      soundEnabled: activeSettings.soundEnabled && !FORCE_SILENT_E2E,
      backgroundMusicEnabled: activeSettings.backgroundMusicEnabled,
      sessionCuesEnabled: activeSettings.sessionCuesEnabled,
      changeIntervalBeats: activeSettings.changeIntervalBeats,
      patternChangesEnabled: !score,
      referenceRhythmEnabled: activeSettings.referenceRhythmEnabled,
      getReferenceEventsThrough: (timeMs) => engine.getReferenceEventsThrough(timeMs),
      sounds: {
        metronome: activeSettings.metronomeSound,
        leftHand: activeSettings.leftHandSound,
        rightHand: activeSettings.rightHandSound,
      },
    });

    scheduleSessionClock(30);
  }, [scheduleSessionClock, settings, stopTimers]);

  const restartPausedExercise = useCallback(async (barsBack: number, bpm: number) => {
    if (snapshot?.phase !== 'paused') throw new Error('Pause the exercise before changing it.');
    const nextBpm = Math.max(40, Math.min(200, Math.round(bpm)));
    const originalScore = lastScoreRef.current;
    let scoreForSession = originalScore;

    if (originalScore) {
      const currentMeasureIndex = originalScore.measures.findIndex(
        (measure) => measure.index === snapshot.scoreMeasure?.index,
      );
      const rewindToIndex = Math.max(0, (currentMeasureIndex < 0 ? 0 : currentMeasureIndex) - Math.max(0, Math.floor(barsBack)));
      scoreForSession = {
        ...scoreFromMeasure(originalScore, rewindToIndex),
        bpm: nextBpm,
      };
    }

    const activeSettings = sessionSettingsRef.current;
    const nextOptions: ExercisePreparationOptions = {
      ...lastOptionsRef.current,
      settings: { ...lastOptionsRef.current.settings, ...activeSettings, bpm: nextBpm },
    };
    setSettings((current) => ({ ...current, bpm: nextBpm }));

    const previousAudio = audioRef.current;
    audioRef.current = null;
    await previousAudio?.stop();
    await startSession(scoreForSession, nextOptions);
    lastScoreRef.current = originalScore ? { ...originalScore, bpm: nextBpm } : undefined;
    lastOptionsRef.current = nextOptions;
    setExercisePrepared(false);
  }, [snapshot, startSession]);

  const prepareExercise = useCallback(async (
    score?: ImportedRhythmScore,
    options: ExercisePreparationOptions = {},
  ) => {
    pendingOptionsRef.current = options;
    setSessionSettings({ ...settings, ...options.settings });
    await prepareAudio();
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

  const registerTap = useCallback((hand: Hand, timestamp: number): TapFeedback | null => {
    const engine = engineRef.current;
    if (!engine) return null;
    if (challengePausedRef.current) return 'ignored';
    const tapResult = engine.tapWithDetails(hand, timestamp);
    if (tapResult.feedback === 'ignored') return 'ignored';
    if (tapResult.midiPitches?.length) audioRef.current?.playScorePitches(tapResult.midiPitches);
    else audioRef.current?.playHandClick(hand);
    const nextSnapshot = engine.advance(monotonicNow());
    if (nextSnapshot.phase === 'finished') setSnapshot(nextSnapshot);
    else if (!checkChallenge(engine, tapResult.feedback, hand)) setSnapshot(nextSnapshot);
    return tapResult.feedback;
  }, [checkChallenge]);

  const resumeExercise = useCallback(async () => {
    const engine = engineRef.current;
    const audio = audioRef.current;
    if (!engine || snapshot?.phase !== 'paused') return;
    try {
      if (!audio) throw new Error('The metronome audio session is unavailable.');
      await audio.resume();
      const now = monotonicNow();
      engine.resume(now);
      if (challengePausedRef.current) challengeStreaksRef.current = createChallengeStreaks();
      challengePausedRef.current = false;
      setSnapshot(engine.advance(now));
      scheduleSessionClock(30);
    } catch {
      setAudioStatus('error');
      throw new Error('The metronome audio could not resume.');
    }
  }, [scheduleSessionClock, snapshot?.phase]);

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
      stopTimers();
      void audioRef.current?.stop();
    },
    [stopTimers],
  );

  const value = useMemo(
    () => ({ settings, sessionSettings, updateSettings, audioStatus, prepareAudio, prepareExercise, prepareRepeatExercise, startPreparedExercise, stopExercise, pauseExercise, resumeExercise, restartPausedExercise, registerTap, snapshot, exercisePrepared, results, sessionHistory, sessionHistoryLoaded, combinationProgress, combinationProgressLoaded, discardReplayData }),
    [settings, sessionSettings, updateSettings, audioStatus, prepareAudio, prepareExercise, prepareRepeatExercise, startPreparedExercise, stopExercise, pauseExercise, resumeExercise, restartPausedExercise, registerTap, snapshot, exercisePrepared, results, sessionHistory, sessionHistoryLoaded, combinationProgress, combinationProgressLoaded, discardReplayData],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useRhythmSession(): SessionContextValue {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useRhythmSession must be used inside SessionProvider');
  return session;
}
