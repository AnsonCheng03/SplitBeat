import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsPage } from '@/components/SettingsPage';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';
import { SUBDIVISIONS, TIME_SIGNATURES } from '@/types/rhythm';
import type { ExerciseSettings, Subdivision, TimeSignature } from '@/types/rhythm';

const intervals: { label: string; value: ExerciseSettings['changeIntervalBeats'] }[] = [
  { label: '8 beats', value: 8 },
  { label: '4 beats', value: 4 },
  { label: '2 beats', value: 2 },
  { label: '1 beat', value: 1 },
];

export default function RhythmSettingsScreen() {
  const { settings, updateSettings } = useRhythmSession();

  const toggleSubdivision = (subdivision: Subdivision) => {
    const enabled = settings.enabledSubdivisions.includes(subdivision);
    if (enabled && settings.enabledSubdivisions.length <= 2) return;
    const next = enabled
      ? settings.enabledSubdivisions.filter((item) => item !== subdivision)
      : [...settings.enabledSubdivisions, subdivision];
    updateSettings({ enabledSubdivisions: next });
  };

  return (
    <SettingsPage
      testID="settings.rhythm.screen"
      backTestID="settings.rhythm.back"
      title="Rhythm & meter"
      description="Choose the pulse and the patterns Split Beat can use."
    >
      <Section title="TIME SIGNATURE">
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
                  flexGrow: 1,
                  flexBasis: '17%',
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
        <Text style={helperText}>
          BPM follows the written beat. In 6/8, 9/8, and 12/8 it counts dotted-quarter pulses.
        </Text>
      </Section>

      <Section title="CHANGE PATTERN">
        <SettingsChoiceRow
          options={intervals}
          value={settings.changeIntervalBeats}
          onChange={(changeIntervalBeats) => updateSettings({ changeIntervalBeats })}
          testIDPrefix="setup.interval"
        />
      </Section>

      <Section title="FEEL">
        <SettingsChoiceRow
          testIDPrefix="setup.feel"
          options={[
            { label: 'Straight', value: 'straight' as const },
            { label: 'Swing', value: 'swing' as const },
          ]}
          value={settings.feel}
          onChange={(feel) => updateSettings({ feel })}
        />
        <Text style={helperText}>
          Swing stretches binary offbeats to a 2:1 feel. Tuplets keep their even spacing.
        </Text>
      </Section>

      <Section title="ALLOWED SUBDIVISIONS">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
                  paddingHorizontal: 13,
                  minHeight: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? colors.leftSurface : colors.surface,
                  borderWidth: 1,
                  borderColor: selected ? colors.left : colors.line,
                  opacity: selected && settings.enabledSubdivisions.length <= 2 ? 0.72 : 1,
                }}
              >
                <Text style={{ color: selected ? colors.left : colors.muted, fontSize: 12, fontWeight: '700' }}>
                  {SUBDIVISION_LABELS[subdivision]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={helperText}>
          Tuplets divide one metronome beat evenly. The beat length follows your time signature. Keep at least two patterns enabled.
        </Text>
      </Section>

      <Section title="EXTRA">
        <SettingsToggleRow
          testID="setup.toggle.graceNotes"
          label="Grace note pickups"
          value={settings.graceNotesEnabled}
          onChange={(graceNotesEnabled) => updateSettings({ graceNotesEnabled })}
        />
        <Text style={helperText}>
          Adds one pickup note from each hand just before a pattern change.
        </Text>
        <SettingsToggleRow
          testID="setup.toggle.restBetweenChanges"
          label="Rest before each change"
          value={settings.restBetweenChanges}
          onChange={(restBetweenChanges) => updateSettings({ restBetweenChanges })}
        />
        <Text style={helperText}>
          Both hands pause for the last beat before a new pattern. The metronome keeps going; this pause replaces grace pickups.
        </Text>
      </Section>
    </SettingsPage>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.6, marginBottom: 10 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const helperText = { color: colors.dim, fontSize: 12, lineHeight: 17, marginTop: 8 };
