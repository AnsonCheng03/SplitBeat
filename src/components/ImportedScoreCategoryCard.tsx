import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ImportedScoreTagEditor } from '@/components/ImportedScoreTagEditor';
import {
  getImportedScoreSystemTags,
  type AddImportedScoreUserTagResult,
  type ImportedScoreLibraryEntry,
} from '@/rhythm/importedScoreLibrary';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ImportedScoreCategoryStyle4,
  ImportedScoreCategoryStyle5,
  ImportedScoreCategoryStyle6,
  ImportedScoreCategoryStyle7,
  ImportedScoreCategoryStyle8,
  ImportedScoreCategoryStyle9,
  ImportedScoreCategoryStyle10,
  ImportedScoreCategoryStyle11,
  ImportedScoreCategoryStyle12,
} from '@/styles/exercise';

export function ImportedScoreCategoryCard({
  entry,
  cardBasis,
  onOpen,
  onAddTag,
  onRemoveTag,
}: {
  entry: ImportedScoreLibraryEntry;
  cardBasis: '48%' | '100%';
  onOpen: (entry: ImportedScoreLibraryEntry) => void;
  onAddTag: (entryId: string, tag: string) => AddImportedScoreUserTagResult;
  onRemoveTag: (entryId: string, tag: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const systemTags = getImportedScoreSystemTags(entry);
  const scoreDetails = t('{meter} · {count} bars', {
    meter: entry.score.timeSignature,
    count: entry.score.measures.length,
  });

  return (
    <View testID={`scoreImport.imported.entry.${entry.id}`} style={ImportedScoreCategoryStyle4({ cardBasis, colors })}>
      <Pressable
        testID={`scoreImport.imported.open.${entry.id}`}
        accessibilityRole="button"
        accessibilityLabel={t('Open imported score {title}', { title: entry.score.title })}
        onPress={() => onOpen(entry)}
        style={ImportedScoreCategoryStyle5()}
      >
        <View style={ImportedScoreCategoryStyle6()}>
          <Text raw numberOfLines={1} style={ImportedScoreCategoryStyle7({ colors })}>{entry.score.title}</Text>
          <Text style={ImportedScoreCategoryStyle8({ colors })}>{t('OPEN SCORE')}</Text>
        </View>
        <Text raw numberOfLines={1} style={ImportedScoreCategoryStyle9({ colors })}>{scoreDetails} · {entry.fileName}</Text>
      </Pressable>

      <Text style={ImportedScoreCategoryStyle9({ colors })}>{t('SYSTEM TAGS')}</Text>
      <View style={ImportedScoreCategoryStyle10()}>
        {systemTags.map((tag) => (
          <View
            key={tag}
            testID={`scoreImport.imported.systemTag.${entry.id}.${tag.toLowerCase().replaceAll(' ', '-')}`}
            style={ImportedScoreCategoryStyle11({ colors, system: true })}
          >
            <Text style={ImportedScoreCategoryStyle12({ colors, system: true })}>{t(tag)}</Text>
          </View>
        ))}
      </View>

      <ImportedScoreTagEditor
        entryId={entry.id}
        tags={entry.userTags ?? []}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
      />
    </View>
  );
}
