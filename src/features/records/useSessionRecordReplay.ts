import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useResultsReplay } from '@/features/results/useResultsReplay';
import { timeSignatureMetrics } from '@/rhythm/subdivisions';
import { useRhythmSession } from '@/store/sessionStore';
import type { SessionRecord } from '@/store/sessionHistory';
import { TIME_SIGNATURES, type ReplayExpectedEvent, type ReplayTap, type TimeSignature } from '@/types/rhythm';

const preserveActiveResults = () => undefined;
const EMPTY_EXPECTED_EVENTS: ReplayExpectedEvent[] = [];
const EMPTY_TAPS: ReplayTap[] = [];

export function useSessionRecordReplay(record: SessionRecord) {
  const { settings } = useRhythmSession();
  const [barIndex, setBarIndex] = useState(1);
  const [playbackId, setPlaybackId] = useState(1);
  const [playing, setPlaying] = useState(true);
  const timeSignature = (TIME_SIGNATURES as readonly string[]).includes(record.timeSignature)
    ? record.timeSignature as TimeSignature
    : '4/4';
  const metrics = timeSignatureMetrics(record.bpm, timeSignature);
  const expectedEvents = record.replay?.expectedEvents ?? EMPTY_EXPECTED_EVENTS;
  const taps = record.replay?.taps ?? EMPTY_TAPS;
  const expectedEventsInBar = useMemo(
    () => expectedEvents.filter((event) => event.barIndex === barIndex),
    [barIndex, expectedEvents],
  );
  const tapsInBar = useMemo(
    () => taps.filter((tap) => tap.barIndex === barIndex),
    [barIndex, taps],
  );
  const barCount = useMemo(() => {
    const lastRecordedBar = Math.max(
      0,
      ...expectedEvents.map((event) => event.barIndex),
      ...taps.map((tap) => tap.barIndex),
    );
    const barsFromDuration = Math.ceil(
      record.durationSeconds * record.bpm / 60 / metrics.beatsPerBar,
    );
    return Math.max(1, lastRecordedBar, barsFromDuration);
  }, [expectedEvents, metrics.beatsPerBar, record.bpm, record.durationSeconds, taps]);
  const { replay, replayBar, finishVisualReplay } = useResultsReplay({
    results: { bpm: record.bpm },
    replaySoundEnabled: settings.soundEnabled,
    metronomeSound: settings.metronomeSound,
    leftHandSound: settings.leftHandSound,
    rightHandSound: settings.rightHandSound,
    discardReplayData: preserveActiveResults,
  });
  const replayState = useRef(replay);

  useEffect(() => {
    replayState.current = replay;
  }, [replay]);

  useEffect(() => {
    if (!playing) return;
    void replayBar(barIndex, expectedEventsInBar, tapsInBar, metrics.beatsPerBar);
  }, [barIndex, expectedEventsInBar, metrics.beatsPerBar, playbackId, playing, replayBar, tapsInBar]);

  const handlePlaybackEnd = useCallback((finishedBar: number, finishedPlaybackId: number) => {
    if (!playing || finishedBar !== barIndex || finishedPlaybackId !== playbackId) return;
    const activeReplay = replayState.current;
    if (activeReplay) finishVisualReplay(activeReplay.barIndex, activeReplay.playbackId);
    if (finishedBar < barCount) {
      setBarIndex(finishedBar + 1);
      setPlaybackId((current) => current + 1);
      return;
    }
    setPlaying(false);
  }, [barCount, barIndex, finishVisualReplay, playbackId, playing]);

  const restartReplay = useCallback(() => {
    setBarIndex(1);
    setPlaybackId((current) => current + 1);
    setPlaying(true);
  }, []);
  const hands = record.trainingMode === 'single-hand'
    ? [record.singleHand]
    : ['left', 'right'] as const;

  return {
    barIndex,
    barCount,
    expectedEventsInBar,
    hands,
    handlePlaybackEnd,
    isReplayAvailable: Boolean(record.replay && (expectedEvents.length > 0 || taps.length > 0)),
    metrics,
    playbackId,
    playing,
    replay,
    restartReplay,
    tapsInBar,
    timeSignature,
  };
}
