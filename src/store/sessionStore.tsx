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
import { RhythmTimingEngine } from '@/rhythm/timingEngine';
import {
  DEFAULT_GOOD_WINDOW_MS,
  normalizeGoodWindowMs,
  normalizeTapOffsetMs,
} from '@/rhythm/timingCalibration';
import { timeSignatureMetrics } from '@/rhythm/subdivisions';
import { appendSessionRecord, createSessionRecord, parseSessionHistory } from '@/store/sessionHistory';
import type { SessionRecord } from '@/store/sessionHistory';
import { SUBDIVISIONS, TIME_SIGNATURES } from '@/types/rhythm';
import type { ImportedRhythmScore } from '@/types/importedScore';
import type {
  ExerciseSettings,
  Hand,
  SessionResults,
  MissedEvent,
  SessionSnapshot,
  SoundPreset,
  Subdivision,
  TapFeedback,
} from '@/types/rhythm';

const SETTINGS_KEY = 'two-hand-rhythm-trainer.settings.v1';
const SESSION_HISTORY_KEY = 'split-beat.session-history.v1';
const COUNT_IN_BEATS = 3;
const AUDIO_LEAD_IN_MS = 300;
const FORCE_SILENT_E2E = process.env.EXPO_PUBLIC_E2E_SILENT === '1';

export type AudioPreparationStatus = 'loading' | 'ready' | 'error';

export const DEFAULT_SETTINGS: ExerciseSettings = {
  bpm: 80,
  timeSignature: '4/4',
  durationSeconds: 60,
  changeIntervalBeats: 4,
  restBetweenChanges: false,
  enabledSubdivisions: ['quarter', 'eighth', 'triplet', 'sixteenth'],
  feel: 'straight',
  graceNotesEnabled: false,
  trainingMode: 'two-hand',
  singleHand: 'left',
  soundEnabled: !FORCE_SILENT_E2E,
  metronomeSound: 'wood',
  leftHandSound: 'soft',
  rightHandSound: 'beep',
  leftTapOffsetMs: 0,
  rightTapOffsetMs: 0,
  goodWindowMs: DEFAULT_GOOD_WINDOW_MS,
  hapticsEnabled: false,
};

interface SessionContextValue {
  settings: ExerciseSettings;
  updateSettings: (patch: Partial<ExerciseSettings>) => void;
  audioStatus: AudioPreparationStatus;
  prepareAudio: () => Promise<void>;
  prepareExercise: (score?: ImportedRhythmScore) => Promise<void>;
  startPreparedExercise: () => Promise<void>;
  exercisePrepared: boolean;
  stopExercise: () => void;
  registerTap: (hand: Hand, timestamp: number) => TapFeedback | null;
  snapshot: SessionSnapshot | null;
  results: SessionResults | null;
  sessionHistory: SessionRecord[];
  sessionHistoryLoaded: boolean;
  replayMissedBar: (events: readonly MissedEvent[]) => Promise<number>;
  stopReplay: () => void;
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
      enabledSubdivisions: validSubdivisions as Subdivision[],
      feel: parsed.feel === 'swing' ? 'swing' : 'straight',
      graceNotesEnabled:
        typeof parsed.graceNotesEnabled === 'boolean'
          ? parsed.graceNotesEnabled
          : DEFAULT_SETTINGS.graceNotesEnabled,
      trainingMode: parsed.trainingMode === 'single-hand' ? 'single-hand' : 'two-hand',
      singleHand: parsed.singleHand === 'right' ? 'right' : 'left',
      soundEnabled: FORCE_SILENT_E2E
        ? false
        : typeof parsed.soundEnabled === 'boolean'
          ? parsed.soundEnabled
          : true,
      metronomeSound: restoreSound(parsed.metronomeSound, DEFAULT_SETTINGS.metronomeSound),
      leftHandSound: restoreSound(parsed.leftHandSound, DEFAULT_SETTINGS.leftHandSound),
      rightHandSound: restoreSound(parsed.rightHandSound, DEFAULT_SETTINGS.rightHandSound),
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
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [results, setResults] = useState<SessionResults | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);
  const [sessionHistoryLoaded, setSessionHistoryLoaded] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioPreparationStatus>('loading');
  const engineRef = useRef<RhythmTimingEngine | null>(null);
  const audioRef = useRef<MetronomeAudio | null>(null);
  const replayAudioRef = useRef<MetronomeAudio | null>(null);
  const audioPreparationRef = useRef<Promise<void> | null>(null);
  const uiTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sessionIdRef = useRef<string | null>(null);
  const pendingScoreRef = useRef<ImportedRhythmScore | undefined>(undefined);
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
  }, []);

  const startSession = useCallback(async (score?: ImportedRhythmScore) => {
    stopTimers();
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    replayTimerRef.current = undefined;
    if (replayAudioRef.current) {
      const replayAudio = replayAudioRef.current;
      replayAudioRef.current = null;
      void replayAudio.stop();
    }
    if (audioPreparationRef.current) await audioPreparationRef.current;
    if (engineRef.current && audioRef.current) {
      await audioRef.current.stop();
      audioRef.current = null;
    }

    const sessionSettings = score
      ? {
          ...settings,
          bpm: score.bpm ?? settings.bpm,
          timeSignature: score.timeSignature,
        }
      : settings;
    if (score) setSettings(sessionSettings);
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

    const metrics = timeSignatureMetrics(sessionSettings.bpm, sessionSettings.timeSignature);
    const beatMs = metrics.beatDurationMs;
    const performanceNow = monotonicNow();
    const audioNow = audio.currentTime;
    const sessionStartTime = performanceNow + AUDIO_LEAD_IN_MS + COUNT_IN_BEATS * beatMs;
    const sessionStartAudioTime =
      audioNow + AUDIO_LEAD_IN_MS / 1_000 + (COUNT_IN_BEATS * beatMs) / 1_000;
    const engine = new RhythmTimingEngine({ settings: sessionSettings, sessionStartTime, importedScore: score });
    engineRef.current = engine;
    setResults(null);
    setSnapshot(engine.advance(performanceNow));
    audio.start({
      sessionStartAudioTime,
      bpm: sessionSettings.bpm,
      beatsPerBar: metrics.beatsPerBar,
      durationSeconds: sessionSettings.durationSeconds === 'endless' ? null : sessionSettings.durationSeconds,
      soundEnabled: sessionSettings.soundEnabled && !FORCE_SILENT_E2E,
      sounds: {
        metronome: sessionSettings.metronomeSound,
        leftHand: sessionSettings.leftHandSound,
        rightHand: sessionSettings.rightHandSound,
      },
    });

    const updateFromClock = () => {
      const currentEngine = engineRef.current;
      if (!currentEngine) return;
      const nextSnapshot = currentEngine.advance(monotonicNow());
      setSnapshot(nextSnapshot);
      if (nextSnapshot.phase === 'finished' && nextSnapshot.results) {
        setResults(nextSnapshot.results);
        saveCompletedSession(nextSnapshot.results);
        stopTimers();
        void audioRef.current?.stop();
        audioRef.current = null;
        engineRef.current = null;
        return;
      }
      uiTimerRef.current = setTimeout(updateFromClock, 50);
    };
    uiTimerRef.current = setTimeout(updateFromClock, 30);
  }, [saveCompletedSession, settings, stopTimers]);

  const prepareExercise = useCallback(async (score?: ImportedRhythmScore) => {
    await prepareAudio();
    pendingScoreRef.current = score;
    setExercisePrepared(true);
  }, [prepareAudio]);

  const startPreparedExercise = useCallback(async () => {
    if (!exercisePrepared) throw new Error('Prepare an exercise before starting.');
    await startSession(pendingScoreRef.current);
    pendingScoreRef.current = undefined;
    setExercisePrepared(false);
  }, [exercisePrepared, startSession]);

  const registerTap = useCallback((hand: Hand, timestamp: number): TapFeedback | null => {
    const engine = engineRef.current;
    if (!engine) return null;
    const tapResult = engine.tapWithDetails(hand, timestamp);
    if (tapResult.feedback !== 'ignored') {
      if (tapResult.midiPitches?.length) audioRef.current?.playScorePitches(tapResult.midiPitches);
      else audioRef.current?.playHandClick(hand);
    }
    setSnapshot(engine.advance(monotonicNow()));
    return tapResult.feedback;
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
    void audioRef.current?.stop();
    audioRef.current = null;
    engineRef.current = null;
  }, [saveCompletedSession, stopTimers]);

  const stopReplay = useCallback(() => {
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    replayTimerRef.current = undefined;
    const audio = replayAudioRef.current;
    if (audio) {
      replayAudioRef.current = null;
      void audio.stop();
    }
  }, []);

  const replayMissedBar = useCallback(async (events: readonly MissedEvent[]) => {
    if (events.length === 0) return 0;
    stopReplay();
    const audio = new MetronomeAudio();
    replayAudioRef.current = audio;
    try {
      await audio.prepare();
      await audio.resume();
      setAudioStatus('ready');
      const bpm = results?.bpm ?? settings.bpm;
      const timeSignature = results?.timeSignature ?? settings.timeSignature;
      const metrics = timeSignatureMetrics(bpm, timeSignature);
      const durationMs = audio.replayMissedBar({
        events,
        bpm,
        beatsPerBar: metrics.beatsPerBar,
        soundEnabled: settings.soundEnabled && !FORCE_SILENT_E2E,
        sounds: {
          metronome: settings.metronomeSound,
          leftHand: settings.leftHandSound,
          rightHand: settings.rightHandSound,
        },
      });
      replayTimerRef.current = setTimeout(() => {
        if (replayAudioRef.current !== audio) return;
        replayTimerRef.current = undefined;
        replayAudioRef.current = null;
        void audio.stop();
      }, durationMs + 80);
      return durationMs;
    } catch (error) {
      if (replayAudioRef.current === audio) replayAudioRef.current = null;
      void audio.stop();
      setAudioStatus('error');
      throw error;
    }
  }, [results, settings, stopReplay]);

  const discardReplayData = useCallback(() => {
    stopReplay();
    setResults((current) => current ? { ...current, missedEvents: [] } : current);
    setSnapshot((current) => current?.results
      ? { ...current, results: { ...current.results, missedEvents: [] } }
      : current,
    );
  }, [stopReplay]);

  useEffect(
    () => () => {
      stopTimers();
      void audioRef.current?.stop();
      stopReplay();
    },
    [stopReplay, stopTimers],
  );

  const value = useMemo(
    () => ({ settings, updateSettings, audioStatus, prepareAudio, prepareExercise, startPreparedExercise, stopExercise, registerTap, snapshot, exercisePrepared, results, sessionHistory, sessionHistoryLoaded, replayMissedBar, stopReplay, discardReplayData }),
    [settings, updateSettings, audioStatus, prepareAudio, prepareExercise, startPreparedExercise, stopExercise, registerTap, snapshot, exercisePrepared, results, sessionHistory, sessionHistoryLoaded, replayMissedBar, stopReplay, discardReplayData],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useRhythmSession(): SessionContextValue {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useRhythmSession must be used inside SessionProvider');
  return session;
}
