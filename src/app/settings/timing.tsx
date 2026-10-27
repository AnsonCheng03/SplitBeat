import Slider from '@react-native-community/slider';
import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { SettingsPage } from '@/components/SettingsPage';
import { TimingCalibration } from '@/components/TimingCalibration';
import { SettingsSection } from '@/components/SettingsSection';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { useTheme } from '@/theme/ThemeProvider';
import { useTimingSettingsScreen } from '@/features/timing/useTimingSettingsScreen';
import {
  timingStyle1,
  timingStyle2,
  timingStyle3,
  timingStyle4,
  timingStyle5,
  timingStyle6,
  timingStyle7,
  timingStyle8,
  timingStyle9,
  timingStyle10
} from '@/styles/settings';

export default function TimingSettingsScreen() {
  const {
    colors,
    settings,
    updateSettings,
    reset,
    updateLeftOffset,
    updateRightOffset,
    updateGoodWindow,
    updateAutoCalibration,
    leftOffsetTitle,
    rightOffsetTitle,
    goodWindowTitle,
    strictEndpoint,
    wideEndpoint,
    minimumGoodWindowMs,
    maximumGoodWindowMs,
  } = useTimingSettingsScreen();

  return (
    <SettingsPage
      testID="settings.timing.screen"
      backTestID="settings.timing.back"
      section="timing"
      title="Timing calibration"
      description="Fine-tune how close a tap must be and correct consistent early or late taps."
    >
      <View style={timingStyle1({ colors })}>
        <Text style={timingStyle2({ colors })}>CALIBRATE BOTH HANDS</Text>
        <Text style={timingStyle3({ colors })}>
          Tap with each hand on the click to measure and save your timing offset.
        </Text>
        <TimingCalibration
          bpm={settings.bpm}
          timeSignature={settings.timeSignature}
          metronomeSound={settings.metronomeSound}
          leftHandSound={settings.leftHandSound}
          rightHandSound={settings.rightHandSound}
          soundEnabled={settings.soundEnabled}
        onCalibrate={updateSettings}
        />
      </View>

      <SettingsSection title="TIMING SCORING">
        <SettingsToggleRow
          testID="settings.timing.autoCalibration"
          label="AUTO-CALIBRATED SCORING"
          description="Apply your saved left and right timing offsets to tap marks. Your offsets remain saved when this is off."
          value={settings.autoCalibrationEnabled}
          onChange={updateAutoCalibration}
        />
      </SettingsSection>

      <Pressable
        testID="setup.calibration.reset"
        accessibilityRole="button"
        onPress={reset}
        style={timingStyle4({ colors })}
      >
        <Text style={timingStyle5({ colors })}>
          RESET TIMING DEFAULTS
        </Text>
      </Pressable>

      <SettingSlider
        testID="setup.calibration.leftOffset"
        title={leftOffsetTitle}
        value={settings.leftTapOffsetMs}
        minimum={-200}
        maximum={200}
        step={5}
        color={colors.left}
        onChange={updateLeftOffset}
      />
      <SettingSlider
        testID="setup.calibration.rightOffset"
        title={rightOffsetTitle}
        value={settings.rightTapOffsetMs}
        minimum={-200}
        maximum={200}
        step={5}
        color={colors.right}
        onChange={updateRightOffset}
      />
      <SettingSlider
        testID="setup.calibration.goodWindow"
        title={goodWindowTitle}
        value={settings.goodWindowMs}
        minimum={minimumGoodWindowMs}
        maximum={maximumGoodWindowMs}
        step={5}
        color={colors.accent}
        onChange={updateGoodWindow}
        endpoints={[strictEndpoint, wideEndpoint]}
      />

    </SettingsPage>
  );
}

function SettingSlider({
  testID,
  title,
  value,
  minimum,
  maximum,
  step,
  color,
  onChange,
  endpoints,
}: {
  testID: string;
  title: string;
  value: number;
  minimum: number;
  maximum: number;
  step: number;
  color: string;
  onChange: (value: number) => void;
  endpoints?: [string, string];
}) {
  const { colors } = useTheme();
  return (
    <View style={timingStyle6()}>
      <Text style={timingStyle7({ colors })}>
        {title}
      </Text>
      <Slider
        testID={testID}
        minimumValue={minimum}
        maximumValue={maximum}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor={colors.line}
        thumbTintColor={colors.text}
      />
      {endpoints ? (
        <View style={timingStyle8()}>
          <Text style={timingStyle9({ colors })}>{endpoints[0]}</Text>
          <Text style={timingStyle10({ colors })}>{endpoints[1]}</Text>
        </View>
      ) : null}
    </View>
  );
}
