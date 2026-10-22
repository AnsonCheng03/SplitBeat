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
import { SUBDIVISIONS, TIME_SIGNATURES } from '@/types/rhythm';
import type { ImportedRhythmScore } from '@/types/importedScore';
import type {
  ExerciseSettings,
  Hand,
  SessionResults,
  SessionSnapshot,
  SoundPreset,
  Subdivision,
} from '@/types/rhythm';

const SETTINGS_KEY = 'two-hand-rhythm-trainer.settings.v1';
const COUNT_IN_BEATS = 3;
const AUDIO_LEAD_IN_MS = 300;

export const DEFAULT_SETTINGS: ExerciseSettings = {
  bpm: 80,
  timeSignature: '4/4',
  durationSeconds: 60,
  changeIntervalBeats: 4,
  enabledSubdivisions: ['quarter', 'eighth', 'triplet', 'sixteenth'],
  feel: 'straight',
  graceNotesEnabled: false,
  soundEnabled: true,
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
  startExercise: () => Promise<void>;
  startScoreExercise: (score: ImportedRhythmScore) => Promise<void>;
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
      enabledSubdivisions: validSubdivisions as Subdivision[],
      feel: parsed.feel === 'swing' ? 'swing' : 'straight',
      graceNotesEnabled:
        typeof parsed.graceNotesEnabled === 'boolean'
          ? parsed.graceNotesEnabled
          : DEFAULT_SETTINGS.graceNotesEnabled,
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
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

  const startSession = useCallback(async (score?: ImportedRhythmScore) => {
    stopTimers();
    if (audioRef.current) await audioRef.current.stop();

    const sessionSettings = score
      ? {
          ...settings,
          bpm: score.bpm ?? settings.bpm,
          timeSignature: score.timeSignature,
        }
      : settings;
    if (score) setSettings(sessionSettings);

    const audio = new MetronomeAudio();
    audioRef.current = audio;
    await audio.resume();

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
      soundEnabled: sessionSettings.soundEnabled,
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

  const startExercise = useCallback(() => startSession(), [startSession]);
  const startScoreExercise = useCallback(
    (score: ImportedRhythmScore) => startSession(score),
    [startSession],
  );

  const registerTap = useCallback((hand: Hand, timestamp: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.tap(hand, timestamp);
    audioRef.current?.playHandClick(hand);
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
    () => ({ settings, updateSettings, startExercise, startScoreExercise, stopExercise, registerTap, snapshot, results }),
    [settings, updateSettings, startExercise, startScoreExercise, stopExercise, registerTap, snapshot, results],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useRhythmSession(): SessionContextValue {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useRhythmSession must be used inside SessionProvider');
  return session;
}
