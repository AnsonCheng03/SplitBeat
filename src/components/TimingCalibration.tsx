import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MetronomeAudio } from '@/audio/metronome';
import { calibrationOffsetFromErrors, CALIBRATION_TAPS_PER_HAND } from '@/rhythm/timingCalibration';
import { timeSignatureMetrics } from '@/rhythm/subdivisions';
import { useTheme } from '@/theme/ThemeProvider';
import type { Hand, SoundPreset, TimeSignature } from '@/types/rhythm';

interface TimingCalibrationProps {
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

export function TimingCalibration({
  bpm,
  timeSignature,
  metronomeSound,
  leftHandSound,
  rightHandSound,
  soundEnabled,
  onCalibrate,
}: TimingCalibrationProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'running' | 'complete' | 'error'>('ready');
  const [starting, setStarting] = useState(false);
  const [counts, setCounts] = useState<Record<Hand, number>>({ left: 0, right: 0 });
  const [message, setMessage] = useState('');
  const audioRef = useRef<MetronomeAudio | null>(null);
  const runRef = useRef<CalibrationRun | null>(null);
  const runTokenRef = useRef(0);

  useEffect(
    () => () => {
      runTokenRef.current += 1;
      void audioRef.current?.stop();
    },
    [],
  );

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

    if (
      run.errors.left.length < CALIBRATION_TAPS_PER_HAND ||
      run.errors.right.length < CALIBRATION_TAPS_PER_HAND
    ) {
      return;
    }

    onCalibrate({
      leftTapOffsetMs: calibrationOffsetFromErrors(run.errors.left),
      rightTapOffsetMs: calibrationOffsetFromErrors(run.errors.right),
    });
    setMessage('Calibration saved. Timing offsets have been updated for both hands.');
    setPhase('complete');
    runRef.current = null;
    stopAudio();
  };

  const handZone = (hand: Hand) => {
    const isLeft = hand === 'left';
    const complete = counts[hand] >= CALIBRATION_TAPS_PER_HAND;
    const accent = isLeft ? colors.left : colors.right;
    return (
      <View
        key={hand}
        testID={`calibration.tap.${hand}`}
        accessibilityRole="button"
        accessibilityLabel={t('Calibrate {hand} hand timing', { hand: t(hand === 'left' ? 'left' : 'right') })}
        onTouchStart={() => handleTap(hand, monotonicNow())}
        collapsable={false}
        style={{
          flex: 1,
          minHeight: 170,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isLeft ? colors.leftSurface : colors.rightSurface,
          borderWidth: 1,
          borderColor: accent,
          borderRadius: 18,
          marginHorizontal: 5,
          opacity: complete ? 0.55 : 1,
        }}
      >
        <Text style={{ color: accent, fontSize: 12, fontWeight: '800', letterSpacing: 2 }}>
          {isLeft ? 'LEFT HAND' : 'RIGHT HAND'}
        </Text>
        <Text style={{ color: colors.text, fontSize: 21, fontWeight: '800', marginTop: 8 }}>
          {complete ? 'READY' : 'TAP'}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8, fontVariant: ['tabular-nums'] }}>
          {counts[hand]} / {CALIBRATION_TAPS_PER_HAND}
        </Text>
      </View>
    );
  };

  return (
    <>
      <Pressable
        testID="setup.calibration.open"
        accessibilityRole="button"
        onPress={open}
        style={{
          minHeight: 54,
          marginTop: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
          CALIBRATE BOTH HANDS
        </Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="fade"
        supportedOrientations={['landscape-left', 'landscape-right']}
        onRequestClose={close}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flex: 1, width: '100%', maxWidth: 950, alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 10 }}>
            <View style={{ minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable
                testID="calibration.close"
                accessibilityRole="button"
                accessibilityLabel={t('Close timing calibration')}
                onPress={close}
                style={{ minWidth: 76, minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '800' }}>‹  CLOSE</Text>
              </Pressable>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 }}>
                TIMING CALIBRATION
              </Text>
              <View style={{ width: 54 }} />
            </View>

            <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 20 }}>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900', textAlign: 'center' }}>
                Match the pulse.
              </Text>
              <Text style={{ color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 7, maxWidth: 600 }}>
                The metronome counts in, then each hand records eight taps. Keep tapping with both hands until both sides are complete.
              </Text>
              <Text style={{ color: colors.dim, fontSize: 12, textAlign: 'center', marginTop: 5 }}>
                Calibration uses the current {bpm} BPM and {timeSignature} pulse.
              </Text>
            </View>

            {phase === 'ready' || phase === 'error' ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {message ? (
                  <Text style={{ color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: 14 }}>
                    {message}
                  </Text>
                ) : null}
                <Pressable
                  testID="calibration.start"
                  onPress={start}
                  disabled={starting}
                  style={{ minHeight: 58, minWidth: 250, paddingHorizontal: 24, borderRadius: 16, backgroundColor: colors.left, alignItems: 'center', justifyContent: 'center', opacity: starting ? 0.65 : 1 }}
                >
                  <Text style={{ color: colors.background, fontSize: 15, fontWeight: '900', letterSpacing: 0.7 }}>
                    {starting ? 'PREPARING…' : phase === 'error' ? 'TRY AGAIN' : 'START CALIBRATION'}
                  </Text>
                </Pressable>
              </View>
            ) : phase === 'complete' ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.left, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>
                  {message}
                </Text>
                <Pressable onPress={close} style={{ minHeight: 54, minWidth: 190, marginTop: 24, borderRadius: 15, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>DONE</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textAlign: 'center', marginBottom: 9 }}>
                  {counts.left >= CALIBRATION_TAPS_PER_HAND && counts.right >= CALIBRATION_TAPS_PER_HAND
                    ? 'CALIBRATED'
                    : 'TAP ON EACH CLICK'}
                </Text>
                <View style={{ flex: 1, flexDirection: 'row', marginBottom: 12 }}>
                  {handZone('left')}
                  {handZone('right')}
                </View>
                {message ? (
                  <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', minHeight: 20 }}>
                    {message}
                  </Text>
                ) : null}
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
