import { Text, View } from 'react-native';
import { SOUND_OPTIONS } from '@/audio/soundPresets';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsPage } from '@/components/SettingsPage';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';
import type { SoundPreset } from '@/types/rhythm';

export default function AudioSettingsScreen() {
  const { settings, updateSettings } = useRhythmSession();

  return (
    <SettingsPage
      testID="settings.audio.screen"
      backTestID="settings.audio.back"
      section="audio"
      title="Sounds & feedback"
      description="Choose each hand's sound and when its side flashes."
    >
      <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: colors.line }}>
        <SettingsToggleRow
          testID="setup.toggle.sound"
          label="Sound effects"
          value={settings.soundEnabled}
          onChange={(soundEnabled) => updateSettings({ soundEnabled })}
        />
        <SettingsToggleRow
          testID="setup.toggle.haptics"
          label="Tap haptics"
          value={settings.hapticsEnabled}
          onChange={(hapticsEnabled) => updateSettings({ hapticsEnabled })}
        />
        <SettingsToggleRow
          testID="setup.toggle.referenceRhythm"
          label="Play the shown rhythm"
          value={settings.referenceRhythmEnabled}
          onChange={(referenceRhythmEnabled) => updateSettings({ referenceRhythmEnabled })}
        />
      </View>
      <Text style={{ color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 12 }}>
        The shown left and right patterns play automatically using each hand&apos;s selected sound. Keep this off to practice from the visual rhythm alone.
      </Text>

      <SoundChoice
        title="METRONOME"
        testIDPrefix="setup.sound.metronome"
        value={settings.metronomeSound}
        onChange={(metronomeSound) => updateSettings({ metronomeSound })}
      />
      <SoundChoice
        title="LEFT HAND"
        testIDPrefix="setup.sound.left"
        value={settings.leftHandSound}
        onChange={(leftHandSound) => updateSettings({ leftHandSound })}
      />
      <SoundChoice
        title="RIGHT HAND"
        testIDPrefix="setup.sound.right"
        value={settings.rightHandSound}
        onChange={(rightHandSound) => updateSettings({ rightHandSound })}
      />
      <FlashSourceChoice
        hand="LEFT"
        testIDPrefix="setup.flash.left"
        value={settings.leftFlashSource}
        onChange={(leftFlashSource) => updateSettings({ leftFlashSource })}
      />
      <FlashSourceChoice
        hand="RIGHT"
        testIDPrefix="setup.flash.right"
        value={settings.rightFlashSource}
        onChange={(rightFlashSource) => updateSettings({ rightFlashSource })}
      />
      <Text style={{ color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 18 }}>
        Tap flashes follow your touch. Beat flashes follow the metronome. Misses always flash red. Sounds are generated on your device; turn off Sound effects to mute them.
      </Text>
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
