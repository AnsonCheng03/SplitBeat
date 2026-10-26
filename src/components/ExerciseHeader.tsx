import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ChoiceChip } from '@/components/ExercisePatternPicker';
import { useTheme } from '@/theme/ThemeProvider';
import type { DurationOption } from '@/types/rhythm';

export type ExerciseTab = 'review' | 'later' | 'pair' | 'bar';
export interface ExerciseDurationOption {
  label: string;
  value: DurationOption;
}

export function ExerciseHeader({
  progressCount,
  activeTab,
  duration,
  durations,
  onHome,
  onTabChange,
  onDurationChange,
}: {
  progressCount: number;
  activeTab: ExerciseTab;
  duration: DurationOption;
  durations: ExerciseDurationOption[];
  onHome: () => void;
  onTabChange: (tab: ExerciseTab) => void;
  onDurationChange: (duration: DurationOption) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Pressable testID="exercise.home" accessibilityRole="button" onPress={onHome} hitSlop={10} style={{ paddingVertical: 8, paddingRight: 14 }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>‹  HOME</Text>
        </Pressable>
        <Text style={{ color: colors.dim, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }}>FOCUSED PRACTICE</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 18 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.7 }}>Practice a rhythm.</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 5 }}>{t('Review combinations you miss, choose your own pair, or compose a score.')}</Text>
        </View>
        <View style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
          <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>{progressCount} SAVED PAIRS</Text>
        </View>
      </View>
      {activeTab !== 'bar' ? (
        <View testID="exercise.duration" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }}>{t('SESSION LENGTH')}</Text>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {durations.map((option) => (
              <ChoiceChip
                key={option.value}
                testID={`exercise.duration.${option.value}`}
                label={t(option.label)}
                selected={duration === option.value}
                onPress={() => onDurationChange(option.value)}
              />
            ))}
          </View>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 17 }}>
        <ChoiceChip testID="exercise.tab.review" label="Review pairs" selected={activeTab === 'review'} onPress={() => onTabChange('review')} />
        <ChoiceChip testID="exercise.tab.later" label={t('Saved later')} selected={activeTab === 'later'} onPress={() => onTabChange('later')} />
        <ChoiceChip testID="exercise.tab.pair" label="Choose a pair" selected={activeTab === 'pair'} onPress={() => onTabChange('pair')} />
        <ChoiceChip testID="exercise.tab.bar" label={t('Compose a score')} selected={activeTab === 'bar'} onPress={() => onTabChange('bar')} />
      </View>
    </>
  );
}
