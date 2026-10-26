import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { GameCenterChallengeCard } from '@/components/GameCenterChallengeCard';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsSection } from '@/components/SettingsSection';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExerciseSettings } from '@/types/rhythm';
import type { FeatureFlags } from '@/features/featureFlags';

export function RhythmChallengeSettings({
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
  if (!featureFlags.challengeMode) return null;
  return (
    <SettingsSection title="CHALLENGE">
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 12 }}>WHEN A MISTAKE HAPPENS</Text>
      <SettingsChoiceRow
        testIDPrefix="setup.challenge.action"
        options={[{ label: 'Off', value: 'off' as const }, { label: 'Pause', value: 'pause' as const }, { label: 'End session', value: 'stop' as const }]}
        value={settings.challengeAction}
        onChange={(challengeAction) => onSettingsChange({ challengeAction })}
      />
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 12 }}>COUNT ERRORS BY</Text>
      <SettingsChoiceRow
        testIDPrefix="setup.challenge.triggerMode"
        options={[{ label: t('Notes'), value: 'notes' as const }, { label: t('Bars'), value: 'bars' as const }]}
        value={settings.challengeTriggerMode}
        onChange={(challengeTriggerMode) => onSettingsChange({ challengeTriggerMode })}
      />
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 12 }}>TRIGGER AFTER</Text>
      <SettingsChoiceRow
        testIDPrefix={settings.challengeTriggerMode === 'bars' ? 'setup.challenge.bars' : 'setup.challenge.misses'}
        options={settings.challengeTriggerMode === 'bars'
          ? [{ label: t('Any wrong bar'), value: 1 as const }, { label: t('2 consecutive bars'), value: 2 as const }, { label: t('3 consecutive bars'), value: 3 as const }, { label: t('5 consecutive bars'), value: 5 as const }]
          : [{ label: t('Any error'), value: 1 as const }, { label: t('2 in a row'), value: 2 as const }, { label: t('3 in a row'), value: 3 as const }, { label: t('5 in a row'), value: 5 as const }]}
        value={settings.challengeTriggerMode === 'bars' ? settings.challengeWrongBarStreak : settings.challengeMissStreak}
        onChange={(threshold) => onSettingsChange(settings.challengeTriggerMode === 'bars'
          ? { challengeWrongBarStreak: threshold }
          : { challengeMissStreak: threshold })}
      />
      <Text style={{ color: colors.dim, fontSize: 12, lineHeight: 17, marginTop: 8 }}>
        {settings.challengeTriggerMode === 'bars'
          ? 'A bar counts as wrong when either hand misses or adds a tap. Consecutive bars are checked after each bar finishes; a clean bar resets the count.'
          : 'Any error reacts to an off-beat tap or missed note. Consecutive misses count separately for each hand; a correct note resets that hand’s streak.'}{' '}
        A pause can be resumed from the practice screen.
      </Text>
      {featureFlags.gameCenter ? <GameCenterChallengeCard testID="setup.challenge.gameCenter" /> : null}
    </SettingsSection>
  );
}
