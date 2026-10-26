import { Modal, Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CALIBRATION_TAPS_PER_HAND } from '@/rhythm/timingCalibration';
import { useTheme } from '@/theme/ThemeProvider';
import type { Hand, TimeSignature } from '@/types/rhythm';
import {
  TimingCalibrationViewStyle1,
  TimingCalibrationViewStyle2,
  TimingCalibrationViewStyle3,
  TimingCalibrationViewStyle4,
  TimingCalibrationViewStyle5,
  TimingCalibrationViewStyle6,
  TimingCalibrationViewStyle7,
  TimingCalibrationViewStyle8,
  TimingCalibrationViewStyle9,
  TimingCalibrationViewStyle10,
  TimingCalibrationViewStyle11,
  TimingCalibrationViewStyle12,
  TimingCalibrationViewStyle13,
  TimingCalibrationViewStyle14,
  TimingCalibrationViewStyle15,
  TimingCalibrationViewStyle16,
  TimingCalibrationViewStyle17,
  TimingCalibrationViewStyle18,
  TimingCalibrationViewStyle19,
  TimingCalibrationViewStyle20,
  TimingCalibrationViewStyle21,
  TimingCalibrationViewStyle22,
  TimingCalibrationViewStyle23,
  TimingCalibrationViewStyle24,
  TimingCalibrationViewStyle25,
  TimingCalibrationViewStyle26,
  TimingCalibrationViewStyle27,
  TimingCalibrationViewStyle28
} from '@/styles/settings';

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
        style={TimingCalibrationViewStyle1({ isLeft, colors, accent, complete })}
      >
        <Text style={TimingCalibrationViewStyle2({ accent })}>
          {isLeft ? 'LEFT HAND' : 'RIGHT HAND'}
        </Text>
        <Text style={TimingCalibrationViewStyle3({ colors })}>
          {complete ? 'READY' : 'TAP'}
        </Text>
        <Text style={TimingCalibrationViewStyle4({ colors })}>
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
        style={TimingCalibrationViewStyle5({ colors })}
      >
        <Text style={TimingCalibrationViewStyle6({ colors })}>
          CALIBRATE BOTH HANDS
        </Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="fade"
        supportedOrientations={['landscape-left', 'landscape-right']}
        onRequestClose={onClose}
      >
        <SafeAreaView style={TimingCalibrationViewStyle7({ colors })}>
          <View style={TimingCalibrationViewStyle8()}>
            <View style={TimingCalibrationViewStyle9()}>
              <Pressable
                testID="calibration.close"
                accessibilityRole="button"
                accessibilityLabel={t('Close timing calibration')}
                onPress={onClose}
                style={TimingCalibrationViewStyle10()}
              >
                <Text style={TimingCalibrationViewStyle11({ colors })}>‹  CLOSE</Text>
              </Pressable>
              <Text style={TimingCalibrationViewStyle12({ colors })}>
                TIMING CALIBRATION
              </Text>
              <View style={TimingCalibrationViewStyle13()} />
            </View>

            <View style={TimingCalibrationViewStyle14()}>
              <Text style={TimingCalibrationViewStyle15({ colors })}>
                Match the pulse.
              </Text>
              <Text style={TimingCalibrationViewStyle16({ colors })}>
                The metronome counts in, then each hand records eight taps. Keep tapping with both hands until both sides are complete.
              </Text>
              <Text style={TimingCalibrationViewStyle17({ colors })}>
                Calibration uses the current {bpm} BPM and {timeSignature} pulse.
              </Text>
            </View>

            {phase === 'ready' || phase === 'error' ? (
              <View style={TimingCalibrationViewStyle18()}>
                {message ? (
                  <Text style={TimingCalibrationViewStyle19({ colors })}>
                    {message}
                  </Text>
                ) : null}
                <Pressable
                  testID="calibration.start"
                  onPress={onStart}
                  disabled={starting}
                  style={TimingCalibrationViewStyle20({ colors, starting })}
                >
                  <Text style={TimingCalibrationViewStyle21({ colors })}>
                    {starting ? 'PREPARING…' : phase === 'error' ? 'TRY AGAIN' : 'START CALIBRATION'}
                  </Text>
                </Pressable>
              </View>
            ) : phase === 'complete' ? (
              <View style={TimingCalibrationViewStyle22()}>
                <Text style={TimingCalibrationViewStyle23({ colors })}>
                  {message}
                </Text>
                <Pressable onPress={onClose} style={TimingCalibrationViewStyle24({ colors })}>
                  <Text style={TimingCalibrationViewStyle25({ colors })}>DONE</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={TimingCalibrationViewStyle26({ colors })}>
                  {counts.left >= CALIBRATION_TAPS_PER_HAND && counts.right >= CALIBRATION_TAPS_PER_HAND
                    ? 'CALIBRATED'
                    : 'TAP ON EACH CLICK'}
                </Text>
                <View style={TimingCalibrationViewStyle27()}>
                  {handZone('left')}
                  {handZone('right')}
                </View>
                {message ? (
                  <Text style={TimingCalibrationViewStyle28({ colors })}>
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
