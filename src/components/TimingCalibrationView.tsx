import { Modal, Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CALIBRATION_TAPS_PER_HAND } from '@/rhythm/timingCalibration';
import { useTheme } from '@/theme/ThemeProvider';
import type { Hand, TimeSignature } from '@/types/rhythm';

interface TimingCalibrationViewProps {
  visible: boolean;
  phase: 'ready' | 'running' | 'complete' | 'error';
  starting: boolean;
  counts: Record<Hand, number>;
  message: string;
  bpm: number;
  timeSignature: TimeSignature;
  onOpen: () => void;
  onClose: () => void;
  onStart: () => void;
  onTap: (hand: Hand, timestamp: number) => void;
}

function monotonicNow(): number {
  return globalThis.performance.now();
}

export function TimingCalibrationView({
  visible,
  phase,
  starting,
  counts,
  message,
  bpm,
  timeSignature,
  onOpen,
  onClose,
  onStart,
  onTap,
}: TimingCalibrationViewProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

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
        onTouchStart={() => onTap(hand, monotonicNow())}
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
        onPress={onOpen}
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
        onRequestClose={onClose}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flex: 1, width: '100%', maxWidth: 950, alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 10 }}>
            <View style={{ minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable
                testID="calibration.close"
                accessibilityRole="button"
                accessibilityLabel={t('Close timing calibration')}
                onPress={onClose}
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
                  onPress={onStart}
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
                <Pressable onPress={onClose} style={{ minHeight: 54, minWidth: 190, marginTop: 24, borderRadius: 15, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
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
