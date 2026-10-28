import { RhythmChallengeSettings } from '@/components/RhythmChallengeSettings';
import { SettingsPage } from '@/components/SettingsPage';
import { useRhythmSession } from '@/store/sessionStore';

export default function ChallengeSettingsScreen() {
  const { settings, featureFlags, updateSettings } = useRhythmSession();

  return (
    <SettingsPage
      testID="settings.challenges.screen"
      backTestID="settings.challenges.back"
      section="challenges"
      title="Challenges"
      description="Choose how mistakes affect practice."
    >
      {featureFlags.challengeMode ? (
        <RhythmChallengeSettings
          settings={settings}
          featureFlags={featureFlags}
          onSettingsChange={updateSettings}
        />
      ) : null}
    </SettingsPage>
  );
}
