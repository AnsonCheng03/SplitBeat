import { RhythmMeterSettings } from '@/components/RhythmMeterSettings';
import { RhythmPatternSettings } from '@/components/RhythmPatternSettings';
import type { ExerciseSettings } from '@/types/rhythm';
import type { FeatureFlags } from '@/features/featureFlags';

export function RhythmSettingsOptions({
  settings,
  featureFlags,
  onSettingsChange,
}: {
  settings: ExerciseSettings;
  featureFlags: FeatureFlags;
  onSettingsChange: (patch: Partial<ExerciseSettings>) => void;
}) {
  return (
    <>
      <RhythmMeterSettings settings={settings} featureFlags={featureFlags} onSettingsChange={onSettingsChange} />
      <RhythmPatternSettings settings={settings} featureFlags={featureFlags} onSettingsChange={onSettingsChange} />
    </>
  );
}
