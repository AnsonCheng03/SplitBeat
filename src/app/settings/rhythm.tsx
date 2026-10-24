import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { GameCenterChallengeCard } from '@/components/GameCenterChallengeCard';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsPage } from '@/components/SettingsPage';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { MIXTURE_PATTERNS } from '@/rhythm/mixtures';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';
import { BASIC_SUBDIVISIONS } from '@/features/featureFlags';
import { SUBDIVISIONS, TIME_SIGNATURES } from '@/types/rhythm';
import type { ExerciseSettings, Subdivision, TimeSignature } from '@/types/rhythm';

const intervals: { label: string; value: ExerciseSettings['changeIntervalBeats'] }[] = [
  { label: '8 beats', value: 8 },
  { label: '4 beats', value: 4 },
  { label: '2 beats', value: 2 },
  { label: '1 beat', value: 1 },
];

export default function RhythmSettingsScreen() {
  const { t } = useI18n();
  const { settings, featureFlags, updateSettings } = useRhythmSession();
  const visibleSubdivisions = featureFlags.rhythmExtensions
    ? SUBDIVISIONS
    : SUBDIVISIONS.filter((subdivision) => BASIC_SUBDIVISIONS.includes(subdivision as (typeof BASIC_SUBDIVISIONS)[number]));
  const visibleTimeSignatures = featureFlags.rhythmExtensions
    ? TIME_SIGNATURES
    : TIME_SIGNATURES.filter((signature) => ['2/4', '3/4', '4/4', '5/4', '7/4', '2/2', '3/8'].includes(signature));

  const toggleSubdivision = (subdivision: Subdivision) => {
    const enabled = settings.enabledSubdivisions.includes(subdivision);
    if (enabled && settings.enabledSubdivisions.length <= 2) return;
    const next = enabled
      ? settings.enabledSubdivisions.filter((item) => item !== subdivision)
      : [...settings.enabledSubdivisions, subdivision];
    updateSettings({ enabledSubdivisions: next });
  };

  const toggleMixture = (mixtureId: (typeof MIXTURE_PATTERNS)[number]['id']) => {
    const enabled = settings.enabledMixtures.includes(mixtureId);
    updateSettings({
      enabledMixtures: enabled
        ? settings.enabledMixtures.filter((item) => item !== mixtureId)
        : [...settings.enabledMixtures, mixtureId],
    });
  };

  return (
    <SettingsPage
      testID="settings.rhythm.screen"
      backTestID="settings.rhythm.back"
      section="rhythm"
      title="Rhythm & meter"
      description="Choose the pulse and rhythms for your session."
    >
      <Section title="TIME SIGNATURE">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {visibleTimeSignatures.map((timeSignature: TimeSignature) => {
            const selected = settings.timeSignature === timeSignature;
            return (
              <Pressable
                key={timeSignature}
                testID={'setup.timeSignature.' + timeSignature.replace('/', '-')}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={t('{signature} time', { signature: timeSignature })}
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

      {featureFlags.rhythmExtensions ? <Section title="FEEL">
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
      </Section> : null}

      <Section title="ALLOWED SUBDIVISIONS">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {visibleSubdivisions.map((subdivision) => {
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

      {featureFlags.mixtures ? <Section title="MIXTURE">
        <Text style={helperText}>
          Choose mixed note groups to use for either hand. The shorter half-beat patterns repeat to fill a 4/4 beat.
        </Text>
        <View style={{ gap: 8, marginTop: 10 }}>
          {MIXTURE_PATTERNS.map((mixture) => {
            const selected = settings.enabledMixtures.includes(mixture.id);
            return (
              <Pressable
                key={mixture.id}
                testID={`setup.mixture.${mixture.id}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${t(mixture.label)}. ${t(mixture.detail)}`}
                onPress={() => toggleMixture(mixture.id)}
                style={{
                  minHeight: 56,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  justifyContent: 'center',
                  backgroundColor: selected ? colors.leftSurface : colors.surface,
                  borderWidth: 1,
                  borderColor: selected ? colors.left : colors.line,
                }}
              >
                <Text style={{ color: selected ? colors.left : colors.text, fontSize: 13, fontWeight: '800' }}>
                  {mixture.label}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>
                  {mixture.detail}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section> : null}

      {featureFlags.restsAndGrace ? <Section title="EXTRA">
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
        <SettingsToggleRow
          testID="setup.toggle.handRests"
          label="Independent hand rests"
          value={settings.handRestsEnabled}
          onChange={(handRestsEnabled) => updateSettings({ handRestsEnabled })}
        />
        <Text style={helperText}>
          Occasionally one hand rests while the other keeps playing. Available in generated two-hand practice.
        </Text>
      </Section> : null}

      {featureFlags.challengeMode ? <Section title="CHALLENGE">
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
          WHEN A MISTAKE HAPPENS
        </Text>
        <SettingsChoiceRow
          testIDPrefix="setup.challenge.action"
          options={[
            { label: 'Off', value: 'off' as const },
            { label: 'Pause', value: 'pause' as const },
            { label: 'End session', value: 'stop' as const },
          ]}
          value={settings.challengeAction}
          onChange={(challengeAction) => updateSettings({ challengeAction })}
        />
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 16, marginBottom: 8 }}>
          TRIGGER AFTER
        </Text>
        <SettingsChoiceRow
          testIDPrefix="setup.challenge.misses"
          options={[
            { label: 'Any error', value: 1 as const },
            { label: '2 in a row', value: 2 as const },
            { label: '3 in a row', value: 3 as const },
            { label: '5 in a row', value: 5 as const },
          ]}
          value={settings.challengeMissStreak}
          onChange={(challengeMissStreak) => updateSettings({ challengeMissStreak })}
        />
        <Text style={helperText}>
          Any error reacts to an off-beat tap or missed note. Consecutive misses count separately for each hand; a correct note resets that hand’s streak. A pause can be resumed from the practice screen.
        </Text>
        {featureFlags.gameCenter ? <GameCenterChallengeCard testID="setup.challenge.gameCenter" /> : null}
      </Section> : null}
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
