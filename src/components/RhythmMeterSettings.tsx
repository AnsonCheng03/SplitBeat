import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsSection } from '@/components/SettingsSection';
import { mixtureNoteOptionsForBar } from '@/rhythm/mixtures';
import { alignedPatternChangeIntervalBeats } from '@/rhythm/patternChange';
import { barDurationQuarterNotes } from '@/rhythm/targetedPractice';
import { timeSignatureMetrics } from '@/rhythm/subdivisions';
import { useTheme } from '@/theme/ThemeProvider';
import { TIME_SIGNATURES } from '@/types/rhythm';
import type { ExerciseSettings, TimeSignature } from '@/types/rhythm';
import type { FeatureFlags } from '@/features/featureFlags';
import { RhythmMeterSettingsStyle1, RhythmMeterSettingsStyle2, RhythmMeterSettingsStyle3, rhythmSettingsHelperTextStyle } from '@/styles/settings';

const intervals: { label: string; value: ExerciseSettings['changeIntervalBeats'] }[] = [
  { label: '8 beats', value: 8 }, { label: '4 beats', value: 4 }, { label: '2 beats', value: 2 }, { label: '1 beat', value: 1 },
];

export function RhythmMeterSettings({
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
  const beatsPerBar = timeSignatureMetrics(settings.bpm, settings.timeSignature).beatsPerBar;
  const effectiveChangeIntervalBeats = alignedPatternChangeIntervalBeats(settings.changeIntervalBeats, beatsPerBar);
  const visibleTimeSignatures = featureFlags.rhythmExtensions
    ? TIME_SIGNATURES
    : TIME_SIGNATURES.filter((signature) => ['2/4', '3/4', '4/4', '5/4', '7/4', '2/2', '3/8'].includes(signature));

  const updateTimeSignature = (timeSignature: TimeSignature) => {
    const barLength = barDurationQuarterNotes(timeSignature);
    const mixtureNoteValues = (settings.mixtureNoteValues ?? []).filter((value) =>
      mixtureNoteOptionsForBar(barLength, featureFlags.sixtyFourthNotes).some((option) => option.value === value),
    );
    onSettingsChange({ timeSignature, mixtureNoteValues });
  };

  return (
    <>
      <SettingsSection title="TIME SIGNATURE">
        <View style={RhythmMeterSettingsStyle1()}>
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
                style={RhythmMeterSettingsStyle2({ selected, colors })}
              >
                <Text style={RhythmMeterSettingsStyle3({ selected, colors })}>{timeSignature}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={helperText}>BPM follows the main pulse. In 6/8, 9/8, and 12/8 it counts dotted-quarter pulses; the display counts each eighth-note beat.</Text>
      </SettingsSection>

      <SettingsSection title="CHANGE PATTERN">
        <SettingsChoiceRow
          options={intervals}
          value={settings.changeIntervalBeats}
          onChange={(changeIntervalBeats) => onSettingsChange({ changeIntervalBeats })}
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
      </SettingsSection>

      {featureFlags.rhythmExtensions ? (
        <SettingsSection title="FEEL">
          <SettingsChoiceRow
            testIDPrefix="setup.feel"
            options={[{ label: 'Straight', value: 'straight' as const }, { label: 'Swing', value: 'swing' as const }]}
            value={settings.feel}
            onChange={(feel) => onSettingsChange({ feel })}
          />
          <Text style={helperText}>Swing stretches binary offbeats to a 2:1 feel. Tuplets keep their even spacing.</Text>
        </SettingsSection>
      ) : null}
    </>
  );
}
