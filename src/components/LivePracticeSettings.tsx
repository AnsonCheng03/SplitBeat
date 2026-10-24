import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SOUND_OPTIONS } from '@/audio/soundPresets';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { TimingCalibration } from '@/components/TimingCalibration';
import { DEFAULT_GOOD_WINDOW_MS } from '@/rhythm/timingCalibration';
import type { FeatureFlags } from '@/features/featureFlags';
import { colors } from '@/theme';
import type { ExerciseSettings, FlashSource, SoundPreset } from '@/types/rhythm';

const FLASH_SOURCE_OPTIONS: readonly { label: string; value: FlashSource }[] = [
  { label: 'On tap', value: 'tap' },
  { label: 'On beat', value: 'beat' },
];

export function LivePracticeSettings({
  settings,
  featureFlags,
  onSettingsChange,
  onBack,
  compact,
}: {
  settings: ExerciseSettings;
  featureFlags: FeatureFlags;
  onSettingsChange: (patch: Partial<ExerciseSettings>) => void;
  onBack: () => void;
  compact: boolean;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <View
      testID="practice.liveSettings"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(7, 10, 14, 0.9)',
        paddingTop: Math.max(10, insets.top + 8),
        paddingBottom: Math.max(10, insets.bottom + 8),
        paddingHorizontal: Math.max(14, insets.left + 14, insets.right + 14),
      }}
    >
      <View style={{ width: '100%', maxWidth: 760, maxHeight: '100%', flex: 1, padding: compact ? 12 : 18, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
        <View style={{ minHeight: compact ? 38 : 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? 4 : 10 }}>
          <Pressable
            testID="practice.liveSettings.back"
            accessibilityRole="button"
            accessibilityLabel={t('Back to pause menu')}
            onPress={onBack}
            style={{ minHeight: 40, justifyContent: 'center', paddingRight: 14 }}
          >
            <Text style={{ color: colors.muted, fontSize: compact ? 10 : 11, fontWeight: '900', letterSpacing: 0.7 }}>‹  PAUSED</Text>
          </Pressable>
          <Text style={{ color: colors.text, fontSize: compact ? 15 : 19, fontWeight: '900', letterSpacing: 0.8 }}>LIVE SETTINGS</Text>
          <View style={{ width: 62 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <SoundChoice
                    title="LEFT-HAND CLICK"
                    testIDPrefix="practice.liveSettings.sound.left"
                    value={settings.leftHandSound}
                    onChange={(leftHandSound) => onSettingsChange({ leftHandSound })}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 220 }}>
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
                  label="Beat-synced accompaniment"
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
                <SettingsToggleRow
                  testID="practice.liveSettings.referenceRhythm"
                  label="Play the shown rhythm"
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
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7 }}>
                Calibration runs while this session is paused. Its offsets and timing range will apply when you continue.
              </Text>
              <View style={{ marginTop: 12, padding: compact ? 10 : 14, borderRadius: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line }}>
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
                  style={{ minHeight: 42, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 12, marginTop: 8, borderRadius: 11, borderWidth: 1, borderColor: colors.line }}
                >
                  <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }}>RESET CALIBRATION</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </ScrollView>

        <Pressable
          testID="practice.liveSettings.done"
          accessibilityRole="button"
          onPress={onBack}
          style={{ minHeight: compact ? 42 : 48, alignItems: 'center', justifyContent: 'center', marginTop: 8, borderRadius: 13, backgroundColor: colors.accent }}
        >
          <Text style={{ color: colors.background, fontSize: 12, fontWeight: '900', letterSpacing: 1 }}>DONE</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SectionTitle({ title, compact }: { title: string; compact: boolean }) {
  return (
    <Text style={{ color: colors.dim, fontSize: compact ? 9 : 10, fontWeight: '900', letterSpacing: 1.2, marginTop: compact ? 14 : 18, marginBottom: 2 }}>
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
  return (
    <View style={{ marginTop: 13 }}>
      <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginBottom: 7 }}>{title}</Text>
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
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginBottom: 7 }}>{title}</Text>
      <SettingsChoiceRow options={FLASH_SOURCE_OPTIONS} value={value} onChange={onChange} testIDPrefix={testIDPrefix} />
    </View>
  );
}
