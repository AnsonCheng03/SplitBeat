import type { ImportedScoreSource } from '@/rhythm/importedScoreLibrary';

export function importedScoreAutoPlayEnabled({
  source,
  midiAutoPlay,
  savedAutoPlay,
  featureEnabled,
}: {
  source: ImportedScoreSource;
  midiAutoPlay: boolean;
  savedAutoPlay: boolean;
  featureEnabled: boolean;
}): boolean {
  if (!featureEnabled) return false;
  return source === 'midi' ? midiAutoPlay : savedAutoPlay;
}
