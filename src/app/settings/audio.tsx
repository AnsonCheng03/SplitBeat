import Slider from '@react-native-community/slider';
import { View } from 'react-native';
import { useIsFocused } from 'expo-router';
import { useI18n } from '@/i18n/I18nProvider';
import { Text } from '@/i18n/LocalizedText';
import { SOUND_OPTIONS } from '@/audio/soundPresets';
import { AutoPlayRhythmSetting } from '@/components/AutoPlayRhythmSetting';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsPage } from '@/components/SettingsPage';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { SoundPreset } from '@/types/rhythm';
import {
  audioStyle1,
  audioStyle2,
  audioStyle4,
  audioStyle5,
  audioStyle6,
  audioStyle7,
  audioStyle8,
  audioStyle9,
  audioStyle10,
  audioStyle11,
  audioStyle12,
} from '@/styles/settings';

export default function AudioSettingsScreen() {
  const { colors } = useTheme();
  const { settings, featureFlags, updateSettings } = useRhythmSession();
  const isFocused = useIsFocused();

  return (
    <SettingsPage
      testID="settings.audio.screen"
      backTestID="settings.audio.back"
      section="audio"
      title="Sounds & feedback"
      description="Choose click sounds, background music, and tap feedback."
    >
      <View style={audioStyle1({ colors })}>
        {featureFlags.soundEffects ? <SettingsToggleRow
          testID="setup.toggle.sound"
          label="Sound effects"
          value={settings.soundEnabled}
          onChange={(soundEnabled) => updateSettings({ soundEnabled })}
        /> : null}
        {featureFlags.backgroundMusic ? <SettingsToggleRow
          testID="setup.toggle.backgroundMusic"
          label="Background music"
          description="A gentle melody with repeating chords follows your tempo and meter."
          value={settings.backgroundMusicEnabled}
          onChange={(backgroundMusicEnabled) => updateSettings({ backgroundMusicEnabled })}
        /> : null}
        {featureFlags.backgroundMusic ? <BackgroundMusicVolumeSetting
          value={settings.backgroundMusicVolume ?? 45}
          onChange={(backgroundMusicVolume) => updateSettings({ backgroundMusicVolume })}
        /> : null}
        {featureFlags.sessionCues ? <SettingsToggleRow
          testID="setup.toggle.sessionCues"
          label="Start and change cues"
          value={settings.sessionCuesEnabled}
          onChange={(sessionCuesEnabled) => updateSettings({ sessionCuesEnabled })}
        /> : null}
        {featureFlags.tapHaptics ? <SettingsToggleRow
          testID="setup.toggle.haptics"
          label="Tap haptics"
          value={settings.hapticsEnabled}
          onChange={(hapticsEnabled) => updateSettings({ hapticsEnabled })}
        /> : null}
        {featureFlags.tapFeedback ? <SettingsToggleRow
          testID="setup.toggle.tapResultFlash"
          label="Show correct / missed tap colors"
          value={settings.tapResultFlashEnabled}
          onChange={(tapResultFlashEnabled) => updateSettings({ tapResultFlashEnabled })}
        /> : null}
        {featureFlags.shownRhythmPlayback ? <AutoPlayRhythmSetting
          active={isFocused}
          testID="setup.toggle.referenceRhythm"
          value={settings.referenceRhythmEnabled}
          onChange={(referenceRhythmEnabled) => updateSettings({ referenceRhythmEnabled })}
        /> : null}
      </View>
      {featureFlags.tapFeedback ? <Text style={audioStyle2({ colors })}>
        Correct taps flash teal; off-beat taps flash red. Turn this off for less visual feedback.
      </Text> : null}
      {featureFlags.backgroundMusic ? <Text style={audioStyle4({ colors })}>
        Background music uses a repeating melody over a four-bar chord progression. It follows your tempo and meter, and its volume is independent of Sound effects.
      </Text> : null}
      {featureFlags.sessionCues ? <Text style={audioStyle4({ colors })}>
        Start and change cues are brief sounds that follow the Sound effects switch.
      </Text> : null}

      {featureFlags.soundEffects ? <SoundChoice
        title="METRONOME"
        testIDPrefix="setup.sound.metronome"
        value={settings.metronomeSound}
        onChange={(metronomeSound) => updateSettings({ metronomeSound })}
      /> : null}
      {featureFlags.soundEffects ? <SoundChoice
        title="LEFT HAND"
        testIDPrefix="setup.sound.left"
        value={settings.leftHandSound}
        onChange={(leftHandSound) => updateSettings({ leftHandSound })}
      /> : null}
      {featureFlags.soundEffects ? <SoundChoice
        title="RIGHT HAND"
        testIDPrefix="setup.sound.right"
        value={settings.rightHandSound}
        onChange={(rightHandSound) => updateSettings({ rightHandSound })}
      /> : null}
      {featureFlags.tapFeedback ? <FlashSourceChoice
        hand="LEFT"
        testIDPrefix="setup.flash.left"
        value={settings.leftFlashSource}
        onChange={(leftFlashSource) => updateSettings({ leftFlashSource })}
      /> : null}
      {featureFlags.tapFeedback ? <FlashSourceChoice
        hand="RIGHT"
        testIDPrefix="setup.flash.right"
        value={settings.rightFlashSource}
        onChange={(rightFlashSource) => updateSettings({ rightFlashSource })}
      /> : null}
      {featureFlags.tapFeedback ? <Text style={audioStyle5({ colors })}>
        Tap flashes follow your touch. Beat flashes follow the metronome. Sounds are generated on your device; turn off Sound effects to mute them.
      </Text> : null}
    </SettingsPage>
  );
}

function BackgroundMusicVolumeSetting({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <View style={audioStyle10()}>
      <View style={audioStyle11()}>
        <Text style={audioStyle12({ colors })}>BACKGROUND MUSIC VOLUME</Text>
        <Text style={audioStyle12({ colors })}>{Math.round(value)}%</Text>
      </View>
      <Slider
        testID="setup.backgroundMusic.volume"
        accessibilityLabel={t('Background music volume')}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.left}
        maximumTrackTintColor={colors.line}
        thumbTintColor={colors.text}
      />
    </View>
  );
}

const FLASH_SOURCE_OPTIONS = [
  { label: 'On tap', value: 'tap' },
  { label: 'On beat', value: 'beat' },
] as const;

function FlashSourceChoice({
  hand,
  testIDPrefix,
  value,
  onChange,
}: {
  hand: 'LEFT' | 'RIGHT';
  testIDPrefix: string;
  value: 'tap' | 'beat';
  onChange: (value: 'tap' | 'beat') => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={audioStyle6()}>
      <Text style={audioStyle7({ colors })}>
        {hand} HAND FLASH
      </Text>
      <SettingsChoiceRow
        options={FLASH_SOURCE_OPTIONS}
        value={value}
        onChange={onChange}
        testIDPrefix={testIDPrefix}
      />
    </View>
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
    <View style={audioStyle8()}>
      <Text style={audioStyle9({ colors })}>
        {title}
      </Text>
      <SettingsChoiceRow
        options={SOUND_OPTIONS}
        value={value}
        onChange={onChange}
        testIDPrefix={testIDPrefix}
      />
    </View>
  );
}
