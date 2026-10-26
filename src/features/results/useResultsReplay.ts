import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useI18n } from '@/i18n/I18nProvider';
import { MetronomeAudio } from '@/audio/metronome';
import { createReplayAudioEvents } from '@/audio/replay';
import type { ExerciseSettings, SessionResults } from '@/types/rhythm';

export interface ResultsReplayState {
  barIndex: number;
  playbackId: number;
  isPlaying: boolean;
  isStarting: boolean;
}

type ReplayExpectedEvents = NonNullable<SessionResults['replayExpectedEvents']>;
type ReplayTaps = NonNullable<SessionResults['replayTaps']>;

export function useResultsReplay({
  results,
  replaySoundEnabled,
  metronomeSound,
  leftHandSound,
  rightHandSound,
  discardReplayData,
}: {
  results: SessionResults | null;
  replaySoundEnabled: boolean;
  metronomeSound: ExerciseSettings['metronomeSound'];
  leftHandSound: ExerciseSettings['leftHandSound'];
  rightHandSound: ExerciseSettings['rightHandSound'];
  discardReplayData: () => void;
}) {
  const { t } = useI18n();
  const [replay, setReplay] = useState<ResultsReplayState | null>(null);
  const playbackSequence = useRef(0);
  const activeAudio = useRef<{ playbackId: number; audio: MetronomeAudio } | null>(null);

  const stopReplayAudio = useCallback(async (playbackId?: number) => {
    const current = activeAudio.current;
    if (!current || (playbackId !== undefined && current.playbackId !== playbackId)) return;

    activeAudio.current = null;
    try {
      await current.audio.stop();
    } catch {
      // Audio teardown is best effort; it must not interrupt visual replay.
    }
  }, []);

  useFocusEffect(useCallback(() => () => {
    void stopReplayAudio();
    discardReplayData();
  }, [discardReplayData, stopReplayAudio]));

  const replayBar = useCallback(async (
    barIndex: number,
    expectedEvents: ReplayExpectedEvents,
    taps: ReplayTaps,
    beatsPerBar: number,
  ) => {
    playbackSequence.current += 1;
    const playbackId = playbackSequence.current;
    setReplay({ barIndex, playbackId, isPlaying: false, isStarting: true });
    await stopReplayAudio();
    if (playbackId !== playbackSequence.current) return;

    if (!replaySoundEnabled || process.env.EXPO_PUBLIC_E2E_SILENT === '1') {
      setReplay({ barIndex, playbackId, isPlaying: true, isStarting: false });
      return;
    }

    try {
      const audio = new MetronomeAudio();
      activeAudio.current = { playbackId, audio };
      await audio.prepare();
      await audio.resume();
      if (playbackId !== playbackSequence.current) {
        await stopReplayAudio(playbackId);
        return;
      }

      const bpm = results?.bpm ?? 60;
      const audioEvents = createReplayAudioEvents(barIndex, beatsPerBar, bpm, expectedEvents, taps);
      audio.playReplayEvents(audioEvents, {
        metronome: metronomeSound,
        leftHand: leftHandSound,
        rightHand: rightHandSound,
      }, beatsPerBar * 60_000 / bpm);
      setReplay({ barIndex, playbackId, isPlaying: true, isStarting: false });
    } catch {
      await stopReplayAudio(playbackId);
      if (playbackId !== playbackSequence.current) return;
      setReplay({ barIndex, playbackId, isPlaying: true, isStarting: false });
      Alert.alert(t('Replay sound unavailable'), t('The visual replay will continue. Check your device audio and try again.'));
    }
  }, [leftHandSound, metronomeSound, replaySoundEnabled, results, rightHandSound, stopReplayAudio, t]);

  const finishVisualReplay = useCallback((barIndex: number, playbackId: number) => {
    setReplay((current) => current?.barIndex === barIndex && current.playbackId === playbackId
      ? { ...current, isPlaying: false, isStarting: false }
      : current,
    );
    void stopReplayAudio(playbackId);
  }, [stopReplayAudio]);

  return { replay, replayBar, finishVisualReplay };
}
