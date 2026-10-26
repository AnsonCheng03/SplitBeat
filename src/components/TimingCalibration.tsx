import { TimingCalibrationView } from '@/components/TimingCalibrationView';
import { useTimingCalibration } from '@/features/timing/useTimingCalibration';
import type { TimingCalibrationOptions } from '@/features/timing/useTimingCalibration';

export type TimingCalibrationProps = TimingCalibrationOptions;

export function TimingCalibration(props: TimingCalibrationProps) {
  const calibration = useTimingCalibration(props);

  return (
    <TimingCalibrationView
      visible={calibration.visible}
      phase={calibration.phase}
      starting={calibration.starting}
      counts={calibration.counts}
      message={calibration.message}
      bpm={props.bpm}
      timeSignature={props.timeSignature}
      onOpen={calibration.open}
      onClose={calibration.close}
      onStart={() => void calibration.start()}
      onTap={calibration.handleTap}
    />
  );
}
