import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { ChoiceChip } from '@/components/ExercisePatternPicker';
import { SessionEndSettings } from '@/components/SessionEndSettings';
import { useTheme } from '@/theme/ThemeProvider';
import type { DurationOption, SessionEndBarCount, SessionEndMode } from '@/types/rhythm';
import type { ExerciseTab } from '@/features/exercise/exerciseTypes';
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
  ExerciseHeaderStyle14
} from '@/styles/exercise';

export function ExerciseHeader({
  progressCount,
  activeTab,
  sessionEndMode,
  sessionEndBars,
  duration,
  onHome,
  onTabChange,
  onSessionEndModeChange,
  onSessionEndBarsChange,
  onDurationChange,
}: {
  progressCount: number;
  activeTab: ExerciseTab;
  sessionEndMode: SessionEndMode;
  sessionEndBars: SessionEndBarCount;
  duration: DurationOption;
  onHome: () => void;
  onTabChange: (tab: ExerciseTab) => void;
  onSessionEndModeChange: (mode: SessionEndMode) => void;
  onSessionEndBarsChange: (bars: SessionEndBarCount) => void;
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
          <SessionEndSettings
            mode={sessionEndMode}
            duration={duration}
            bars={sessionEndBars}
            onModeChange={onSessionEndModeChange}
            onDurationChange={onDurationChange}
            onBarsChange={onSessionEndBarsChange}
            testIDPrefix="exercise.duration"
          />
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
