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
import { RhythmTimingEngine } from '@/rhythm/timingEngine';
import { beatDurationMs } from '@/rhythm/subdivisions';
import { SUBDIVISIONS } from '@/types/rhythm';
import type {
  ExerciseSettings,
  Hand,
  SessionResults,
  SessionSnapshot,
  Subdivision,
} from '@/types/rhythm';

const SETTINGS_KEY = 'two-hand-rhythm-trainer.settings.v1';
const COUNT_IN_BEATS = 3;
const AUDIO_LEAD_IN_MS = 300;

export const DEFAULT_SETTINGS: ExerciseSettings = {
  bpm: 80,
  durationSeconds: 60,
  changeIntervalBeats: 4,
  enabledSubdivisions: ['quarter', 'eighth', 'triplet', 'sixteenth'],
  soundEnabled: true,
  hapticsEnabled: false,
};

interface SessionContextValue {
  settings: ExerciseSettings;
  updateSettings: (patch: Partial<ExerciseSettings>) => void;
  startExercise: () => Promise<void>;
  stopExercise: () => void;
  registerTap: (hand: Hand, timestamp: number) => void;
  snapshot: SessionSnapshot | null;
  results: SessionResults | null;
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

    return {
      bpm:
        typeof parsed.bpm === 'number'
          ? Math.max(40, Math.min(200, Math.round(parsed.bpm)))
          : DEFAULT_SETTINGS.bpm,
      durationSeconds,
      changeIntervalBeats,
      enabledSubdivisions: validSubdivisions as Subdivision[],
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
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
  const engineRef = useRef<RhythmTimingEngine | null>(null);
  const audioRef = useRef<MetronomeAudio | null>(null);
  const uiTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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

  useEffect(() => {
    audioRef.current?.setSoundEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  const updateSettings = useCallback((patch: Partial<ExerciseSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const stopTimers = useCallback(() => {
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    uiTimerRef.current = undefined;
  }, []);

  const startExercise = useCallback(async () => {
    stopTimers();
    if (audioRef.current) await audioRef.current.stop();

    const audio = new MetronomeAudio();
    audioRef.current = audio;
    await audio.resume();

    const beatMs = beatDurationMs(settings.bpm);
    const performanceNow = monotonicNow();
    const audioNow = audio.currentTime;
    const sessionStartTime = performanceNow + AUDIO_LEAD_IN_MS + COUNT_IN_BEATS * beatMs;
    const sessionStartAudioTime =
      audioNow + AUDIO_LEAD_IN_MS / 1_000 + (COUNT_IN_BEATS * beatMs) / 1_000;
    const engine = new RhythmTimingEngine({ settings, sessionStartTime });
    engineRef.current = engine;
    setResults(null);
    setSnapshot(engine.advance(performanceNow));
    audio.start({
      sessionStartAudioTime,
      bpm: settings.bpm,
      durationSeconds: settings.durationSeconds === 'endless' ? null : settings.durationSeconds,
      soundEnabled: settings.soundEnabled,
    });

    const updateFromClock = () => {
      const currentEngine = engineRef.current;
      if (!currentEngine) return;
      const nextSnapshot = currentEngine.advance(monotonicNow());
      setSnapshot(nextSnapshot);
      if (nextSnapshot.phase === 'finished' && nextSnapshot.results) {
        setResults(nextSnapshot.results);
        stopTimers();
        void audioRef.current?.stop();
        audioRef.current = null;
        engineRef.current = null;
        return;
      }
      uiTimerRef.current = setTimeout(updateFromClock, 50);
    };
    uiTimerRef.current = setTimeout(updateFromClock, 30);
  }, [settings, stopTimers]);

  const registerTap = useCallback((hand: Hand, timestamp: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.tap(hand, timestamp);
    setSnapshot(engine.advance(monotonicNow()));
  }, []);

  const stopExercise = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const now = monotonicNow();
    const finalResults = engine.getResults(now);
    const finalSnapshot = engine.advance(now);
    setResults(finalResults);
    setSnapshot({ ...finalSnapshot, phase: 'finished', results: finalResults });
    stopTimers();
    void audioRef.current?.stop();
    audioRef.current = null;
    engineRef.current = null;
  }, [stopTimers]);

  useEffect(
    () => () => {
      stopTimers();
      void audioRef.current?.stop();
    },
    [stopTimers],
  );

  const value = useMemo(
    () => ({ settings, updateSettings, startExercise, stopExercise, registerTap, snapshot, results }),
    [settings, updateSettings, startExercise, stopExercise, registerTap, snapshot, results],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useRhythmSession(): SessionContextValue {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useRhythmSession must be used inside SessionProvider');
  return session;
}
