import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { SOUND_OPTIONS } from '@/audio/soundPresets';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsPage } from '@/components/SettingsPage';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';
import type { SoundPreset } from '@/types/rhythm';

export default function AudioSettingsScreen() {
  const { settings, featureFlags, updateSettings } = useRhythmSession();

  return (
    <SettingsPage
      testID="settings.audio.screen"
      backTestID="settings.audio.back"
      section="audio"
      title="Sounds & feedback"
      description="Choose click sounds, accompaniment, and tap feedback."
    >
      <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: colors.line }}>
        {featureFlags.soundEffects ? <SettingsToggleRow
          testID="setup.toggle.sound"
          label="Sound effects"
          value={settings.soundEnabled}
          onChange={(soundEnabled) => updateSettings({ soundEnabled })}
        /> : null}
        {featureFlags.backgroundMusic ? <SettingsToggleRow
          testID="setup.toggle.backgroundMusic"
          label="Beat-synced accompaniment"
          value={settings.backgroundMusicEnabled}
          onChange={(backgroundMusicEnabled) => updateSettings({ backgroundMusicEnabled })}
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
        {featureFlags.shownRhythmPlayback ? <SettingsToggleRow
          testID="setup.toggle.referenceRhythm"
          label="Play the shown rhythm"
          value={settings.referenceRhythmEnabled}
          onChange={(referenceRhythmEnabled) => updateSettings({ referenceRhythmEnabled })}
        /> : null}
      </View>
      {featureFlags.tapFeedback ? <Text style={{ color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 12 }}>
        Correct taps flash teal; off-beat taps flash red. Turn this off for less visual feedback.
      </Text> : null}
      {featureFlags.shownRhythmPlayback ? <Text style={{ color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 12 }}>
            The shown left and right patterns play automatically using each hand’s selected sound. Keep this off to practice from the visual rhythm alone.
      </Text> : null}
      {featureFlags.backgroundMusic || featureFlags.sessionCues ? <Text style={{ color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 12 }}>
        The accompaniment is synthesized on your device and follows your tempo and meter. A short pickup leads into beat one; change cues mark pattern boundaries. Sound effects must be on to hear either option.
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
      {featureFlags.tapFeedback ? <Text style={{ color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 18 }}>
        Tap flashes follow your touch. Beat flashes follow the metronome. Sounds are generated on your device; turn off Sound effects to mute them.
      </Text> : null}
    </SettingsPage>
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
  return (
    <View style={{ marginTop: 23 }}>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.6, marginBottom: 10 }}>
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
  return (
    <View style={{ marginTop: 23 }}>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.6, marginBottom: 10 }}>
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
