import { useEffect, useRef, useState } from 'react';
import { MetronomeAudio } from '@/audio/metronome';
import { calibrationOffsetFromErrors, CALIBRATION_TAPS_PER_HAND } from '@/rhythm/timingCalibration';
import { timeSignatureMetrics } from '@/rhythm/subdivisions';
import type { Hand, SoundPreset, TimeSignature } from '@/types/rhythm';

export interface TimingCalibrationOptions {
  bpm: number;
  timeSignature: TimeSignature;
  metronomeSound: SoundPreset;
  leftHandSound: SoundPreset;
  rightHandSound: SoundPreset;
  soundEnabled: boolean;
  onCalibrate: (offsets: { leftTapOffsetMs: number; rightTapOffsetMs: number }) => void;
}

interface CalibrationRun {
  expectedBeatTimes: number[];
  beatDurationMs: number;
  matched: Record<Hand, Set<number>>;
  errors: Record<Hand, number[]>;
}

const AUDIO_LEAD_IN_MS = 300;
const CALIBRATION_BEATS = 64;

function monotonicNow(): number {
  return globalThis.performance.now();
}

export function useTimingCalibration({
  bpm,
  timeSignature,
  metronomeSound,
  leftHandSound,
  rightHandSound,
  soundEnabled,
  onCalibrate,
}: TimingCalibrationOptions) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'running' | 'complete' | 'error'>('ready');
  const [starting, setStarting] = useState(false);
  const [counts, setCounts] = useState<Record<Hand, number>>({ left: 0, right: 0 });
  const [message, setMessage] = useState('');
  const audioRef = useRef<MetronomeAudio | null>(null);
  const runRef = useRef<CalibrationRun | null>(null);
  const runTokenRef = useRef(0);

  useEffect(() => () => {
    runTokenRef.current += 1;
    void audioRef.current?.stop();
  }, []);

  const stopAudio = () => {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) void audio.stop();
  };

  const close = () => {
    runTokenRef.current += 1;
    runRef.current = null;
    stopAudio();
    setVisible(false);
    setStarting(false);
    setPhase('ready');
  };

  const open = () => {
    setCounts({ left: 0, right: 0 });
    setMessage('');
    setPhase('ready');
    setVisible(true);
  };

  const start = async () => {
    if (starting) return;
    if (!soundEnabled) {
      setMessage('Turn on Sound effects in setup to calibrate against the audible click.');
      setPhase('error');
      return;
    }
    setStarting(true);
    const runToken = ++runTokenRef.current;
    const audio = new MetronomeAudio();
    audioRef.current = audio;

    try {
      await audio.resume();
      if (runToken !== runTokenRef.current) {
        await audio.stop();
        return;
      }

      const metrics = timeSignatureMetrics(bpm, timeSignature);
      const performanceStart = monotonicNow();
      const audioStart = audio.currentTime;
      const countInMs = AUDIO_LEAD_IN_MS + metrics.beatDurationMs * 3;
      const firstBeatAt = performanceStart + countInMs;
      runRef.current = {
        beatDurationMs: metrics.beatDurationMs,
        expectedBeatTimes: Array.from(
          { length: CALIBRATION_BEATS },
          (_, index) => firstBeatAt + index * metrics.beatDurationMs,
        ),
        matched: { left: new Set(), right: new Set() },
        errors: { left: [], right: [] },
      };
      audio.start({
        sessionStartAudioTime: audioStart + countInMs / 1_000,
        bpm,
        beatsPerBar: metrics.beatsPerBar,
        durationSeconds: null,
        soundEnabled,
        sounds: { metronome: metronomeSound, leftHand: leftHandSound, rightHand: rightHandSound },
      });
      setCounts({ left: 0, right: 0 });
      setMessage('Wait through the count-in, then tap each pulse with both hands.');
      setPhase('running');
    } catch {
      runRef.current = null;
      if (audioRef.current === audio) stopAudio();
      else void audio.stop();
      if (runToken === runTokenRef.current) {
        setMessage('Audio could not start. Check the device audio settings and try again.');
        setPhase('error');
      }
    } finally {
      if (runToken === runTokenRef.current) setStarting(false);
    }
  };

  const handleTap = (hand: Hand, timestamp: number) => {
    const run = runRef.current;
    if (phase !== 'running' || !run || run.errors[hand].length >= CALIBRATION_TAPS_PER_HAND) return;

    const maxErrorMs = Math.min(200, run.beatDurationMs * 0.4);
    let nearestIndex = -1;
    let nearestErrorMs = Number.POSITIVE_INFINITY;
    run.expectedBeatTimes.forEach((expectedTime, index) => {
      if (run.matched[hand].has(index)) return;
      const error = timestamp - expectedTime;
      if (Math.abs(error) < Math.abs(nearestErrorMs)) {
        nearestIndex = index;
        nearestErrorMs = error;
      }
    });

    if (nearestIndex === -1 || Math.abs(nearestErrorMs) > maxErrorMs) {
      setMessage('Tap closer to the click. Your next on-time tap will count.');
      return;
    }

    run.matched[hand].add(nearestIndex);
    run.errors[hand].push(nearestErrorMs);
    setCounts({ left: run.errors.left.length, right: run.errors.right.length });
    setMessage('');

    if (run.errors.left.length < CALIBRATION_TAPS_PER_HAND || run.errors.right.length < CALIBRATION_TAPS_PER_HAND) return;

    onCalibrate({
      leftTapOffsetMs: calibrationOffsetFromErrors(run.errors.left),
      rightTapOffsetMs: calibrationOffsetFromErrors(run.errors.right),
    });
    setMessage('Calibration saved. Timing offsets have been updated for both hands.');
    setPhase('complete');
    runRef.current = null;
    stopAudio();
  };

  return {
    visible,
    phase,
    starting,
    counts,
    message,
    open,
    close,
    start,
    handleTap,
  };
}
