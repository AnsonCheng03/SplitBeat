import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ChoiceChip } from '@/components/ExercisePatternPicker';
import { useTheme } from '@/theme/ThemeProvider';
import type { DurationOption } from '@/types/rhythm';
import {
  ExerciseHeaderStyle1,
  ExerciseHeaderStyle2,
  ExerciseHeaderStyle3,
  ExerciseHeaderStyle4,
  ExerciseHeaderStyle5,
  ExerciseHeaderStyle6,
  ExerciseHeaderStyle7,
  ExerciseHeaderStyle8,
  ExerciseHeaderStyle9,
  ExerciseHeaderStyle10,
  ExerciseHeaderStyle11,
  ExerciseHeaderStyle12,
  ExerciseHeaderStyle13,
  ExerciseHeaderStyle14
} from '@/styles/exercise';

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
      <View style={ExerciseHeaderStyle1()}>
        <Pressable testID="exercise.home" accessibilityRole="button" onPress={onHome} hitSlop={10} style={ExerciseHeaderStyle2()}>
          <Text style={ExerciseHeaderStyle3({ colors })}>‹  HOME</Text>
        </Pressable>
        <Text style={ExerciseHeaderStyle4({ colors })}>FOCUSED PRACTICE</Text>
      </View>
      <View style={ExerciseHeaderStyle5()}>
        <View style={ExerciseHeaderStyle6()}>
          <Text style={ExerciseHeaderStyle7({ colors })}>Practice a rhythm.</Text>
          <Text style={ExerciseHeaderStyle8({ colors })}>{t('Review combinations you miss, choose your own pair, or compose a score.')}</Text>
        </View>
        <View style={ExerciseHeaderStyle9({ colors })}>
          <Text style={ExerciseHeaderStyle10({ colors })}>{progressCount} SAVED PAIRS</Text>
        </View>
      </View>
      {activeTab !== 'bar' ? (
        <View testID="exercise.duration" style={ExerciseHeaderStyle11()}>
          <Text style={ExerciseHeaderStyle12({ colors })}>{t('SESSION LENGTH')}</Text>
          <View style={ExerciseHeaderStyle13()}>
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
      <View style={ExerciseHeaderStyle14()}>
        <ChoiceChip testID="exercise.tab.review" label="Review pairs" selected={activeTab === 'review'} onPress={() => onTabChange('review')} />
        <ChoiceChip testID="exercise.tab.later" label={t('Saved later')} selected={activeTab === 'later'} onPress={() => onTabChange('later')} />
        <ChoiceChip testID="exercise.tab.pair" label="Choose a pair" selected={activeTab === 'pair'} onPress={() => onTabChange('pair')} />
        <ChoiceChip testID="exercise.tab.bar" label={t('Compose a score')} selected={activeTab === 'bar'} onPress={() => onTabChange('bar')} />
      </View>
    </>
  );
}
