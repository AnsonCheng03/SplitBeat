import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import type { RefObject } from 'react';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SOUND_OPTIONS } from '@/audio/soundPresets';
import { AutoPlayRhythmSetting } from '@/components/AutoPlayRhythmSetting';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { PracticeOverlayBackdrop } from '@/components/PracticeOverlayBackdrop';
import { TimingCalibration } from '@/components/TimingCalibration';
import { DEFAULT_GOOD_WINDOW_MS } from '@/rhythm/timingCalibration';
import type { FeatureFlags } from '@/features/featureFlags';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExerciseSettings, FlashSource, SoundPreset } from '@/types/rhythm';
import { LivePracticeSettingsStyle1,
  LivePracticeSettingsStyle2,
  LivePracticeSettingsStyle3,
  LivePracticeSettingsStyle4,
  LivePracticeSettingsStyle5,
  LivePracticeSettingsStyle6,
  LivePracticeSettingsStyle7,
  LivePracticeSettingsStyle8,
  LivePracticeSettingsStyle9,
  LivePracticeSettingsStyle10,
  LivePracticeSettingsStyle11,
  LivePracticeSettingsStyle12,
  LivePracticeSettingsStyle13,
  LivePracticeSettingsStyle14,
  LivePracticeSettingsStyle15,
  LivePracticeSettingsStyle16,
  LivePracticeSettingsStyle17,
  LivePracticeSettingsStyle18,
  LivePracticeSettingsStyle19,
  LivePracticeSettingsStyle20, LivePracticeSettingsStyle21 } from '@/styles/settings';

const FLASH_SOURCE_OPTIONS: readonly { label: string; value: FlashSource }[] = [
  { label: 'On tap', value: 'tap' },
  { label: 'On beat', value: 'beat' },
];

export function LivePracticeSettings({
  settings,
  featureFlags,
  blurTarget,
  onSettingsChange,
  onBack,
  compact,
}: {
  settings: ExerciseSettings;
  featureFlags: FeatureFlags;
  blurTarget: RefObject<View | null>;
  onSettingsChange: (patch: Partial<ExerciseSettings>) => void;
  onBack: () => void;
  compact: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const contentStyle: ViewStyle = {
    paddingTop: Math.max(10, insets.top + 8),
    paddingBottom: Math.max(10, insets.bottom + 8),
    paddingHorizontal: Math.max(14, insets.left + 14, insets.right + 14),
  };

  return (
    <PracticeOverlayBackdrop
      testID="practice.liveSettings"
      blurTarget={blurTarget}
      contentStyle={contentStyle}
    >
      <View style={LivePracticeSettingsStyle1({ compact })}>
        <View style={LivePracticeSettingsStyle2({ compact })}>
          <Pressable
            testID="practice.liveSettings.back"
            accessibilityRole="button"
            accessibilityLabel={t('Back to pause menu')}
            onPress={onBack}
            style={LivePracticeSettingsStyle3()}
          >
            <Text style={LivePracticeSettingsStyle4({ colors, compact })}>‹  PAUSED</Text>
          </Pressable>
          <Text style={LivePracticeSettingsStyle5({ colors, compact })}>LIVE SETTINGS</Text>
          <View style={LivePracticeSettingsStyle6()} />
        </View>

        <ScrollView contentContainerStyle={LivePracticeSettingsStyle21()} showsVerticalScrollIndicator={false}>
          {featureFlags.soundEffects ? (
            <>
              <SectionTitle title="SOUND" compact={compact} />
              <SettingsToggleRow
                testID="practice.liveSettings.sound"
                label="Sound effects"
                description="Mute or restore the metronome and tap sounds."
                value={settings.soundEnabled}
                onChange={(soundEnabled) => onSettingsChange({ soundEnabled })}
              />
              <SoundChoice
                title="METRONOME CLICK"
                testIDPrefix="practice.liveSettings.sound.metronome"
                value={settings.metronomeSound}
                onChange={(metronomeSound) => onSettingsChange({ metronomeSound })}
              />
              <View style={LivePracticeSettingsStyle7()}>
                <View style={LivePracticeSettingsStyle8()}>
                  <SoundChoice
                    title="LEFT-HAND CLICK"
                    testIDPrefix="practice.liveSettings.sound.left"
                    value={settings.leftHandSound}
                    onChange={(leftHandSound) => onSettingsChange({ leftHandSound })}
                  />
                </View>
                <View style={LivePracticeSettingsStyle9()}>
                  <SoundChoice
                    title="RIGHT-HAND CLICK"
                    testIDPrefix="practice.liveSettings.sound.right"
                    value={settings.rightHandSound}
                    onChange={(rightHandSound) => onSettingsChange({ rightHandSound })}
                  />
                </View>
              </View>
              {featureFlags.backgroundMusic ? (
                <SettingsToggleRow
                  testID="practice.liveSettings.backgroundMusic"
                  label="Background music"
                  value={settings.backgroundMusicEnabled}
                  onChange={(backgroundMusicEnabled) => onSettingsChange({ backgroundMusicEnabled })}
                />
              ) : null}
              {featureFlags.sessionCues ? (
                <SettingsToggleRow
                  testID="practice.liveSettings.sessionCues"
                  label="Start and change cues"
                  value={settings.sessionCuesEnabled}
                  onChange={(sessionCuesEnabled) => onSettingsChange({ sessionCuesEnabled })}
                />
              ) : null}
              {featureFlags.shownRhythmPlayback ? (
                <AutoPlayRhythmSetting
                  testID="practice.liveSettings.referenceRhythm"
                  active
                  value={settings.referenceRhythmEnabled}
                  onChange={(referenceRhythmEnabled) => onSettingsChange({ referenceRhythmEnabled })}
                />
              ) : null}
            </>
          ) : null}

          {featureFlags.tapHaptics || featureFlags.tapFeedback ? (
            <>
              <SectionTitle title="TAP FEEDBACK" compact={compact} />
              {featureFlags.tapHaptics ? (
                <SettingsToggleRow
                  testID="practice.liveSettings.haptics"
                  label="Vibration"
                  description="Feel a light haptic response when you tap."
                  value={settings.hapticsEnabled}
                  onChange={(hapticsEnabled) => onSettingsChange({ hapticsEnabled })}
                />
              ) : null}
              {featureFlags.tapFeedback ? (
                <>
                  <SettingsToggleRow
                    testID="practice.liveSettings.tapFlash"
                    label="Show correct and missed taps"
                    value={settings.tapResultFlashEnabled}
                    onChange={(tapResultFlashEnabled) => onSettingsChange({ tapResultFlashEnabled })}
                  />
                  <FlashChoice
                    title="LEFT-HAND FLASH"
                    testIDPrefix="practice.liveSettings.flash.left"
                    value={settings.leftFlashSource}
                    onChange={(leftFlashSource) => onSettingsChange({ leftFlashSource })}
                  />
                  <FlashChoice
                    title="RIGHT-HAND FLASH"
                    testIDPrefix="practice.liveSettings.flash.right"
                    value={settings.rightFlashSource}
                    onChange={(rightFlashSource) => onSettingsChange({ rightFlashSource })}
                  />
                </>
              ) : null}
            </>
          ) : null}

          {featureFlags.timingCalibration ? (
            <>
              <SectionTitle title="TIMING CALIBRATION" compact={compact} />
              <Text style={LivePracticeSettingsStyle10({ colors })}>
                Calibration runs while this session is paused. Its offsets and timing range will apply when you continue.
              </Text>
              <View style={LivePracticeSettingsStyle11()}>
                <TimingCalibration
                  bpm={settings.bpm}
                  timeSignature={settings.timeSignature}
                  metronomeSound={settings.metronomeSound}
                  leftHandSound={settings.leftHandSound}
                  rightHandSound={settings.rightHandSound}
                  soundEnabled={settings.soundEnabled}
                  onCalibrate={onSettingsChange}
                />
                <Pressable
                  testID="practice.liveSettings.calibrationReset"
                  accessibilityRole="button"
                  onPress={() => onSettingsChange({ leftTapOffsetMs: 0, rightTapOffsetMs: 0, goodWindowMs: DEFAULT_GOOD_WINDOW_MS })}
                  style={LivePracticeSettingsStyle12({ colors })}
                >
                  <Text style={LivePracticeSettingsStyle13({ colors })}>RESET CALIBRATION</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </ScrollView>

        <Pressable
          testID="practice.liveSettings.done"
          accessibilityRole="button"
          onPress={onBack}
          style={LivePracticeSettingsStyle14({ compact, colors })}
        >
          <Text style={LivePracticeSettingsStyle15({ colors })}>DONE</Text>
        </Pressable>
      </View>
    </PracticeOverlayBackdrop>
  );
}

function SectionTitle({ title, compact }: { title: string; compact: boolean }) {
  const { colors } = useTheme();
  return (
    <Text style={LivePracticeSettingsStyle16({ colors, compact })}>
      {title}
    </Text>
  );
}

function SoundChoice({
  title,
  testIDPrefix,
  value,
  onChange,
}: {
  title: string;
  testIDPrefix: string;
  value: SoundPreset;
  onChange: (value: SoundPreset) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={LivePracticeSettingsStyle17()}>
      <Text style={LivePracticeSettingsStyle18({ colors })}>{title}</Text>
      <SettingsChoiceRow options={SOUND_OPTIONS} value={value} onChange={onChange} testIDPrefix={testIDPrefix} />
    </View>
  );
}

function FlashChoice({
  title,
  testIDPrefix,
  value,
  onChange,
}: {
  title: string;
  testIDPrefix: string;
  value: FlashSource;
  onChange: (value: FlashSource) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={LivePracticeSettingsStyle19()}>
      <Text style={LivePracticeSettingsStyle20({ colors })}>{title}</Text>
      <SettingsChoiceRow options={FLASH_SOURCE_OPTIONS} value={value} onChange={onChange} testIDPrefix={testIDPrefix} />
    </View>
  );
}
