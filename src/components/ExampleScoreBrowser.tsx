import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ScoreTemplateFilterChip } from '@/components/ScoreTemplateFilterChip';
import { filterScoreTemplates, SCORE_TEMPLATES, SCORE_TEMPLATE_CATEGORIES, SCORE_TEMPLATE_TAGS } from '@/rhythm/scoreTemplates';
import type { ScoreTemplateCategory, ScoreTemplateTag } from '@/rhythm/scoreTemplates';
import { useTheme } from '@/theme/ThemeProvider';
import { ExampleScoreBrowserStyle1,
  ExampleScoreBrowserStyle2,
  ExampleScoreBrowserStyle3,
  ExampleScoreBrowserStyle4,
  ExampleScoreBrowserStyle5,
  ExampleScoreBrowserStyle6,
  ExampleScoreBrowserStyle7,
  ExampleScoreBrowserStyle8,
  ExampleScoreBrowserStyle9,
  ExampleScoreBrowserStyle10,
  ExampleScoreBrowserStyle11,
  ExampleScoreBrowserStyle12,
  ExampleScoreBrowserStyle13,
  ExampleScoreBrowserStyle14,
  ExampleScoreBrowserStyle15,
  ExampleScoreBrowserStyle16,
  ExampleScoreBrowserStyle17,
  ExampleScoreBrowserStyle18,
  ExampleScoreBrowserStyle19,
  ExampleScoreBrowserStyle20,
  ExampleScoreBrowserStyle21, ExampleScoreBrowserStyle22, ExampleScoreBrowserStyle23 } from '@/styles/exercise';

export function ExampleScoreBrowser({
  category,
  tags,
  onCategoryChange,
  onTagToggle,
  onClearFilters,
  onSelectTemplate,
}: {
  category: ScoreTemplateCategory | 'All';
  tags: ScoreTemplateTag[];
  onCategoryChange: (category: ScoreTemplateCategory | 'All') => void;
  onTagToggle: (tag: ScoreTemplateTag) => void;
  onClearFilters: () => void;
  onSelectTemplate: (templateId: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const visibleTemplates = filterScoreTemplates(SCORE_TEMPLATES, { category, tags });
  const templateCardBasis = width >= 650 ? '48%' : '100%';
  const hasFilters = category !== 'All' || tags.length > 0;

  return (
    <View style={ExampleScoreBrowserStyle1()}>
      <View style={ExampleScoreBrowserStyle2()}>
        <Text style={ExampleScoreBrowserStyle3({ colors })}>EXAMPLE SCORES</Text>
        <Text testID="scoreImport.exampleCount" style={ExampleScoreBrowserStyle4({ colors })}>{t('{count} example scores', { count: visibleTemplates.length })}</Text>
      </View>
      <Text style={ExampleScoreBrowserStyle5({ colors })}>Choose a style, level, or hand setup.</Text>
      <View style={ExampleScoreBrowserStyle6()}>
        <Text style={ExampleScoreBrowserStyle7({ colors })}>CATEGORY</Text>
        {hasFilters ? (
          <Pressable testID="scoreImport.filters.clear" accessibilityRole="button" onPress={onClearFilters} hitSlop={6} style={ExampleScoreBrowserStyle8()}>
            <Text style={ExampleScoreBrowserStyle9({ colors })}>CLEAR FILTERS</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ExampleScoreBrowserStyle22()}>
        {(['All', ...SCORE_TEMPLATE_CATEGORIES] as const).map((item) => (
          <ScoreTemplateFilterChip
            key={item}
            testID={`scoreImport.category.${scoreFilterTestId(item)}`}
            label={t(item)}
            accessibilityLabel={t('Filter scores by {value}', { value: t(item) })}
            selected={category === item}
            onPress={() => onCategoryChange(item)}
          />
        ))}
      </ScrollView>
      <Text style={ExampleScoreBrowserStyle10({ colors })}>TAGS · COMBINE ANY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ExampleScoreBrowserStyle23()}>
        {SCORE_TEMPLATE_TAGS.map((tag) => (
          <ScoreTemplateFilterChip
            key={tag}
            testID={`scoreImport.tag.${scoreFilterTestId(tag)}`}
            label={t(tag)}
            accessibilityLabel={t('Filter scores by {value}', { value: t(tag) })}
            selected={tags.includes(tag)}
            onPress={() => onTagToggle(tag)}
          />
        ))}
      </ScrollView>
      {visibleTemplates.length === 0 ? (
        <View style={ExampleScoreBrowserStyle11({ colors })}>
          <Text style={ExampleScoreBrowserStyle12({ colors })}>No example scores match these filters.</Text>
        </View>
      ) : (
        <View testID="scoreImport.template.list" style={ExampleScoreBrowserStyle13()}>
          {visibleTemplates.map((template) => (
            <Pressable
              key={template.id}
              testID={`scoreImport.template.${template.id}`}
              accessibilityRole="button"
              accessibilityLabel={t('Open {title}, {category}, {tags}', { title: template.title, category: t(template.category), tags: template.tags.map((tag) => t(tag)).join(', ') })}
              onPress={() => onSelectTemplate(template.id)}
              style={({ pressed }) => (ExampleScoreBrowserStyle14({ templateCardBasis, pressed, colors }))}
            >
              <View style={ExampleScoreBrowserStyle15()}>
                <Text raw numberOfLines={1} style={ExampleScoreBrowserStyle16({ colors })}>{template.title}</Text>
                <Text raw style={ExampleScoreBrowserStyle17({ colors })}>{t(template.category).toUpperCase()}</Text>
              </View>
              <Text style={ExampleScoreBrowserStyle18({ colors })} numberOfLines={1}>{template.subtitle}</Text>
              <View style={ExampleScoreBrowserStyle19()}>
                {template.tags.map((tag) => (
                  <View key={tag} style={ExampleScoreBrowserStyle20({ colors })}>
                    <Text style={ExampleScoreBrowserStyle21({ colors })}>{t(tag)}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function scoreFilterTestId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
