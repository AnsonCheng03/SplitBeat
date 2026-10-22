import Slider from '@react-native-community/slider';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOUND_OPTIONS } from '@/audio/soundPresets';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';
import { SUBDIVISIONS, TIME_SIGNATURES } from '@/types/rhythm';
import type { DurationOption, ExerciseSettings, Subdivision, TimeSignature } from '@/types/rhythm';

const durations: { label: string; value: DurationOption }[] = [
  { label: '30 sec', value: 30 },
  { label: '60 sec', value: 60 },
  { label: '2 min', value: 120 },
  { label: 'Endless', value: 'endless' },
];
const intervals: { label: string; value: ExerciseSettings['changeIntervalBeats'] }[] = [
  { label: '8 beats', value: 8 },
  { label: '4 beats', value: 4 },
  { label: '2 beats', value: 2 },
  { label: '1 beat', value: 1 },
];

function ChoiceRow<T extends string | number>({
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  testIDPrefix?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            testID={testIDPrefix ? `${testIDPrefix}.${String(option.value)}` : undefined}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minHeight: 43,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: selected ? colors.text : colors.surface,
              borderWidth: 1,
              borderColor: selected ? colors.text : colors.line,
            }}
          >
            <Text style={{ color: selected ? colors.background : colors.muted, fontSize: 12, fontWeight: '700' }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SetupScreen() {
  const { settings, updateSettings, startExercise } = useRhythmSession();
  const [starting, setStarting] = useState(false);
  const router = useRouter();

  const toggleSubdivision = (subdivision: Subdivision) => {
    const enabled = settings.enabledSubdivisions.includes(subdivision);
    if (enabled && settings.enabledSubdivisions.length <= 2) return;
    const next = enabled
      ? settings.enabledSubdivisions.filter((item) => item !== subdivision)
      : [...settings.enabledSubdivisions, subdivision];
    updateSettings({ enabledSubdivisions: next });
  };

  const start = async () => {
    if (starting) return;
    setStarting(true);
    try {
      await startExercise();
      router.replace('/practice');
    } catch {
      Alert.alert('Audio could not start', 'Check your device audio settings and try again.');
      setStarting(false);
    }
  };

  const sectionLabel = { color: colors.text, fontSize: 14, fontWeight: '800' as const, marginTop: 22, marginBottom: 10 };
  const buttonBase = {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <SafeAreaView testID="setup.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingTop: 10,
          paddingBottom: 30,
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <Link href="/" asChild>
            <Pressable hitSlop={12}>
              <Text style={{ color: colors.muted, fontSize: 14, fontWeight: '700' }}>‹  BACK</Text>
            </Pressable>
          </Link>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 }}>SESSION SETUP</Text>
        </View>

        <Text style={{ color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.8 }}>Set your pace.</Text>
        <Text style={{ color: colors.muted, fontSize: 15, marginTop: 7, marginBottom: 23 }}>
          Your pulse stays steady while the patterns change.
        </Text>

        <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12, letterSpacing: 1.2 }}>TEMPO</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ color: colors.text, fontSize: 37, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                {settings.bpm}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '700' }}>BPM</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <Pressable
              accessibilityLabel="Decrease tempo"
              onPress={() => updateSettings({ bpm: Math.max(40, settings.bpm - 1) })}
              style={buttonBase}
            >
              <Text style={{ color: colors.text, fontSize: 24 }}>−</Text>
            </Pressable>
            <Slider
              style={{ flex: 1, height: 40 }}
              minimumValue={40}
              maximumValue={200}
              step={1}
              value={settings.bpm}
              onValueChange={(bpm) => updateSettings({ bpm })}
              minimumTrackTintColor={colors.left}
              maximumTrackTintColor={colors.line}
              thumbTintColor={colors.text}
            />
            <Pressable
              accessibilityLabel="Increase tempo"
              onPress={() => updateSettings({ bpm: Math.min(200, settings.bpm + 1) })}
              style={buttonBase}
            >
              <Text style={{ color: colors.text, fontSize: 24 }}>+</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 50 }}>
            <Text style={{ color: colors.dim, fontSize: 11 }}>40</Text>
            <Text style={{ color: colors.dim, fontSize: 11 }}>200</Text>
          </View>
        </View>

        <Text style={sectionLabel}>TIME SIGNATURE</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TIME_SIGNATURES.map((timeSignature: TimeSignature) => {
            const selected = settings.timeSignature === timeSignature;
            return (
              <Pressable
                key={timeSignature}
                testID={'setup.timeSignature.' + timeSignature.replace('/', '-')}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={timeSignature + ' time'}
                onPress={() => updateSettings({ timeSignature })}
                style={{
                  width: '18.5%',
                  minHeight: 42,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: selected ? colors.text : colors.surface,
                  borderWidth: 1,
                  borderColor: selected ? colors.text : colors.line,
                }}
              >
                <Text style={{ color: selected ? colors.background : colors.muted, fontSize: 13, fontWeight: '800' }}>
                  {timeSignature}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ color: colors.dim, fontSize: 12, marginTop: 8 }}>
          BPM follows the written beat. In 6/8, 9/8, and 12/8 it counts dotted-quarter pulses.
        </Text>

        <Text style={sectionLabel}>SESSION LENGTH</Text>
        <ChoiceRow
          options={durations}
          value={settings.durationSeconds}
          onChange={(durationSeconds) => updateSettings({ durationSeconds })}
        />
        <Text style={sectionLabel}>CHANGE THE PATTERN</Text>
        <ChoiceRow
          options={intervals}
          value={settings.changeIntervalBeats}
          onChange={(changeIntervalBeats) => updateSettings({ changeIntervalBeats })}
        />

        <Text style={sectionLabel}>RHYTHMIC FEEL</Text>
        <ChoiceRow
          testIDPrefix="setup.feel"
          options={[
            { label: 'Straight', value: 'straight' as const },
            { label: 'Swing', value: 'swing' as const },
          ]}
          value={settings.feel}
          onChange={(feel) => updateSettings({ feel })}
        />
        <Text style={{ color: colors.dim, fontSize: 12, marginTop: 8 }}>
          Swing stretches binary offbeats to a 2:1 feel. Triplets keep their even spacing.
        </Text>

        <Text style={sectionLabel}>ALLOWED SUBDIVISIONS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
          {SUBDIVISIONS.map((subdivision) => {
            const selected = settings.enabledSubdivisions.includes(subdivision);
            return (
              <Pressable
                key={subdivision}
                testID={'setup.subdivision.' + subdivision}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled: selected && settings.enabledSubdivisions.length <= 2 }}
                onPress={() => toggleSubdivision(subdivision)}
                style={{
                  paddingHorizontal: 14,
                  minHeight: 42,
                  borderRadius: 13,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? colors.leftSurface : colors.surface,
                  borderWidth: 1,
                  borderColor: selected ? colors.left : colors.line,
                  opacity: selected && settings.enabledSubdivisions.length <= 2 ? 0.72 : 1,
                }}
              >
                <Text style={{ color: selected ? colors.left : colors.muted, fontSize: 13, fontWeight: '700' }}>
                  {SUBDIVISION_LABELS[subdivision]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ color: colors.dim, fontSize: 12, marginTop: 8 }}>
          Keep at least two enabled. Both hands may share a pattern. 32nd and 64th notes are fastest at lower tempos.
        </Text>

        <Text style={sectionLabel}>METRONOME SOUND</Text>
        <ChoiceRow
          testIDPrefix="setup.sound.metronome"
          options={SOUND_OPTIONS}
          value={settings.metronomeSound}
          onChange={(metronomeSound) => updateSettings({ metronomeSound })}
        />
        <Text style={sectionLabel}>LEFT HAND TAP SOUND</Text>
        <ChoiceRow
          testIDPrefix="setup.sound.left"
          options={SOUND_OPTIONS}
          value={settings.leftHandSound}
          onChange={(leftHandSound) => updateSettings({ leftHandSound })}
        />
        <Text style={sectionLabel}>RIGHT HAND TAP SOUND</Text>
        <ChoiceRow
          testIDPrefix="setup.sound.right"
          options={SOUND_OPTIONS}
          value={settings.rightHandSound}
          onChange={(rightHandSound) => updateSettings({ rightHandSound })}
        />
        <Text style={{ color: colors.dim, fontSize: 12, marginTop: 8 }}>
          Choose distinct offline click tones for the pulse and each hand. Sound effects mutes all three.
        </Text>

        <View style={{ marginTop: 21, borderTopWidth: 1, borderTopColor: colors.line }}>
          {[
            { label: 'Grace note pickups', value: settings.graceNotesEnabled, patch: { graceNotesEnabled: !settings.graceNotesEnabled } },
            { label: 'Sound effects', value: settings.soundEnabled, patch: { soundEnabled: !settings.soundEnabled } },
            { label: 'Tap haptics', value: settings.hapticsEnabled, patch: { hapticsEnabled: !settings.hapticsEnabled } },
          ].map((toggle) => (
            <Pressable
              key={toggle.label}
              testID={toggle.label === 'Grace note pickups' ? 'setup.toggle.graceNotes' : undefined}
              accessibilityRole="switch"
              accessibilityState={{ checked: toggle.value }}
              onPress={() => updateSettings(toggle.patch)}
              style={{ minHeight: 52, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line }}
            >
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{toggle.label}</Text>
              <View
                style={{
                  width: 46,
                  height: 27,
                  borderRadius: 20,
                  backgroundColor: toggle.value ? colors.left : colors.surfaceRaised,
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                  alignItems: toggle.value ? 'flex-end' : 'flex-start',
                }}
              >
                <View style={{ width: 21, height: 21, borderRadius: 99, backgroundColor: colors.text }} />
              </View>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: colors.dim, fontSize: 12, marginTop: 8 }}>
          When enabled, one extra pickup is expected by each hand just before every pattern change.
        </Text>

        <Pressable
          testID="setup.start"
          onPress={start}
          disabled={starting}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#A8EADB' : colors.left,
            minHeight: 60,
            borderRadius: 17,
            marginTop: 22,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: starting ? 0.7 : 1,
          })}
        >
          <Text style={{ color: colors.background, fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>
            {starting ? 'PREPARING…' : 'START EXERCISE'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
