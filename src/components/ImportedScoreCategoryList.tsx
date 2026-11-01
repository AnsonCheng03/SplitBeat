import { View, useWindowDimensions } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ImportedScoreCategoryCard } from '@/components/ImportedScoreCategoryCard';
import type { AddImportedScoreUserTagResult, ImportedScoreLibraryEntry } from '@/rhythm/importedScoreLibrary';
import { useTheme } from '@/theme/ThemeProvider';
import { ImportedScoreCategoryStyle1, ImportedScoreCategoryStyle2, ImportedScoreCategoryStyle3 } from '@/styles/exercise';

export function ImportedScoreCategoryList({
  entries,
  loaded,
  onOpen,
  onAddTag,
  onRemoveTag,
}: {
  entries: readonly ImportedScoreLibraryEntry[];
  loaded: boolean;
  onOpen: (entry: ImportedScoreLibraryEntry) => void;
  onAddTag: (entryId: string, tag: string) => AddImportedScoreUserTagResult;
  onRemoveTag: (entryId: string, tag: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const cardBasis = width >= 650 ? '48%' : '100%';

  if (!loaded) {
    return (
      <View style={ImportedScoreCategoryStyle1({ colors })}>
        <Text style={ImportedScoreCategoryStyle2({ colors })}>{t('Loading your imported scores…')}</Text>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={ImportedScoreCategoryStyle1({ colors })}>
        <Text style={ImportedScoreCategoryStyle2({ colors })}>{t('No imported scores yet. Import a MIDI or MusicXML file to see it here.')}</Text>
      </View>
    );
  }

  return (
    <View testID="scoreImport.imported.list" style={ImportedScoreCategoryStyle3()}>
      {entries.map((entry) => (
        <ImportedScoreCategoryCard
          key={entry.id}
          entry={entry}
          cardBasis={cardBasis}
          onOpen={onOpen}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
        />
      ))}
    </View>
  );
}
