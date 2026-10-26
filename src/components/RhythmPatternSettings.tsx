import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SettingsSection } from '@/components/SettingsSection';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { mixtureNoteOptionsForBar } from '@/rhythm/mixtures';
import { barDurationQuarterNotes } from '@/rhythm/targetedPractice';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { useTheme } from '@/theme/ThemeProvider';
import { BASIC_SUBDIVISIONS } from '@/features/featureFlags';
import { SUBDIVISIONS } from '@/types/rhythm';
import type { ExerciseSettings, MixtureNoteValue, Subdivision } from '@/types/rhythm';
import type { FeatureFlags } from '@/features/featureFlags';
import {
  RhythmPatternSettingsStyle1,
  RhythmPatternSettingsStyle2,
  RhythmPatternSettingsStyle3,
  RhythmPatternSettingsStyle4,
  RhythmPatternSettingsStyle5,
  RhythmPatternSettingsStyle6,
  rhythmSettingsHelperTextStyle
} from '@/styles/settings';

export function RhythmPatternSettings({
  settings,
  featureFlags,
  onSettingsChange,
}: {
  settings: ExerciseSettings;
  featureFlags: FeatureFlags;
  onSettingsChange: (patch: Partial<ExerciseSettings>) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const helperText = rhythmSettingsHelperTextStyle(colors);
  const visibleSubdivisions = featureFlags.rhythmExtensions
    ? SUBDIVISIONS
    : SUBDIVISIONS.filter((subdivision) => BASIC_SUBDIVISIONS.includes(subdivision as (typeof BASIC_SUBDIVISIONS)[number]));
  const selectableSubdivisions = visibleSubdivisions.filter((subdivision) => featureFlags.sixtyFourthNotes || subdivision !== 'sixtyFourth');
  const toggleSubdivision = (subdivision: Subdivision) => {
    const enabled = settings.enabledSubdivisions.includes(subdivision);
    if (enabled && settings.enabledSubdivisions.length <= 2) return;
    onSettingsChange({ enabledSubdivisions: enabled
      ? settings.enabledSubdivisions.filter((item) => item !== subdivision)
      : [...settings.enabledSubdivisions, subdivision] });
  };
  const toggleMixtureNoteValue = (noteValue: MixtureNoteValue) => {
    const noteValues = settings.mixtureNoteValues ?? [];
    onSettingsChange({ mixtureNoteValues: noteValues.includes(noteValue)
      ? noteValues.filter((item) => item !== noteValue)
      : [...noteValues, noteValue] });
  };

  return (
    <>
      <SettingsSection title="ALLOWED SUBDIVISIONS">
        <View style={RhythmPatternSettingsStyle1()}>
          {selectableSubdivisions.map((subdivision) => {
            const selected = settings.enabledSubdivisions.includes(subdivision);
            const cannotRemove = selected && settings.enabledSubdivisions.length <= 2;
            return (
              <Pressable
                key={subdivision}
                testID={'setup.subdivision.' + subdivision}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled: cannotRemove }}
                onPress={() => toggleSubdivision(subdivision)}
                style={RhythmPatternSettingsStyle2({ selected, colors, cannotRemove })}
              >
                <Text style={RhythmPatternSettingsStyle3({ selected, colors })}>{SUBDIVISION_LABELS[subdivision]}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={helperText}>Tuplets divide one metronome beat evenly. The beat length follows your time signature. Keep at least two patterns enabled.</Text>
      </SettingsSection>

      {featureFlags.mixtures ? (
        <SettingsSection title="MIXTURE">
          <Text style={helperText}>Choose note values that Split Beat may combine for either hand. It generates a fresh pattern for each change and keeps the pattern within one bar.</Text>
          <View style={RhythmPatternSettingsStyle4()}>
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
                  style={RhythmPatternSettingsStyle5({ selected, colors })}
                >
                  <Text style={RhythmPatternSettingsStyle6({ selected, colors })}>{t(option.label)}</Text>
                </Pressable>
              );
            })}
          </View>
          <SettingsToggleRow testID="setup.mixture.includeRests" label="Include rests" description="Rests may be mixed with the selected note values." value={settings.mixtureRestsEnabled === true} onChange={(mixtureRestsEnabled) => onSettingsChange({ mixtureRestsEnabled })} />
          <Text style={helperText}>Select two or more note values, or one value with rests enabled. Longer values than the current bar are not offered.</Text>
        </SettingsSection>
      ) : null}

      {featureFlags.restsAndGrace ? (
        <SettingsSection title="EXTRA">
          <SettingsToggleRow testID="setup.toggle.graceNotes" label="Grace note pickups" value={settings.graceNotesEnabled} onChange={(graceNotesEnabled) => onSettingsChange({ graceNotesEnabled })} />
          <Text style={helperText}>Adds one pickup note from each hand just before a pattern change.</Text>
          <SettingsToggleRow testID="setup.toggle.restBetweenChanges" label="Rest before each change" value={settings.restBetweenChanges} onChange={(restBetweenChanges) => onSettingsChange({ restBetweenChanges })} />
          <Text style={helperText}>Both hands pause for the last beat before a new pattern. The metronome keeps going; this pause replaces grace pickups.</Text>
          <SettingsToggleRow testID="setup.toggle.handRests" label="Independent hand rests" value={settings.handRestsEnabled} onChange={(handRestsEnabled) => onSettingsChange({ handRestsEnabled })} />
          <Text style={helperText}>Occasionally one hand rests while the other keeps playing. Available in generated two-hand practice.</Text>
        </SettingsSection>
      ) : null}
    </>
  );
}
