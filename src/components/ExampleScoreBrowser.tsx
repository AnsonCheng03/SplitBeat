import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ScoreTemplateFilterChip } from '@/components/ScoreTemplateFilterChip';
import { filterScoreTemplates, SCORE_TEMPLATES, SCORE_TEMPLATE_CATEGORIES, SCORE_TEMPLATE_TAGS } from '@/rhythm/scoreTemplates';
import type { ScoreTemplateCategory, ScoreTemplateTag } from '@/rhythm/scoreTemplates';
import { useTheme } from '@/theme/ThemeProvider';

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
    <View style={{ marginTop: 13 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 }}>EXAMPLE SCORES</Text>
        <Text testID="scoreImport.exampleCount" style={{ color: colors.dim, fontSize: 10 }}>{t('{count} example scores', { count: visibleTemplates.length })}</Text>
      </View>
      <Text style={{ color: colors.dim, fontSize: 11, marginBottom: 8 }}>Choose a style, level, or hand setup.</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5 }}>CATEGORY</Text>
        {hasFilters ? (
          <Pressable testID="scoreImport.filters.clear" accessibilityRole="button" onPress={onClearFilters} hitSlop={6} style={{ minHeight: 30, justifyContent: 'center', paddingHorizontal: 4 }}>
            <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900' }}>CLEAR FILTERS</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 8 }}>
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
      <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5 }}>TAGS · COMBINE ANY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 9 }}>
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
        <View style={{ minHeight: 72, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
          <Text style={{ color: colors.dim, fontSize: 11, textAlign: 'center' }}>No example scores match these filters.</Text>
        </View>
      ) : (
        <View testID="scoreImport.template.list" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {visibleTemplates.map((template) => (
            <Pressable
              key={template.id}
              testID={`scoreImport.template.${template.id}`}
              accessibilityRole="button"
              accessibilityLabel={t('Open {title}, {category}, {tags}', { title: template.title, category: t(template.category), tags: template.tags.map((tag) => t(tag)).join(', ') })}
              onPress={() => onSelectTemplate(template.id)}
              style={({ pressed }) => ({ flexGrow: 1, flexBasis: templateCardBasis, maxWidth: templateCardBasis, minHeight: 96, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Text raw numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 12, fontWeight: '900' }}>{template.title}</Text>
                <Text raw style={{ color: colors.accent, fontSize: 9, fontWeight: '900' }}>{t(template.category).toUpperCase()}</Text>
              </View>
              <Text style={{ color: colors.dim, fontSize: 10, marginTop: 4 }} numberOfLines={1}>{template.subtitle}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                {template.tags.map((tag) => (
                  <View key={tag} style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.background }}>
                    <Text style={{ color: colors.muted, fontSize: 8, fontWeight: '800' }}>{t(tag)}</Text>
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
