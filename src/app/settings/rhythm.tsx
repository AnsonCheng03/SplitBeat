import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { GameCenterChallengeCard } from '@/components/GameCenterChallengeCard';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsPage } from '@/components/SettingsPage';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { SUBDIVISION_LABELS, timeSignatureMetrics } from '@/rhythm/subdivisions';
import { mixtureNoteOptionsForBar } from '@/rhythm/mixtures';
import { alignedPatternChangeIntervalBeats } from '@/rhythm/patternChange';
import { barDurationQuarterNotes } from '@/rhythm/targetedPractice';
import { useRhythmSession } from '@/store/sessionStore';
import { useTheme } from '@/theme/ThemeProvider';
import { BASIC_SUBDIVISIONS } from '@/features/featureFlags';
import { SUBDIVISIONS, TIME_SIGNATURES } from '@/types/rhythm';
import type { ExerciseSettings, MixtureNoteValue, Subdivision, TimeSignature } from '@/types/rhythm';

const intervals: { label: string; value: ExerciseSettings['changeIntervalBeats'] }[] = [
  { label: '8 beats', value: 8 },
  { label: '4 beats', value: 4 },
  { label: '2 beats', value: 2 },
  { label: '1 beat', value: 1 },
];

export default function RhythmSettingsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { settings, featureFlags, updateSettings } = useRhythmSession();
  const helperText = { color: colors.dim, fontSize: 12, lineHeight: 17, marginTop: 8 };
  const beatsPerBar = timeSignatureMetrics(settings.bpm, settings.timeSignature).beatsPerBar;
  const effectiveChangeIntervalBeats = alignedPatternChangeIntervalBeats(
    settings.changeIntervalBeats,
    beatsPerBar,
  );
  const visibleSubdivisions = featureFlags.rhythmExtensions
    ? SUBDIVISIONS
    : SUBDIVISIONS.filter((subdivision) => BASIC_SUBDIVISIONS.includes(subdivision as (typeof BASIC_SUBDIVISIONS)[number]));
  const selectableSubdivisions = visibleSubdivisions.filter((subdivision) =>
    featureFlags.sixtyFourthNotes || subdivision !== 'sixtyFourth',
  );
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

  const toggleMixtureNoteValue = (noteValue: MixtureNoteValue) => {
    const noteValues = settings.mixtureNoteValues ?? [];
    const enabled = noteValues.includes(noteValue);
    updateSettings({
      mixtureNoteValues: enabled
        ? noteValues.filter((item) => item !== noteValue)
        : [...noteValues, noteValue],
    });
  };

  const updateTimeSignature = (timeSignature: TimeSignature) => {
    const barLength = barDurationQuarterNotes(timeSignature);
    const mixtureNoteValues = (settings.mixtureNoteValues ?? []).filter((value) =>
      mixtureNoteOptionsForBar(barLength, featureFlags.sixtyFourthNotes).some((option) => option.value === value),
    );
    updateSettings({ timeSignature, mixtureNoteValues });
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {visibleTimeSignatures.map((timeSignature: TimeSignature) => {
            const selected = settings.timeSignature === timeSignature;
            return (
              <Pressable
                key={timeSignature}
                testID={'setup.timeSignature.' + timeSignature.replace('/', '-')}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={t('{signature} time', { signature: timeSignature })}
                onPress={() => updateTimeSignature(timeSignature)}
                style={{
                  flexGrow: 1,
                  flexBasis: '18%',
                  minWidth: 76,
                  minHeight: 48,
                  paddingHorizontal: 10,
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
          BPM follows the main pulse. In 6/8, 9/8, and 12/8 it counts dotted-quarter pulses; the display counts each eighth-note beat.
        </Text>
      </Section>

      <Section title="CHANGE PATTERN">
        <SettingsChoiceRow
          options={intervals}
          value={settings.changeIntervalBeats}
          onChange={(changeIntervalBeats) => updateSettings({ changeIntervalBeats })}
          testIDPrefix="setup.interval"
        />
        {effectiveChangeIntervalBeats !== settings.changeIntervalBeats ? (
          <Text style={helperText}>
            {t('In {signature}, {requested} beats is aligned to the next bar line: every {effective} beats ({bars} bars).', {
              signature: settings.timeSignature,
              requested: settings.changeIntervalBeats,
              effective: effectiveChangeIntervalBeats,
              bars: effectiveChangeIntervalBeats / beatsPerBar,
            })}
          </Text>
        ) : null}
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {selectableSubdivisions.map((subdivision) => {
            const selected = settings.enabledSubdivisions.includes(subdivision);
            return (
              <Pressable
                key={subdivision}
                testID={'setup.subdivision.' + subdivision}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled: selected && settings.enabledSubdivisions.length <= 2 }}
                onPress={() => toggleSubdivision(subdivision)}
                style={{
                  paddingHorizontal: 15,
                  minHeight: 48,
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
          Choose note values that Split Beat may combine for either hand. It generates a fresh pattern for each change and keeps the pattern within one bar.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
          {mixtureNoteOptionsForBar(barDurationQuarterNotes(settings.timeSignature), featureFlags.sixtyFourthNotes).map((option) => {
            const selected = (settings.mixtureNoteValues ?? []).includes(option.value);
            return (
              <Pressable
                key={option.value}
                testID={`setup.mixture.note.${option.value}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={t(option.label)}
                onPress={() => toggleMixtureNoteValue(option.value)}
                style={{
                  minHeight: 48,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  justifyContent: 'center',
                  backgroundColor: selected ? colors.leftSurface : colors.surface,
                  borderWidth: 1,
                  borderColor: selected ? colors.left : colors.line,
                }}
              >
                <Text style={{ color: selected ? colors.left : colors.text, fontSize: 13, fontWeight: '800' }}>
                  {t(option.label)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <SettingsToggleRow
          testID="setup.mixture.includeRests"
          label="Include rests"
          description="Rests may be mixed with the selected note values."
          value={settings.mixtureRestsEnabled === true}
          onChange={(mixtureRestsEnabled) => updateSettings({ mixtureRestsEnabled })}
        />
        <Text style={helperText}>
          Select two or more note values, or one value with rests enabled. Longer values than the current bar are not offered.
        </Text>
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
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 12 }}>
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
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 12 }}>
          COUNT ERRORS BY
        </Text>
        <SettingsChoiceRow
          testIDPrefix="setup.challenge.triggerMode"
          options={[
            { label: t('Notes'), value: 'notes' as const },
            { label: t('Bars'), value: 'bars' as const },
          ]}
          value={settings.challengeTriggerMode}
          onChange={(challengeTriggerMode) => updateSettings({ challengeTriggerMode })}
        />
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 12 }}>
          TRIGGER AFTER
        </Text>
        <SettingsChoiceRow
          testIDPrefix={settings.challengeTriggerMode === 'bars' ? 'setup.challenge.bars' : 'setup.challenge.misses'}
          options={settings.challengeTriggerMode === 'bars'
            ? [
                { label: t('Any wrong bar'), value: 1 as const },
                { label: t('2 consecutive bars'), value: 2 as const },
                { label: t('3 consecutive bars'), value: 3 as const },
                { label: t('5 consecutive bars'), value: 5 as const },
              ]
            : [
                { label: t('Any error'), value: 1 as const },
                { label: t('2 in a row'), value: 2 as const },
                { label: t('3 in a row'), value: 3 as const },
                { label: t('5 in a row'), value: 5 as const },
              ]}
          value={settings.challengeTriggerMode === 'bars'
            ? settings.challengeWrongBarStreak
            : settings.challengeMissStreak}
          onChange={(threshold) => updateSettings(settings.challengeTriggerMode === 'bars'
            ? { challengeWrongBarStreak: threshold }
            : { challengeMissStreak: threshold })}
        />
        <Text style={helperText}>
          {settings.challengeTriggerMode === 'bars'
            ? 'A bar counts as wrong when either hand misses or adds a tap. Consecutive bars are checked after each bar finishes; a clean bar resets the count.'
            : 'Any error reacts to an off-beat tap or missed note. Consecutive misses count separately for each hand; a correct note resets that hand’s streak.'}{' '}
          A pause can be resumed from the practice screen.
        </Text>
        {featureFlags.gameCenter ? <GameCenterChallengeCard testID="setup.challenge.gameCenter" /> : null}
      </Section> : null}
    </SettingsPage>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 28 }}>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.6, marginBottom: 14 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}
