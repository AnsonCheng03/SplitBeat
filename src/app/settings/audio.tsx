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
      title="Sounds & feedback"
      description="Set the click sounds apart so each part is easy to hear."
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
      </View>

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
      <Text style={{ color: colors.dim, fontSize: 12, lineHeight: 18, marginTop: 18 }}>
        These tones are generated on your device and work offline. Turn off Sound effects to mute all clicks.
      </Text>
    </SettingsPage>
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
