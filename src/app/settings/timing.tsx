import Slider from '@react-native-community/slider';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { SettingsPage } from '@/components/SettingsPage';
import { TimingCalibration } from '@/components/TimingCalibration';
import {
  DEFAULT_GOOD_WINDOW_MS,
  MAX_GOOD_WINDOW_MS,
  MIN_GOOD_WINDOW_MS,
} from '@/rhythm/timingCalibration';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';

function signedMilliseconds(value: number): string {
  return `${value > 0 ? '+' : ''}${value} ms`;
}

export default function TimingSettingsScreen() {
  const { colors } = useTheme();
  const { settings, featureFlags, updateSettings } = useRhythmSession();
  const router = useRouter();
  useEffect(() => {
    if (!featureFlags.timingCalibration) router.replace('/setup');
  }, [featureFlags.timingCalibration, router]);

  const reset = () =>
    updateSettings({
      leftTapOffsetMs: 0,
      rightTapOffsetMs: 0,
      goodWindowMs: DEFAULT_GOOD_WINDOW_MS,
    });

  return (
    <SettingsPage
      testID="settings.timing.screen"
      backTestID="settings.timing.back"
      section="timing"
      title="Timing calibration"
      description="Fine-tune how close a tap must be and correct consistent early or late taps."
    >
      <View style={{ marginTop: 15, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>CALIBRATE BOTH HANDS</Text>
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 12 }}>
          Tap with each hand on the click to measure and save your timing offset.
        </Text>
        <TimingCalibration
          bpm={settings.bpm}
          timeSignature={settings.timeSignature}
          metronomeSound={settings.metronomeSound}
          leftHandSound={settings.leftHandSound}
          rightHandSound={settings.rightHandSound}
          soundEnabled={settings.soundEnabled}
          onCalibrate={(offsets) => updateSettings(offsets)}
        />
      </View>

      <Pressable
        testID="setup.calibration.reset"
        accessibilityRole="button"
        onPress={reset}
        style={{ minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center', marginTop: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}
      >
        <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 0.4 }}>
          RESET TIMING DEFAULTS
        </Text>
      </Pressable>

      <SettingSlider
        testID="setup.calibration.leftOffset"
        title={`LEFT TAP OFFSET · ${signedMilliseconds(settings.leftTapOffsetMs)}`}
        value={settings.leftTapOffsetMs}
        minimum={-200}
        maximum={200}
        step={5}
        color={colors.left}
        onChange={(leftTapOffsetMs) => updateSettings({ leftTapOffsetMs })}
      />
      <SettingSlider
        testID="setup.calibration.rightOffset"
        title={`RIGHT TAP OFFSET · ${signedMilliseconds(settings.rightTapOffsetMs)}`}
        value={settings.rightTapOffsetMs}
        minimum={-200}
        maximum={200}
        step={5}
        color={colors.right}
        onChange={(rightTapOffsetMs) => updateSettings({ rightTapOffsetMs })}
      />
      <SettingSlider
        testID="setup.calibration.goodWindow"
        title={`ACCEPTABLE TIMING RANGE · ±${settings.goodWindowMs} MS`}
        value={settings.goodWindowMs}
        minimum={MIN_GOOD_WINDOW_MS}
        maximum={MAX_GOOD_WINDOW_MS}
        step={5}
        color={colors.accent}
        onChange={(goodWindowMs) => updateSettings({ goodWindowMs })}
        endpoints={[`STRICT · ${MIN_GOOD_WINDOW_MS} ms`, `WIDE · ${MAX_GOOD_WINDOW_MS} ms`]}
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
    <View style={{ marginTop: 20 }}>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.4 }}>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 }}>
          <Text style={{ color: colors.dim, fontSize: 10 }}>{endpoints[0]}</Text>
          <Text style={{ color: colors.dim, fontSize: 10 }}>{endpoints[1]}</Text>
        </View>
      ) : null}
    </View>
  );
}
