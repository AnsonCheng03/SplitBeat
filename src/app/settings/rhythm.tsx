import { SettingsPage } from '@/components/SettingsPage';
import { RhythmSettingsOptions } from '@/components/RhythmSettingsOptions';
import { useRhythmSession } from '@/store/sessionStore';

export default function RhythmSettingsScreen() {
  const { settings, featureFlags, updateSettings } = useRhythmSession();
  return (
    <SettingsPage
      testID="settings.rhythm.screen"
      backTestID="settings.rhythm.back"
      section="rhythm"
      title="Rhythm & meter"
      description="Choose the pulse and rhythms for your session."
    >
      <RhythmSettingsOptions
        settings={settings}
        featureFlags={featureFlags}
        onSettingsChange={updateSettings}
      />
    </SettingsPage>
  );
}
