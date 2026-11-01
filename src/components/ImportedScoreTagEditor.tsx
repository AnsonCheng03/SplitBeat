import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import {
  MAX_IMPORTED_SCORE_TAG_LENGTH,
  type AddImportedScoreUserTagResult,
} from '@/rhythm/importedScoreLibrary';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ImportedScoreCategoryStyle8,
  ImportedScoreCategoryStyle9,
  ImportedScoreCategoryStyle10,
  ImportedScoreCategoryStyle11,
  ImportedScoreCategoryStyle12,
  ImportedScoreCategoryStyle13,
  ImportedScoreCategoryStyle14,
  ImportedScoreCategoryStyle15,
} from '@/styles/exercise';

export function ImportedScoreTagEditor({
  entryId,
  tags,
  onAddTag,
  onRemoveTag,
}: {
  entryId: string;
  tags: readonly string[];
  onAddTag: (entryId: string, tag: string) => AddImportedScoreUserTagResult;
  onRemoveTag: (entryId: string, tag: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [tagDraft, setTagDraft] = useState('');
  const [tagMessage, setTagMessage] = useState('');

  const addTag = () => {
    const result = onAddTag(entryId, tagDraft);
    if (result === 'added') {
      setTagDraft('');
      setTagMessage('');
      return;
    }
    setTagMessage(tagMessageForResult(result));
  };

  return (
    <>
      <Text style={ImportedScoreCategoryStyle9({ colors })}>{t('YOUR TAGS')}</Text>
      <View style={ImportedScoreCategoryStyle10()}>
        {tags.map((tag, index) => (
          <Pressable
            key={`${tag}-${index}`}
            testID={`scoreImport.imported.userTag.${entryId}.${index}`}
            accessibilityRole="button"
            accessibilityLabel={t('Remove tag {tag}', { tag })}
            onPress={() => onRemoveTag(entryId, tag)}
            style={ImportedScoreCategoryStyle11({ colors, system: false })}
          >
            <Text style={ImportedScoreCategoryStyle12({ colors, system: false })}>{tag} ×</Text>
          </Pressable>
        ))}
      </View>

      <View style={ImportedScoreCategoryStyle13()}>
        <TextInput
          testID={`scoreImport.imported.tagInput.${entryId}`}
          accessibilityLabel={t('Add a custom tag')}
          value={tagDraft}
          onChangeText={(value) => {
            setTagDraft(value);
            setTagMessage('');
          }}
          onSubmitEditing={addTag}
          maxLength={MAX_IMPORTED_SCORE_TAG_LENGTH}
          returnKeyType="done"
          placeholder={t('Add a tag')}
          placeholderTextColor={colors.dim}
          style={ImportedScoreCategoryStyle14({ colors })}
        />
        <Pressable
          testID={`scoreImport.imported.addTag.${entryId}`}
          accessibilityRole="button"
          accessibilityLabel={t('Add tag')}
          onPress={addTag}
          style={ImportedScoreCategoryStyle15({ colors })}
        >
          <Text style={ImportedScoreCategoryStyle8({ colors })}>{t('ADD')}</Text>
        </Pressable>
      </View>
      {tagMessage ? <Text style={ImportedScoreCategoryStyle9({ colors })}>{t(tagMessage, { count: MAX_IMPORTED_SCORE_TAG_LENGTH })}</Text> : null}
    </>
  );
}

function tagMessageForResult(result: AddImportedScoreUserTagResult): string {
  switch (result) {
    case 'duplicate': return 'This tag is already on this score.';
    case 'protected': return 'Built-in tags are protected. Choose a custom tag.';
    case 'empty': return 'Enter a tag first.';
    case 'too-long': return 'Tags can have up to {count} characters.';
    case 'limit': return 'A score can have up to 12 custom tags.';
    case 'missing-score': return 'Only imported scores can have custom tags.';
    case 'added': return '';
  }
}
